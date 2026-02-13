import mongoose from 'mongoose';
import { configs } from './env.js';

export const connectDB = async () => {
  try {
    await mongoose.connect(configs.MONGO_URI, {
      dbName: 'hostelbite'
    });
    console.log('MongoDB bhi chal gaya');
  } catch (err) {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  }
};
