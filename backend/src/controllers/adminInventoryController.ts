import type { Request, Response } from 'express';
import { fetchAllInventory, updateVariantStock } from '../services/adminInventoryService';

export const getInventory = async (req: Request, res: Response) => {
    try {
        const data = await fetchAllInventory();
        res.status(200).json({ message: "Lấy dữ liệu kho hàng thành công!", data });
    } catch (error) {
        res.status(500).json({ message: "Lỗi hệ thống khi tải kho hàng.", errorDetails: error });
    }
};

export const updateStock = async (req: Request, res: Response): Promise<any> => {
    try {
        const id = Number(req.params.id); // ID của product_variants
        if (isNaN(id)) return res.status(400).json({ message: "ID biến thể không hợp lệ." });

        const { stock_quantity } = req.body;

        if (stock_quantity === undefined || stock_quantity === null || stock_quantity === "") {
            return res.status(400).json({ message: "Vui lòng cung cấp số lượng kho (stock_quantity)." });
        }

        const numericStock = Number(stock_quantity);
        // Chặn cả số âm và giá trị NaN (ví dụ gửi lên "abc")
        if (isNaN(numericStock) || numericStock < 0) {
            return res.status(400).json({ message: "Số lượng tồn kho phải là số hợp lệ và không được là số âm." });
        }

        const result = await updateVariantStock(id, numericStock);
        res.status(200).json({ message: "Cập nhật số lượng kho thành công!", data: result });
    } catch (error: any) {
        // Mã lỗi PGRST116 của Supabase tương ứng với không tìm thấy dữ liệu khi dùng .single()
        if (error.code === 'PGRST116') {
            return res.status(404).json({ message: "Không tìm thấy biến thể sản phẩm này." });
        }
        res.status(500).json({ message: "Lỗi hệ thống khi cập nhật kho hàng.", errorDetails: error });
    }
};