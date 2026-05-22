# TODO - Module Quản lý Đơn Hàng (Admin Orders)

- [x] Bước 1: Cập nhật `backend/src/routes/adminOrderRoutes.ts` để có 4 route: `/stats`, `/`, `/:id`, `/:id/status` và thêm Swagger JSDoc đầy đủ.

- [x] Bước 2: Cập nhật `backend/src/controllers/adminOrderController.ts` để chuẩn hóa response `{ message, data, errorDetails }` và triển khai 4 handler tương ứng.

- [x] Bước 3: Cập nhật `backend/src/services/adminOrderService.ts` để implement JOIN + logic nghiệp vụ PATCH status (trừ/hoàn kho + inventory_logs) theo yêu cầu.

- [ ] Bước 4: Chạy build/typecheck để đảm bảo compile.
- [ ] Bước 5: Test nhanh các endpoint qua Swagger.

