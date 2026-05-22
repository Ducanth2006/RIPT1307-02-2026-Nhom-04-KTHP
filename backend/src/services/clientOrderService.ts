import supabaseClient from '../config/supabase';

export interface CheckoutRequest {
    userId: number;
    shippingAddress: any;
    paymentMethod: string;
    voucherCode?: string;
    cartItemIds?: number[];
}

const layAnhChinhSanPham = (images: any[] = []) => {
    const anhChinh = images.find((img: any) => img?.is_main);
    return anhChinh?.image_url ?? images[0]?.image_url ?? null;
};

const layThanhToanDauTien = (payments: any) => {
    if (!Array.isArray(payments) || payments.length === 0) {
        return null;
    }

    return payments[0] ?? null;
};

const dinhDangItemChoClient = (item: any) => {
    const variant = item?.product_variants;
    const product = variant?.products;

    return {
        id: Number(item?.id ?? 0),
        productId: Number(product?.id ?? variant?.product_id ?? 0),
        productName: product?.name ?? null,
        variantId: Number(item?.variant_id ?? 0),
        variantSize: variant?.size ?? null,
        variantColor: variant?.color ?? null,
        imageUrl: layAnhChinhSanPham(product?.product_images ?? []),
        quantity: Number(item?.quantity ?? 0),
        price: Number(item?.unit_price ?? 0)
    };
};

const dinhDangDonHangChoClient = (order: any) => {
    const payment = layThanhToanDauTien(order?.payments);

    return {
        id: Number(order?.id ?? 0),
        userId: Number(order?.user_id ?? 0),
        status: order?.status ?? 'Pending',
        totalPrice: Number(order?.final_amount ?? order?.total_amount ?? 0),
        paymentMethod: payment?.method ?? null,
        paymentStatus: order?.payment_status ?? payment?.status ?? 'Pending',
        shippingAddress: order?.shipping_address ?? null,
        voucherDiscount: Number(order?.discount_amount ?? 0),
        items: (order?.order_items ?? []).map(dinhDangItemChoClient),
        created_at: order?.created_at ?? null,
        cancel_reason: order?.cancel_reason ?? null
    };
};

