import type { Request, Response } from 'express';
import { registerUser, loginUser, logoutUser, loginGoogleUser, loginFacebookUser } from '../services/authService';

export const googleLogin = async (req: Request, res: Response): Promise<any> => {
    try {
        const { token } = req.body;
        if (!token) {
            return res.status(400).json({ message: 'Vui lòng cung cấp token Google.' });
        }

        const data = await loginGoogleUser(token);
        return res.status(200).json({
            message: 'Đăng nhập Google thành công',
            data: data.user,
            token: data.token
        });
    } catch (error: any) {
        return res.status(400).json({ message: error.message });
    }
};

export const facebookLogin = async (req: Request, res: Response): Promise<any> => {
    try {
        const { token } = req.body;
        if (!token) {
            return res.status(400).json({ message: 'Vui lòng cung cấp token Facebook.' });
        }

        const data = await loginFacebookUser(token);
        return res.status(200).json({
            message: 'Đăng nhập Facebook thành công',
            data: data.user,
            token: data.token
        });
    } catch (error: any) {
        return res.status(400).json({ message: error.message });
    }
};

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

export const logout = async (req: Request, res: Response): Promise<any> => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ message: 'Không tìm thấy Token hoặc định dạng Token không hợp lệ.' });
        }

        const token = authHeader.split(' ')[1];
        if (!token) {
            return res.status(401).json({ message: 'Không tìm thấy Token hoặc định dạng Token không hợp lệ.' });
        }
        await logoutUser(token);

        return res.status(200).json({ message: 'Đăng xuất thành công.' });
    } catch (error: any) {
        return res.status(400).json({ message: error.message });
    }
};

