import type { Request, Response } from 'express';
import supabaseClient from '../config/supabase';

// ══════════════════════════════════════════════════════════════
// HYBRID CHATBOT: Local Logic + Gemini AI (tối ưu token)
// - Tier 1: Xử lý local (0 token) cho FAQ, size, hướng dẫn
// - Tier 2: DB Search + Gemini AI cho tìm kiếm sản phẩm
// ══════════════════════════════════════════════════════════════

const MAX_PRODUCTS = 5;

// ── CHUẨN HÓA TIẾNG VIỆT (bỏ dấu) ─────────────────────────
function removeDiacritics(str: string): string {
    return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D');
}

// ── INTENT DETECTION ─────────────────────────────────────────
type Intent = 'GREETING' | 'SIZE_GUIDE' | 'ORDER_HELP' | 'PAYMENT_HELP' | 'COMPLAINT' | 'NAVIGATION' | 'PRODUCT_SEARCH' | 'UNKNOWN';

const INTENT_RULES: { intent: Intent; keywords: string[] }[] = [
    {
        intent: 'SIZE_GUIDE',
        keywords: ['size', 'sz', 'chiều cao', 'cân nặng', 'cao bao nhiêu', 'nặng bao nhiêu', 'chọn size', 'tính size',
            'hướng dẫn chọn size', 'bảng size', 'mặc size gì', 'mang size gì', 'đo size']
    },
    {
        intent: 'ORDER_HELP',
        keywords: ['hủy đơn', 'hủy hàng', 'theo dõi đơn', 'trạng thái đơn', 'đơn hàng của tôi', 'xem đơn hàng',
            'đơn đang giao', 'khi nào nhận', 'giao hàng', 'vận chuyển', 'ship', 'đổi trả', 'hoàn tiền']
    },
    {
        intent: 'PAYMENT_HELP',
        keywords: ['thanh toán', 'cod', 'chuyển khoản', 'trả tiền', 'momo', 'banking', 'cách mua', 'mua hàng',
            'đặt hàng', 'cách đặt', 'hướng dẫn mua', 'hướng dẫn đặt hàng']
    },
    {
        intent: 'COMPLAINT',
        keywords: ['khiếu nại', 'góp ý', 'phản hồi', 'report', 'tố cáo', 'không hài lòng', 'lỗi sản phẩm',
            'sản phẩm lỗi', 'hàng lỗi', 'liên hệ', 'hotline', 'hỗ trợ']
    },
    {
        intent: 'NAVIGATION',
        keywords: ['giỏ hàng', 'tài khoản', 'hồ sơ', 'profile', 'lịch sử', 'voucher', 'mã giảm giá', 'khuyến mãi']
    },
    {
        intent: 'GREETING',
        keywords: ['xin chào', 'hello', 'hi', 'chào bạn', 'chào shop', 'hey', 'alo', 'bạn ơi']
    },
];

// Từ khóa gợi ý user đang tìm sản phẩm
const PRODUCT_KEYWORDS = [
    'mua', 'tìm', 'gợi ý', 'recommend', 'sản phẩm', 'có không', 'còn không',
    'giày', 'áo', 'quần', 'dép', 'nón', 'mũ', 'tất', 'balo', 'túi', 'khoác',
    'nike', 'adidas', 'puma', 'jordan', 'new balance', 'under armour',
    'trắng', 'đen', 'đỏ', 'xanh', 'vàng', 'hồng', 'xám', 'nâu', 'cam', 'tím',
    'chạy bộ', 'tập gym', 'bóng đá', 'bóng rổ', 'tennis', 'thể thao',
    'rẻ', 'đắt', 'giá', 'bán chạy', 'hot', 'mới', 'nổi bật',
    'polo', 'jogger', 'short', 'tank top', 'hoodie'
];

