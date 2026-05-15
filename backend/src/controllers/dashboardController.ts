import type { Request, Response } from 'express';
import { fetchDashboardOverview } from '../services/dashboardService';

export const getDashboardStats = async (req: Request, res: Response) => {
    try {
        const statsData = await fetchDashboardOverview();

        res.status(200).json({
            message: "Lấy dữ liệu thống kê Dashboard thành công!",
            data: statsData
        });
    } catch (error) {
        res.status(500).json({
            message: "Lỗi hệ thống khi tải dữ liệu Dashboard.",
            errorDetails: error
        });
    }
};