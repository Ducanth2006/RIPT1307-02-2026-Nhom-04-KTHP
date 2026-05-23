import axiosInstance from "../../utils/axiosConfig";
import ip from "../../utils/ip";
import type {
  IComplaintsResponse,
  IComplaintDetailResponse,
  ICreateComplaintRequest,
} from "./typing";

const BASE_URL = `${ip}/complaints`;

/**
 * Tạo khiếu nại/phản hồi mới
 */
export function createComplaint(data: ICreateComplaintRequest) {
  return axiosInstance.post(BASE_URL, data);
}

/**
 * Lấy danh sách khiếu nại của user
 */
export function getComplaints(userId: number) {
  return axiosInstance.get<IComplaintsResponse>(BASE_URL, {
    params: { userId },
  });
}

/**
 * Xem chi tiết 1 khiếu nại
 */
export function getComplaintById(id: number, userId: number) {
  return axiosInstance.get<IComplaintDetailResponse>(`${BASE_URL}/${id}`, {
    params: { userId },
  });
}
