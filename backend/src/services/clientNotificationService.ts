import supabaseClient from '../config/supabase';

// Lấy danh sách thông báo của user
export const getNotificationsByUserId = async (userId: number, page = 1, limit = 20) => {
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data, error, count } = await supabaseClient
        .from('notifications')
        .select('*', { count: 'exact' })
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .range(from, to);

    if (error) throw new Error('Lỗi khi lấy thông báo: ' + error.message);

    return {
        data,
        total: count,
        unreadCount: (data as any[])?.filter(n => !n.is_read).length,
        page,
        limit,
        totalPages: Math.ceil((count || 0) / limit)
    };
};

// Đánh dấu 1 thông báo là đã đọc
export const markNotificationRead = async (notificationId: number, userId: number) => {
    const { data, error } = await supabaseClient
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId)
        .eq('user_id', userId)
        .select()
        .single();

    if (error) throw new Error('Lỗi khi cập nhật thông báo: ' + error.message);
    return data;
};

// Đánh dấu tất cả thông báo là đã đọc
export const markAllNotificationsRead = async (userId: number) => {
    const { error } = await supabaseClient
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', userId)
        .eq('is_read', false);

    if (error) throw new Error('Lỗi khi cập nhật tất cả thông báo: ' + error.message);
    return true;
};
