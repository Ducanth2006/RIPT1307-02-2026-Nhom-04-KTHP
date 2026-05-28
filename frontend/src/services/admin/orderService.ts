import axiosInstance from "../../utils/axiosConfig";
import ip from "../../utils/ip";

const BASE_URL = `${ip}/admin/orders`;

export const getAdminOrderStats = async () => {
  const response = await axiosInstance.get(`${BASE_URL}/stats`);
  return response.data;
};

export const getAdminOrders = async () => {
  const response = await axiosInstance.get(BASE_URL);
  return response.data;
};

export const getAdminOrderById = async (id: number | string) => {
  const response = await axiosInstance.get(`${BASE_URL}/${id}`);
  return response.data;
};

export const updateAdminOrderStatus = async (id: number | string, status: string) => {
  const response = await axiosInstance.patch(`${BASE_URL}/${id}/status`, { status });
  return response.data;
};
