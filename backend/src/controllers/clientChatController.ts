import type { Request, Response } from 'express';
import * as chatService from '../services/chatService';
import { getIO } from '../config/socket';
import supabaseClient from '../config/supabase';
import { generateBotReply, ensureBotUserExists } from '../services/aiService';

// ID của Bot User trong DB (configurable qua .env)
const BOT_USER_ID = Number(process.env.BOT_USER_ID || '999999');

/**
 * Helper nội bộ: Gọi AI Bot tự động trả lời khi phòng ở trạng thái waiting.
 * Chạy bất đồng bộ, KHÔNG block response trả về cho client.
 */
async function triggerBotReply(roomId: number, clientId: number): Promise<void> {
    try {
        // 1. Đảm bảo Bot User tồn tại trong DB
        await ensureBotUserExists();

        // 2. Lấy lịch sử tin nhắn gần nhất làm context cho AI
        const history = await chatService.getRoomMessages(roomId);
        const recentHistory = history.slice(-10);

        // 3. Lấy tin nhắn cuối cùng của client để làm input
        const lastClientMsg = [...recentHistory]
            .reverse()
            .find((m: any) => m.sender_id === clientId);

        if (!lastClientMsg?.content && lastClientMsg?.message_type !== 'product') {
            console.log('⚠️ Bot: Không tìm thấy tin nhắn client để xử lý.');
            return;
        }

        // Nếu client gửi thẻ sản phẩm, tạo context cho AI từ tên sản phẩm
        const userInput = lastClientMsg.message_type === 'product' && lastClientMsg.product
            ? `Tôi muốn hỏi về sản phẩm: ${lastClientMsg.product.name}`
            : (lastClientMsg.content || '');

        // 4. Gọi Gemini AI để sinh câu trả lời
        const { text: botText, recommendedProductId } = await generateBotReply(
            userInput,
            recentHistory
        );

        // 5. Lưu tin nhắn bot vào DB (dùng sendChatMessage như Staff gửi bình thường)
        // Dùng conditional spread để tránh lỗi exactOptionalPropertyTypes:
        // khi không có sản phẩm, key 'product_id' hoàn toàn vắng mặt (absent) thay vì gán undefined
        let validProductId: number | undefined = undefined;
        if (recommendedProductId) {
            const { data: prodExists } = await supabaseClient
                .from('products')
                .select('id')
                .eq('id', recommendedProductId)
                .maybeSingle();
            if (prodExists) {
                validProductId = recommendedProductId;
            } else {
                console.warn(`⚠️ Bot suggested non-existent product ID: ${recommendedProductId}`);
            }
        }

        const botMessage = await chatService.sendChatMessage(roomId, BOT_USER_ID, {
            message_type: validProductId ? 'product' : 'text',
            content: botText,
            ...(validProductId ? { product_id: validProductId } : {})
        });

        // 6. Emit socket cho client nhận được tin nhắn bot real-time
        const io = getIO();
        io.to(`user:${clientId}`).emit('chat:newMessage', botMessage);
        // Cũng emit tới admins để ChatPage & badge của Admin/Staff cập nhật real-time
        io.to('admins').emit('chat:newMessage', botMessage);

        console.log(`🤖 Bot đã trả lời phòng #${roomId}: "${botText.substring(0, 60)}..."`);
    } catch (err: any) {
        console.error(`⚠️ Lỗi Bot reply cho phòng #${roomId}:`, err.message);
    }
}

/**
 * Lấy hoặc Khởi tạo phòng chat của Khách hàng
 */
export const initClientRoom = async (req: Request, res: Response): Promise<any> => {
    try {
        const { userId } = req.body;
        if (!userId) {
            return res.status(400).json({ message: 'Vui lòng cung cấp userId khách hàng.' });
        }

        // Kiểm tra xem phòng đã tồn tại trước đó chưa
        const { data: existingRoom } = await supabaseClient
            .from('chat_rooms')
            .select('id')
            .eq('client_id', userId)
            .maybeSingle();

        const room = await chatService.getOrCreateRoom(Number(userId));

        // Nếu phòng chưa tồn tại (tức là vừa được tạo mới), phát socket báo cho admin
        if (!existingRoom) {
            try {
                const io = getIO();
                const roomData = {
                    ...room,
                    last_message: null,
                    unread_count: 0
                };
                io.to('admins').emit('chat:roomCreated', roomData);
            } catch (socketErr) {
                console.error('⚠️ Lỗi phát socket chat:roomCreated:', socketErr);
            }
        }

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

        // Lấy thông tin phòng chat để xác định trạng thái & nhân viên được gán
        const { data: room, error: roomErr } = await supabaseClient
            .from('chat_rooms')
            .select('assigned_staff_id, client_id, status')
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

        // ─────────────────────────────────────────────────────────────
        // 🤖 AI BOT AUTO-REPLY: Chỉ kích hoạt khi phòng đang "waiting"
        // (Chưa có Staff nào nhận — Bot đóng vai trò hỗ trợ tạm thời)
        // ─────────────────────────────────────────────────────────────
        if (room.status === 'waiting') {
            // Chạy bất đồng bộ không block response — client nhận response ngay
            triggerBotReply(Number(roomId), Number(userId)).catch(err =>
                console.error('⚠️ Không thể kích hoạt Bot reply:', err)
            );
        }

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
