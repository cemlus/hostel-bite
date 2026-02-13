/**
 * Seed script: creates a demo hostel, shop owner, shop, and products
 * with real food items (Oreo, soft drinks, Indian chips, chocolates) and images.
 * Run: node scripts/seed.js (from backend dir) or npm run seed
 */
import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

import { connectDB } from '../src/config/db.js';
import { Hostel } from '../src/models/hostel.model.js';
import { User } from '../src/models/user.model.js';
import { Shop } from '../src/models/shop.model.js';
import { Product } from '../src/models/product.model.js';

const SEED_EMAIL = 'seed-shop@hostelbite.demo';
const SEED_PASSWORD = 'SeedPass123!';

// Real food product images (Unsplash, free to use)
const PRODUCTS = [
  // Biscuits / Cookies
  {
    name: 'Oreo Original',
    description: 'Milk\'s favorite cookie - classic chocolate sandwich biscuits',
    price: 30,
    stock: 50,
    tags: ['biscuit', 'cookie', 'snack'],
    images: ['https://images.unsplash.com/photo-1599629954294-14df9ec8bc05?q=80&w=465&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'],
  },
  // Soft drinks
  {
    name: 'Coca-Cola',
    description: 'Classic Coca-Cola 300ml cold drink',
    price: 25,
    stock: 100,
    tags: ['drink', 'cold', 'beverage'],
    images: ['https://images.unsplash.com/photo-1667204651371-5d4a65b8b5a9?q=80&w=416&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'],
  },
  {
    name: 'Pepsi',
    description: 'Pepsi 300ml - refreshing cola',
    price: 25,
    stock: 100,
    tags: ['drink', 'cold', 'beverage'],
    images: ['https://images.unsplash.com/photo-1629203851122-3726ecdf080e?w=400&q=80'],
  },
  {
    name: 'Fanta Orange',
    description: 'Fanta Orange 300ml - tangy orange soft drink',
    price: 25,
    stock: 80,
    tags: ['drink', 'cold', 'beverage', 'orange'],
    images: ['https://cdn.pixabay.com/photo/2013/03/01/18/48/aluminum-87987_1280.jpg'],
  },
  {
    name: 'Sprite',
    description: 'Sprite 300ml - lemon-lime refreshment',
    price: 25,
    stock: 80,
    tags: ['drink', 'cold', 'beverage', 'lemon'],
    images: ['https://images.unsplash.com/photo-1680404005217-a441afdefe83?q=80&w=464&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'],
  },
  // Indian chips brands
  {
    name: 'Lays Classic',
    description: 'Lays Classic salted potato chips - 52g',
    price: 20,
    stock: 60,
    tags: ['chips', 'snack', 'lays'],
    images: ['https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=400&q=80'],
  },
  {
    name: 'Lays India\'s Magic Masala',
    description: 'Lays India\'s Magic Masala - 52g',
    price: 20,
    stock: 60,
    tags: ['chips', 'snack', 'lays', 'masala'],
    images: ['https://images.unsplash.com/photo-1613919113640-cb3f1c5f8e7a?w=400&q=80'],
  },
  {
    name: 'Kurkure Masala Munch',
    description: 'Kurkure Masala Munch - crunchy twisted snack',
    price: 20,
    stock: 50,
    tags: ['chips', 'snack', 'kurkure'],
    images: ['https://images.unsplash.com/photo-1613919113640-cb3f1c5f8e7a?w=400&q=80'],
  },
  {
    name: 'Bingo Mad Angles',
    description: 'Bingo Mad Angles - tangy triangle chips',
    price: 20,
    stock: 50,
    tags: ['chips', 'snack', 'bingo'],
    images: ['https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=400&q=80'],
  },
  {
    name: 'Uncle Chipps',
    description: 'Uncle Chipps classic salted - Indian potato chips',
    price: 20,
    stock: 40,
    tags: ['chips', 'snack'],
    images: ['https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=400&q=80'],
  },
  // Chocolates
  {
    name: 'Kit Kat',
    description: 'Kit Kat 4 finger milk chocolate - break me off a piece',
    price: 40,
    stock: 40,
    tags: ['chocolate', 'snack', 'nestle'],
    images: ['https://images.unsplash.com/photo-1481391319762-47dff72954d9?w=400&q=80'],
  },
  {
    name: 'Dairy Milk',
    description: 'Cadbury Dairy Milk - smooth milk chocolate bar',
    price: 50,
    stock: 40,
    tags: ['chocolate', 'cadbury', 'snack'],
    images: ['https://images.unsplash.com/photo-1511381939415-e44015466834?w=400&q=80'],
  },
  {
    name: 'Dairy Milk Silk',
    description: 'Cadbury Dairy Milk Silk - premium smooth chocolate',
    price: 60,
    stock: 30,
    tags: ['chocolate', 'cadbury', 'snack'],
    images: ['https://images.unsplash.com/photo-1511381939415-e44015466834?w=400&q=80'],
  },
  {
    name: 'Milkybar',
    description: 'Nestlé Milkybar - creamy white chocolate',
    price: 30,
    stock: 40,
    tags: ['chocolate', 'white', 'nestle', 'snack'],
    images: ['https://images.unsplash.com/photo-1606312619070-d48b4c392a43?w=400&q=80'],
  },
  {
    name: '5 Star',
    description: 'Cadbury 5 Star - chocolate with caramel and nougat',
    price: 40,
    stock: 35,
    tags: ['chocolate', 'cadbury', 'snack'],
    images: ['https://images.unsplash.com/photo-1599599810769-bcde5a160d32?w=400&q=80'],
  },
  {
    name: 'Perk',
    description: 'Cadbury Perk - wafer covered in chocolate',
    price: 20,
    stock: 50,
    tags: ['chocolate', 'cadbury', 'wafer', 'snack'],
    images: ['https://images.unsplash.com/photo-1481391319762-47dff72954d9?w=400&q=80'],
  },
];

