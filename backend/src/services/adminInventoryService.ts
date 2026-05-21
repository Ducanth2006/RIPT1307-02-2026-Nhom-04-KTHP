import supabaseClient from '../config/supabase';

type LoiDichVu = Error & {
    code?: string;
    errorDetails?: unknown;
};

const taoLoiDichVu = (
    code: string,
    message: string,
    errorDetails: unknown = null
): LoiDichVu => {
    const loi = new Error(message) as LoiDichVu;

    loi.code = code;
    loi.errorDetails = errorDetails;

    return loi;
};

// =========================
// THỐNG KÊ KHO
// =========================

export const layThongKeKho = async () => {
    const { data, error } = await supabaseClient
        .from('product_variants')
        .select(`
            stock_quantity,
            cost_price
        `);

    if (error) {
        throw error;
    }

    let tongGiaTriKho = 0;
    let soLuongSapHet = 0;

    for (const item of data || []) {
        const stock = Number(item.stock_quantity || 0);
        const costPrice = Number(item.cost_price || 0);

        tongGiaTriKho += stock * costPrice;

        if (stock > 0 && stock <= 5) {
            soLuongSapHet++;
        }
    }

    return {
        tongGiaTriKho,
        soLuongSapHet
    };
};

// =========================
// DANH SÁCH KHO
// =========================

export const layDanhSachKho = async () => {
    const { data: danhSachBienThe, error } =
        await supabaseClient
            .from('product_variants')
            .select(`
                id,
                product_id,
                sku,
                size,
                color,
                price,
                stock_quantity,
                cost_price,
                products (
                    name,
                    product_images (
                        image_url,
                        is_main
                    )
                )
            `)
            .order('stock_quantity', {
                ascending: true
            })
            .order('id', {
                ascending: true
            });

    if (error) {
        throw error;
    }

    return (danhSachBienThe ?? []).map(
        (bienThe: any) => {
            const sanPham = Array.isArray(
                bienThe.products
            )
                ? bienThe.products[0]
                : bienThe.products;

            const danhSachAnh = Array.isArray(
                sanPham?.product_images
            )
                ? sanPham.product_images
                : [];

            const anhChinh =
                danhSachAnh.find(
                    (anh: any) => anh.is_main
                ) ||
                danhSachAnh[0] ||
                null;

            return {
                id: bienThe.id,
                product_id:
                    bienThe.product_id,
                sku: bienThe.sku,
                size: bienThe.size,
                color: bienThe.color,
                price: Number(
                    bienThe.price ?? 0
                ),
                stock_quantity: Number(
                    bienThe.stock_quantity ?? 0
                ),
                cost_price: Number(
                    bienThe.cost_price ?? 0
                ),
                product_name:
                    sanPham?.name ?? null,

                // frontend đang cần product_images
                product_images:
                    danhSachAnh.map(
                        (anh: any) => ({
                            url:
                                anh.image_url,
                            is_main:
                                anh.is_main
                        })
                    ),

                // giữ luôn main_image nếu cần
                main_image:
                    anhChinh?.image_url ??
                    null
            };
        }
    );
};

// =========================
// NHẬP KHO
// =========================

