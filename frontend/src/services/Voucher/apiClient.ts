import axiosInstance from "../../utils/axiosConfig";
import ip from "../../utils/ip";
import type { IVouchersResponse } from "./typing";

const BASE_URL = `${ip}/vouchers`;

export function getVouchers() {
  return axiosInstance.get<IVouchersResponse>(BASE_URL);
}
