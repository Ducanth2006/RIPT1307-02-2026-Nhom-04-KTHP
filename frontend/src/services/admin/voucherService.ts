import axiosInstance from "../../utils/axiosConfig";
import ip from "../../utils/ip";

const BASE_URL = `${ip}/admin/vouchers`;

// ============================
// Lấy danh sách voucher (kèm used_count)
// ============================
export const getAdminVouchers = async () => {
  const response = await axiosInstance.get(BASE_URL);
  return response.data;
};

// ============================
// Lấy thống kê tổng quan voucher
// ============================
export const getAdminVoucherStats = async () => {
  const response = await axiosInstance.get(`${BASE_URL}/stats`);
  return response.data;
};

// ============================
// Lấy chi tiết voucher theo ID
// ============================
export const getAdminVoucherById = async (id: number | string) => {
  const response = await axiosInstance.get(`${BASE_URL}/${id}`);
  return response.data;
};

// ============================
// Tạo voucher mới
// ============================
export const createAdminVoucher = async (data: {
  code: string;
  description?: string;
  discountType: string;
  discountValue: number;
  maxDiscount?: number | null;
  minOrderValue?: number;
  usageLimit: number;
  startDate?: string;
  endDate?: string;
  isActive?: boolean;
}) => {
  const response = await axiosInstance.post(BASE_URL, data);
  return response.data;
};

// ============================
// Cập nhật voucher
// ============================
export const updateAdminVoucher = async (id: number | string, data: {
  code?: string;
  description?: string;
  discountType?: string;
  discountValue?: number;
  maxDiscount?: number | null;
  minOrderValue?: number;
  usageLimit?: number;
  startDate?: string | null;
  endDate?: string | null;
  isActive?: boolean;
}) => {
  const response = await axiosInstance.put(`${BASE_URL}/${id}`, data);
  return response.data;
};

// ============================
// Xóa voucher
// ============================
export const deleteAdminVoucher = async (id: number | string) => {
  const response = await axiosInstance.delete(`${BASE_URL}/${id}`);
  return response.data;
};

// ============================
// Toggle trạng thái voucher (Active <-> Disabled)
// ============================
export const toggleAdminVoucherStatus = async (id: number | string) => {
  const response = await axiosInstance.patch(`${BASE_URL}/${id}/toggle`);
  return response.data;
};
