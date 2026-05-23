import type { Request, Response } from 'express';
import {
    fetchAllUsers,
    createAdminUser,
    updateAdminUser,
    toggleUserLockStatus
} from '../services/adminUserService';
import { blacklistToken } from '../services/authService';

// 1. Lấy danh sách người dùng
export const getAllUsers = async (req: Request, res: Response) => {
    try {
        const users = await fetchAllUsers();
        res.status(200).json({
            message: "Lấy danh sách tài khoản thành công!",
            data: users
        });
    } catch (error: any) {
        res.status(500).json({
            message: "Lỗi hệ thống khi lấy danh sách tài khoản.",
            error: error.message
        });
    }
};

// 2. Thêm mới tài khoản người dùng đầy đủ các trường (Số điện thoại, Email, Tên đăng nhập, Mật khẩu, Tên hiển thị, Vai trò)
export const createUser = async (req: Request, res: Response): Promise<any> => {
    try {
        const { phone, email, username, password, name, role } = req.body;

        // Kiểm tra các trường bắt buộc
        if (!email || !password || !name || !role) {
            return res.status(400).json({
                message: "Vui lòng điền đầy đủ các thông tin bắt buộc: Email, Mật khẩu, Tên hiển thị và Vai trò."
            });
        }

        // Tạo người dùng mới qua tầng service
        const newUser = await createAdminUser({ 
            name, 
            email, 
            role, 
            password, 
            phone, 
            username 
        });

        res.status(201).json({
            message: "Tạo tài khoản người dùng mới thành công!",
            data: newUser
        });
    } catch (error: any) {
        res.status(500).json({
            message: error.message || "Lỗi hệ thống khi thêm tài khoản mới.",
            error: error.message
        });
    }
};

// 3. Cập nhật tài khoản người dùng (Sửa thông tin: cho phép thay đổi mật khẩu tùy chọn, sđt, tên đăng nhập...)
export const updateUser = async (req: Request, res: Response): Promise<any> => {
    try {
        const userId = req.params.id;
        const { name, email, role, phone, username, password } = req.body;

        if (!name || !email || !role) {
            return res.status(400).json({
                message: "Họ tên, Email và Quyền truy cập không được để trống."
            });
        }

        const updatedUser = await updateAdminUser(userId, { 
            name, 
            email, 
            role,
            phone,
            username,
            password
        });

        res.status(200).json({
            message: "Cập nhật thông tin tài khoản thành công!",
            data: updatedUser
        });
    } catch (error: any) {
        res.status(500).json({
            message: error.message || "Lỗi hệ thống khi cập nhật thông tin tài khoản.",
            error: error.message
        });
    }
};

// 4. Khóa / Mở khóa tài khoản
export const toggleLock = async (req: Request, res: Response): Promise<any> => {
    try {
        const userId = req.params.id;
        const { isLocked } = req.body; // true = khóa, false = mở khóa

        if (isLocked === undefined) {
            return res.status(400).json({
                message: "Vui lòng cung cấp trạng thái isLocked (true/false)."
            });
        }

        const updatedUser = await toggleUserLockStatus(userId, Boolean(isLocked));
        res.status(200).json({
            message: isLocked ? "Đã khóa tài khoản thành công!" : "Đã mở khóa tài khoản thành công!",
            data: updatedUser
        });
    } catch (error: any) {
        res.status(500).json({
            message: error.message || "Lỗi hệ thống khi cập nhật trạng thái tài khoản.",
            error: error.message
        });
    }
};

// 5. Thu hồi toàn bộ quyền truy cập (JWT Blacklist)
export const revokeTokens = async (req: Request, res: Response): Promise<any> => {
    try {
        const userId = req.params.id;

        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.split(' ')[1];
            blacklistToken(token);
        }

        res.status(200).json({
            message: `Đã thu hồi toàn bộ phiên đăng nhập của người dùng có ID: ${userId} thành công! Người dùng này sẽ bị buộc đăng xuất ngay lập tức.`,
            data: { userId }
        });
    } catch (error: any) {
        res.status(500).json({
            message: "Lỗi hệ thống khi thu hồi phiên truy cập.",
            error: error.message
        });
    }
};
