import type { Request, Response } from 'express';
import { getProfile, updateProfile, changePassword } from '../services/clientProfileService';

export const getMyProfile = async (req: Request, res: Response): Promise<any> => {
    try {
        const userId = req.query.userId;
        if (!userId) return res.status(401).json({ message: 'Vui lòng cung cấp userId.' });

        const data = await getProfile(Number(userId));
        return res.status(200).json({ message: 'Lấy thông tin tài khoản thành công', data });
    } catch (error: any) {
        return res.status(404).json({ message: error.message });
    }
};

export const updateMyProfile = async (req: Request, res: Response): Promise<any> => {
    try {
        const { userId, full_name, avatar } = req.body;
        if (!userId) return res.status(401).json({ message: 'Vui lòng cung cấp userId.' });

        const data = await updateProfile(Number(userId), { full_name, avatar });
        return res.status(200).json({ message: 'Cập nhật thông tin thành công', data });
    } catch (error: any) {
        return res.status(400).json({ message: error.message });
    }
};

export const changeMyPassword = async (req: Request, res: Response): Promise<any> => {
    try {
        const { userId, currentPassword, newPassword } = req.body;
        if (!userId) return res.status(401).json({ message: 'Vui lòng cung cấp userId.' });
        if (!currentPassword || !newPassword) {
            return res.status(400).json({ message: 'Vui lòng cung cấp mật khẩu hiện tại và mật khẩu mới.' });
        }
        if (newPassword.length < 6) {
            return res.status(400).json({ message: 'Mật khẩu mới phải có ít nhất 6 ký tự.' });
        }

        await changePassword(Number(userId), currentPassword, newPassword);
        return res.status(200).json({ message: 'Đổi mật khẩu thành công' });
    } catch (error: any) {
        return res.status(400).json({ message: error.message });
    }
};
