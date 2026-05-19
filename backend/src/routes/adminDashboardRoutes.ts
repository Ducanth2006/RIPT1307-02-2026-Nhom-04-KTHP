import { Router } from 'express';
import { getDashboardStats } from '../controllers/adminDashboardController';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: "[Admin] Dashboard"
 *   description: API Thống kê tổng quan hệ thống (Dành cho Admin)
 */

/**
 * @swagger
 * /admin/dashboard/stats:
 *   get:
 *     summary: Lấy toàn bộ số liệu thống kê cho trang Dashboard
 *     tags: ["[Admin] Dashboard"]
 *     description: |
 *       Trả về các chỉ số tổng quan bao gồm:
 *       - Tổng doanh thu (totalRevenue)
 *       - Tổng số đơn hàng (totalOrders)
 *       - Tổng số người dùng (totalCustomers)
 *       - Số lượng sản phẩm đang hoạt động (activeProducts)
 *     responses:
 *       200:
 *         description: Lấy dữ liệu thống kê thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Lấy dữ liệu thống kê Dashboard thành công!"
 *                 data:
 *                   type: object
 *                   properties:
 *                     totalRevenue:
 *                       type: number
 *                       example: 284592000
 *                     totalOrders:
 *                       type: integer
 *                       example: 3492
 *                     totalCustomers:
 *                       type: integer
 *                       example: 12845
 *                     activeProducts:
 *                       type: integer
 *                       example: 59102
 *       500:
 *         description: Lỗi hệ thống
 */
router.get('/stats', getDashboardStats);

export default router;
