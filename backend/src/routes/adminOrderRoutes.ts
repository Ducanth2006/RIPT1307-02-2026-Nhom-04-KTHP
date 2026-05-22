import { Router } from 'express';
import {
    thongKeDonHang,
    danhSachDonHang,
    chiTietDonHang,
    capNhatTrangThaiDonHang,
} from '../controllers/adminOrderController';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: "[Admin] Orders"
 *   description: API Quản lý Đơn hàng (Dành cho Admin)
 */

/**
 * @swagger
 * /admin/orders/stats:
 *   get:
 *     summary: Lấy thống kê đơn hàng
 *     tags: ["[Admin] Orders"]
 *     responses:
 *       200:
 *         description: Thống kê đơn hàng lấy thành công
 *       500:
 *         description: Lỗi hệ thống
 */
router.get('/stats', thongKeDonHang);

/**
 * @swagger
 * /admin/orders/:
 *   get:
 *     summary: Lấy danh sách toàn bộ đơn hàng
 *     tags: ["[Admin] Orders"]
 *     responses:
 *       200:
 *         description: Danh sách đơn hàng lấy thành công
 *       500:
 *         description: Lỗi hệ thống
 */
router.get('/', danhSachDonHang);

/**
 * @swagger
 * /admin/orders/{id}:
 *   get:
 *     summary: Lấy chi tiết một đơn hàng
 *     tags: ["[Admin] Orders"]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của đơn hàng
 *         example: "uuid-order-001"
 *     responses:
 *       200:
 *         description: Lấy chi tiết đơn hàng thành công
 *       404:
 *         description: Không tìm thấy đơn hàng
 *       500:
 *         description: Lỗi hệ thống
 */
router.get('/:id', chiTietDonHang);

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
 *                 enum: [Pending, Confirmed, Packing, Shipping, Completed, Cancelled]
 *                 example: "Confirmed"
 *     responses:
 *       200:
 *         description: Cập nhật trạng thái đơn hàng thành công
 *       400:
 *         description: Thiếu thông tin trạng thái hoặc trạng thái không hợp lệ
 *       404:
 *         description: Không tìm thấy đơn hàng
 *       500:
 *         description: Lỗi hệ thống
 */
router.patch('/:id/status', capNhatTrangThaiDonHang);

export default router;

