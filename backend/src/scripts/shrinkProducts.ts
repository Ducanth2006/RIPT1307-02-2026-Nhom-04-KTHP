import supabaseClient from '../config/supabase';

async function shrink() {
    console.log('🧹 Bắt đầu dọn dẹp và thu gọn sản phẩm...');

    // 1. Lấy tất cả sản phẩm kèm theo ảnh
    const { data: products, error: prodError } = await supabaseClient
        .from('products')
        .select('id, name, product_images(id)');
    
    if (prodError) {
        console.error('Lỗi khi lấy danh sách sản phẩm:', prodError);
        return;
    }

    console.log(`Tổng số sản phẩm hiện tại: ${products.length}`);

    // Lọc ra sản phẩm có ảnh và không có ảnh
    const withImages = products.filter(p => p.product_images && p.product_images.length > 0);
    const withoutImages = products.filter(p => !p.product_images || p.product_images.length === 0);

    console.log(`Sản phẩm có ảnh: ${withImages.length}`);
    console.log(`Sản phẩm không có ảnh: ${withoutImages.length}`);

    // 2. Xóa các sản phẩm không có ảnh
    if (withoutImages.length > 0) {
        const deleteIds = withoutImages.map(p => p.id);
        const { error: delErr } = await supabaseClient
            .from('products')
            .delete()
            .in('id', deleteIds);
        
        if (delErr) {
            console.error('Lỗi khi xóa sản phẩm không có ảnh:', delErr);
        } else {
            console.log(`❌ Đã xóa thành công ${withoutImages.length} sản phẩm không có ảnh.`);
        }
    }

    // 3. Nếu số lượng sản phẩm có ảnh vẫn lớn hơn 50, chỉ giữ lại 50 sản phẩm, xóa phần còn lại
    const targetLimit = 50;
    if (withImages.length > targetLimit) {
        const keepProducts = withImages.slice(0, targetLimit);
        const deleteProducts = withImages.slice(targetLimit);
        const deleteIds = deleteProducts.map(p => p.id);

        console.log(`Đang thu gọn số lượng sản phẩm từ ${withImages.length} xuống còn ${targetLimit}...`);

        const { error: delErr2 } = await supabaseClient
            .from('products')
            .delete()
            .in('id', deleteIds);

        if (delErr2) {
            console.error('Lỗi khi thu gọn danh sách sản phẩm:', delErr2);
        } else {
            console.log(`❌ Đã xóa thêm ${deleteProducts.length} sản phẩm dư thừa.`);
        }
    }

    console.log('🎉 Hoàn tất dọn dẹp kho hàng! Hiện tại hệ thống đang có đúng 50 sản phẩm có ảnh chất lượng.');
    process.exit(0);
}

shrink();
