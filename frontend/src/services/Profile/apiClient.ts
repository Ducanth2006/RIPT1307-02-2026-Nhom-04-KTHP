import axiosInstance from "../../utils/axiosConfig";
import ip from "../../utils/ip";
import type { IProfileResponse, IUpdateProfileRequest, IChangePasswordRequest } from "./typing";

export const getProfile = (userId: number) => {
  return axiosInstance.get<IProfileResponse>(`${ip}/profile`, { params: { userId } });
};

export const updateProfile = (data: IUpdateProfileRequest) => {
  return axiosInstance.put(`${ip}/profile`, data);
};

export const changePassword = (data: IChangePasswordRequest) => {
  return axiosInstance.patch(`${ip}/profile/change-password`, data);
};
