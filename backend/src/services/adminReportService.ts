import supabaseClient from '../config/supabase';

/**
 * Tính khoảng thời gian theo preset
 */
const getDateRange = (timeRange: string): { start: string; end: string } => {
    const now = new Date();
    let startDate: Date;

    switch (timeRange) {
        case 'today':
            startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            break;
        case '7days':
            startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            break;
        case '30days':
            startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            break;
        case 'year':
            startDate = new Date(now.getFullYear(), 0, 1);
            break;
        default:
            startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    return {
        start: startDate.toISOString(),
        end: now.toISOString()
    };
};

/**
 * Tính % tăng trưởng
 */
const calcGrowth = (current: number, previous: number): number => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Number((((current - previous) / previous) * 100).toFixed(1));
};

/**
 * Lấy toàn bộ dữ liệu cho trang Báo cáo & Phân tích
 */
export const fetchReportData = async (
    timeRange: string,
    customStart?: string,
    customEnd?: string
) => {
    // ── Xác định khoảng thời gian ──
    let start: string, end: string;
    if (customStart && customEnd) {
        start = new Date(customStart).toISOString();
        end = new Date(new Date(customEnd).setHours(23, 59, 59, 999)).toISOString();
    } else {
        const range = getDateRange(timeRange);
        start = range.start;
        end = range.end;
    }

    // ── Khoảng thời gian kỳ trước (tính bằng cách lùi cùng số ngày) ──
    const diffMs = new Date(end).getTime() - new Date(start).getTime();
    const prevEnd = new Date(new Date(start).getTime() - 1).toISOString();
    const prevStart = new Date(new Date(start).getTime() - diffMs).toISOString();

    // ═══════════════════════════════════════════════════════════
    // Chạy song song tất cả truy vấn
    // ═══════════════════════════════════════════════════════════
    const [
        ordersCurrentResult,
        ordersPrevResult,
        customersCurrentResult,
        customersPrevResult,
        orderItemsResult,
        allOrdersForExportResult
    ] = await Promise.all([
        // 1. Đơn hàng kỳ hiện tại
        supabaseClient
            .from('orders')
            .select('id, final_amount, status, created_at')
            .gte('created_at', start)
            .lte('created_at', end),

        // 2. Đơn hàng kỳ trước (để tính tăng trưởng)
        supabaseClient
            .from('orders')
            .select('id, final_amount, status')
            .gte('created_at', prevStart)
            .lte('created_at', prevEnd),

        // 3. Khách hàng mới kỳ hiện tại
        supabaseClient
            .from('users')
            .select('*', { count: 'exact', head: true })
            .gte('created_at', start)
            .lte('created_at', end),

        // 4. Khách hàng kỳ trước
        supabaseClient
            .from('users')
            .select('*', { count: 'exact', head: true })
            .gte('created_at', prevStart)
            .lte('created_at', prevEnd),

        // 5. Chi tiết đơn hàng hoàn tất (để tính top sản phẩm + danh mục)
        supabaseClient
            .from('order_items')
            .select(`
                quantity,
                unit_price,
                product_variants (
                    sku,
                    products (
                        id,
                        name,
                        category_id,
                        categories ( id, name ),
                        product_images ( image_url, is_main )
                    )
                ),
                orders!inner ( status, created_at )
            `)
            .eq('orders.status', 'Completed')
            .gte('orders.created_at', start)
            .lte('orders.created_at', end),

        // 6. Toàn bộ đơn hàng (cho xuất CSV)
        supabaseClient
            .from('orders')
            .select(`
                id, status, payment_method, final_amount, shipping_fee, discount_amount,
                created_at, updated_at,
                users ( full_name, phone, email ),
                addresses ( full_address )
            `)
            .gte('created_at', start)
            .lte('created_at', end)
            .order('created_at', { ascending: false })
    ]);

    // ═══════════════════════════════════════════════════════════
    // Xử lý lỗi
    // ═══════════════════════════════════════════════════════════
    if (ordersCurrentResult.error) throw ordersCurrentResult.error;
    if (ordersPrevResult.error) throw ordersPrevResult.error;
    if (customersCurrentResult.error) throw customersCurrentResult.error;
    if (customersPrevResult.error) throw customersPrevResult.error;
    if (orderItemsResult.error) throw orderItemsResult.error;
    if (allOrdersForExportResult.error) throw allOrdersForExportResult.error;

    const currentOrders = ordersCurrentResult.data ?? [];
    const prevOrders = ordersPrevResult.data ?? [];
    const orderItems = orderItemsResult.data ?? [];

    // ═══════════════════════════════════════════════════════════
    // 1. KPIs
    // ═══════════════════════════════════════════════════════════
    const completedCurrent = currentOrders.filter((o: any) => o.status === 'Completed');
    const completedPrev = prevOrders.filter((o: any) => o.status === 'Completed');

    const revenueCurrent = completedCurrent.reduce((s: number, o: any) => s + Number(o.final_amount || 0), 0);
    const revenuePrev = completedPrev.reduce((s: number, o: any) => s + Number(o.final_amount || 0), 0);

    const ordersCurrent = currentOrders.length;
    const ordersPrev = prevOrders.length;

    const customersCurrent = customersCurrentResult.count || 0;
    const customersPrev = customersPrevResult.count || 0;

    const aov = completedCurrent.length > 0 ? Math.round(revenueCurrent / completedCurrent.length) : 0;
    const aovPrev = completedPrev.length > 0 ? Math.round(revenuePrev / completedPrev.length) : 0;

    // ═══════════════════════════════════════════════════════════
    // 2. Biểu đồ doanh thu & đơn hàng theo ngày
    // ═══════════════════════════════════════════════════════════
    const dailyMap: Record<string, { revenue: number; orders: number }> = {};
    
    // Tạo danh sách ngày
    const startDate = new Date(start);
    const endDate = new Date(end);
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
        const key = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
        dailyMap[key] = { revenue: 0, orders: 0 };
    }

    currentOrders.forEach((o: any) => {
        const d = new Date(o.created_at);
        const key = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
        if (dailyMap[key]) {
            dailyMap[key].orders += 1;
            if (o.status === 'Completed') {
                dailyMap[key].revenue += Number(o.final_amount || 0);
            }
        }
    });

    const dailyChart = Object.entries(dailyMap).map(([name, data]) => ({
        name,
        revenue: Math.round(data.revenue),
        orders: data.orders
    }));

    // ═══════════════════════════════════════════════════════════
    // 3. Cơ cấu doanh số theo danh mục
    // ═══════════════════════════════════════════════════════════
    const categoryMap: Record<string, { name: string; value: number }> = {};

    orderItems.forEach((item: any) => {
        const variant = item.product_variants;
        if (!variant?.products) return;

        const product = variant.products;
        const catName = product.categories?.name || 'Khác';
        const revenue = Number(item.quantity || 0) * Number(item.unit_price || 0);

        if (!categoryMap[catName]) {
            categoryMap[catName] = { name: catName, value: 0 };
        }
        categoryMap[catName].value += Math.round(revenue);
    });

    const categoryData = Object.values(categoryMap)
        .sort((a, b) => b.value - a.value)
        .slice(0, 6);

    // ═══════════════════════════════════════════════════════════
    // 4. Top 5 sản phẩm bán chạy
    // ═══════════════════════════════════════════════════════════
    const productMap: Record<string, {
        id: string;
        name: string;
        category: string;
        imageUrl: string | null;
        volume: number;
        revenue: number;
    }> = {};

    orderItems.forEach((item: any) => {
        const variant = item.product_variants;
        if (!variant?.products) return;

        const product = variant.products;
        const pid = product.id;
        const qty = Number(item.quantity || 0);
        const rev = qty * Number(item.unit_price || 0);

        let imageUrl: string | null = null;
        if (product.product_images?.length > 0) {
            const main = product.product_images.find((img: any) => img.is_main);
            imageUrl = main?.image_url ?? product.product_images[0]?.image_url ?? null;
        }

        if (!productMap[pid]) {
            productMap[pid] = {
                id: pid,
                name: product.name || 'Chưa đặt tên',
                category: product.categories?.name || 'Khác',
                imageUrl,
                volume: 0,
                revenue: 0
            };
        }
        productMap[pid].volume += qty;
        productMap[pid].revenue += rev;
    });

    const topProducts = Object.values(productMap)
        .sort((a, b) => b.volume - a.volume)
        .slice(0, 5)
        .map((p, i) => ({
            key: String(i + 1),
            rank: i + 1,
            ...p,
            revenue: Math.round(p.revenue)
        }));

    // ═══════════════════════════════════════════════════════════
    // 5. Dữ liệu xuất CSV
    // ═══════════════════════════════════════════════════════════
    const exportOrders = (allOrdersForExportResult.data ?? []).map((o: any) => ({
        id: o.id,
        customerName: o.users?.full_name || '',
        phone: o.users?.phone || '',
        email: o.users?.email || '',
        address: o.addresses?.full_address || '',
        total: o.final_amount,
        shippingFee: o.shipping_fee,
        discount: o.discount_amount,
        status: o.status,
        paymentMethod: o.payment_method,
        createdAt: o.created_at,
        updatedAt: o.updated_at
    }));

    // ═══════════════════════════════════════════════════════════
    // Trả về kết quả
    // ═══════════════════════════════════════════════════════════
    return {
        kpis: {
            revenue: Math.round(revenueCurrent),
            revenueGrowth: calcGrowth(revenueCurrent, revenuePrev),
            totalOrders: ordersCurrent,
            ordersGrowth: calcGrowth(ordersCurrent, ordersPrev),
            aov,
            aovGrowth: calcGrowth(aov, aovPrev),
            newCustomers: customersCurrent,
            customersGrowth: calcGrowth(customersCurrent, customersPrev)
        },
        dailyChart,
        categoryData,
        topProducts,
        exportOrders
    };
};
