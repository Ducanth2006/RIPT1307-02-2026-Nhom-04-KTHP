import { Router } from 'express';
import {
    getAllComplaints,
    getComplaintDetail,
    confirmComplaintHandler,
    replyComplaintHandler
} from '../controllers/adminComplaintController';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: "[Admin] Complaints"
 *   description: Quản lý Khiếu nại & Phản hồi khách hàng (Dành cho Admin)
 */

/**
 * @swagger
 * /admin/complaints:
 *   get:
 *     summary: Lấy danh sách toàn bộ khiếu nại (Admin)
 *     tags: ["[Admin] Complaints"]
 *     description: Trả về toàn bộ các khiếu nại gửi từ khách hàng, sắp xếp từ mới nhất đến cũ nhất.
 *     responses:
 *       200:
 *         description: Lấy danh sách thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Lấy danh sách khiếu nại thành công!"
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *       500:
 *         description: Lỗi hệ thống
 */
router.get('/', getAllComplaints);

/**
 * @swagger
 * /admin/complaints/{id}:
 *   get:
 *     summary: Lấy chi tiết đơn khiếu nại (Admin)
 *     tags: ["[Admin] Complaints"]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID của khiếu nại
 *     responses:
 *       200:
 *         description: Lấy chi tiết thành công
 *       404:
 *         description: Khiếu nại không tồn tại
 *       500:
 *         description: Lỗi hệ thống
 */
router.get('/:id', getComplaintDetail);

/**
 * @swagger
 * /admin/complaints/{id}/confirm:
 *   patch:
 *     summary: Xác nhận khiếu nại (Admin)
 *     tags: ["[Admin] Complaints"]
 *     description: Chuyển trạng thái khiếu nại từ "Mới" (New) sang "Đã xác nhận" (Confirmed) và tự động bắn thông báo cho khách hàng.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID của khiếu nại
 *     responses:
 *       200:
 *         description: Xác nhận khiếu nại thành công
 *       400:
 *         description: Trạng thái khiếu nại không hợp lệ
 *       404:
 *         description: Khiếu nại không tồn tại
 */
router.patch('/:id/confirm', confirmComplaintHandler);

/**
 * @swagger
 * /admin/complaints/{id}/reply:
 *   put:
 *     summary: Gửi phản hồi/hồi đáp khiếu nại (Admin)
 *     tags: ["[Admin] Complaints"]
 *     description: Viết hồi đáp cho khiếu nại, tự động đổi trạng thái sang "Resolved" (Đã giải quyết) và gửi thông báo kết quả cho khách hàng.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID của khiếu nại
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - replyText
 *             properties:
 *               replyText:
 *                 type: string
 *                 description: Nội dung thư hồi đáp gửi cho khách hàng
 *                 example: "Shop vô cùng xin lỗi về sự cố này. Shop đã gửi bù 1 đôi giày đúng size 42 miễn phí qua đơn mới. Mã vận đơn là SP29302."
 *     responses:
 *       200:
 *         description: Hồi đáp thành công
 *       400:
 *         description: Thiếu nội dung hồi đáp
 *       404:
 *         description: Khiếu nại không tồn tại
 */
router.put('/:id/reply', replyComplaintHandler);
router.patch('/:id/reply', replyComplaintHandler);

export default router;
