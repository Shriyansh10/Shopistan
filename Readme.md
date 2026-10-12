<!--
Journal — Readme.md
Before: project README — overview, features, stack, project layout, local setup (MongoDB, server, dataset seed,
  client), environment variables, admin access, how auth / orders / prices / search work, API table, limitations.
2026-10-12 (Claude): Added the live links (site, API, health check) and a Deployment section (Vercel, Render +
  Docker, MongoDB Atlas, DNS on one domain, Razorpay webhook, Resend). Server env table now lists CLIENT_URL,
  EMAIL_FROM and OTP_DEV_RECIPIENT, and notes PORT. Removed design/ from the layout (it isn't in the repo).
2026-10-13 (Claude): Added the demo video link (Google Drive) next to the live links.
-->

# Shopistan

An e-commerce store built from scratch: a React storefront and an Express + MongoDB API. Shoppers browse departments, search products, keep a wishlist and cart, check out with cash on delivery or Razorpay, and track their orders. Admins manage the catalog and process orders from the same app.

The catalog comes from a real dataset (Amazon products, 2023), so there are thousands of products to browse and search instead of a handful of placeholders.

**Live:** [shopistan.space](https://shopistan.space) · API: [api.shopistan.space](https://api.shopistan.space/api/health) (`/api/health` returns "Server is healthy")

**Demo video:** [watch the walkthrough](https://drive.google.com/file/d/1gQa-rtZ6G3UIVM7qviKbfBanrTFiCPdJ/view) (features, APIs, database, auth flow and deployment)

The API runs on Render's free tier, which sleeps when idle, so the first request after a quiet spell can take up to a minute.

## What it does

**Shoppers**
- Sign up with email + password, verified by a one-time code sent by email
- Browse by department and category, 12 products at a time
- Search products by name (`iphone` also finds "iPhones", "iPhone 15 Pro", …), then narrow results by price, rating and discount
- Product pages with reviews (one review per user) and "More from this category"
- Wishlist and cart (the cart count shows in the header)
- Checkout with a shipping address and cash on delivery, UPI or card
- Order history and order details, with "Complete payment" for unpaid online orders

**Admins**
- Add, edit and delete products from the storefront itself (an image is a pasted link)
- Admin dashboard at `/admin`: every user with their order count and total spent, and their orders
- Move orders through `pending → confirmed → shipped → delivered` (or `cancelled`) and update payment status (`paid`, `refunded`, …). Only valid changes are allowed

## Stack

| | |
|---|---|
| Client | React 19, TypeScript, Vite, Tailwind CSS 4, React Router, React Hook Form + Zod, Axios |
| Server | Node 22, Express 5, TypeScript, Mongoose 9, Zod |
| Database | MongoDB (Docker Compose file included) |
| Auth | JWT access + refresh tokens in httpOnly cookies, bcrypt, email OTP via Resend |
| Payments | Razorpay, or a built-in mock gateway for local development |

## Project layout

```
Shopistan/
├── Client/                  React app
│   └── src/
│       ├── app/             pages, grouped by access: (auth), (public), (protected), (admin)
│       ├── components/      Header, ProductCard, filters, route guards, modals…
│       ├── context/         login state and cart count
│       ├── services/        one file per API area (auth, cart, order, admin…)
│       ├── schemas/         Zod schemas for forms
│       └── lib/             axios instance, formatting, small helpers
└── Server/                  Express API
    ├── src/
    │   ├── routes/          URL → middleware → controller
    │   ├── controllers/     read the request, call a service, send the response
    │   ├── services/        business logic and database queries
    │   ├── models/          Mongoose schemas
    │   ├── dto/             Zod schemas for request bodies and query strings
    │   ├── middleware/      auth, admin check, validation, error handler
    │   ├── utils/           errors, responses, JWT, pagination, prices
    │   └── scripts/         dataset seeder and one-off maintenance scripts
    ├── Data/amazon/         dataset CSVs (not committed, see below)
    ├── Dockerfile           production image (used by Render)
    └── docker-compose.yml   local MongoDB + a web UI for it
```

Every request on the server goes the same way: **route → middleware (auth, validation) → controller → service → model**. Errors are thrown as typed `ApiError`s and turned into JSON by one error handler, so every response has the same shape:

```json
{ "success": true,  "message": "Orders fetched successfully", "data": { … } }
{ "success": false, "message": "Validation failed: price - Too small", "errors": [ … ] }
```

## Running it locally

You need Node 22+, pnpm and Docker (or any MongoDB you can connect to).

**1. Start MongoDB**

```bash
cd Server
docker compose up -d        # MongoDB on :27017, web UI on http://localhost:3300
```

**2. Configure and start the server**

```bash
cd Server
cp .env.example .env        # then fill it in (see below)
pnpm install
pnpm dev                    # compiles and restarts on change; API on http://localhost:8080
```

**3. Load products**

Download the [Amazon Products Dataset 2023 (1.4M products)](https://www.kaggle.com/datasets/asaniczka/amazon-products-dataset-2023-1-4m-products) from Kaggle and put `amazon_products.csv` and `amazon_categories.csv` in `Server/Data/amazon/`. Then:

```bash
pnpm seed:amazon                                  # 50,000 products by default
node dist/scripts/seed-amazon.js --limit 0        # everything
node dist/scripts/seed-amazon.js --per-category 200
```

The seeder creates departments, categories and products, and is safe to re-run (products are upserted by ASIN).

**4. Start the client**

```bash
cd Client
cp .env.example .env
pnpm install
pnpm dev                    # http://localhost:5173
```

### Environment variables

**Server (`Server/.env`)**

| Variable | What it's for |
|---|---|
| `port`, `domain`, `mode` | where the server listens (hosts like Render set `PORT`, which wins); `mode=production` turns on secure cookies and removes the mock gateway |
| `CLIENT_URL` | the one address allowed to call the API from a browser (CORS), e.g. `http://localhost:5173` or `https://shopistan.space` |
| `MONGODB_URI` | e.g. `mongodb://localhost:27017/shopistan` |
| `RESEND_API_KEY` | sends the sign-up verification codes |
| `EMAIL_FROM` | OTP sender on a domain verified in Resend, e.g. `Shopistan <no-reply@shopistan.space>`; empty uses Resend's test sender |
| `OTP_DEV_RECIPIENT` | local development only: every OTP goes to this address (Resend's test sender can only mail your own account). Leave unset in production |
| `ACCESS_TOKEN_SECRET`, `ACCESS_TOKEN_EXPIRATION` | access token, e.g. `15m` |
| `REFRESH_TOKEN_SECRET`, `REFRESH_TOKEN_EXPIRATION` | refresh token, e.g. `7d` |
| `PAYMENT_PROVIDER` | `mock` or `razorpay` |
| `PAYMENT_SECRET` | signs mock-gateway payments |
| `RAZORPAY_API_KEY`, `RAZORPAY_API_SECRET` | Razorpay test or live keys |
| `RAZORPAY_WEBHOOK_SECRET` | the secret you set on the webhook in the Razorpay dashboard |

**Client (`Client/.env`)**

| Variable | What it's for |
|---|---|
| `VITE_BACKEND_URL` | the server, e.g. `http://localhost:8080` |
| `VITE_PAYMENT_PROVIDER` | must match `PAYMENT_PROVIDER` on the server |
| `VITE_RAZORPAY_KEY_ID` | Razorpay **public** key id (never the secret) |

### Making yourself an admin

There's no sign-up for admins. Register normally, then set your role in MongoDB and log in again (the role is read into the token at login):

```js
db.users.updateOne({ email_id: "you@example.com" }, { $set: { role: "admin" } })
```

## Deployment

Everything runs on free tiers:

| Part | Where | Address |
|---|---|---|
| Client | Vercel (root directory `Client`, Vite preset) | `https://shopistan.space` (`www` redirects to it) |
| Server | Render web service, built from `Server/Dockerfile` | `https://api.shopistan.space` |
| Database | MongoDB Atlas (free M0 cluster) | connection string in Render's environment |

A few things this setup depends on:
- **One domain for both.** Login cookies are `SameSite=Lax`, so the browser only sends them when the page and the API are on the same site. `shopistan.space` and `api.shopistan.space` are; `*.vercel.app` and `*.onrender.com` aren't, so login only works on the custom domain.
- **DNS** (GoDaddy): an `A` record for the root and a `CNAME` for `www` pointing at Vercel, and a `CNAME` for `api` pointing at the Render service. Both hosts issue HTTPS certificates automatically.
- **Environment.** Render gets the server variables above with `mode=production`, `CLIENT_URL=https://shopistan.space` and `PAYMENT_PROVIDER=razorpay` (no `OTP_DEV_RECIPIENT`). Vercel gets `VITE_BACKEND_URL=https://api.shopistan.space`, `VITE_PAYMENT_PROVIDER=razorpay` and the Razorpay key id. Vite bakes these in at build time, so changing one needs a redeploy.
- **Client routing.** `Client/vercel.json` sends every path to `index.html`, so refreshing `/orders` or a product page works.
- **Razorpay webhook** at `https://api.shopistan.space/api/webhooks/razorpay` for `order.paid` and `payment.failed`, signed with `RAZORPAY_WEBHOOK_SECRET`.
- **Email.** For OTPs to reach any address, the domain has to be verified in Resend (its DKIM and SPF records added to DNS) and `EMAIL_FROM` set on Render. Until then, Resend only delivers to the account owner's address.
- **Data.** Atlas M0 has 512 MB, so it's seeded with a subset (`--per-category 200`) from a laptop by pointing `MONGODB_URI` at Atlas and running the seeder.

Pushing to `main` redeploys both: Render rebuilds the Docker image and Vercel rebuilds the client.

## How the main pieces work

**Login.** Logging in sets two httpOnly cookies: a short-lived access token and a 7-day refresh token. The refresh token is stored hashed on the user. When a request gets a 401, the client's Axios interceptor calls `/auth/refresh-tokens` once and retries; parallel requests share that one refresh. Route guards on the client (`RequireAuth`, `RequireAdmin`) only decide what to show. The server checks the token and role on every protected route.

**Orders and payments.** Placing an order copies the cart into an order: product names and prices are snapshotted, so editing or deleting a product later never changes a past order.
- *Cash on delivery*: the order is confirmed and the cart is cleared right away.
- *UPI / card*: the order waits as `pending` while the server creates a Razorpay order. The browser pays, sends the payment signature back, the server verifies it against the gateway order id it stored, and marks the order paid. A Razorpay webhook does the same thing, so a payment still counts if the user closes the tab before the browser reports back. Both paths only apply once.
- With `PAYMENT_PROVIDER=mock`, a fake gateway screen lets you choose "pay" or "fail" so you can test the flow without Razorpay keys.

**Prices.** Products store a list `price`, a `discount` (%) and the resulting `selling_price`. The selling price is what cards show, what checkout charges and what the price filter uses, so they always agree. Prices are in USD because the dataset is.

**Search.** A MongoDB text index on product names. It matches whole words and handles plurals, and results come back ordered by relevance. Price, rating and discount filters can be added, and the same filters also work on a category listing without a search term.

## API at a glance

All routes are under `/api`. **(login)** means a logged-in user, **(admin)** an admin.

| Area | Routes |
|---|---|
| Auth | `POST /auth/register` · `/send-otp` · `/verify-otp` · `/login` · `/refresh-tokens` · `/logout` · `GET /auth/profile` (login) |
| Storefront | `GET /dashboard/departments` · `/departments/:id/categories` · `/categories/:categoryId/products` · `/products/search?q=` |
| Product | `GET /dashboard/product/:productId` · `/:productId/reviews` · `POST /:productId/reviews` (login) |
| Wishlist (login) | `GET /wishlist` · `GET` / `POST` / `DELETE /wishlist/item/:productId` |
| Cart (login) | `GET /cart` · `GET /cart/count` · `POST` / `PUT` / `DELETE /cart/item/:productId` · `DELETE /cart` |
| Orders (login) | `POST /order` · `GET /order` · `GET /order/:orderId` · `POST /order/:orderId/verify-payment` |
| Payments | `POST /payments/mock/:gatewayOrderId` (development only) · `POST /webhooks/razorpay` |
| Catalog (admin) | `POST /products` · `PUT /products/:id` · `DELETE /products/:id` |
| Admin (admin) | `GET /admin/users` · `GET /admin/users/:userId/orders` · `PATCH /admin/orders/:orderId` |

Lists take `?offset=` and `?limit=` (default 10, max 50) and return one page plus a `total`, which the client uses for "Load more". Filters on product lists: `min_price`, `max_price`, `min_rating`, `min_discount`.

## Known limitations

- Search matches whole words only. `iph` finds nothing; `iphone` does.
- One image per product, added as a link (no uploads).
- No stock tracking, coupons, shipping charges or review moderation yet.
- Admins are created by editing the database (see above).
