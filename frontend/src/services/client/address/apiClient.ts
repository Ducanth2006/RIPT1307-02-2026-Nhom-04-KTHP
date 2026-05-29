import axiosInstance from "../../../utils/axiosConfig";
import ip from "../../../utils/ip";
import type { IAddress, ICreateAddressRequest, IUpdateAddressRequest } from "./typing";

const BASE_URL = `${ip}/addresses`;

/**
 * Lấy danh sách địa chỉ giao hàng của user
 */
export function getAddresses(userId: number) {
  return axiosInstance.get<{ message: string; data: IAddress[] }>(BASE_URL, {
    params: { userId },
  });
}

/**
 * Thêm địa chỉ giao hàng mới
 */
export function createAddress(data: ICreateAddressRequest) {
  return axiosInstance.post<{ message: string; data: IAddress }>(BASE_URL, data);
}

/**
 * Cập nhật địa chỉ giao hàng
 */
export function updateAddress(id: number, data: IUpdateAddressRequest) {
  return axiosInstance.put<{ message: string; data: IAddress }>(`${BASE_URL}/${id}`, data);
}

/**
 * Xóa địa chỉ giao hàng
 */
export function deleteAddress(id: number, userId: number) {
  return axiosInstance.delete<{ message: string }>(`${BASE_URL}/${id}`, {
    params: { userId },
  });
}

/**
 * Đặt làm địa chỉ giao hàng mặc định
 */
export function setDefaultAddress(id: number, userId: number) {
  return axiosInstance.patch<{ message: string }>(`${BASE_URL}/${id}/default`, { userId });
}
