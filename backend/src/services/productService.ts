import supabaseClient from '../config/supabase';

// Lấy danh sách sản phẩm đầy đủ các trường
export const fetchAllProducts = async () => {
    const { data: products, error } = await supabaseClient
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) throw error;
    return products;
};

// Thêm sản phẩm mới với đầy đủ thông tin mô tả và giá giảm
export const createProduct = async (productData: any) => {
    const { data, error } = await supabaseClient
        .from('products')
        .insert([productData])
        .select()
        .single();

    if (error) throw error;
    return data;
};

// Cập nhật thông tin chi tiết sản phẩm
export const updateProduct = async (id: string, updateData: any) => {
    const { data, error } = await supabaseClient
        .from('products')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

    if (error) throw error;
    return data;
};

// Xóa sản phẩm khỏi hệ thống
export const deleteProductById = async (id: string) => {
    const { error } = await supabaseClient
        .from('products')
        .delete()
        .eq('id', id);

    if (error) throw error;
    return { success: true };
};

// Lấy thông tin 1 sản phẩm theo ID (Dùng cho Validation)
export const fetchProductById = async (id: string) => {
    const { data, error } = await supabaseClient
        .from('products')
        .select('*')
        .eq('id', id)
        .single();

    if (error) throw error;
    return data;
};