import { Router } from 'express';
import { getClientCategories } from '../controllers/clientCategoryController';

const router = Router();

/**
 * @swagger
 * /categories:
 *   get:
 *     summary: Lấy danh sách danh mục (Public)
 *     description: Trả về danh sách tất cả các danh mục thể thao hiện có trong hệ thống.
 *     tags: [Client Categories]
 *     responses:
 *       200:
 *         description: Lấy danh sách danh mục thành công
 *       500:
 *         description: Lỗi hệ thống
 */
router.get('/', getClientCategories);

export default router;
