import axiosInstance from "../../utils/axiosConfig";
import ip from "../../utils/ip";

const BASE_URL = `${ip}/admin/chat`;

export interface ISendAdminMessageRequest {
  roomId: number;
  userId: number;
  role: string;
  message_type: 'text' | 'product' | 'image';
  content?: string;
  product_id?: number;
}

export const getAdminRooms = async () => {
  const response = await axiosInstance.get(`${BASE_URL}/rooms`);
  return response.data;
};

export const getAdminMessages = async (roomId: number, userId: number, role: string) => {
  const response = await axiosInstance.get(`${BASE_URL}/rooms/${roomId}/messages`, {
    params: { userId, role }
  });
  return response.data;
};

export const sendAdminMessage = async (data: ISendAdminMessageRequest) => {
  const response = await axiosInstance.post(`${BASE_URL}/messages`, data);
  return response.data;
};

export const assignStaffToRoom = async (roomId: number, userId: number) => {
  const response = await axiosInstance.put(`${BASE_URL}/rooms/assign`, { roomId, userId });
  return response.data;
};

export const closeChatRoom = async (roomId: number, userId: number, role: string) => {
  const response = await axiosInstance.delete(`${BASE_URL}/rooms/${roomId}`, {
    data: { userId, role }
  });
  return response.data;
};

export const markAdminMessagesRead = async (roomId: number, userId: number) => {
  const response = await axiosInstance.post(`${BASE_URL}/read`, { roomId, userId });
  return response.data;
};
