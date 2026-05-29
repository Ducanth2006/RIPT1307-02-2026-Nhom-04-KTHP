export interface IAddress {
  id: number;
  userId: number;
  recipient_name: string;
  phone: string;
  address_line: string;
  city: string;
  is_default: boolean;
  created_at?: string;
}

export interface IAddressListResponse {
  message: string;
  data: IAddress[];
}

export interface ICreateAddressRequest {
  userId: number;
  recipient_name: string;
  phone: string;
  address_line: string;
  city: string;
  is_default: boolean;
}

export interface IUpdateAddressRequest {
  userId: number;
  recipient_name: string;
  phone: string;
  address_line: string;
  city: string;
  is_default: boolean;
}
