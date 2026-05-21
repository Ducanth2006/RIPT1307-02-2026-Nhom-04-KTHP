import type { Request, Response } from 'express';
import {
    thongKeDonHang,
    danhSachDonHang,
    chiTietDonHang,
    capNhatTrangThaiDonHang,
} from '../services/adminOrderService';

const traVeLoi = (
    res: Response,
    maTrangThai: number,
    message: string,
    errorDetails: unknown = null
) => {
    return res.status(maTrangThai).json({
        message,
        data: null,
        errorDetails,
    });
};

export const thongKeDonHangController = async (
    req: Request,
    res: Response
) => {
    try {
        const ketQua = await thongKeDonHang();
        return res.status(200).json({
            message: 'Lấy thống kê đơn hàng thành công',
            data: ketQua,
            errorDetails: null,
        });
    } catch (error: any) {
        return traVeLoi(
            res,
            500,
            'Lỗi hệ thống khi lấy thống kê đơn hàng',
            error?.message || error
        );
    }
};

export const danhSachDonHangController = async (
    req: Request,
    res: Response
) => {
    try {
        const ketQua = await danhSachDonHang();
        return res.status(200).json({
            message: 'Lấy danh sách đơn hàng thành công',
            data: ketQua,
            errorDetails: null,
        });
    } catch (error: any) {
        return traVeLoi(
            res,
            500,
            'Lỗi hệ thống khi lấy danh sách đơn hàng',
            error?.message || error
        );
    }
};

export const chiTietDonHangController = async (
    req: Request,
    res: Response
) => {
    try {
        const orderId = req.params.id as string;
        if (!orderId) {
            return traVeLoi(
                res,
                400,
                'Vui lòng cung cấp id đơn hàng'
            );
        }

        const ketQua = await chiTietDonHang(orderId);
        return res.status(200).json({
            message: 'Lấy chi tiết đơn hàng thành công',
            data: ketQua,
            errorDetails: null,
        });
    } catch (error: any) {
        if (error?.code === 'NOT_FOUND') {
            return traVeLoi(
                res,
                404,
                error?.message || 'Không tìm thấy đơn hàng',
                error?.errorDetails ?? null
            );
        }

        return traVeLoi(
            res,
            500,
            'Lỗi hệ thống khi lấy chi tiết đơn hàng',
            error?.message || error
        );
    }
};

export const capNhatTrangThaiDonHangController = async (
    req: Request,
    res: Response
) => {
    try {
        const orderId = req.params.id as string;
        const { status } = req.body as { status?: string };

        if (!orderId) {
            return traVeLoi(res, 400, 'Vui lòng cung cấp id đơn hàng');
        }

        if (!status) {
            return traVeLoi(res, 400, 'Vui lòng cung cấp status');
        }

        const ketQua = await capNhatTrangThaiDonHang(orderId, status);

        return res.status(200).json({
            message: 'Cập nhật trạng thái đơn hàng thành công',
            data: ketQua,
            errorDetails: null,
        });
    } catch (error: any) {
        if (error?.code === 'NOT_FOUND') {
            return traVeLoi(
                res,
                404,
                error?.message || 'Không tìm thấy đơn hàng',
                error?.errorDetails ?? null
            );
        }

        return res.status(400).json({
            message: error?.message || 'Cập nhật trạng thái đơn hàng thất bại',
            data: null,
            errorDetails: error?.errorDetails ?? error,
        });
    }
};

// Export theo đúng tên mà route đang import
export {
    thongKeDonHangController as thongKeDonHang,
    danhSachDonHangController as danhSachDonHang,
    chiTietDonHangController as chiTietDonHang,
    capNhatTrangThaiDonHangController as capNhatTrangThaiDonHang,
};


