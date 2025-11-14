PDV API (simple backend)

Quick, file-backed API using Express + better-sqlite3. Provides auth, products, clients, and orders.

Setup
- cd api
- cp .env.example .env (edit JWT_SECRET if needed)
- npm install
- npm run seed
- npm run dev

Default
- Port: 4000
- Seed: user admin@example.com / password: admin123

Endpoints (summary)
- POST /auth/login { email, password }
- GET  /me (Authorization: Bearer <token>)
- GET  /products
- POST /products (auth)
- GET  /clients?query=...&limit=...
- POST /clients (auth)
- POST /orders (auth) → create + compute totals
- GET  /orders?limit=20&page=1 (auth)
- GET  /orders/:id (auth)
- DELETE /orders/:id (auth) → cancel order

Notes
- Money is stored in cents (integers).
- Orders snapshot product name/code/unit price at the time of sale.
- Simple per-process SQLite DB at DB_PATH (.env). For production, switch to Postgres.

