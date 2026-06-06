import supabaseClient from '../config/supabase';
import bcrypt from 'bcryptjs';

// Định dạng dữ liệu User trả về cho Frontend
export interface AdminUserResponse {
    id: string;
    name: string;
    email: string;
    role: 'Admin' | 'Staff' | 'Customer';
    status: 'Active' | 'Locked';
    lastLogin: string;
    createdAt: string;
}

// Hàm ánh xạ từ Role trong DB sang Role trên Frontend
const mapDbRoleToFrontend = (role: string): 'Admin' | 'Staff' | 'Customer' => {
    if (!role) return 'Customer';
    const r = role.toLowerCase();
    if (r === 'admin') return 'Admin';
    if (r === 'staff') return 'Staff';
    return 'Customer'; // Mặc định 'Client' hoặc 'Customer' đều map về 'Customer'
};

// Hàm ánh xạ từ Role trên Frontend sang DB
const mapFrontendRoleToDb = (role: string): string => {
    if (role === 'Customer') return 'Client'; // Hệ thống DB lưu khách hàng là 'Client'
    return role; // 'Admin', 'Staff' giữ nguyên
};

// Hàm ánh xạ từ Status trong DB sang Status trên Frontend
const mapDbStatusToFrontend = (status: string): 'Active' | 'Locked' => {
    if (!status) return 'Active';
    const s = status.toLowerCase();
    if (s === 'locked' || s === 'banned' || s === 'inactive') {
        return 'Locked';
    }
    return 'Active';
};

// 1. Lấy danh sách toàn bộ người dùng
export const fetchAllUsers = async (): Promise<AdminUserResponse[]> => {
    const { data: userList, error: fetchError } = await supabaseClient
        .from('users')
        .select('id, email, full_name, role, status, created_at')
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

    if (fetchError) {
        throw new Error('Lỗi khi truy vấn danh sách người dùng: ' + fetchError.message);
    }

    return (userList || []).map((user: any) => {
        const dateObj = new Date(user.created_at);
        const formatCreatedAt = dateObj.toISOString().split('T')[0] || '';
        
        // Tạo lastLogin giả lập
        const lastLoginMock = dateObj.toLocaleDateString('vi-VN') + ' ' + dateObj.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });

        return {
            id: String(user.id),
            name: user.full_name || 'Chưa cập nhật tên',
            email: user.email,
            role: mapDbRoleToFrontend(user.role),
            status: mapDbStatusToFrontend(user.status),
            lastLogin: lastLoginMock,
            createdAt: formatCreatedAt
        };
    });
};

// 2. Thêm mới một tài khoản người dùng với đầy đủ trường thông tin (Số điện thoại, Email, Tên đăng nhập, Mật khẩu, Tên hiển thị, Vai trò)
export const createAdminUser = async (payload: { 
    name: string; 
    email: string; 
    role: string; 
    password?: string;
    phone?: string;
    username?: string;
}) => {
    const { name, email, role, password, phone, username } = payload;

    // Kiểm tra email trùng lặp
    const { data: existingUser } = await supabaseClient
        .from('users')
        .select('id')
        .eq('email', email)
        .is('deleted_at', null)
        .maybeSingle();

    if (existingUser) {
        throw new Error('Email này đã tồn tại trên hệ thống.');
    }

    // Hash mật khẩu (nếu không truyền password, mặc định là '12345678')
    const rawPassword = password || '12345678';
    const password_hash = await bcrypt.hash(rawPassword, 10);

    const dbRole = mapFrontendRoleToDb(role);

    // Chèn dữ liệu vào bảng users
    const insertPayload: any = {
        email,
        password_hash,
        full_name: name,
        role: dbRole,
        status: 'Active',
        provider: 'local'
    };

    const { data: newUser, error: insertError } = await supabaseClient
        .from('users')
        .insert(insertPayload)
        .select('id, email, full_name, role, status, created_at')
        .single();

    if (insertError) {
        throw new Error('Không thể thêm tài khoản mới vào cơ sở dữ liệu: ' + insertError.message);
    }

    const dateObj = new Date(newUser.created_at);
    return {
        id: String(newUser.id),
        name: newUser.full_name,
        email: newUser.email,
        phone: phone || 'Chưa thiết lập',
        username: username || email.split('@')[0],
        role: mapDbRoleToFrontend(newUser.role),
        status: mapDbStatusToFrontend(newUser.status),
        lastLogin: 'Chưa từng đăng nhập',
        createdAt: dateObj.toISOString().split('T')[0]
    };
};

// 3. Cập nhật thông tin tài khoản người dùng đầy đủ các trường (Hỗ trợ đổi Mật khẩu mới nếu quản trị viên điền mật khẩu mới)
export const updateAdminUser = async (userId: string, payload: { 
    name: string; 
    email: string; 
    role: string;
    phone?: string;
    username?: string;
    password?: string;
}) => {
    const { name, email, role, phone, username, password } = payload;
    const dbRole = mapFrontendRoleToDb(role);

    // Xây dựng đối tượng dữ liệu cập nhật
    const updateData: any = {
        full_name: name,
        email,
        role: dbRole
    };

    // Nếu quản trị viên điền mật khẩu mới, tiến hành hash và cập nhật cột password_hash
    if (password && password.trim() !== '') {
        const password_hash = await bcrypt.hash(password.trim(), 10);
        updateData.password_hash = password_hash;
    }

    const { data: updatedUser, error: updateError } = await supabaseClient
        .from('users')
        .update(updateData)
        .eq('id', userId)
        .select('id, email, full_name, role, status, created_at')
        .single();

    if (updateError) {
        throw new Error('Lỗi khi cập nhật thông tin người dùng: ' + updateError.message);
    }

    const dateObj = new Date(updatedUser.created_at);
    return {
        id: String(updatedUser.id),
        name: updatedUser.full_name,
        email: updatedUser.email,
        phone: phone || 'Chưa thiết lập',
        username: username || updatedUser.email.split('@')[0],
        role: mapDbRoleToFrontend(updatedUser.role),
        status: mapDbStatusToFrontend(updatedUser.status),
        lastLogin: 'Vừa cập nhật thông tin',
        createdAt: dateObj.toISOString().split('T')[0]
    };
};

// 4. Khóa hoặc Mở khóa tài khoản
export const toggleUserLockStatus = async (userId: string, isLock: boolean) => {
    const newStatus = isLock ? 'Banned' : 'Active';

    const { data: updatedUser, error: updateError } = await supabaseClient
        .from('users')
        .update({ status: newStatus })
        .eq('id', userId)
        .select('id, email, full_name, role, status, created_at')
        .single();

    if (updateError) {
        throw new Error('Không thể thay đổi trạng thái tài khoản: ' + updateError.message);
    }

    const dateObj = new Date(updatedUser.created_at);
    return {
        id: String(updatedUser.id),
        name: updatedUser.full_name,
        email: updatedUser.email,
        role: mapDbRoleToFrontend(updatedUser.role),
        status: mapDbStatusToFrontend(updatedUser.status),
        lastLogin: 'Vừa cập nhật trạng thái',
        createdAt: dateObj.toISOString().split('T')[0]
    };
};

// 5. Xóa tài khoản người dùng (Hard Delete - Xóa vĩnh viễn khỏi Database)
export const deleteAdminUser = async (userId: string) => {
    const { data: deletedUser, error: deleteError } = await supabaseClient
        .from('users')
        .delete()
        .eq('id', userId)
        .select('id, email, full_name')
        .single();

    if (deleteError) {
        throw new Error('Không thể xóa tài khoản người dùng: ' + deleteError.message);
    }

    return deletedUser;
};

