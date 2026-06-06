import supabaseClient from '../config/supabase';
import bcrypt from 'bcryptjs';

// Lấy thông tin profile
export const getProfile = async (userId: number) => {
    const { data, error } = await supabaseClient
        .from('users')
        .select('id, email, full_name, avatar, role, status, provider, created_at')
        .eq('id', userId)
        .is('deleted_at', null)
        .single();

    if (error || !data) throw new Error('Không tìm thấy thông tin người dùng.');
    return data;
};

// Cập nhật thông tin profile
export const updateProfile = async (
    userId: number,
    payload: {
        full_name?: string;
        avatar?: string;
    }
) => {
    const { data, error } = await supabaseClient
        .from('users')
        .update(payload)
        .eq('id', userId)
        .select('id, email, full_name, avatar, role, status, created_at')
        .single();

    if (error) throw new Error('Lỗi khi cập nhật thông tin: ' + error.message);
    return data;
};

// Đổi mật khẩu
export const changePassword = async (
    userId: number,
    currentPassword: string,
    newPassword: string
) => {
    // Lấy mật khẩu hiện tại từ DB
    const { data: user, error: fetchErr } = await supabaseClient
        .from('users')
        .select('password_hash')
        .eq('id', userId)
        .single();

    if (fetchErr || !user) throw new Error('Không tìm thấy người dùng.');

    // Kiểm tra mật khẩu cũ
    const isMatch = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isMatch) throw new Error('Mật khẩu hiện tại không đúng.');

    // Hash mật khẩu mới
    const newHash = await bcrypt.hash(newPassword, 10);

    const { error: updateErr } = await supabaseClient
        .from('users')
        .update({ password_hash: newHash })
        .eq('id', userId);

    if (updateErr) throw new Error('Lỗi khi cập nhật mật khẩu: ' + updateErr.message);
    return true;
};
