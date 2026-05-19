import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_KEY || '';

if (!supabaseUrl || !supabaseKey) {
    console.error("⚠️ Thiếu biến môi trường SUPABASE_URL hoặc SUPABASE_KEY trong file .env");
}

const supabaseClient = createClient(supabaseUrl, supabaseKey);

export default supabaseClient;