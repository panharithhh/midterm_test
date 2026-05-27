# ShopAPI

A full-stack e-commerce app split across two branches:

| Branch | Role | Port |
|--------|------|------|
| `frontend` | Next.js UI | 3000 |
| `backend` | Express REST API | 4000 |

---

## Screenshots

### 1. Home — Product Listing
Products fetched live from the Express backend API.

![Home](screenshots/01-home.png)

---

### 2. Login Page
User authentication via JWT.

![Login](screenshots/02-login.png)

---

### 3. Logged In (Admin)
Navbar shows Cart, Admin link, email, and Logout after signing in.

![Logged In](screenshots/03-home-logged-in.png)

---

### 4. Admin Dashboard
Admins can create, edit, and delete products and manage inventory.

![Admin Panel](screenshots/04-admin-panel.png)

---

### 5. Product Detail Page
Shows price, stock count, quantity selector, and Add to Cart.

![Product Detail](screenshots/05-product-detail.png)

---

### 6. Cart Page
Shows items, quantity controls, subtotals, and Remove button.

![Cart](screenshots/06-cart.png)

---

### 7. Backend API — `GET /api/products`
Express server returns raw JSON — this is what the frontend calls.

![API Products](screenshots/08-api-products.png)

---

### 8. Backend API — `GET /api/cart` (no token)
Protected routes return `{"error":"Unauthorized"}` without a JWT.

![API Unauthorized](screenshots/09-api-cart-unauth.png)

---

## Running locally

**Terminal 1 — Backend (Express on port 4000)**
```bash
cd ~/1/part1-backend/backend
npm install
npm run dev
```

**Terminal 2 — Frontend (Next.js on port 3000)**
```bash
cd ~/1/part1
npm install
npm run dev
```

Open `http://localhost:3000` in the browser.

---

## API Routes

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/auth/register` | — | Register user |
| POST | `/api/auth/login` | — | Login, returns JWT |
| GET | `/api/products` | — | List / search products |
| POST | `/api/products` | admin | Create product |
| PUT | `/api/products/:id` | admin | Update product |
| DELETE | `/api/products/:id` | admin | Delete product |
| GET | `/api/cart` | user | Get cart |
| POST | `/api/cart` | user | Add item to cart |
| PATCH | `/api/cart/:itemId` | user | Update quantity |
| DELETE | `/api/cart/:itemId` | user | Remove item |
| PATCH | `/api/inventory/:id` | admin | Update stock |

---

## Tests

```bash
npm test              # 40 unit tests (Vitest)
npm run test:e2e      # 25 end-to-end tests (Playwright)
```
