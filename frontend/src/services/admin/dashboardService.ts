import axiosInstance from "../../utils/axiosConfig";
import ip from "../../utils/ip";

const BASE_URL = `${ip}/admin/dashboard`;

export const getAdminDashboardStats = async (chartMonth?: string) => {
  const params: Record<string, string> = {};
  if (chartMonth) {
    params.chartMonth = chartMonth;
  }
  const response = await axiosInstance.get(`${BASE_URL}/stats`, { params });
  return response.data;
};
