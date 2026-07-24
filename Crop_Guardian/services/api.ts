// services/api.ts
import { useAuthStore } from "@/stores/authStore";
import axios, { AxiosRequestConfig } from "axios";

declare module "axios" {
  export interface AxiosRequestConfig {
    skipAuthLogoutOn401?: boolean;
  }
}

const API = axios.create({
  baseURL: "https://crop-disease-backend-2scb.onrender.com",
  timeout: 30000,
});

export const EXPO_PUBLIC_GHANANLP_API_KEY = "68e2f83286364d16b1898c4a686ba5ac";

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
    const requestConfig = error?.config as AxiosRequestConfig | undefined;
    const shouldSkipLogout = requestConfig?.skipAuthLogoutOn401 === true;

    if (error?.response?.status === 401 && !shouldSkipLogout) {
      useAuthStore.getState().logout();
    }
    return Promise.reject(error);
  },
);

export async function forgotPassword(phoneNumber: string) {
  const response = await API.post("/api/auth/forgot-password", {
    phoneNumber,
  });
  return response.data;
}

export async function verifyResetOtp(phoneNumber: string, otp: string) {
  const response = await API.post("/api/auth/verify-reset-otp", {
    phoneNumber,
    otp,
  });
  return response.data;
}

export async function resetPassword(resetToken: string, newPassword: string) {
  const response = await API.post("/api/auth/reset-password", {
    resetToken,
    newPassword,
  });
  return response.data;
}

export default API;
