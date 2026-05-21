import swaggerJSDoc from 'swagger-jsdoc';

// =============================================================
// CẤU HÌNH 1: Swagger dành cho CLIENT (Khách mua hàng)
// Truy cập tại: http://localhost:5000/api/docs/client
// =============================================================
const clientOptions: swaggerJSDoc.Options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: '🛍️ Client API - ProSports',
            version: '1.0.0',
            description: 'Tài liệu API dành cho giao diện Khách mua hàng (Frontend Store)',
        },
        servers: [
            {
                url: 'https://clothingstore-backend-oa20.onrender.com/api',
                description: 'Production Server (Render)',
            },
            {
                url: 'http://localhost:5001/api',
                description: 'Local Development Server',
            },
        ],
    },
    // Chỉ quét các file route bắt đầu bằng chữ "client"
    apis: ['./src/routes/client*.ts'],
};

export const clientSwaggerSpec = swaggerJSDoc(clientOptions);

// =============================================================
// CẤU HÌNH 2: Swagger dành cho ADMIN (Quản trị viên)
// Truy cập tại: http://localhost:5000/api/docs/admin
// =============================================================
const adminOptions: swaggerJSDoc.Options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: '⚙️ Admin API - ProSports',
            version: '1.0.0',
            description: 'Tài liệu API dành cho giao diện Quản trị (Admin Console) — Bao gồm: Products, Orders, Customers, Vouchers, Dashboard',
        },
        servers: [
            {
                url: 'https://clothingstore-backend-oa20.onrender.com/api',
                description: 'Production Server (Render)',
            },
            {
                url: 'http://localhost:5001/api',
                description: 'Local Development Server',
            },
        ],
    },
    // Chỉ quét các file route bắt đầu bằng chữ "admin"
    apis: ['./src/routes/admin*.ts'],
};

export const adminSwaggerSpec = swaggerJSDoc(adminOptions);
