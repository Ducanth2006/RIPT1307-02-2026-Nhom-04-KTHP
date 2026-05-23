export interface IComplaintOrder {
  id: number;
  status: string;
  final_amount: number;
  created_at: string;
}

export interface IComplaint {
  id: number;
  subject: string;
  content: string;
  status: "New" | "In Progress" | "Resolved" | "Closed";
  admin_response: string | null;
  images: string[];
  created_at: string;
  order_id: number;
  orders: IComplaintOrder;
}

export interface IComplaintsResponse {
  message: string;
  data: IComplaint[];
}

export interface IComplaintDetailResponse {
  message: string;
  data: IComplaint;
}

export interface ICreateComplaintRequest {
  userId: number;
  orderId: number;
  subject: string;
  content: string;
  images?: string[];
}
