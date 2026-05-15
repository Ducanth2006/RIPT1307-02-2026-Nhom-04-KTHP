import type { Request, Response } from 'express';
import { fetchAllProducts, createProduct, updateProduct, deleteProductById, fetchProductById } from '../services/productService';

// Helper function để parse số an toàn, tránh lỗi NaN hoặc chuỗi rỗng ""
const parseNumberSafe = (value: any): number | null => {
    if (value === undefined || value === null || value === '') return null;
    const num = Number(value);
    return isNaN(num) ? null : num;
};

export const getProducts = async (req: Request, res: Response) => {
    try {
        const data = await fetchAllProducts();
        res.status(200).json({
            message: "Lấy danh sách sản phẩm thành công!",
            data: data
        });
    } catch (error) {
        res.status(500).json({ message: "Lỗi hệ thống khi tải sản phẩm.", errorDetails: error });
    }
};

export const addProduct = async (req: Request, res: Response): Promise<any> => {
    try {
        const { name, price, discount_price, description, stock, category_id, image_url, status } = req.body;

        if (!name || !String(name).trim()) {
            return res.status(400).json({ message: "Tên sản phẩm là bắt buộc." });
        }

        const numericPrice = parseNumberSafe(price);
        if (numericPrice === null) {
            return res.status(400).json({ message: "Giá gốc (price) không hợp lệ hoặc bị thiếu." });
        }

        const numericDiscount = parseNumberSafe(discount_price);
        const numericStock = parseNumberSafe(stock) ?? 0;

        if (numericPrice < 0 || numericStock < 0) {
            return res.status(400).json({ message: "Giá sản phẩm và Số lượng kho không được là số âm." });
        }

        if (numericDiscount !== null && numericDiscount >= numericPrice) {
            return res.status(400).json({ message: "Giá giảm (discount_price) phải nhỏ hơn Giá gốc (price)." });
        }

        const productData = {
            name: String(name).trim(),
            description: description ? String(description).trim() : '',
            price: numericPrice,
            discount_price: numericDiscount,
            stock: numericStock,
            category_id: category_id || null,
            image_url: image_url ? String(image_url).trim() : '',
            status: status || 'Active'
        };

        const result = await createProduct(productData);
        res.status(201).json({ message: "Thêm sản phẩm mới thành công!", data: result });
    } catch (error) {
        res.status(500).json({ message: "Lỗi hệ thống khi thêm sản phẩm.", errorDetails: error });
    }
};

export const editProduct = async (req: Request, res: Response): Promise<any> => {
    try {
        const id = req.params.id as string;
        const updateData: any = {};
        
        // 1. Phải lấy dữ liệu cũ từ DB để so sánh logic chéo (Cross-field Validation)
        let existingProduct;
        try {
            existingProduct = await fetchProductById(id);
        } catch (err) {
            return res.status(404).json({ message: "Không tìm thấy sản phẩm." });
        }

        // 2. Validate Price an toàn
        if (req.body.price !== undefined) {
            const parsedPrice = parseNumberSafe(req.body.price);
            if (parsedPrice === null || parsedPrice < 0) {
                return res.status(400).json({ message: "Giá gốc không hợp lệ hoặc bị âm." });
            }
            updateData.price = parsedPrice;
        }

        // 3. Validate Discount Price an toàn
        if (req.body.discount_price !== undefined) {
            if (req.body.discount_price === null || req.body.discount_price === "") {
                updateData.discount_price = null; // Cho phép xoá giá giảm
            } else {
                const parsedDiscount = parseNumberSafe(req.body.discount_price);
                if (parsedDiscount === null || parsedDiscount < 0) {
                    return res.status(400).json({ message: "Giá giảm không hợp lệ hoặc bị âm." });
                }
                updateData.discount_price = parsedDiscount;
            }
        }

        // 4. Kiểm tra Logic Giá chéo (Sử dụng giá mới hoặc rơi lại giá DB cũ)
        const finalPrice = updateData.price !== undefined ? updateData.price : existingProduct.price;
        const finalDiscount = updateData.discount_price !== undefined ? updateData.discount_price : existingProduct.discount_price;

        if (finalDiscount !== null && finalDiscount >= finalPrice) {
            return res.status(400).json({ message: "Giá giảm phải nhỏ hơn Giá gốc." });
        }

        // 5. Validate Stock an toàn
        if (req.body.stock !== undefined) {
            const parsedStock = parseNumberSafe(req.body.stock);
            if (parsedStock === null || parsedStock < 0) {
                return res.status(400).json({ message: "Kho hàng không hợp lệ hoặc bị âm." });
            }
            updateData.stock = parsedStock;
        }
        
        // 6. Cập nhật các trường Text bình thường
        if (req.body.name !== undefined) updateData.name = String(req.body.name).trim();
        if (req.body.description !== undefined) updateData.description = String(req.body.description).trim();
        if (req.body.category_id !== undefined) updateData.category_id = req.body.category_id || null;
        if (req.body.image_url !== undefined) updateData.image_url = String(req.body.image_url).trim();
        if (req.body.status !== undefined) updateData.status = req.body.status;

        // Bỏ qua update nếu không có trường nào thay đổi
        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({ message: "Không có dữ liệu hợp lệ để cập nhật." });
        }

        const result = await updateProduct(id, updateData);
        res.status(200).json({ message: "Cập nhật sản phẩm thành công!", data: result });
    } catch (error) {
        res.status(500).json({ message: "Lỗi hệ thống khi cập nhật sản phẩm.", errorDetails: error });
    }
};

export const removeProduct = async (req: Request, res: Response) => {
    try {
        const id = req.params.id as string;
        await deleteProductById(id);
        res.status(200).json({ message: "Đã xóa sản phẩm thành công!" });
    } catch (error) {
        res.status(500).json({ message: "Lỗi hệ thống khi xóa sản phẩm.", errorDetails: error });
    }
};