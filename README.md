# Sportswear-ecommerce-website

## 🚀 Hướng dẫn Cài đặt & Chạy dự án (Quick Start)

## ⚠️ YÊU CẦU BẮT BUỘC TRƯỚC KHI CÀI ĐẶT

Toàn bộ thành viên **PHẢI** cài đặt **Node.js phiên bản v22.22.2 LTS** (hoặc mới hơn) để tránh xung đột thư viện Vite 8.
Kiểm tra phiên bản bằng lệnh: `node -v`
Chỉ với 3 bước, bạn đã có thể khởi chạy toàn bộ hệ thống:

**Bước 1: Clone code về máy**

Bước 2: Cài đặt toàn bộ thư viện (Chỉ cần chạy 1 lệnh ở thư mục gốc)
npm install
(Lệnh này sẽ tự động cài node_modules cho cả root, frontend và backend nhờ tính năng Workspaces).

**Bước 3: Cấu hình biến môi trường (Database) và Chạy Server**

Bạn cần thiết lập file `.env` trước khi khởi chạy Backend. Có thể làm theo 1 trong 2 cách sau:
- **Cách 1:** Vào thư mục `backend/`, copy file `.env.example` và đổi tên thành `.env`. File này đã chứa sẵn key kết nối Database.
- **Cách 2:** Tạo file `.env` trong thư mục `backend/` và dán thủ công đoạn code sau vào:
  ```env
  SUPABASE_URL=https://roijqlkzkwezvkfckunm.supabase.co
  SUPABASE_KEY=sb_publishable__WsOnwu4Uj9uW1aGIWMaxQ_DCGjvnAL
  ```

Sau khi có file `.env`, bạn có thể khởi chạy server bằng lệnh:
```bash
npm run dev
```
