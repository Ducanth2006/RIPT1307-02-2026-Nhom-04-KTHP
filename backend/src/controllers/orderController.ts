import type { Request, Response } from 'express';
import { fetchAllOrders, updateOrderStatus } from '../services/orderService';

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
        // Thêm "as string" để ép kiểu rõ ràng, TypeScript sẽ hết phàn nàn
        const orderId = req.params.id as string;
        const newStatus = req.body.status as string;

        // Kiểm tra xem Admin có gửi trạng thái mới lên không
        if (!newStatus) {
            return res.status(400).json({
                message: "Vui lòng cung cấp trạng thái mới cho đơn hàng."
            });
        }

        // Lúc này orderId và newStatus đã chuẩn kiểu 'string'
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