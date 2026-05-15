import supabaseClient from '../config/supabase';

// Hàm 1: Lấy danh sách tất cả đơn hàng
export const fetchAllOrders = async () => {
    const { data: orderList, error: fetchError } = await supabaseClient
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false }); // Sắp xếp đơn mới nhất lên đầu

    if (fetchError) {
        console.error("Lỗi khi truy vấn đơn hàng từ Supabase:", fetchError);
        throw fetchError;
    }

    return orderList;
};

// Hàm 2: Cập nhật trạng thái của 1 đơn hàng cụ thể
export const updateOrderStatus = async (orderId: string, newStatus: string) => {
    const { data: updatedOrder, error: updateError } = await supabaseClient
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId)
        .select()
        .single(); // Trả về đúng 1 dòng dữ liệu vừa được cập nhật

    if (updateError) {
        console.error("Lỗi khi cập nhật trạng thái đơn hàng:", updateError);
        throw updateError;
    }

    return updatedOrder;
};