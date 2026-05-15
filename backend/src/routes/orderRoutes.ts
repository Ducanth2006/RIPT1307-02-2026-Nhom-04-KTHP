import { Router } from 'express';
import { getAllOrders, changeOrderStatus } from '../controllers/orderController';

const router = Router();

// Đường link 1: GET /api/admin/orders -> Xem danh sách
router.get('/', getAllOrders);

// Đường link 2: PATCH /api/admin/orders/:id/status -> Đổi trạng thái
router.patch('/:id/status', changeOrderStatus);

export default router;