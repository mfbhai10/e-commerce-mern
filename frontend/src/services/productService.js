import apiClient from "./api/apiClient";

const productService = {
  getProducts: (params) => apiClient.get("/products", { params }),
  getProductById: (id) => apiClient.get(`/products/${id}`),
  createProduct: (payload) => apiClient.post("/products", payload),
  updateProduct: (id, payload) => apiClient.put(`/products/${id}`, payload),
  deleteProduct: (id) => apiClient.delete(`/products/${id}`),
};

export default productService;