export const checkoutOrder = async (data: CheckoutRequest) => {
    const {
        userId,
        shippingAddress,
        paymentMethod,
        voucherCode,
        cartItemIds
    } = data;

    // 1. Lấy danh sách giỏ hàng kèm thông tin giá và tồn kho
    let truyVanGioHang = supabaseClient
        .from('cart_items')
        .select(`
            id,
            quantity,
            variant_id,
            product_variants (
                id,
                price,
                cost_price,
                stock_quantity
            )
        `)
        .eq('user_id', userId);

    if (Array.isArray(cartItemIds) && cartItemIds.length > 0) {
        truyVanGioHang = truyVanGioHang.in('id', cartItemIds);
    }

    const { data: cartItems, error: cartError } = await truyVanGioHang;

    if (cartError) throw new Error('Lỗi khi truy xuất giỏ hàng: ' + cartError.message);
    if (!cartItems || cartItems.length === 0) throw new Error('Giỏ hàng trống. Không thể đặt hàng.');

    // 2. Tính toán tổng tiền & Kiểm tra tồn kho
    let totalAmount = 0;
    const orderItemsToInsert = [];

    for (const item of (cartItems as any[])) {
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
            unit_price: variant.price,
            cost_price: variant.cost_price || 0  // Chốt giá vốn tại thời điểm mua
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

    // 7b. Xóa giỏ hàng của user
    let xoaGioHang = supabaseClient
        .from('cart_items')
        .delete()
        .eq('user_id', userId);

    if (Array.isArray(cartItemIds) && cartItemIds.length > 0) {
        xoaGioHang = xoaGioHang.in('id', cartItemIds);
    }

    parallelTasks.push(xoaGioHang);

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

    // 8. Tạo thông báo cho các tài khoản Admin
    try {
        const { data: admins } = await supabaseClient
            .from('users')
            .select('id')
            .eq('role', 'Admin');

        if (admins && admins.length > 0) {
            const thongBao = admins.map((admin: any) => ({
                user_id: admin.id,
                title: 'Đơn hàng mới chờ duyệt',
                message: `Đơn hàng #${orderId} trị giá ${finalAmount.toLocaleString('vi-VN')} ₫ vừa được đặt bởi khách hàng.`,
                type: 'success',
                is_read: false,
                reference_id: String(orderId),
                reference_type: 'order'
            }));
            await supabaseClient.from('notifications').insert(thongBao);
        }
    } catch (err) {
        console.error("Lỗi khi tạo thông báo cho admin:", err);
    }

    return newOrder;
};

// -------------------------------------------------------------
// GET ORDER HISTORY
// -------------------------------------------------------------

export const getUserOrders = async (userId: number) => {
    const { data: orders, error } = await supabaseClient
        .from('orders')
        .select(`
            *,
            order_items (
                id,
                quantity,
                unit_price,
                variant_id,
                product_variants (
                    product_id,
                    size,
                    color,
                    products (
                        id,
                        name,
                        product_images (
                            image_url,
                            is_main
                        )
                    )
                )
            ),
            payments (
                method,
                status
            )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

    if (error) {
        throw new Error('Lỗi khi lấy lịch sử đơn hàng: ' + error.message);
    }

    // Format lại dữ liệu hình ảnh cho dễ nhìn ở FE
    return (orders as any[]).map(dinhDangDonHangChoClient);
};

// -------------------------------------------------------------
// GET ORDER DETAILS
// -------------------------------------------------------------

export const getOrderDetails = async (orderId: number, userId: number) => {
    const { data: order, error } = await supabaseClient
        .from('orders')
        .select(`
            *,
            order_items (
                id,
                quantity,
                unit_price,
                variant_id,
                product_variants (
                    product_id,
                    size,
                    color,
                    products (
                        id,
                        name,
                        product_images (
                            image_url,
                            is_main
                        )
                    )
                )
            ),
            payments (
                id,
                transaction_id,
                method,
                amount,
                status,
                created_at
            )
        `)
        .eq('id', orderId)
        .eq('user_id', userId)
        .single();

    if (error || !order) {
        throw new Error('Đơn hàng không tồn tại hoặc bạn không có quyền truy cập.');
    }

    // Format lại dữ liệu hình ảnh
    return dinhDangDonHangChoClient(order);
};

// -------------------------------------------------------------
// CANCEL ORDER
// -------------------------------------------------------------

// Các trạng thái cho phép hủy (chưa đóng gói)
const CANCELLABLE_STATUSES = ['Pending', 'Confirmed'];

export const cancelOrder = async (orderId: number, userId: number, cancelReason?: string) => {
    // 1. Lấy thông tin đơn hàng (kèm chi tiết sản phẩm và voucher)
    const { data: order, error: fetchError } = await supabaseClient
        .from('orders')
        .select(`
            *,
            order_items (
                variant_id,
                quantity
            )
        `)
        .eq('id', orderId)
        .eq('user_id', userId)
        .single();

    if (fetchError || !order) {
        throw new Error('Đơn hàng không tồn tại hoặc bạn không có quyền thực hiện thao tác này.');
    }

    // 2. Kiểm tra trạng thái có cho phép hủy không
    if (!CANCELLABLE_STATUSES.includes(order.status)) {
        throw new Error(
            `Không thể hủy đơn hàng ở trạng thái "${order.status}". Chỉ có thể hủy khi đơn ở trạng thái Pending hoặc Confirmed.`
        );
    }

    // 3. Cập nhật trạng thái đơn hàng → Cancelled
    const { error: updateError } = await supabaseClient
        .from('orders')
        .update({
            status: 'Cancelled',
            payment_status: 'Failed',
            cancel_reason: cancelReason || 'Khách hàng yêu cầu hủy'
        })
        .eq('id', orderId);

    if (updateError) throw new Error('Lỗi khi cập nhật trạng thái đơn hàng: ' + updateError.message);

    // 4. Các tác vụ hoàn lại chạy song song (Restore stock & voucher)
    const restoreTasks: Promise<any>[] = [];

    // 4a. Hoàn lại tồn kho cho từng sản phẩm (đọc stock hiện tại → cộng thêm)
    // CHỈ hoàn kho khi đơn hàng đã từng được admin Confirmed (trừ kho)
    if (order.status === 'Confirmed') {
        for (const item of (order.order_items as any[])) {
            const restoreStock = async () => {
                const { data: variant } = await supabaseClient
                    .from('product_variants')
                    .select('stock_quantity, cost_price')
                    .eq('id', item.variant_id)
                    .single();
                if (variant) {
                    await supabaseClient
                        .from('product_variants')
                        .update({ stock_quantity: variant.stock_quantity + item.quantity })
                        .eq('id', item.variant_id);

                    // Ghi log nhập kho để hoàn kho
                    await supabaseClient
                        .from('inventory_logs')
                        .insert([
                            {
                                variant_id: item.variant_id,
                                action_type: 'IMPORT',
                                reference_id: orderId,
                                quantity: item.quantity,
                                cost_price: variant.cost_price || 0
                            }
                        ]);
                }
            };
            restoreTasks.push(restoreStock());
        }
    }

    // 4b. Hoàn lại số lượt voucher (nếu đơn hàng có dùng voucher)
    if (order.voucher_id) {
        const restoreVoucher = async () => {
            const { data: voucher } = await supabaseClient
                .from('vouchers')
                .select('quantity')
                .eq('id', order.voucher_id)
                .single();
            if (voucher && voucher.quantity !== null) {
                await supabaseClient
                    .from('vouchers')
                    .update({ quantity: voucher.quantity + 1 })
                    .eq('id', order.voucher_id);
            }
        };
        restoreTasks.push(restoreVoucher());
    }

    // 4c. Cập nhật trạng thái thanh toán → Failed (nếu chưa thanh toán)
    const markPaymentFailed = async () => {
        await supabaseClient
            .from('payments')
            .update({ status: 'Failed' })
            .eq('order_id', orderId)
            .eq('status', 'Pending');
    };
    restoreTasks.push(markPaymentFailed());

    await Promise.all(restoreTasks);

    return {
        orderId,
        status: 'Cancelled',
        cancel_reason: cancelReason || 'Khách hàng yêu cầu hủy'
    };
};
