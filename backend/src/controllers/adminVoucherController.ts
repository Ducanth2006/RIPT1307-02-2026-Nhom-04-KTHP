import type { Request, Response } from 'express';
import { fetchAllVouchers, createVoucher } from '../services/adminVoucherService';

export const getAllVouchers = async (req: Request, res: Response) => {
    try {
        const vouchersData = await fetchAllVouchers();
        res.status(200).json({
            message: "Lấy danh sách Voucher thành công!",
            data: vouchersData
        });
    } catch (error) {
        res.status(500).json({
            message: "Lỗi hệ thống khi lấy danh sách Voucher.",
            errorDetails: error
        });
    }
};

export const createNewVoucher = async (req: Request, res: Response): Promise<any> => {
    try {
        const { code, discountAmount, usageLimit } = req.body;

        if (!code || !discountAmount) {
            return res.status(400).json({
                message: "Vui lòng nhập đầy đủ mã Voucher (code) và mức giảm giá (discountAmount)."
            });
        }

        const voucherData = {
            code: String(code),
            discount_value: Number(discountAmount),
            quantity: usageLimit ? Number(usageLimit) : 100
        };

        const result = await createVoucher(voucherData);

        res.status(201).json({
            message: "Tạo Mã giảm giá mới thành công!",
            data: result
        });
    } catch (error) {
        res.status(500).json({
            message: "Lỗi hệ thống khi tạo Voucher.",
            errorDetails: error
        });
    }
};
