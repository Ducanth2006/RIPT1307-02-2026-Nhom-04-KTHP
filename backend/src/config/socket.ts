import { Server } from 'socket.io';
import type { Server as HTTPServer } from 'http';

let io: Server | null = null;

export const initSocket = (server: HTTPServer) => {
    io = new Server(server, {
        cors: {
            origin: [
                'http://localhost:5173',
                'http://localhost:5174',
                'http://localhost:3000',
                'https://clothingstore-backend-oa20.onrender.com'
            ],
            methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
            credentials: true
        }
    });

    io.on('connection', (socket) => {
        console.log(`🔌 Thiết bị kết nối mới: ${socket.id}`);

        // Đăng ký thiết bị vào phòng cụ thể (User room hoặc Admin room)
        socket.on('join', (data: { userId?: number; role?: string }) => {
            if (data.userId) {
                const roomName = `user:${data.userId}`;
                socket.join(roomName);
                console.log(`👤 User ${data.userId} đã tham gia phòng: ${roomName}`);
            }
            if (data.role === 'admin' || data.role === 'Admin' || data.role === 'Staff' || data.role === 'staff') {
                socket.join('admins');
                console.log(`👑 Admin/Staff đã tham gia phòng: admins`);
            }
        });

        socket.on('disconnect', () => {
            console.log(`🔌 Thiết bị ngắt kết nối: ${socket.id}`);
        });
    });

    return io;
};

export const getIO = (): Server => {
    if (!io) {
        throw new Error('Socket.io chưa được khởi tạo!');
    }
    return io;
};
