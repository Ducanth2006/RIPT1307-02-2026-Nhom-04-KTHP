import type { Request, Response } from 'express';
import {
    fetchAllVouchers,
    fetchVoucherById,
    createVoucher,
    updateVoucher,
    deleteVoucher,
    toggleVoucherStatus,
    getVoucherStats
} from '../services/adminVoucherService';

// ============================
// GET /api/admin/vouchers
// ============================
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

// ============================
// GET /api/admin/vouchers/stats
// ============================
export const getVoucherStatsHandler = async (req: Request, res: Response) => {
    try {
        const stats = await getVoucherStats();
        res.status(200).json({
            message: "Lấy thống kê Voucher thành công!",
            data: stats
        });
    } catch (error) {
        res.status(500).json({
            message: "Lỗi hệ thống khi lấy thống kê Voucher.",
            errorDetails: error
        });
    }
};

// ============================
// GET /api/admin/vouchers/:id
// ============================
export const getVoucherById = async (req: Request, res: Response): Promise<any> => {
    try {
        const { id } = req.params;
        if (!id) {
            return res.status(400).json({
                message: "Vui lòng cung cấp ID của Voucher."
            });
        }

        const voucher = await fetchVoucherById(String(id));
        res.status(200).json({
            message: "Lấy chi tiết Voucher thành công!",
            data: voucher
        });
    } catch (error: any) {
        const status = error.message?.includes('không tồn tại') ? 404 : 500;
        res.status(status).json({
            message: error.message || "Lỗi hệ thống khi lấy chi tiết Voucher.",
            errorDetails: error
        });
    }
};

// ============================
// POST /api/admin/vouchers
// Body: { code, discountType, discountValue, maxDiscount?, minOrderValue?, usageLimit, startDate?, endDate?, isActive? }
// ============================
export const createNewVoucher = async (req: Request, res: Response): Promise<any> => {
    try {
        const {
            code,
            discountType,
            discountValue,
            maxDiscount,
            minOrderValue,
            usageLimit,
            startDate,
            endDate,
            isActive
        } = req.body;

        // Validate bắt buộc
        if (!code || discountValue === undefined || discountValue === null) {
            return res.status(400).json({
                message: "Vui lòng nhập đầy đủ mã Voucher (code) và mức giảm giá (discountValue)."
            });
        }

        if (!discountType) {
            return res.status(400).json({
                message: "Vui lòng chọn loại giảm giá (discountType: percentage hoặc fixed)."
            });
        }

        // Map discountType frontend → DB value
        let dbDiscountType = 'Percentage';
        if (discountType === 'fixed' || discountType === 'Fixed') {
            dbDiscountType = 'Fixed';
        }

        const voucherData = {
            code: String(code),
            discount_type: dbDiscountType,
            discount_value: Number(discountValue),
            max_discount: (maxDiscount !== undefined && maxDiscount !== null) ? Number(maxDiscount) : null,
            min_order_value: minOrderValue !== undefined ? Number(minOrderValue) : 0,
            quantity: usageLimit ? Number(usageLimit) : 100,
            start_date: startDate || null,
            end_date: endDate || null,
            status: isActive === false ? 'Disabled' : 'Active'
        };

        const result = await createVoucher(voucherData);

        res.status(201).json({
            message: "Tạo Mã giảm giá mới thành công!",
            data: result
        });
    } catch (error: any) {
        const status = error.message?.includes('đã tồn tại') ? 409 : 500;
        res.status(status).json({
            message: error.message || "Lỗi hệ thống khi tạo Voucher.",
            errorDetails: error
        });
    }
};

// ============================
// PUT /api/admin/vouchers/:id
// Body: { code?, discountType?, discountValue?, maxDiscount?, minOrderValue?, usageLimit?, startDate?, endDate?, isActive? }
// ============================
export const updateVoucherHandler = async (req: Request, res: Response): Promise<any> => {
    try {
        const { id } = req.params;
        if (!id) {
            return res.status(400).json({
                message: "Vui lòng cung cấp ID của Voucher."
            });
        }

        const {
            code,
            discountType,
            discountValue,
            maxDiscount,
            minOrderValue,
            usageLimit,
            startDate,
            endDate,
            isActive
        } = req.body;

        // Chỉ gồm các cột thực tế trong DB
        const updateData: Record<string, any> = {};

        if (code !== undefined) updateData.code = String(code);
        if (discountType !== undefined) {
            updateData.discount_type = (discountType === 'fixed' || discountType === 'Fixed') ? 'Fixed' : 'Percentage';
        }
        if (discountValue !== undefined) updateData.discount_value = Number(discountValue);
        if (maxDiscount !== undefined) updateData.max_discount = maxDiscount !== null ? Number(maxDiscount) : null;
        if (minOrderValue !== undefined) updateData.min_order_value = Number(minOrderValue);
        if (usageLimit !== undefined) updateData.quantity = Number(usageLimit);
        if (startDate !== undefined) updateData.start_date = startDate;
        if (endDate !== undefined) updateData.end_date = endDate;
        if (isActive !== undefined) updateData.status = isActive ? 'Active' : 'Disabled';

        const result = await updateVoucher(String(id), updateData);

        res.status(200).json({
            message: "Cập nhật Voucher thành công!",
            data: result
        });
    } catch (error: any) {
        const status = error.message?.includes('không tồn tại') ? 404 :
            error.message?.includes('đã được sử dụng') ? 409 : 500;
        res.status(status).json({
            message: error.message || "Lỗi hệ thống khi cập nhật Voucher.",
            errorDetails: error
        });
    }
};

// ============================
// DELETE /api/admin/vouchers/:id
// ============================
export const deleteVoucherHandler = async (req: Request, res: Response): Promise<any> => {
    try {
        const { id } = req.params;
        if (!id) {
            return res.status(400).json({
                message: "Vui lòng cung cấp ID của Voucher."
            });
        }

        const result = await deleteVoucher(String(id));

        res.status(200).json({
            message: `Xóa Voucher "${result.code}" thành công!`,
            data: result
        });
    } catch (error: any) {
        const status = error.message?.includes('không tồn tại') ? 404 :
            error.message?.includes('Không thể xóa') ? 409 : 500;
        res.status(status).json({
            message: error.message || "Lỗi hệ thống khi xóa Voucher.",
            errorDetails: error
        });
    }
};

// ============================
// PATCH /api/admin/vouchers/:id/toggle
// ============================
export const toggleVoucherStatusHandler = async (req: Request, res: Response): Promise<any> => {
    try {
        const { id } = req.params;
        if (!id) {
            return res.status(400).json({
                message: "Vui lòng cung cấp ID của Voucher."
            });
        }

        const result = await toggleVoucherStatus(String(id));

        res.status(200).json({
            message: `Voucher "${result.code}" đã được ${result.status === 'Active' ? 'kích hoạt' : 'vô hiệu hóa'} thành công!`,
            data: result
        });
    } catch (error: any) {
        const status = error.message?.includes('không tồn tại') ? 404 : 500;
        res.status(status).json({
            message: error.message || "Lỗi hệ thống khi toggle trạng thái Voucher.",
            errorDetails: error
        });
    }
};
