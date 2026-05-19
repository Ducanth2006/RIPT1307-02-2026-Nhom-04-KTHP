import supabaseClient from '../config/supabase';

// Helper: Hàm tạo chuỗi random
const randomString = (length: number) => Math.random().toString(36).substring(2, 2 + length).toUpperCase();

// Helper: Hàm lấy ngày ngẫu nhiên trong khoảng X ngày gần đây
const randomDate = (daysBack: number) => {
    const d = new Date();
    d.setDate(d.getDate() - Math.floor(Math.random() * daysBack));
    return d.toISOString();
};

const SAMPLE_IMAGES = [
    "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&h=400&fit=crop",
    "https://images.unsplash.com/photo-1515955656352-a1fa3ffcd111?w=400&h=400&fit=crop",
    "https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=400&h=400&fit=crop",
    "https://images.unsplash.com/photo-1551107696-a4b0a5a07c31?w=400&h=400&fit=crop",
    "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=400&h=400&fit=crop"
];

const BRANDS = ["Nike", "Adidas", "Puma", "Under Armour", "Reebok"];
const SIZES = ["S", "M", "L", "XL"];
const COLORS = ["Đỏ", "Đen", "Trắng", "Xanh navy", "Xám"];

async function seed() {
    console.log('🚀 Bắt đầu quá trình Seeding Dữ Liệu Sản Phẩm...');

    // 1. Lấy danh sách category
    const { data: categories, error: catError } = await supabaseClient.from('categories').select('*');
    if (catError) {
        console.error('Lỗi lấy danh mục:', catError);
        return;
    }

    if (!categories || categories.length === 0) {
        console.log('⚠️ Không có danh mục nào trong DB, vui lòng tạo danh mục trước khi chạy seed.');
        return;
    }

    // 2. Xóa sạch bảng products (Do Cascade, variants và images sẽ tự mất)
    console.log('🧹 Đang dọn dẹp dữ liệu cũ...');
    // Lấy hết ID
    const { data: oldProds } = await supabaseClient.from('products').select('id');
    if (oldProds && oldProds.length > 0) {
        const ids = oldProds.map(p => p.id);
        await supabaseClient.from('products').delete().in('id', ids);
    }

    // 3. Tạo dữ liệu mới
    console.log('🌱 Đang tạo dữ liệu mới...');
    let successCount = 0;

    for (const category of categories) {
        // Chỉ tạo sản phẩm cho những danh mục con (danh mục có tên chi tiết)
        // Nếu tên chứa 'Giày', 'Áo', 'Quần', 'Balo'... ta sẽ mix tên
        
        // Tạo 3-5 sản phẩm cho mỗi category
        const numProducts = Math.floor(Math.random() * 3) + 3; 

        for (let i = 0; i < numProducts; i++) {
            const brand = BRANDS[Math.floor(Math.random() * BRANDS.length)];
            let prefix = "Sản phẩm";
            const catName = category.name.toLowerCase();
            if (catName.includes('áo') || catName.includes('t-shirt') || catName.includes('jacket')) prefix = "Áo";
            else if (catName.includes('quần') || catName.includes('pant') || catName.includes('short')) prefix = "Quần";
            else if (catName.includes('giày') || catName.includes('sneaker') || catName.includes('footwear')) prefix = "Giày";
            else if (catName.includes('balo') || catName.includes('bag')) prefix = "Balo";
            else if (catName.includes('phụ kiện') || catName.includes('accessories')) prefix = "Phụ kiện";

            const name = `${prefix} Thể Thao ${brand} ${randomString(4)}`;
            const basePrice = Math.floor(Math.random() * 100) * 10000 + 150000; // 150k - 1tr150k

            // Thêm vào bảng products
            const { data: newProduct, error: insertError } = await supabaseClient
                .from('products')
                .insert([{
                    name,
                    category_id: category.id,
                    base_price: basePrice,
                    brand,
                    description: `Sản phẩm ${name} chính hãng từ ${brand}. Thiết kế thể thao năng động, thoáng mát, phù hợp cho mọi hoạt động thể chất.`,
                    status: Math.random() > 0.1 ? 'Active' : 'Draft', // 90% active
                    created_at: randomDate(90) // Random trong 90 ngày qua
                }])
                .select()
                .single();

            if (insertError) {
                console.error(`Lỗi tạo sp ${name}:`, insertError);
                continue;
            }

            // Tạo Variants
            const variantsToInsert = [];
            const isFreesize = Math.random() > 0.7; // 30% freesize
            
            if (isFreesize) {
                variantsToInsert.push({
                    product_id: newProduct.id,
                    sku: `SKU-${randomString(6)}`,
                    size: null,
                    color: COLORS[Math.floor(Math.random() * COLORS.length)],
                    price: basePrice,
                    cost_price: Math.floor(basePrice * 0.6), // Giá vốn = 60%
                    stock_quantity: Math.floor(Math.random() * 50)
                });
            } else {
                // Lấy 2 size ngẫu nhiên, 2 màu ngẫu nhiên
                const selectedSizes = [SIZES[0], SIZES[2]];
                const selectedColors = [COLORS[0], COLORS[1]];

                for (const s of selectedSizes) {
                    for (const c of selectedColors) {
                        variantsToInsert.push({
                            product_id: newProduct.id,
                            sku: `SKU-${randomString(6)}`,
                            size: s,
                            color: c,
                            price: basePrice,
                            cost_price: Math.floor(basePrice * 0.6),
                            stock_quantity: Math.floor(Math.random() * 30) // Có thể 0
                        });
                    }
                }
            }

            await supabaseClient.from('product_variants').insert(variantsToInsert);

            // Tạo Images
            await supabaseClient.from('product_images').insert([{
                product_id: newProduct.id,
                image_url: SAMPLE_IMAGES[Math.floor(Math.random() * SAMPLE_IMAGES.length)],
                is_main: true
            }]);

            successCount++;
        }
    }

    console.log(`✅ Đã sinh thành công ${successCount} sản phẩm kèm phân loại và ảnh!`);
    process.exit(0);
}

seed();