function detectIntent(message: string): Intent {
    const lower = message.toLowerCase().trim();
    const noDiac = removeDiacritics(lower);

    // 1. Phân biệt rõ "tìm kiếm sản phẩm theo size" với "tính size/tư vấn size"
    const isSearchRequest = noDiac.includes('chon do') ||
        noDiac.includes('mua he') ||
        noDiac.includes('mua dong') ||
        noDiac.includes('tim') ||
        /\b(ao|quan|giay|dep)\b/i.test(noDiac);

    if (isSearchRequest) {
        return 'PRODUCT_SEARCH';
    }

    // 2. Kiểm tra hỏi size bằng regex trước (như "cao 170 nặng 65" hoặc "170cm 65kg")
    if (/\d+\s*(cm|kg|m\d*|can|ky|cân|ký)/i.test(noDiac) || /cao\s*\d|nang\s*\d|nặng\s*\d/i.test(noDiac)) {
        return 'SIZE_GUIDE';
    }

    // 3. Kiểm tra các intent tĩnh khác (so khớp nguyên từ hoặc cụm từ)
    for (const rule of INTENT_RULES) {
        if (rule.keywords.some(kw => {
            const normKw = removeDiacritics(kw.toLowerCase());
            return lower.includes(kw.toLowerCase()) || noDiac.includes(normKw);
        })) {
            return rule.intent;
        }
    }

    // 4. Kiểm tra từ khóa tìm kiếm sản phẩm (dùng word boundary để tránh "cao" khớp với "ao")
    const hasProductKeyword = PRODUCT_KEYWORDS.some(kw => {
        const normKw = removeDiacritics(kw.toLowerCase());
        const regex = new RegExp(`\\b${normKw}\\b`, 'i');
        return regex.test(noDiac) || regex.test(lower);
    });

    if (hasProductKeyword) {
        return 'PRODUCT_SEARCH';
    }

    return 'UNKNOWN';
}

// ── SIZE CALCULATOR ──────────────────────────────────────────
function calculateSize(message: string): { reply: string; suggestions: string[] } {
    // Normalize: hỗ trợ cả gõ không dấu
    const raw = message.toLowerCase();
    const norm = removeDiacritics(raw);

    let height = 0, weight = 0;

    // Parse chiều cao (hỗ trợ cả "cao" không dấu)
    const hMatch = norm.match(/(?:cao|height)\s*[:=]?\s*(\d+(?:[.,]\d+)?)\s*(m|cm)?/i)
        || norm.match(/(\d+(?:[.,]\d+)?)\s*(m|cm)\s*(?:\d|$)/i);
    if (hMatch && hMatch[1]) {
        height = parseFloat(hMatch[1].replace(',', '.'));
        if (hMatch[2] && (hMatch[2].toLowerCase() === 'm' || height < 3)) height *= 100;
    }

    // Parse cân nặng (hỗ trợ "nang", "can nang", "nặng", "cân nặng")
    const wMatch = norm.match(/(?:nang|can nang|weight|can)\s*[:=]?\s*(\d+(?:[.,]\d+)?)\s*(kg|ky)?/i)
        || norm.match(/(\d+(?:[.,]\d+)?)\s*(kg|ky)/i)
        || raw.match(/(?:nặng|cân nặng|cân)\s*[:=]?\s*(\d+(?:[.,]\d+)?)\s*(kg|ký)?/i)
        || raw.match(/(\d+(?:[.,]\d+)?)\s*(kg|ký)/i);
    if (wMatch && wMatch[1]) {
        weight = parseFloat(wMatch[1].replace(',', '.'));
    }

    // Fallback: tìm 2 số liên tiếp (cao trước, nặng sau)
    if (!height || !weight) {
        const nums = message.match(/\d+(?:[.,]\d+)?/g);
        if (nums && nums.length >= 2 && nums[0] && nums[1]) {
            const n1 = parseFloat(nums[0].replace(',', '.'));
            const n2 = parseFloat(nums[1].replace(',', '.'));
            if (!height) height = n1 < 3 ? n1 * 100 : n1;
            if (!weight) weight = n2;
        }
    }

    if (!height || !weight) {
        return {
            reply: "Để tư vấn size chính xác, bạn vui lòng cho mình biết:\n\n📏 **Chiều cao** (cm) và **Cân nặng** (kg)\n\nVí dụ: *Cao 170cm nặng 65kg*",
            suggestions: ["📏 Cao 165 nặng 55", "📏 Cao 170 nặng 65", "📏 Cao 175 nặng 70", "📏 Cao 180 nặng 80"]
        };
    }

    // Tính size dựa trên chiều cao + cân nặng
    interface SizeResult { clothing: string; shoes: string; note: string }
    let result: SizeResult;

    if (height < 160 && weight < 55) {
        result = { clothing: 'S', shoes: '38-39', note: 'Form nhỏ gọn' };
    } else if (height < 168 && weight < 63) {
        result = { clothing: 'M', shoes: '39-40', note: 'Form vừa vặn' };
    } else if (height < 175 && weight < 72) {
        result = { clothing: 'L', shoes: '40-41', note: 'Form thoải mái' };
    } else if (height < 182 && weight < 82) {
        result = { clothing: 'XL', shoes: '41-42', note: 'Form rộng rãi' };
    } else {
        result = { clothing: '2XL', shoes: '42-44', note: 'Form lớn thoáng' };
    }

    return {
        reply: `📐 **Kết quả tư vấn size** cho bạn (${height}cm / ${weight}kg):\n\n👕 **Áo / Quần thể thao:** Size **${result.clothing}**\n👟 **Giày thể thao:** Size **${result.shoes}**\n📌 *${result.note}*\n\n💡 *Bây giờ bạn có thể bấm vào các gợi ý dưới đây để xem sản phẩm phù hợp!*`,
        suggestions: [
            `☀️ Chọn đồ thể thao Mùa Hè (Size ${result.clothing})`,
            `❄️ Chọn đồ thể thao Mùa Đông (Size ${result.clothing})`,
            `🔍 Tìm sản phẩm phù hợp (Size ${result.clothing})`
        ]
    };
}

