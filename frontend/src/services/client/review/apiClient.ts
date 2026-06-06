import axiosInstance from "../../../utils/axiosConfig";
import ip from "../../../utils/ip";
import type { IReviewResponse, ICreateReviewRequest, ICreateReviewResponse, IReview } from "./typing";

export function getProductReviewsApi(productId: string | number, params?: { page?: number; limit?: number }) {
  return axiosInstance.get<IReviewResponse>(`${ip}/reviews/product/${productId}`, { params });
}

export function getMyReviewsApi(userId: number) {
  return axiosInstance.get<{ data: IReview[] }>(`${ip}/reviews/my`, { params: { userId } });
}

export function createReviewApi(data: ICreateReviewRequest) {
  return axiosInstance.post<ICreateReviewResponse>(`${ip}/reviews`, data);
}
