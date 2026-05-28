import axiosInstance from "../../utils/axiosConfig";
import ip from "../../utils/ip";

const BASE_URL = `${ip}/admin/products`;

export const getAdminProductStats = async () => {
  const response = await axiosInstance.get(`${BASE_URL}/stats`);
  return response.data;
};

export const getAdminProducts = async () => {
  const response = await axiosInstance.get(BASE_URL);
  return response.data;
};

export const deleteAdminProduct = async (id: number | string) => {
  const response = await axiosInstance.delete(`${BASE_URL}/${id}`);
  return response.data;
};

export const updateAdminProduct = async (id: number | string, data: any) => {
  const response = await axiosInstance.patch(`${BASE_URL}/${id}`, data);
  return response.data;
};

export const createAdminProduct = async (data: any) => {
  const response = await axiosInstance.post(BASE_URL, data);
  return response.data;
};
