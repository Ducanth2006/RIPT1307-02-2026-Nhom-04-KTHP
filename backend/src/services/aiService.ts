import { GoogleGenAI } from "@google/genai";
import supabaseClient from "../config/supabase";

const botId = Number(process.env.BOT_USER_ID || "999999");

// Danh sách các API Keys từ biến môi trường (hỗ trợ phân tách bằng dấu phẩy)
const apiKeysPool: string[] = (() => {
  const keysStr = process.env.GEMINI_API_KEYS || process.env.GEMINI_API_KEY || "";
  return keysStr
    .split(",")
    .map(k => k.trim())
    .filter(k => k.length > 0);
})();

let currentKeyIndex = 0;

/**
 * Lấy đối tượng GoogleGenAI client với API Key hiện tại
 */
function getAIClient(): { ai: GoogleGenAI; key: string } {
  if (apiKeysPool.length === 0) {
    throw new Error("Không tìm thấy GEMINI_API_KEY hoặc GEMINI_API_KEYS trong file .env");
  }
  const key = apiKeysPool[currentKeyIndex];
  if (!key) {
    throw new Error("API Key tại index hiện tại không hợp lệ");
  }
  return { ai: new GoogleGenAI({ apiKey: key }), key };
}

/**
 * Xoay vòng chuyển sang API Key tiếp theo khi gặp giới hạn hạn mức (Rate limit)
 */
function rotateApiKey() {
  if (apiKeysPool.length <= 1) return;
  const oldIndex = currentKeyIndex;
  currentKeyIndex = (currentKeyIndex + 1) % apiKeysPool.length;
  console.warn(`⚠️ Đạt giới hạn hạn mức (Rate Limit) cho API Key index ${oldIndex}. Đang xoay vòng sang API Key dự phòng index ${currentKeyIndex}.`);
}

/**
 * Thực thi lệnh gọi API với cơ chế tự động xoay vòng Key khi gặp lỗi Rate Limit (429 / Resource Exhausted)
 */
async function executeWithRetry<T>(fn: (ai: GoogleGenAI) => Promise<T>, maxRetries = apiKeysPool.length): Promise<T> {
  let attempts = 0;
  while (attempts < maxRetries) {
    const { ai } = getAIClient();
    try {
      return await fn(ai);
    } catch (err: any) {
      const errorMessage = (err?.message || String(err)).toLowerCase();
      // Nhận diện lỗi Rate limit (429, Resource exhausted, Quota exceeded)
      const isRateLimit = 
        errorMessage.includes("429") || 
        errorMessage.includes("exhausted") || 
        errorMessage.includes("quota") ||
        errorMessage.includes("limit");

      if (isRateLimit && apiKeysPool.length > 1) {
        rotateApiKey();
        attempts++;
      } else {
        throw err;
      }
    }
  }
  throw new Error("Tất cả các API Keys trong danh sách cấu hình đều đã vượt quá giới hạn cuộc gọi.");
}

/**
 * Đảm bảo người dùng ảo đại diện cho AI Bot (Bot User) tồn tại trong Database
 */
export async function ensureBotUserExists() {
  try {
    const { data: existingBot, error: fetchError } = await supabaseClient
      .from("users")
      .select("id")
      .eq("id", botId)
      .maybeSingle();

    if (fetchError) {
      console.error("Lỗi khi kiểm tra Bot User:", fetchError);
      return;
    }

    if (!existingBot) {
      console.log(`🤖 Bot User #${botId} không tồn tại. Tiến hành khởi tạo tự động...`);
      const { error: insertError } = await supabaseClient
        .from("users")
        .insert([
          {
            id: botId,
            email: "bot@prosports.com",
            password_hash: "$2a$10$dummyhashplaceholderforbotsecurity",
            full_name: "Trợ lý AI ProSports",
            role: "Staff",
            status: "Active",
            avatar: "https://ui-avatars.com/api/?name=AI&background=af101a&color=fff"
          }
        ]);

      if (insertError) {
        console.error("Không thể khởi tạo Bot User:", insertError);
      } else {
        console.log(`🤖 Khởi tạo Bot User #${botId} thành công.`);
      }
    }
  } catch (err) {
    console.error("Lỗi trong quá trình đảm bảo Bot User tồn tại:", err);
  }
}

