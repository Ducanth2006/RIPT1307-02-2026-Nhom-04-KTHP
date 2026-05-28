import axiosInstance from "../../../utils/axiosConfig";
import ip from "../../../utils/ip";
import type { ICategoriesResponse } from "./typing";

const BASE_URL = `${ip}/categories`;

/**
 * Lấy danh sách danh mục (Public)
 */
export function getCategories() {
  return axiosInstance.get<ICategoriesResponse>(BASE_URL);
}
