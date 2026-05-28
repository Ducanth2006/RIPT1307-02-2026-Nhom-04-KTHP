import apiClient from "../../../utils/axiosConfig";
import ip from "../../../utils/ip";
import type { Auth } from "./typing";

export const login = async (data: Auth.ILoginRequest) => {
  return apiClient.post<Auth.ILoginResponse>(`${ip}/auth/login`, data);
};

export const loginGoogle = async (token: string) => {
  return apiClient.post<Auth.ILoginResponse>(`${ip}/auth/google`, { token });
};

export const loginFacebook = async (token: string) => {
  return apiClient.post<Auth.ILoginResponse>(`${ip}/auth/facebook`, { token });
};

export const register = async (data: Auth.IRegisterRequest) => {
  return apiClient.post<Auth.IRegisterResponse>(`${ip}/auth/register`, data);
};

export const getProfile = async () => {
  return apiClient.get<{ data: Auth.IUser }>(`${ip}/auth/profile`);
};

export const logout = async () => {
  try {
    await apiClient.post(`${ip}/auth/logout`);
  } catch (error) {
    console.error("Logout API error:", error);
  } finally {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/login";
  }
};
