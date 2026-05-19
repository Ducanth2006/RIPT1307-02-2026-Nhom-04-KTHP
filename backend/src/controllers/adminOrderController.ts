import type { Request, Response } from 'express';
import { fetchAllOrders, updateOrderStatus } from '../services/adminOrderService';

// Controller 1: Xử lý yêu cầu lấy danh sách
export const getAllOrders = async (req: Request, res: Response) => {
    try {
        const ordersData = await fetchAllOrders();

        res.status(200).json({
            message: "Lấy danh sách đơn hàng thành công!",
            data: ordersData
        });
    } catch (error) {
        res.status(500).json({
            message: "Lỗi hệ thống khi lấy danh sách đơn hàng.",
            errorDetails: error
        });
    }
};

export const changeOrderStatus = async (req: Request, res: Response): Promise<any> => {
    try {
        const orderId = req.params.id as string;
        const newStatus = req.body.status as string;

        if (!newStatus) {
            return res.status(400).json({
                message: "Vui lòng cung cấp trạng thái mới cho đơn hàng."
            });
        }

        const result = await updateOrderStatus(orderId, newStatus);

        res.status(200).json({
            message: "Cập nhật trạng thái đơn hàng thành công!",
            data: result
        });
    } catch (error) {
        res.status(500).json({
            message: "Lỗi hệ thống khi cập nhật trạng thái đơn.",
            errorDetails: error
        });
    }
};
