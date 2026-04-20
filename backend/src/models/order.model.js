import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema({
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    name: String,
    quantity: { type: Number, required: true },
    unitPrice: { type: Number, required: true }
}, { _id: false });

const orderSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    shop: { type: mongoose.Schema.Types.ObjectId, ref: 'Shop', required: true, index: true },
    items: [orderItemSchema],
    total: { type: Number, required: true },
    paymentMethod: { type: String, enum: ['upi', 'cod'], required: true },
    paymentStatus: { type: String, enum: ['pending', 'paid', 'failed'], default: 'pending' },
    deliveryMode: { type: String, enum: ['delivery', 'pickup'], required: true },
    room: String,
    status: {
        type: String,
        enum: ['placed', 'accepted', 'preparing', 'ready', 'out_for_delivery', 'delivered', 'cancelled'],
        default: 'placed'
    }
}, { timestamps: true });

// Efficient list views (cursor pagination & tabs)
orderSchema.index({ user: 1, createdAt: -1, _id: -1 });
orderSchema.index({ shop: 1, createdAt: -1, _id: -1 });
orderSchema.index({ shop: 1, status: 1, createdAt: -1 });

export const Order = mongoose.model('Order', orderSchema);
