import type { Request, Response } from 'express';
import * as chatService from '../services/chatService';
import { getIO } from '../config/socket';
import supabaseClient from '../config/supabase';

/**
 * Lấy hoặc Khởi tạo phòng chat của Khách hàng
 */
export const initClientRoom = async (req: Request, res: Response): Promise<any> => {
    try {
        const { userId } = req.body;
        if (!userId) {
            return res.status(400).json({ message: 'Vui lòng cung cấp userId khách hàng.' });
        }

        const room = await chatService.getOrCreateRoom(Number(userId));
        return res.status(200).json({
            message: 'Khởi tạo phòng chat thành công.',
            data: room
        });
    } catch (error: any) {
        return res.status(500).json({ message: error.message });
    }
};

/**
 * Lấy lịch sử tin nhắn của phòng chat
 */
export const getClientChatHistory = async (req: Request, res: Response): Promise<any> => {
    try {
        const { roomId } = req.query;
        if (!roomId) {
            return res.status(400).json({ message: 'Vui lòng cung cấp roomId.' });
        }

        const messages = await chatService.getRoomMessages(Number(roomId));
        return res.status(200).json({
            message: 'Tải lịch sử chat thành công.',
            data: messages
        });
    } catch (error: any) {
        return res.status(500).json({ message: error.message });
    }
};

/**
 * Khách hàng gửi tin nhắn mới
 */
export const sendClientMessage = async (req: Request, res: Response): Promise<any> => {
    try {
        const { roomId, userId, message_type, content, product_id } = req.body;

        if (!roomId || !userId || !message_type) {
            return res.status(400).json({ message: 'Thiếu thông tin bắt buộc (roomId, userId, message_type).' });
        }

        // Lấy thông tin phòng chat để xác định nhân viên được gán
        const { data: room, error: roomErr } = await supabaseClient
            .from('chat_rooms')
            .select('assigned_staff_id, client_id')
            .eq('id', roomId)
            .maybeSingle();

        if (roomErr || !room) {
            return res.status(404).json({ message: 'Không tìm thấy phòng chat.' });
        }

        // Gửi tin nhắn lưu vào database
        const message = await chatService.sendChatMessage(Number(roomId), Number(userId), {
            message_type,
            content,
            product_id
        });

        // 🔌 Phát sự kiện Real-time Socket.io
        const io = getIO();

        // 1. Gửi tới chính khách hàng (đồng bộ nhiều tab nếu có)
        io.to(`user:${userId}`).emit('chat:newMessage', message);

        // 2. Gửi tới Staff đang nhận hỗ trợ phòng này
        if (room.assigned_staff_id) {
            io.to(`user:${room.assigned_staff_id}`).emit('chat:newMessage', message);
        }

        // 3. Gửi tới tất cả Admin/Staff qua phòng 'admins' để cập nhật danh sách chờ
        io.to('admins').emit('chat:newMessage', message);

        return res.status(201).json({
            message: 'Gửi tin nhắn thành công.',
            data: message
        });
    } catch (error: any) {
        return res.status(500).json({ message: error.message });
    }
};

/**
 * Khách hàng đánh dấu đã đọc tin nhắn của Staff
 */
export const markClientMessagesRead = async (req: Request, res: Response): Promise<any> => {
    try {
        const { roomId, userId } = req.body;
        if (!roomId || !userId) {
            return res.status(400).json({ message: 'Thiếu roomId hoặc userId.' });
        }

        await chatService.markAsRead(Number(roomId), Number(userId));

        // Phát tín hiệu Socket cho Staff phụ trách biết tin đã được đọc
        const { data: room } = await supabaseClient
            .from('chat_rooms')
            .select('assigned_staff_id')
            .eq('id', roomId)
            .maybeSingle();

        if (room && room.assigned_staff_id) {
            getIO().to(`user:${room.assigned_staff_id}`).emit('chat:readStatus', { roomId, userId });
        }

        return res.status(200).json({ message: 'Đã đánh dấu xem tin nhắn.' });
    } catch (error: any) {
        return res.status(500).json({ message: error.message });
    }
};
