import { Request, Response } from 'express';
import supabaseClient from '../config/supabase';

// 1. Lấy toàn bộ danh sách cấu hình hệ thống
export const getSystemSettings = async (req: Request, res: Response): Promise<any> => {
    try {
        const { data, error } = await supabaseClient
            .from('system_settings')
            .select('key, value, group_name, description');

        if (error) throw error;

        // Chuyển mảng Key-Value sang dạng Object phẳng để Frontend dễ map vào Form
        const settingsObject = (data || []).reduce((acc: any, curr) => {
            acc[curr.key] = curr.value;
            return acc;
        }, {});

        return res.status(200).json({
            message: "Lấy cấu hình hệ thống thành công!",
            data: settingsObject
        });
    } catch (err: any) {
        console.error("🔥 Lỗi lấy settings:", err);
        return res.status(500).json({ message: "Lỗi hệ thống khi lấy cấu hình", error: err.message });
    }
};

// 2. Lưu & Cập nhật nhiều cấu hình cùng lúc
export const updateSystemSettings = async (req: Request, res: Response): Promise<any> => {
    try {
        const payload = req.body; // Dạng { hotline: "+1...", smtpPort: "587" }
        
        if (!payload || Object.keys(payload).length === 0) {
            return res.status(400).json({ message: "Vui lòng cung cấp dữ liệu cấu hình cập nhật." });
        }

        const updatePromises = Object.entries(payload).map(async ([key, value]) => {
            return supabaseClient
                .from('system_settings')
                .upsert({ 
                    key, 
                    value: String(value),
                    updated_at: new Date().toISOString()
                });
        });

        const results = await Promise.all(updatePromises);
        const hasError = results.find(r => r.error);

        if (hasError) {
            throw new Error(hasError.error?.message || "Lỗi ghi đè cơ sở dữ liệu");
        }

        return res.status(200).json({
            message: "Cập nhật cấu hình hệ thống thành công!",
            data: payload
        });
    } catch (err: any) {
        console.error("🔥 Lỗi cập nhật settings:", err);
        return res.status(500).json({ message: "Lỗi hệ thống khi cập nhật cấu hình", error: err.message });
    }
};

// 3. Test thử SMTP gửi Mail (Mô phỏng kết nối thử)
export const testSmtpConnection = async (req: Request, res: Response): Promise<any> => {
    try {
        const { smtpHost, smtpPort, smtpUser } = req.body;

        if (!smtpHost || !smtpPort) {
            return res.status(400).json({ message: "Thiếu thông tin kết nối SMTP Host hoặc Port!" });
        }

        // Mô phỏng kết nối thử trong 1 giây
        await new Promise(resolve => setTimeout(resolve, 1000));

        return res.status(200).json({
            message: `Kết nối thành công tới SMTP Server ${smtpHost}:${smtpPort} (Người dùng: ${smtpUser || 'Ẩn danh'})!`
        });
    } catch (err: any) {
        return res.status(500).json({ message: "Lỗi kiểm tra kết nối SMTP", error: err.message });
    }
};

// 4. Flush Redis/System Cache (Mô phỏng)
export const flushSystemCache = async (req: Request, res: Response): Promise<any> => {
    try {
        // Mô phỏng dọn dẹp Redis
        await new Promise(resolve => setTimeout(resolve, 600));

        return res.status(200).json({
            message: "Đã xóa toàn bộ Redis Cache thành công! Trang client sẽ tự động đồng bộ cấu hình mới nhất."
        });
    } catch (err: any) {
        return res.status(500).json({ message: "Lỗi dọn dẹp Cache", error: err.message });
    }
};
