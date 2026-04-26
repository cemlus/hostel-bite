import mongoose from 'mongoose';
const shopSchema = new mongoose.Schema({
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  hostel: { type: mongoose.Schema.Types.ObjectId, ref: 'Hostel', required: true, index: true },
  name: { type: String, required: true },
  description: String,
  phone: String,
  upiId: String,
  location: String,
  open: { type: Boolean, default: true },
  openTime: String,
  closeTime: String
}, { timestamps: true });

export const Shop = mongoose.model('Shop', shopSchema);
