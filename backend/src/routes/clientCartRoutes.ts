import { Router } from 'express';
import { 
    applyVoucher,
    getCart,
    addToCart,
    updateCartItem,
    removeFromCart
} from '../controllers/clientCartController';

const router = Router();

/**
 * @swagger
 * /cart:
 *   get:
 *     summary: Lấy danh sách sản phẩm trong giỏ hàng (Public)
 *     description: Lấy chi tiết các sản phẩm đang có trong giỏ hàng của user dựa vào userId.
 *     tags: [Client Cart]
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
 *     summary: Thêm sản phẩm vào giỏ hàng (Public)
 *     description: Thêm một biến thể sản phẩm (variant) vào giỏ hàng của user. Nếu đã có, hệ thống sẽ cộng dồn số lượng.
 *     tags: [Client Cart]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - variantId
 *               - quantity
 *             properties:
 *               userId:
 *                 type: integer
 *               variantId:
 *                 type: integer
 *               quantity:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Thêm thành công
 *       400:
 *         description: Lỗi dữ liệu hoặc hết hàng
 *       500:
 *         description: Lỗi hệ thống
 */
router.route('/')
    .get(getCart)
    .post(addToCart);

/**
 * @swagger
 * /cart/{itemId}:
 *   put:
 *     summary: Cập nhật số lượng sản phẩm trong giỏ (Public)
 *     tags: [Client Cart]
 *     parameters:
 *       - in: path
 *         name: itemId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID của dòng trong giỏ hàng (cart_items.id)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - quantity
 *             properties:
 *               quantity:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *       400:
 *         description: Lỗi dữ liệu
 *       500:
 *         description: Lỗi hệ thống
 * 
 *   delete:
 *     summary: Xóa sản phẩm khỏi giỏ hàng (Public)
 *     tags: [Client Cart]
 *     parameters:
 *       - in: path
 *         name: itemId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID của dòng trong giỏ hàng (cart_items.id)
 *     responses:
 *       200:
 *         description: Xóa thành công
 *       400:
 *         description: Lỗi dữ liệu
 *       500:
 *         description: Lỗi hệ thống
 */
router.route('/:itemId')
    .put(updateCartItem)
    .delete(removeFromCart);

/**
 * @swagger
 * /cart/apply-voucher:
 *   post:
 *     summary: Áp dụng voucher (Public)
 *     description: Gửi mã voucher để kiểm tra hợp lệ, trả về số tiền được giảm và tổng tiền sau khi giảm.
 *     tags: [Client Cart]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - code
 *               - cartTotal
 *             properties:
 *               code:
 *                 type: string
 *                 description: Mã voucher
 *                 example: "SUMMER20"
 *               cartTotal:
 *                 type: number
 *                 description: Tổng giá trị đơn hàng hiện tại
 *                 example: 500000
 *     responses:
 *       200:
 *         description: Áp dụng voucher thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Áp dụng voucher thành công."
 *                 data:
 *                   type: object
 *                   properties:
 *                     voucherInfo:
 *                       type: object
 *                       description: Dữ liệu chi tiết của voucher từ database
 *                     discountAmount:
 *                       type: number
 *                       description: Số tiền được giảm
 *                       example: 50000
 *                     finalAmount:
 *                       type: number
 *                       description: Tổng tiền sau khi đã trừ đi số tiền giảm
 *                       example: 450000
 *       400:
 *         description: Voucher không hợp lệ hoặc lỗi dữ liệu đầu vào
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Voucher không còn hoạt động."
 *       500:
 *         description: Lỗi hệ thống
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Lỗi hệ thống (Internal Server Error)"
 *     security: []
 */
router.post('/apply-voucher', applyVoucher);

export default router;
