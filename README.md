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

## Notes

- JWT is expected via `Authorization: Bearer <token>`.
- Passwords are hashed with bcrypt before persistence.
- Errors are centralized in `error.middleware.js` with production-safe output.
