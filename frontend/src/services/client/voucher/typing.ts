export interface IVoucher {
  id: number;
  code: string;
  discount_type: string;
  discount_value: number;
  min_order_value: number;
  max_discount: number;
  quantity: number;
  start_date: string;
  end_date: string;
  status: string;
}

export interface IVouchersResponse {
  message: string;
  data: IVoucher[];
}
