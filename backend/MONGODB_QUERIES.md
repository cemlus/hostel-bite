## MongoDB query patterns used in HostelBite

This document mirrors the queries implemented in the Node/Mongoose backend and provides equivalent **mongosh** examples for learning and debugging (use with `explain("executionStats")` when tuning indexes).

### Products browse/search/filter (`GET /api/products`)

#### Filters used (operators)
- **Comparison operators**: `$gte`, `$lte`, `$gt`
- **Array operators**: `$in` on `tags`
- **Search**: `$text` (requires text index on `products.name` and `products.description`)

#### mongosh examples

```javascript
// In-stock + price range + tags (array) + hostel/shop scope
db.products.find({
  isActive: true,
  hostel: ObjectId("HOSTEL_ID"),
  shop: ObjectId("SHOP_ID"),
  stock: { $gt: 0 },
  price: { $gte: 20, $lte: 120 },
  tags: { $in: ["Snacks", "Quick"] }
}).sort({ createdAt: -1 }).limit(50)
```

```javascript
// Text search (ranked by textScore)
db.products.find(
  { isActive: true, $text: { $search: "maggi chai" } },
  { score: { $meta: "textScore" } }
).sort({ score: { $meta: "textScore" }, createdAt: -1 }).limit(50)
```

### Ranked products (`GET /api/products/ranked`)

Computes `score = sum(votes.vote)` using `$lookup` + `$sum`.

```javascript
db.products.aggregate([
  { $match: { isActive: true, hostel: ObjectId("HOSTEL_ID") } },
  { $lookup: { from: "votes", localField: "_id", foreignField: "product", as: "votes" } },
  { $addFields: { score: { $sum: "$votes.vote" } } },
  { $sort: { score: -1, createdAt: -1 } },
  { $limit: 50 },
  { $project: { votes: 0 } }
])
```

Trending (time window on votes) mirrors the `$lookup.pipeline` used by the backend:

```javascript
const since = new Date(Date.now() - 6 * 60 * 60 * 1000); // 6h
db.products.aggregate([
  { $match: { isActive: true } },
  {
    $lookup: {
      from: "votes",
      let: { productId: "$_id" },
      pipeline: [
        { $match: { $expr: { $eq: ["$product", "$$productId"] } } },
        { $match: { createdAt: { $gte: since } } }
      ],
      as: "votes"
    }
  },
  { $addFields: { score: { $sum: "$votes.vote" } } },
  { $sort: { score: -1, createdAt: -1 } },
  { $limit: 50 }
])
```

### Orders pagination (`GET /api/orders/mine`, `GET /api/orders/shop/list`)

Cursor pagination is implemented with a composite cursor:
- `cursor = "<createdAtMs>_<objectId>"`
- Query uses `$or` with `(createdAt < cursorCreatedAt) OR (createdAt == cursorCreatedAt AND _id < cursorId)`

mongosh idea:

```javascript
const cursorCreatedAt = new Date(1710000000000);
const cursorId = ObjectId("65f0c5a2e7b1b1b1b1b1b1b1");

db.orders.find({
  user: ObjectId("USER_ID"),
  $or: [
    { createdAt: { $lt: cursorCreatedAt } },
    { createdAt: cursorCreatedAt, _id: { $lt: cursorId } }
  ]
}).sort({ createdAt: -1, _id: -1 }).limit(20)
```

### Owner analytics (`GET /api/orders/shop/analytics`)

Uses:
- `$facet` to compute multiple aggregates in one pass
- `$unwind` embedded `items[]`
- `$group` with `$multiply` to compute revenue per item
- `$lookup` to join `products` metadata

```javascript
const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
db.orders.aggregate([
  { $match: { shop: { $in: [ObjectId("SHOP_ID")] }, createdAt: { $gte: since } } },
  {
    $facet: {
      byStatus: [
        { $group: { _id: "$status", count: { $sum: 1 } } }
      ],
      totals: [
        { $group: { _id: null, orders: { $sum: 1 }, revenue: { $sum: "$total" } } }
      ],
      topProducts: [
        { $unwind: "$items" },
        {
          $group: {
            _id: "$items.product",
            qty: { $sum: "$items.quantity" },
            revenue: { $sum: { $multiply: ["$items.quantity", "$items.unitPrice"] } }
          }
        },
        { $sort: { revenue: -1 } },
        { $limit: 10 },
        { $lookup: { from: "products", localField: "_id", foreignField: "_id", as: "product" } },
        { $unwind: { path: "$product", preserveNullAndEmptyArrays: true } }
      ]
    }
  }
])
```

