import axiosInstance from '../utils/axiosConfig';
import ip from '../utils/ip';

const BASE_URL = `${ip}/admin/settings`;

// ============================
// Lấy cấu hình hệ thống
// ============================
export const layCauHinh = async () => {
  const response = await axiosInstance.get(BASE_URL);
  return response.data;
};

// ============================
// Cập nhật cấu hình hệ thống
// ============================
export const capNhatCauHinh = async (data: any) => {
  const response = await axiosInstance.put(
    BASE_URL,
    data,
  );

  return response.data;
};

// ============================
// Kiểm tra SMTP
// ============================
export const kiemTraSMTP = async () => {
  const response = await axiosInstance.post(
    `${BASE_URL}/test-smtp`,
  );

  return response.data;
};

// ============================
// Flush Redis Cache
// ============================
export const flushRedisCache = async () => {
  const response = await axiosInstance.post(
    `${BASE_URL}/clear-cache`,
  );

  return response.data;
};