# MiniStore — Full-Stack E-Commerce Project

Stack: **HTML / CSS / vanilla JavaScript** (frontend) + **Node.js / Express** (API) + **MySQL** (database) + **JWT** (authentication).

## Features
- Product catalog with search + category filter
- Product detail pages
- User registration & login (JWT-based auth)
- Server-side shopping cart (per logged-in user)
- Checkout flow with shipping info + simulated payment (no real payment gateway)
- Order history for customers
- Admin panel: dashboard stats, product CRUD, order status management, user role management

## Project Structure
```
ecommerce-store/
├── backend/
│   ├── config/db.js          # MySQL connection pool
│   ├── middleware/           # auth.js (JWT check), admin.js (role check)
│   ├── routes/                # auth, products, cart, orders, admin
│   ├── db/schema.sql          # tables + seed products
│   ├── db/seedAdmin.js        # creates a demo admin account
│   ├── server.js              # Express entry point
│   ├── .env.example
│   └── package.json
└── frontend/
    ├── index.html, product.html, cart.html, checkout.html,
    │   login.html, register.html, orders.html, admin.html
    ├── css/style.css
    └── js/                     # api.js, auth.js, + one file per page
```

## 1. Set up the database
Make sure MySQL is installed and running, then:
```bash
mysql -u root -p < backend/db/schema.sql
```
This creates the `ecommerce_store` database, all tables, and seeds 10 demo products.

## 2. Configure and run the backend
```bash
cd backend
cp .env.example .env
# edit .env: set DB_PASSWORD and a long random JWT_SECRET
npm install
node db/seedAdmin.js     # creates admin@ministore.com / admin123
npm run dev              # or: npm start
```
The API runs at `http://localhost:5000/api`. Check it's alive: `GET /api/health`.

## 3. Run the frontend
The frontend is plain static HTML/CSS/JS — no build step. Simplest options:
- Open `frontend/index.html` directly in a browser, **or**
- Serve it so relative paths behave consistently:
  ```bash
  cd frontend
  npx serve .
  # or: python3 -m http.server 5500
  ```
If your backend runs on a different host/port, update `API_BASE_URL` at the top of `frontend/js/api.js`.

## 4. Try it out
- Register a new account, or log in as the seeded admin (`admin@ministore.com` / `admin123`).
- Browse products, add to cart, check out with any 12+ digit "card number" (payment is simulated).
- Log in as admin and open **Admin** in the nav to manage products, orders, and user roles.

## Notes & things to harden for production
- Payment is fully simulated — no Stripe/PayPal integration. Swap the checkout logic in `routes/orders.js` for a real gateway before going live.
- JWT is stored in `localStorage`, which is simple but vulnerable to XSS; an httpOnly cookie is safer for production.
- Add rate limiting (e.g. `express-rate-limit`) on `/api/auth/*` to slow brute-force attempts.
- Add server-side validation library (e.g. `zod`/`joi`) for stricter input checking.
