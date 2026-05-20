import axiosInstance from "../../utils/axiosConfig";
import ip from "../../utils/ip";
import type { Notification } from "./typing";

const BASE_URL = `${ip}/notifications`;

/**
 * Lấy danh sách thông báo của user
 */
export function getNotificationsApi(userId: number, page: number = 1, limit: number = 20) {
  return axiosInstance.get<Notification.IGetNotificationsResponse>(BASE_URL, {
    params: { userId, page, limit },
  });
}

/**
 * Đánh dấu tất cả thông báo là đã đọc
 */
export function readAllNotificationsApi(userId: number) {
  return axiosInstance.patch<Notification.ICommonResponse>(`${BASE_URL}/read-all`, { userId });
}

/**
 * Đánh dấu 1 thông báo là đã đọc
 */
export function readNotificationApi(id: number, userId: number) {
  return axiosInstance.patch<Notification.ICommonResponse>(`${BASE_URL}/${id}/read`, { userId });
}

export default axiosInstance;
