import swaggerJSDoc from 'swagger-jsdoc';

const options: swaggerJSDoc.Options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Client API Documentation',
            version: '1.0.0',
            description: 'Tài liệu API dành cho Client (Frontend)',
        },
        servers: [
            {
                url: 'http://localhost:5000/api',
                description: 'Local Server',
            },
        ],
    },
    // Chỉ parse các file route có chữ client
    apis: ['./src/routes/client*.ts'], 
};

export const swaggerSpec = swaggerJSDoc(options);
