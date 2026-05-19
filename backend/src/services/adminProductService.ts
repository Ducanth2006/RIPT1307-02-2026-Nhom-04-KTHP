import supabaseClient from '../config/supabase';

// 1. Thống kê Dashboard Sản Phẩm
export const fetchProductStats = async () => {
    // Chạy song song các query để tối ưu hiệu suất
    const [
        { count: totalProducts, error: err1 },
        { count: activeProducts, error: err2 },
        { data: variantData, error: err3 },
        { count: outOfStock, error: err4 }
    ] = await Promise.all([
        supabaseClient.from('products').select('*', { count: 'exact', head: true }),
        supabaseClient.from('products').select('*', { count: 'exact', head: true }).eq('status', 'Active'),
        supabaseClient.from('product_variants').select('stock_quantity'),
        supabaseClient.from('product_variants').select('*', { count: 'exact', head: true }).lte('stock_quantity', 5) // Low stock alerts (<=5)
    ]);

    if (err1 || err2 || err3 || err4) {
        throw new Error('Lỗi khi lấy thống kê sản phẩm từ Database');
    }

    const totalStock = variantData ? variantData.reduce((acc, curr) => acc + (curr.stock_quantity || 0), 0) : 0;

    return {
        totalProducts: totalProducts || 0,
        activeProducts: activeProducts || 0,
        totalStock,
        lowStockAlerts: outOfStock || 0
    };
};

// 2. Lấy danh sách sản phẩm (kèm theo Danh mục, Biến thể và Hình ảnh)
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

    // Xử lý dữ liệu trả về cho Frontend dễ dùng
    const formattedData = data.map(product => {
        const variants = product.product_variants || [];
        const images = product.product_images || [];
        
        // Tính tổng stock
        const total_stock = variants.reduce((sum: number, v: any) => sum + (v.stock_quantity || 0), 0);
        
        // Lấy ảnh chính
        const main_image = images.find((img: any) => img.is_main)?.image_url || images[0]?.image_url || null;

        return {
            ...product,
            total_stock,
            main_image
        };
    });

    return formattedData;
};

// 3. Thêm mới Sản phẩm tích hợp (Lưu vào 3 bảng) — Có Rollback
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

// 4. Cập nhật thông tin chung của sản phẩm
export const updateBasicProduct = async (id: number, productData: any) => {
    const { data, error } = await supabaseClient
        .from('products')
        .update(productData)
        .eq('id', id)
        .select()
        .single();

    if (error) throw error;

    // ── BỔ SUNG: Nếu sản phẩm được bật hoạt động (Active), tự động kích hoạt danh mục tương ứng ──
    try {
        if (productData.status === 'Active' && data.category_id) {
            // 1. Lấy thông tin danh mục của sản phẩm (dùng maybeSingle thay vì single để tránh ném lỗi)
            const { data: category, error: catErr } = await supabaseClient
                .from('categories')
                .select('id, parent_id, status')
                .eq('id', data.category_id)
                .maybeSingle();

            if (!catErr && category && category.status === 'Draft') {
                // 2. Kích hoạt danh mục con này thành Active
                await supabaseClient
                    .from('categories')
                    .update({ status: 'Active' })
                    .eq('id', category.id);

                // 3. Nếu danh mục con này có cha và cha cũng đang ẩn, tự động kích hoạt danh mục Cha
                if (category.parent_id) {
                    const { data: parentCat, error: parentErr } = await supabaseClient
                        .from('categories')
                        .select('id, status')
                        .eq('id', category.parent_id)
                        .maybeSingle();

                    if (!parentErr && parentCat && parentCat.status === 'Draft') {
                        await supabaseClient
                            .from('categories')
                            .update({ status: 'Active' })
                            .eq('id', parentCat.id);
                    }
                }
            }
        }
    } catch (syncError) {
        console.error("⚠️ Lỗi đồng bộ ngược trạng thái từ Sản phẩm lên Danh mục:", syncError);
    }

    return data;
};

// 5. Xóa sản phẩm (CASCADE sẽ tự động xóa luôn variants và images)
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