import { Router } from 'express';
import {
    getAllUsers,
    createUser,
    updateUser,
    toggleLock,
    revokeTokens,
    deleteUser
} from '../controllers/adminUserController';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: "[Admin] Users"
 *   description: API Quản lý tài khoản & phân quyền người dùng (Dành cho Admin)
 */

/**
 * @swagger
 * /admin/users:
 *   get:
 *     summary: Lấy danh sách toàn bộ người dùng hệ thống
 *     tags: ["[Admin] Users"]
 *     responses:
 *       200:
 *         description: Danh sách người dùng lấy thành công
 *       500:
 *         description: Lỗi hệ thống
 */
router.get('/', getAllUsers);

/**
 * @swagger
 * /admin/users:
 *   post:
 *     summary: Tạo tài khoản người dùng mới (Admin/Staff/Client)
 *     tags: ["[Admin] Users"]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - role
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Nguyễn Văn Admin"
 *               email:
 *                 type: string
 *                 example: "nvadmin@prosports.com"
 *               role:
 *                 type: string
 *                 enum: [Admin, Staff, Customer]
 *                 example: "Staff"
 *               password:
 *                 type: string
 *                 description: Mật khẩu (nếu để trống sẽ tự động lấy '12345678')
 *                 example: "12345678"
 *     responses:
 *       201:
 *         description: Đã tạo tài khoản mới thành công
 *       400:
 *         description: Thiếu dữ liệu hoặc email đã tồn tại
 *       500:
 *         description: Lỗi hệ thống
 */
router.post('/', createUser);

/**
 * @swagger
 * /admin/users/{id}:
 *   put:
 *     summary: Cập nhật thông tin cơ bản của một người dùng
 *     tags: ["[Admin] Users"]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của người dùng cần cập nhật
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - role
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Trần Thị Nhân Viên"
 *               email:
 *                 type: string
 *                 example: "ttnhanvien@prosports.com"
 *               role:
 *                 type: string
 *                 enum: [Admin, Staff, Customer]
 *                 example: "Staff"
 *     responses:
 *       200:
 *         description: Cập nhật thông tin thành công
 *       400:
 *         description: Thiếu dữ liệu đầu vào
 *       500:
 *         description: Lỗi hệ thống
 */
router.put('/:id', updateUser);

/**
 * @swagger
 * /admin/users/{id}/status:
 *   patch:
 *     summary: Khóa hoặc mở khóa một tài khoản người dùng
 *     tags: ["[Admin] Users"]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của người dùng cần thay đổi trạng thái
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - isLocked
 *             properties:
 *               isLocked:
 *                 type: boolean
 *                 description: "true = Khóa tài khoản | false = Kích hoạt tài khoản"
 *                 example: true
 *     responses:
 *       200:
 *         description: Cập nhật trạng thái thành công
 *       400:
 *         description: Dữ liệu truyền lên không hợp lệ
 *       500:
 *         description: Lỗi hệ thống
 */
router.patch('/:id/status', toggleLock);

/**
 * @swagger
 * /admin/users/{id}/revoke:
 *   post:
 *     summary: Thu hồi phiên đăng nhập JWT (Blacklist) ép buộc đăng xuất
 *     tags: ["[Admin] Users"]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của người dùng cần thu hồi phiên đăng nhập
 *     responses:
 *       200:
 *         description: Đã thu hồi toàn bộ token đăng nhập thành công
 *       500:
 *         description: Lỗi hệ thống
 */
router.post('/:id/revoke', revokeTokens);

/**
 * @swagger
 * /admin/users/{id}:
 *   delete:
 *     summary: Xóa tài khoản người dùng (Soft Delete)
 *     tags: ["[Admin] Users"]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của người dùng cần xóa
 *     responses:
 *       200:
 *         description: Xóa tài khoản thành công
 *       400:
 *         description: Thiếu dữ liệu
 *       500:
 *         description: Lỗi hệ thống
 */
router.delete('/:id', deleteUser);

export default router;
