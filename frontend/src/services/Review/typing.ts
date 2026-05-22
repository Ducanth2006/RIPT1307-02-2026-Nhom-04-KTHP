export interface IReviewUser {
  id: number;
  full_name: string;
  avatar: string | null;
}

export interface IReview {
  id: number;
  rating: number;
  comment: string | null;
  created_at: string;
  users: IReviewUser;
}

export interface IReviewResponse {
  message: string;
  data: IReview[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ICreateReviewRequest {
  userId: number;
  productId: number;
  orderId: number;
  rating: number;
  comment?: string;
}

export interface ICreateReviewResponse {
  message: string;
  data: IReview;
}
