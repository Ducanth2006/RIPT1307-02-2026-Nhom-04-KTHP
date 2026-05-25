import type { Request, Response } from 'express';
import {
    fetchAllComplaints,
    fetchComplaintById,
    confirmComplaint,
    replyComplaint
} from '../services/adminComplaintService';

// ==========================================
// GET /api/admin/complaints
// ==========================================
export const getAllComplaints = async (req: Request, res: Response) => {
    try {
        const complaints = await fetchAllComplaints();
        res.status(200).json({
            message: "Lấy danh sách khiếu nại thành công!",
            data: complaints
        });
    } catch (error: any) {
        res.status(500).json({
            message: "Lỗi hệ thống khi lấy danh sách khiếu nại.",
            errorDetails: error.message || error
        });
    }
};

// ==========================================
// GET /api/admin/complaints/:id
// ==========================================
export const getComplaintDetail = async (req: Request, res: Response): Promise<any> => {
    try {
        const { id } = req.params;
        if (!id) {
            return res.status(400).json({ message: "Vui lòng cung cấp ID khiếu nại." });
        }

        const complaint = await fetchComplaintById(String(id));
        res.status(200).json({
            message: "Lấy chi tiết khiếu nại thành công!",
            data: complaint
        });
    } catch (error: any) {
        const status = error.message?.includes('không tồn tại') ? 404 : 500;
        res.status(status).json({
            message: error.message || "Lỗi hệ thống khi lấy chi tiết khiếu nại.",
            errorDetails: error
        });
    }
};

// ==========================================
// PATCH /api/admin/complaints/:id/confirm
// ==========================================
export const confirmComplaintHandler = async (req: Request, res: Response): Promise<any> => {
    try {
        const { id } = req.params;
        if (!id) {
            return res.status(400).json({ message: "Vui lòng cung cấp ID khiếu nại." });
        }

        const result = await confirmComplaint(String(id));
        res.status(200).json({
            message: "Xác nhận khiếu nại thành công!",
            data: result
        });
    } catch (error: any) {
        const status = error.message?.includes('không tồn tại') ? 404 :
                       error.message?.includes('Chỉ có thể xác nhận') ? 400 : 500;
        res.status(status).json({
            message: error.message || "Lỗi hệ thống khi xác nhận khiếu nại.",
            errorDetails: error
        });
    }
};

// ==========================================
// PUT /api/admin/complaints/:id/reply
// Body: { replyText: string }
// ==========================================
export const replyComplaintHandler = async (req: Request, res: Response): Promise<any> => {
    try {
        const { id } = req.params;
        const { replyText } = req.body;

        if (!id) {
            return res.status(400).json({ message: "Vui lòng cung cấp ID khiếu nại." });
        }

        if (!replyText || replyText.trim() === '') {
            return res.status(400).json({ message: "Vui lòng cung cấp nội dung phản hồi." });
        }

        const result = await replyComplaint(String(id), replyText);
        res.status(200).json({
            message: "Hồi đáp khiếu nại thành công!",
            data: result
        });
    } catch (error: any) {
        const status = error.message?.includes('không tồn tại') ? 404 : 500;
        res.status(status).json({
            message: error.message || "Lỗi hệ thống khi hồi đáp khiếu nại.",
            errorDetails: error
        });
    }
};
