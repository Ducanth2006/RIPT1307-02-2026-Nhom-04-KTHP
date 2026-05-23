import supabaseClient from '../config/supabase';

type LoiDichVu = Error & {
    code?: string;
    errorDetails?: unknown;
};

type TrangThaiDonHang =
    | 'Pending'
    | 'Confirmed'
    | 'Packing'
    | 'Shipping'
    | 'Completed'
    | 'Cancelled'
    | 'CancelRequested';

const taoLoi = (
    code: string,
    message: string,
    errorDetails: unknown = null
): LoiDichVu => {
    const loi = new Error(message) as LoiDichVu;
    loi.code = code;
    loi.errorDetails = errorDetails;
    return loi;
};

const DANH_SACH_TRANG_THAI_HOP_LE: TrangThaiDonHang[] = [
    'Pending',
    'Confirmed',
    'Packing',
    'Shipping',
    'Completed',
    'Cancelled',
    'CancelRequested'
];

const CAC_TRANG_THAI_CHO_PHEP_HUY = new Set<TrangThaiDonHang>([
    'Pending',
    'Confirmed',
    'Packing'
]);

const CHUYEN_TRANG_THAI_HOP_LE: Record<
    TrangThaiDonHang,
    TrangThaiDonHang[]
> = {
    Pending: ['Confirmed', 'Cancelled', 'CancelRequested'],
    Confirmed: ['Packing', 'Cancelled', 'CancelRequested'],
    Packing: ['Shipping', 'Cancelled', 'CancelRequested'],
    Shipping: ['Completed'],
    Completed: [],
    Cancelled: [],
    CancelRequested: ['Cancelled', 'Pending', 'Confirmed', 'Packing']
};

const laTrangThaiHopLe = (
    status: string
): status is TrangThaiDonHang =>
    DANH_SACH_TRANG_THAI_HOP_LE.includes(
        status as TrangThaiDonHang
    );

const layAnhChinhSanPham = (images: any[] = []) => {
    const anhChinh = images.find(
        (img: any) => img?.is_main
    );
    return anhChinh?.image_url ?? images[0]?.image_url ?? null;
};

const layThanhToanDauTien = (payments: any) => {
    if (!Array.isArray(payments) || payments.length === 0) {
        return null;
    }

    return payments[0] ?? null;
};

const layThongTinGiaoHang = (shippingAddress: any) => ({
    nguoiNhan:
        shippingAddress?.fullName ?? null,
    soDienThoai:
        shippingAddress?.phone ?? null,
    diaChi:
        shippingAddress?.address ?? null
});

const dinhDangDonHangChoAdmin = (order: any) => {
    const thongTinGiaoHang =
        layThongTinGiaoHang(
            order?.shipping_address
        );
    const payment = layThanhToanDauTien(
        order?.payments
    );

    const mappedUser = order?.users ? {
        ...order.users,
        name: order.users.full_name || null
    } : null;

    const hasCancelRequest = order?.cancel_reason && order.cancel_reason.includes('"isCancelRequested":true');
    const displayStatus = hasCancelRequest ? 'CancelRequested' : (order?.status ?? 'Pending');

    return {
        ...order,
        status: displayStatus,
        users: mappedUser,
        khachHang: mappedUser,
        nguoiNhan:
            thongTinGiaoHang.nguoiNhan,
        soDienThoaiNhan:
            thongTinGiaoHang.soDienThoai,
        diaChiGiaoHang:
            thongTinGiaoHang.diaChi,
        thanhToan: {
            transaction_id:
                payment?.transaction_id ??
                null,
            method:
                payment?.method ?? null,
            amount: Number(
                payment?.amount ??
                order?.final_amount ??
                0
            ),
            status:
                order?.payment_status ??
                payment?.status ??
                'Pending',
            created_at:
                payment?.created_at ?? null
        }
    };
};

