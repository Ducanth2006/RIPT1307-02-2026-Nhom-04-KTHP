import type { Request, Response } from 'express';
import { fetchClientCategories } from '../services/clientCategoryService';

export const getClientCategories = async (req: Request, res: Response) => {
    try {
        const categories = await fetchClientCategories();
        res.status(200).json({
            message: "Lấy danh sách danh mục thành công",
            data: categories
        });
    } catch (error: any) {
        console.error("Lỗi getClientCategories:", error);
        res.status(500).json({
            message: "Lỗi hệ thống khi tải danh mục",
            errorDetails: error.message || error
        });
    }
};
