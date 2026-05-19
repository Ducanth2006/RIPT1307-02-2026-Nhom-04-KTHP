export interface IShippingAddress {
  fullName: string;
  phone: string;
  address: string;
}

export interface ICreateOrderRequest {
  userId: number;
  shippingAddress: IShippingAddress;
  paymentMethod: string;
  voucherCode?: string;
}

export interface ICancelOrderRequest {
  userId: number;
  cancelReason: string;
}

export interface IOrderItem {
  id: number;
  productId: number;
  productName: string;
  variantId: number;
  variantSize?: string;
  variantColor?: string;
  imageUrl?: string;
  quantity: number;
  price: number;
}

export interface IOrder {
  id: number;
  userId: number;
  status: "Pending" | "Confirmed" | "Packing" | "Shipping" | "Completed" | "Cancelled";
  totalPrice: number;
  paymentMethod: string;
  paymentStatus: string;
  shippingAddress: IShippingAddress;
  voucherCode?: string;
  voucherDiscount?: number;
  items: IOrderItem[];
  created_at: string;
  cancel_reason?: string;
}

export interface IOrdersResponse {
  data: IOrder[];
}

export interface IOrderDetailResponse {
  data: IOrder;
}
