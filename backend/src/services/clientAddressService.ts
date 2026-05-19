import supabaseClient from '../config/supabase';

// Lấy danh sách địa chỉ của user
export const getAddressesByUserId = async (userId: number) => {
    const { data, error } = await supabaseClient
        .from('addresses')
        .select('*')
        .eq('user_id', userId)
        .order('is_default', { ascending: false });

    if (error) throw new Error('Lỗi khi lấy danh sách địa chỉ: ' + error.message);
    return data;
};

// Thêm địa chỉ mới
export const createAddress = async (
    userId: number,
    payload: {
        recipient_name: string;
        phone: string;
        address_line: string;
        city: string;
        is_default?: boolean;
    }
) => {
    // Nếu địa chỉ mới được đặt làm mặc định, bỏ mặc định của các địa chỉ cũ trước
    if (payload.is_default) {
        await supabaseClient
            .from('addresses')
            .update({ is_default: false })
            .eq('user_id', userId);
    }

    const { data, error } = await supabaseClient
        .from('addresses')
        .insert([{ user_id: userId, ...payload }])
        .select()
        .single();

    if (error) throw new Error('Lỗi khi tạo địa chỉ: ' + error.message);
    return data;
};

// Cập nhật địa chỉ
export const updateAddress = async (
    addressId: number,
    userId: number,
    payload: {
        recipient_name?: string;
        phone?: string;
        address_line?: string;
        city?: string;
        is_default?: boolean;
    }
) => {
    // Kiểm tra địa chỉ thuộc về user này
    const { data: existing, error: fetchErr } = await supabaseClient
        .from('addresses')
        .select('id')
        .eq('id', addressId)
        .eq('user_id', userId)
        .single();

    if (fetchErr || !existing) throw new Error('Địa chỉ không tồn tại hoặc bạn không có quyền chỉnh sửa.');

    // Nếu set là_default, bỏ mặc định các địa chỉ khác
    if (payload.is_default) {
        await supabaseClient
            .from('addresses')
            .update({ is_default: false })
            .eq('user_id', userId);
    }

    const { data, error } = await supabaseClient
        .from('addresses')
        .update(payload)
        .eq('id', addressId)
        .select()
        .single();

    if (error) throw new Error('Lỗi khi cập nhật địa chỉ: ' + error.message);
    return data;
};

// Xóa địa chỉ
export const deleteAddress = async (addressId: number, userId: number) => {
    const { data: existing, error: fetchErr } = await supabaseClient
        .from('addresses')
        .select('id')
        .eq('id', addressId)
        .eq('user_id', userId)
        .single();

    if (fetchErr || !existing) throw new Error('Địa chỉ không tồn tại hoặc bạn không có quyền xóa.');

    const { error } = await supabaseClient
        .from('addresses')
        .delete()
        .eq('id', addressId);

    if (error) throw new Error('Lỗi khi xóa địa chỉ: ' + error.message);
    return true;
};

// Đặt địa chỉ mặc định
export const setDefaultAddress = async (addressId: number, userId: number) => {
    const { data: existing, error: fetchErr } = await supabaseClient
        .from('addresses')
        .select('id')
        .eq('id', addressId)
        .eq('user_id', userId)
        .single();

    if (fetchErr || !existing) throw new Error('Địa chỉ không tồn tại hoặc bạn không có quyền thực hiện.');

    // Bỏ tất cả mặc định cũ
    await supabaseClient
        .from('addresses')
        .update({ is_default: false })
        .eq('user_id', userId);

    // Đặt địa chỉ được chọn làm mặc định
    const { data, error } = await supabaseClient
        .from('addresses')
        .update({ is_default: true })
        .eq('id', addressId)
        .select()
        .single();

    if (error) throw new Error('Lỗi khi đặt địa chỉ mặc định: ' + error.message);
    return data;
};
