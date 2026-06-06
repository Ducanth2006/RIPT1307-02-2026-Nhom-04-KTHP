export interface IShippingAddress {
  fullName: string;
  phone: string;
  address: string;
  timeline?: Record<string, string>;
}

export interface ICreateOrderRequest {
  userId: number;
  shippingAddress: IShippingAddress;
  paymentMethod: string;
  voucherCode?: string;
  cartItemIds?: number[];
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
  status: "Pending" | "Confirmed" | "Packing" | "Shipping" | "Completed" | "Cancelled" | "CancelRequested";
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
