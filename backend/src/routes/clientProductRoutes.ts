import { Router } from 'express';
import { getClientProducts, getClientProductById, getNewArrivals, getHomepageCollections, getBestSellingProducts } from '../controllers/clientProductController';

const router = Router();

/**
 * @swagger
 * /products:
 *   get:
 *     summary: Lấy danh sách sản phẩm (Public)
 *     description: Trả về danh sách sản phẩm dành cho Client, hỗ trợ tìm kiếm, lọc theo brand, danh mục, khoảng giá, sắp xếp và phân trang.
 *     tags: [Client Products]
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Tìm kiếm theo tên sản phẩm
 *       - in: query
 *         name: brand
 *         schema:
 *           type: string
 *         description: Lọc theo tên thương hiệu
 *       - in: query
 *         name: category_id
 *         schema:
 *           type: integer
 *         description: Lọc theo ID danh mục
 *       - in: query
 *         name: min_price
 *         schema:
 *           type: number
 *         description: Giá thấp nhất
 *       - in: query
 *         name: max_price
 *         schema:
 *           type: number
 *         description: Giá cao nhất
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [base_price, created_at, name]
 *         description: Trường cần sắp xếp
 *       - in: query
 *         name: order
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *         description: Thứ tự sắp xếp (asc hoặc desc)
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Số trang hiện tại
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Số lượng sản phẩm trên 1 trang
 *     responses:
 *       200:
 *         description: Lấy danh sách sản phẩm thành công
 *       500:
 *         description: Lỗi hệ thống
 */
router.get('/', getClientProducts);

/**
 * @swagger
 * /products/new-arrivals:
 *   get:
 *     summary: Lấy danh sách sản phẩm mới lên kệ (Public)
 *     description: Trả về danh sách 10 sản phẩm mới nhất đang hoạt động (status = 'Active'), được sắp xếp theo thời gian tạo giảm dần. Mỗi sản phẩm được gắn tag status = 'NEW' để hiển thị nhãn New ở Client.
 *     tags: [Client Products]
 *     responses:
 *       200:
 *         description: Lấy danh sách sản phẩm mới lên kệ thành công
 *       500:
 *         description: Lỗi hệ thống
 */
router.get('/new-arrivals', getNewArrivals);

/**
 * @swagger
 * /products/homepage-collections:
 *   get:
 *     summary: Lấy danh sách các bộ sưu tập nổi bật trang chủ (Public)
 *     description: Trả về danh sách sản phẩm được gom nhóm theo 3 bộ sưu tập (Năng động mỗi ngày, Góc Thu - Đông, Đồ mặc thường nhật) để phục vụ hiển thị ở trang chủ.
 *     tags: [Client Products]
 *     responses:
 *       200:
 *         description: Lấy danh sách bộ sưu tập thành công
 *       500:
 *         description: Lỗi hệ thống
 */
router.get('/homepage-collections', getHomepageCollections);

/**
 * @swagger
 * /products/best-sellers:
 *   get:
 *     summary: Lấy danh sách sản phẩm bán chạy (Public)
 *     description: Trả về danh sách tối đa 10 sản phẩm bán chạy nhất được tính từ bảng chi tiết đơn hàng, hoặc fallback sang các sản phẩm có giá cao nhất nếu chưa có đơn hàng.
 *     tags: [Client Products]
 *     responses:
 *       200:
 *         description: Lấy danh sách sản phẩm bán chạy thành công
 *       500:
 *         description: Lỗi hệ thống
 */
router.get('/best-sellers', getBestSellingProducts);

/**
 * @swagger
 * /products/{id}:
 *   get:
 *     summary: Lấy chi tiết một sản phẩm (Public)
 *     description: Trả về thông tin chi tiết của một sản phẩm bao gồm hình ảnh, danh mục và các biến thể (variants, stock).
 *     tags: [Client Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của sản phẩm
 *     responses:
 *       200:
 *         description: Lấy chi tiết sản phẩm thành công
 *       400:
 *         description: Thiếu ID sản phẩm
 *       404:
 *         description: Không tìm thấy sản phẩm hoặc sản phẩm đã ngừng bán
 *       500:
 *         description: Lỗi hệ thống
 */
router.get('/:id', getClientProductById);

export default router;
