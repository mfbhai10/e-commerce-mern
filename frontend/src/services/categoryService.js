import apiClient from "./api/apiClient";

const categoryService = {
  getCategories: (params) => apiClient.get("/categories", { params }),
  getCategoryById: (id) => apiClient.get(`/categories/${id}`),
};

export default categoryService;
