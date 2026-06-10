import supabaseClient from '../config/supabase';

export interface MessagePayload {
    message_type: 'text' | 'product' | 'image';
    content?: string;
    product_id?: number;
}

// ── 1. CLIENT CHAT SERVICES ───────────────────────────────────

/**
 * Lấy hoặc tạo mới phòng chat cho khách hàng
 */
export const getOrCreateRoom = async (clientId: number) => {
    // Tìm phòng chat hiện tại của khách hàng
    const { data: existingRoom, error: fetchErr } = await supabaseClient
        .from('chat_rooms')
        .select(`
            id,
            client_id,
            assigned_staff_id,
            status,
            created_at,
            updated_at,
            client:users!chat_rooms_client_id_fkey (id, full_name, avatar, email),
            staff:users!chat_rooms_assigned_staff_id_fkey (id, full_name, avatar)
        `)
        .eq('client_id', clientId)
        .maybeSingle();

    if (fetchErr) {
        throw new Error('Lỗi khi truy vấn phòng chat: ' + fetchErr.message);
    }

    if (existingRoom) {
        return existingRoom;
    }

    // Nếu chưa có, tiến hành tạo mới
    const { data: newRoom, error: insertErr } = await supabaseClient
        .from('chat_rooms')
        .insert({
            client_id: clientId,
            status: 'waiting'
        })
        .select(`
            id,
            client_id,
            assigned_staff_id,
            status,
            created_at,
            updated_at,
            client:users!chat_rooms_client_id_fkey (id, full_name, avatar, email)
        `)
        .single();

    if (insertErr) {
        throw new Error('Lỗi khi khởi tạo phòng chat mới: ' + insertErr.message);
    }

    return newRoom;
};

/**
 * Lấy danh sách tin nhắn của một phòng chat
 */
export const getRoomMessages = async (roomId: number) => {
    const { data, error } = await supabaseClient
        .from('chat_messages')
        .select(`
            id,
            room_id,
            sender_id,
            message_type,
            content,
            product_id,
            is_read,
            created_at,
            sender:users!chat_messages_sender_id_fkey (id, full_name, avatar, role),
            product:products!chat_messages_product_id_fkey (
                id,
                name,
                base_price,
                brand,
                product_images (image_url, is_main)
            )
        `)
        .eq('room_id', roomId)
        .order('created_at', { ascending: true });

    if (error) {
        throw new Error('Lỗi khi tải lịch sử tin nhắn: ' + error.message);
    }

    // Định dạng lại ảnh sản phẩm để dễ render dưới client
    return data.map((msg: any) => {
        if (msg.product) {
            const prod = Array.isArray(msg.product) ? msg.product[0] : msg.product;
            if (prod) {
                const images = prod.product_images || [];
                const mainImage = images.find((img: any) => img.is_main)?.image_url || images[0]?.image_url || '';
                prod.image_url = mainImage;
                delete prod.product_images;
                msg.product = prod;
            } else {
                msg.product = null;
            }
        }
        return msg;
    });
};

/**
 * Gửi tin nhắn mới vào phòng
 */
export const sendChatMessage = async (
    roomId: number,
    senderId: number,
    payload: MessagePayload
) => {
    const { message_type, content, product_id } = payload;

    // 1. Lưu tin nhắn vào DB
    const { data: newMsg, error: insertErr } = await supabaseClient
        .from('chat_messages')
        .insert({
            room_id: roomId,
            sender_id: senderId,
            message_type,
            content: content || null,
            product_id: product_id || null
        })
        .select('id')
        .single();

    if (insertErr) {
        throw new Error('Lỗi khi gửi tin nhắn: ' + insertErr.message);
    }

    // 2. Cập nhật thời gian updated_at của phòng chat
    await supabaseClient
        .from('chat_rooms')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', roomId);

    // 3. Lấy lại tin nhắn kèm thông tin Sender & Product liên quan
    const { data: fullMsg, error: selectErr } = await supabaseClient
        .from('chat_messages')
        .select(`
            id,
            room_id,
            sender_id,
            message_type,
            content,
            product_id,
            is_read,
            created_at,
            sender:users!chat_messages_sender_id_fkey (id, full_name, avatar, role),
            product:products!chat_messages_product_id_fkey (
                id,
                name,
                base_price,
                brand,
                product_images (image_url, is_main)
            )
        `)
        .eq('id', newMsg.id)
        .single();

    if (selectErr || !fullMsg) {
        throw new Error('Lỗi khi lấy thông tin chi tiết tin nhắn vừa gửi.');
    }

    if (fullMsg.product) {
        const prod = (Array.isArray(fullMsg.product) ? fullMsg.product[0] : fullMsg.product) as any;
        if (prod) {
            const images = prod.product_images || [];
            const mainImage = images.find((img: any) => img.is_main)?.image_url || images[0]?.image_url || '';
            prod.image_url = mainImage;
            delete prod.product_images;
            (fullMsg as any).product = prod;
        } else {
            (fullMsg as any).product = null;
        }
    }

    return fullMsg;
};

