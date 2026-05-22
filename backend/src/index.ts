import express from 'express';
import type { Request, Response } from 'express';
import cors from 'cors';
import supabaseClient from './config/supabase';
import swaggerUi from 'swagger-ui-express';
import { clientSwaggerSpec, adminSwaggerSpec } from './config/swagger';

// ── Admin Routes (Quản trị) ────────────────────────────────────
import adminProductRoutes from './routes/adminProductRoutes';
import adminOrderRoutes from './routes/adminOrderRoutes';
import adminCustomerRoutes from './routes/adminCustomerRoutes';
import adminVoucherRoutes from './routes/adminVoucherRoutes';
import adminDashboardRoutes from './routes/adminDashboardRoutes';
import adminCategoryRoutes from './routes/adminCategoryRoutes';
import adminInventoryRoutes from './routes/adminInventoryRoutes';

// ── Client Routes (Khách mua hàng) ────────────────────────────
import clientProductRoutes from './routes/clientProductRoutes';
import clientCategoryRoutes from './routes/clientCategoryRoutes';
import clientCartRoutes from './routes/clientCartRoutes';
import clientAddressRoutes from './routes/clientAddressRoutes';
import clientProfileRoutes from './routes/clientProfileRoutes';
import clientReviewRoutes from './routes/clientReviewRoutes';
import clientComplaintRoutes from './routes/clientComplaintRoutes';
import clientNotificationRoutes from './routes/clientNotificationRoutes';
import clientAuthRoutes from './routes/clientAuthRoutes';
import clientVoucherRoutes from './routes/clientVoucherRoutes';

const app = express();
const port = process.env.PORT || 5001;

// =============================================================
// 🌐 CORS - Cho phép Frontend gọi API từ domain khác
// =============================================================
app.use(cors({
    origin: [
        'http://localhost:5173',  // Vite dev server (Frontend)
        'http://localhost:3000',  // Fallback nếu dùng CRA
        'https://clothingstore-backend-oa20.onrender.com'// deploy render
    ],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
}));

app.use(express.json());

// =============================================================
// 📚 SWAGGER DOCS - 2 trang tài liệu API riêng biệt
// =============================================================
// Trang Swagger dành cho Khách mua hàng: http://localhost:5000/api/docs/client
app.use('/api/docs/client', swaggerUi.serveFiles(clientSwaggerSpec), swaggerUi.setup(clientSwaggerSpec));

// Trang Swagger dành cho Quản trị viên: http://localhost:5000/api/docs/admin
app.use('/api/docs/admin', swaggerUi.serveFiles(adminSwaggerSpec), swaggerUi.setup(adminSwaggerSpec));

// =============================================================
// 🔍 TEST KẾT NỐI DATABASE
// =============================================================
app.get('/api/test-db', async (req: Request, res: Response) => {
    const { data: orderData, error: fetchError } = await supabaseClient
        .from('orders')
        .select('*')
        .limit(1);

    if (fetchError) {
        return res.status(500).json({
            message: "Lỗi kết nối Supabase",
            errorDetails: fetchError
        });
    }

    res.status(200).json({
        message: "Kết nối Database Supabase thành công rực rỡ!",
        data: orderData
    });
});

// =============================================================
// ⚙️ ADMIN APIs - Dành cho giao diện Quản trị
// =============================================================
app.use('/api/admin/products', adminProductRoutes);
app.use('/api/admin/orders', adminOrderRoutes);
app.use('/api/admin/customers', adminCustomerRoutes);
app.use('/api/admin/vouchers', adminVoucherRoutes);
app.use('/api/admin/dashboard', adminDashboardRoutes);
app.use('/api/admin/categories', adminCategoryRoutes);
app.use('/api/admin/inventory', adminInventoryRoutes);

// =============================================================
// 🛍️ CLIENT APIs - Dành cho giao diện Khách mua hàng
// =============================================================
import clientOrderRoutes from './routes/clientOrderRoutes';

app.use('/api/products', clientProductRoutes);
app.use('/api/categories', clientCategoryRoutes);
app.use('/api/cart', clientCartRoutes);
app.use('/api/orders', clientOrderRoutes);
app.use('/api/addresses', clientAddressRoutes);
app.use('/api/profile', clientProfileRoutes);
app.use('/api/reviews', clientReviewRoutes);
app.use('/api/complaints', clientComplaintRoutes);
app.use('/api/notifications', clientNotificationRoutes);
app.use('/api/auth', clientAuthRoutes);
app.use('/api/vouchers', clientVoucherRoutes);

// =============================================================
// ❌ XỬ LÝ LỖI TẬP TRUNG
// =============================================================
// Middleware xử lý lỗi 404 (Route không tồn tại)
app.use((req: Request, res: Response) => {
    res.status(404).json({ message: "Đường dẫn không tồn tại (404 Not Found)" });
});

// Middleware xử lý lỗi 500 (Lỗi hệ thống)
app.use((err: any, req: Request, res: Response, next: express.NextFunction) => {
    console.error("🔥 Lỗi hệ thống:", err);
    res.status(500).json({ message: "Lỗi hệ thống (Internal Server Error)", error: err.message });
});

app.listen(port, () => {
    console.log(`✅ Server đang chạy tại: http://localhost:${port}`);
    console.log(`📚 Swagger Admin:  http://localhost:${port}/api/docs/admin`);
    console.log(`📚 Swagger Client: http://localhost:${port}/api/docs/client`);
});
