import axiosInstance from "../../utils/axiosConfig";
import ip from "../../utils/ip";
import type { Products } from "./typing";

export function getProducts(params?: {
  search?: string;
  brand?: string;
  category_id?: number;
  min_price?: number;
  max_price?: number;
  sortBy?: string;
  order?: string;
  page?: number;
  limit?: number;
}) {
  return axiosInstance.get<Products.IResponse>(`${ip}/products`, { params });
}

export function getProductById(id: string | number) {
  return axiosInstance.get(`${ip}/products/${id}`);
}

export function getNewArrivals() {
  return axiosInstance.get<{ message: string; data: Products.IRecord[] }>(`${ip}/products/new-arrivals`);
}

export function getBestSellingProducts() {
  return axiosInstance.get<{ message: string; data: Products.IRecord[] }>(`${ip}/products/best-sellers`);
}

export function getHomepageCollections() {
  return axiosInstance.get<{ message: string; data: Products.IHomepageCollections }>(`${ip}/products/homepage-collections`);
}

export default axiosInstance;
