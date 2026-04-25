import apiClient from "./api/apiClient";

const paymentService = {
  createSslCommerzSession: (orderId) =>
    apiClient.post(`/payments/sslcommerz/session/${orderId}`),
};

export default paymentService;