// ── LOCAL RESPONSE HANDLERS ──────────────────────────────────
const LOCAL_RESPONSES: Record<string, { reply: string; suggestions: string[]; links?: { label: string; url: string }[] }> = {
    GREETING: {
        reply: "Xin chào! 👋 Tôi là **SportStride AI** - trợ lý mua sắm thể thao của bạn.\n\nTôi có thể giúp bạn:\n• 📏 Tư vấn chọn size (VD: *cao 170 nặng 65*)\n• 🔍 Tìm kiếm sản phẩm theo nhu cầu (VD: *tìm áo trắng*)\n• 📦 Hướng dẫn đặt hàng & quản lý đơn\n• 📞 Hỗ trợ khiếu nại & góp ý",
        suggestions: ["📏 Tính Size: Cao & Nặng", "🛒 Hướng dẫn mua & thanh toán", "🔍 Tìm giày chạy bộ"]
    },
    ORDER_HELP: {
        reply: "📦 **Hướng dẫn quản lý đơn hàng:**\n\n**Xem đơn hàng:** Vào mục **Đơn hàng** ở thanh menu phía trên.\n\n**Hủy đơn hàng:**\n1. Vào **Đơn hàng** → Chọn đơn cần hủy\n2. Nhấn nút **Yêu cầu hủy**\n3. Đợi Admin xác nhận hủy\n\n**Lưu ý:** Chỉ hủy được đơn ở trạng thái *Chờ xác nhận*. Đơn đã giao không hủy được.",
        suggestions: ["🛒 Hướng dẫn mua hàng", "📞 Gửi khiếu nại", "📏 Tính Size"],
        links: [{ label: "📦 Đơn hàng của tôi", url: "/orders" }]
    },
    PAYMENT_HELP: {
        reply: "💳 **Hướng dẫn mua hàng & thanh toán:**\n\n1. **Chọn sản phẩm** → Chọn size, màu, số lượng\n2. **Thêm vào giỏ hàng** → Kiểm tra lại\n3. **Thanh toán:**\n   • **COD** (Thanh toán khi nhận hàng)\n   • **Chuyển khoản** ngân hàng\n4. **Xác nhận đặt hàng** → Chờ Admin duyệt\n\n📌 *Áp dụng mã Voucher (nếu có) ở bước thanh toán!*",
        suggestions: ["📦 Xem đơn hàng", "📏 Tính Size"],
        links: [{ label: "🛒 Giỏ hàng", url: "/cart" }]
    },
    COMPLAINT: {
        reply: "📞 **Gửi khiếu nại / góp ý:**\n\n1. Vào **Hồ sơ** → Mục **Khiếu nại**\n2. Nhấn **Gửi khiếu nại mới**\n3. Điền tiêu đề, nội dung chi tiết\n4. Gửi → Admin sẽ phản hồi sớm nhất\n\n💡 *Bạn sẽ nhận thông báo qua email khi Admin phản hồi!*",
        suggestions: ["📦 Xem đơn hàng", "🛒 Hướng dẫn mua hàng"],
        links: [{ label: "📝 Gửi khiếu nại", url: "/profile?tab=complaints" }]
    },
    NAVIGATION: {
        reply: "🧭 **Links nhanh trên website:**",
        suggestions: ["📏 Tính Size", "🔍 Tìm sản phẩm"],
        links: [
            { label: "🛒 Giỏ hàng", url: "/cart" },
            { label: "📦 Đơn hàng", url: "/orders" },
            { label: "👤 Hồ sơ cá nhân", url: "/profile" },
            { label: "🎫 Voucher", url: "/vouchers" }
        ]
    },
};

