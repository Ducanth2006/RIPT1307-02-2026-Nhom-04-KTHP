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

    // 3. Filter theo category_id (bao gồm cả danh mục con)
    if (filters.category_id) {
        // Lấy danh sách danh mục con của category_id này (nếu là danh mục cha)
        const { data: childCategories } = await supabaseClient
            .from('categories')
            .select('id')
            .eq('parent_id', filters.category_id);

        // Tạo mảng bao gồm cả danh mục cha + các danh mục con
        const categoryIds = [filters.category_id];
        if (childCategories && childCategories.length > 0) {
            childCategories.forEach(c => categoryIds.push(c.id));
        }

        // Dùng .in() để lọc theo toàn bộ danh sách (cha + con)
        query = query.in('category_id', categoryIds);
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

export const fetchNewArrivals = async () => {
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
            )
        `)
        .is('deleted_at', null)
        .eq('status', 'Active')
        .order('created_at', { ascending: false })
        .limit(10);

    if (error) throw error;

    // Map status thành 'NEW' để hiển thị badge 'NEW' ở Frontend (ProductCard.tsx)
    const formattedProducts = data?.map(product => ({
        ...product,
        status: 'NEW'
    })) || [];

    return formattedProducts;
};

export const fetchHomepageCollections = async () => {
    // 1. Năng động mỗi ngày (Daily Active): Áo thun tập gym (5) & Áo Polo (6)
    const activeQuery = supabaseClient
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
        `)
        .is('deleted_at', null)
        .eq('status', 'Active')
        .in('category_id', [5, 6])
        .order('created_at', { ascending: false })
        .limit(8);

    // 2. Góc Thu - Đông (Cold Weather): Áo khoác gió (7) & Áo giữ nhiệt (9)
    const coldQuery = supabaseClient
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
        `)
        .is('deleted_at', null)
        .eq('status', 'Active')
        .in('category_id', [7, 9])
        .order('created_at', { ascending: false })
        .limit(8);

    // 3. Đồ mặc thường nhật (Daily Wear): Quần short (10) & Quần jogger (11)
    const dailyWearQuery = supabaseClient
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
        `)
        .is('deleted_at', null)
        .eq('status', 'Active')
        .in('category_id', [10, 11])
        .order('created_at', { ascending: false })
        .limit(8);

    const [activeRes, coldRes, dailyWearRes] = await Promise.all([
        activeQuery,
        coldQuery,
        dailyWearQuery
    ]);

    if (activeRes.error) throw activeRes.error;
    if (coldRes.error) throw coldRes.error;
    if (dailyWearRes.error) throw dailyWearRes.error;

    return {
        dailyActive: {
            title: "Năng động mỗi ngày",
            subtitle: "Áo Polo & Áo thun thể thao thoáng mát, hoạt động cả ngày dài",
            products: activeRes.data || []
        },
        coldWeather: {
            title: "Góc Thu - Đông",
            subtitle: "Áo khoác gió & Áo giữ nhiệt ấm áp, bảo vệ bạn mọi lúc",
            products: coldRes.data || []
        },
        dailyWear: {
            title: "Đồ mặc thường nhật (Basic Wear)",
            subtitle: "Quần short & Quần jogger dễ phối đồ, nâng tầm phong cách",
            products: dailyWearRes.data || []
        }
    };
};

export const fetchLowStockProducts = async () => {
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
            product_variants!inner (
                id,
                sku,
                size,
                color,
                price,
                stock_quantity
            )
        `)
        .is('deleted_at', null)
        .eq('status', 'Active')
        .lt('product_variants.stock_quantity', 10)
        .gt('product_variants.stock_quantity', 0)
        .limit(10);

    if (error) throw error;
    return data;
};

