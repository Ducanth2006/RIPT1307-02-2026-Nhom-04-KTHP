import supabaseClient from '../config/supabase';

export const validateAndApplyVoucher = async (code: string, cartTotal: number) => {
    // 1. Lấy thông tin voucher
    const { data: voucher, error } = await supabaseClient
        .from('vouchers')
        .select('*')
        .eq('code', code)
        .single();

    if (error || !voucher) {
        throw new Error('Voucher không tồn tại hoặc không hợp lệ.');
    }

    // 2. Kiểm tra trạng thái
    if (voucher.status !== 'Active' && voucher.status !== 'active') {
        throw new Error('Voucher không còn hoạt động.');
    }

    // 3. Kiểm tra số lượng
    if (voucher.quantity !== null && voucher.quantity <= 0) {
        throw new Error('Voucher đã hết lượt sử dụng.');
    }

    // 4. Kiểm tra thời hạn
    const now = new Date();
    if (voucher.start_date && new Date(voucher.start_date) > now) {
        throw new Error('Voucher chưa đến thời gian sử dụng.');
    }
    if (voucher.end_date && new Date(voucher.end_date) < now) {
        throw new Error('Voucher đã hết hạn.');
    }

    // 5. Kiểm tra điều kiện giá trị đơn hàng tối thiểu
    if (voucher.min_order_value && cartTotal < Number(voucher.min_order_value)) {
        throw new Error(`Đơn hàng chưa đạt giá trị tối thiểu để sử dụng voucher này (${voucher.min_order_value}).`);
    }

    // 6. Tính toán số tiền được giảm
    let discountAmount = 0;
    if (voucher.discount_type === 'Percentage') {
        discountAmount = (cartTotal * Number(voucher.discount_value)) / 100;
        if (voucher.max_discount && discountAmount > Number(voucher.max_discount)) {
            discountAmount = Number(voucher.max_discount);
        }
    } else if (voucher.discount_type === 'Fixed') {
        discountAmount = Number(voucher.discount_value);
    }

    // Đảm bảo số tiền giảm không vượt quá tổng đơn hàng
    if (discountAmount > cartTotal) {
        discountAmount = cartTotal;
    }

    return {
        voucherInfo: voucher,
        discountAmount,
        finalAmount: cartTotal - discountAmount
    };
};

// -------------------------------------------------------------
// CART CRUD OPERATIONS
// -------------------------------------------------------------

export const getCartByUserId = async (userId: number) => {
    const { data: cartItems, error } = await supabaseClient
        .from('cart_items')
        .select(`
            id,
            user_id,
            quantity,
            variant_id,
            product_variants (
                id,
                sku,
                size,
                color,
                price,
                stock_quantity,
                products (
                    id,
                    name,
                    base_price,
                    product_images (
                        image_url,
                        is_main
                    )
                )
            )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

    if (error) {
        throw new Error('Lỗi khi lấy giỏ hàng: ' + error.message);
    }

    // Format lại dữ liệu cho gọn gàng hơn đối với FE
    const formattedCart = cartItems.map((item: any) => {
        const variant = item.product_variants;
        const product = variant.products;
        
        // Lấy ảnh chính (hoặc ảnh đầu tiên nếu không có ảnh chính)
        let imageUrl = null;
        if (product.product_images && product.product_images.length > 0) {
            const mainImage = product.product_images.find((img: any) => img.is_main);
            imageUrl = mainImage ? mainImage.image_url : product.product_images[0].image_url;
        }

        return {
            cartItemId: item.id,
            quantity: item.quantity,
            variantId: item.variant_id,
            sku: variant.sku,
            size: variant.size,
            color: variant.color,
            price: variant.price,
            stockQuantity: variant.stock_quantity,
            productId: product.id,
            productName: product.name,
            imageUrl: imageUrl
        };
    });

    return formattedCart;
};

export const addItemToCart = async (userId: number, variantId: number, quantity: number) => {
    // 1. Kiểm tra variant có tồn tại không
    const { data: variant, error: variantError } = await supabaseClient
        .from('product_variants')
        .select('*')
        .eq('id', variantId)
        .single();

    if (variantError || !variant) {
        throw new Error('Sản phẩm/Phiên bản không tồn tại.');
    }

    if (variant.stock_quantity < quantity) {
        throw new Error(`Sản phẩm không đủ số lượng tồn kho (Còn lại: ${variant.stock_quantity}).`);
    }

    // 2. Kiểm tra xem variant đã có trong giỏ hàng của user chưa
    const { data: existingItem, error: checkError } = await supabaseClient
        .from('cart_items')
        .select('*')
        .eq('user_id', userId)
        .eq('variant_id', variantId)
        .single();

    if (existingItem) {
        // Đã có -> Cộng dồn số lượng
        const newQuantity = existingItem.quantity + quantity;
        
        if (variant.stock_quantity < newQuantity) {
            throw new Error(`Sản phẩm không đủ số lượng tồn kho (Còn lại: ${variant.stock_quantity}). Bạn đang có ${existingItem.quantity} cái trong giỏ.`);
        }

        const { data: updatedItem, error: updateError } = await supabaseClient
            .from('cart_items')
            .update({ quantity: newQuantity })
            .eq('id', existingItem.id)
            .select()
            .single();

        if (updateError) throw new Error('Lỗi khi cập nhật giỏ hàng: ' + updateError.message);
        return updatedItem;
    } else {
        // Chưa có -> Thêm mới
        const { data: newItem, error: insertError } = await supabaseClient
            .from('cart_items')
            .insert([
                { user_id: userId, variant_id: variantId, quantity: quantity }
            ])
            .select()
            .single();

        if (insertError) throw new Error('Lỗi khi thêm vào giỏ hàng: ' + insertError.message);
        return newItem;
    }
};

export const updateItemQuantity = async (itemId: number, quantity: number) => {
    if (quantity <= 0) {
        throw new Error('Số lượng phải lớn hơn 0. Nếu muốn xóa, vui lòng dùng chức năng xóa.');
    }

    // Kiểm tra tồn kho trước khi cập nhật
    const { data: cartItem, error: fetchError } = await supabaseClient
        .from('cart_items')
        .select(`
            *,
            product_variants (
                stock_quantity
            )
        `)
        .eq('id', itemId)
        .single();

    if (fetchError || !cartItem) {
        throw new Error('Không tìm thấy sản phẩm trong giỏ hàng.');
    }

    if (cartItem.product_variants.stock_quantity < quantity) {
        throw new Error(`Sản phẩm không đủ số lượng tồn kho (Còn lại: ${cartItem.product_variants.stock_quantity}).`);
    }

    const { data: updatedItem, error: updateError } = await supabaseClient
        .from('cart_items')
        .update({ quantity })
        .eq('id', itemId)
        .select()
        .single();

    if (updateError) throw new Error('Lỗi khi cập nhật số lượng: ' + updateError.message);
    return updatedItem;
};

export const removeItemFromCart = async (itemId: number) => {
    const { error } = await supabaseClient
        .from('cart_items')
        .delete()
        .eq('id', itemId);

    if (error) {
        throw new Error('Lỗi khi xóa sản phẩm khỏi giỏ hàng: ' + error.message);
    }
    return true;
};
