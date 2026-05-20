import axiosInstance from "../../utils/axiosConfig";
import ip from "../../utils/ip";
import type { Cart } from "./typing";

const BASE_URL = `${ip}/cart`;

/**
 * Lấy danh sách sản phẩm trong giỏ hàng
 */
export function getCart(userId: number) {
  return axiosInstance.get<Cart.IGetCartResponse>(BASE_URL, { params: { userId } });
}

/**
 * Thêm sản phẩm vào giỏ hàng
 */
export function addToCartApi(data: Cart.IAddToCartRequest) {
  return axiosInstance.post<Cart.ICommonResponse>(`${BASE_URL}/items`, data);
}

/**
 * Cập nhật số lượng sản phẩm
 */
export function updateCartItemApi(itemId: number, quantity: number) {
  return axiosInstance.put<Cart.ICommonResponse>(`${BASE_URL}/items/${itemId}`, { quantity });
}

/**
 * Xóa sản phẩm khỏi giỏ hàng
 */
export function removeCartItemApi(itemId: number) {
  return axiosInstance.delete<Cart.ICommonResponse>(`${BASE_URL}/items/${itemId}`);
}

export default axiosInstance;