// ── PARSE SEARCH CRITERIA (Colors, Size, Season, Type) ────────
function parseQueryCriteria(message: string) {
    const raw = message.toLowerCase();
    const norm = removeDiacritics(raw);

    // 1. Trích xuất màu sắc (tránh trùng khớp với các từ động từ/danh từ khác như "tìm", "đồ")
    const colors: string[] = [];

    // Trắng
    if (/\b(trang|trang)\b/i.test(norm) || /\btrắng\b/i.test(raw)) colors.push('Trắng');
    // Đen
    if (/\b(den|den)\b/i.test(norm) || /\bđen\b/i.test(raw)) colors.push('Đen');
    // Đỏ (chỉ nhận "đỏ" hoặc "do" nếu đi kèm các từ chỉ sản phẩm/màu sắc)
    if (/\bđỏ\b/i.test(raw) || /(ao|quan|giay|dep|mau|màu|size)\s+do\b/i.test(norm)) colors.push('Đỏ');
    // Xanh
    if (/\b(xanh)\b/i.test(norm)) colors.push('Xanh');
    // Vàng
    if (/\b(vang|vang)\b/i.test(norm) || /\bvàng\b/i.test(raw)) colors.push('Vàng');
    // Hồng
    if (/\b(hong|hong)\b/i.test(norm) || /\bhồng\b/i.test(raw)) colors.push('Hồng');
    // Xám
    if (/\b(xam|xam)\b/i.test(norm) || /\bxám\b/i.test(raw)) colors.push('Xám');
    // Nâu
    if (/\b(nau|nau)\b/i.test(norm) || /\bnâu\b/i.test(raw)) colors.push('Nâu');
    // Cam
    if (/\b(cam)\b/i.test(norm)) colors.push('Cam');
    // Tím (tránh nhầm với động từ "tìm")
    if (/\btím\b/i.test(raw) || /(ao|quan|giay|dep|mau|màu|size)\s+tim\b/i.test(norm)) colors.push('Tím');
    // Navy
    if (/\bnavy\b/i.test(norm)) colors.push('Navy');
    // Be
    if (/\bbe\b/i.test(norm)) colors.push('Be');

    // 2. Trích xuất size quần áo
    let size: string | null = null;
    const sizeMatch = norm.match(/\bsize\s*([s|m|l|xl|2xl])\b/i) || raw.match(/\bsize\s*([s|m|l|xl|2xl])\b/i);
    if (sizeMatch && sizeMatch[1]) {
        size = sizeMatch[1].toUpperCase();
    } else {
        // Tìm size đứng một mình (hỗ trợ cả dấu ngoặc đơn)
        const words = norm.split(/[\s()]+/);
        const sizes = ['S', 'M', 'L', 'XL', '2XL'];
        for (const w of words) {
            const uw = w.toUpperCase();
            if (sizes.includes(uw)) {
                size = uw;
                break;
            }
        }
    }

    // 3. Trích xuất size giày (nếu không có size quần áo)
    if (!size) {
        const shoeMatch = norm.match(/\b(38|39|40|41|42|43|44)\b/);
        if (shoeMatch && shoeMatch[1]) {
            size = shoeMatch[1];
        }
    }

    // 4. Trích xuất mùa
    let season: 'summer' | 'winter' | null = null;
    if (norm.includes('mua he') || norm.includes(' he')) {
        season = 'summer';
    } else if (norm.includes('mua dong') || norm.includes(' dong')) {
        season = 'winter';
    }

    // 5. Trích xuất loại sản phẩm
    let type: 'ao' | 'quan' | 'giay' | 'mu' | 'balo' | 'tui' | 'tat' | 'binh_nuoc' | null = null;
    if (/\b(mu|non|cap|hat)\b/i.test(norm)) {
        type = 'mu';
    } else if (/\b(balo|backpack)\b/i.test(norm)) {
        type = 'balo';
    } else if (/\b(tui)\b/i.test(norm)) {
        type = 'tui';
    } else if (/\b(tat|vo|socks)\b/i.test(norm)) {
        type = 'tat';
    } else if (/\b(binh nuoc|binh)\b/i.test(norm)) {
        type = 'binh_nuoc';
    } else if (/\b(ao|polo|khoac|thun|hoodie)\b/i.test(norm)) {
        type = 'ao';
    } else if (/\b(quan|short|jogger)\b/i.test(norm)) {
        type = 'quan';
    } else if (/\b(giay|dep|sneaker)\b/i.test(norm)) {
        type = 'giay';
    }

    return { colors, size, season, type };
}

