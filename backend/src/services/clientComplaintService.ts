import supabaseClient from '../config/supabase';

// Tạo khiếu nại
export const createComplaint = async (payload: {
    userId: number;
    orderId: number;
    subject: string;
    content: string;
}) => {
    const { userId, orderId, subject, content } = payload;

    // Kiểm tra đơn hàng thuộc về user
    const { data: order, error: orderErr } = await supabaseClient
        .from('orders')
        .select('id, user_id')
        .eq('id', orderId)
        .eq('user_id', userId)
        .single();

    if (orderErr || !order) throw new Error('Đơn hàng không tồn tại hoặc không thuộc về bạn.');

    const { data, error } = await supabaseClient
        .from('complaints')
        .insert([{
            user_id: userId,
            order_id: orderId,
            subject,
            content,
            status: 'New'
        }])
        .select()
        .single();

    if (error) throw new Error('Lỗi khi tạo khiếu nại: ' + error.message);
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
