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
    const hasCancelRequest = order?.cancel_reason && order.cancel_reason.includes('"isCancelRequested":true');
    const displayStatus = hasCancelRequest ? 'CancelRequested' : (order?.status ?? 'Pending');

    return {
        id: Number(order?.id ?? 0),
        userId: Number(order?.user_id ?? 0),
        status: displayStatus,
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
    const timelineInit = {
        Pending: new Date().toISOString()
    };
    const currentShipping = typeof shippingAddress === 'string' ? JSON.parse(shippingAddress) : shippingAddress;
    const updatedShippingAddress = {
        ...currentShipping,
        timeline: timelineInit
    };

    const { data: newOrder, error: orderError } = await supabaseClient
        .from('orders')
        .insert([{
            user_id: userId,
            total_amount: totalAmount,
            discount_amount: discountAmount,
            final_amount: finalAmount,
            status: 'Pending',
            payment_status: 'Pending',
            shipping_address: updatedShippingAddress,
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

    // 8. Tạo thông báo cho khách hàng và các tài khoản Admin
    try {
        const listNotifications = [];

        // 8a. Thông báo cho khách hàng (Client)
        listNotifications.push({
            user_id: userId,
            title: 'Đặt hàng thành công',
            message: `Cảm ơn bạn đã mua sắm! Đơn hàng #${orderId} của bạn đã được đặt thành công và đang chờ duyệt.`,
            type: 'success',
            is_read: false,
            reference_id: String(orderId),
            reference_type: 'order'
        });

        // 8b. Thông báo cho Admins & Staff
        const { data: admins } = await supabaseClient
            .from('users')
            .select('id')
            .in('role', ['Admin', 'Staff']);

        if (admins && admins.length > 0) {
            admins.forEach((admin: any) => {
                listNotifications.push({
                    user_id: admin.id,
                    title: 'Đơn hàng mới chờ duyệt',
                    message: `Đơn hàng #${orderId} trị giá ${finalAmount.toLocaleString('vi-VN')} ₫ vừa được đặt bởi khách hàng.`,
                    type: 'success',
                    is_read: false,
                    reference_id: String(orderId),
                    reference_type: 'order'
                });
            });
        }

        if (listNotifications.length > 0) {
            await supabaseClient.from('notifications').insert(listNotifications);
        }
    } catch (err) {
        console.error("Lỗi khi tạo thông báo đặt hàng:", err);
    }

    return newOrder;
};


// GET ORDER HISTORY


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

// GET ORDER DETAILS


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


// CANCEL ORDER


// Các trạng thái cho phép hủy
const CANCELLABLE_STATUSES = ['Pending', 'Confirmed', 'Packing'];

export const cancelOrder = async (orderId: number, userId: number, cancelReason?: string) => {
    // 1. Lấy thông tin đơn hàng
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
            `Không thể hủy đơn hàng ở trạng thái "${order.status}". Đơn hàng đang được vận chuyển hoặc đã hoàn thành, bắt buộc phải nhận.`
        );
    }

    // 3. Cập nhật timeline trong shipping_address
    const currentShipping = order.shipping_address ? (typeof order.shipping_address === 'string' ? JSON.parse(order.shipping_address) : order.shipping_address) : {};
    const currentTimeline = currentShipping.timeline || {};
    currentTimeline['CancelRequested'] = new Date().toISOString();

    const updatedShippingAddress = {
        ...currentShipping,
        timeline: currentTimeline
    };

    // Chuẩn hóa cancel_reason chứa cờ isCancelRequested: true
    let packagedReason = '';
    if (cancelReason) {
        try {
            const parsed = JSON.parse(cancelReason);
            parsed.isCancelRequested = true;
            packagedReason = JSON.stringify(parsed);
        } catch (e) {
            packagedReason = JSON.stringify({
                isCancelRequested: true,
                reason: cancelReason,
                image: null
            });
        }
    } else {
        packagedReason = JSON.stringify({
            isCancelRequested: true,
            reason: 'Khách hàng gửi yêu cầu hủy',
            image: null
        });
    }

    // 4. Cập nhật trạng thái đơn hàng (giữ nguyên cột status của DB để tránh vi phạm check constraint chk_status)
    const { error: updateError } = await supabaseClient
        .from('orders')
        .update({
            cancel_reason: packagedReason,
            shipping_address: updatedShippingAddress
        })
        .eq('id', orderId)
        .eq('user_id', userId);

    if (updateError) throw new Error('Lỗi khi cập nhật trạng thái đơn hàng: ' + updateError.message);

    // 5. Tạo thông báo cho khách hàng và các tài khoản Admin
    try {
        const listNotifications = [];

        // 5a. Thông báo cho khách hàng (Client)
        listNotifications.push({
            user_id: userId,
            title: 'Yêu cầu hủy đơn hàng',
            message: `Bạn đã gửi yêu cầu hủy đơn hàng #${orderId}. Yêu cầu đang được chờ duyệt.`,
            type: 'info',
            is_read: false,
            reference_id: String(orderId),
            reference_type: 'order'
        });

        // 5b. Thông báo cho Admins & Staff
        const { data: admins } = await supabaseClient
            .from('users')
            .select('id')
            .in('role', ['Admin', 'Staff']);

        if (admins && admins.length > 0) {
            admins.forEach((admin: any) => {
                listNotifications.push({
                    user_id: admin.id,
                    title: 'Yêu cầu hủy đơn hàng mới',
                    message: `Khách hàng yêu cầu hủy đơn hàng #${orderId}. Vui lòng kiểm tra lý do và hình ảnh minh chứng.`,
                    type: 'warning',
                    is_read: false,
                    reference_id: String(orderId),
                    reference_type: 'order'
                });
            });
        }

        if (listNotifications.length > 0) {
            await supabaseClient.from('notifications').insert(listNotifications);
        }
    } catch (err) {
        console.error("Lỗi khi tạo thông báo yêu cầu hủy đơn hàng:", err);
    }

    return {
        orderId,
        status: 'CancelRequested',
        cancel_reason: cancelReason || 'Khách hàng gửi yêu cầu hủy'
    };
};