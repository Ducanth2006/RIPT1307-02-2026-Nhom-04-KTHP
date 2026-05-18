import { Router } from 'express';
import { getProducts, addProduct, removeProduct, getProductStats, updateProduct } from '../controllers/adminProductController';

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
 *           example: "Pro-Runner X1 Elite"
 *         description:
 *           type: string
 *           example: "Giày chạy bộ chuyên nghiệp, siêu nhẹ"
 *         category_id:
 *           type: integer
 *           description: ID của danh mục (Danh mục con cuối cùng)
 *           example: 5
 *         brand:
 *           type: string
 *           description: Thương hiệu sản phẩm
 *           example: "Nike"
 *         base_price:
 *           type: number
 *           description: Giá cơ bản của sản phẩm
 *           example: 149.99
 *         status:
 *           type: string
 *           enum: [Active, Hidden, Draft]
 *           example: "Active"
 *         variants:
 *           type: array
 *           description: Danh sách các phân loại của sản phẩm. Nếu không có phân loại, truyền mảng 1 phần tử chứa giá/kho/SKU cơ bản.
 *           items:
 *             type: object
 *             properties:
 *               sku:
 *                 type: string
 *                 description: Mã SKU
 *                 example: "PRD-8921"
 *               size:
 *                 type: string
 *                 example: "42"
 *               color:
 *                 type: string
 *                 example: "Đỏ"
 *               price:
 *                 type: number
 *                 description: Giá bán của biến thể
 *                 example: 149.99
 *               cost_price:
 *                 type: number
 *                 description: Giá vốn (Cost per item)
 *                 example: 90.00
 *               stock_quantity:
 *                 type: integer
 *                 description: Số lượng tồn kho
 *                 example: 420
 *         images:
 *           type: array
 *           description: Danh sách link ảnh sản phẩm
 *           items:
 *             type: object
 *             properties:
 *               image_url:
 *                 type: string
 *                 example: "https://example.com/shoes-red.jpg"
 *               is_main:
 *                 type: boolean
 *                 example: true
 */

/**
 * @swagger
 * /admin/products/stats:
 *   get:
 *     summary: Lấy thống kê cho Dashboard Sản phẩm
 *     tags: ["[Admin] Products"]
 *     responses:
 *       200:
 *         description: Trả về 4 thông số (Total Products, Active Listings, Total Stock, Low Stock Alerts)
 *       500:
 *         description: Lỗi hệ thống
 */
router.get('/stats', getProductStats);

/**
 * @swagger
 * /admin/products:
 *   get:
 *     summary: Lấy danh sách toàn bộ sản phẩm
 *     tags: ["[Admin] Products"]
 *     responses:
 *       200:
 *         description: Trả về danh sách sản phẩm siêu chi tiết (đã nối sẵn ảnh chính và tính tổng tồn kho)
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
 *   patch:
 *     summary: Cập nhật thông tin cơ bản của sản phẩm
 *     tags: ["[Admin] Products"]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID của sản phẩm cần cập nhật
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               base_price:
 *                 type: number
 *               status:
 *                 type: string
 *               brand:
 *                 type: string
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *       400:
 *         description: ID không hợp lệ
 *       500:
 *         description: Lỗi hệ thống
 */
router.patch('/:id', updateProduct);

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