import { Router } from 'express';
import { postComplaint, getComplaints, getComplaintDetail } from '../controllers/clientComplaintController';

const router = Router();

/**
 * @swagger
 * /complaints:
 *   post:
 *     summary: Khách hàng tạo ticket khiếu nại/phản hồi (User)
 *     description: Tạo một khiếu nại/phản hồi cho đơn hàng. Đơn hàng phải thuộc về user.
 *     tags: [Client Complaints]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - orderId
 *               - subject
 *               - content
 *             properties:
 *               userId:
 *                 type: integer
 *                 example: 1
 *               orderId:
 *                 type: integer
 *                 description: ID đơn hàng đính kèm
 *                 example: 10
 *               subject:
 *                 type: string
 *                 description: Tiêu đề khiếu nại
 *                 example: "Sản phẩm bị lỗi"
 *               content:
 *                 type: string
 *                 description: Nội dung chi tiết khiếu nại
 *                 example: "Tôi nhận được áo bị rách đường chỉ ở tay áo phải."
 *     responses:
 *       201:
 *         description: Gửi khiếu nại thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Gửi khiếu nại thành công"
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     user_id:
 *                       type: integer
 *                     order_id:
 *                       type: integer
 *                     subject:
 *                       type: string
 *                     content:
 *                       type: string
 *                     status:
 *                       type: string
 *                       example: "New"
 *                     created_at:
 *                       type: string
 *       400:
 *         description: Thiếu thông tin hoặc đơn hàng không hợp lệ
 *       401:
 *         description: Thiếu userId
 *
 *   get:
 *     summary: Lấy danh sách các khiếu nại đã gửi và xem trạng thái (User)
 *     description: Trả về tất cả khiếu nại của user, kèm thông tin đơn hàng liên quan và phản hồi từ admin.
 *     tags: [Client Complaints]
 *     parameters:
 *       - in: query
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID của người dùng
 *     responses:
 *       200:
 *         description: Thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Lấy danh sách khiếu nại thành công"
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       subject:
 *                         type: string
 *                       content:
 *                         type: string
 *                       status:
 *                         type: string
 *                         enum: [New, In Progress, Resolved, Closed]
 *                       admin_response:
 *                         type: string
 *                         nullable: true
 *                       created_at:
 *                         type: string
 *                       orders:
 *                         type: object
 *       401:
 *         description: Thiếu userId
 *       500:
 *         description: Lỗi hệ thống
 */
router.route('/')
    .post(postComplaint)
    .get(getComplaints);

/**
 * @swagger
 * /complaints/{id}:
 *   get:
 *     summary: Xem chi tiết 1 khiếu nại (User)
 *     description: Lấy chi tiết khiếu nại, bao gồm phản hồi từ admin (nếu có).
 *     tags: [Client Complaints]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID của khiếu nại
 *       - in: query
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Thành công
 *       401:
 *         description: Thiếu userId
 *       404:
 *         description: Không tìm thấy khiếu nại
 */
router.get('/:id', getComplaintDetail);

export default router;
