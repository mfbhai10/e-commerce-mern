import apiClient from "./api/apiClient";

const categoryService = {
  getCategories: (params) => apiClient.get("/categories", { params }),
  getCategoryById: (id) => apiClient.get(`/categories/${id}`),
  createCategory: (payload) => apiClient.post("/categories", payload),
  updateCategory: (id, payload) => apiClient.put(`/categories/${id}`, payload),
  deleteCategory: (id) => apiClient.delete(`/categories/${id}`),
};

export default categoryService;
