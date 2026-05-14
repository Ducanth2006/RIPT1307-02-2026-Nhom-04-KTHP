import type { Request, Response } from 'express';
import { fetchClientProducts, fetchClientProductById } from '../services/clientProductService';

export const getClientProducts = async (req: Request, res: Response) => {
    try {
        const {
            search,
            brand,
            category_id,
            min_price,
            max_price,
            sortBy,
            order,
            page,
            limit
        } = req.query;

        const filters: any = {
            order: order === 'asc' ? 'asc' : 'desc',
            page: page ? Number(page) : 1,
            limit: limit ? Number(limit) : 10
        };

        if (search) filters.search = String(search);
        if (brand) filters.brand = String(brand);
        if (category_id) filters.category_id = Number(category_id);
        if (min_price) filters.min_price = Number(min_price);
        if (max_price) filters.max_price = Number(max_price);
        if (sortBy) filters.sortBy = String(sortBy);

        const result = await fetchClientProducts(filters);

        res.status(200).json({
            message: "Lấy danh sách sản phẩm thành công",
            data: result.products,
            pagination: result.pagination
        });
    } catch (error: any) {
        console.error("Lỗi getClientProducts:", error);
        res.status(500).json({
            message: "Lỗi hệ thống khi tải sản phẩm",
            errorDetails: error.message || error
        });
    }
};

export const getClientProductById = async (req: Request, res: Response): Promise<any> => {
    try {
        const id = req.params.id as string;
        
        if (!id) {
            return res.status(400).json({ message: "Thiếu ID sản phẩm." });
        }

        const product = await fetchClientProductById(id);

        if (!product) {
            return res.status(404).json({ message: "Không tìm thấy sản phẩm hoặc sản phẩm đã ngừng bán." });
        }

        res.status(200).json({
            message: "Lấy chi tiết sản phẩm thành công",
            data: product
        });
    } catch (error: any) {
        console.error("Lỗi getClientProductById:", error);
        res.status(500).json({
            message: "Lỗi hệ thống khi tải chi tiết sản phẩm",
            errorDetails: error.message || error
        });
    }
};
