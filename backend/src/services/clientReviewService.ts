import supabaseClient from '../config/supabase';

// Tạo đánh giá sản phẩm
export const createReview = async (payload: {
    userId: number;
    productId: number;
    orderId: number;
    rating: number;
    comment?: string;
}) => {
    const { userId, productId, orderId, rating, comment } = payload;

    // 1. Kiểm tra đơn hàng có thuộc user và đã hoàn thành chưa
    const { data: order, error: orderErr } = await supabaseClient
        .from('orders')
        .select('id, status, user_id')
        .eq('id', orderId)
        .eq('user_id', userId)
        .single();

    if (orderErr || !order) throw new Error('Đơn hàng không tồn tại hoặc không thuộc về bạn.');
    if (order.status !== 'Completed') throw new Error('Chỉ có thể đánh giá sau khi đơn hàng đã hoàn thành.');

    // 2. Kiểm tra sản phẩm có trong đơn hàng không
    const { data: orderItem } = await supabaseClient
        .from('order_items')
        .select('id, product_variants(product_id)')
        .eq('order_id', orderId)
        .limit(100);

    const hasProduct = (orderItem as any[])?.some(
        (item: any) => item.product_variants?.product_id === productId
    );
    if (!hasProduct) throw new Error('Sản phẩm này không có trong đơn hàng.');

    // 3. Kiểm tra đã đánh giá chưa
    const { data: existingReview } = await supabaseClient
        .from('reviews')
        .select('id')
        .eq('user_id', userId)
        .eq('product_id', productId)
        .eq('order_id', orderId)
        .single();

    if (existingReview) throw new Error('Bạn đã đánh giá sản phẩm này trong đơn hàng này rồi.');

    // 4. Tạo đánh giá
    const { data, error } = await supabaseClient
        .from('reviews')
        .insert([{
            user_id: userId,
            product_id: productId,
            order_id: orderId,
            rating,
            comment: comment || null
        }])
        .select()
        .single();

    if (error) throw new Error('Lỗi khi tạo đánh giá: ' + error.message);
    return data;
};

// Lấy đánh giá của sản phẩm (public)
export const getProductReviews = async (productId: number, page = 1, limit = 10) => {
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data, error, count } = await supabaseClient
        .from('reviews')
        .select(`
            id,
            rating,
            comment,
            created_at,
            users (
                id,
                full_name,
                avatar
            )
        `, { count: 'exact' })
        .eq('product_id', productId)
        .order('created_at', { ascending: false })
        .range(from, to);

    if (error) throw new Error('Lỗi khi lấy đánh giá: ' + error.message);

    return {
        data,
        total: count,
        page,
        limit,
        totalPages: Math.ceil((count || 0) / limit)
    };
};

// Lấy đánh giá của user hiện tại
export const getUserReviews = async (userId: number) => {
    const { data, error } = await supabaseClient
        .from('reviews')
        .select(`
            id,
            rating,
            comment,
            created_at,
            order_id,
            products (
                id,
                name,
                product_images (image_url, is_main)
            )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

    if (error) throw new Error('Lỗi khi lấy lịch sử đánh giá: ' + error.message);
    return data;
};
