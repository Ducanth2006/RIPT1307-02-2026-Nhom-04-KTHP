import { Router } from 'express';
import { getReportData } from '../controllers/adminReportController';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: "[Admin] Reports"
 *   description: API Báo cáo & Phân tích (Dành cho Admin)
 */

/**
 * @swagger
 * /admin/reports/data:
 *   get:
 *     summary: Lấy toàn bộ dữ liệu cho trang Báo cáo & Phân tích
 *     tags: ["[Admin] Reports"]
 *     parameters:
 *       - in: query
 *         name: timeRange
 *         schema:
 *           type: string
 *           enum: [today, 7days, 30days, year]
 *         description: Khoảng thời gian lọc (mặc định 30days)
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Ngày bắt đầu tùy chỉnh (YYYY-MM-DD)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Ngày kết thúc tùy chỉnh (YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: Lấy dữ liệu báo cáo thành công
 *       500:
 *         description: Lỗi hệ thống
 */
router.get('/data', getReportData);

export default router;
