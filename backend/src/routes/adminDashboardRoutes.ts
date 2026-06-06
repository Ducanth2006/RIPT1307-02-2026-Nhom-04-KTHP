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
 *       - KPIs: Doanh thu tháng, đơn hàng, khách hàng mới, đơn chờ xử lý (kèm % tăng trưởng so với tháng trước)
 *       - Biểu đồ doanh thu 12 tháng gần nhất (revenueTrend)
 *       - Top 5 sản phẩm bán chạy nhất (topProducts)
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
 *                     kpis:
 *                       type: object
 *                       properties:
 *                         revenueThisMonth:
 *                           type: number
 *                           example: 284592000
 *                         revenueGrowth:
 *                           type: number
 *                           example: 14.2
 *                         totalOrders:
 *                           type: integer
 *                           example: 3492
 *                         ordersGrowth:
 *                           type: number
 *                           example: 5.8
 *                         newCustomers:
 *                           type: integer
 *                           example: 342
 *                         customersGrowth:
 *                           type: number
 *                           example: 2.4
 *                         pendingOrders:
 *                           type: integer
 *                           example: 12
 *                     revenueTrend:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           month:
 *                             type: string
 *                             example: "Jan"
 *                           revenue:
 *                             type: number
 *                             example: 120000
 *                     topProducts:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           rank:
 *                             type: integer
 *                             example: 1
 *                           id:
 *                             type: string
 *                           name:
 *                             type: string
 *                           imageUrl:
 *                             type: string
 *                             nullable: true
 *                           volume:
 *                             type: integer
 *                           revenue:
 *                             type: number
 *       500:
 *         description: Lỗi hệ thống
 */
router.get('/stats', getDashboardStats);

export default router;
