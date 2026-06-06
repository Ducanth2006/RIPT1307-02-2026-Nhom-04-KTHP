import axiosInstance from "../../../utils/axiosConfig";
import ip from "../../../utils/ip";
import type { IVouchersResponse } from "./typing";

const BASE_URL = `${ip}/vouchers`;

export function getVouchers() {
  return axiosInstance.get<IVouchersResponse>(BASE_URL);
}

export function getVoucherByCode(code: string) {
  return axiosInstance.get(`${BASE_URL}/${code}`);
}

export function validateVoucher(code: string, orderTotal: number) {
  return axiosInstance.post(`${BASE_URL}/validate`, { code, orderTotal });
}
