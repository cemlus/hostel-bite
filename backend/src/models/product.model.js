import mongoose from 'mongoose';
const productSchema = new mongoose.Schema({
  shop: { type: mongoose.Schema.Types.ObjectId, ref: 'Shop', required: true, index: true },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  hostel: { type: mongoose.Schema.Types.ObjectId, ref: 'Hostel', required: true, index: true },
  name: { type: String, required: true },
  description: String,
  price: { type: Number, required: true },
  stock: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
  tags: [String],
  images: [String]
}, { timestamps: true });

productSchema.index({ hostel: 1, shop: 1, isActive: 1 });
productSchema.index({ shop: 1, isActive: 1 });
productSchema.index({ hostel: 1, isActive: 1, price: 1 });
productSchema.index({ tags: 1, isActive: 1 });

productSchema.index({ name: 'text', description: 'text' });

export const Product = mongoose.model('Product', productSchema);
