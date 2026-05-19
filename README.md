# Sportswear-ecommerce-website
Tôi mới tích hợp tài liệu Swagger vào dự án tại: http://localhost:5000/api/docs/client  (nhớ cài thư viện và npm run dev ms chạy đc nha)
nơi chứa toàn bộ API public của dự án; API admin chưa có chỉ có client thôi.
⚠️ Hiện tại trong git Ignore đang chứa package-lock.json tức là nó ko đc push nên vì vậy KHI PULL VỀ NÊN XÓA BỎ package-lock.json RỒI NPM INSTALL Ở FOLDER CHA CỦA BE VÀ FE 
## ⚠️ thư viện cần cài thêm cài trên thư mục chính luôn cũng được 
Lệnh cài thư viện supabase 
```bash
npm install @supabase/supabase-js
```
Lệnh cài thư viện Swagger
```bash
npm install swagger-ui-express swagger-jsdoc
```

## 🚀 Hướng dẫn Cài đặt & Chạy dự án (Quick Start)

## ⚠️ YÊU CẦU BẮT BUỘC TRƯỚC KHI CÀI ĐẶT

Toàn bộ thành viên **PHẢI** cài đặt **Node.js phiên bản v22.22.2 LTS** (hoặc mới hơn) để tránh xung đột thư viện Vite 8.
Kiểm tra phiên bản bằng lệnh: `node -v`
Chỉ với 3 bước, bạn đã có thể khởi chạy toàn bộ hệ thống:

**Bước 1: Clone code về máy**

**Bước 2: Cài đặt toàn bộ thư viện (Chỉ cần chạy 1 lệnh ở thư mục gốc)**
```bash
npm install
```
(Lệnh này sẽ tự động cài node_modules cho cả root, frontend và backend nhờ tính năng Workspaces).

**Bước 3: Khởi chạy Server**

Do dự án đã cấu hình sẵn file `.env` kết nối Database, giảng viên không cần thao tác tạo mới hay điền key. Chỉ cần chạy lệnh sau tại thư mục gốc:
```bash
npm run dev
```
