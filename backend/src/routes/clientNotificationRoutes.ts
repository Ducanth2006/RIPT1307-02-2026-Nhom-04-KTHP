import { Router } from 'express';
import { getNotifications, readNotification, readAllNotifications } from '../controllers/clientNotificationController';

const router = Router();

/**
 * @swagger
 * /notifications:
 *   get:
 *     summary: Lấy danh sách thông báo của user (User)
 *     description: Trả về danh sách thông báo có phân trang, kèm số lượng chưa đọc.
 *     tags: [Client Notifications]
 *     parameters:
 *       - in: query
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID của người dùng
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: Thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       title:
 *                         type: string
 *                       message:
 *                         type: string
 *                       type:
 *                         type: string
 *                       is_read:
 *                         type: boolean
 *                       created_at:
 *                         type: string
 *                 total:
 *                   type: integer
 *                 unreadCount:
 *                   type: integer
 *                 page:
 *                   type: integer
 *                 totalPages:
 *                   type: integer
 *       401:
 *         description: Thiếu userId
 *       500:
 *         description: Lỗi hệ thống
 */
router.get('/', getNotifications);

/**
 * @swagger
 * /notifications/read-all:
 *   patch:
 *     summary: Đánh dấu tất cả thông báo là đã đọc (User)
 *     tags: [Client Notifications]
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
 *                 example: 1
 *     responses:
 *       200:
 *         description: Đánh dấu thành công
 *       401:
 *         description: Thiếu userId
 *       500:
 *         description: Lỗi hệ thống
 */
router.patch('/read-all', readAllNotifications);

/**
 * @swagger
 * /notifications/{id}/read:
 *   patch:
 *     summary: Đánh dấu 1 thông báo là đã đọc (User)
 *     tags: [Client Notifications]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID của thông báo
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
 *                 example: 1
 *     responses:
 *       200:
 *         description: Đánh dấu thành công
 *       400:
 *         description: Lỗi cập nhật
 *       401:
 *         description: Thiếu userId
 */
router.patch('/:id/read', readNotification);

export default router;
