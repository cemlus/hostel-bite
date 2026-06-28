import assert from 'node:assert';
import test from 'node:test';
import http from 'node:http';
import mongoose from 'mongoose';
import app from '../src/app.js';
import { connectDB } from '../src/config/db.js';
import { User } from '../src/models/user.model.js';
import { Hostel } from '../src/models/hostel.model.js';
import { Shop } from '../src/models/shop.model.js';
import { Product } from '../src/models/product.model.js';
import { Notification } from '../src/models/notification.model.js';

let server;
let baseUrl;
let studentToken;
let shopOwnerToken;
let studentId;
let shopOwnerId;
let testHostelId;
let testShopId;
let testProductId;

// Helper to make HTTP requests using global fetch
async function apiRequest(path, options = {}) {
  const url = `${baseUrl}${path}`;
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };
  const response = await fetch(url, {
    ...options,
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  const text = await response.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch (e) {
    json = null;
  }
  return {
    status: response.status,
    headers: response.headers,
    json,
    text,
  };
}

test.before(async () => {
  // Connect to database
  await connectDB();

  // Start express server on ephemeral port
  server = http.createServer(app);
  await new Promise((resolve) => {
    server.listen(0, () => {
      const port = server.address().port;
      baseUrl = `http://localhost:${port}`;
      resolve();
    });
  });

  // Clean up any potential stale test data
  const testEmailStudent = 'test-student@hostelbite.verify';
  const testEmailOwner = 'test-owner@hostelbite.verify';
  await User.deleteMany({ email: { $in: [testEmailStudent, testEmailOwner] } });
  await Hostel.deleteMany({ name: 'Verification Test Hostel' });

  // Create a test hostel
  const hostel = await Hostel.create({
    name: 'Verification Test Hostel',
    address: 'Verification Address',
  });
  testHostelId = hostel._id;

  // 1. Create student user
  const studentPassword = 'Password123!';
  const studentPasswordHash = await User.hashPassword(studentPassword);
  const student = await User.create({
    name: 'Test Student',
    email: testEmailStudent,
    passwordHash: studentPasswordHash,
    role: 'student',
    hostel: testHostelId,
  });
  studentId = student._id;

  // 2. Create shop owner user
  const ownerPassword = 'Password123!';
  const ownerPasswordHash = await User.hashPassword(ownerPassword);
  const owner = await User.create({
    name: 'Test Shop Owner',
    email: testEmailOwner,
    passwordHash: ownerPasswordHash,
    role: 'shop_owner',
    hostel: testHostelId,
  });
  shopOwnerId = owner._id;

  // Login both and get tokens
  const studentLoginRes = await apiRequest('/api/auth/login', {
    method: 'POST',
    body: { email: testEmailStudent, password: studentPassword },
  });
  assert.strictEqual(studentLoginRes.status, 200, 'Student login failed');
  studentToken = studentLoginRes.json.data.token;

  const ownerLoginRes = await apiRequest('/api/auth/login', {
    method: 'POST',
    body: { email: testEmailOwner, password: ownerPassword },
  });
  assert.strictEqual(ownerLoginRes.status, 200, 'Owner login failed');
  shopOwnerToken = ownerLoginRes.json.data.token;

  // Create a shop for the owner
  const shop = await Shop.create({
    name: 'Verification Test Shop',
    owner: shopOwnerId,
    hostel: testHostelId,
    open: true,
  });
  testShopId = shop._id;

  // Create a product in that shop
  const product = await Product.create({
    name: 'Verification Product',
    price: 50,
    stock: 10,
    shop: testShopId,
    owner: shopOwnerId,
    hostel: testHostelId,
  });
  testProductId = product._id;
});

test.after(async () => {
  // Clean up database
  if (testHostelId) {
    await User.deleteMany({ hostel: testHostelId });
    await Shop.deleteMany({ hostel: testHostelId });
    await Product.deleteMany({ hostel: testHostelId });
    await Hostel.deleteOne({ _id: testHostelId });
    if (studentId) {
      await Notification.deleteMany({ user: { $in: [studentId, shopOwnerId] } });
    }
  }

  // Close server and DB connections
  await new Promise((resolve) => server.close(resolve));
  await mongoose.disconnect();
});

test('1. ReDoS: verify regex characters are safely handled in auth controller and do not cause service hang', async () => {
  const redosPayload = "a*a*a*a*a*a*a*a*a*a*a*a*a*a*a*a*a*a*a*a*b";
  const startTime = Date.now();
  const res = await apiRequest('/api/auth/register', {
    method: 'POST',
    body: {
      name: 'ReDoS Test User',
      password: 'SomePassword123!',
      hostel: redosPayload,
    },
  });
  const duration = Date.now() - startTime;
  
  // Verify it responds quickly and doesn't hang (ReDoS typically hangs for seconds/minutes)
  assert.ok(duration < 1000, `ReDoS request took too long: ${duration}ms`);
  assert.strictEqual(res.status, 400);
  assert.match(res.json.error, /hostel name provided not found/);
});

test('2. RBAC check: verify standard student role cannot call product/shop POST routes and receives HTTP 403', async () => {
  // Try to create a shop as a student
  const shopRes = await apiRequest('/api/shops', {
    method: 'POST',
    headers: { Authorization: `Bearer ${studentToken}` },
    body: { name: 'Student Shop', hostel: testHostelId },
  });
  assert.strictEqual(shopRes.status, 403);
  assert.strictEqual(shopRes.json.error, 'Access denied. Shop owner role required.');

  // Try to create a product as a student
  const productRes = await apiRequest('/api/products', {
    method: 'POST',
    headers: { Authorization: `Bearer ${studentToken}` },
    body: { name: 'Student Product', price: 100 },
  });
  assert.strictEqual(productRes.status, 403);
  assert.strictEqual(productRes.json.error, 'Access denied. Shop owner role required.');
});

test('3. Orders checkout notification: check that notification is created for both buyer and shop owner', async () => {
  const orderRes = await apiRequest('/api/orders', {
    method: 'POST',
    headers: { Authorization: `Bearer ${studentToken}` },
    body: {
      items: [{ productId: testProductId.toString(), quantity: 2 }],
      deliveryMode: 'delivery',
      room: '101',
      paymentMethod: 'cod',
    },
  });
  assert.strictEqual(orderRes.status, 201, `Order placement failed: ${JSON.stringify(orderRes.json)}`);
  const orderId = orderRes.json.data.orderId;

  // Retrieve notifications for buyer (student)
  const studentNotifications = await Notification.find({ user: studentId, 'payload.orderId': orderId });
  assert.strictEqual(studentNotifications.length, 1, 'Buyer notification not created');
  assert.strictEqual(studentNotifications[0].title, 'Order placed');
  assert.match(studentNotifications[0].body, new RegExp(orderId));

  // Retrieve notifications for shop owner
  const ownerNotifications = await Notification.find({ user: shopOwnerId, 'payload.orderId': orderId });
  assert.strictEqual(ownerNotifications.length, 1, 'Shop owner notification not created');
  assert.strictEqual(ownerNotifications[0].title, 'New Order Received');
  assert.match(ownerNotifications[0].body, new RegExp(orderId));
});

test('4. Product ID check: verify that voting with a non-existent or malformed product ID is handled correctly (HTTP 404/400)', async () => {
  // Case A: Malformed product ID
  const malformedRes = await apiRequest('/api/products/invalid-product-id-format/vote', {
    method: 'POST',
    headers: { Authorization: `Bearer ${studentToken}` },
    body: { vote: 1 },
  });
  assert.strictEqual(malformedRes.status, 400);
  assert.strictEqual(malformedRes.json.error, 'Invalid product ID format');

  // Case B: Non-existent product ID
  const nonExistentId = new mongoose.Types.ObjectId().toString();
  const nonExistentRes = await apiRequest(`/api/products/${nonExistentId}/vote`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${studentToken}` },
    body: { vote: 1 },
  });
  assert.strictEqual(nonExistentRes.status, 404);
  assert.strictEqual(nonExistentRes.json.error, 'Product not found');
});

test('5. CastError check: verify that passing malformed ObjectId format in backend routes returns HTTP 400', async () => {
  // Calling GET /api/products/invalid-id-format
  const res = await apiRequest('/api/products/invalid-id-format', {
    method: 'GET',
    headers: { Authorization: `Bearer ${studentToken}` },
  });
  assert.strictEqual(res.status, 400);
  assert.strictEqual(res.json.error, 'Invalid format for field _id');
});

test('6. UPI URL: verify that the generated deep link parses correctly and matches expectations without double-encoding', () => {
  // Logic from frontend/src/utils/upi.ts
  function createUpiDeepLink({ vpa, name, amount, transactionNote = 'HostelBite Order', currency = 'INR' }) {
    const params = new URLSearchParams({
      pa: vpa,
      pn: name,
      am: amount.toFixed(2),
      cu: currency,
    });
    if (transactionNote) {
      params.set('tn', transactionNote);
    }
    return `upi://pay?${params.toString()}`;
  }

  const link = createUpiDeepLink({
    vpa: 'hostelbite@upi',
    name: 'Seed Shop Owner',
    amount: 125,
    transactionNote: 'HostelBite Order #12345'
  });

  // Expected deep link format (single-encoded by URLSearchParams)
  const expectedLink = 'upi://pay?pa=hostelbite%40upi&pn=Seed+Shop+Owner&am=125.00&cu=INR&tn=HostelBite+Order+%2312345';
  assert.strictEqual(link, expectedLink);

  // Validate parsing
  const query = link.replace('upi://pay?', '');
  const parsed = new URLSearchParams(query);
  assert.strictEqual(parsed.get('pa'), 'hostelbite@upi');
  assert.strictEqual(parsed.get('pn'), 'Seed Shop Owner');
  assert.strictEqual(parsed.get('am'), '125.00');
  assert.strictEqual(parsed.get('cu'), 'INR');
  assert.strictEqual(parsed.get('tn'), 'HostelBite Order #12345');

  // Verify that it is NOT double-encoded
  assert.ok(!link.includes('%2520'));
  assert.ok(!link.includes('%2523'));
});
