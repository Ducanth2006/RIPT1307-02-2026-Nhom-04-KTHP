import supabaseClient from '../config/supabase';

/**
 * Cột thực tế trong bảng "vouchers" trên Supabase:
 *   id, code, discount_type, discount_value, min_order_value,
 *   max_discount, quantity, start_date, end_date, status
 */

// ============================
// Lấy danh sách tất cả voucher (kèm used_count đếm từ bảng orders)
// ============================
export const fetchAllVouchers = async () => {
    const { data: voucherList, error: fetchError } = await supabaseClient
        .from('vouchers')
        .select('*')
        .order('id', { ascending: false });

    if (fetchError) {
        console.error("Lỗi khi lấy danh sách voucher:", fetchError);
        throw fetchError;
    }

    // Đếm số đơn hàng đã sử dụng từng voucher (không tính đơn hủy)
    const { data: usageData, error: usageError } = await supabaseClient
        .from('orders')
        .select('voucher_id')
        .not('voucher_id', 'is', null)
        .neq('status', 'Cancelled');

    if (usageError) {
        console.error("Lỗi khi đếm usage voucher:", usageError);
    }

    const usageMap: Record<number, number> = {};
    if (usageData) {
        for (const order of usageData) {
            const vid = order.voucher_id;
            if (vid) {
                usageMap[vid] = (usageMap[vid] || 0) + 1;
            }
        }
    }

    return (voucherList || []).map((v: any) => ({
        ...v,
        used_count: usageMap[v.id] || 0
    }));
};

// ============================
// Lấy chi tiết voucher theo ID (kèm thống kê)
// ============================
export const fetchVoucherById = async (voucherId: string) => {
    const { data: voucher, error } = await supabaseClient
        .from('vouchers')
        .select('*')
        .eq('id', voucherId)
        .maybeSingle();

    if (error) throw new Error('Lỗi khi lấy chi tiết voucher: ' + error.message);
    if (!voucher) throw new Error('Voucher không tồn tại.');

    // Đếm số đơn đã dùng voucher này
    const { data: usedOrders, error: usageError } = await supabaseClient
        .from('orders')
        .select('id, final_amount, created_at, status')
        .eq('voucher_id', voucherId)
        .neq('status', 'Cancelled')
        .order('created_at', { ascending: false });

    if (usageError) console.error("Lỗi khi đếm usage:", usageError);

    return {
        ...voucher,
        used_count: usedOrders?.length ?? 0,
        recent_orders: (usedOrders || []).slice(0, 10)
    };
};

// ============================
// Tạo một voucher mới
// ============================
export const createVoucher = async (voucherData: {
    code: string;
    discount_type: string;
    discount_value: number;
    max_discount?: number | null;
    min_order_value?: number;
    quantity: number;
    start_date?: string | null;
    end_date?: string | null;
    status?: string;
}) => {
    // Kiểm tra code trùng
    const { data: existing } = await supabaseClient
        .from('vouchers')
        .select('id')
        .eq('code', voucherData.code.trim().toUpperCase())
        .maybeSingle();

    if (existing) {
        throw new Error(`Mã voucher "${voucherData.code}" đã tồn tại trong hệ thống.`);
    }

    const insertData: Record<string, any> = {
        code: voucherData.code.trim().toUpperCase(),
        discount_type: voucherData.discount_type || 'Percentage',
        discount_value: Number(voucherData.discount_value),
        quantity: Number(voucherData.quantity),
        status: voucherData.status || 'Active'
    };

    // Chỉ thêm các field optional nếu có giá trị
    if (voucherData.max_discount !== undefined && voucherData.max_discount !== null) {
        insertData.max_discount = Number(voucherData.max_discount);
    }
    if (voucherData.min_order_value !== undefined) {
        insertData.min_order_value = Number(voucherData.min_order_value);
    }
    if (voucherData.start_date) {
        insertData.start_date = voucherData.start_date;
    }
    if (voucherData.end_date) {
        insertData.end_date = voucherData.end_date;
    }

    const { data: newVoucher, error: insertError } = await supabaseClient
        .from('vouchers')
        .insert([insertData])
        .select()
        .single();

    if (insertError) {
        console.error("Lỗi khi tạo voucher mới:", insertError);
        throw new Error('Lỗi khi tạo voucher: ' + insertError.message);
    }

    return newVoucher;
};

