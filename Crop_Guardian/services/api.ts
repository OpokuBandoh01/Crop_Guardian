import { useAuthStore } from "@/stores/authStore";
import axios from "axios";

const API = axios.create({
  baseURL: "https://crop-disease-backend-2scb.onrender.com",
  timeout: 30000,
});

API.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

API.interceptors.response.use(
  (response) => response,
  (error: any) => {
    if (error?.response?.status === 401) {
      console.log("Calling logout from api.ts since error === 404");
      useAuthStore.getState().logout();
    }
    return Promise.reject(error);
  },
);

export default API;