// ── PRODUCT SEARCH (DB Query + Gemini Recommendation) ─────────
async function searchProducts(message: string): Promise<{
    reply: string;
    products: any[];
    suggestions: string[];
    mode: string;
}> {
    const { colors, size, season, type } = parseQueryCriteria(message);
    const lower = message.toLowerCase();

    // 1. Query sản phẩm Active từ database
    let query = supabaseClient
        .from('products')
        .select(`
            id,
            name,
            base_price,
            brand,
            category_id,
            categories (
                id,
                name
            ),
            product_variants (
                size,
                color,
                stock_quantity
            ),
            product_images (
                image_url,
                is_main
            )
        `)
        .is('deleted_at', null)
        .eq('status', 'Active');

    // Lọc thô theo mùa trước để tối ưu database
    if (season === 'summer') {
        query = query.in('category_id', [5, 6, 10]);
    } else if (season === 'winter') {
        query = query.in('category_id', [7, 9, 11]);
    }

    const { data: allProducts, error } = await query;
    if (error || !allProducts || allProducts.length === 0) {
        return {
            reply: "Dạ hiện tại không tìm thấy sản phẩm nào phù hợp yêu cầu của bạn. Bạn vui lòng chọn mẫu khác nhé!",
            products: [], suggestions: ["📏 Tính Size", "🛍️ Sản phẩm mới"], mode: "local"
        };
    }

    // 2. Lọc sản phẩm cực kỳ nghiêm ngặt theo tiêu chí tìm kiếm
    const filteredProducts = allProducts.filter(p => {
        const normName = removeDiacritics(p.name.toLowerCase());
        const variants = p.product_variants || [];

        // A. Lọc theo màu sắc (nếu có yêu cầu màu)
        if (colors.length > 0) {
            const hasColorVariant = variants.some((v: any) => colors.includes(v.color));
            const nameHasColor = colors.some(col => normName.includes(removeDiacritics(col.toLowerCase())));
            if (!hasColorVariant && !nameHasColor) {
                return false;
            }
        }

        // B. Lọc theo size (nếu có yêu cầu size)
        if (size) {
            const hasSizeVariant = variants.some((v: any) => String(v.size).toUpperCase() === size.toUpperCase() && (v.stock_quantity || 0) > 0);
            if (!hasSizeVariant) {
                return false;
            }
        }

        // C. Lọc theo loại sản phẩm (nếu có)
        if (type) {
            let isMatchingType = false;
            if (type === 'ao') {
                isMatchingType = normName.includes('ao') || normName.includes('polo') || normName.includes('khoac') || normName.includes('thun') || normName.includes('hoodie') || [1, 5, 6, 7, 8, 9, 31, 35].includes(p.category_id);
            } else if (type === 'quan') {
                isMatchingType = normName.includes('quan') || normName.includes('short') || normName.includes('jogger') || [2, 10, 12, 13].includes(p.category_id);
            } else if (type === 'giay') {
                isMatchingType = normName.includes('giay') || normName.includes('dep') || normName.includes('sneaker') || [3, 15, 16, 17, 18, 19, 37].includes(p.category_id);
            } else if (type === 'mu') {
                isMatchingType = /\b(mu|non|cap|hat)\b/i.test(normName) || p.category_id === 23;
            } else if (type === 'balo') {
                isMatchingType = /\b(balo|backpack)\b/i.test(normName) || p.category_id === 20;
            } else if (type === 'tui') {
                isMatchingType = /\b(tui)\b/i.test(normName) || p.category_id === 21;
            } else if (type === 'tat') {
                isMatchingType = /\b(tat|vo|socks)\b/i.test(normName) || p.category_id === 22;
            } else if (type === 'binh_nuoc') {
                isMatchingType = /\b(binh|binh nuoc)\b/i.test(normName) || p.category_id === 24;
            }
            if (!isMatchingType) {
                return false;
            }
        }

        return true;
    });

    const typeLabel = type ? (
        type === 'ao' ? 'Áo' :
            type === 'quan' ? 'Quần' :
                type === 'giay' ? 'Giày' :
                    type === 'mu' ? 'Mũ/Nón' :
                        type === 'balo' ? 'Balo' :
                            type === 'tui' ? 'Túi' :
                                type === 'tat' ? 'Tất/Vớ' :
                                    type === 'binh_nuoc' ? 'Bình nước' : ''
    ) : '';

    // Nếu không tìm thấy sản phẩm nào khớp tiêu chí tối thiểu
    if (filteredProducts.length === 0) {
        return {
            reply: `Dạ hiện tại SportStride chưa có sản phẩm nào phù hợp với yêu cầu của bạn (${[
                type ? `Loại: ${typeLabel}` : '',
                colors.length > 0 ? `Màu: ${colors.join(', ')}` : '',
                size ? `Size: ${size}` : ''
            ].filter(Boolean).join(', ')}). Bạn vui lòng tham khảo mẫu khác nhé!`,
            products: [],
            suggestions: ["📏 Tính Size", "🛍️ Sản phẩm mới"],
            mode: "local"
        };
    }

    // 3. Tính điểm độ phù hợp từ khóa chung cho các sản phẩm đã lọc
    const scoredProducts = filteredProducts.map(p => {
        let matchScore = 0;
        const normName = removeDiacritics(p.name.toLowerCase());
        const categoryName = removeDiacritics(((Array.isArray(p.categories) ? p.categories[0]?.name : (p.categories as any)?.name) || '').toLowerCase());

        const stopwords = ['tôi', 'muốn', 'cần', 'cho', 'của', 'có', 'một', 'và', 'với', 'để', 'được', 'bạn', 'này', 'theo', 'cái', 'hãy', 'xem', 'tìm', 'mua', 'gợi', 'ý'];
        const words = removeDiacritics(lower).split(/\s+/).filter(w => w.length > 1 && !stopwords.includes(w));
        for (const w of words) {
            const wordRegex = new RegExp(`\\b${w}\\b`, 'i');
            if (wordRegex.test(normName) || wordRegex.test(categoryName)) {
                matchScore += 5;
            }
        }

        return { ...p, matchScore };
    });

    // Sắp xếp theo độ phù hợp từ cao xuống thấp và lấy tối đa 10 sản phẩm candidates
    const finalCandidates = scoredProducts
        .sort((a, b) => b.matchScore - a.matchScore)
        .slice(0, 10);

    // 4. Format danh sách candidates thành chuỗi nén gửi Gemini
    const compactDBText = finalCandidates.map(p => {
        const colorsStr = Array.from(new Set((p.product_variants || []).map((v: any) => v.color).filter(Boolean))).join(',');
        const sizesStr = Array.from(new Set((p.product_variants || []).map((v: any) => v.size).filter(Boolean))).join(',');
        return `${p.id}|${p.name}|${p.base_price}đ|${p.brand || '-'}|Màu:${colorsStr || '-'}|Size:${sizesStr || '-'}`;
    }).join('\n');

    // 5. Gọi Gemini để chọn lựa chính xác sản phẩm phù hợp
    const apiKeysPool = (process.env.GEMINI_API_KEYS || process.env.GEMINI_API_KEY || "")
        .split(",")
        .map(k => k.trim())
        .filter(k => k.length > 0);

    if (apiKeysPool.length > 0) {
        try {
            let geminiResult: string | null = null;
            let lastError: any = null;

            for (const key of apiKeysPool) {
                try {
                    geminiResult = await callGeminiForRecommendation(key, message, compactDBText);
                    if (geminiResult) break;
                } catch (err: any) {
                    lastError = err;
                    console.warn(`⚠️ API Key ${key.substring(0, 10)}... bị lỗi: ${err.message || err}. Đang thử Key tiếp theo...`);
                }
            }

            if (!geminiResult && lastError) {
                throw lastError;
            }
            if (geminiResult) {
                const idMatch = geminiResult.match(/\[RECOMMENDED_IDS:\s*([\d\s,]+)\]/i);
                let recommendedIds: number[] = [];

                if (idMatch && idMatch[1]) {
                    recommendedIds = idMatch[1].split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id));
                }

                const cleanReply = geminiResult.replace(/\[RECOMMENDED_IDS:\s*[\d\s,]+\]/i, '').trim();

                // Lấy chi tiết thông tin các sản phẩm được Gemini chọn
                let recommendedProducts = finalCandidates.filter(p => recommendedIds.includes(p.id));

                // Nếu Gemini không trả về ID hợp lệ, dùng các candidates hàng đầu (tối đa 5 sản phẩm)
                if (recommendedProducts.length === 0) {
                    recommendedProducts = finalCandidates.slice(0, 5);
                }

                const formattedProducts = recommendedProducts.map(p => ({
                    id: p.id,
                    name: p.name,
                    brand: p.brand,
                    price: p.base_price,
                    image_url: p.product_images?.find((img: any) => img.is_main)?.image_url || p.product_images?.[0]?.image_url || ""
                }));

                return {
                    reply: cleanReply,
                    products: formattedProducts,
                    suggestions: ["📏 Tính Size", "🛍️ Xem thêm sản phẩm", "📞 Liên hệ hỗ trợ"],
                    mode: "gemini"
                };
            }
        } catch (err: any) {
            console.warn("⚠️ Gemini AI lỗi, chuyển sang local fallback:", err.message);
        }
    }

    // 6. Fallback Local (chỉ lấy tối đa 5 sản phẩm khớp thực sự)
    const fallbackProducts = finalCandidates.slice(0, 5);
    const formattedFallback = fallbackProducts.map(p => ({
        id: p.id,
        name: p.name,
        brand: p.brand,
        price: p.base_price,
        image_url: p.product_images?.find((img: any) => img.is_main)?.image_url || p.product_images?.[0]?.image_url || ""
    }));

    const reply = `🔍 Dựa trên yêu cầu của bạn (${[
        type ? `Loại: ${typeLabel}` : '',
        colors.length > 0 ? `Màu: ${colors.join(', ')}` : '',
        size ? `Size: ${size}` : ''
    ].filter(Boolean).join(', ')}), đây là các sản phẩm phù hợp nhất tại cửa hàng:`;

    return {
        reply,
        products: formattedFallback,
        suggestions: ["📏 Tính Size", "☀️ Đồ thể thao Mùa Hè", "❄️ Đồ thể thao Mùa Đông"],
        mode: "local"
    };
}

