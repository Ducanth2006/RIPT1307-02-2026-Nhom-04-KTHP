import type { Request, Response } from 'express';
import { fetchDashboardOverview } from '../services/adminDashboardService';

/**
 * GET /api/admin/dashboard/stats
 * Lấy toàn bộ số liệu thống kê cho trang Dashboard Admin
 * 
 * Query params:
 * - chartMonth (optional): Tháng hiển thị biểu đồ (format: YYYY-MM, ví dụ: 2026-05)
 */
export const getDashboardStats = async (req: Request, res: Response) => {
    try {
        const chartMonth = req.query.chartMonth as string | undefined;
        const statsData = await fetchDashboardOverview(chartMonth);

        res.status(200).json({
            message: "Lấy dữ liệu thống kê Dashboard thành công!",
            data: statsData
        });
    } catch (error: any) {
        console.error("🔥 Lỗi Dashboard Stats:", error);
        res.status(500).json({
            message: "Lỗi hệ thống khi tải dữ liệu Dashboard.",
            errorDetails: error?.message || error
        });
    }
};
