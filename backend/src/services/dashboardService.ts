import supabaseClient from '../config/supabase';

export const fetchDashboardOverview = async () => {
    // Chạy song song 3 truy vấn độc lập để tối ưu tốc độ (Performance Optimization)
    const [ordersResult, revenueResult, customersResult] = await Promise.all([
        // 1. Đếm tổng số đơn hàng
        supabaseClient
            .from('orders')
            .select('*', { count: 'exact', head: true }),
        
        // 2. Lấy dữ liệu doanh thu (Chỉ lấy các đơn hàng có trạng thái 'Completed')
        supabaseClient
            .from('orders')
            .select('total_amount')
            .eq('status', 'Completed'),
            
        // 3. Đếm tổng số khách hàng
        supabaseClient
            .from('users')
            .select('*', { count: 'exact', head: true })
    ]);

    // Bắt lỗi nếu có bất kỳ truy vấn nào thất bại
    if (ordersResult.error) throw ordersResult.error;
    if (revenueResult.error) throw revenueResult.error;
    if (customersResult.error) throw customersResult.error;

    // Dùng hàm reduce an toàn (chống crash) để cộng dồn tiền của tất cả các đơn lại
    const totalRevenue = revenueResult.data?.reduce((sum, order) => sum + Number(order.total_amount || 0), 0) ?? 0;

    // Trả về một object gom toàn bộ số liệu
    return {
        totalOrders: ordersResult.count || 0,
        totalRevenue: totalRevenue,
        totalCustomers: customersResult.count || 0
    };
};