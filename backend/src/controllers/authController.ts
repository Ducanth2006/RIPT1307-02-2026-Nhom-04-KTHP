import type { Request, Response } from 'express';
import { registerUser, loginUser } from '../services/authService';

export const register = async (req: Request, res: Response): Promise<any> => {
    try {
        const { email, password, full_name } = req.body;
        if (!email || !password) {
            return res.status(400).json({ message: 'Vui lòng cung cấp email và mật khẩu.' });
        }
        if (password.length < 6) {
            return res.status(400).json({ message: 'Mật khẩu phải có ít nhất 6 ký tự.' });
        }

        const data = await registerUser({ email, password, full_name });
        return res.status(201).json({
            message: 'Đăng ký tài khoản thành công',
            data: data.user,
            token: data.token
        });
    } catch (error: any) {
        return res.status(400).json({ message: error.message });
    }
};

export const login = async (req: Request, res: Response): Promise<any> => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ message: 'Vui lòng cung cấp email và mật khẩu.' });
        }

        const data = await loginUser({ email, password });
        return res.status(200).json({
            message: 'Đăng nhập thành công',
            data: data.user,
            token: data.token
        });
    } catch (error: any) {
        return res.status(400).json({ message: error.message });
    }
};
