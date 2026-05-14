import express from 'express';
import type { Request, Response } from 'express';
import supabaseClient from './config/supabase';
import orderRoutes from './routes/orderRoutes';
import voucherRoutes from './routes/voucherRoutes';
import customerRoutes from './routes/customerRoutes';
import dashboardRoutes from './routes/dashboardRoutes';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './config/swagger';
import productRoutes from './routes/productRoutes';
import clientProductRoutes from './routes/clientProductRoutes';
import clientCategoryRoutes from './routes/clientCategoryRoutes';

const app = express();
const port = 5000;

app.use(express.json());

// Swagger Docs (Chỉ hiển thị API Client)
app.use('/api/docs/client', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.get('/api/test-db', async (req: Request, res: Response) => {
    // Sử dụng tiếng Anh camelCase cho biến nhận về
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
// 2. Kích hoạt toàn bộ API Đơn hàng chạy trên đường dẫn /api/admin/orders
app.use('/api/admin/orders', orderRoutes);
app.use('/api/admin/vouchers', voucherRoutes);
app.use('/api/admin/customers', customerRoutes);
app.use('/api/admin/dashboard', dashboardRoutes);
app.use('/api/admin/products', productRoutes);

// Client APIs
app.use('/api/products', clientProductRoutes);
app.use('/api/categories', clientCategoryRoutes);

// Middleware xử lý lỗi 404 (Route không tồn tại)
app.use((req: Request, res: Response) => {
    res.status(404).json({ message: "Đường dẫn không tồn tại (404 Not Found)" });
});

// Middleware xử lý lỗi tập trung (500 Internal Server Error)
app.use((err: any, req: Request, res: Response, next: express.NextFunction) => {
    console.error("🔥 Lỗi hệ thống:", err);
    res.status(500).json({ message: "Lỗi hệ thống (Internal Server Error)", error: err.message });
});

app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});