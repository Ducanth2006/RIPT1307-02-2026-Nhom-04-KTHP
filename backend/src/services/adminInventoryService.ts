import supabaseClient from '../config/supabase';

// Lấy danh sách tồn kho (kéo tên và trạng thái từ bảng products)
export const fetchAllInventory = async () => {
    const { data, error } = await supabaseClient
        .from('product_variants')
        .select(`
            *,
            products ( name, status )
        `)
        .order('stock_quantity', { ascending: true }); // Ưu tiên hiện hàng sắp hết lên đầu

    if (error) throw error;
    return data;
};

// Cập nhật số lượng kho cho 1 biến thể (size/màu) cụ thể
export const updateVariantStock = async (id: number, stock_quantity: number) => {
    const { data, error } = await supabaseClient
        .from('product_variants')
        .update({ stock_quantity })
        .eq('id', id)
        .select()
        .single();

    if (error) throw error;
    return data;
};