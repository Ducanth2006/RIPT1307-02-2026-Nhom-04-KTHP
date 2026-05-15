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

// 4. Xóa danh mục
export const deleteCategoryById = async (id: number) => {
    // Kiểm tra tồn tại trước khi xóa
    const { data: existing } = await supabaseClient
        .from('categories')
        .select('id')
        .eq('id', id)
        .single();

    if (!existing) throw { code: 'NOT_FOUND' };

    const { error } = await supabaseClient
        .from('categories')
        .delete()
        .eq('id', id);

    if (error) throw error;
    return { success: true };
};