export const nhapKho = async (
    variantId: number,
    soLuongNhap: number,
    giaNhap: number
) => {
    const {
        data: bienTheHienTai,
        error: loiLayBienThe
    } = await supabaseClient
        .from('product_variants')
        .select(`
            id,
            product_id,
            sku,
            size,
            color,
            price,
            stock_quantity,
            cost_price
        `)
        .eq('id', variantId)
        .maybeSingle();

    if (loiLayBienThe) {
        throw loiLayBienThe;
    }

    if (!bienTheHienTai) {
        throw taoLoiDichVu(
            'NOT_FOUND',
            'Không tìm thấy biến thể sản phẩm'
        );
    }

    const soLuongTruoc = Number(
        bienTheHienTai.stock_quantity ?? 0
    );

    const giaVonTruoc = Number(
        bienTheHienTai.cost_price ?? 0
    );

    const soLuongSau =
        soLuongTruoc + soLuongNhap;

    let daCapNhatBienThe = false;

    try {
        const {
            data: bienTheDaCapNhat,
            error: loiCapNhatBienThe
        } = await supabaseClient
            .from('product_variants')
            .update({
                stock_quantity: soLuongSau,
                cost_price: giaNhap
            })
            .eq('id', variantId)
            .select(`
                id,
                product_id,
                sku,
                size,
                color,
                price,
                stock_quantity,
                cost_price
            `)
            .single();

        if (loiCapNhatBienThe) {
            throw loiCapNhatBienThe;
        }

        daCapNhatBienThe = true;

        const {
            data: lichSuDaTao,
            error: loiTaoLichSu
        } = await supabaseClient
            .from('inventory_logs')
            .insert([
                {
                    variant_id: variantId,
                    action_type: 'IMPORT',
                    quantity: soLuongNhap,
                    cost_price: giaNhap
                }
            ])
            .select()
            .single();

        if (loiTaoLichSu) {
            throw loiTaoLichSu;
        }

        return {
            variant: {
                ...bienTheDaCapNhat,
                price: Number(
                    bienTheDaCapNhat.price ??
                        0
                ),
                stock_quantity: Number(
                    bienTheDaCapNhat.stock_quantity ??
                        0
                ),
                cost_price: Number(
                    bienTheDaCapNhat.cost_price ??
                        0
                )
            },

            lichSuKho: {
                ...lichSuDaTao,
                quantity: Number(
                    lichSuDaTao.quantity ??
                        0
                ),
                cost_price: Number(
                    lichSuDaTao.cost_price ??
                        0
                )
            },

            soLuongTruoc,
            soLuongSau
        };
    } catch (error: any) {
        if (daCapNhatBienThe) {
            const {
                error: loiRollback
            } = await supabaseClient
                .from('product_variants')
                .update({
                    stock_quantity:
                        soLuongTruoc,
                    cost_price:
                        giaVonTruoc
                })
                .eq('id', variantId);

            if (loiRollback) {
                throw taoLoiDichVu(
                    'ROLLBACK_FAILED',
                    'Nhập kho thất bại và không thể hoàn tác dữ liệu tồn kho',
                    {
                        loiGoc:
                            error?.message ||
                            error,
                        loiRollback
                    }
                );
            }

            throw taoLoiDichVu(
                'IMPORT_FAILED',
                'Nhập kho thất bại. Dữ liệu đã được hoàn tác',
                error?.message || error
            );
        }

        throw error;
    }
};

// =========================
// LẤY LỊCH SỬ KHO
// =========================

export const layLichSuKho = async (
    variantId?: number
) => {
    let query = supabaseClient
        .from('inventory_logs')
        .select(`
            id,
            variant_id,
            action_type,
            quantity,
            cost_price,
            created_at,
            product_variants (
                sku,
                size,
                color,
                products (
                    name
                )
            )
        `)
        .order('created_at', {
            ascending: false
        })
        .order('id', {
            ascending: false
        });

    // nếu có variantId thì filter
    if (variantId) {
        // kiểm tra biến thể tồn tại
        const {
            data: bienTheHienTai,
            error: loiLayBienThe
        } = await supabaseClient
            .from('product_variants')
            .select('id')
            .eq('id', variantId)
            .maybeSingle();

        if (loiLayBienThe) {
            throw loiLayBienThe;
        }

        if (!bienTheHienTai) {
            throw taoLoiDichVu(
                'NOT_FOUND',
                'Không tìm thấy biến thể sản phẩm'
            );
        }

        query = query.eq(
            'variant_id',
            variantId
        );
    }

    const {
        data: lichSuKho,
        error: loiLayLichSu
    } = await query;

    if (loiLayLichSu) {
        throw loiLayLichSu;
    }

    return (lichSuKho ?? []).map(
        (banGhi: any) => {
            const bienThe = Array.isArray(
                banGhi.product_variants
            )
                ? banGhi.product_variants[0]
                : banGhi.product_variants;

            const sanPham = Array.isArray(
                bienThe?.products
            )
                ? bienThe.products[0]
                : bienThe?.products;

            return {
                id: banGhi.id,
                variant_id:
                    banGhi.variant_id,

                type:
                    banGhi.action_type,

                quantity: Number(
                    banGhi.quantity ?? 0
                ),

                cost_price: Number(
                    banGhi.cost_price ??
                        0
                ),

                created_at:
                    banGhi.created_at,

                sku:
                    bienThe?.sku ?? '',

                size:
                    bienThe?.size ?? '',

                color:
                    bienThe?.color ?? '',

                product_name:
                    sanPham?.name ?? ''
            };
        }
    );
};