// ── GEMINI AI CALL (tối ưu hóa token tuyệt đối) ────────────────
async function callGeminiForRecommendation(apiKey: string, userMessage: string, compactProductsText: string): Promise<string | null> {
    const sysInstruction = `Bạn là SportStride AI - trợ lý mua sắm thể thao. Nhiệm vụ:
1. Phân tích nhu cầu khách hàng từ câu hỏi.
2. Chọn từ 1 đến tối đa 5 sản phẩm phù hợp nhất từ danh sách bên dưới. CHỈ chọn những sản phẩm đáp ứng ĐÚNG và ĐỦ các tiêu chí (màu sắc, loại áo/quần/giày, mùa) được yêu cầu. Nếu chỉ có 1, 2 hoặc 3 sản phẩm khớp thì CHỈ trả về bấy nhiêu đó. Tuyệt đối KHÔNG chọn thêm sản phẩm khác loại/khác màu để cho đủ số lượng 5.
3. Trả lời bằng tiếng Việt ngắn gọn, thân thiện (2-3 câu).
4. QUAN TRỌNG: Cuối câu trả lời, ghi chính xác dòng: [RECOMMENDED_IDS: id1, id2...] (chỉ chứa các số ID sản phẩm bạn chọn được phân tách bằng dấu phẩy). Không bịa ID khác ngoài danh sách.

Danh sách sản phẩm gợi ý (ID|Tên|Giá|Hãng|Màu|Size):
${compactProductsText}`;

    const body = {
        contents: [{ parts: [{ text: userMessage }] }],
        systemInstruction: { parts: [{ text: sysInstruction }] },
        generationConfig: { maxOutputTokens: 250, temperature: 0.3 }
    };

    const isAQ = apiKey.startsWith('AQ.');
    const url = isAQ
        ? 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent'
        : `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (isAQ) headers['x-goog-api-key'] = apiKey;

    const response = await fetch(url, { method: 'POST', headers, body: JSON.stringify(body) });

    if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Gemini API Error ${response.status}: ${errText.substring(0, 200)}`);
    }

    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || null;
}

