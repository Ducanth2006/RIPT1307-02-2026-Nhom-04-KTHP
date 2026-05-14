import supabaseClient from '../config/supabase';

interface GetProductsFilters {
    search?: string;
    brand?: string;
    category_id?: number;
    min_price?: number;
    max_price?: number;
    sortBy?: string;
    order?: 'asc' | 'desc';
    page?: number;
    limit?: number;
}

export const fetchClientProducts = async (filters: GetProductsFilters) => {
    let query = supabaseClient
        .from('products')
        .select(`
            id,
            name,
            description,
            base_price,
            status,
            brand,
            created_at,
            categories (
                id,
                name,
                slug
            ),
            product_images (
                id,
                image_url,
                is_main
            )
        `, { count: 'exact' })
        .is('deleted_at', null)
        .eq('status', 'Active'); // Chỉ lấy sản phẩm đang bán

    // 1. Search theo tên sản phẩm
    if (filters.search) {
        query = query.ilike('name', `%${filters.search}%`);
    }

    // 2. Filter theo brand
    if (filters.brand) {
        query = query.eq('brand', filters.brand);
    }

    // 3. Filter theo category_id
    if (filters.category_id) {
        query = query.eq('category_id', filters.category_id);
    }

    // 4. Filter theo price (dựa trên base_price)
    if (filters.min_price !== undefined && !isNaN(filters.min_price)) {
        query = query.gte('base_price', filters.min_price);
    }
    if (filters.max_price !== undefined && !isNaN(filters.max_price)) {
        query = query.lte('base_price', filters.max_price);
    }

    // 5. Sort
    if (filters.sortBy) {
        const ascending = filters.order === 'asc';
        // Các field được phép sort
        const allowedSortFields = ['base_price', 'created_at', 'name'];
        if (allowedSortFields.includes(filters.sortBy)) {
            query = query.order(filters.sortBy, { ascending });
        } else {
            query = query.order('created_at', { ascending: false });
        }
    } else {
        query = query.order('created_at', { ascending: false }); // Default sort là mới nhất
    }

    // 6. Pagination
    const page = filters.page && filters.page > 0 ? filters.page : 1;
    const limit = filters.limit && filters.limit > 0 ? filters.limit : 10;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    query = query.range(from, to);

    const { data, count, error } = await query;

    if (error) throw error;

    return {
        products: data,
        pagination: {
            total: count || 0,
            page,
            limit,
            totalPages: count ? Math.ceil(count / limit) : 0
        }
    };
};

export const fetchClientProductById = async (id: string) => {
    const { data, error } = await supabaseClient
        .from('products')
        .select(`
            id,
            name,
            description,
            base_price,
            status,
            brand,
            created_at,
            categories (
                id,
                name,
                slug
            ),
            product_images (
                id,
                image_url,
                is_main
            ),
            product_variants (
                id,
                sku,
                size,
                color,
                price,
                stock_quantity
            )
        `)
        .eq('id', id)
        .is('deleted_at', null)
        .eq('status', 'Active')
        .single();

    if (error) {
        if (error.code === 'PGRST116') {
            return null; // Không tìm thấy hoặc không active
        }
        throw error;
    }

    return data;
};
