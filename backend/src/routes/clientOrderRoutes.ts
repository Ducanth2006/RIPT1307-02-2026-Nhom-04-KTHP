import { Router } from 'express';
import { createOrder } from '../controllers/clientOrderController';

const router = Router();

/**
 * @swagger
 * /orders:
 *   post:
 *     summary: Thực hiện đặt hàng (Checkout)
 *     description: Hệ thống sẽ lấy giỏ hàng của user hiện tại, tính toán tổng tiền, áp dụng voucher (nếu có), trừ tồn kho, xóa giỏ hàng và lưu thông tin đơn hàng. Thời gian thực thi kỳ vọng < 3s.
 *     tags: [Client Orders]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - shippingAddress
 *               - paymentMethod
 *             properties:
 *               userId:
 *                 type: integer
 *                 description: ID của khách hàng
 *                 example: 1
 *               shippingAddress:
 *                 type: object
 *                 description: Thông tin địa chỉ giao hàng (JSON)
 *                 example: { "fullName": "Nguyen Van A", "phone": "0901234567", "address": "123 Đường ABC, Quận 1, TP.HCM" }
 *               paymentMethod:
 *                 type: string
 *                 description: Phương thức thanh toán (COD, VNPay, Momo,...)
 *                 example: "COD"
 *               voucherCode:
 *                 type: string
 *                 description: (Tùy chọn) Mã giảm giá
 *                 example: "SUMMER20"
 *     responses:
 *       201:
 *         description: Đặt hàng thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Đặt hàng thành công!"
 *                 executionTime:
 *                   type: string
 *                   example: "500.00 ms"
 *                 data:
 *                   type: object
 *                   description: Chi tiết order vừa tạo
 *       400:
 *         description: Lỗi dữ liệu đầu vào hoặc hết hàng
 *       401:
 *         description: Thiếu userId
 *       500:
 *         description: Lỗi hệ thống
 */
router.post('/', createOrder);

export default router;
