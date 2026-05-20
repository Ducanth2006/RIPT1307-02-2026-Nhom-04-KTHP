import { Router } from 'express';
import { getMyProfile, updateMyProfile, changeMyPassword } from '../controllers/clientProfileController';

const router = Router();

/**
 * @swagger
 * /profile:
 *   get:
 *     summary: Lấy thông tin tài khoản cá nhân
 *     description: Trả về thông tin profile của user (không bao gồm mật khẩu).
 *     tags: [Client Profile]
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
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     email:
 *                       type: string
 *                     full_name:
 *                       type: string
 *                     avatar:
 *                       type: string
 *                     role:
 *                       type: string
 *                     status:
 *                       type: string
 *                     created_at:
 *                       type: string
 *       401:
 *         description: Thiếu userId
 *       404:
 *         description: Không tìm thấy người dùng
 *
 *   put:
 *     summary: Cập nhật thông tin tài khoản
 *     description: Cho phép user cập nhật full_name và avatar.
 *     tags: [Client Profile]
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
 *               full_name:
 *                 type: string
 *                 example: "Nguyen Van B"
 *               avatar:
 *                 type: string
 *                 example: "https://example.com/avatar.jpg"
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *       400:
 *         description: Lỗi dữ liệu
 *       401:
 *         description: Thiếu userId
 */
router.route('/')
    .get(getMyProfile)
    .put(updateMyProfile);

/**
 * @swagger
 * /profile/change-password:
 *   patch:
 *     summary: Đổi mật khẩu
 *     description: User tự đổi mật khẩu bằng cách cung cấp mật khẩu cũ và mật khẩu mới (tối thiểu 6 ký tự).
 *     tags: [Client Profile]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - currentPassword
 *               - newPassword
 *             properties:
 *               userId:
 *                 type: integer
 *                 example: 1
 *               currentPassword:
 *                 type: string
 *                 example: "oldpassword123"
 *               newPassword:
 *                 type: string
 *                 example: "newpassword456"
 *     responses:
 *       200:
 *         description: Đổi mật khẩu thành công
 *       400:
 *         description: Mật khẩu hiện tại không đúng hoặc dữ liệu không hợp lệ
 *       401:
 *         description: Thiếu userId
 */
router.patch('/change-password', changeMyPassword);

export default router;
