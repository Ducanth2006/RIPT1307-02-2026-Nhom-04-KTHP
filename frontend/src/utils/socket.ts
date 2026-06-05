import { io } from 'socket.io-client';
import { ipRoot } from './ip';

// Lấy base URL của backend từ ipRoot (loại bỏ phần '/api' ở cuối nếu có)
const SOCKET_URL = ipRoot.endsWith('/api') ? ipRoot.slice(0, -4) : ipRoot;

export const socket = io(SOCKET_URL, {
  autoConnect: true,
  transports: ['websocket', 'polling']
});