// =========================
// XUẤT KHO THỦ CÔNG
// =========================

export const xuatKhoThuCong = async (
    variantId: number,
    soLuongXuat: number
) => {
    let daCapNhatBienThe = false;

    let soLuongTruoc = 0;

    let giaVonHienTai = 0;

    try {
        const {
            data: bienTheHienTai,
            error: loiLayBienThe
        } = await supabaseClient
            .from('product_variants')
            .select(`
                id,
                product_id,
                sku,
                size,
                color,
                price,
                stock_quantity,
                cost_price
            `)
            .eq('id', variantId)
            .maybeSingle();

        if (loiLayBienThe) {
            throw loiLayBienThe;
        }

        if (!bienTheHienTai) {
            throw taoLoiDichVu(
                'NOT_FOUND',
                'Không tìm thấy biến thể sản phẩm'
            );
        }

        soLuongTruoc = Number(
            bienTheHienTai.stock_quantity ??
                0
        );

        giaVonHienTai = Number(
            bienTheHienTai.cost_price ??
                0
        );

        if (
            soLuongTruoc <
            soLuongXuat
        ) {
            throw taoLoiDichVu(
                'INVALID_QUANTITY',
                'Số lượng xuất vượt quá tồn kho hiện tại. Vui lòng kiểm tra lại!'
            );
        }

        const soLuongSau =
            soLuongTruoc -
            soLuongXuat;

        const {
            data: bienTheDaCapNhat,
            error: loiCapNhatBienThe
        } = await supabaseClient
            .from('product_variants')
            .update({
                stock_quantity:
                    soLuongSau
            })
            .eq('id', variantId)
            .select(`
                id,
                product_id,
                sku,
                size,
                color,
                price,
                stock_quantity,
                cost_price
            `)
            .single();

        if (loiCapNhatBienThe) {
            throw loiCapNhatBienThe;
        }

        daCapNhatBienThe = true;

        const {
            data: lichSuDaTao,
            error: loiTaoLichSu
        } = await supabaseClient
            .from('inventory_logs')
            .insert([
                {
                    variant_id: variantId,
                    action_type:
                        'EXPORT_DELETE',
                    quantity:
                        soLuongXuat,
                    cost_price:
                        giaVonHienTai
                }
            ])
            .select()
            .single();

        if (loiTaoLichSu) {
            throw loiTaoLichSu;
        }

        return {
            variant: {
                ...bienTheDaCapNhat,
                price: Number(
                    bienTheDaCapNhat.price ??
                        0
                ),
                stock_quantity: Number(
                    bienTheDaCapNhat.stock_quantity ??
                        0
                ),
                cost_price: Number(
                    bienTheDaCapNhat.cost_price ??
                        0
                )
            },

            lichSuKho: {
                ...lichSuDaTao,
                quantity: Number(
                    lichSuDaTao.quantity ??
                        0
                ),
                cost_price: Number(
                    lichSuDaTao.cost_price ??
                        0
                )
            },

            soLuongTruoc,
            soLuongSau
        };
    } catch (error: any) {
        if (daCapNhatBienThe) {
            const {
                error: loiRollback
            } = await supabaseClient
                .from('product_variants')
                .update({
                    stock_quantity:
                        soLuongTruoc
                })
                .eq('id', variantId);

            if (loiRollback) {
                throw taoLoiDichVu(
                    'ROLLBACK_FAILED',
                    'Xuất kho thất bại và không thể hoàn tác dữ liệu tồn kho',
                    {
                        loiGoc:
                            error?.message ||
                            error,
                        loiRollback
                    }
                );
            }

            throw taoLoiDichVu(
                'EXPORT_FAILED',
                'Xuất kho thất bại. Dữ liệu đã được hoàn tác',
                error?.message || error
            );
        }

        throw error;
    }
};