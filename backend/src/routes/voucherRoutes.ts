import { Router } from 'express';
import { getAllVouchers, createNewVoucher } from '../controllers/voucherController';

const router = Router();

// GET /api/admin/vouchers -> Xem danh sách mã
router.get('/', getAllVouchers);

// POST /api/admin/vouchers -> Tạo mã mới (Dùng POST để gửi dữ liệu tạo mới)
router.post('/', createNewVoucher);

export default router;