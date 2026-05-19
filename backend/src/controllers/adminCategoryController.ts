import type { Request, Response } from 'express';
import { fetchAllCategories, createCategory, updateCategory, deleteCategoryById, fetchCategoryStats } from '../services/adminCategoryService';
// Hàm tự động tạo slug (Ví dụ: "Áo Nam" -> "ao-nam")
const generateSlug = (text: string) => {
    return text.toString().toLowerCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // Bỏ dấu tiếng Việt
        .replace(/\s+/g, '-')           // Thay khoảng trắng bằng gạch ngang
        .replace(/[^\w\-]+/g, '')       // Xóa ký tự đặc biệt
        .replace(/\-\-+/g, '-')         // Xóa gạch ngang thừa
        .replace(/^-+/, '').replace(/-+$/, '');
};

export const getCategories = async (req: Request, res: Response) => {
    try {
        const data = await fetchAllCategories();
        res.status(200).json({ message: "Lấy danh mục thành công!", data });
    } catch (error) {
        res.status(500).json({ message: "Lỗi hệ thống.", errorDetails: error });
    }
};

export const addCategory = async (req: Request, res: Response): Promise<any> => {
    try {
        const { name, description, parent_id, slug } = req.body;

        if (!name) return res.status(400).json({ message: "Tên danh mục là bắt buộc." });

        const categoryData = {
            name: String(name).trim(),
            description: description ? String(description).trim() : null,
            parent_id: parent_id ? Number(parent_id) : null,
            slug: slug ? String(slug).trim() : generateSlug(name), // Tự tạo slug nếu rỗng
            status: req.body.status ? String(req.body.status).trim() : 'Active' // Hỗ trợ lưu trạng thái
        };

        const result = await createCategory(categoryData);
        res.status(201).json({ message: "Thêm danh mục thành công!", data: result });
    } catch (error: any) {
        // Bắt lỗi trùng slug từ Supabase (Mã lỗi 23505) — 409 Conflict đúng chuẩn HTTP
        if (error?.code === '23505') {
            return res.status(409).json({ message: "Slug (đường dẫn) đã tồn tại. Hãy đổi tên hoặc truyền slug khác.", errorDetails: error });
        }
        res.status(500).json({ message: "Lỗi khi thêm danh mục.", errorDetails: error });
    }
};

export const editCategory = async (req: Request, res: Response): Promise<any> => {
    try {
        const id = Number(req.params.id); // Ép kiểu ID sang SỐ
        if (isNaN(id)) return res.status(400).json({ message: "ID không hợp lệ." });

        const updateData = { ...req.body };
        if (updateData.parent_id !== undefined) updateData.parent_id = updateData.parent_id ? Number(updateData.parent_id) : null;
        if (updateData.name && !updateData.slug) updateData.slug = generateSlug(updateData.name);

        const result = await updateCategory(id, updateData);
        res.status(200).json({ message: "Cập nhật thành công!", data: result });
    } catch (error: any) {
        if (error?.code === '23505') return res.status(409).json({ message: "Slug đã tồn tại!", errorDetails: error });
        if (error?.code === 'PGRST116') return res.status(404).json({ message: "Danh mục không tồn tại.", errorDetails: error });
        res.status(500).json({ message: "Lỗi khi cập nhật danh mục.", errorDetails: error });
    }
};

export const removeCategory = async (req: Request, res: Response): Promise<any> => {
    try {
        const id = Number(req.params.id);
        if (isNaN(id)) return res.status(400).json({ message: "ID không hợp lệ." });

        await deleteCategoryById(id);
        res.status(200).json({ message: "Xóa danh mục thành công!" });
    } catch (error: any) {
        if (error?.code === 'NOT_FOUND') return res.status(404).json({ message: "Danh mục không tồn tại.", errorDetails: error });
        if (error?.code === 'CATEGORY_IN_USE') return res.status(400).json({ message: error.message, errorDetails: error });
        res.status(500).json({ message: "Lỗi khi xóa danh mục.", errorDetails: error });
    }
};
export const getCategoryStats = async (req: Request, res: Response) => {
    try {
        const stats = await fetchCategoryStats();
        res.status(200).json({ message: "Lấy thống kê danh mục thành công!", data: stats });
    } catch (error) {
        res.status(500).json({ message: "Lỗi hệ thống khi tính toán thống kê.", errorDetails: error });
    }
};