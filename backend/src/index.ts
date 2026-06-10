import express from 'express';
import type { Request, Response } from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { initSocket } from './config/socket';
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
import adminUserRoutes from './routes/adminUserRoutes';
import adminComplaintRoutes from './routes/adminComplaintRoutes';
import adminSettingRoutes from './routes/adminSettingRoutes';
import adminReportRoutes from './routes/adminReportRoutes';
import adminChatRoutes from './routes/adminChatRoutes';

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
import clientOrderRoutes from './routes/clientOrderRoutes';
import clientChatRoutes from './routes/clientChatRoutes';
import clientChatbotRoutes from './routes/clientChatbotRoutes';

const app = express();
const PORT = Number(process.env.PORT) || 5001;

// =============================================================
// 🌐 CORS - Cho phép Frontend gọi API từ domain khác
// =============================================================
const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:3000',
    'https://clothingstore-backend-oa20.onrender.com',
    'https://ript-1307-02-2026-nhom-04-kthp-fron.vercel.app'
];

app.use(cors({
    origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        const isAllowed = allowedOrigins.includes(origin) || 
                          origin.endsWith('.vercel.app');
        if (isAllowed) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

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
    try {
        const results = [];

        results.push("=== HEALING INVENTORY_LOGS SEQUENCE ===");
        const { data: maxLogs } = await supabaseClient
            .from('inventory_logs')
            .select('id')
            .order('id', { ascending: false })
            .limit(1);
        const maxLogId = maxLogs?.[0]?.id || 0;
        results.push(`Max InventoryLog ID in DB: ${maxLogId}`);

        for (let i = 1; i <= 100; i++) {
            const { data, error } = await supabaseClient
                .from('inventory_logs')
                .insert([{
                    variant_id: 22, // Use existing variant id
                    action_type: 'IMPORT',
                    quantity: 0,
                    cost_price: 0
                }])
                .select();

            if (error) {
                results.push(`Attempt ${i}: Failed with: "${error.message}"`);
            } else {
                const insertedId = data?.[0]?.id;
                results.push(`Attempt ${i}: Succeeded! Inserted ID: ${insertedId}`);
                await supabaseClient.from('inventory_logs').delete().eq('id', insertedId);

                if (insertedId > maxLogId) {
                    results.push(`Successfully advanced inventory_logs sequence past max ID (${insertedId} > ${maxLogId})`);
                    break;
                }
            }
        }

        res.status(200).json({
            message: "Inventory Logs Sequence healing completed!",
            results
        });
    } catch (err: any) {
        res.status(500).json({
            message: "Error during sequence healing",
            error: err.message,
            stack: err.stack
        });
    }
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
app.use('/api/admin/users', adminUserRoutes);
app.use('/api/admin/complaints', adminComplaintRoutes);
app.use('/api/admin/settings', adminSettingRoutes);
app.use('/api/admin/reports', adminReportRoutes);
app.use('/api/admin/chat', adminChatRoutes);

// =============================================================
// 🛍️ CLIENT APIs - Dành cho giao diện Khách mua hàng
// =============================================================


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
app.use('/api/chat', clientChatRoutes);
app.use('/api/chatbot', clientChatbotRoutes);

// =============================================================
// 🏥 HEALTH CHECK & ROOT PATH
// =============================================================
app.get('/', (req: Request, res: Response) => {
    res.status(200).send("SportStride API Server is running");
});

app.get('/healthz', (req: Request, res: Response) => {
    res.status(200).send("OK");
});

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

const server = createServer(app);
initSocket(server);

server.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Server đang chạy tại cổng: ${PORT}`);
    console.log(`📚 Swagger Admin:  http://localhost:${PORT}/api/docs/admin`);
    console.log(`📚 Swagger Client: http://localhost:${PORT}/api/docs/client`);
});
