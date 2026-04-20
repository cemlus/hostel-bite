import { asyncHandler } from '../utils/asyncHandler.js';
import { Product } from '../models/product.model.js';
import { Order } from '../models/order.model.js';
import { Notification } from '../models/notification.model.js';
import { ApiError } from '../utils/ApiError.js';
import mongoose from 'mongoose';

export const placeOrder = asyncHandler(async (req, res) => {
    const { items, deliveryMode, room, paymentMethod } = req.body;
    if (!items || !Array.isArray(items) || items.length === 0) {
        throw new ApiError(400, 'Items required');
    }
    if (!['delivery', 'pickup'].includes(deliveryMode)) throw new ApiError(400, 'Invalid deliveryMode');

    // load products, check shops consistent
    const productIds = items.map((it) => it.productId);
    const products = await Product.find({ _id: { $in: productIds } }).lean();
    if (products.length !== items.length) throw new ApiError(400, 'Some products not found');

    // Ensure all products belong to same shop (MVP assumption). If not, reject.
    const shopIds = [...new Set(products.map((p) => p.shop.toString()))];
    if (shopIds.length !== 1) throw new ApiError(400, 'All items must be from the same shop');

    const shopId = shopIds[0];

    // compute unit prices and check stock. We'll attempt to decrement stock atomically per product.
    const toDecrement = []; // { productId, qty }
    const orderItems = [];
    let total = 0;

    for (const it of items) {
        const p = products.find((x) => x._id.toString() === it.productId);
        if (!p) throw new ApiError(400, 'Product not found');
        if (p.stock < it.quantity) throw new ApiError(400, `Insufficient stock for ${p.name}`);
        orderItems.push({
            product: p._id,
            name: p.name,
            quantity: it.quantity,
            unitPrice: p.price
        });
        total += p.price * it.quantity;
        toDecrement.push({ productId: p._id, qty: it.quantity });
    }

    // attempt to decrement sequentially, track which succeeded
    const decremented = [];
    try {
        for (const d of toDecrement) {
            const updated = await Product.findOneAndUpdate(
                { _id: d.productId, stock: { $gte: d.qty } },
                { $inc: { stock: -d.qty } },
                { new: true }
            );
            if (!updated) {
                throw new ApiError(400, 'Stock insufficient during processing');
            }
            decremented.push({ productId: d.productId, qty: d.qty });
        }

        // create order doc
        const order = await Order.create({
            user: req.user._id,
            shop: shopId,
            items: orderItems,
            total,
            paymentMethod,
            deliveryMode,
            room,
            paymentStatus: paymentMethod === 'cod' ? 'pending' : 'pending' // MVP: payments handled outside
        });

        // create notifications
        // notify shop owner
        await Notification.create({
            user: req.user._id,
            title: 'Order placed',
            body: `Your order ${order._id} was placed.`,
            payload: { orderId: order._id }
        });

        // respond
        res.status(201).json({ data: { orderId: order._id, status: order.status, total } });
    } catch (err) {
        // rollback previously decremented stocks
        for (const d of decremented) {
            await Product.findByIdAndUpdate(d.productId, { $inc: { stock: d.qty } });
        }
        throw err; // handled by error middleware
    }
});

export const getOrder = asyncHandler(async (req, res) => {
    const order = await Order.findById(req.params.orderId).lean();
    if (!order) throw new ApiError(404, 'Order not found');
    // permission: buyer, shop owner, admin
    if (order.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
        // check shop owner
        const shop = await (await import('../models/shop.model.js')).Shop.findById(order.shop).lean();
        if (!shop) throw new ApiError(403, 'Not allowed');
        if (shop.owner.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            throw new ApiError(403, 'Not allowed');
        }
    }
    res.json({ data: order });
});

export const listMyOrders = asyncHandler(async (req, res) => {
    const { limit = '20', cursor, status } = req.query;
    const limitNum = Math.min(100, Math.max(1, parseInt(String(limit), 10) || 20));

    const q = { user: req.user._id };
    if (status) q.status = status;

    // cursor format: "<createdAtMs>_<objectId>"
    if (cursor) {
        const [createdAtMsRaw, idRaw] = String(cursor).split('_');
        const createdAtMs = Number(createdAtMsRaw);
        if (!Number.isNaN(createdAtMs) && mongoose.Types.ObjectId.isValid(idRaw)) {
            const createdAt = new Date(createdAtMs);
            q.$or = [
                { createdAt: { $lt: createdAt } },
                { createdAt, _id: { $lt: new mongoose.Types.ObjectId(idRaw) } }
            ];
        }
    }

    const orders = await Order.find(q)
        .sort({ createdAt: -1, _id: -1 })
        .limit(limitNum)
        .lean();

    const last = orders[orders.length - 1];
    const nextCursor = last ? `${new Date(last.createdAt).getTime()}_${last._id}` : null;

    res.json({ data: { items: orders, nextCursor } });
});

