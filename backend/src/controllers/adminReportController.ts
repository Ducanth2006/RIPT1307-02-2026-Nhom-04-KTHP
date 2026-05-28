import type { Request, Response } from 'express';
import { fetchReportData } from '../services/adminReportService';

/**
 * GET /api/admin/reports/data
 * Lấy toàn bộ dữ liệu cho trang Báo cáo & Phân tích
 *
 * Query params:
 * - timeRange: 'today' | '7days' | '30days' | 'year' (mặc định: '30days')
 * - startDate: string (YYYY-MM-DD) - khoảng ngày tùy chỉnh
 * - endDate: string (YYYY-MM-DD) - khoảng ngày tùy chỉnh
 */
export const getReportData = async (req: Request, res: Response) => {
    try {
        const timeRange = (req.query.timeRange as string) || '30days';
        const customStart = req.query.startDate as string | undefined;
        const customEnd = req.query.endDate as string | undefined;

        const data = await fetchReportData(timeRange, customStart, customEnd);

        res.status(200).json({
            message: 'Lấy dữ liệu báo cáo thành công!',
            data
        });
    } catch (error: any) {
        console.error('🔥 Lỗi Report Data:', error);
        res.status(500).json({
            message: 'Lỗi hệ thống khi tải dữ liệu báo cáo.',
            errorDetails: error?.message || error
        });
    }
};
