import axiosInstance from "../../../utils/axiosConfig";
import ip from "../../../utils/ip";

const BASE_URL = `${ip}/chat`;

export interface ISendMessageRequest {
  roomId: number;
  userId: number;
  message_type: 'text' | 'product' | 'image';
  content?: string;
  product_id?: number;
}

export const initClientRoom = async (userId: number) => {
  const response = await axiosInstance.post(`${BASE_URL}/room`, { userId });
  return response.data;
};

export const getClientMessages = async (roomId: number) => {
  const response = await axiosInstance.get(`${BASE_URL}/messages`, {
    params: { roomId }
  });
  return response.data;
};

export const sendClientMessage = async (data: ISendMessageRequest) => {
  const response = await axiosInstance.post(`${BASE_URL}/messages`, data);
  return response.data;
};

export const markClientMessagesRead = async (roomId: number, userId: number) => {
  const response = await axiosInstance.post(`${BASE_URL}/read`, { roomId, userId });
  return response.data;
};
