import type { Request, Response } from 'express';
import * as chatService from '../services/chatService';
import { getIO } from '../config/socket';
import supabaseClient from '../config/supabase';

/**
 * Lấy danh sách toàn bộ phòng chat kèm tin nhắn cuối & số lượng tin chưa đọc
 */
export const getAdminChatRooms = async (req: Request, res: Response): Promise<any> => {
    try {
        const rooms = await chatService.getAllChatRooms();
        return res.status(200).json({
            message: 'Tải danh sách phòng chat thành công.',
            data: rooms
        });
    } catch (error: any) {
        return res.status(500).json({ message: error.message });
    }
};

/**
 * Lấy lịch sử tin nhắn của một phòng (Có kiểm tra phân quyền Staff)
 */
export const getAdminChatHistory = async (req: Request, res: Response): Promise<any> => {
    try {
        const roomId = Number(req.params.roomId);
        const userId = Number(req.query.userId);
        const role = req.query.role as string;

        if (!roomId || !userId || !role) {
            return res.status(400).json({ message: 'Thiếu thông tin xác thực (roomId, userId, role).' });
        }

        // Lấy thông tin phòng chat
        const { data: room, error: fetchErr } = await supabaseClient
            .from('chat_rooms')
            .select('status, assigned_staff_id')
            .eq('id', roomId)
            .maybeSingle();

        if (fetchErr || !room) {
            return res.status(404).json({ message: 'Không tìm thấy phòng chat.' });
        }

        // 🛡️ Kiểm tra quyền truy cập (Staff phải nhận phòng mới được xem)
        if (role !== 'Admin') {
            if (room.status === 'waiting') {
                return res.status(403).json({
                    message: 'Bạn chưa nhận hỗ trợ phòng chat này. Hãy bấm "Nhận hỗ trợ" để xem nội dung.',
                    code: 'ROOM_WAITING'
                });
            }
            if (room.status === 'in_progress' && room.assigned_staff_id !== userId) {
                return res.status(403).json({
                    message: 'Phòng chat này đã được nhân viên khác nhận hỗ trợ.',
                    code: 'ROOM_LOCKED'
                });
            }
        }

        // Lấy lịch sử chat
        const messages = await chatService.getRoomMessages(roomId);

        // Tự động đánh dấu đã đọc tin nhắn của khách hàng
        await chatService.markAsRead(roomId, userId);

        return res.status(200).json({
            message: 'Tải lịch sử chat thành công.',
            data: messages
        });
    } catch (error: any) {
        return res.status(500).json({ message: error.message });
    }
};

/**
 * Staff/Admin gửi tin nhắn
 */
