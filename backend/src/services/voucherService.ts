import supabaseClient from '../config/supabase';

// Lấy danh sách tất cả voucher
export const fetchAllVouchers = async () => {
    const { data: voucherList, error: fetchError } = await supabaseClient
        .from('vouchers')
        .select('*')
        .order('id', { ascending: false });

    if (fetchError) {
        console.error("Lỗi khi lấy danh sách voucher:", fetchError);
        throw fetchError;
    }

    return voucherList;
};

// Tạo một voucher mới
export const createVoucher = async (voucherData: any) => {
    // Dùng hàm .insert() của Supabase để thêm dữ liệu mới
    const { data: newVoucher, error: insertError } = await supabaseClient
        .from('vouchers')
        .insert([voucherData])
        .select()
        .single(); // Trả về đúng object vừa tạo

    if (insertError) {
        console.error("Lỗi khi tạo voucher mới:", insertError);
        throw insertError;
    }

    return newVoucher;
};