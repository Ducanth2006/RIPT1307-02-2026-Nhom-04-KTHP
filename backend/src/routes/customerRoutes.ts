import { Router } from 'express';
import { getAllCustomers, changeCustomerStatus } from '../controllers/customerController';

const router = Router();

// GET /api/admin/customers -> Xem danh sách
router.get('/', getAllCustomers);

// PATCH /api/admin/customers/:id/status -> Khóa/Mở khóa
router.patch('/:id/status', changeCustomerStatus);

export default router;