// =========================
// GET /stats
// =========================
export const thongKeDonHang = async () => {
    const {
        data: tong,
        error: loiTong
    } = await supabaseClient
        .from('orders')
        .select('final_amount')
        .eq('status', 'Completed');

    if (loiTong) throw loiTong;

    const tongDoanhThu = (tong ?? []).reduce(
        (acc: number, item: any) => {
            const finalAmount = Number(
                item?.final_amount ?? 0
            );
            return acc + finalAmount;
        },
        0
    );

    const {
        data: allOrders,
        error: loiCountTong
    } = await supabaseClient
        .from('orders')
        .select('status, cancel_reason');

    if (loiCountTong) throw loiCountTong;

    const tongSoDon = allOrders?.length ?? 0;

    let donChoDuyet = 0;
    let donDangDongGoi = 0;
    let donDangGiao = 0;
    let donDaHuy = 0;
    let donYeuCauHuy = 0;

    (allOrders || []).forEach((o: any) => {
        const hasCancelRequest = o.cancel_reason && o.cancel_reason.includes('"isCancelRequested":true');
        if (hasCancelRequest) {
            donYeuCauHuy++;
        } else {
            if (o.status === 'Pending') donChoDuyet++;
            else if (o.status === 'Packing') donDangDongGoi++;
            else if (o.status === 'Shipping') donDangGiao++;
            else if (o.status === 'Cancelled') donDaHuy++;
        }
    });

    return {
        tongDoanhThu,
        tongSoDon,
        donChoDuyet,
        donDangDongGoi,
        donDangGiao,
        donDaHuy,
        donYeuCauHuy
    };
};

// =========================
// GET /
// =========================
export const danhSachDonHang = async () => {
    const { data, error } = await supabaseClient
        .from('orders')
        .select(`
            *,
            users (
                full_name,
                email
            ),
            payments (
                transaction_id,
                method,
                amount,
                status,
                created_at
            ),
            order_items (
                id,
                quantity,
                unit_price,
                cost_price,
                variant_id,
                product_variants (
                    id,
                    sku,
                    size,
                    color,
                    products (
                        name,
                        product_images (
                            image_url,
                            is_main
                        )
                    )
                )
            )
        `)
        .order('created_at', {
            ascending: false
        });

    if (error) throw error;

    return (data ?? []).map((order: any) => {
        const orderItems = (order.order_items ?? []).map((it: any) => {
            const bienThe = it?.product_variants;
            const sanPham = bienThe?.products;

            return {
                id: it?.id ?? null,
                quantity: Number(it?.quantity ?? 0),
                unit_price: Number(it?.unit_price ?? 0),
                cost_price: Number(it?.cost_price ?? 0),
                variant_id: it?.variant_id ?? null,
                product: {
                    name: sanPham?.name ?? null,
                    sku: bienThe?.sku ?? null,
                    image_url: layAnhChinhSanPham(sanPham?.product_images ?? []),
                    size: bienThe?.size ?? null,
                    color: bienThe?.color ?? null
                }
            };
        });

        return {
            ...dinhDangDonHangChoAdmin(order),
            order_items: orderItems
        };
    });
};

// =========================
// GET /:id
// =========================
export const chiTietDonHang = async (
    orderId: string
) => {
    const { data, error } = await supabaseClient
        .from('orders')
        .select(`
            *,
            users (
                full_name,
                email
            ),
            payments (
                transaction_id,
                method,
                amount,
                status,
                created_at
            ),
            order_items (
                id,
                quantity,
                unit_price,
                cost_price,
                variant_id,
                product_variants (
                    id,
                    sku,
                    size,
                    color,
                    products (
                        name,
                        product_images (
                            image_url,
                            is_main
                        )
                    )
                )
            )
        `)
        .eq('id', orderId)
        .maybeSingle();

    if (error) throw error;
    if (!data) {
        throw taoLoi(
            'NOT_FOUND',
            'KhÃ´ng tÃ¬m tháº¥y Ä‘Æ¡n hÃ ng'
        );
    }

    const orderItems = (
        data.order_items ?? []
    ).map((it: any) => {
        const bienThe = it?.product_variants;
        const sanPham = bienThe?.products;

        return {
            id: it?.id ?? null,
            quantity: Number(
                it?.quantity ?? 0
            ),
            unit_price: Number(
                it?.unit_price ?? 0
            ),
            cost_price: Number(
                it?.cost_price ?? 0
            ),
            variant_id:
                it?.variant_id ?? null,
            product: {
                name:
                    sanPham?.name ?? null,
                sku:
                    bienThe?.sku ?? null,
                image_url:
                    layAnhChinhSanPham(
                        sanPham?.product_images ??
                        []
                    ),
                size:
                    bienThe?.size ?? null,
                color:
                    bienThe?.color ?? null
            }
        };
    });

    return {
        ...dinhDangDonHangChoAdmin(data),
        order_items: orderItems
    };
};