// ============================
// Cập nhật thông tin voucher
// ============================
export const updateVoucher = async (voucherId: string, updateData: {
    code?: string;
    discount_type?: string;
    discount_value?: number;
    max_discount?: number | null;
    min_order_value?: number;
    quantity?: number;
    start_date?: string | null;
    end_date?: string | null;
    status?: string;
}) => {
    // Kiểm tra voucher tồn tại
    const { data: existing, error: fetchError } = await supabaseClient
        .from('vouchers')
        .select('*')
        .eq('id', voucherId)
        .maybeSingle();

    if (fetchError) throw new Error('Lỗi khi kiểm tra voucher: ' + fetchError.message);
    if (!existing) throw new Error('Voucher không tồn tại.');

    // Nếu đổi code thì kiểm tra trùng
    if (updateData.code && updateData.code.trim().toUpperCase() !== existing.code) {
        const { data: duplicate } = await supabaseClient
            .from('vouchers')
            .select('id')
            .eq('code', updateData.code.trim().toUpperCase())
            .neq('id', voucherId)
            .maybeSingle();

        if (duplicate) {
            throw new Error(`Mã voucher "${updateData.code}" đã được sử dụng bởi voucher khác.`);
        }
    }

    // Chuẩn bị dữ liệu - CHỈ gồm các cột thực tế trong DB
    const fieldsToUpdate: Record<string, any> = {};

    if (updateData.code !== undefined) fieldsToUpdate.code = updateData.code.trim().toUpperCase();
    if (updateData.discount_type !== undefined) fieldsToUpdate.discount_type = updateData.discount_type;
    if (updateData.discount_value !== undefined) fieldsToUpdate.discount_value = Number(updateData.discount_value);
    if (updateData.max_discount !== undefined) fieldsToUpdate.max_discount = updateData.max_discount !== null ? Number(updateData.max_discount) : null;
    if (updateData.min_order_value !== undefined) fieldsToUpdate.min_order_value = Number(updateData.min_order_value);
    if (updateData.quantity !== undefined) fieldsToUpdate.quantity = Number(updateData.quantity);
    if (updateData.start_date !== undefined) fieldsToUpdate.start_date = updateData.start_date;
    if (updateData.end_date !== undefined) fieldsToUpdate.end_date = updateData.end_date;
    if (updateData.status !== undefined) fieldsToUpdate.status = updateData.status;

    if (Object.keys(fieldsToUpdate).length === 0) {
        throw new Error('Không có dữ liệu nào để cập nhật.');
    }

    const { data: updated, error: updateError } = await supabaseClient
        .from('vouchers')
        .update(fieldsToUpdate)
        .eq('id', voucherId)
        .select()
        .single();

    if (updateError) {
        console.error("Lỗi khi cập nhật voucher:", updateError);
        throw new Error('Lỗi khi cập nhật voucher: ' + updateError.message);
    }

    return updated;
};

