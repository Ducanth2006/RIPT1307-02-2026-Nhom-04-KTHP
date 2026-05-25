import { Router } from 'express';
import {
    getAllVouchers,
    getVoucherStatsHandler,
    getVoucherById,
    createNewVoucher,
    updateVoucherHandler,
    deleteVoucherHandler,
    toggleVoucherStatusHandler
} from '../controllers/adminVoucherController';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: "[Admin] Vouchers"
 *   description: API Quản lý Mã giảm giá (Dành cho Admin)
 */

/**
 * @swagger
 * /admin/vouchers/stats:
 *   get:
 *     summary: Thống kê tổng quan voucher
 *     tags: ["[Admin] Vouchers"]
 *     responses:
 *       200:
 *         description: Thống kê voucher thành công
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
 *                     totalVouchers:
 *                       type: integer
 *                       description: Tổng số voucher trong hệ thống
 *                     activeVouchers:
 *                       type: integer
 *                       description: Số voucher đang hoạt động
 *                     expiredVouchers:
 *                       type: integer
 *                       description: Số voucher đã hết hạn
 *                     disabledVouchers:
 *                       type: integer
 *                       description: Số voucher đã bị vô hiệu hóa
 *                     totalQuantityRemaining:
 *                       type: integer
 *                       description: Tổng lượt sử dụng còn lại
 *                     totalUsed:
 *                       type: integer
 *                       description: Tổng số lần voucher đã được sử dụng
 *                     totalDiscountGiven:
 *                       type: number
 *                       description: Tổng số tiền đã giảm giá
 *       500:
 *         description: Lỗi hệ thống
 */
router.get('/stats', getVoucherStatsHandler);

/**
 * @swagger
 * /admin/vouchers:
 *   get:
 *     summary: Lấy danh sách toàn bộ mã giảm giá
 *     tags: ["[Admin] Vouchers"]
 *     responses:
 *       200:
 *         description: Danh sách voucher lấy thành công (kèm used_count)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       code:
 *                         type: string
 *                       discount_type:
 *                         type: string
 *                         enum: [Percentage, Fixed]
 *                       discount_value:
 *                         type: number
 *                       min_order_value:
 *                         type: number
 *                       max_discount:
 *                         type: number
 *                       quantity:
 *                         type: integer
 *                       start_date:
 *                         type: string
 *                       end_date:
 *                         type: string
 *                       status:
 *                         type: string
 *                       description:
 *                         type: string
 *                       used_count:
 *                         type: integer
 *                         description: Số lần voucher đã được sử dụng
 *       500:
 *         description: Lỗi hệ thống
 */
router.get('/', getAllVouchers);

/**
 * @swagger
 * /admin/vouchers/{id}:
 *   get:
 *     summary: Lấy chi tiết voucher theo ID (kèm thống kê sử dụng)
 *     tags: ["[Admin] Vouchers"]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID của voucher
 *     responses:
 *       200:
 *         description: Lấy chi tiết voucher thành công
 *       404:
 *         description: Voucher không tồn tại
 *       500:
 *         description: Lỗi hệ thống
 */
router.get('/:id', getVoucherById);

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
 *               - discountValue
 *               - discountType
 *             properties:
 *               code:
 *                 type: string
 *                 description: Mã voucher (duy nhất, sẽ tự động chuyển UPPERCASE)
 *                 example: "SUMMER2025"
 *               description:
 *                 type: string
 *                 description: Mô tả voucher
 *                 example: "Giảm giá mùa hè 2025"
 *               discountType:
 *                 type: string
 *                 enum: [percentage, fixed, Percentage, Fixed]
 *                 description: Loại giảm giá
 *                 example: "percentage"
 *               discountValue:
 *                 type: number
 *                 description: Giá trị giảm (% hoặc VNĐ)
 *                 example: 20
 *               maxDiscount:
 *                 type: number
 *                 description: Giảm tối đa (chỉ dùng cho percentage)
 *                 example: 100000
 *               minOrderValue:
 *                 type: number
 *                 description: Giá trị đơn hàng tối thiểu
 *                 example: 500000
 *               usageLimit:
 *                 type: integer
 *                 description: Số lượt sử dụng tối đa
 *                 example: 200
 *               startDate:
 *                 type: string
 *                 format: date-time
 *                 description: Ngày bắt đầu hiệu lực
 *                 example: "2025-06-01T00:00:00Z"
 *               endDate:
 *                 type: string
 *                 format: date-time
 *                 description: Ngày hết hạn
 *                 example: "2025-12-31T23:59:59Z"
 *               isActive:
 *                 type: boolean
 *                 description: Trạng thái (true=Active, false=Disabled)
 *                 example: true
 *     responses:
 *       201:
 *         description: Tạo voucher thành công
 *       400:
 *         description: Thiếu thông tin bắt buộc
 *       409:
 *         description: Mã voucher đã tồn tại
 *       500:
 *         description: Lỗi hệ thống
 */
router.post('/', createNewVoucher);

/**
 * @swagger
 * /admin/vouchers/{id}:
 *   put:
 *     summary: Cập nhật thông tin voucher
 *     tags: ["[Admin] Vouchers"]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID của voucher cần cập nhật
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               code:
 *                 type: string
 *               description:
 *                 type: string
 *               discountType:
 *                 type: string
 *                 enum: [percentage, fixed]
 *               discountValue:
 *                 type: number
 *               maxDiscount:
 *                 type: number
 *               minOrderValue:
 *                 type: number
 *               usageLimit:
 *                 type: integer
 *               startDate:
 *                 type: string
 *                 format: date-time
 *               endDate:
 *                 type: string
 *                 format: date-time
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *       404:
 *         description: Voucher không tồn tại
 *       409:
 *         description: Mã voucher đã được sử dụng bởi voucher khác
 *       500:
 *         description: Lỗi hệ thống
 */
router.put('/:id', updateVoucherHandler);

/**
 * @swagger
 * /admin/vouchers/{id}:
 *   delete:
 *     summary: Xóa voucher (chỉ xóa được nếu chưa có đơn hàng sử dụng)
 *     tags: ["[Admin] Vouchers"]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID của voucher cần xóa
 *     responses:
 *       200:
 *         description: Xóa voucher thành công
 *       404:
 *         description: Voucher không tồn tại
 *       409:
 *         description: Không thể xóa vì đã có đơn hàng sử dụng
 *       500:
 *         description: Lỗi hệ thống
 */
router.delete('/:id', deleteVoucherHandler);

/**
 * @swagger
 * /admin/vouchers/{id}/toggle:
 *   patch:
 *     summary: Bật/Tắt trạng thái voucher (Active <-> Disabled)
 *     tags: ["[Admin] Vouchers"]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID của voucher
 *     responses:
 *       200:
 *         description: Toggle trạng thái thành công
 *       404:
 *         description: Voucher không tồn tại
 *       500:
 *         description: Lỗi hệ thống
 */
router.patch('/:id/toggle', toggleVoucherStatusHandler);

export default router;
