import { Router } from 'express';
import { getActiveVouchersList, getVoucherByCode, validateVoucher } from '../controllers/clientVoucherController';

const router = Router();

/**
 * @swagger
 * /vouchers:
 *   get:
 *     summary: Lấy danh sách các mã giảm giá khả dụng (Public)
 *     description: Trả về danh sách tất cả các voucher đang hoạt động, còn lượt sử dụng và trong thời hạn sử dụng.
 *     tags: [Client Vouchers]
 *     responses:
 *       200:
 *         description: Lấy danh sách mã giảm giá thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Lấy danh sách mã giảm giá khả dụng thành công"
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                         example: 1
 *                       code:
 *                         type: string
 *                         example: "WELCOME10"
 *                       discount_type:
 *                         type: string
 *                         enum: [Percentage, Fixed]
 *                         example: "Percentage"
 *                       discount_value:
 *                         type: number
 *                         example: 10
 *                       min_order_value:
 *                         type: number
 *                         example: 500000
 *                       max_discount:
 *                         type: number
 *                         example: 100000
 *                       quantity:
 *                         type: integer
 *                         example: 1000
 *                       start_date:
 *                         type: string
 *                         format: date-time
 *                         example: "2026-01-01T00:00:00Z"
 *                       end_date:
 *                         type: string
 *                         format: date-time
 *                         example: "2026-12-31T00:00:00Z"
 *                       status:
 *                         type: string
 *                         example: "Active"
 *       500:
 *         description: Lỗi hệ thống
 */
router.get('/', getActiveVouchersList);

/**
 * @swagger
 * /vouchers/validate:
 *   post:
 *     summary: Validate mã giảm giá trước khi checkout
 *     description: Kiểm tra tính hợp lệ của voucher và tính toán số tiền giảm. Dùng để hiển thị preview giá trước khi đặt hàng.
 *     tags: [Client Vouchers]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - code
 *               - orderTotal
 *             properties:
 *               code:
 *                 type: string
 *                 description: Mã voucher cần kiểm tra
 *                 example: "WELCOME10"
 *               orderTotal:
 *                 type: number
 *                 description: Tổng giá trị đơn hàng (VNĐ)
 *                 example: 1500000
 *     responses:
 *       200:
 *         description: Voucher hợp lệ
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     valid:
 *                       type: boolean
 *                       example: true
 *                     voucher:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: integer
 *                         code:
 *                           type: string
 *                         discount_type:
 *                           type: string
 *                         discount_value:
 *                           type: number
 *                     discount_amount:
 *                       type: number
 *                       description: Số tiền được giảm
 *                       example: 100000
 *                     final_amount:
 *                       type: number
 *                       description: Số tiền sau khi giảm
 *                       example: 1400000
 *       400:
 *         description: Voucher không hợp lệ (hết hạn, hết lượt, không đủ điều kiện, v.v.)
 */
router.post('/validate', validateVoucher);

/**
 * @swagger
 * /vouchers/{code}:
 *   get:
 *     summary: Xem thông tin chi tiết một mã giảm giá qua Code (Public)
 *     description: Cho phép tra cứu thông tin chi tiết của một voucher cụ thể bằng mã code (ví dụ WELCOME10) để hiển thị/áp dụng.
 *     tags: [Client Vouchers]
 *     parameters:
 *       - in: path
 *         name: code
 *         required: true
 *         schema:
 *           type: string
 *         description: Mã code của voucher cần tra cứu
 *         example: "WELCOME10"
 *     responses:
 *       200:
 *         description: Lấy chi tiết mã giảm giá thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Lấy chi tiết mã giảm giá thành công"
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       example: 1
 *                     code:
 *                       type: string
 *                       example: "WELCOME10"
 *                     discount_type:
 *                       type: string
 *                       example: "Percentage"
 *                     discount_value:
 *                       type: number
 *                       example: 10
 *                     min_order_value:
 *                       type: number
 *                       example: 500000
 *                     max_discount:
 *                       type: number
 *                       example: 100000
 *                     quantity:
 *                       type: integer
 *                       example: 1000
 *                     start_date:
 *                       type: string
 *                       format: date-time
 *                       example: "2026-01-01T00:00:00Z"
 *                     end_date:
 *                       type: string
 *                       format: date-time
 *                       example: "2026-12-31T00:00:00Z"
 *                     status:
 *                       type: string
 *                       example: "Active"
 *       400:
 *         description: Mã giảm giá không hợp lệ hoặc không tồn tại
 *       500:
 *         description: Lỗi hệ thống
 */
router.get('/:code', getVoucherByCode);

export default router;
