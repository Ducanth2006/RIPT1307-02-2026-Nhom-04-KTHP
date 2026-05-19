import { Router } from 'express';
import { getInventory, updateStock } from '../controllers/adminInventoryController';

const router = Router();

/**
 * @swagger
 * tags:
 *   - name: "[Admin] Inventory"
 *     description: API Quản lý Kho hàng (Cập nhật số lượng Biến thể Sản phẩm)
 */

/**
 * @swagger
 * /admin/inventory:
 *   get:
 *     summary: Lấy danh sách toàn bộ tồn kho của các biến thể sản phẩm
 *     tags: ["[Admin] Inventory"]
 *     responses:
 *       200:
 *         description: Trả về danh sách kho hàng (Ưu tiên sắp hết hàng lên đầu)
 */
router.get('/', getInventory);

/**
 * @swagger
 * /admin/inventory/{id}:
 *   patch:
 *     summary: Cập nhật số lượng tồn kho (Nhập/Xuất kho)
 *     tags: ["[Admin] Inventory"]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID của biến thể (product_variants ID)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - stock_quantity
 *             properties:
 *               stock_quantity:
 *                 type: integer
 *                 description: Số lượng kho mới cập nhật
 *                 example: 150
 *     responses:
 *       200:
 *         description: Cập nhật kho thành công
 *       400:
 *         description: Số lượng kho không hợp lệ (bị âm hoặc sai định dạng)
 *       404:
 *         description: Không tìm thấy biến thể sản phẩm
 */
router.patch('/:id', updateStock);

export default router;