import supabaseClient from '../config/supabase';

/**
 * Lấy ngày đầu tiên và ngày cuối cùng của một tháng bất kỳ
 * @param offsetMonth Số tháng lùi so với tháng hiện tại (0 = tháng này, 1 = tháng trước)
 */
const getMonthRange = (offsetMonth = 0) => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() - offsetMonth;

    const startDate = new Date(year, month, 1);
    const endDate = new Date(year, month + 1, 0, 23, 59, 59, 999);

    return {
        start: startDate.toISOString(),
        end: endDate.toISOString()
    };
};

/**
 * Tính phần trăm tăng trưởng giữa hai giá trị
 */
const calculateGrowth = (current: number, previous: number): number => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Number((((current - previous) / previous) * 100).toFixed(1));
};

/**
 * Lấy toàn bộ số liệu tổng quan cho trang Dashboard
 * Bao gồm: KPIs, biểu đồ doanh thu 30 ngày theo tháng, top 5 sản phẩm bán chạy
 * 
 * @param chartMonth Tháng hiển thị biểu đồ (format: YYYY-MM). Mặc định = tháng hiện tại
 */
export const fetchDashboardOverview = async (chartMonth?: string) => {
    const thisMonth = getMonthRange(0);
    const lastMonth = getMonthRange(1);

    // ═══════════════════════════════════════════════════════════
    // Xác định khoảng thời gian cho biểu đồ doanh thu theo ngày
    // ═══════════════════════════════════════════════════════════
    let chartYear: number, chartMonthIndex: number;
    if (chartMonth && /^\d{4}-\d{2}$/.test(chartMonth)) {
        const [y, m] = chartMonth.split('-').map(Number);
        chartYear = y;
        chartMonthIndex = m - 1; // JS month is 0-indexed
    } else {
        const now = new Date();
        chartYear = now.getFullYear();
        chartMonthIndex = now.getMonth();
    }

    const chartStart = new Date(chartYear, chartMonthIndex, 1);
    const chartEnd = new Date(chartYear, chartMonthIndex + 1, 0, 23, 59, 59, 999);

    // ═══════════════════════════════════════════════════════════
    // Chạy song song tất cả truy vấn để tối ưu hiệu suất
    // ═══════════════════════════════════════════════════════════
    const [
        revenueThisMonthResult,
        revenueLastMonthResult,
        ordersThisMonthResult,
        ordersLastMonthResult,
        customersThisMonthResult,
        customersLastMonthResult,
        pendingOrdersResult,
        complaintsResult,
        chartRevenueResult,
        topProductsResult
    ] = await Promise.all([
        // 1. Doanh thu tháng này (chỉ đơn Completed)
        supabaseClient
            .from('orders')
            .select('final_amount')
            .eq('status', 'Completed')
            .gte('created_at', thisMonth.start)
            .lte('created_at', thisMonth.end),

        // 2. Doanh thu tháng trước (để tính tăng trưởng)
        supabaseClient
            .from('orders')
            .select('final_amount')
            .eq('status', 'Completed')
            .gte('created_at', lastMonth.start)
            .lte('created_at', lastMonth.end),

        // 3. Tổng số đơn hàng tháng này
        supabaseClient
            .from('orders')
            .select('*', { count: 'exact', head: true })
            .gte('created_at', thisMonth.start)
            .lte('created_at', thisMonth.end),

        // 4. Tổng số đơn hàng tháng trước
        supabaseClient
            .from('orders')
            .select('*', { count: 'exact', head: true })
            .gte('created_at', lastMonth.start)
            .lte('created_at', lastMonth.end),

        // 5. Số khách hàng đăng ký tháng này
        supabaseClient
            .from('users')
            .select('*', { count: 'exact', head: true })
            .gte('created_at', thisMonth.start)
            .lte('created_at', thisMonth.end),

        // 6. Số khách hàng đăng ký tháng trước
        supabaseClient
            .from('users')
            .select('*', { count: 'exact', head: true })
            .gte('created_at', lastMonth.start)
            .lte('created_at', lastMonth.end),

        // 7. Đơn chờ xử lý (tất cả)
        supabaseClient
            .from('orders')
            .select('status, cancel_reason'),

        // 8. Đếm khiếu nại đang chờ xử lý (New + In Progress)
        supabaseClient
            .from('complaints')
            .select('status'),

        // 9. Doanh thu theo ngày trong tháng được chọn (cho biểu đồ)
        supabaseClient
            .from('orders')
            .select('final_amount, created_at')
            .eq('status', 'Completed')
            .gte('created_at', chartStart.toISOString())
            .lte('created_at', chartEnd.toISOString()),

        // 10. Tất cả chi tiết đơn hàng hoàn tất (để tính top sản phẩm)
        supabaseClient
            .from('order_items')
            .select(`
                quantity,
                unit_price,
                variant_id,
                product_variants (
                    sku,
                    products (
                        id,
                        name,
                        product_images (
                            image_url,
                            is_main
                        )
                    )
                ),
                orders!inner (
                    status
                )
            `)
            .eq('orders.status', 'Completed')
    ]);

    // ═══════════════════════════════════════════════════════════
    // Bắt lỗi tập trung
    // ═══════════════════════════════════════════════════════════
    if (revenueThisMonthResult.error) throw revenueThisMonthResult.error;
    if (revenueLastMonthResult.error) throw revenueLastMonthResult.error;
    if (ordersThisMonthResult.error) throw ordersThisMonthResult.error;
    if (ordersLastMonthResult.error) throw ordersLastMonthResult.error;
    if (customersThisMonthResult.error) throw customersThisMonthResult.error;
    if (customersLastMonthResult.error) throw customersLastMonthResult.error;
    if (pendingOrdersResult.error) throw pendingOrdersResult.error;
    if (complaintsResult.error) throw complaintsResult.error;
    if (chartRevenueResult.error) throw chartRevenueResult.error;
    if (topProductsResult.error) throw topProductsResult.error;

    // ═══════════════════════════════════════════════════════════
    // 1. TÍNH KPIs
    // ═══════════════════════════════════════════════════════════
    const revenueThisMonth = (revenueThisMonthResult.data ?? []).reduce(
        (sum, o) => sum + Number(o.final_amount || 0), 0
    );
    const revenueLastMonth = (revenueLastMonthResult.data ?? []).reduce(
        (sum, o) => sum + Number(o.final_amount || 0), 0
    );

    const ordersThisMonth = ordersThisMonthResult.count || 0;
    const ordersLastMonth = ordersLastMonthResult.count || 0;

    const customersThisMonth = customersThisMonthResult.count || 0;
    const customersLastMonth = customersLastMonthResult.count || 0;

    // Đếm đơn chờ xử lý (Pending + CancelRequested)
    let pendingCount = 0;
    (pendingOrdersResult.data ?? []).forEach((o: any) => {
        const hasCancelRequest = o.cancel_reason && o.cancel_reason.includes('"isCancelRequested":true');
        if (o.status === 'Pending' || hasCancelRequest) {
            pendingCount++;
        }
    });

    // Đếm khiếu nại (tổng và đang chờ xử lý)
    const allComplaints = complaintsResult.data ?? [];
    const openComplaints = allComplaints.filter(
        (c: any) => c.status === 'New' || c.status === 'In Progress'
    ).length;

    // ═══════════════════════════════════════════════════════════
    // 2. BIỂU ĐỒ DOANH THU THEO NGÀY (30 ngày trong tháng)
    // ═══════════════════════════════════════════════════════════
    const daysInMonth = new Date(chartYear, chartMonthIndex + 1, 0).getDate();
    const dailyRevenue: { day: string; revenue: number; label: string }[] = [];

    for (let d = 1; d <= daysInMonth; d++) {
        dailyRevenue.push({
            day: String(d).padStart(2, '0'),
            label: `${String(d).padStart(2, '0')}/${String(chartMonthIndex + 1).padStart(2, '0')}`,
            revenue: 0
        });
    }

    // Gom doanh thu theo ngày
    (chartRevenueResult.data ?? []).forEach((order: any) => {
        const orderDate = new Date(order.created_at);
        const dayOfMonth = orderDate.getDate();
        if (dayOfMonth >= 1 && dayOfMonth <= daysInMonth) {
            dailyRevenue[dayOfMonth - 1].revenue += Number(order.final_amount || 0);
        }
    });

    // Làm tròn
    dailyRevenue.forEach(item => {
        item.revenue = Math.round(item.revenue);
    });

    // ═══════════════════════════════════════════════════════════
    // 3. TOP 5 SẢN PHẨM BÁN CHẠY NHẤT
    // ═══════════════════════════════════════════════════════════
    const productAggregation: Record<string, {
        productId: string;
        name: string;
        imageUrl: string | null;
        volume: number;
        revenue: number;
    }> = {};

    (topProductsResult.data ?? []).forEach((item: any) => {
        const variant = item.product_variants;
        if (!variant || !variant.products) return;

        const product = variant.products;
        const productId = product.id;
        const productName = product.name || 'Sản phẩm chưa đặt tên';
        const volume = Number(item.quantity || 0);
        const revenue = volume * Number(item.unit_price || 0);

        // Lấy ảnh chính của sản phẩm
        let imageUrl: string | null = null;
        if (product.product_images && product.product_images.length > 0) {
            const mainImage = product.product_images.find((img: any) => img.is_main);
            imageUrl = mainImage?.image_url ?? product.product_images[0]?.image_url ?? null;
        }

        if (!productAggregation[productId]) {
            productAggregation[productId] = {
                productId,
                name: productName,
                imageUrl,
                volume: 0,
                revenue: 0
            };
        }
        productAggregation[productId].volume += volume;
        productAggregation[productId].revenue += revenue;
    });

    const topProducts = Object.values(productAggregation)
        .sort((a, b) => b.volume - a.volume)
        .slice(0, 5)
        .map((p, index) => ({
            rank: index + 1,
            id: p.productId,
            name: p.name,
            imageUrl: p.imageUrl,
            volume: p.volume,
            revenue: Math.round(p.revenue)
        }));

    // ═══════════════════════════════════════════════════════════
    // TRẢ VỀ KẾT QUẢ
    // ═══════════════════════════════════════════════════════════
    return {
        kpis: {
            revenueThisMonth: Math.round(revenueThisMonth),
            revenueGrowth: calculateGrowth(revenueThisMonth, revenueLastMonth),
            totalOrders: ordersThisMonth,
            ordersGrowth: calculateGrowth(ordersThisMonth, ordersLastMonth),
            newCustomers: customersThisMonth,
            customersGrowth: calculateGrowth(customersThisMonth, customersLastMonth),
            pendingOrders: pendingCount,
            openComplaints: openComplaints,
            totalComplaints: allComplaints.length
        },
        dailyRevenue,
        chartMonthLabel: `Tháng ${String(chartMonthIndex + 1).padStart(2, '0')}/${chartYear}`,
        topProducts
    };
};
