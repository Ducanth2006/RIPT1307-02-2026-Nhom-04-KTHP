import { Router } from 'express';
import { postReview, getReviewsByProduct, getMyReviews } from '../controllers/clientReviewController';

const router = Router();

/**
 * @swagger
 * /reviews:
 *   post:
 *     summary: Tạo đánh giá sản phẩm (User)
 *     description: |
 *       Gửi đánh giá cho sản phẩm sau khi nhận hàng.
 *       Điều kiện:
 *       - Đơn hàng phải ở trạng thái **Completed**
 *       - Sản phẩm phải nằm trong đơn hàng đó
 *       - Mỗi sản phẩm chỉ được đánh giá 1 lần trên 1 đơn hàng
 *     tags: [Client Reviews]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - productId
 *               - orderId
 *               - rating
 *             properties:
 *               userId:
 *                 type: integer
 *                 example: 1
 *               productId:
 *                 type: integer
 *                 example: 5
 *               orderId:
 *                 type: integer
 *                 example: 12
 *               rating:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *                 example: 5
 *               comment:
 *                 type: string
 *                 example: "Sản phẩm tốt, đúng như mô tả!"
 *     responses:
 *       201:
 *         description: Đánh giá thành công
 *       400:
 *         description: Lỗi dữ liệu hoặc điều kiện không thỏa mãn
 *       401:
 *         description: Thiếu userId
 */
router.post('/', postReview);

/**
 * @swagger
 * /reviews/my:
 *   get:
 *     summary: Lấy lịch sử đánh giá của user hiện tại
 *     tags: [Client Reviews]
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
 */
router.get('/my', getMyReviews);

/**
 * @swagger
 * /reviews/product/{productId}:
 *   get:
 *     summary: Lấy tất cả đánh giá của một sản phẩm (Public)
 *     description: Trả về danh sách đánh giá có phân trang, bao gồm thông tin người đánh giá.
 *     tags: [Client Reviews]
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID của sản phẩm
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Thành công
 *       400:
 *         description: ID sản phẩm không hợp lệ
 *       500:
 *         description: Lỗi hệ thống
 */
router.get('/product/:productId', getReviewsByProduct);

export default router;
