import type { Request, Response } from 'express';
import { fetchAllProducts, createProductWithDetails, deleteProductById, fetchProductStats, updateBasicProduct } from '../services/adminProductService';
import supabaseClient from '../config/supabase';

export const getProductStats = async (req: Request, res: Response) => {
    try {
        const stats = await fetchProductStats();
        res.status(200).json({ message: "Lấy thống kê sản phẩm thành công!", data: stats, errorDetails: null });
    } catch (error: any) {
        res.status(500).json({ message: "Lỗi hệ thống khi tải thống kê.", data: null, errorDetails: error.message });
    }
};

export const getProducts = async (req: Request, res: Response) => {
    try {
        const data = await fetchAllProducts();
        res.status(200).json({ message: "Lấy danh sách sản phẩm thành công!", data, errorDetails: null });
    } catch (error: any) {
        res.status(500).json({ message: "Lỗi hệ thống khi tải sản phẩm.", data: null, errorDetails: error.message });
    }
};

export const addProduct = async (req: Request, res: Response): Promise<any> => {
    try {
        const { name, description, category_id, base_price, status, brand, variants, images } = req.body;

        // ── Validate dữ liệu bắt buộc ──
        if (!name || !String(name).trim()) {
            return res.status(400).json({ message: "Tên sản phẩm là bắt buộc.", data: null, errorDetails: null });
        }
        if (base_price === undefined || base_price === null || base_price === '') {
            return res.status(400).json({ message: "Giá cơ bản (base_price) là bắt buộc.", data: null, errorDetails: null });
        }

        const numericBasePrice = Number(base_price);
        if (isNaN(numericBasePrice) || numericBasePrice <= 0) {
            return res.status(400).json({ message: "Giá cơ bản (base_price) phải là số dương lớn hơn 0.", data: null, errorDetails: null });
        }

        // ── Đóng gói thông tin sản phẩm chính ──
        const productData = {
            name: String(name).trim(),
            description: description ? String(description).trim() : null,
            category_id: category_id ? Number(category_id) : null,
            base_price: numericBasePrice,
            brand: brand ? String(brand).trim() : null,
            status: status || 'Active'
        };

        // ── Chuẩn hóa dữ liệu Biến thể (Variants) ──
        const cleanVariants = Array.isArray(variants) ? variants.map((v: any, index: number) => ({
            sku: v.sku ? String(v.sku).trim() : `AUTO-${Date.now()}-${index}`,
            size: v.size ? String(v.size).trim() : null,
            color: v.color ? String(v.color).trim() : null,
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
        res.status(201).json({ message: "Thêm sản phẩm thành công!", data: result, errorDetails: null });
    } catch (error: any) {
        // Bắt lỗi rollback từ Service
        if (error?.code === 'VARIANT_FAILED' || error?.code === 'IMAGE_FAILED') {
            return res.status(500).json({ message: error.message, data: null, errorDetails: error.details });
        }
        res.status(500).json({ message: "Lỗi hệ thống khi thêm sản phẩm.", data: null, errorDetails: error.message || error });
    }
};

export const updateProduct = async (req: Request, res: Response): Promise<any> => {
    try {
        const id = Number(req.params.id);
        if (isNaN(id)) return res.status(400).json({ message: "ID sản phẩm không hợp lệ.", data: null, errorDetails: null });

        const { name, description, category_id, base_price, status, brand, images } = req.body;

        const updateData: any = {};
        if (name !== undefined) updateData.name = String(name).trim();
        if (description !== undefined) updateData.description = String(description).trim();
        if (category_id !== undefined) updateData.category_id = category_id ? Number(category_id) : null;
        if (base_price !== undefined) {
            const numericPrice = Number(base_price);
            if (!isNaN(numericPrice) && numericPrice > 0) updateData.base_price = numericPrice;
        }
        if (status !== undefined) updateData.status = status;
        if (brand !== undefined) updateData.brand = String(brand).trim();

        const result = await updateBasicProduct(id, updateData);

        // ── Cập nhật hình ảnh nếu được truyền lên ──
        if (images !== undefined) {
            // Xóa ảnh cũ
            await supabaseClient.from('product_images').delete().eq('product_id', id);
            
            // Thêm ảnh mới
            if (Array.isArray(images) && images.length > 0) {
                const imagesToInsert = images.map((img: any) => ({
                    product_id: id,
                    image_url: String(img.image_url || img.url || '').trim(),
                    is_main: Boolean(img.is_main)
                })).filter(img => img.image_url !== '');
                
                if (imagesToInsert.length > 0) {
                    await supabaseClient.from('product_images').insert(imagesToInsert);
                }
            }
        }

        res.status(200).json({ message: "Cập nhật sản phẩm thành công!", data: result, errorDetails: null });
    } catch (error: any) {
        res.status(500).json({ message: "Lỗi hệ thống khi cập nhật sản phẩm.", data: null, errorDetails: error.message || error });
    }
};

export const removeProduct = async (req: Request, res: Response): Promise<any> => {
    try {
        const id = Number(req.params.id);
        if (isNaN(id)) return res.status(400).json({ message: "ID sản phẩm không hợp lệ.", data: null, errorDetails: null });

        await deleteProductById(id);
        res.status(200).json({ message: "Đã xóa sản phẩm thành công!", data: null, errorDetails: null });
    } catch (error: any) {
        if (error?.code === 'NOT_FOUND') return res.status(404).json({ message: "Sản phẩm không tồn tại.", data: null, errorDetails: null });
        res.status(500).json({ message: "Lỗi hệ thống khi xóa sản phẩm.", data: null, errorDetails: error.message || error });
    }
};