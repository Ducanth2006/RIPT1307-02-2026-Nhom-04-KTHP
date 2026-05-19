import supabaseClient from '../config/supabase';

// 1. Lấy danh sách toàn bộ danh mục
export const fetchAllCategories = async () => {
    const { data: categories, error } = await supabaseClient
        .from('categories')
        .select('*, products(count)')
        .order('id', { ascending: true }); // Sắp xếp theo ID

    if (error) throw error;
    
    // Format lại kết quả: Gắn thêm trường `items` (số lượng sản phẩm) và dọn dẹp data thừa
    return categories.map((cat: any) => {
        const itemCount = cat.products && cat.products.length > 0 ? cat.products[0].count : 0;
        const { products, ...cleanCategory } = cat; // Xóa mảng products gốc đi cho nhẹ
        return { ...cleanCategory, items: itemCount };
    });
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
    // ── Bước 1: Cập nhật danh mục hiện tại ──
    const { data: updatedCat, error } = await supabaseClient
        .from('categories')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

    if (error) throw error;

    // ── Bước 2: Đồng bộ trạng thái Draft (Ẩn active) xuống sản phẩm & danh mục con ──
    if (updateData.status === 'Draft') {
        let childIds: number[] = [];
        
        // Nếu ẩn danh mục Cha
        if (updatedCat.parent_id === null) {
            // Lấy tất cả danh mục con thuộc danh mục cha này
            const { data: children } = await supabaseClient
                .from('categories')
                .select('id')
                .eq('parent_id', id);

            childIds = children ? children.map(c => c.id) : [];

            if (childIds.length > 0) {
                // 1. Ẩn tất cả danh mục con thành Draft
                await supabaseClient
                    .from('categories')
                    .update({ status: 'Draft' })
                    .in('id', childIds);
            }
        }

        // 2. Ẩn toàn bộ sản phẩm trực thuộc danh mục cha và các danh mục con tương ứng
        const allTargetCategoryIds = [...childIds, id];
        await supabaseClient
            .from('products')
            .update({ status: 'Draft' })
            .in('category_id', allTargetCategoryIds);
    } 
    // ── Bước 3: Đồng bộ trạng thái Active (Kích hoạt) hai chiều ──
    else if (updateData.status === 'Active') {
        // Nếu kích hoạt danh mục Cha
        if (updatedCat.parent_id === null) {
            // Lấy tất cả danh mục con thuộc danh mục cha này
            const { data: children } = await supabaseClient
                .from('categories')
                .select('id')
                .eq('parent_id', id);

            const childIds = children ? children.map(c => c.id) : [];

            if (childIds.length > 0) {
                // 1. Kích hoạt tất cả danh mục con của nó thành Active
                await supabaseClient
                    .from('categories')
                    .update({ status: 'Active' })
                    .in('id', childIds);
            }

            // 2. Kích hoạt toàn bộ sản phẩm trực thuộc danh mục cha và các danh mục con
            const allTargetCategoryIds = [...childIds, id];
            await supabaseClient
                .from('products')
                .update({ status: 'Active' })
                .in('category_id', allTargetCategoryIds);
        } 
        // Nếu kích hoạt danh mục Con
        else {
            // 1. Tự động kích hoạt danh mục Cha của nó thành Active (nếu cha đang ẩn)
            await supabaseClient
                .from('categories')
                .update({ status: 'Active' })
                .eq('id', updatedCat.parent_id);

            // 2. Tự động kích hoạt toàn bộ sản phẩm trực thuộc danh mục con này thành Active
            await supabaseClient
                .from('products')
                .update({ status: 'Active' })
                .eq('category_id', id);
        }
    }

    return updatedCat;
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
        .select('id, parent_id, status');
    if (catError) throw catError;

    // 2. Phân loại danh mục
    const parent_categories = categories.filter(c => !c.parent_id).length;
    const child_categories = categories.filter(c => c.parent_id).length;
    const activeCategoryIds = new Set(categories.filter(c => c.status === 'Active').map(c => c.id));

    // 3. Lấy sản phẩm để tính Active
    const { data: products, error: prodError } = await supabaseClient
        .from('products')
        .select('category_id, status');
    if (prodError) throw prodError;

    // Tính Active Items: Sản phẩm Active VÀ phải thuộc về Danh mục Active
    const activeItems = products.filter(p => p.status === 'Active' && activeCategoryIds.has(p.category_id)).length;

    // Trả về 3 thông số mới
    return {
        parent_categories,
        child_categories,
        active_items: activeItems
    };
};