function removeDiacritics(str: string): string {
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D');
}

function parseQueryCriteria(message: string) {
  const raw = message.toLowerCase();
  const norm = removeDiacritics(raw);

  const colors: string[] = [];
  if (/\b(trang|trang)\b/i.test(norm) || /\btrắng\b/i.test(raw)) colors.push('Trắng');
  if (/\b(den|den)\b/i.test(norm) || /\bđen\b/i.test(raw)) colors.push('Đen');
  if (/\bđỏ\b/i.test(raw) || /(ao|quan|giay|dep|mau|màu|size)\s+do\b/i.test(norm)) colors.push('Đỏ');
  if (/\b(xanh)\b/i.test(norm)) colors.push('Xanh');
  if (/\b(vang|vang)\b/i.test(norm) || /\bvàng\b/i.test(raw)) colors.push('Vàng');
  if (/\b(hong|hong)\b/i.test(norm) || /\bhồng\b/i.test(raw)) colors.push('Hồng');
  if (/\b(xam|xam)\b/i.test(norm) || /\bxám\b/i.test(raw)) colors.push('Xám');
  if (/\b(nau|nau)\b/i.test(norm) || /\bnâu\b/i.test(raw)) colors.push('Nâu');
  if (/\b(cam)\b/i.test(norm)) colors.push('Cam');
  if (/\btím\b/i.test(raw) || /(ao|quan|giay|dep|mau|màu|size)\s+tim\b/i.test(norm)) colors.push('Tím');
  if (/\bnavy\b/i.test(norm)) colors.push('Navy');
  if (/\bbe\b/i.test(norm)) colors.push('Be');

  let size: string | null = null;
  const sizeMatch = norm.match(/\bsize\s*([s|m|l|xl|2xl])\b/i) || raw.match(/\bsize\s*([s|m|l|xl|2xl])\b/i);
  if (sizeMatch && sizeMatch[1]) {
    size = sizeMatch[1].toUpperCase();
  } else {
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

  if (!size) {
    const shoeMatch = norm.match(/\b(38|39|40|41|42|43|44)\b/);
    if (shoeMatch && shoeMatch[1]) {
      size = shoeMatch[1];
    }
  }

  let type: 'ao' | 'quan' | 'giay' | null = null;
  if (/\b(ao|polo|khoac|thun|hoodie)\b/i.test(norm)) {
    type = 'ao';
  } else if (/\b(quan|short|jogger)\b/i.test(norm)) {
    type = 'quan';
  } else if (/\b(giay|dep|sneaker)\b/i.test(norm)) {
    type = 'giay';
  }

  return { colors, size, type };
}

/**
 * Sinh vector embedding (768 chiều) từ câu hỏi của khách hàng bằng gemini-embedding-001
 */
async function getEmbedding(text: string): Promise<number[] | null> {
  if (apiKeysPool.length === 0) return null;
  try {
    return await executeWithRetry(async (ai) => {
      const response = await ai.models.embedContent({
        model: "gemini-embedding-001",
        contents: text,
        config: {
          outputDimensionality: 768
        }
      });
      const embeddings = response.embeddings;
      if (embeddings && embeddings.length > 0 && embeddings[0] && embeddings[0].values) {
        return embeddings[0].values;
      }
      return null;
    });
  } catch (err: any) {
    console.warn("Không thể sinh embedding từ Gemini API:", err?.message || err);
    return null;
  }
}

/**
 * Tìm kiếm các sản phẩm trong DB khớp với từ khóa hoặc ngữ nghĩa của khách hàng để làm context
 */
async function getRelevantProductsContext(userMessage: string): Promise<string> {
  // 1. Thử sử dụng Semantic Search (pgvector) trước nếu được hỗ trợ
  const embedding = await getEmbedding(userMessage);
  if (embedding) {
    try {
      const { data: semanticProducts, error: rpcError } = await supabaseClient
        .rpc("match_products", {
          query_embedding: embedding,
          match_threshold: 0.5,
          match_count: 5
        });

      if (!rpcError && semanticProducts && semanticProducts.length > 0) {
        console.log("🚀 Tìm kiếm ngữ nghĩa (Semantic Search) thành công!");
        return (semanticProducts as any[]).map((p: any) => `- [MÃ SẢN PHẨM: ${p.id}] ${p.name} (${p.brand}): ${new Intl.NumberFormat("vi-VN").format(p.base_price)}đ. mô tả: ${p.description || "Đồ thể thao cao cấp"}`).join("\n");
      }
    } catch (dbErr: any) {
      console.warn("Bỏ qua lỗi truy cập pgvector, chuyển sang tìm kiếm bộ lọc:", dbErr?.message || dbErr);
    }
  }

  // 2. Fallback: Lấy toàn bộ sản phẩm Active và thực hiện lọc thông minh phía ứng dụng
  console.log("⚠️ Đang chạy Bộ lọc Tìm kiếm Thông minh (Smart Memory Filter)...");
  try {
    const { data: allProducts, error } = await supabaseClient
      .from('products')
      .select(`
        id,
        name,
        base_price,
        brand,
        category_id,
        description,
        categories (
          id,
          name
        ),
        product_variants (
          size,
          color,
          stock_quantity
        )
      `)
      .is('deleted_at', null)
      .eq('status', 'Active');

    if (error || !allProducts || allProducts.length === 0) {
      return "";
    }

    const { colors, size, type } = parseQueryCriteria(userMessage);

    const filteredProducts = allProducts.filter(p => {
      const normName = removeDiacritics(p.name.toLowerCase());
      const normDesc = p.description ? removeDiacritics(p.description.toLowerCase()) : '';
      const variants = p.product_variants || [];

      // A. Lọc theo màu sắc (nếu có yêu cầu màu)
      if (colors.length > 0) {
        const hasColorVariant = variants.some((v: any) => colors.includes(v.color));
        const nameOrDescHasColor = colors.some(col => {
          const normCol = removeDiacritics(col.toLowerCase());
          return normName.includes(normCol) || normDesc.includes(normCol);
        });
        if (!hasColorVariant && !nameOrDescHasColor) {
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
        }
        if (!isMatchingType) {
          return false;
        }
      }

      return true;
    });

    // Nếu lọc hết không còn sản phẩm nào, dùng fallback toàn bộ sản phẩm để tính điểm
    const candidates = filteredProducts.length > 0 ? filteredProducts : allProducts;

    const scoredProducts = candidates.map(p => {
      let matchScore = 0;
      const normName = removeDiacritics(p.name.toLowerCase());
      const normDesc = p.description ? removeDiacritics(p.description.toLowerCase()) : '';
      const categoryName = removeDiacritics(((Array.isArray(p.categories) ? p.categories[0]?.name : (p.categories as any)?.name) || '').toLowerCase());

      const stopwords = ['tôi', 'muốn', 'cần', 'cho', 'của', 'có', 'một', 'và', 'với', 'để', 'được', 'bạn', 'này', 'theo', 'cái', 'hãy', 'xem', 'tìm', 'mua', 'gợi', 'ý', 'áo', 'quần', 'giày'];
      const words = removeDiacritics(userMessage.toLowerCase()).split(/\s+/).filter(w => w.length > 1 && !stopwords.includes(w));
      for (const w of words) {
        const wordRegex = new RegExp(`\\b${w}\\b`, 'i');
        if (wordRegex.test(normName) || wordRegex.test(categoryName) || wordRegex.test(normDesc)) {
          matchScore += 5;
        }
      }

      return { ...p, matchScore };
    });

    const finalCandidates = scoredProducts
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, 5);

    return finalCandidates.map(p => {
      const colorsStr = Array.from(new Set((p.product_variants || []).map((v: any) => v.color).filter(Boolean))).join(', ');
      const sizesStr = Array.from(new Set((p.product_variants || []).map((v: any) => v.size).filter(Boolean))).join(', ');
      return `- [MÃ SẢN PHẨM: ${p.id}] Tên: ${p.name}, Hãng: ${p.brand || 'Khác'}, Giá: ${new Intl.NumberFormat("vi-VN").format(p.base_price)}đ, Chất liệu/Mô tả: ${p.description || 'Đồ thể thao ProSports'}, Màu sắc: ${colorsStr || 'Đa màu'}, Size: ${sizesStr || 'Đủ size'}`;
    }).join('\n');

  } catch (error) {
    console.error("Lỗi lấy context sản phẩm:", error);
    return "";
  }
}

