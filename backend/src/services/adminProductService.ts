import supabaseClient from '../config/supabase';

// 1. Lấy danh sách sản phẩm (kèm theo Danh mục, Biến thể và Hình ảnh)
export const fetchAllProducts = async () => {
    const { data, error } = await supabaseClient
        .from('products')
        .select(`
            *,
            categories ( name, slug ),
            product_variants (*),
            product_images (*)
        `)
        .order('id', { ascending: false });

    if (error) throw error;
    return data;
};

// 2. Thêm mới Sản phẩm tích hợp (Lưu vào 3 bảng) — Có Rollback
export const createProductWithDetails = async (productData: any, variants: any[], images: any[]) => {
    // ── Bước 1: Thêm vào bảng products trước để lấy ID ──
    const { data: product, error: productErr } = await supabaseClient
        .from('products')
        .insert([productData])
        .select()
        .single();

    if (productErr) throw productErr;

    // ── Bước 2: Thêm vào bảng product_variants (nếu có) ──
    if (variants && variants.length > 0) {
        const variantsToInsert = variants.map(v => ({ ...v, product_id: product.id }));
        const { error: variantErr } = await supabaseClient
            .from('product_variants')
            .insert(variantsToInsert);

        if (variantErr) {
            // ⚡ ROLLBACK: Xóa sản phẩm đã tạo ở bước 1
            await supabaseClient.from('products').delete().eq('id', product.id);
            throw { code: 'VARIANT_FAILED', message: 'Lỗi khi thêm biến thể. Đã rollback sản phẩm.', details: variantErr };
        }
    }

    // ── Bước 3: Thêm vào bảng product_images (nếu có) ──
    if (images && images.length > 0) {
        const imagesToInsert = images.map(img => ({ ...img, product_id: product.id }));
        const { error: imageErr } = await supabaseClient
            .from('product_images')
            .insert(imagesToInsert);

        if (imageErr) {
            // ⚡ ROLLBACK: Xóa sản phẩm (CASCADE sẽ tự xóa luôn variants đã thêm ở bước 2)
            await supabaseClient.from('products').delete().eq('id', product.id);
            throw { code: 'IMAGE_FAILED', message: 'Lỗi khi thêm hình ảnh. Đã rollback sản phẩm và biến thể.', details: imageErr };
        }
    }

    return product;
};

// 3. Xóa sản phẩm (CASCADE sẽ tự động xóa luôn variants và images)
export const deleteProductById = async (id: number) => {
    // Kiểm tra tồn tại trước khi xóa
    const { data: existing } = await supabaseClient
        .from('products')
        .select('id')
        .eq('id', id)
        .single();

    if (!existing) throw { code: 'NOT_FOUND' };

    const { error } = await supabaseClient
        .from('products')
        .delete()
        .eq('id', id);

    if (error) throw error;
    return { success: true };
};