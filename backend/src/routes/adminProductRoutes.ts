import { Router } from 'express';
import { getProducts, addProduct, editProduct, removeProduct } from '../controllers/adminProductController';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: "[Admin] Products"
 *   description: API Quản lý Sản phẩm (Dành cho Admin)
 */

/**
 * @swagger
 * /admin/products:
 *   get:
 *     summary: Lấy danh sách toàn bộ sản phẩm
 *     tags: ["[Admin] Products"]
 *     responses:
 *       200:
 *         description: Danh sách sản phẩm lấy thành công
 */
router.get('/', getProducts);

/**
 * @swagger
 * /admin/products:
 *   post:
 *     summary: Thêm sản phẩm mới vào Database
 *     tags: ["[Admin] Products"]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - price
 *             properties:
 *               name:
 *                 type: string
 *                 description: Tên sản phẩm (bắt buộc)
 *                 example: "Áo thun thể thao nam ProSports"
 *               price:
 *                 type: number
 *                 description: Giá gốc (bắt buộc, không được âm)
 *                 example: 350000
 *               discount_price:
 *                 type: number
 *                 description: Giá sau khi giảm (phải nhỏ hơn giá gốc)
 *                 example: 299000
 *               description:
 *                 type: string
 *                 description: Mô tả chi tiết sản phẩm
 *                 example: "Chất liệu Dri-FIT, thấm hút tốt"
 *               stock:
 *                 type: integer
 *                 description: Số lượng tồn kho
 *                 example: 150
 *               category_id:
 *                 type: string
 *                 description: ID danh mục sản phẩm
 *                 example: "uuid-category-001"
 *               image_url:
 *                 type: string
 *                 description: Đường dẫn ảnh sản phẩm
 *                 example: "https://example.com/images/ao-the-thao.jpg"
 *               status:
 *                 type: string
 *                 enum: [Active, Hidden]
 *                 description: Trạng thái hiển thị (mặc định là Active)
 *                 example: "Active"
 *     responses:
 *       201:
 *         description: Thêm sản phẩm thành công
 *       400:
 *         description: Dữ liệu không hợp lệ (thiếu tên, giá âm, v.v.)
 */
router.post('/', addProduct);

/**
 * @swagger
 * /admin/products/{id}:
 *   patch:
 *     summary: Cập nhật thông tin một sản phẩm
 *     tags: ["[Admin] Products"]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của sản phẩm cần cập nhật
 *         example: "uuid-product-001"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Áo thun ProSports V2"
 *               price:
 *                 type: number
 *                 example: 380000
 *               discount_price:
 *                 type: number
 *                 example: 320000
 *               stock:
 *                 type: integer
 *                 example: 200
 *               status:
 *                 type: string
 *                 enum: [Active, Hidden]
 *                 example: "Hidden"
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *       400:
 *         description: Dữ liệu không hợp lệ
 *       404:
 *         description: Không tìm thấy sản phẩm
 */
router.patch('/:id', editProduct);

/**
 * @swagger
 * /admin/products/{id}:
 *   delete:
 *     summary: Xóa một sản phẩm khỏi hệ thống
 *     tags: ["[Admin] Products"]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của sản phẩm cần xóa
 *         example: "uuid-product-001"
 *     responses:
 *       200:
 *         description: Xóa sản phẩm thành công
 *       500:
 *         description: Lỗi hệ thống
 */
router.delete('/:id', removeProduct);

export default router;
