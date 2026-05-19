import { Router } from 'express';
import { getAddresses, addAddress, editAddress, removeAddress, makeDefault } from '../controllers/clientAddressController';

const router = Router();

/**
 * @swagger
 * /addresses:
 *   get:
 *     summary: Lấy danh sách địa chỉ giao hàng của user
 *     description: Trả về tất cả địa chỉ đã lưu của người dùng, địa chỉ mặc định được ưu tiên hiển thị đầu tiên.
 *     tags: [Client Addresses]
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
 *       401:
 *         description: Thiếu userId
 *       500:
 *         description: Lỗi hệ thống
 *
 *   post:
 *     summary: Thêm địa chỉ giao hàng mới
 *     tags: [Client Addresses]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - recipient_name
 *               - phone
 *               - address_line
 *               - city
 *             properties:
 *               userId:
 *                 type: integer
 *                 example: 1
 *               recipient_name:
 *                 type: string
 *                 example: "Nguyen Van A"
 *               phone:
 *                 type: string
 *                 example: "0901234567"
 *               address_line:
 *                 type: string
 *                 example: "123 Đường Lê Lợi, Phường Bến Nghé"
 *               city:
 *                 type: string
 *                 example: "TP. Hồ Chí Minh"
 *               is_default:
 *                 type: boolean
 *                 example: false
 *     responses:
 *       201:
 *         description: Thêm địa chỉ thành công
 *       400:
 *         description: Thiếu thông tin bắt buộc
 *       401:
 *         description: Thiếu userId
 */
router.route('/')
    .get(getAddresses)
    .post(addAddress);

/**
 * @swagger
 * /addresses/{id}:
 *   put:
 *     summary: Cập nhật địa chỉ giao hàng
 *     tags: [Client Addresses]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID của địa chỉ
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
 *               recipient_name:
 *                 type: string
 *               phone:
 *                 type: string
 *               address_line:
 *                 type: string
 *               city:
 *                 type: string
 *               is_default:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *       400:
 *         description: Địa chỉ không tồn tại hoặc không có quyền
 *       401:
 *         description: Thiếu userId
 *
 *   delete:
 *     summary: Xóa địa chỉ giao hàng
 *     tags: [Client Addresses]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID của địa chỉ
 *       - in: query
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Xóa thành công
 *       400:
 *         description: Địa chỉ không tồn tại hoặc không có quyền
 *       401:
 *         description: Thiếu userId
 */
router.route('/:id')
    .put(editAddress)
    .delete(removeAddress);

/**
 * @swagger
 * /addresses/{id}/default:
 *   patch:
 *     summary: Đặt làm địa chỉ giao hàng mặc định
 *     tags: [Client Addresses]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID của địa chỉ
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
 *         description: Đặt mặc định thành công
 *       400:
 *         description: Địa chỉ không tồn tại hoặc không có quyền
 *       401:
 *         description: Thiếu userId
 */
router.patch('/:id/default', makeDefault);

export default router;
