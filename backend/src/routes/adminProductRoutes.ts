import { Router } from 'express';
import { getProducts, addProduct, removeProduct } from '../controllers/adminProductController';

const router = Router();

/**
 * @swagger
 * tags:
 *   - name: "[Admin] Products"
 *     description: API Quản lý Sản phẩm đa phân loại (Dành cho Admin)
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     ProductPayload:
 *       type: object
 *       required:
 *         - name
 *         - base_price
 *       properties:
 *         name:
 *           type: string
 *           description: Tên sản phẩm chung
 *           example: "Giày Chạy Bộ Nike Air Pegasus"
 *         description:
 *           type: string
 *           example: "Giày chạy bộ chuyên nghiệp, siêu nhẹ"
 *         category_id:
 *           type: integer
 *           description: ID của danh mục (Từ bảng Categories)
 *           example: 5
 *         base_price:
 *           type: number
 *           description: Giá cơ bản của sản phẩm
 *           example: 2500000
 *         status:
 *           type: string
 *           enum: [Active, Hidden]
 *           example: "Active"
 *         variants:
 *           type: array
 *           description: Danh sách các phân loại (size, màu) của sản phẩm
 *           items:
 *             type: object
 *             properties:
 *               sku:
 *                 type: string
 *                 description: Mã SKU (tự tạo nếu để trống)
 *                 example: "NK-PEG-42-RED"
 *               size:
 *                 type: string
 *                 example: "42"
 *               color:
 *                 type: string
 *                 example: "Đỏ"
 *               price:
 *                 type: number
 *                 description: Giá biến thể (mặc định lấy base_price nếu để trống)
 *                 example: 2500000
 *               stock_quantity:
 *                 type: integer
 *                 example: 50
 *         images:
 *           type: array
 *           description: Danh sách link ảnh sản phẩm
 *           items:
 *             type: object
 *             properties:
 *               image_url:
 *                 type: string
 *                 example: "https://example.com/nike-red.jpg"
 *               is_main:
 *                 type: boolean
 *                 example: true
 */

/**
 * @swagger
 * /admin/products:
 *   get:
 *     summary: Lấy danh sách toàn bộ sản phẩm (kèm biến thể, hình ảnh và danh mục)
 *     tags: ["[Admin] Products"]
 *     responses:
 *       200:
 *         description: Trả về danh sách sản phẩm siêu chi tiết
 *       500:
 *         description: Lỗi hệ thống
 */
router.get('/', getProducts);

/**
 * @swagger
 * /admin/products:
 *   post:
 *     summary: Thêm mới một sản phẩm tích hợp (Lưu cùng lúc 3 bảng — có Rollback)
 *     tags: ["[Admin] Products"]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ProductPayload'
 *     responses:
 *       201:
 *         description: Thêm thành công (sản phẩm + biến thể + hình ảnh)
 *       400:
 *         description: Thiếu dữ liệu bắt buộc hoặc sai định dạng
 *       500:
 *         description: Lỗi hệ thống hoặc Rollback do thêm biến thể/ảnh thất bại
 */
router.post('/', addProduct);

/**
 * @swagger
 * /admin/products/{id}:
 *   delete:
 *     summary: Xóa một sản phẩm (CASCADE xóa luôn biến thể và ảnh)
 *     tags: ["[Admin] Products"]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID của sản phẩm cần xóa
 *     responses:
 *       200:
 *         description: Xóa thành công
 *       404:
 *         description: Sản phẩm không tồn tại
 *       400:
 *         description: ID không hợp lệ
 *       500:
 *         description: Lỗi hệ thống
 */
router.delete('/:id', removeProduct);

export default router;