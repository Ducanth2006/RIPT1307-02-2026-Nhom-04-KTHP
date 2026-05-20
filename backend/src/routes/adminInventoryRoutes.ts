import { Router } from 'express';
import {
    layDanhSachKho,
    layLichSuKho,
    layThongKeKho,
    nhapKho,
    xuatKhoThuCong
} from '../controllers/adminInventoryController';

const router = Router();

/**
 * @swagger
 * tags:
 *   - name: "[Admin] Inventory"
 *     description: API quản lý kho hàng dành cho Admin
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     AdminInventoryStats:
 *       type: object
 *       properties:
 *         tongGiaTriKho:
 *           type: number
 *           example: 185000000
 *         soLuongSapHet:
 *           type: integer
 *           example: 6
 *     AdminInventoryItem:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           example: 12
 *         product_id:
 *           type: integer
 *           example: 4
 *         sku:
 *           type: string
 *           example: "TSHIRT-BLACK-L"
 *         size:
 *           type: string
 *           nullable: true
 *           example: "L"
 *         color:
 *           type: string
 *           nullable: true
 *           example: "Đen"
 *         price:
 *           type: number
 *           example: 299000
 *         stock_quantity:
 *           type: integer
 *           example: 3
 *         cost_price:
 *           type: number
 *           example: 180000
 *         product_name:
 *           type: string
 *           nullable: true
 *           example: "Áo thun thể thao Pro Run"
 *         main_image:
 *           type: string
 *           nullable: true
 *           example: "https://example.com/images/product-main.jpg"
 *     AdminInventoryImportPayload:
 *       type: object
 *       required:
 *         - variant_id
 *         - quantity
 *         - cost_price
 *       properties:
 *         variant_id:
 *           type: integer
 *           example: 12
 *         quantity:
 *           type: integer
 *           example: 50
 *         cost_price:
 *           type: number
 *           example: 175000
 *     AdminInventoryLog:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           example: 101
 *         variant_id:
 *           type: integer
 *           example: 12
 *         action_type:
 *           type: string
 *           enum: [IMPORT, EXPORT_SELL, EXPORT_DELETE]
 *           example: "IMPORT"
 *         quantity:
 *           type: integer
 *           example: 50
 *         cost_price:
 *           type: number
 *           example: 175000
 *         reference_id:
 *           type: integer
 *           nullable: true
 *           example: null
 *         created_at:
 *           type: string
 *           format: date-time
 *     AdminInventoryExportPayload:
 *       type: object
 *       required:
 *         - variant_id
 *         - quantity
 *       properties:
 *         variant_id:
 *           type: integer
 *           example: 12
 *         quantity:
 *           type: integer
 *           example: 3
 */

/**
 * @swagger
 * /admin/inventory/stats:
 *   get:
 *     summary: Lấy thống kê tổng quan kho hàng
 *     tags: ["[Admin] Inventory"]
 *     responses:
 *       200:
 *         description: Lấy thống kê kho hàng thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Lấy thống kê kho hàng thành công"
 *                 data:
 *                   $ref: '#/components/schemas/AdminInventoryStats'
 *                 errorDetails:
 *                   nullable: true
 *       500:
 *         description: Lỗi hệ thống
 */
router.get('/stats', layThongKeKho);

/**
 * @swagger
 * /admin/inventory:
 *   get:
 *     summary: Lấy danh sách tồn kho của các biến thể sản phẩm
 *     tags: ["[Admin] Inventory"]
 *     responses:
 *       200:
 *         description: Lấy danh sách kho hàng thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Lấy danh sách kho hàng thành công"
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/AdminInventoryItem'
 *                 errorDetails:
 *                   nullable: true
 *       500:
 *         description: Lỗi hệ thống
 */
router.get('/', layDanhSachKho);

/**
 * @swagger
 * /admin/inventory/import:
 *   post:
 *     summary: Nhập kho cho một biến thể sản phẩm và ghi lịch sử kho
 *     tags: ["[Admin] Inventory"]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AdminInventoryImportPayload'
 *     responses:
 *       200:
 *         description: Nhập kho thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Nhập kho thành công"
 *                 data:
 *                   type: object
 *                 errorDetails:
 *                   nullable: true
 *       400:
 *         description: Dữ liệu nhập kho không hợp lệ
 *       404:
 *         description: Không tìm thấy biến thể sản phẩm
 *       500:
 *         description: Lỗi hệ thống hoặc lỗi rollback
 */
router.post('/import', nhapKho);

/**
 * @swagger
 * /admin/inventory/export:
 *   post:
 *     summary: Xuất kho thủ công cho biến thể sản phẩm do hủy hàng hoặc hao hụt
 *     tags: ["[Admin] Inventory"]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AdminInventoryExportPayload'
 *     responses:
 *       200:
 *         description: Xuất kho thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Xuất kho thành công"
 *                 data:
 *                   type: object
 *                 errorDetails:
 *                   nullable: true
 *       400:
 *         description: Dữ liệu xuất kho không hợp lệ hoặc số lượng xuất vượt quá tồn kho
 *       404:
 *         description: Không tìm thấy biến thể sản phẩm
 *       500:
 *         description: Lỗi hệ thống hoặc lỗi rollback
 */
router.post('/export', xuatKhoThuCong);

/**
 * @swagger
 * /admin/inventory/{variantId}/logs:
 *   get:
 *     summary: Lấy lịch sử nhập xuất kho theo biến thể sản phẩm
 *     tags: ["[Admin] Inventory"]
 *     parameters:
 *       - in: path
 *         name: variantId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID của biến thể sản phẩm
 *     responses:
 *       200:
 *         description: Lấy lịch sử kho thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Lấy lịch sử kho thành công"
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/AdminInventoryLog'
 *                 errorDetails:
 *                   nullable: true
 *       400:
 *         description: ID biến thể không hợp lệ
 *       404:
 *         description: Không tìm thấy biến thể sản phẩm
 *       500:
 *         description: Lỗi hệ thống
 */
router.get('/:variantId/logs', layLichSuKho);

export default router;
