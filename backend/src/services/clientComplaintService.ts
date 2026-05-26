import supabaseClient from '../config/supabase';

// Tạo khiếu nại
export const createComplaint = async (payload: {
    userId: number;
    orderId: number;
    subject: string;
    content: string;
    images?: string[];
}) => {
    const { userId, orderId, subject, content, images } = payload;

    // Kiểm tra đơn hàng thuộc về user
    const { data: order, error: orderErr } = await supabaseClient
        .from('orders')
        .select('id, user_id')
        .eq('id', orderId)
        .eq('user_id', userId)
        .single();

    if (orderErr || !order) throw new Error('Đơn hàng không tồn tại hoặc không thuộc về bạn.');

    // 1. Lưu khiếu nại vào bảng complaints
    const { data, error } = await supabaseClient
        .from('complaints')
        .insert([{
            user_id: userId,
            order_id: orderId,
            subject,
            content,
            status: 'New',
            images: images ?? []
        }])
        .select()
        .single();

    if (error) throw new Error('Lỗi khi tạo khiếu nại: ' + error.message);

    const complaintId = data.id;

    // 2. Tạo thông báo (song song)
    try {
        const notificationsList = [];

        // 2a. Thông báo cho chính Client (Khách hàng)
        notificationsList.push({
            user_id: userId,
            title: 'Gửi khiếu nại thành công',
            message: `Yêu cầu khiếu nại #${complaintId} về đơn hàng #${orderId} đã được gửi thành công và đang chờ giải quyết.`,
            type: 'info',
            is_read: false,
            reference_id: String(complaintId),
            reference_type: 'complaint'
        });

        // 2b. Tìm các tài khoản Admin & Staff để bắn thông báo
        const { data: admins } = await supabaseClient
            .from('users')
            .select('id')
            .in('role', ['Admin', 'Staff']);

        if (admins && admins.length > 0) {
            admins.forEach((admin: any) => {
                notificationsList.push({
                    user_id: admin.id,
                    title: 'Có khiếu nại mới cần xử lý',
                    message: `Khách hàng vừa gửi khiếu nại mới #${complaintId} cho đơn hàng #${orderId}.`,
                    type: 'warning',
                    is_read: false,
                    reference_id: String(complaintId),
                    reference_type: 'complaint'
                });
            });
        }

        if (notificationsList.length > 0) {
            await supabaseClient.from('notifications').insert(notificationsList);
        }
    } catch (notifErr) {
        console.error("Lỗi khi bắn thông báo khiếu nại:", notifErr);
    }

    return data;
};

// Lấy danh sách khiếu nại của user
export const getComplaintsByUserId = async (userId: number) => {
    const { data, error } = await supabaseClient
        .from('complaints')
        .select(`
            id,
            subject,
            content,
            status,
            admin_response,
            images,
            created_at,
            order_id,
            orders (
                id,
                status,
                final_amount,
                created_at
            )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

    if (error) throw new Error('Lỗi khi lấy danh sách khiếu nại: ' + error.message);
    return data;
};

// Lấy chi tiết 1 khiếu nại
export const getComplaintById = async (complaintId: number, userId: number) => {
    const { data, error } = await supabaseClient
        .from('complaints')
        .select(`
            *,
            orders (
                id,
                status,
                final_amount,
                created_at
            )
        `)
        .eq('id', complaintId)
        .eq('user_id', userId)
        .single();

    if (error || !data) throw new Error('Khiếu nại không tồn tại hoặc bạn không có quyền xem.');
    return data;
};
