# HostelBite: System Architecture & Data Flow Documentation

1. System Context Overview (For Level 0 Context Diagram)

The HostelBite Platform acts as the central system facilitating commerce between college hostel students and internal hostel canteens/student-run shops.

Primary External Entities (Actors & Systems)

1.  Student (Buyer): Interacts with the system to browse products, view AI-generated nutrition facts, upvote items, manage their cart, place orders, and track order status.
2.  Shop Owner (Seller): Interacts with the system to manage shop details, perform CRUD operations on products (utilizing AI description generation), manage incoming orders, update order statuses, and view financial analytics.
3.  OpenRouter API (External System): An external Large Language Model (LLM) provider (using gemini-2.0-flash-001) that the backend communicates with to generate marketing descriptions and estimate nutritional values.
4.  Admin (Implied): System administrators with global override permissions for dispute resolution or content moderation.

---

2. Core Functional Modules (For Level 1 DFD)

The system can be broken down into five primary processes/modules:

Process 1.0: Authentication & User Management

- Inputs: Registration details, Login credentials.
- Logic: Hashes passwords, verifies credentials, assigns roles (student or shop_owner), and generates JWTs.
- Outputs: JWT Token, User Profile Data.
- Data Stores: Users collection, Hostels collection.

Process 2.0: Product & Inventory Management

- Inputs: Product details (name, price, stock, tags), Shop ID, AI Prompt requests.
- Logic: Handles creation, soft-deletion (isActive flag), and updates. Fetches AI descriptions from OpenRouter. Aggregates products with upvote scores to return ranked lists. Fetches AI nutritional estimates on demand.
- Outputs: Ranked product lists, Individual product details, AI-generated text.
- Data Stores: Products collection, Votes collection.

Process 3.0: Shop & Profile Management

- Inputs: Shop settings (open/close status, UPI ID, location).
- Logic: Auto-creates a shop if an owner adds a product without one. Updates shop configurations.
- Outputs: Shop profile data, Owner dashboard analytics.
- Data Stores: Shops collection.

Process 4.0: Order Processing & Fulfillment

- Inputs: Cart items, Delivery preferences, Order status updates.
- Logic: Validates stock, atomically (sequentially with rollback) deducts inventory, generates the order record, and updates statuses (Pending -> Preparing -> Ready -> Delivered).
- Outputs: Order confirmations, Order history, Real-time status.
- Data Stores: Orders collection, Products collection (for stock updates).

Process 5.0: Analytics & Notifications

- Inputs: System events (New order placed, Order status changed).
- Logic: Triggers database notifications for users. Computes revenue and top-selling item metrics via MongoDB Aggregation.
- Outputs: Unread notifications count, Analytics charts/data for Owner Dashboard.
- Data Stores: Notifications collection, Orders collection.

---

3. Data Stores (Entities / Database Collections)

To map data flows accurately, these are the core data stores residing in MongoDB:

- D1: Users: \_id, name, email, passwordHash, role, hostel_id, room_number.
- D2: Shops: \_id, owner_id, hostel_id, name, description, isOpen, phone, upiId.
- D3: Products: \_id, shop_id, owner_id, name, description, price, stock, isActive (boolean for soft-delete), tags, images.
- D4: Orders: \_id, user_id (buyer), shop_id, items (array of product IDs, quantities, historical prices), totalAmount, status, deliveryMode.
- D5: Votes: \_id, user_id, product_id, voteValue (+1).
- D6: Notifications: \_id, user_id, title, body, isRead, payload (routing data).

---

4. Key Data Flow Scenarios (For Lower-Level DFDs)

Scenario A: Placing an Order (Level 2 DFD mapping for Process 4.0)

1.  Student sends Checkout Payload (Cart items, delivery mode) to Order Controller.
2.  Order Controller reads D3: Products to verify prices and available stock.
3.  Order Controller writes to D3: Products to decrement stock for purchased items.
4.  Order Controller writes to D4: Orders to create the Pending order.
5.  Order Controller writes to D6: Notifications to alert the Shop Owner.
6.  Order Controller returns Success Status back to the Student.

Scenario B: AI Feature Interactions (Level 2 DFD mapping for Process 2.0)
Generating a Description (Owner):

1.  Shop Owner clicks "Generate" sending Product Name to Product Controller.
2.  Product Controller constructs an engineering prompt and sends an HTTP POST to OpenRouter API.
3.  OpenRouter API returns the LLM String.
4.  Product Controller forwards the Description String to the Shop Owner's UI (Client state, not saved to DB until the user clicks "Save").

Generating Nutrition Facts (Student):

1.  Student clicks "Show Nutrition" sending Product Name & Description to Product Controller.
2.  Product Controller constructs a prompt and sends an HTTP POST to OpenRouter API.
3.  OpenRouter API returns Calories, Protein, Carbs.
4.  Product Controller forwards the Nutrition String to the Student's UI (Fetched dynamically on demand, not stored in DB).

Scenario C: Viewing the "My Products" Dashboard (Owner)

1.  Shop Owner UI requests D2: Shops via /shops/mine to get their shop_id.
2.  Shop Owner UI requests Products via /products/ranked?shopId=XYZ.
3.  Product Controller uses MongoDB Aggregation:
    - $match: Filters D3: Products by shop_id and isActive: true.
    - $lookup: Joins D5: Votes to calculate a total upvote score per product.
4.  Product Controller returns the filtered, ranked array of products to the Shop Owner.

---

5. Technical Architecture (System Stack)

Frontend (Client-Side)

- Architecture: Single Page Application (SPA).
- Framework: React 18, TypeScript, Vite.
- State Management: React Context API (AuthContext, CartContext).
- Routing: react-router-dom (handles protected routes for owners vs. buyers).
- UI/Styling: Tailwind CSS, Radix UI (shadcn/ui component library).
- API Communication: Custom wrapper (api/client.ts) over the native fetch API, which intercepts requests to inject the JWT Authorization header.

Backend (Server-Side)

- Architecture: RESTful API.
- Environment: Node.js.
- Framework: Express.js.
- Database: MongoDB, mapped using Mongoose ODM.
- Security Stack:
  - bcryptjs for password hashing.
  - jsonwebtoken (JWT) for stateless authentication.
  - helmet for HTTP header security.
  - cors for cross-origin resource sharing.
  - express-rate-limit to prevent brute-force attacks.
- Design Pattern: Controller-Route-Model separation of concerns. Controllers are wrapped in a custom asyncHandler to push all rejected promises to a centralized error.middleware.js.
