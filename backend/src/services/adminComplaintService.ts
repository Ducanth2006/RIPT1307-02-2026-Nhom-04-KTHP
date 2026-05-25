import supabaseClient from '../config/supabase';

// ==========================================
// 1. Lấy danh sách toàn bộ khiếu nại (Admin)
// ==========================================
export const fetchAllComplaints = async () => {
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
            user_id,
            users (
                id,
                full_name,
                email
            ),
            orders (
                id,
                status,
                final_amount,
                created_at
            )
        `)
        .order('created_at', { ascending: false });

    if (error) {
        console.error("Lỗi khi lấy danh sách khiếu nại (Admin):", error);
        throw error;
    }
    return data || [];
};

// ==========================================
// 2. Lấy chi tiết khiếu nại (Admin)
// ==========================================
export const fetchComplaintById = async (complaintId: string) => {
    const { data, error } = await supabaseClient
        .from('complaints')
        .select(`
            *,
            users (
                id,
                full_name,
                email
            ),
            orders (
                id,
                status,
                final_amount,
                created_at
            )
        `)
        .eq('id', complaintId)
        .maybeSingle();

    if (error) throw error;
    if (!data) throw new Error('Khiếu nại không tồn tại.');
    return data;
};

// ==========================================
// 3. Xác nhận khiếu nại (Admin)
// ==========================================
export const confirmComplaint = async (complaintId: string) => {
    // Kiểm tra sự tồn tại của khiếu nại
    const { data: complaint, error: fetchErr } = await supabaseClient
        .from('complaints')
        .select('id, user_id, order_id, status')
        .eq('id', complaintId)
        .maybeSingle();

    if (fetchErr) throw fetchErr;
    if (!complaint) throw new Error('Khiếu nại không tồn tại.');

    if (complaint.status !== 'New') {
        throw new Error('Chỉ có thể xác nhận khiếu nại ở trạng thái "Mới" (New).');
    }

    // Cập nhật trạng thái sang "In Progress" (Đã xác nhận / Đang xử lý)
    const { data: updated, error: updateErr } = await supabaseClient
        .from('complaints')
        .update({ status: 'In Progress' })
        .eq('id', complaintId)
        .select()
        .single();

    if (updateErr) throw updateErr;

    // Gửi thông báo đến Client
    try {
        await supabaseClient
            .from('notifications')
            .insert([{
                user_id: complaint.user_id,
                title: 'Khiếu nại được xác nhận',
                message: `Khiếu nại #${complaintId} về đơn hàng #${complaint.order_id} của bạn đã được Admin xác nhận và đang được xử lý.`,
                type: 'info',
                is_read: false,
                reference_id: String(complaintId),
                reference_type: 'complaint'
            }]);
    } catch (notifErr) {
        console.error("Lỗi khi bắn thông báo xác nhận khiếu nại:", notifErr);
    }

    return updated;
};

// ==========================================
// 4. Viết đơn hồi đáp khiếu nại (Admin)
// ==========================================
export const replyComplaint = async (complaintId: string, replyText: string) => {
    if (!replyText || replyText.trim() === '') {
        throw new Error('Nội dung hồi đáp không được để trống.');
    }

    // Kiểm tra sự tồn tại của khiếu nại
    const { data: complaint, error: fetchErr } = await supabaseClient
        .from('complaints')
        .select('id, user_id, order_id')
        .eq('id', complaintId)
        .maybeSingle();

    if (fetchErr) throw fetchErr;
    if (!complaint) throw new Error('Khiếu nại không tồn tại.');

    // Cập nhật hồi đáp và chuyển trạng thái sang "Resolved" (Đã giải quyết)
    const { data: updated, error: updateErr } = await supabaseClient
        .from('complaints')
        .update({
            admin_response: replyText.trim(),
            status: 'Resolved'
        })
        .eq('id', complaintId)
        .select()
        .single();

    if (updateErr) throw updateErr;

    // Gửi thông báo kết quả giải quyết cho Client
    try {
        await supabaseClient
            .from('notifications')
            .insert([{
                user_id: complaint.user_id,
                title: 'Có hồi đáp khiếu nại mới',
                message: `Shop đã phản hồi khiếu nại #${complaintId} của bạn. Hãy click để xem kết quả giải quyết.`,
                type: 'success',
                is_read: false,
                reference_id: String(complaintId),
                reference_type: 'complaint'
            }]);
    } catch (notifErr) {
        console.error("Lỗi khi bắn thông báo hồi đáp khiếu nại:", notifErr);
    }

    return updated;
};
