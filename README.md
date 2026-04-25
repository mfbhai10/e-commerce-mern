# E-Commerce Backend Boilerplate (Express + MongoDB + JWT)

Production-ready Node.js backend boilerplate using:

- Express.js
- MongoDB with Mongoose
- JWT authentication
- MVC + Service architecture

## Project Structure

```text
.
├── .env
├── .env.example
├── .gitignore
├── package.json
├── README.md
├── server.js
└── src
    ├── app.js
    ├── config
    │   ├── db.js
    │   └── env.js
    ├── controllers
    │   └── auth.controller.js
    ├── middlewares
    │   ├── auth.middleware.js
    │   ├── error.middleware.js
    │   └── notFound.middleware.js
    ├── models
    │   └── user.model.js
    ├── routes
    │   └── auth.routes.js
    ├── services
    │   └── auth.service.js
    └── utils
        ├── ApiError.js
        ├── asyncHandler.js
        └── generateToken.js
```

## Quick Start

1. Install dependencies:

```bash
npm install
```

2. Configure env values in `.env`.

3. Run in development:

```bash
npm run dev
```

4. Run in production mode:

```bash
npm start
```

## API Endpoints

- `GET /health`
- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `GET /api/v1/auth/me` (protected)
- `GET /api/v1/auth/admin-check` (protected + admin)
- `POST /api/v1/payments/sslcommerz/session/:orderId` (protected)
- `GET /api/v1/payments/sslcommerz/redirect/:orderId` (protected)
- `POST|GET /api/v1/payments/sslcommerz/success`
- `POST|GET /api/v1/payments/sslcommerz/fail`
- `POST|GET /api/v1/payments/sslcommerz/cancel`

## Notes

- JWT is expected via `Authorization: Bearer <token>`.
- Passwords are hashed with bcrypt before persistence.
- Errors are centralized in `error.middleware.js` with production-safe output.
- COD is supported by setting `payment.method = "cod"` during order creation.
- SSLCommerz is supported by creating a session for an order and redirecting users to the gateway URL.

## Payment Configuration

Set these values in `.env` for SSLCommerz:

```bash
FRONTEND_BASE_URL=http://localhost:3000
BACKEND_BASE_URL=http://localhost:5000
SSLCOMMERZ_STORE_ID=your_store_id
SSLCOMMERZ_STORE_PASSWORD=your_store_password
SSLCOMMERZ_IS_LIVE=false
# Optional overrides
SSLCOMMERZ_INIT_URL=
SSLCOMMERZ_VALIDATION_URL=
```

## Payment Flow

1. Create order with `payment.method = "sslcommerz"` (or `"cod"` for cash on delivery).
2. Call `POST /api/v1/payments/sslcommerz/session/:orderId` to initialize gateway session.
3. Redirect user to `data.paymentUrl` (or use `GET /api/v1/payments/sslcommerz/redirect/:orderId`).
4. SSLCommerz calls success/fail/cancel callback URLs.
5. Backend validates successful transactions with SSLCommerz validator API and updates `order.payment.status` and `order.status` securely.
