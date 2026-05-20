import type { Request, Response } from 'express';
import {
    layDanhSachKho as layDanhSachKhoService,
    layLichSuKho as layLichSuKhoService,
    layThongKeKho as layThongKeKhoService,
    nhapKho as nhapKhoService,
    xuatKhoThuCong as xuatKhoThuCongService
} from '../services/adminInventoryService';

const traVeLoi = (
    res: Response,
    maTrangThai: number,
    message: string,
    errorDetails: unknown = null
) => {
    return res.status(maTrangThai).json({
        message,
        data: null,
        errorDetails
    });
};

export const layThongKeKho = async (req: Request, res: Response) => {
    try {
        const thongKeKho = await layThongKeKhoService();

        return res.status(200).json({
            message: 'Lấy thống kê kho hàng thành công',
            data: thongKeKho,
            errorDetails: null
        });
    } catch (error: any) {
        return traVeLoi(
            res,
            500,
            'Lỗi hệ thống khi lấy thống kê kho hàng',
            error?.message || error
        );
    }
};

export const layDanhSachKho = async (req: Request, res: Response) => {
    try {
        const danhSachKho = await layDanhSachKhoService();

        return res.status(200).json({
            message: 'Lấy danh sách kho hàng thành công',
            data: danhSachKho,
            errorDetails: null
        });
    } catch (error: any) {
        return traVeLoi(
            res,
            500,
            'Lỗi hệ thống khi lấy danh sách kho hàng',
            error?.message || error
        );
    }
};

export const nhapKho = async (req: Request, res: Response) => {
    try {
        const { variant_id, quantity, cost_price } = req.body;

        if (variant_id === undefined || variant_id === null || variant_id === '') {
            return traVeLoi(res, 400, 'Vui lòng cung cấp variant_id');
        }

        if (quantity === undefined || quantity === null || quantity === '') {
            return traVeLoi(res, 400, 'Vui lòng cung cấp quantity');
        }

        if (cost_price === undefined || cost_price === null || cost_price === '') {
            return traVeLoi(res, 400, 'Vui lòng cung cấp cost_price');
        }

        const variantId = Number(variant_id);
        const soLuongNhap = Number(quantity);
        const giaNhap = Number(cost_price);

        if (!Number.isInteger(variantId) || variantId <= 0) {
            return traVeLoi(res, 400, 'variant_id phải là số nguyên dương');
        }

        if (!Number.isInteger(soLuongNhap) || soLuongNhap <= 0) {
            return traVeLoi(res, 400, 'quantity phải là số nguyên dương lớn hơn 0');
        }

        if (Number.isNaN(giaNhap) || giaNhap < 0) {
            return traVeLoi(res, 400, 'cost_price phải là số hợp lệ và không được âm');
        }

        const ketQuaNhapKho = await nhapKhoService(variantId, soLuongNhap, giaNhap);

        return res.status(200).json({
            message: 'Nhập kho thành công',
            data: ketQuaNhapKho,
            errorDetails: null
        });
    } catch (error: any) {
        if (error?.code === 'NOT_FOUND') {
            return traVeLoi(res, 404, error.message, error?.errorDetails ?? null);
        }

        if (error?.code === 'IMPORT_FAILED' || error?.code === 'ROLLBACK_FAILED') {
            return traVeLoi(res, 500, error.message, error?.errorDetails ?? null);
        }

        return traVeLoi(
            res,
            500,
            'Lỗi hệ thống khi nhập kho',
            error?.message || error
        );
    }
};

export const layLichSuKho = async (req: Request, res: Response) => {
    try {
        const variantId = Number(req.params.variantId);

        if (!Number.isInteger(variantId) || variantId <= 0) {
            return traVeLoi(res, 400, 'variantId phải là số nguyên dương');
        }

        const lichSuKho = await layLichSuKhoService(variantId);

        return res.status(200).json({
            message: 'Lấy lịch sử kho thành công',
            data: lichSuKho,
            errorDetails: null
        });
    } catch (error: any) {
        if (error?.code === 'NOT_FOUND') {
            return traVeLoi(res, 404, error.message, error?.errorDetails ?? null);
        }

        return traVeLoi(
            res,
            500,
            'Lỗi hệ thống khi lấy lịch sử kho',
            error?.message || error
        );
    }
};

export const xuatKhoThuCong = async (req: Request, res: Response) => {
    try {
        const { variant_id, quantity } = req.body;

        if (variant_id === undefined || variant_id === null || variant_id === '') {
            return traVeLoi(res, 400, 'Vui lòng cung cấp variant_id');
        }

        if (quantity === undefined || quantity === null || quantity === '') {
            return traVeLoi(res, 400, 'Vui lòng cung cấp quantity');
        }

        const variantId = Number(variant_id);
        const soLuongXuat = Number(quantity);

        if (!Number.isInteger(variantId) || variantId <= 0) {
            return traVeLoi(res, 400, 'variant_id phải là số nguyên dương');
        }

        if (!Number.isInteger(soLuongXuat) || soLuongXuat <= 0) {
            return traVeLoi(res, 400, 'quantity phải là số nguyên dương lớn hơn 0');
        }

        const ketQuaXuatKho = await xuatKhoThuCongService(variantId, soLuongXuat);

        return res.status(200).json({
            message: 'Xuất kho thành công',
            data: ketQuaXuatKho,
            errorDetails: null
        });
    } catch (error: any) {
        if (error?.code === 'NOT_FOUND') {
            return traVeLoi(res, 404, error.message, error?.errorDetails ?? null);
        }

        if (error?.message === 'Số lượng xuất vượt quá tồn kho hiện tại. Vui lòng kiểm tra lại!') {
            return traVeLoi(res, 400, error.message, null);
        }

        if (error?.code === 'EXPORT_FAILED' || error?.code === 'ROLLBACK_FAILED') {
            return traVeLoi(res, 500, error.message, error?.errorDetails ?? null);
        }

        return traVeLoi(
            res,
            500,
            'Lỗi hệ thống khi xuất kho',
            error?.message || error
        );
    }
};
