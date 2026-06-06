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

/**
 * Validate voucher trước khi áp dụng vào đơn hàng
 * Kiểm tra đầy đủ: tồn tại, trạng thái, quantity, thời hạn, giá trị đơn tối thiểu
 * @param code Mã voucher
 * @param orderTotal Tổng giá trị đơn hàng
 */
export const validateVoucherForOrder = async (code: string, orderTotal: number) => {
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
        throw new Error('Mã giảm giá không tồn tại hoặc đã bị xóa.');
    }

    // Kiểm tra trạng thái
    const statusLower = (voucher.status || '').toLowerCase();
    if (statusLower !== 'active') {
        throw new Error('Mã giảm giá đã bị vô hiệu hóa.');
    }

    // Kiểm tra số lượng
    if (voucher.quantity !== null && voucher.quantity <= 0) {
        throw new Error('Mã giảm giá đã hết lượt sử dụng.');
    }

    // Kiểm tra thời gian
    const now = new Date();
    if (voucher.start_date && new Date(voucher.start_date) > now) {
        throw new Error('Mã giảm giá chưa đến thời gian sử dụng.');
    }
    if (voucher.end_date && new Date(voucher.end_date) < now) {
        throw new Error('Mã giảm giá đã hết hạn.');
    }

    // Kiểm tra giá trị đơn hàng tối thiểu
    if (voucher.min_order_value && orderTotal < Number(voucher.min_order_value)) {
        throw new Error(`Đơn hàng chưa đạt giá trị tối thiểu ${Number(voucher.min_order_value).toLocaleString('vi-VN')} ₫ để áp dụng mã giảm giá.`);
    }

    // Tính toán giá trị giảm
    let discountAmount = 0;
    if (voucher.discount_type === 'Percentage') {
        discountAmount = (orderTotal * Number(voucher.discount_value)) / 100;
        if (voucher.max_discount && discountAmount > Number(voucher.max_discount)) {
            discountAmount = Number(voucher.max_discount);
        }
    } else if (voucher.discount_type === 'Fixed') {
        discountAmount = Number(voucher.discount_value);
    }

    if (discountAmount > orderTotal) {
        discountAmount = orderTotal;
    }

    const finalAmount = orderTotal - discountAmount;

    return {
        valid: true,
        voucher: {
            id: voucher.id,
            code: voucher.code,
            discount_type: voucher.discount_type,
            discount_value: voucher.discount_value,
            max_discount: voucher.max_discount,
            min_order_value: voucher.min_order_value,
            quantity: voucher.quantity
        },
        discount_amount: discountAmount,
        final_amount: finalAmount,
        message: `Áp dụng thành công mã "${voucher.code}" - Giảm ${discountAmount.toLocaleString('vi-VN')} ₫`
    };
};
