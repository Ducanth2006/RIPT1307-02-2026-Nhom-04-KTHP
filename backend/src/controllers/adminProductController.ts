import type { Request, Response } from 'express';
import { fetchAllProducts, createProductWithDetails, deleteProductById } from '../services/adminProductService';

export const getProducts = async (req: Request, res: Response) => {
    try {
        const data = await fetchAllProducts();
        res.status(200).json({ message: "Lấy danh sách sản phẩm thành công!", data });
    } catch (error) {
        res.status(500).json({ message: "Lỗi hệ thống khi tải sản phẩm.", errorDetails: error });
    }
};

export const addProduct = async (req: Request, res: Response): Promise<any> => {
    try {
        const { name, description, category_id, base_price, status, variants, images } = req.body;

        // ── Validate dữ liệu bắt buộc ──
        if (!name || !String(name).trim()) {
            return res.status(400).json({ message: "Tên sản phẩm là bắt buộc." });
        }
        if (base_price === undefined || base_price === null || base_price === '') {
            return res.status(400).json({ message: "Giá cơ bản (base_price) là bắt buộc." });
        }

        const numericBasePrice = Number(base_price);
        // Fix BUG #3: isNaN bắt trường hợp "abc" → NaN
        if (isNaN(numericBasePrice) || numericBasePrice <= 0) {
            return res.status(400).json({ message: "Giá cơ bản (base_price) phải là số dương lớn hơn 0." });
        }

        // ── Đóng gói thông tin sản phẩm chính ──
        const productData = {
            name: String(name).trim(),
            description: description ? String(description).trim() : null,
            category_id: category_id ? Number(category_id) : null,
            base_price: numericBasePrice,
            status: status || 'Active'
        };

        // ── Chuẩn hóa dữ liệu Biến thể (Variants) ──
        const cleanVariants = Array.isArray(variants) ? variants.map((v: any, index: number) => ({
            // Fix BUG #5: Thêm index vào SKU tự tạo để tránh trùng
            sku: v.sku ? String(v.sku).trim() : `AUTO-${Date.now()}-${index}`,
            size: v.size ? String(v.size).trim() : null,
            color: v.color ? String(v.color).trim() : null,
            // Fix BUG #4: Dùng ?? (nullish coalescing) thay vì || để giá 0 không bị fallback
            price: (v.price !== undefined && v.price !== null) ? Number(v.price) : numericBasePrice,
            cost_price: (v.cost_price !== undefined && v.cost_price !== null) ? Number(v.cost_price) : 0,
            stock_quantity: Number(v.stock_quantity ?? 0)
        })) : [];

        // ── Chuẩn hóa dữ liệu Hình ảnh ──
        const cleanImages = Array.isArray(images) ? images.map((img: any) => ({
            image_url: String(img.image_url).trim(),
            is_main: Boolean(img.is_main)
        })) : [];

        const result = await createProductWithDetails(productData, cleanVariants, cleanImages);
        res.status(201).json({ message: "Thêm sản phẩm tích hợp thành công!", data: result });
    } catch (error: any) {
        // Bắt lỗi rollback từ Service
        if (error?.code === 'VARIANT_FAILED' || error?.code === 'IMAGE_FAILED') {
            return res.status(500).json({ message: error.message, errorDetails: error.details });
        }
        res.status(500).json({ message: "Lỗi hệ thống khi thêm sản phẩm.", errorDetails: error });
    }
};

export const removeProduct = async (req: Request, res: Response): Promise<any> => {
    try {
        const id = Number(req.params.id);
        if (isNaN(id)) return res.status(400).json({ message: "ID sản phẩm không hợp lệ." });

        await deleteProductById(id);
        res.status(200).json({ message: "Đã xóa sản phẩm và toàn bộ biến thể, hình ảnh thành công!" });
    } catch (error: any) {
        if (error?.code === 'NOT_FOUND') return res.status(404).json({ message: "Sản phẩm không tồn tại." });
        res.status(500).json({ message: "Lỗi hệ thống khi xóa sản phẩm.", errorDetails: error });
    }
};