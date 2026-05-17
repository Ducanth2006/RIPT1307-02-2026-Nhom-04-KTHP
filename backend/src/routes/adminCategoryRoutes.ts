import { Router } from 'express';
import { getCategories, addCategory, editCategory, removeCategory, getCategoryStats } from '../controllers/adminCategoryController';

const router = Router();

/**
 * @swagger
 * tags:
 *   - name: "[Admin] Categories"
 *     description: API Quản lý Danh mục (Dành cho Admin)
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Category:
 *       type: object
 *       required:
 *         - name
 *       properties:
 *         id:
 *           type: integer
 *           description: ID tự tăng (bigserial)
 *         name:
 *           type: string
 *           description: Tên danh mục
 *         description:
 *           type: string
 *           nullable: true
 *         parent_id:
 *           type: integer
 *           nullable: true
 *         slug:
 *           type: string
 *           description: Đường dẫn đẹp (tự tạo nếu để trống)
 */

/**
 * @swagger
 * /admin/categories/stats:
 *   get:
 *     summary: Lấy 3 chỉ số thống kê đầu trang cho Danh mục
 *     tags: ["[Admin] Categories"]
 *     responses:
 *       200:
 *         description: Trả về số liệu Total Categories, Active Items, Top Performing
 *         content:
 *           application/json:
 *             example:
 *               message: "Lấy thống kê danh mục thành công!"
 *               data:
 *                 total_categories: 20
 *                 active_items: 150
 *                 top_performing: "Giày Thể Thao"
 *       500:
 *         description: Lỗi hệ thống khi tính toán thống kê
 */
router.get('/stats', getCategoryStats);

/**
 * @swagger
 * /admin/categories:
 *   get:
 *     summary: Lấy danh sách toàn bộ danh mục
 *     tags: ["[Admin] Categories"]
 *     responses:
 *       200:
 *         description: Trả về mảng các danh mục
 *       500:
 *         description: Lỗi hệ thống
 */
router.get('/', getCategories);

/**
 * @swagger
 * /admin/categories:
 *   post:
 *     summary: Thêm một danh mục mới
 *     tags: ["[Admin] Categories"]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Category'
 *     responses:
 *       201:
 *         description: Thêm thành công
 *       409:
 *         description: Slug đã tồn tại (trùng tên)
 *       400:
 *         description: Thiếu tên danh mục
 *       500:
 *         description: Lỗi hệ thống
 */
router.post('/', addCategory);

/**
 * @swagger
 * /admin/categories/{id}:
 *   patch:
 *     summary: Cập nhật thông tin danh mục
 *     tags: ["[Admin] Categories"]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID của danh mục cần cập nhật
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Category'
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *       404:
 *         description: Danh mục không tồn tại
 *       409:
 *         description: Slug đã tồn tại
 *       400:
 *         description: ID không hợp lệ
 *       500:
 *         description: Lỗi hệ thống
 */
router.patch('/:id', editCategory);

/**
 * @swagger
 * /admin/categories/{id}:
 *   delete:
 *     summary: Xóa một danh mục
 *     tags: ["[Admin] Categories"]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID của danh mục cần xóa
 *     responses:
 *       200:
 *         description: Xóa thành công
 *       404:
 *         description: Danh mục không tồn tại
 *       400:
 *         description: ID không hợp lệ
 *       500:
 *         description: Lỗi hệ thống
 */
router.delete('/:id', removeCategory);

export default router;