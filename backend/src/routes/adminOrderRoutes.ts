import { Router } from 'express';
import { getAllOrders, changeOrderStatus } from '../controllers/adminOrderController';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: "[Admin] Orders"
 *   description: API Quản lý Đơn hàng (Dành cho Admin)
 */

/**
 * @swagger
 * /admin/orders:
 *   get:
 *     summary: Lấy danh sách toàn bộ đơn hàng
 *     tags: ["[Admin] Orders"]
 *     responses:
 *       200:
 *         description: Danh sách đơn hàng lấy thành công
 *       500:
 *         description: Lỗi hệ thống
 */
router.get('/', getAllOrders);

/**
 * @swagger
 * /admin/orders/{id}/status:
 *   patch:
 *     summary: Cập nhật trạng thái đơn hàng
 *     tags: ["[Admin] Orders"]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của đơn hàng cần cập nhật trạng thái
 *         example: "uuid-order-001"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 description: Trạng thái mới của đơn hàng
 *                 enum: [Pending, Processing, Shipped, Delivered, Cancelled]
 *                 example: "Shipped"
 *     responses:
 *       200:
 *         description: Cập nhật trạng thái đơn hàng thành công
 *       400:
 *         description: Thiếu thông tin trạng thái mới
 *       500:
 *         description: Lỗi hệ thống
 */
router.patch('/:id/status', changeOrderStatus);

export default router;
