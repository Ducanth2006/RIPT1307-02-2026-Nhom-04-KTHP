import supabaseClient from '../config/supabase';

// 1. Lấy danh sách toàn bộ danh mục
export const fetchAllCategories = async () => {
    const { data: categories, error } = await supabaseClient
        .from('categories')
        .select('*')
        .order('id', { ascending: true }); // Sắp xếp theo ID

    if (error) throw error;
    return categories;
};

// 2. Thêm danh mục mới
export const createCategory = async (categoryData: any) => {
    const { data, error } = await supabaseClient
        .from('categories')
        .insert([categoryData])
        .select()
        .single();

    if (error) throw error;
    return data;
};

// 3. Cập nhật danh mục (Dùng ID kiểu number)
export const updateCategory = async (id: number, updateData: any) => {
    const { data, error } = await supabaseClient
        .from('categories')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

    if (error) throw error;
    return data;
};

// SỬA HÀM SỐ 4: Kiểm tra khóa ngoại trước khi xóa
export const deleteCategoryById = async (id: number) => {
    const { data: existing } = await supabaseClient.from('categories').select('id').eq('id', id).single();
    if (!existing) throw { code: 'NOT_FOUND' };

    // BỔ SUNG: Kiểm tra xem danh mục có đang chứa sản phẩm không
    const { data: checkProducts } = await supabaseClient.from('products').select('id').eq('category_id', id).limit(1);
    if (checkProducts && checkProducts.length > 0) {
        throw { code: 'CATEGORY_IN_USE', message: 'Không thể xóa danh mục đang có sản phẩm. Hãy chuyển sản phẩm sang danh mục khác trước.' };
    }

    const { error } = await supabaseClient.from('categories').delete().eq('id', id);
    if (error) throw error;
    return { success: true };
};

export const fetchCategoryStats = async () => {
    // 1. Lấy danh mục
    const { data: categories, error: catError } = await supabaseClient
        .from('categories')
        .select('id, name');
    if (catError) throw catError;

    // 2. Lấy sản phẩm để tính Active và Top Performing
    const { data: products, error: prodError } = await supabaseClient
        .from('products')
        .select('category_id, status');
    if (prodError) throw prodError;

    // Tính Active Items
    const activeItems = products.filter(p => p.status === 'Active').length;

    // Tính Top Performing
    const categoryCounts: Record<number, number> = {};
    products.forEach(p => {
        if (p.category_id) {
            categoryCounts[p.category_id] = (categoryCounts[p.category_id] || 0) + 1;
        }
    });

    let topCategoryId = null;
    let maxCount = -1;
    for (const [catId, count] of Object.entries(categoryCounts)) {
        if (count > maxCount) {
            maxCount = count;
            topCategoryId = Number(catId);
        }
    }
    const topPerforming = categories.find(c => c.id === topCategoryId)?.name || "Chưa có dữ liệu";

    // Trả về đúng 3 thông số
    return {
        total_categories: categories.length,
        active_items: activeItems,
        top_performing: topPerforming
    };
};