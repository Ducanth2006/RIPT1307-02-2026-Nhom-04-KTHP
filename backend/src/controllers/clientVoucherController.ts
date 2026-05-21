import type { Request, Response } from 'express';
import { getActiveVouchers, getVoucherDetailsByCode } from '../services/clientVoucherService';

/**
 * Controller lấy danh sách voucher khả dụng cho khách hàng
 */
export const getActiveVouchersList = async (req: Request, res: Response): Promise<any> => {
    try {
        const vouchers = await getActiveVouchers();
        return res.status(200).json({
            message: 'Lấy danh sách mã giảm giá khả dụng thành công',
            data: vouchers
        });
    } catch (error: any) {
        console.error('Lỗi getActiveVouchersList:', error);
        return res.status(500).json({
            message: error.message || 'Lỗi hệ thống khi lấy danh sách mã giảm giá.'
        });
    }
};

/**
 * Controller lấy chi tiết voucher bằng code (dùng để kiểm tra nhanh)
 */
export const getVoucherByCode = async (req: Request, res: Response): Promise<any> => {
    try {
        const { code } = req.params;
        if (!code) {
            return res.status(400).json({
                message: 'Vui lòng cung cấp mã giảm giá.'
            });
        }

        const voucher = await getVoucherDetailsByCode(String(code));
        return res.status(200).json({
            message: 'Lấy chi tiết mã giảm giá thành công',
            data: voucher
        });
    } catch (error: any) {
        console.error('Lỗi getVoucherByCode:', error);
        return res.status(400).json({
            message: error.message || 'Lỗi khi tra cứu mã giảm giá.'
        });
    }
};
