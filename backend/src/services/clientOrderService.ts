import supabaseClient from '../config/supabase';

export interface CheckoutRequest {
    userId: number;
    shippingAddress: any;
    paymentMethod: string;
    voucherCode?: string;
}

export const checkoutOrder = async (data: CheckoutRequest) => {
    const { userId, shippingAddress, paymentMethod, voucherCode } = data;

    // 1. Lấy danh sách giỏ hàng kèm thông tin giá và tồn kho
    const { data: cartItems, error: cartError } = await supabaseClient
        .from('cart_items')
        .select(`
            id,
            quantity,
            variant_id,
            product_variants (
                id,
                price,
                stock_quantity
            )
        `)
        .eq('user_id', userId);

    if (cartError) throw new Error('Lỗi khi truy xuất giỏ hàng: ' + cartError.message);
    if (!cartItems || cartItems.length === 0) throw new Error('Giỏ hàng trống. Không thể đặt hàng.');

    // 2. Tính toán tổng tiền & Kiểm tra tồn kho
    let totalAmount = 0;
    const orderItemsToInsert = [];
    const stockUpdates = [];

    for (const item of cartItems) {
        const variant = item.product_variants;
        if (!variant) throw new Error(`Lỗi dữ liệu: Không tìm thấy thông tin sản phẩm cho mã ${item.variant_id}`);

        if (variant.stock_quantity < item.quantity) {
            throw new Error(`Sản phẩm (Variant ID: ${variant.id}) không đủ số lượng tồn kho. Vui lòng kiểm tra lại giỏ hàng.`);
        }

        totalAmount += variant.price * item.quantity;

        // Chuẩn bị mảng data để bulk insert vào order_items
        orderItemsToInsert.push({
            variant_id: variant.id,
            quantity: item.quantity,
            unit_price: variant.price
        });

        // Chuẩn bị mảng data để update stock_quantity
        stockUpdates.push({
            variant_id: variant.id,
            new_stock: variant.stock_quantity - item.quantity
        });
    }

    // 3. Xử lý Voucher (nếu có)
    let discountAmount = 0;
    let finalAmount = totalAmount;
    let voucherId = null;
    let voucherData = null;

    if (voucherCode) {
        const { data: voucher, error: voucherError } = await supabaseClient
            .from('vouchers')
            .select('*')
            .eq('code', voucherCode)
            .single();

        if (voucherError || !voucher) throw new Error('Voucher không hợp lệ hoặc không tồn tại.');
        if (voucher.status !== 'Active' && voucher.status !== 'active') throw new Error('Voucher không còn hoạt động.');
        if (voucher.quantity !== null && voucher.quantity <= 0) throw new Error('Voucher đã hết lượt sử dụng.');
        
        const now = new Date();
        if (voucher.start_date && new Date(voucher.start_date) > now) throw new Error('Voucher chưa đến thời gian sử dụng.');
        if (voucher.end_date && new Date(voucher.end_date) < now) throw new Error('Voucher đã hết hạn.');
        if (voucher.min_order_value && totalAmount < Number(voucher.min_order_value)) {
            throw new Error(`Đơn hàng chưa đạt giá trị tối thiểu (${voucher.min_order_value}) để áp dụng voucher.`);
        }

        if (voucher.discount_type === 'Percentage') {
            discountAmount = (totalAmount * Number(voucher.discount_value)) / 100;
            if (voucher.max_discount && discountAmount > Number(voucher.max_discount)) {
                discountAmount = Number(voucher.max_discount);
            }
        } else if (voucher.discount_type === 'Fixed') {
            discountAmount = Number(voucher.discount_value);
        }

        if (discountAmount > totalAmount) discountAmount = totalAmount;
        finalAmount = totalAmount - discountAmount;
        voucherId = voucher.id;
        voucherData = voucher;
    }

    // =========================================================================
    // THỰC HIỆN GHI VÀO DATABASE (Cố gắng optimize thời gian chạy)
    // =========================================================================

    // 4. Tạo Order
    const { data: newOrder, error: orderError } = await supabaseClient
        .from('orders')
        .insert([{
            user_id: userId,
            total_amount: totalAmount,
            discount_amount: discountAmount,
            final_amount: finalAmount,
            status: 'Pending',
            payment_status: 'Pending',
            shipping_address: shippingAddress,
            voucher_id: voucherId
        }])
        .select()
        .single();

    if (orderError) throw new Error('Lỗi khi tạo đơn hàng: ' + orderError.message);
    const orderId = newOrder.id;

    // Gắn order_id vào mảng orderItemsToInsert
    const itemsWithOrderId = orderItemsToInsert.map(item => ({
        ...item,
        order_id: orderId
    }));

    // 5. Insert vào order_items (Bulk Insert)
    const { error: itemsError } = await supabaseClient
        .from('order_items')
        .insert(itemsWithOrderId);

    if (itemsError) throw new Error('Lỗi khi lưu chi tiết đơn hàng: ' + itemsError.message);

    // 6. Insert vào payments
    const transactionId = `TXN-${orderId}-${Date.now()}`;
    const { error: paymentError } = await supabaseClient
        .from('payments')
        .insert([{
            order_id: orderId,
            transaction_id: transactionId,
            method: paymentMethod,
            amount: finalAmount,
            status: 'Pending'
        }]);

    if (paymentError) throw new Error('Lỗi khi tạo thông tin thanh toán: ' + paymentError.message);

    // 7. Các tác vụ chạy song song (Parallel) để tiết kiệm thời gian (< 3s)
    const parallelTasks = [];

    // 7a. Trừ tồn kho (Cập nhật tuần tự từng sản phẩm vì Supabase REST API không hỗ trợ bulk update tốt)
    // Tuy nhiên chúng ta đưa vào Promise.all để chạy song song các requests
    for (const update of stockUpdates) {
        parallelTasks.push(
            supabaseClient
                .from('product_variants')
                .update({ stock_quantity: update.new_stock })
                .eq('id', update.variant_id)
        );
    }

    // 7b. Xóa giỏ hàng của user
    parallelTasks.push(
        supabaseClient
            .from('cart_items')
            .delete()
            .eq('user_id', userId)
    );

    // 7c. Trừ số lượng voucher (nếu có)
    if (voucherId && voucherData && voucherData.quantity !== null) {
        parallelTasks.push(
            supabaseClient
                .from('vouchers')
                .update({ quantity: voucherData.quantity - 1 })
                .eq('id', voucherId)
        );
    }

    // Chờ tất cả các tác vụ vụ phụ hoàn thành
    await Promise.all(parallelTasks);

    return newOrder;
};
