import { Router } from 'express';
import { getAllVouchers, createNewVoucher } from '../controllers/adminVoucherController';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: "[Admin] Vouchers"
 *   description: API Quản lý Mã giảm giá (Dành cho Admin)
 */

/**
 * @swagger
 * /admin/vouchers:
 *   get:
 *     summary: Lấy danh sách toàn bộ mã giảm giá
 *     tags: ["[Admin] Vouchers"]
 *     responses:
 *       200:
 *         description: Danh sách voucher lấy thành công
 *       500:
 *         description: Lỗi hệ thống
 */
router.get('/', getAllVouchers);

/**
 * @swagger
 * /admin/vouchers:
 *   post:
 *     summary: Tạo mã giảm giá mới
 *     tags: ["[Admin] Vouchers"]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - code
 *               - discountAmount
 *             properties:
 *               code:
 *                 type: string
 *                 description: Mã voucher (duy nhất trong hệ thống)
 *                 example: "SUMMER2025"
 *               discountAmount:
 *                 type: number
 *                 description: Số tiền giảm giá (đơn vị VNĐ)
 *                 example: 50000
 *               usageLimit:
 *                 type: integer
 *                 description: Số lượt sử dụng tối đa (mặc định 100 nếu không nhập)
 *                 example: 200
 *     responses:
 *       201:
 *         description: Tạo voucher thành công
 *       400:
 *         description: Thiếu mã voucher hoặc số tiền giảm giá
 *       500:
 *         description: Lỗi hệ thống
 */
router.post('/', createNewVoucher);

export default router;
