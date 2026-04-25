import apiClient from "./api/apiClient";

const authService = {
  register: (payload) => apiClient.post("/auth/register", payload),
  login: (payload) => apiClient.post("/auth/login", payload),
  getMe: () => apiClient.get("/auth/me"),
};

export default authService;
