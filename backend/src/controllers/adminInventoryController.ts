import type { Request, Response } from 'express';

import {
    layDanhSachKho as layDanhSachKhoService,
    layLichSuKho as layLichSuKhoService,
    layThongKeKho as layThongKeKhoService,
    nhapKho as nhapKhoService,
    xuatKhoThuCong as xuatKhoThuCongService
} from '../services/adminInventoryService';

// =========================
// HELPER
// =========================

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

// =========================
// THỐNG KÊ KHO
// =========================

export const layThongKeKho = async (
    req: Request,
    res: Response
) => {
    try {
        const thongKeKho =
            await layThongKeKhoService();

        return res.status(200).json({
            message:
                'Lấy thống kê kho hàng thành công',

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

// =========================
// DANH SÁCH KHO
// =========================

export const layDanhSachKho = async (
    req: Request,
    res: Response
) => {
    try {
        const danhSachKho =
            await layDanhSachKhoService();

        return res.status(200).json({
            message:
                'Lấy danh sách kho hàng thành công',

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

// =========================
// NHẬP KHO
// =========================

export const nhapKho = async (
    req: Request,
    res: Response
) => {
    try {
        const {
            variant_id,
            quantity,
            cost_price
        } = req.body;

        // validate required

        if (
            variant_id === undefined ||
            variant_id === null ||
            variant_id === ''
        ) {
            return traVeLoi(
                res,
                400,
                'Vui lòng cung cấp variant_id'
            );
        }

        if (
            quantity === undefined ||
            quantity === null ||
            quantity === ''
        ) {
            return traVeLoi(
                res,
                400,
                'Vui lòng cung cấp quantity'
            );
        }

        if (
            cost_price === undefined ||
            cost_price === null ||
            cost_price === ''
        ) {
            return traVeLoi(
                res,
                400,
                'Vui lòng cung cấp cost_price'
            );
        }

        const variantId =
            Number(variant_id);

        const soLuongNhap =
            Number(quantity);

        const giaNhap =
            Number(cost_price);

        // validate data

        if (
            !Number.isInteger(
                variantId
            ) ||
            variantId <= 0
        ) {
            return traVeLoi(
                res,
                400,
                'variant_id phải là số nguyên dương'
            );
        }

        if (
            !Number.isInteger(
                soLuongNhap
            ) ||
            soLuongNhap <= 0
        ) {
            return traVeLoi(
                res,
                400,
                'quantity phải là số nguyên dương lớn hơn 0'
            );
        }

        if (
            Number.isNaN(giaNhap) ||
            giaNhap < 0
        ) {
            return traVeLoi(
                res,
                400,
                'cost_price phải là số hợp lệ và không được âm'
            );
        }

        const ketQuaNhapKho =
            await nhapKhoService(
                variantId,
                soLuongNhap,
                giaNhap
            );

        return res.status(200).json({
            message:
                'Nhập kho thành công',

            data: ketQuaNhapKho,

            errorDetails: null
        });
    } catch (error: any) {
        // not found

        if (
            error?.code ===
            'NOT_FOUND'
        ) {
            return traVeLoi(
                res,
                404,
                error.message,
                error?.errorDetails ??
                    null
            );
        }

        // rollback/import error

        if (
            error?.code ===
                'IMPORT_FAILED' ||
            error?.code ===
                'ROLLBACK_FAILED'
        ) {
            return traVeLoi(
                res,
                500,
                error.message,
                error?.errorDetails ??
                    null
            );
        }

        return traVeLoi(
            res,
            500,
            'Lỗi hệ thống khi nhập kho',
            error?.message || error
        );
    }
};

// =========================
// LỊCH SỬ KHO
// =========================

export const layLichSuKho = async (
    req: Request,
    res: Response
) => {
    try {
        // hỗ trợ:
        // GET /inventory/logs
        // GET /inventory/:variantId/logs

        const rawVariantId =
            req.params.variantId;

        let lichSuKho;

        // nếu có variantId thì validate
        if (
            rawVariantId !==
                undefined &&
            rawVariantId !== null &&
            rawVariantId !== ''
        ) {
            const variantId =
                Number(rawVariantId);

            if (
                !Number.isInteger(
                    variantId
                ) ||
                variantId <= 0
            ) {
                return traVeLoi(
                    res,
                    400,
                    'variantId phải là số nguyên dương'
                );
            }

            lichSuKho =
                await layLichSuKhoService(
                    variantId
                );
        } else {
            // lấy toàn bộ lịch sử
            lichSuKho =
                await layLichSuKhoService();
        }

        return res.status(200).json({
            message:
                'Lấy lịch sử kho thành công',

            data: lichSuKho,

            errorDetails: null
        });
    } catch (error: any) {
        if (
            error?.code ===
            'NOT_FOUND'
        ) {
            return traVeLoi(
                res,
                404,
                error.message,
                error?.errorDetails ??
                    null
            );
        }

        return traVeLoi(
            res,
            500,
            'Lỗi hệ thống khi lấy lịch sử kho',
            error?.message || error
        );
    }
};

// =========================
// XUẤT KHO
// =========================

export const xuatKhoThuCong =
    async (
        req: Request,
        res: Response
    ) => {
        try {
            const {
                variant_id,
                quantity
            } = req.body;

            // validate required

            if (
                variant_id ===
                    undefined ||
                variant_id === null ||
                variant_id === ''
            ) {
                return traVeLoi(
                    res,
                    400,
                    'Vui lòng cung cấp variant_id'
                );
            }

            if (
                quantity ===
                    undefined ||
                quantity === null ||
                quantity === ''
            ) {
                return traVeLoi(
                    res,
                    400,
                    'Vui lòng cung cấp quantity'
                );
            }

            const variantId =
                Number(variant_id);

            const soLuongXuat =
                Number(quantity);

            // validate data

            if (
                !Number.isInteger(
                    variantId
                ) ||
                variantId <= 0
            ) {
                return traVeLoi(
                    res,
                    400,
                    'variant_id phải là số nguyên dương'
                );
            }

            if (
                !Number.isInteger(
                    soLuongXuat
                ) ||
                soLuongXuat <= 0
            ) {
                return traVeLoi(
                    res,
                    400,
                    'quantity phải là số nguyên dương lớn hơn 0'
                );
            }

            const ketQuaXuatKho =
                await xuatKhoThuCongService(
                    variantId,
                    soLuongXuat
                );

            return res.status(200).json({
                message:
                    'Xuất kho thành công',

                data: ketQuaXuatKho,

                errorDetails: null
            });
        } catch (error: any) {
            // not found

            if (
                error?.code ===
                'NOT_FOUND'
            ) {
                return traVeLoi(
                    res,
                    404,
                    error.message,
                    error?.errorDetails ??
                        null
                );
            }

            // số lượng vượt tồn kho

            if (
                error?.code ===
                'INVALID_QUANTITY'
            ) {
                return traVeLoi(
                    res,
                    400,
                    error.message,
                    null
                );
            }

            // rollback/export error

            if (
                error?.code ===
                    'EXPORT_FAILED' ||
                error?.code ===
                    'ROLLBACK_FAILED'
            ) {
                return traVeLoi(
                    res,
                    500,
                    error.message,
                    error?.errorDetails ??
                        null
                );
            }

            return traVeLoi(
                res,
                500,
                'Lỗi hệ thống khi xuất kho',
                error?.message || error
            );
        }
    };