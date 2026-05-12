import type { Request, Response } from 'express';
import { fetchAllCustomers, toggleCustomerStatus } from '../services/customerService';

// Lấy danh sách khách hàng
export const getAllCustomers = async (req: Request, res: Response) => {
    try {
        const customers = await fetchAllCustomers();
        res.status(200).json({
            message: "Lấy danh sách khách hàng thành công!",
            data: customers
        });
    } catch (error) {
        res.status(500).json({
            message: "Lỗi hệ thống khi lấy danh sách khách hàng.",
            errorDetails: error
        });
    }
};

// Khóa hoặc mở khóa tài khoản
export const changeCustomerStatus = async (req: Request, res: Response): Promise<any> => {
    try {
        const customerId = req.params.id as string;
        const { isActive } = req.body; // Expect: true hoặc false

        if (isActive === undefined) {
            return res.status(400).json({
                message: "Vui lòng cung cấp trạng thái hoạt động (isActive)."
            });
        }

        const result = await toggleCustomerStatus(customerId, Boolean(isActive));

        res.status(200).json({
            message: isActive ? "Đã mở khóa tài khoản thành công!" : "Đã khóa tài khoản thành công!",
            data: result
        });
    } catch (error) {
        res.status(500).json({
            message: "Lỗi hệ thống khi cập nhật trạng thái khách hàng.",
            errorDetails: error
        });
    }
};