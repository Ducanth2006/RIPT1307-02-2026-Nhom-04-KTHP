import type { Request, Response } from 'express';
import { fetchClientProducts, fetchClientProductById, fetchNewArrivals, fetchHomepageCollections, fetchLowStockProducts } from '../services/clientProductService';

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

export const getNewArrivals = async (req: Request, res: Response) => {
    try {
        const products = await fetchNewArrivals();

        res.status(200).json({
            message: "Lấy danh sách sản phẩm mới lên kệ thành công",
            data: products
        });
    } catch (error: any) {
        console.error("Lỗi getNewArrivals:", error);
        res.status(500).json({
            message: "Lỗi hệ thống khi tải sản phẩm mới lên kệ",
            errorDetails: error.message || error
        });
    }
};

export const getHomepageCollections = async (req: Request, res: Response) => {
    try {
        const collections = await fetchHomepageCollections();

        res.status(200).json({
            message: "Lấy danh sách bộ sưu tập trang chủ thành công",
            data: collections
        });
    } catch (error: any) {
        console.error("Lỗi getHomepageCollections:", error);
        res.status(500).json({
            message: "Lỗi hệ thống khi tải bộ sưu tập trang chủ",
            errorDetails: error.message || error
        });
    }
};

export const getLowStockProducts = async (req: Request, res: Response) => {
    try {
        const products = await fetchLowStockProducts();

        res.status(200).json({
            message: "Lấy danh sách sản phẩm sắp hết hàng thành công",
            data: products
        });
    } catch (error: any) {
        console.error("Lỗi getLowStockProducts:", error);
        res.status(500).json({
            message: "Lỗi hệ thống khi tải sản phẩm sắp hết hàng",
            errorDetails: error.message || error
        });
    }
};
