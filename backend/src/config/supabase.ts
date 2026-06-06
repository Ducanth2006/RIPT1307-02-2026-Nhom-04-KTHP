import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_KEY || '';

if (!supabaseUrl || !supabaseKey) {
    console.error("\n❌ [ERROR] THIẾU CẤU HÌNH BIẾN MÔI TRƯỜNG KẾT NỐI DATABASE!");
    console.error("👉 SUPABASE_URL hoặc SUPABASE_KEY chưa được định nghĩa trong biến môi trường.");
    console.error("👉 Cách sửa: Truy cập trang quản trị dự án của bạn trên Render -> Settings -> Environment Variables và thêm:");
    console.error("   - SUPABASE_URL: URL dự án Supabase của bạn");
    console.error("   - SUPABASE_KEY: Khóa Service Key hoặc Anon Key của Supabase\n");
    process.exit(1);
}

const supabaseClient = createClient(supabaseUrl, supabaseKey);

export default supabaseClient;