export async function generateBotReply(
  userMessage: string,
  history: any[] = [],
  activeProductContext: string = ""
): Promise<{ text: string, recommendedProductId: number | null }> {
  if (apiKeysPool.length === 0) {
    console.warn("Cảnh báo: Không có GEMINI_API_KEY hoặc GEMINI_API_KEYS nào được cấu hình.");
    return {
      text: "Cảm ơn bạn đã nhắn tin! Nhân viên hỗ trợ sẽ kết nối hỗ trợ bạn ngay.",
      recommendedProductId: null
    };
  }

  try {
    // Đảm bảo Bot User tồn tại
    await ensureBotUserExists();

    // Tận dụng lịch sử để tìm kiếm ngữ cảnh sản phẩm chính xác hơn
    let searchQuery = userMessage;
    if (history && history.length > 0) {
      // Ghép 4 tin nhắn gần nhất để tìm đúng sản phẩm đang nói dở
      const recentTexts = history
        .slice(-4)
        .map((h: any) => {
          if (h.message_type === 'product' && h.product) {
            return h.product.name;
          }
          return h.content || "";
        })
        .join(" ");
      searchQuery = `${recentTexts} ${userMessage}`;
    }

    // Lấy ngữ cảnh sản phẩm
    const productContext = await getRelevantProductsContext(searchQuery);

    const systemInstruction = `
# PERSONA (TÍNH CÁCH THƯƠNG HIỆU)
Bạn là "Trợ lý AI ProSports" - đại diện tư vấn bán hàng trực tuyến xuất sắc của thương hiệu đồ thể thao ProSports.
- Giọng điệu: Thân thiện, nhiệt tình, chuyên nghiệp, xưng hô "Shop" - "Bạn".
- Luôn trả lời ngắn gọn, tập trung thẳng vào nhu cầu mua sắm của khách.

# GUARDRAILS (HÀNH LANG AN TOÀN & GIỚI HẠN)
1. Tuyệt đối KHÔNG khuyên khách hàng mua đồ của thương hiệu đối thủ khác ngoài danh sách.
2. Không bịa đặt hoặc tự nghĩ ra các chương trình khuyến mãi không có thực.
3. Nếu khách hỏi các vấn đề chính trị, tôn giáo, xã hội hoặc hỏi linh tinh, hãy khéo léo từ chối và hướng cuộc trò chuyện quay lại các sản phẩm của shop.
4. Khi khách hàng bày tỏ sự không hài lòng, khiếu nại hoặc muốn gặp nhân viên, hãy gửi lời xin lỗi và nói: "Yêu cầu của bạn đã được chuyển đến nhân viên trực tuyến, vui lòng chờ trong giây lát để chúng tôi kết nối hỗ trợ bạn trực tiếp."
5. KHI KHÁCH HỎI NHIỀU CÂU TRONG MỘT TIN NHẮN: Trả lời tuần tự từng ý, mỗi ý 1-2 câu ngắn gọn. KHÔNG dùng tiêu đề "Chào bạn! Shop sẽ giải đáp từng câu hỏi..." — bắt đầu trả lời ngay vào nội dung, dùng số thứ tự nếu cần. Ưu tiên tư vấn size và gợi ý sản phẩm cụ thể kèm thẻ sản phẩm.

# KNOWLEDGE BASE (TRUNG TÂM KIẾN THỨC)

## 1. Bảng size quần áo chuẩn:
- Size S: Cao 1m50 - 1m60 | Nặng 45kg - 55kg
- Size M: Cao 1m60 - 1m68 | Nặng 55kg - 65kg
- Size L: Cao 1m68 - 1m75 | Nặng 65kg - 75kg
- Size XL: Cao 1m75 - 1m82 | Nặng 75kg - 85kg
- Size XXL: Cao trên 1m80 | Nặng trên 85kg
* Lưu ý: Nếu khách ở rìa giữa hai size, khuyên chọn size lớn hơn nếu thích thoải mái, hoặc nhỏ hơn nếu muốn ôm dáng (Athletic-fit). Chủ động hỏi chiều cao & cân nặng nếu khách chưa cung cấp.

## 2. Chất liệu & Bảo quản:
- Áo thun/Đồ tập: Thun lạnh thể thao cao cấp (Polyester + Spandex co giãn 4 chiều). Đặc tính: siêu thoáng mát, thấm hút mồ hôi tốt, không phai màu hay xù lông khi giặt.
- Quần Short/Quần gió: Vải dù gió micro nhẹ tênh, nhanh khô, chống cản gió nhẹ.
- Hướng dẫn giặt: Nên giặt bằng nước lạnh, không dùng chất tẩy mạnh, tránh phơi trực tiếp dưới ánh nắng gay gắt để bảo vệ sợi vải thun co giãn.

## 3. Tư vấn phối đồ (Mix & Match):
- Khi khách hỏi phối đồ thế nào: Gợi ý các cách kết hợp thể thao năng động. Ví dụ: Áo thun/Polo phối với Quần Short Gió hoặc Quần Jogger thun; Giày sneaker phối với tất cổ ngắn và bộ đồ tập. Tạo vẻ ngoài khỏe khoắn, hiện đại.

## 4. Chính sách bán hàng:
- Phí vận chuyển: Đồng giá ship 30.000đ toàn quốc. Miễn phí vận chuyển cho tất cả các đơn hàng từ 500.000đ trở lên.
- Đổi trả: Hỗ trợ đổi size hoặc đổi mẫu MIỄN PHÍ tận nhà trong vòng 7 ngày kể từ khi nhận hàng.

# SẢN PHẨM KHÁCH HÀNG ĐANG XEM (NGỮ CẢNH TRANG HIỆN TẠI)
${activeProductContext || "Không có thông tin sản phẩm khách đang xem cụ thể."}

*LƯU Ý QUAN TRỌNG: Nếu câu hỏi của khách hàng chứa các đại từ chỉ định/ám chỉ như "áo này", "quần này", "mẫu này", "đồ này", "mô tả", "chất liệu", "giá cả", "phối đồ", hãy ngầm hiểu khách hàng đang hỏi về "SẢN PHẨM KHÁCH HÀNG ĐANG XEM" được mô tả ở trên để trả lời chính xác, thay vì tư vấn chung chung.*

# CONTEXT (DANH SÁCH SẢN PHẨM KHỚP TRONG DB)
Dưới đây là danh sách sản phẩm thực tế đang bán tại cửa hàng kèm theo mã sản phẩm:
${productContext || "Hiện tại cửa hàng có đa dạng giày đá bóng, áo bóng đá và đồ tập thể thao cao cấp."}

# FEW-SHOT EXAMPLES (VÍ DỤ MẪU HỘI THOẠI)

## Ví dụ 1: Khách hỏi tư vấn size áo
Khách: "Shop ơi mình cao 1m70 nặng 70kg mặc size gì vừa?"
Model: "Chào bạn! Với chiều cao 1m70 và nặng 70kg, bạn mặc size L là vừa vặn và thoải mái nhất nhé ạ. Bạn đang quan tâm đến mẫu áo thun hay quần tập thể thao để Shop giới thiệu cụ thể hơn cho bạn nè?"

## Ví dụ 2: Khách hỏi chất liệu và muốn xem áo Puma
Khách: "Áo Puma vải gì thế shop? Có mát không?"
Model: "Dạ áo Puma bên mình làm bằng chất liệu thun lạnh thể thao cao cấp (Polyester + Spandex) co giãn 4 chiều cực tốt, thấm hút mồ hôi hiệu quả và sờ mát tay lắm ạ! Bạn có thể tham khảo mẫu này đang rất hot của shop: [RECOMMEND: 45]"

## Ví dụ 3: Khách hỏi về chất liệu sản phẩm đang xem
Khách: "mẫu này vải gì thế shop?" (Khi đang xem sản phẩm có mô tả chất liệu thun lạnh)
Model: "Dạ sản phẩm bạn đang xem được làm bằng chất liệu thun lạnh cao cấp, có độ co giãn 4 chiều tuyệt vời và thấm hút mồ hôi cực tốt ạ. Rất phù hợp cho các hoạt động thể thao hay mặc năng động hàng ngày đó ạ!"

# QUY ĐỊNH GỢI Ý SẢN PHẨM (MẮT XÍCH QUAN TRỌNG)
Nếu bạn đề xuất hoặc tư vấn cụ thể một sản phẩm nào đó trong danh sách có sẵn ở phần CONTEXT cho khách hàng, bạn phải gọi công cụ (tool) \`recommend_product\` và truyền đúng ID của sản phẩm đó.
Chỉ được chọn mã sản phẩm thực tế có trong danh sách CONTEXT ở trên. Không tự ý bịa đặt mã sản phẩm không tồn tại.
`;

    // Định nghĩa công cụ (tool) gửi card sản phẩm
    const recommendProductDeclaration: any = {
      name: "recommend_product",
      description: "Gửi thẻ sản phẩm cụ thể cho khách hàng khi họ quan tâm hoặc muốn xem sản phẩm. Chỉ sử dụng ID sản phẩm thực tế có trong danh sách CONTEXT.",
      parameters: {
        type: "object",
        properties: {
          productId: { type: "integer", description: "ID của sản phẩm cần gợi ý" }
        },
        required: ["productId"]
      }
    };

    // Map history to native Gemini contents (alternating user and model roles)
    const contents: any[] = [];

    if (history && history.length > 0) {
      for (const msg of history) {
        const isBot = msg.sender_id === botId;
        const role = isBot ? "model" : "user";
        
        let textContent = "";
        if (msg.message_type === 'product' && msg.product) {
          textContent = `[Hệ thống gửi thẻ sản phẩm: ${msg.product.name} (Giá: ${new Intl.NumberFormat("vi-VN").format(msg.product.base_price)}đ) của hãng ${msg.product.brand}]`;
        } else {
          textContent = msg.content || "";
        }

        if (textContent.trim()) {
          const lastContent = contents[contents.length - 1];
          if (lastContent && lastContent.role === role) {
            lastContent.parts[0].text += `\n${textContent}`;
          } else {
            contents.push({
              role: role,
              parts: [{ text: textContent }]
            });
          }
        }
      }
    }

    // Cuối cùng thêm tin nhắn hiện tại của khách hàng
    const lastContent = contents[contents.length - 1];
    if (lastContent && lastContent.role === "user") {
      lastContent.parts[0].text += `\n${userMessage}`;
    } else {
      contents.push({
        role: "user",
        parts: [{ text: userMessage }]
      });
    }

    // Thực hiện gọi API sinh nội dung qua cơ chế xoay vòng Key dự phòng
    const response = await executeWithRetry(async (aiClient) => {
      return await aiClient.models.generateContent({
        model: "gemini-2.5-flash",
        contents: contents, // Sử dụng native chat history array thay vì ghép text
        config: {
          systemInstruction: systemInstruction,
          maxOutputTokens: 1200,
          temperature: 0.7,
          tools: [{ functionDeclarations: [recommendProductDeclaration] }] as any // Đăng ký tool gửi card sản phẩm
        }
      });
    });

    let replyText = response.text || "";
    let recommendedProductId: number | null = null;

    // 1. Phân tích kết quả từ Function Calling (Cách chính xác 100%)
    if (response.functionCalls && response.functionCalls.length > 0) {
      const call = response.functionCalls[0];
      if (call && call.name === "recommend_product" && call.args) {
        recommendedProductId = Number((call.args as any).productId);
      }
    }

    // 2. Fallback quét Regex đề xuất [RECOMMEND: id] phòng trường hợp AI sinh text thay vì gọi hàm
    const recommendRegex = /\[RECOMMEND:\s*(\d+)\]/i;
    const match = replyText.match(recommendRegex);
    if (match) {
      if (!recommendedProductId) {
        recommendedProductId = Number(match[1]);
      }
      replyText = replyText.replace(recommendRegex, "").trim();
    }

    // Đảm bảo phần văn bản trả về không bị trống khi gọi tool
    let cleanText = replyText.trim();
    if (!cleanText && recommendedProductId) {
      cleanText = "Dạ, bên mình gửi bạn thông tin sản phẩm bạn đang quan tâm nhé ạ. Bạn xem qua chi tiết nha!";
    } else if (!cleanText) {
      cleanText = "Cảm ơn bạn! Yêu cầu hỗ trợ đã được ghi nhận. Nhân viên sẽ trả lời bạn ngay.";
    }

    return {
      text: cleanText,
      recommendedProductId
    };
  } catch (error) {
    console.error("Lỗi khi xử lý với Gemini AI:", error);
    return {
      text: "Cảm ơn bạn đã liên hệ. Hệ thống đang bận một chút, nhân viên sẽ kết nối hỗ trợ bạn ngay lập tức.",
      recommendedProductId: null
    };
  }
}
