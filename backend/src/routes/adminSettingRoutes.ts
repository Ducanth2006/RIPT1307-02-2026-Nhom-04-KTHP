import { Router } from 'express';
import { 
    getSystemSettings, 
    updateSystemSettings, 
    testSmtpConnection, 
    flushSystemCache 
} from '../controllers/adminSettingController';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: "[Admin] Settings"
 *   description: API Quản lý cấu hình toàn hệ thống (Dành cho Admin)
 */

/**
 * @swagger
 * /admin/settings:
 *   get:
 *     summary: Lấy toàn bộ cấu hình hệ thống hiện tại
 *     tags: ["[Admin] Settings"]
 *     description: Trả về một object phẳng chứa toàn bộ Key-Value cấu hình hệ thống
 *     responses:
 *       200:
 *         description: Lấy cấu hình thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Lấy cấu hình hệ thống thành công!"
 *                 data:
 *                   type: object
 *                   properties:
 *                     hotline:
 *                       type: string
 *                       example: "+1 (800) 555-0199"
 *                     supportEmail:
 *                       type: string
 *                       example: "support@prosportserp.com"
 *                     defaultShippingFee:
 *                       type: string
 *                       example: "15.00"
 *                     freeShippingThreshold:
 *                       type: string
 *                       example: "100.00"
 *       500:
 *         description: Lỗi hệ thống
 * 
 *   put:
 *     summary: Cập nhật hoặc thêm mới cấu hình hệ thống
 *     tags: ["[Admin] Settings"]
 *     description: Cho phép lưu cùng lúc nhiều cặp key-value cấu hình (upsert)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               hotline:
 *                 type: string
 *                 example: "+1 (800) 555-0199"
 *               supportEmail:
 *                 type: string
 *                 example: "support@prosportserp.com"
 *               defaultShippingFee:
 *                 type: string
 *                 example: "15.00"
 *               freeShippingThreshold:
 *                 type: string
 *                 example: "100.00"
 *     responses:
 *       200:
 *         description: Cập nhật cấu hình thành công
 *       400:
 *         description: Dữ liệu đầu vào không hợp lệ
 *       500:
 *         description: Lỗi hệ thống
 */
router.get('/', getSystemSettings);
router.put('/', updateSystemSettings);

/**
 * @swagger
 * /admin/settings/test-smtp:
 *   post:
 *     summary: Kiểm tra kết nối hòm thư SMTP
 *     tags: ["[Admin] Settings"]
 *     description: Gửi request chứa cấu hình SMTP để mô phỏng kết nối thử nghiệm
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - smtpHost
 *               - smtpPort
 *             properties:
 *               smtpHost:
 *                 type: string
 *                 example: "smtp.sendgrid.net"
 *               smtpPort:
 *                 type: number
 *                 example: 587
 *               smtpUser:
 *                 type: string
 *                 example: "apikey"
 *               smtpPassword:
 *                 type: string
 *                 example: "SG.example_key"
 *     responses:
 *       200:
 *         description: Kết nối thử thành công
 *       400:
 *         description: Thiếu tham số kết nối bắt buộc
 *       500:
 *         description: Lỗi hệ thống
 */
router.post('/test-smtp', testSmtpConnection);

/**
 * @swagger
 * /admin/settings/clear-cache:
 *   post:
 *     summary: Giải phóng bộ nhớ đệm Cache (Flush Cache)
 *     tags: ["[Admin] Settings"]
 *     description: Xóa sạch dữ liệu cache để hệ thống tải mới cấu hình từ Database
 *     responses:
 *       200:
 *         description: Flush cache thành công
 *       500:
 *         description: Lỗi hệ thống
 */
router.post('/clear-cache', flushSystemCache);

export default router;
