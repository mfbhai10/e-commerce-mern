# Frontend Integration Guide

This frontend is connected to the Node.js backend through Axios service modules, JWT token persistence, protected routing, and cart state synced to backend product/order APIs.

## API Base URL

Set the backend URL in `.env`:

```bash
VITE_API_BASE_URL=http://localhost:5000/api/v1
```

## Axios API Integration

Main client: `src/services/api/apiClient.js`

- Centralized `baseURL`
- Auto-attaches `Authorization: Bearer <token>`
- Supports JSON and `FormData` payloads (for product image upload)
- Clears token on `401 Unauthorized`

Example service calls:

```js
// src/services/productService.js
productService.getProducts({ page: 1, limit: 12, status: "active" });
productService.getProductById(productId);
productService.createProduct(formData); // admin

// src/services/orderService.js
orderService.createOrder(payload); // authenticated user
orderService.getMyOrders({ page: 1, limit: 10 });

// src/services/categoryService.js
categoryService.getCategories({ isActive: true, limit: 50 });
categoryService.createCategory(payload); // admin
```

## JWT Token Storage

Token helper: `src/utils/authStorage.js`

- `setToken(token)` on login/register
- `getToken()` for Axios request interceptor
- `clearToken()` on logout or `401`
- `hasToken()` for route guards

## Protected Routes

- Authenticated route guard: `src/routes/ProtectedRoute.jsx`
- Admin-only route guard: `src/routes/AdminRoute.jsx`

Routing usage:

- `/checkout` is wrapped with `ProtectedRoute`
- `/admin/*` is wrapped with `AdminRoute`

## Cart Functionality

Cart helper: `src/utils/cartStorage.js`

- Stores cart in `localStorage`
- Emits `cart-updated` events on mutations
- Cart and checkout pages fetch current product details from backend using stored `productId`s
- Checkout sends live order payload to backend `POST /orders`

## Auth Flow

1. User logs in or registers.
2. Backend returns `token` and `user`.
3. Frontend stores token via `setToken`.
4. Axios includes token in all protected API requests.
5. Guards (`ProtectedRoute`/`AdminRoute`) call `/auth/me` to validate session and role.
6. If token is invalid/expired, interceptor clears token and user is redirected via guards.

## Error Handling

Pattern used across pages:

```js
try {
  const response = await productService.getProducts({ limit: 12 });
  setProducts(response.data.data.products || []);
} catch (error) {
  setError(error?.response?.data?.message || "Unable to load products.");
}
```

UI behavior:

- API errors are shown in `status-card status-card--error`
- Loading states render clear status cards
- Empty API responses render explicit empty-state sections
