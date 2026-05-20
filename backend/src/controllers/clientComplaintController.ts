import type { Request, Response } from 'express';
import { createComplaint, getComplaintsByUserId, getComplaintById } from '../services/clientComplaintService';

export const postComplaint = async (req: Request, res: Response): Promise<any> => {
    try {
        const { userId, orderId, subject, content } = req.body;

        if (!userId) return res.status(401).json({ message: 'Vui lòng cung cấp userId.' });
        if (!orderId || !subject || !content) {
            return res.status(400).json({ message: 'Vui lòng cung cấp đầy đủ orderId, subject và content.' });
        }

        const data = await createComplaint({
            userId: Number(userId),
            orderId: Number(orderId),
            subject,
            content
        });

        return res.status(201).json({ message: 'Gửi khiếu nại thành công', data });
    } catch (error: any) {
        return res.status(400).json({ message: error.message });
    }
};

export const getComplaints = async (req: Request, res: Response): Promise<any> => {
    try {
        const userId = req.query.userId;
        if (!userId) return res.status(401).json({ message: 'Vui lòng cung cấp userId.' });

        const data = await getComplaintsByUserId(Number(userId));
        return res.status(200).json({ message: 'Lấy danh sách khiếu nại thành công', data });
    } catch (error: any) {
        return res.status(500).json({ message: error.message });
    }
};

export const getComplaintDetail = async (req: Request, res: Response): Promise<any> => {
    try {
        const complaintId = Number(req.params.id);
        const userId = req.query.userId;
        if (!userId) return res.status(401).json({ message: 'Vui lòng cung cấp userId.' });

        const data = await getComplaintById(complaintId, Number(userId));
        return res.status(200).json({ message: 'Lấy chi tiết khiếu nại thành công', data });
    } catch (error: any) {
        return res.status(404).json({ message: error.message });
    }
};
