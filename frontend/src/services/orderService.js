import apiClient from "./api/apiClient";

const orderService = {
  createOrder: (payload) => apiClient.post("/orders", payload),
  getMyOrders: (params) => apiClient.get("/orders/me", { params }),
  getAllOrders: (params) => apiClient.get("/orders", { params }),
  updateOrderStatus: (id, payload) =>
    apiClient.patch(`/orders/${id}/status`, payload),
};

export default orderService;
