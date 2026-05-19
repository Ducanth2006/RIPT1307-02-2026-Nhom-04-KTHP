import { Router } from 'express';
import { createOrder, getOrders, getOrderById, cancelOrderById } from '../controllers/clientOrderController';

const router = Router();

/**
 * @swagger
 * /orders:
 *   get:
 *     summary: Xem lịch sử đơn hàng của cá nhân (Public)
 *     description: Lấy danh sách các đơn hàng mà user đã đặt, bao gồm chi tiết các sản phẩm bên trong mỗi đơn hàng. Sắp xếp theo thời gian mới nhất.
 *     tags: [Client Orders]
 *     parameters:
 *       - in: query
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID của khách hàng
 *     responses:
 *       200:
 *         description: Thành công
 *       401:
 *         description: Thiếu userId
 *       500:
 *         description: Lỗi hệ thống
 * 
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
 *       400:
 *         description: Lỗi dữ liệu đầu vào hoặc hết hàng
 *       401:
 *         description: Thiếu userId
 *       500:
 *         description: Lỗi hệ thống
 */
router.route('/')
    .get(getOrders)
    .post(createOrder);

/**
 * @swagger
 * /orders/{id}:
 *   get:
 *     summary: Xem chi tiết lộ trình và trạng thái đơn hàng (Public)
 *     description: Lấy chi tiết thông tin của 1 đơn hàng cụ thể, bao gồm danh sách sản phẩm, trạng thái xử lý, và thông tin thanh toán.
 *     tags: [Client Orders]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID của đơn hàng
 *       - in: query
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID của khách hàng (để xác thực quyền sở hữu)
 *     responses:
 *       200:
 *         description: Lấy dữ liệu thành công
 *       401:
 *         description: Thiếu userId
 *       404:
 *         description: Không tìm thấy đơn hàng hoặc không có quyền truy cập
 *       500:
 *         description: Lỗi hệ thống
 */
router.get('/:id', getOrderById);

/**
 * @swagger
 * /orders/{id}/cancel:
 *   patch:
 *     summary: Hủy đơn hàng (User)
 *     description: |
 *       Gửi yêu cầu hủy đơn hàng. Chỉ được phép hủy khi đơn đang ở trạng thái **Pending** hoặc **Confirmed** (chưa được đóng gói).
 *       Khi hủy thành công, hệ thống sẽ tự động:
 *       - Cập nhật trạng thái đơn hàng thành `Cancelled`
 *       - Hoàn lại số lượng tồn kho cho từng sản phẩm
 *       - Hoàn lại số lượt sử dụng Voucher (nếu có)
 *       - Cập nhật trạng thái thanh toán thành `Failed`
 *     tags: [Client Orders]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID của đơn hàng cần hủy
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *             properties:
 *               userId:
 *                 type: integer
 *                 description: ID của khách hàng (để xác thực quyền sở hữu)
 *                 example: 1
 *               cancelReason:
 *                 type: string
 *                 description: Lý do hủy đơn (tùy chọn)
 *                 example: "Tôi muốn thay đổi địa chỉ giao hàng"
 *     responses:
 *       200:
 *         description: Hủy đơn hàng thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Hủy đơn hàng thành công."
 *                 data:
 *                   type: object
 *                   properties:
 *                     orderId:
 *                       type: integer
 *                     status:
 *                       type: string
 *                       example: "Cancelled"
 *                     cancel_reason:
 *                       type: string
 *       400:
 *         description: Không thể hủy (đơn đang ở trạng thái Packing/Shipping/Completed) hoặc không tìm thấy đơn
 *       401:
 *         description: Thiếu userId
 *       500:
 *         description: Lỗi hệ thống
 */
router.patch('/:id/cancel', cancelOrderById);

export default router;
