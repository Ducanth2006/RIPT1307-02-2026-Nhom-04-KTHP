import type { Request, Response } from 'express';
import {
    getNotificationsByUserId,
    markNotificationRead,
    markAllNotificationsRead
} from '../services/clientNotificationService';

export const getNotifications = async (req: Request, res: Response): Promise<any> => {
    try {
        const userId = req.query.userId;
        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 20;

        if (!userId) return res.status(401).json({ message: 'Vui lòng cung cấp userId.' });

        const result = await getNotificationsByUserId(Number(userId), page, limit);
        return res.status(200).json({ message: 'Lấy thông báo thành công', ...result });
    } catch (error: any) {
        return res.status(500).json({ message: error.message });
    }
};

export const readNotification = async (req: Request, res: Response): Promise<any> => {
    try {
        const notificationId = Number(req.params.id);
        const { userId } = req.body;
        if (!userId) return res.status(401).json({ message: 'Vui lòng cung cấp userId.' });

        const data = await markNotificationRead(notificationId, Number(userId));
        return res.status(200).json({ message: 'Đánh dấu đã đọc thành công', data });
    } catch (error: any) {
        return res.status(400).json({ message: error.message });
    }
};

export const readAllNotifications = async (req: Request, res: Response): Promise<any> => {
    try {
        const { userId } = req.body;
        if (!userId) return res.status(401).json({ message: 'Vui lòng cung cấp userId.' });

        await markAllNotificationsRead(Number(userId));
        return res.status(200).json({ message: 'Đã đánh dấu tất cả thông báo là đã đọc' });
    } catch (error: any) {
        return res.status(500).json({ message: error.message });
    }
};
