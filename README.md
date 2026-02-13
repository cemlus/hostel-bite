# Hostel Bite

A full-stack food ordering and shop management app for hostels. Students can browse products from hostel shops, add items to cart, and place orders. Shop owners can manage their shop, products, and view orders.

## Tech Stack

- **Backend:** Node.js, Express, MongoDB (Mongoose), JWT auth
- **Frontend:** React, TypeScript, Vite, Tailwind CSS, shadcn/ui

## Prerequisites

- Node.js (v18+)
- MongoDB (local or [MongoDB Atlas](https://www.mongodb.com/atlas))
- npm or bun

## Getting Started

### 1. Backend

```bash
cd backend
npm install
```

Create a `.env` file (copy from `.env.example` and fill in your values):

```env
PORT=4000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_strong_secret
JWT_EXPIRES_IN=7d
NODE_ENV=development
```

Start the API:

```bash
npm run dev
```

The API runs at `http://localhost:4000`.

### 2. Frontend

```bash
cd frontend
npm install
```

Create a `.env` file (copy from `.env.example`):

```env
VITE_API_BASE_URL=http://localhost:4000
```

Start the dev server:

```bash
npm run dev
```

Open the URL shown in the terminal (usually `http://localhost:5173`).

### 3. Seed data (optional)

To populate a demo hostel, shop, and products:

```bash
cd backend
npm run seed
```

Use the seed credentials from the script output to log in as the demo shop owner.

## Project structure

```
hostel-bite/
├── backend/     # Express API, auth, hostels, shops, products, orders
└── frontend/    # React SPA (Vite)
```

## Scripts

| Location   | Command        | Description              |
|-----------|----------------|--------------------------|
| `backend` | `npm run dev`  | Start API with nodemon   |
| `backend` | `npm run start`| Start API (production)   |
| `backend` | `npm run seed` | Seed demo data           |
| `frontend`| `npm run dev`  | Start Vite dev server    |
| `frontend`| `npm run build`| Production build         |
