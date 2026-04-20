import { asyncHandler } from '../utils/asyncHandler.js';
import { Product } from '../models/product.model.js';
import { Shop } from '../models/shop.model.js';
import { ApiError } from '../utils/ApiError.js';
import { Notification } from '../models/notification.model.js';


export const createProduct = asyncHandler(async (req, res) => {
    const { name, description, price, stock = 0, tags = [], images = [] } = req.body;
    const ownerId = req.user._id;
    const hostelId = req.user.hostel;

    if (!name || price === undefined) throw new ApiError(400, 'name and price required');
    if (!hostelId) throw new ApiError(400, 'User must be associated with a hostel to create products');

    let shop = await Shop.findOne({ owner: ownerId });
    if (!shop) {
        const defaultName = `${req.user.name}'s Shop`;
        shop = await Shop.create({ owner: ownerId, hostel: hostelId, name: defaultName, open: true });
        // optional: notify owner that shop was auto-created
        await Notification.create({
            user: ownerId,
            title: 'Shop created',
            body: `A shop "${defaultName}" was created for you automatically. Edit details from your dashboard.`,
            payload: { shopId: shop._id }
        });
    }

    const product = await Product.create({
        shop: shop._id,
        owner: ownerId,
        hostel: hostelId,
        name,
        description,
        price,
        stock,
        tags,
        images
    });

    res.status(201).json({ data: { product, shop } });
});

export const listProducts = asyncHandler(async (req, res) => {
    const {
        hostelId,
        shopId,
        search,
        tags,
        minPrice,
        maxPrice,
        inStock,
        sort = 'new',
        page = '1',
        pageSize = '24'
    } = req.query;

    const q = { isActive: true };
    if (hostelId) q.hostel = hostelId;
    if (shopId) q.shop = shopId;

    // Comparisons
    if (minPrice || maxPrice) {
        q.price = {};
        if (minPrice !== undefined) q.price.$gte = Number(minPrice);                                // $gte
        if (maxPrice !== undefined) q.price.$lte = Number(maxPrice);                                // $lte
    }

    if (inStock === 'true') {                                                                       
        q.stock = { $gt: 0 };                                                                       // $gt
    }

    // Array operators
    if (tags) {
        const list = String(tags)
            .split(',')
            .map((t) => t.trim())
            .filter(Boolean);
        if (list.length > 0) q.tags = { $in: list };
    }

    const pageNum = Math.max(1, parseInt(String(page), 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(String(pageSize), 10) || 24));
    const skipNum = (pageNum - 1) * limitNum;

    // Sorting
    // - new: createdAt desc
    // - price_asc / price_desc
    // - search uses $text score ordering
    let cursor = Product.find(q);
    let countQuery = q;

    if (search) {
        // Prefer $text search (uses text index); fallback to regex if user passed an empty/invalid string.
        const term = String(search).trim();
        if (term) {
            countQuery = { ...q, $text: { $search: term } };
            cursor = Product.find(countQuery, { score: { $meta: 'textScore' } })
                .sort({ score: { $meta: 'textScore' }, createdAt: -1 });
        }
    } else {
        if (sort === 'price_asc') cursor = cursor.sort({ price: 1, createdAt: -1 });
        else if (sort === 'price_desc') cursor = cursor.sort({ price: -1, createdAt: -1 });
        else cursor = cursor.sort({ createdAt: -1 });
    }

    const [items, total] = await Promise.all([
        cursor.skip(skipNum).limit(limitNum).lean(),
        Product.countDocuments(countQuery)
    ]);

    res.json({
        data: {
            items,
            page: pageNum,
            pageSize: limitNum,
            total,
            totalPages: Math.ceil(total / limitNum)
        }
    });
});

export const getProduct = asyncHandler(async (req, res) => {
    const product = await Product.findById(req.params.productId).lean();
    if (!product) throw new ApiError(404, 'Product not found');
    res.json({ data: product });
});

export const updateProduct = asyncHandler(async (req, res) => {
    const product = await Product.findById(req.params.productId);
    if (!product) throw new ApiError(404, 'Product not found');
    if (product.owner.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
        throw new ApiError(403, 'Not allowed');
    }
    Object.assign(product, req.body);
    await product.save();
    res.json({ data: product });
});

/**
 * GET /api/products/ranked
 * Query params: hostelId, shopId, tags, minPrice, maxPrice, inStock, windowHours, limit
 *
 * Computes vote score from Vote collection and returns products sorted by score.
 */
export const rankedProducts = asyncHandler(async (req, res) => {
    const {
        hostelId,
        shopId,
        tags,
        minPrice,
        maxPrice,
        inStock,
        windowHours,
        limit = '50'
    } = req.query;

    const match = { isActive: true };
    if (hostelId) match.hostel = hostelId;
    if (shopId) match.shop = shopId;

    if (minPrice || maxPrice) {
        match.price = {};
        if (minPrice !== undefined) match.price.$gte = Number(minPrice);
        if (maxPrice !== undefined) match.price.$lte = Number(maxPrice);
    }
    if (inStock === 'true') match.stock = { $gt: 0 };
    if (tags) {
        const list = String(tags)
            .split(',')
            .map((t) => t.trim())
            .filter(Boolean);
        if (list.length > 0) match.tags = { $in: list };
    }

    const limitNum = Math.min(100, Math.max(1, parseInt(String(limit), 10) || 50));

    const votesLookup = (() => {
        const hours = windowHours !== undefined ? Number(windowHours) : null;
        if (!hours || Number.isNaN(hours) || hours <= 0) {
            return {
                from: 'votes',
                localField: '_id',
                foreignField: 'product',
                as: 'votes'
            };
        }
        const since = new Date(Date.now() - hours * 60 * 60 * 1000);
        return {
            from: 'votes',
            let: { productId: '$_id' },
            pipeline: [
                { $match: { $expr: { $eq: ['$product', '$$productId'] } } },
                { $match: { createdAt: { $gte: since } } }
            ],
            as: 'votes'
        };
    })();

    const items = await Product.aggregate([
        { $match: match },
        { $lookup: votesLookup },
        { $addFields: { score: { $sum: '$votes.vote' } } },
        { $sort: { score: -1, createdAt: -1 } },
        { $limit: limitNum },
        { $project: { votes: 0 } }
    ]);

    res.json({ data: { items } });
});
