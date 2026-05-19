import axiosInstance from "../../utils/axiosConfig";
import ip from "../../utils/ip";

const BASE_URL = `${ip}/cart`;

/**
 * Lấy danh sách sản phẩm trong giỏ hàng
 */
export function getCart() {
  return axiosInstance.get(BASE_URL);
}

/**
 * Thêm sản phẩm vào giỏ hàng
 */
export function addToCartApi(data: { product_id: number; variant_id: number; quantity: number }) {
  return axiosInstance.post(`${BASE_URL}/add`, data);
}

/**
 * Cập nhật số lượng sản phẩm
 */
export function updateCartItemApi(id: number, quantity: number) {
  return axiosInstance.put(`${BASE_URL}/update/${id}`, { quantity });
}

/**
 * Xóa sản phẩm khỏi giỏ hàng
 */
export function removeCartItemApi(id: number) {
  return axiosInstance.delete(`${BASE_URL}/remove/${id}`);
}

/**
 * Xóa toàn bộ giỏ hàng
 */
export function clearCartApi() {
  return axiosInstance.delete(`${BASE_URL}/clear`);
}

export default axiosInstance;