// ============================
// Xóa voucher
// ============================
export const deleteVoucher = async (voucherId: string) => {
    const { data: existing, error: fetchError } = await supabaseClient
        .from('vouchers')
        .select('id, code')
        .eq('id', voucherId)
        .maybeSingle();

    if (fetchError) throw new Error('Lỗi khi kiểm tra voucher: ' + fetchError.message);
    if (!existing) throw new Error('Voucher không tồn tại.');

    // Không cho xóa nếu đã có đơn hàng sử dụng
    const { data: usedOrders } = await supabaseClient
        .from('orders')
        .select('id')
        .eq('voucher_id', voucherId)
        .limit(1);

    if (usedOrders && usedOrders.length > 0) {
        throw new Error(`Không thể xóa voucher "${existing.code}" vì đã có đơn hàng sử dụng. Hãy vô hiệu hóa (Disable) thay vì xóa.`);
    }

    const { error: deleteError } = await supabaseClient
        .from('vouchers')
        .delete()
        .eq('id', voucherId);

    if (deleteError) throw new Error('Lỗi khi xóa voucher: ' + deleteError.message);

    return { id: voucherId, code: existing.code };
};

// ============================
// Toggle trạng thái voucher (Active <-> Disabled)
// ============================
export const toggleVoucherStatus = async (voucherId: string) => {
    const { data: voucher, error: fetchError } = await supabaseClient
        .from('vouchers')
        .select('id, code, status')
        .eq('id', voucherId)
        .maybeSingle();

    if (fetchError) throw new Error('Lỗi khi lấy voucher: ' + fetchError.message);
    if (!voucher) throw new Error('Voucher không tồn tại.');

    const newStatus = voucher.status === 'Active' ? 'Disabled' : 'Active';

    const { data: updated, error: updateError } = await supabaseClient
        .from('vouchers')
        .update({ status: newStatus })
        .eq('id', voucherId)
        .select()
        .single();

    if (updateError) throw new Error('Lỗi khi toggle trạng thái: ' + updateError.message);

    return updated;
};

// ============================
// Dashboard thống kê voucher (thiết kế lại)
// ============================
export const getVoucherStats = async () => {
    const { data: allVouchers, error: vError } = await supabaseClient
        .from('vouchers')
        .select('*');

    if (vError) throw vError;

    const vouchers = allVouchers || [];
    const now = new Date();

    let totalVouchers = vouchers.length;
    let activeVouchers = 0;
    let expiredVouchers = 0;
    let disabledVouchers = 0;
    let totalQuantityRemaining = 0;

    // Voucher sắp hết hạn (trong 7 ngày tới)
    const expiringThreshold = new Date();
    expiringThreshold.setDate(expiringThreshold.getDate() + 7);

    const expiringSoon: Array<{
        id: number;
        code: string;
        end_date: string;
        days_remaining: number;
        quantity: number;
    }> = [];

    for (const v of vouchers) {
        const statusLower = (v.status || '').toLowerCase();

        if (statusLower === 'disabled') {
            disabledVouchers++;
        } else if (statusLower === 'active') {
            if (v.end_date && new Date(v.end_date) < now) {
                expiredVouchers++;
            } else {
                activeVouchers++;

                // Kiểm tra sắp hết hạn
                if (v.end_date) {
                    const endDate = new Date(v.end_date);
                    if (endDate <= expiringThreshold && endDate >= now) {
                        const daysRemaining = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                        expiringSoon.push({
                            id: v.id,
                            code: v.code,
                            end_date: v.end_date,
                            days_remaining: daysRemaining,
                            quantity: v.quantity
                        });
                    }
                }
            }
        }

        if (v.quantity !== null) {
            totalQuantityRemaining += Number(v.quantity || 0);
        }
    }

    // Sắp xếp theo ngày hết hạn sớm nhất trước
    expiringSoon.sort((a, b) => a.days_remaining - b.days_remaining);

    // Đếm tổng lượt sử dụng voucher
    const { data: usedOrders, error: uError } = await supabaseClient
        .from('orders')
        .select('voucher_id')
        .not('voucher_id', 'is', null)
        .neq('status', 'Cancelled');

    if (uError) throw uError;

    const totalUsed = usedOrders?.length ?? 0;

    return {
        totalVouchers,
        activeVouchers,
        expiredVouchers,
        disabledVouchers,
        totalQuantityRemaining,
        totalUsed,
        expiringSoon
    };
};
