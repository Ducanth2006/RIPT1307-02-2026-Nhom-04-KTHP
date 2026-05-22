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
    | 'Cancelled';

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
    'Cancelled'
];

const CAC_TRANG_THAI_CHO_PHEP_HUY = new Set<TrangThaiDonHang>([
    'Pending',
    'Confirmed'
]);

const CHUYEN_TRANG_THAI_HOP_LE: Record<
    TrangThaiDonHang,
    TrangThaiDonHang[]
> = {
    Pending: ['Confirmed', 'Cancelled'],
    Confirmed: ['Packing', 'Cancelled'],
    Packing: ['Shipping', 'Cancelled'],
    Shipping: ['Completed', 'Cancelled'],
    Completed: [],
    Cancelled: []
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

    return {
        ...order,
        khachHang: order?.users ?? null,
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
        count: tongSoDon,
        error: loiCountTong
    } = await supabaseClient
        .from('orders')
        .select('*', {
            count: 'exact',
            head: true
        });

    if (loiCountTong) throw loiCountTong;

    const laySoLuongTheoTrangThai = async (
        status: string
    ) => {
        const {
            count,
            error
        } = await supabaseClient
            .from('orders')
            .select('*', {
                count: 'exact',
                head: true
            })
            .eq('status', status);

        if (error) throw error;
        return count ?? 0;
    };

    const donChoDuyet =
        await laySoLuongTheoTrangThai(
            'Pending'
        );
    const donDangDongGoi =
        await laySoLuongTheoTrangThai(
            'Packing'
        );
    const donDangGiao =
        await laySoLuongTheoTrangThai(
            'Shipping'
        );

    return {
        tongDoanhThu,
        tongSoDon: tongSoDon ?? 0,
        donChoDuyet,
        donDangDongGoi,
        donDangGiao
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
                name,
                email
            ),
            payments (
                transaction_id,
                method,
                amount,
                status,
                created_at
            )
        `)
        .order('created_at', {
            ascending: false
        });

    if (error) throw error;

    return (data ?? []).map(
        dinhDangDonHangChoAdmin
    );
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
                name,
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
            'Status khÃ´ng há»£p lá»‡. Chá»‰ cháº¥p nháº­n Pending, Confirmed, Packing, Shipping, Completed, Cancelled.'
        );
    }

    const {
        data: donHang,
        error: loiLayDon
    } = await supabaseClient
        .from('orders')
        .select(`
            id,
            status,
            payment_status,
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
            'KhÃ´ng tÃ¬m tháº¥y Ä‘Æ¡n hÃ ng'
        );
    }

    const trangThaiCu = donHang.status as string;
    if (!laTrangThaiHopLe(trangThaiCu)) {
        throw new Error(
            `Tráº¡ng thÃ¡i hiá»‡n táº¡i "${trangThaiCu}" khÃ´ng náº±m trong luá»“ng xá»­ lÃ½ chuáº©n.`
        );
    }

    if (trangThaiCu === status) {
        throw new Error(
            `ÄÆ¡n hÃ ng Ä‘Ã£ á»Ÿ tráº¡ng thÃ¡i "${status}".`
        );
    }

    const trangThaiTiepTheoHopLe =
        CHUYEN_TRANG_THAI_HOP_LE[
            trangThaiCu
        ];

    if (!trangThaiTiepTheoHopLe.includes(status)) {
        throw new Error(
            `KhÃ´ng thá»ƒ chuyá»ƒn tráº¡ng thÃ¡i tá»« "${trangThaiCu}" sang "${status}".`
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

                // Ghi log bán hàng (EXPORT_SELL - hiển thị tag màu xanh dương)
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

        // 2. Hủy đơn (Trạng thái cũ đã từng trừ kho: Confirmed, Packing, Shipping) -> Hoàn tồn kho và ghi log NHẬP KHO (IMPORT)
        if (
            status === 'Cancelled' &&
            ['Confirmed', 'Packing', 'Shipping'].includes(trangThaiCu)
        ) {
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

        const duLieuCapNhat: {
            status: TrangThaiDonHang;
            payment_status?: string;
        } = {
            status
        };

        if (status === 'Cancelled') {
            duLieuCapNhat.payment_status =
                'Failed';
        }

        if (status === 'Completed') {
            duLieuCapNhat.payment_status =
                'Paid';
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
                'KhÃ´ng tÃ¬m tháº¥y Ä‘Æ¡n hÃ ng'
            );
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
