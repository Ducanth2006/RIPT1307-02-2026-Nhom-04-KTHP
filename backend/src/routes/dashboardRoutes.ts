import { Router } from 'express';
import { getDashboardStats } from '../controllers/dashboardController';

const router = Router();

// Đường link: GET /api/admin/dashboard/stats
router.get('/stats', getDashboardStats);

export default router;