/**
 * Đánh dấu tin nhắn đã đọc
 */
export const markAsRead = async (roomId: number, readerId: number) => {
    const { error } = await supabaseClient
        .from('chat_messages')
        .update({ is_read: true })
        .eq('room_id', roomId)
        .neq('sender_id', readerId)
        .eq('is_read', false);

    if (error) {
        console.error('⚠️ Không thể cập nhật trạng thái đã đọc:', error.message);
    }
    return true;
};


// ── 2. ADMIN/STAFF CHAT SERVICES ──────────────────────────────

/**
 * Lấy toàn bộ danh sách phòng chat cho Nhân viên & Admin
 */
export const getAllChatRooms = async () => {
    // 1. Lấy thông tin các phòng chat
    const { data: rooms, error: fetchErr } = await supabaseClient
        .from('chat_rooms')
        .select(`
            id,
            client_id,
            assigned_staff_id,
            status,
            created_at,
            updated_at,
            client:users!chat_rooms_client_id_fkey (id, full_name, avatar, email),
            staff:users!chat_rooms_assigned_staff_id_fkey (id, full_name, avatar)
        `)
        .order('updated_at', { ascending: false });

    if (fetchErr) {
        throw new Error('Lỗi khi lấy danh sách phòng chat: ' + fetchErr.message);
    }

    // 2. Với mỗi phòng, lấy tin nhắn cuối và số lượng tin chưa đọc
    const enrichedRooms = await Promise.all(rooms.map(async (room: any) => {
        // Lấy tin nhắn cuối cùng
        const { data: lastMsgs } = await supabaseClient
            .from('chat_messages')
            .select('content, message_type, created_at, sender_id')
            .eq('room_id', room.id)
            .order('created_at', { ascending: false })
            .limit(1);

        const lastMessage = lastMsgs && lastMsgs.length > 0 ? lastMsgs[0] : null;

        // Đếm số tin chưa đọc từ phía Khách hàng gửi tới Staff
        const { count } = await supabaseClient
            .from('chat_messages')
            .select('*', { count: 'exact', head: true })
            .eq('room_id', room.id)
            .eq('is_read', false)
            .neq('sender_id', room.client_id); // Tin nhắn của Staff gửi chưa đọc thì khách hàng tự xem, ở đây Staff đếm tin chưa đọc gửi từ Client

        // Thực tế đếm số lượng tin do Client gửi mà Staff chưa đọc:
        const { count: clientUnreadCount } = await supabaseClient
            .from('chat_messages')
            .select('*', { count: 'exact', head: true })
            .eq('room_id', room.id)
            .eq('is_read', false)
            .eq('sender_id', room.client_id); 

        return {
            ...room,
            last_message: lastMessage,
            unread_count: clientUnreadCount || 0
        };
    }));

    return enrichedRooms;
};

/**
 * Nhận hỗ trợ một phòng chat (Gán staff)
 */
export const assignStaffToRoom = async (roomId: number, staffId: number) => {
    // Kiểm tra xem phòng có đang trống hoặc đã được nhận bởi ai khác chưa
    const { data: room, error: fetchErr } = await supabaseClient
        .from('chat_rooms')
        .select('assigned_staff_id, status')
        .eq('id', roomId)
        .single();

    if (fetchErr || !room) {
        throw new Error('Không tìm thấy thông tin phòng chat.');
    }

    if (room.assigned_staff_id && room.assigned_staff_id !== staffId) {
        throw new Error('Phòng chat này đã có nhân viên khác nhận hỗ trợ.');
    }

    // Cập nhật trạng thái phòng sang in_progress và gán Staff
    const { data: updatedRoom, error: updateErr } = await supabaseClient
        .from('chat_rooms')
        .update({
            assigned_staff_id: staffId,
            status: 'in_progress',
            updated_at: new Date().toISOString()
        })
        .eq('id', roomId)
        .select(`
            id,
            client_id,
            assigned_staff_id,
            status,
            updated_at,
            staff:users!chat_rooms_assigned_staff_id_fkey (id, full_name, avatar)
        `)
        .single();

    if (updateErr) {
        throw new Error('Lỗi khi nhận phòng hỗ trợ: ' + updateErr.message);
    }

    return updatedRoom;
};

/**
 * Xóa phòng chat khi đóng hỗ trợ (Lịch sử chat sẽ bị xóa sạch)
 */
export const deleteChatRoom = async (roomId: number) => {
    const { error } = await supabaseClient
        .from('chat_rooms')
        .delete()
        .eq('id', roomId);

    if (error) {
        throw new Error('Lỗi khi đóng phòng hỗ trợ: ' + error.message);
    }

    return true;
};