// ── MAIN HANDLER ─────────────────────────────────────────────
export const handleChatbotMessage = async (req: Request, res: Response): Promise<any> => {
    try {
        const { message } = req.body;
        if (!message) {
            return res.status(400).json({ message: "Thiếu nội dung tin nhắn." });
        }

        const intent = detectIntent(message);
        console.log(`💬 Chatbot [${intent}]: "${message.substring(0, 50)}..."`);

        // ── Tier 1: Local Logic (0 token) ──
        if (intent === 'SIZE_GUIDE') {
            const sizeResult = calculateSize(message);
            return res.status(200).json({
                mode: "local", intent,
                reply: sizeResult.reply,
                products: [],
                suggestions: sizeResult.suggestions,
                links: []
            });
        }

        if (intent in LOCAL_RESPONSES) {
            const local = LOCAL_RESPONSES[intent as keyof typeof LOCAL_RESPONSES];
            if (local) {
                return res.status(200).json({
                    mode: "local", intent,
                    reply: local.reply,
                    products: [],
                    suggestions: local.suggestions,
                    links: local.links || []
                });
            }
        }

        // ── Tier 2: Smart Product Search (DB + optional Gemini) ──
        if (intent === 'PRODUCT_SEARCH' || intent === 'UNKNOWN') {
            const result = await searchProducts(message);
            return res.status(200).json({
                mode: result.mode, intent,
                reply: result.reply,
                products: result.products,
                suggestions: result.suggestions,
                links: []
            });
        }

        // Fallback cuối cùng
        return res.status(200).json({
            mode: "local", intent: "UNKNOWN",
            reply: "Xin lỗi, mình chưa hiểu rõ ý bạn. Bạn có thể thử:\n• Tìm sản phẩm (VD: *tìm áo trắng*)\n• Tính size (VD: *cao 170 nặng 65*)\n• Hỏi về đơn hàng, thanh toán, khiếu nại",
            products: [],
            suggestions: ["📏 Tính Size", "🔍 Tìm giày chạy bộ", "📦 Xem đơn hàng", "📞 Liên hệ hỗ trợ"],
            links: []
        });

    } catch (error: any) {
        console.error("Lỗi API Chatbot:", error);
        res.status(500).json({ message: "Lỗi hệ thống khi kết nối trợ lý AI", errorDetails: error.message || error });
    }
};
