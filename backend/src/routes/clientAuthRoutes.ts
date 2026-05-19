import { Router } from 'express';
import { register, login, logout } from '../controllers/authController';

const router = Router();

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Đăng ký tài khoản khách hàng mới bằng Email
 *     description: Đăng ký tài khoản mới cho Client. Mật khẩu tối thiểu 6 ký tự. Trả về thông tin tài khoản và JWT token để sử dụng.
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 example: "client@example.com"
 *               password:
 *                 type: string
 *                 example: "password123"
 *               full_name:
 *                 type: string
 *                 example: "Nguyen Van A"
 *     responses:
 *       201:
 *         description: Đăng ký tài khoản thành công
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
 *                 token:
 *                   type: string
 *       400:
 *         description: Email đã tồn tại hoặc dữ liệu không hợp lệ
 */
router.post('/register', register);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Đăng nhập bằng tài khoản truyền thống và nhận JWT
 *     description: Đăng nhập với email và mật khẩu. Trả về thông tin tài khoản (nếu hoạt động) và JWT token dùng để xác thực các request sau.
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 example: "client@example.com"
 *               password:
 *                 type: string
 *                 example: "password123"
 *     responses:
 *       200:
 *         description: Đăng nhập thành công
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
 *                 token:
 *                   type: string
 *       400:
 *         description: Thông tin đăng nhập sai hoặc tài khoản bị khóa
 */
router.post('/login', login);

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: Đăng xuất (Vô hiệu hóa Token)
 *     description: Đăng xuất khỏi hệ thống và đưa token JWT hiện tại vào blacklist để ngăn chặn sử dụng lại.
 *     tags: [Auth]
 *     parameters:
 *       - in: header
 *         name: Authorization
 *         required: true
 *         schema:
 *           type: string
 *           example: "Bearer <token>"
 *         description: JWT Token dạng Bearer
 *     responses:
 *       200:
 *         description: Đăng xuất thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Đăng xuất thành công."
 *       401:
 *         description: Không tìm thấy Token hoặc định dạng Token không hợp lệ
 */
router.post('/logout', logout);

export default router;

