import apiClient from "../../utils/axiosConfig";
import type { Auth } from "./typing";

export const login = async (data: Auth.ILoginResponse) => {
  return apiClient.post<Auth.ILoginResponse>("/auth/login", data);
};

export const register = async (data: Auth.IRegisterResponse) => {
  return apiClient.post<Auth.IRegisterResponse>("/auth/register", data);
};

export const getProfile = async () => {
  return apiClient.get<{ data: Auth.IUser }>("/auth/profile");
};

export const logout = () => {
  localStorage.removeItem("token");
  window.location.href = "/login";
};
