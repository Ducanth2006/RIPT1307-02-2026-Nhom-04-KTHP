import axiosInstance from "../utils/axiosConfig";
import ip from "../utils/ip";

const BASE_URL = `${ip}/admin/complaints`;

// ============================
// Lấy danh sách khiếu nại
// ============================
export const getAdminComplaints = async () => {
  const response = await axiosInstance.get(BASE_URL);
  return response.data;
};

// ============================
// Lấy chi tiết khiếu nại theo ID
// ============================
export const getAdminComplaintById = async (
  id: number | string
) => {
  const response = await axiosInstance.get(
    `${BASE_URL}/${id}`
  );

  return response.data;
};

// ============================
// Xác nhận khiếu nại
// ============================
export const confirmAdminComplaint = async (
  id: number | string
) => {
  const response = await axiosInstance.patch(
    `${BASE_URL}/${id}/confirm`
  );

  return response.data;
};

// ============================
// Gửi phản hồi khiếu nại
// ============================
export const replyAdminComplaint = async (
  id: number | string,
  data: {
    reply: string;
  }
) => {
  const response = await axiosInstance.patch(
    `${BASE_URL}/${id}/reply`,
    data
  );

  return response.data;
};