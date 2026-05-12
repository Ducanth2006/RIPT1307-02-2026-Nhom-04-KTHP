import type { Request, Response } from 'express';
import { fetchAllVouchers, createVoucher } from '../services/voucherService';

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
        // Lấy các thông tin Admin nhập từ Body
        const { code, discountAmount, usageLimit } = req.body;

        // Bắt lỗi: Nếu Admin quên nhập Mã hoặc Số tiền giảm thì chặn lại luôn
        if (!code || !discountAmount) {
            return res.status(400).json({
                message: "Vui lòng nhập đầy đủ mã Voucher (code) và mức giảm giá (discountAmount)."
            });
        }

        // Đóng gói dữ liệu và ÉP KIỂU THẬT SỰ (Runtime casting)
        const voucherData = {
            code: String(code), // Ép chắc chắn thành chuỗi
            discount_value: Number(discountAmount), // Đổi thành discount_value theo đúng DB
            quantity: usageLimit ? Number(usageLimit) : 100 // Đổi thành quantity theo đúng DB
        };

        const result = await createVoucher(voucherData);

        res.status(201).json({ // Mã 201 nghĩa là Created (Đã tạo thành công)
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