// =========================
// PATCH /:id/status
// =========================
export const capNhatTrangThaiDonHang = async (
    orderId: string,
    status: string
) => {
    if (!laTrangThaiHopLe(status)) {
        throw new Error(
            'Status không hợp lệ. Chỉ chấp nhận Pending, Confirmed, Packing, Shipping, Completed, Cancelled, CancelRequested.'
        );
    }

    const {
        data: donHang,
        error: loiLayDon
    } = await supabaseClient
        .from('orders')
        .select(`
            id,
            user_id,
            status,
            payment_status,
            shipping_address,
            cancel_reason,
            order_items (
                quantity,
                cost_price,
                variant_id,
                product_variants (
                    id,
                    products (
                        name
                    )
                )
            )
        `)
        .eq('id', orderId)
        .maybeSingle();

    if (loiLayDon) throw loiLayDon;
    if (!donHang) {
        throw taoLoi(
            'NOT_FOUND',
            'Không tìm thấy đơn hàng'
        );
    }

    const trangThaiCu = donHang.status as string;
    if (!laTrangThaiHopLe(trangThaiCu)) {
        throw new Error(
            `Trạng thái hiện tại "${trangThaiCu}" không nằm trong luồng xử lý chuẩn.`
        );
    }

    if (trangThaiCu === status) {
        const hasCancelRequest = donHang.cancel_reason && donHang.cancel_reason.includes('"isCancelRequested":true');
        if (hasCancelRequest) {
            // Từ chối hủy: chỉ cần xóa cancel_reason
            const { data: donCapNhat, error: loiCapNhat } = await supabaseClient
                .from('orders')
                .update({ cancel_reason: null })
                .eq('id', orderId)
                .select()
                .single();
            if (loiCapNhat) throw loiCapNhat;
            return dinhDangDonHangChoAdmin(donCapNhat);
        }
        throw new Error(
            `Đơn hàng đã ở trạng thái "${status}".`
        );
    }

    // Nếu đang có yêu cầu hủy mà Admin duyệt tiếp sang trạng thái khác (tiếp tục xử lý)
    // thì tự động xóa yêu cầu hủy
    const hasCancelRequest = donHang.cancel_reason && donHang.cancel_reason.includes('"isCancelRequested":true');

    const trangThaiTiepTheoHopLe =
        CHUYEN_TRANG_THAI_HOP_LE[
        trangThaiCu as TrangThaiDonHang
        ];

    // Cho phép chuyển sang Cancelled hoặc các trạng thái tiếp theo chuẩn
    if (status !== 'Cancelled' && !trangThaiTiepTheoHopLe.includes(status as TrangThaiDonHang)) {
        throw new Error(
            `Không thể chuyển trạng thái từ "${trangThaiCu}" sang "${status}".`
        );
    }

    const orderItems = (
        donHang.order_items ?? []
    ) as any[];

    const daCapNhatKho: Array<{
        variantId: number;
        soLuongTruoc: number;
        soLuongSau: number;
    }> = [];

    try {
        // Parse shipping_address và timeline hiện tại
        const currentShipping = donHang.shipping_address ? (typeof donHang.shipping_address === 'string' ? JSON.parse(donHang.shipping_address) : donHang.shipping_address) : {};
        const timeline = currentShipping.timeline || {};

        // 1. Duyệt đơn (Pending -> Confirmed): thực hiện trừ kho và ghi log BÁN HÀNG (EXPORT_SELL)
        if (trangThaiCu === 'Pending' && status === 'Confirmed') {
            for (const item of orderItems) {
                const soLuongMua = Number(item?.quantity ?? 0);
                const bienThe = item?.product_variants;
                const variantId = Number(item?.variant_id ?? bienThe?.id);
                const tenSanPham = bienThe?.products?.name ?? 'Sản phẩm';

                // Lấy tồn kho hiện tại
                const { data: bienTheHienTai, error: loiLayBienTe } = await supabaseClient
                    .from('product_variants')
                    .select('stock_quantity, cost_price')
                    .eq('id', variantId)
                    .maybeSingle();

                if (loiLayBienTe) throw loiLayBienTe;
                if (!bienTheHienTai) {
                    throw taoLoi('NOT_FOUND', `Không tìm thấy biến thể cho sản phẩm ${tenSanPham}`);
                }

                const stockHienTai = Number(bienTheHienTai.stock_quantity ?? 0);
                if (stockHienTai < soLuongMua) {
                    throw new Error(`Sản phẩm ${tenSanPham} không đủ tồn kho để duyệt đơn (Hiện còn: ${stockHienTai}, cần: ${soLuongMua}).`);
                }

                const soLuongSau = stockHienTai - soLuongMua;
                const costPrice = Number(item?.cost_price ?? bienTheHienTai.cost_price ?? 0);

                // Cập nhật tồn kho mới
                const { error: loiUpdate } = await supabaseClient
                    .from('product_variants')
                    .update({ stock_quantity: soLuongSau })
                    .eq('id', variantId);

                if (loiUpdate) throw loiUpdate;

                daCapNhatKho.push({
                    variantId,
                    soLuongTruoc: stockHienTai,
                    soLuongSau
                });

                // Ghi log bán hàng
                const { error: loiThemLog } = await supabaseClient
                    .from('inventory_logs')
                    .insert([
                        {
                            variant_id: variantId,
                            action_type: 'EXPORT_SELL',
                            reference_id: orderId,
                            quantity: soLuongMua,
                            cost_price: costPrice
                        }
                    ]);

                if (loiThemLog) throw loiThemLog;
            }
        }

        // 2. Hủy đơn: Hoàn tồn kho và ghi log NHẬP KHO (IMPORT)
        // Chỉ hoàn kho khi đơn hàng đã từng được trừ kho (ở Confirmed hoặc Packing hoặc Shipping)
        const wasStockReduced = ['Confirmed', 'Packing', 'Shipping'].includes(trangThaiCu) ||
            (trangThaiCu === 'CancelRequested' && (timeline.Confirmed || timeline.Packing));

        if (status === 'Cancelled' && wasStockReduced) {
            for (const item of orderItems) {
                const soLuongMua = Number(
                    item?.quantity ?? 0
                );
                const bienThe =
                    item?.product_variants;
                const variantId = Number(
                    item?.variant_id ??
                    bienThe?.id
                );
                const tenSanPham =
                    bienThe?.products?.name ??
                    'Sản phẩm';

                const {
                    data: bienTheHienTai,
                    error: loiLayBienThe
                } = await supabaseClient
                    .from('product_variants')
                    .select(
                        'stock_quantity, cost_price'
                    )
                    .eq('id', variantId)
                    .maybeSingle();

                if (loiLayBienThe) {
                    throw loiLayBienThe;
                }

                if (!bienTheHienTai) {
                    throw taoLoi(
                        'NOT_FOUND',
                        `Không tìm thấy biến thể cho sản phẩm ${tenSanPham}`
                    );
                }

                const stockHienTai = Number(
                    bienTheHienTai.stock_quantity ??
                    0
                );
                const soLuongSau =
                    stockHienTai +
                    soLuongMua;
                const costPrice = Number(
                    item?.cost_price ??
                    bienTheHienTai.cost_price ??
                    0
                );

                const {
                    error: loiUpdate
                } = await supabaseClient
                    .from('product_variants')
                    .update({
                        stock_quantity:
                            soLuongSau
                    })
                    .eq('id', variantId);

                if (loiUpdate) {
                    throw loiUpdate;
                }

                daCapNhatKho.push({
                    variantId,
                    soLuongTruoc:
                        stockHienTai,
                    soLuongSau
                });

                const {
                    error: loiThemLog
                } = await supabaseClient
                    .from('inventory_logs')
                    .insert([
                        {
                            variant_id:
                                variantId,
                            action_type:
                                'IMPORT',
                            reference_id:
                                orderId,
                            quantity:
                                soLuongMua,
                            cost_price:
                                costPrice
                        }
                    ]);

                if (loiThemLog) {
                    throw loiThemLog;
                }
            }
        }

        // Cập nhật timeline
        const updatedTimeline = {
            ...timeline,
            [status]: new Date().toISOString()
        };
        const updatedShippingAddress = {
            ...currentShipping,
            timeline: updatedTimeline
        };

        const duLieuCapNhat: {
            status: TrangThaiDonHang;
            payment_status?: string;
            shipping_address: any;
            cancel_reason?: string | null;
        } = {
            status: status as TrangThaiDonHang,
            shipping_address: updatedShippingAddress
        };

        if (status === 'Cancelled') {
            duLieuCapNhat.payment_status = 'Failed';

            // Trích xuất lý do hủy sạch từ JSON của khách hàng
            let cleanReason = 'Hủy bởi Admin / Đồng ý hủy';
            if (donHang.cancel_reason) {
                try {
                    const parsed = JSON.parse(donHang.cancel_reason);
                    cleanReason = parsed.reason || 'Khách hàng gửi yêu cầu hủy';
                } catch (e) {
                    cleanReason = donHang.cancel_reason;
                }
            }
            duLieuCapNhat.cancel_reason = cleanReason;
        } else {
            // Nếu Admin duyệt tiếp trạng thái khác, tự động xóa yêu cầu hủy
            duLieuCapNhat.cancel_reason = null;
        }

        if (status === 'Completed') {
            duLieuCapNhat.payment_status = 'Paid';
        }

        const {
            data: donCapNhat,
            error: loiCapNhat
        } = await supabaseClient
            .from('orders')
            .update(duLieuCapNhat)
            .eq('id', orderId)
            .select('*')
            .maybeSingle();

        if (loiCapNhat) throw loiCapNhat;
        if (!donCapNhat) {
            throw taoLoi(
                'NOT_FOUND',
                'Không tìm thấy đơn hàng'
            );
        }

        // 3. Tạo thông báo gửi cho khách hàng (Client)
        try {
            let title = 'Cập nhật đơn hàng';
            let message = `Đơn hàng #${orderId} của bạn đã thay đổi trạng thái sang: ${status}.`;
            let type = 'info';

            if (status === 'Confirmed') {
                title = 'Đơn hàng đã được xác nhận';
                message = `Đơn hàng #${orderId} của bạn đã được xác nhận và chuẩn bị soạn hàng.`;
                type = 'success';
            } else if (status === 'Packing') {
                title = 'Đơn hàng đang đóng gói';
                message = `Đơn hàng #${orderId} của bạn đang được soạn và đóng gói.`;
                type = 'info';
            } else if (status === 'Shipping') {
                title = 'Đơn hàng đang được giao';
                message = `Đơn hàng #${orderId} của bạn đang được vận chuyển tới bạn.`;
                type = 'info';
            } else if (status === 'Completed') {
                title = 'Đơn hàng hoàn tất';
                message = `Đơn hàng #${orderId} của bạn đã được giao thành công. Cảm ơn bạn đã tin dùng sản phẩm của ELITE PERFORMANCE!`;
                type = 'success';
            } else if (status === 'Cancelled') {
                type = 'error';
                if (trangThaiCu === 'CancelRequested') {
                    title = 'Yêu cầu hủy đơn hàng đã được duyệt';
                    message = `Yêu cầu hủy đơn hàng #${orderId} của bạn đã được quản trị viên phê duyệt thành công.`;
                } else {
                    title = 'Đơn hàng đã bị hủy';
                    message = `Đơn hàng #${orderId} của bạn đã bị hủy.`;
                }
            }

            await supabaseClient.from('notifications').insert([{
                user_id: donHang.user_id,
                title,
                message,
                type,
                is_read: false,
                reference_id: String(orderId),
                reference_type: 'order'
            }]);
        } catch (err) {
            console.error("Lỗi khi tạo thông báo trạng thái đơn hàng:", err);
        }

        return donCapNhat;
    } catch (error: any) {
        for (
            let i = daCapNhatKho.length - 1;
            i >= 0;
            i--
        ) {
            const item = daCapNhatKho[i];
            if (!item) continue;

            try {
                await supabaseClient
                    .from('product_variants')
                    .update({
                        stock_quantity:
                            item.soLuongTruoc
                    })
                    .eq('id', item.variantId);
            } catch {
                // ignore rollback failures
            }
        }

        throw error;
    }
};