export const sendAdminMessage = async (req: Request, res: Response): Promise<any> => {
    try {
        const { roomId, userId, role, message_type, content, product_id } = req.body;

        if (!roomId || !userId || !role || !message_type) {
            return res.status(400).json({ message: 'Thiếu thông tin bắt buộc.' });
        }

        // Lấy thông tin phòng chat
        const { data: room, error: fetchErr } = await supabaseClient
            .from('chat_rooms')
            .select('status, assigned_staff_id, client_id')
            .eq('id', roomId)
            .maybeSingle();

        if (fetchErr || !room) {
            return res.status(404).json({ message: 'Không tìm thấy phòng chat.' });
        }

        // 🛡️ Kiểm tra quyền gửi tin nhắn
        if (role !== 'Admin') {
            if (room.status === 'waiting') {
                return res.status(403).json({ message: 'Bạn phải nhận phòng hỗ trợ trước khi gửi tin nhắn.' });
            }
            if (room.status === 'in_progress' && room.assigned_staff_id !== userId) {
                return res.status(403).json({ message: 'Phòng chat này đã được nhân viên khác nhận hỗ trợ.' });
            }
        }

        // Gửi tin nhắn
        const message = await chatService.sendChatMessage(Number(roomId), Number(userId), {
            message_type,
            content,
            product_id
        });

        // 🔌 Phát sự kiện Real-time Socket
        const io = getIO();

        // 1. Gửi tới khách hàng
        io.to(`user:${room.client_id}`).emit('chat:newMessage', message);

        // 2. Gửi tới phòng admins để đồng bộ giao diện các nhân viên khác
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
 * Staff nhận hỗ trợ phòng chat
 */
export const assignRoom = async (req: Request, res: Response): Promise<any> => {
    try {
        const { roomId, userId } = req.body;

        if (!roomId || !userId) {
            return res.status(400).json({ message: 'Thiếu thông tin roomId hoặc userId.' });
        }

        // Gán Staff trong Database
        const updatedRoom = await chatService.assignStaffToRoom(Number(roomId), Number(userId));

        // Lấy thông tin khách hàng để báo cho Socket
        const { data: roomInfo } = await supabaseClient
            .from('chat_rooms')
            .select('client_id, client:users!chat_rooms_client_id_fkey (full_name)')
            .eq('id', roomId)
            .single() as any;

        // Lấy thông tin Staff để gửi tên hiển thị
        const { data: staffInfo } = await supabaseClient
            .from('users')
            .select('full_name')
            .eq('id', userId)
            .single() as any;

        // 🔌 Phát sự kiện Real-time Socket
        const io = getIO();

        // 1. Báo cho khách hàng biết nhân viên đã tham gia hỗ trợ
        io.to(`user:${roomInfo.client_id}`).emit('chat:staffConnected', {
            staffName: staffInfo?.full_name || 'Nhân viên hỗ trợ'
        });

        // 2. Phát thông báo cho phòng admins cập nhật trạng thái phòng
        io.to('admins').emit('chat:roomAssigned', {
            roomId: updatedRoom.id,
            assigned_staff_id: updatedRoom.assigned_staff_id,
            status: updatedRoom.status,
            staffName: staffInfo?.full_name || 'Nhân viên'
        });

        return res.status(200).json({
            message: 'Nhận hỗ trợ phòng chat thành công.',
            data: updatedRoom
        });
    } catch (error: any) {
        return res.status(500).json({ message: error.message });
    }
};

/**
 * Đóng hỗ trợ phòng chat (Xóa toàn bộ tin nhắn & phòng khỏi DB)
 */
export const closeRoom = async (req: Request, res: Response): Promise<any> => {
    try {
        const roomId = Number(req.params.roomId);
        const userId = Number(req.body.userId || req.query.userId);
        const role = req.body.role || req.query.role as string;

        if (!roomId || !userId || !role) {
            return res.status(400).json({ message: 'Thiếu thông tin bắt buộc (roomId, userId, role).' });
        }

        // Lấy thông tin phòng chat trước khi xóa để lấy client_id gửi socket
        const { data: room, error: fetchErr } = await supabaseClient
            .from('chat_rooms')
            .select('client_id, assigned_staff_id')
            .eq('id', roomId)
            .maybeSingle();

        if (fetchErr || !room) {
            return res.status(404).json({ message: 'Không tìm thấy phòng chat hoặc đã đóng.' });
        }

        // 🛡️ Kiểm tra quyền đóng phòng (Admin hoặc Staff được gán)
        if (role !== 'Admin' && room.assigned_staff_id !== userId) {
            return res.status(403).json({ message: 'Bạn không có quyền đóng phòng chat hỗ trợ của nhân viên khác.' });
        }

        // Xóa phòng chat (cascade xóa tin nhắn)
        await chatService.deleteChatRoom(roomId);

        // 🔌 Phát sự kiện Real-time Socket
        const io = getIO();

        // 1. Báo cho khách hàng biết phiên hỗ trợ đã kết thúc
        io.to(`user:${room.client_id}`).emit('chat:roomClosed');

        // 2. Báo cho phòng admins cập nhật xóa phòng khỏi danh sách hiển thị
        io.to('admins').emit('chat:roomDeleted', { roomId });

        return res.status(200).json({ message: 'Đóng phòng hỗ trợ thành công. Lịch sử chat đã được xóa.' });
    } catch (error: any) {
        return res.status(500).json({ message: error.message });
    }
};

/**
 * Nhân viên đánh dấu đã xem tin nhắn khách hàng gửi
 */
export const markAdminMessagesRead = async (req: Request, res: Response): Promise<any> => {
    try {
        const { roomId, userId } = req.body;
        if (!roomId || !userId) {
            return res.status(400).json({ message: 'Thiếu roomId hoặc userId.' });
        }

        await chatService.markAsRead(Number(roomId), Number(userId));

        // Lấy client_id để phát socket báo tin đã được đọc
        const { data: room } = await supabaseClient
            .from('chat_rooms')
            .select('client_id')
            .eq('id', roomId)
            .maybeSingle();

        if (room) {
            getIO().to(`user:${room.client_id}`).emit('chat:readStatus', { roomId, userId });
            getIO().to('admins').emit('chat:readStatus', { roomId, userId });
        }

        return res.status(200).json({ message: 'Đã đánh dấu xem tin nhắn.' });
    } catch (error: any) {
        return res.status(500).json({ message: error.message });
    }
};
