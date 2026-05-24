import axiosInstance from "../utils/axiosConfig";
import ip from "../utils/ip";

const BASE_URL = `${ip}/admin/users`;

// 1. Lấy danh sách toàn bộ người dùng
export const getAdminUsers = async () => {
  const response = await axiosInstance.get(BASE_URL);
  return response.data; // Trả về dạng { message: "...", data: User[] }
};

// 2. Thêm mới tài khoản người dùng
export const createAdminUser = async (data: { name: string; email: string; role: string; password?: string }) => {
  const response = await axiosInstance.post(BASE_URL, data);
  return response.data;
};

// 3. Cập nhật thông tin tài khoản người dùng
export const updateAdminUser = async (id: string | number, data: { name: string; email: string; role: string }) => {
  const response = await axiosInstance.put(`${BASE_URL}/${id}`, data);
  return response.data;
};

// 4. Khóa hoặc Mở khóa tài khoản người dùng
export const toggleAdminUserLock = async (id: string | number, isLocked: boolean) => {
  const response = await axiosInstance.patch(`${BASE_URL}/${id}/status`, { isLocked });
  return response.data;
};

// 5. Thu hồi tất cả phiên đăng nhập (JWT Blacklist)
export const revokeAdminUserTokens = async (id: string | number) => {
  const response = await axiosInstance.post(`${BASE_URL}/${id}/revoke`);
  return response.data;
};

// 6. Xóa tài khoản người dùng
export const deleteAdminUser = async (id: string | number) => {
  const response = await axiosInstance.delete(`${BASE_URL}/${id}`);
  return response.data;
};