async function seed() {
  await connectDB();

  let hostel = await Hostel.findOne({ name: 'Seed Hostel' });
  if (!hostel) {
    hostel = await Hostel.create({
      name: 'Seed Hostel',
      address: 'Demo Hostel, Campus Road',
    });
    console.log('Created hostel:', hostel.name);
  } else {
    console.log('Using existing hostel:', hostel.name);
  }

  let user = await User.findOne({ email: SEED_EMAIL });
  if (!user) {
    const passwordHash = await User.hashPassword(SEED_PASSWORD);
    user = await User.create({
      name: 'Seed Shop Owner',
      email: SEED_EMAIL,
      passwordHash,
      role: 'shop_owner',
      hostel: hostel._id,
    });
    console.log('Created seed user:', user.email);
  } else {
    console.log('Using existing seed user:', user.email);
  }

  let shop = await Shop.findOne({ owner: user._id });
  if (!shop) {
    shop = await Shop.create({
      owner: user._id,
      hostel: hostel._id,
      name: 'Hostel Canteen',
      description: 'Snacks, drinks & chocolates',
      open: true,
    });
    console.log('Created shop:', shop.name);
  } else {
    console.log('Using existing shop:', shop.name);
  }

  const existingCount = await Product.countDocuments({ shop: shop._id });
  if (existingCount > 0) {
    await Product.deleteMany({ shop: shop._id });
    console.log('Cleared', existingCount, 'existing products from seed shop');
  }

  const productDocs = PRODUCTS.map((p) => ({
    shop: shop._id,
    owner: user._id,
    hostel: hostel._id,
    name: p.name,
    description: p.description,
    price: p.price,
    stock: p.stock,
    tags: p.tags,
    images: p.images,
  }));

  await Product.insertMany(productDocs);
  console.log('Inserted', productDocs.length, 'products');

  console.log('\nSeed done. You can login with:');
  console.log('  Email:', SEED_EMAIL);
  console.log('  Password:', SEED_PASSWORD);
  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