// owner listing orders for own shop
export const listShopOrders = asyncHandler(async (req, res) => {
    // find owner's shop(s)
    const ShopModel = (await import('../models/shop.model.js')).Shop;
    const shops = await ShopModel.find({ owner: req.user._id }).lean();
    const shopIds = shops.map(s => s._id);
    const { limit = '20', cursor, status } = req.query;
    const limitNum = Math.min(100, Math.max(1, parseInt(String(limit), 10) || 20));

    const q = { shop: { $in: shopIds } };
    if (status) q.status = status;

    if (cursor) {
        const [createdAtMsRaw, idRaw] = String(cursor).split('_');
        const createdAtMs = Number(createdAtMsRaw);
        if (!Number.isNaN(createdAtMs) && mongoose.Types.ObjectId.isValid(idRaw)) {
            const createdAt = new Date(createdAtMs);
            q.$or = [
                { createdAt: { $lt: createdAt } },
                { createdAt, _id: { $lt: new mongoose.Types.ObjectId(idRaw) } }
            ];
        }
    }

    const orders = await Order.find(q)
        .sort({ createdAt: -1, _id: -1 })
        .limit(limitNum)
        .lean();

    const last = orders[orders.length - 1];
    const nextCursor = last ? `${new Date(last.createdAt).getTime()}_${last._id}` : null;

    res.json({ data: { items: orders, nextCursor } });
});

export const updateOrderStatus = asyncHandler(async (req, res) => {
    const { orderId } = req.params;
    const { status } = req.body;
    const order = await Order.findById(orderId);
    if (!order) throw new ApiError(404, 'Order not found');

    // only shop owner or admin can update status
    const ShopModel = (await import('../models/shop.model.js')).Shop;
    const shop = await ShopModel.findById(order.shop);
    if (!shop) throw new ApiError(404, 'Shop not found');
    if (shop.owner.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
        throw new ApiError(403, 'Not allowed');
    }

    // basic validation of allowed statuses (MVP simple)
    const allowed = ['accepted', 'preparing', 'ready', 'out_for_delivery', 'delivered', 'cancelled'];
    if (!allowed.includes(status)) throw new ApiError(400, 'Invalid status');

    order.status = status;
    await order.save();

    // notify buyer
    await Notification.create({
        user: order.user,
        title: `Order ${status}`,
        body: `Your order ${order._id} is now ${status}`,
        payload: { orderId: order._id, status }
    });

    res.json({ data: order });
});

/**
 * GET /api/orders/shop/analytics
 * Query params: sinceDays (default 7), topN (default 10)
 *
 * Uses aggregation ($facet, $unwind, $group, $lookup) to compute:
 * - ordersByStatus
 * - revenue & order counts (overall + today)
 * - topProducts by revenue/qty
 */
export const shopAnalytics = asyncHandler(async (req, res) => {
    const sinceDays = Math.min(365, Math.max(1, parseInt(String(req.query.sinceDays ?? '7'), 10) || 7));
    const topN = Math.min(50, Math.max(1, parseInt(String(req.query.topN ?? '10'), 10) || 10));

    const ShopModel = (await import('../models/shop.model.js')).Shop;
    const shops = await ShopModel.find({ owner: req.user._id }).lean();
    const shopIds = shops.map((s) => s._id);

    const since = new Date(Date.now() - sinceDays * 24 * 60 * 60 * 1000);
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const [result] = await Order.aggregate([
        { $match: { shop: { $in: shopIds }, createdAt: { $gte: since } } },
        {
            $facet: {
                byStatus: [
                    { $group: { _id: '$status', count: { $sum: 1 } } },
                    { $sort: { count: -1 } }
                ],
                totals: [
                    {
                        $group: {
                            _id: null,
                            orders: { $sum: 1 },
                            revenue: { $sum: '$total' }
                        }
                    }
                ],
                today: [
                    { $match: { createdAt: { $gte: startOfToday } } },
                    {
                        $group: {
                            _id: null,
                            orders: { $sum: 1 },
                            revenue: { $sum: '$total' }
                        }
                    }
                ],
                topProducts: [
                    { $unwind: '$items' },
                    {
                        $group: {
                            _id: '$items.product',
                            qty: { $sum: '$items.quantity' },
                            revenue: { $sum: { $multiply: ['$items.quantity', '$items.unitPrice'] } }
                        }
                    },
                    { $sort: { revenue: -1 } },
                    { $limit: topN },
                    {
                        $lookup: {
                            from: 'products',
                            localField: '_id',
                            foreignField: '_id',
                            as: 'product'
                        }
                    },
                    { $unwind: { path: '$product', preserveNullAndEmptyArrays: true } },
                    {
                        $project: {
                            _id: 1,
                            qty: 1,
                            revenue: 1,
                            product: {
                                _id: '$product._id',
                                name: '$product.name',
                                images: '$product.images',
                                price: '$product.price'
                            }
                        }
                    }
                ]
            }
        }
    ]);

    const totals = (result?.totals && result.totals[0]) || { orders: 0, revenue: 0 };
    const today = (result?.today && result.today[0]) || { orders: 0, revenue: 0 };

    res.json({
        data: {
            window: { sinceDays, since },
            ordersByStatus: result?.byStatus || [],
            totals,
            today,
            topProducts: result?.topProducts || []
        }
    });
});
