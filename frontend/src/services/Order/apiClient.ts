import axiosInstance from "../../utils/axiosConfig";
import ip from "../../utils/ip";
import type { IOrdersResponse, ICreateOrderRequest, IOrderDetailResponse, ICancelOrderRequest } from "./typing";

const BASE_URL = `${ip}/orders`;

/**
 * Lấy lịch sử đơn hàng của cá nhân
 */
export function getOrders(userId: number) {
  return axiosInstance.get<IOrdersResponse>(BASE_URL, { params: { userId } });
}

/**
 * Đặt hàng (Checkout)
 */
export function createOrder(data: ICreateOrderRequest) {
  return axiosInstance.post(BASE_URL, data);
}

/**
 * Xem chi tiết lộ trình và trạng thái đơn hàng
 */
export function getOrderById(id: number, userId: number) {
  return axiosInstance.get<IOrderDetailResponse>(`${BASE_URL}/${id}`, { params: { userId } });
}

/**
 * Hủy đơn hàng (User)
 */
export function cancelOrder(id: number, data: ICancelOrderRequest) {
  return axiosInstance.patch(`${BASE_URL}/${id}/cancel`, data);
}
