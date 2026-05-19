import { Router } from 'express';
import { getAllCustomers, changeCustomerStatus } from '../controllers/adminCustomerController';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: "[Admin] Customers"
 *   description: API Quản lý Khách hàng (Dành cho Admin)
 */

/**
 * @swagger
 * /admin/customers:
 *   get:
 *     summary: Lấy danh sách toàn bộ khách hàng
 *     tags: ["[Admin] Customers"]
 *     responses:
 *       200:
 *         description: Danh sách khách hàng lấy thành công
 *       500:
 *         description: Lỗi hệ thống
 */
router.get('/', getAllCustomers);

/**
 * @swagger
 * /admin/customers/{id}/status:
 *   patch:
 *     summary: Khóa hoặc mở khóa tài khoản khách hàng
 *     tags: ["[Admin] Customers"]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của khách hàng cần thay đổi trạng thái
 *         example: "uuid-customer-001"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - isActive
 *             properties:
 *               isActive:
 *                 type: boolean
 *                 description: "true = Mở khóa tài khoản | false = Khóa tài khoản"
 *                 example: false
 *     responses:
 *       200:
 *         description: Cập nhật trạng thái tài khoản thành công
 *       400:
 *         description: Thiếu thông tin isActive
 *       500:
 *         description: Lỗi hệ thống
 */
router.patch('/:id/status', changeCustomerStatus);

export default router;
