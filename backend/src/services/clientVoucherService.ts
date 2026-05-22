import supabaseClient from '../config/supabase';

/**
 * Lấy danh sách các voucher đang hoạt động và khả dụng cho khách hàng
 */
export const getActiveVouchers = async () => {
    const { data, error } = await supabaseClient
        .from('vouchers')
        .select('*')
        .order('id', { ascending: false });

    if (error) {
        throw new Error('Lỗi khi lấy danh sách voucher: ' + error.message);
    }

    const now = new Date();

    // Lọc lại các voucher hợp lệ trên server-side
    const activeVouchers = (data || []).filter((voucher: any) => {
        // 1. Kiểm tra trạng thái hoạt động (chấp nhận cả 'Active' và 'active')
        const statusLower = (voucher.status || '').toLowerCase();
        if (statusLower !== 'active') {
            return false;
        }

        // 2. Kiểm tra số lượng lượt sử dụng còn lại (nếu quantity khác null)
        if (voucher.quantity !== null && voucher.quantity <= 0) {
            return false;
        }

        // 3. Kiểm tra thời gian bắt đầu
        if (voucher.start_date && new Date(voucher.start_date) > now) {
            return false;
        }

        // 4. Kiểm tra thời gian hết hạn
        if (voucher.end_date && new Date(voucher.end_date) < now) {
            return false;
        }

        return true;
    });

    return activeVouchers;
};

/**
 * Lấy chi tiết thông tin và kiểm tra tính hợp lệ của một voucher cụ thể theo mã code
 * @param code Mã voucher cần tra cứu
 */
export const getVoucherDetailsByCode = async (code: string) => {
    if (!code) {
        throw new Error('Vui lòng cung cấp mã giảm giá.');
    }

    const { data: voucher, error } = await supabaseClient
        .from('vouchers')
        .select('*')
        .eq('code', code.trim().toUpperCase())
        .maybeSingle();

    if (error) {
        throw new Error('Lỗi khi truy vấn thông tin voucher: ' + error.message);
    }

    if (!voucher) {
        throw new Error('Mã giảm giá không tồn tại.');
    }

    return voucher;
};
