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
  // 1. Thử sử dụng Semantic Search (pgvector) trước
  const embedding = await getEmbedding(userMessage);
  if (embedding) {
    try {
      const { data: semanticProducts, error: rpcError } = await supabaseClient
        .rpc("match_products", {
          query_embedding: embedding,
          match_threshold: 0.5, // Tìm độ tương đồng tối thiểu 50%
          match_count: 5
        });

      if (!rpcError && semanticProducts && semanticProducts.length > 0) {
        console.log("🚀 Tìm kiếm ngữ nghĩa (Semantic Search) thành công!");
        return (semanticProducts as any[]).map((p: any) => `- [MÃ SẢN PHẨM: ${p.id}] ${p.name} (${p.brand}): ${new Intl.NumberFormat("vi-VN").format(p.base_price)}đ. mô tả: ${p.description || "Đồ thể thao cao cấp"}`).join("\n");
      } else if (rpcError) {
        console.warn("RPC match_products chưa được cài đặt hoặc bị lỗi (Chưa chạy SQL migration):", rpcError.message);
      }
    } catch (dbErr: any) {
      console.warn("Bỏ qua lỗi truy cập pgvector, chuẩn bị chuyển sang tìm kiếm từ khóa:", dbErr?.message || dbErr);
    }
  }

  // 2. Fallback: Tìm kiếm theo từ khóa cũ (keyword-based ilike) nếu DB chưa bật pgvector
  console.log("⚠️ Đang chạy Fallback tìm kiếm từ khóa (ilike)...");
  try {
    const cleanMsg = userMessage.toLowerCase();
    
    // Tách từ khóa quan trọng bằng cách loại bỏ các từ dừng thông dụng (Vietnamese Stop Words)
    const stopWords = new Set([
      "tôi", "tớ", "mình", "em", "shop", "cần", "tư", "vấn", "hỏi", "mua", 
      "có", "bán", "không", "á", "nha", "xem", "tìm", "về", "sản", "phẩm", 
      "loại", "chiếc", "cái", "của", "cho", "xin", "giá", "bao", "nhiêu", 
      "lấy", "à", "ơi", "dạ", "chào", "hi", "hello", "với", "thế", "nào", "đi", "được"
    ]);

    const words = cleanMsg
      .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?]/g, " ") // Thay thế dấu câu bằng khoảng trắng
      .split(/\s+/)
      .filter(w => w.length >= 2 && !stopWords.has(w));

    // Tra cứu từ đồng nghĩa / gõ sai chính tả phổ biến trong tiếng Việt thể thao
    const synonyms: { [key: string]: string[] } = {
      "dày": ["giày", "dép"],
      "giay": ["giày"],
      "ao": ["áo"],
      "quan": ["quần"],
      "do": ["đồ", "quần", "áo"],
      "đồ": ["quần", "áo", "bộ"],
      "phông": ["áo"],
      "khoác": ["áo"],
      "tập": ["gym", "yoga", "chạy"],
      "đá": ["bóng", "banh", "giày"],
      "ball": ["bóng", "rổ", "đá"],
      "bóng": ["áo", "giày", "quần"]
    };

    let expandedKeywords = [...words];
    for (const w of words) {
      if (synonyms[w]) {
        expandedKeywords.push(...synonyms[w]);
      }
    }
    // Loại bỏ từ trùng lặp
    expandedKeywords = Array.from(new Set(expandedKeywords));

    console.log("🔍 Từ khóa trích xuất từ câu hỏi khách hàng:", expandedKeywords);

    // Tìm kiếm sản phẩm trong Database (lấy thêm cột id)
    let query = supabaseClient.from("products").select("id, name, brand, base_price, description");

    if (expandedKeywords.length > 0) {
      // Xây dựng chuỗi truy vấn 'or' cho Supabase quét cả cột name (tên sản phẩm) và cột brand (thương hiệu)
      const orConditions = expandedKeywords
        .flatMap(kw => [`name.ilike.%${kw}%`, `brand.ilike.%${kw}%`])
        .join(",");
      query = query.or(orConditions);
    }

    const { data: products } = await query.limit(5);

    if (!products || products.length === 0) {
      // Fallback: Lấy 5 sản phẩm ngẫu nhiên/mới nhất để làm ví dụ
      const { data: fallbackProducts } = await supabaseClient
        .from("products")
        .select("id, name, brand, base_price, description")
        .limit(5);
      if (!fallbackProducts) return "";
      return fallbackProducts.map(p => `- [MÃ SẢN PHẨM: ${p.id}] ${p.name} (${p.brand}): ${new Intl.NumberFormat("vi-VN").format(p.base_price)}đ.`).join("\n");
    }

    return products.map(p => `- [MÃ SẢN PHẨM: ${p.id}] ${p.name} (${p.brand}): ${new Intl.NumberFormat("vi-VN").format(p.base_price)}đ. mô tả: ${p.description || "Đồ thể thao cao cấp"}`).join("\n");
  } catch (error) {
    console.error("Lỗi lấy context sản phẩm:", error);
    return "";
  }
}

/**
 * Gọi Gemini API để sinh câu trả lời tư vấn cho khách hàng
 */
export async function generateBotReply(userMessage: string, history: any[] = []): Promise<{ text: string, recommendedProductId: number | null }> {
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

# KNOWLEDGE BASE (TRUNG TÂM KIẾN THỨC)

## 1. Bảng size quần áo chuẩn:
- Size S: Cao 1m50 - 1m60 | Nặng 45kg - 55kg
- Size M: Cao 1m60 - 1m68 | Nặng 55kg - 65kg
- Size L: Cao 1m68 - 1m75 | Nặng 65kg - 75kg
- Size XL: Cao 1m75 - 1m82 | Nặng 75kg - 85kg
- Size XXL: Cao trên 1m80 | Nặng trên 85kg
* Lưu ý: Nếu khách ở rìa giữa hai size, khuyên chọn size lớn hơn nếu thích thoải mái, hoặc nhỏ hơn nếu muốn ôm dáng (Athletic-fit). Chủ động hỏi chiều cao & cân nặng nếu khách chưa cung cấp.

## 2. Chất liệu sản phẩm:
- Áo thun/Đồ tập: Thun lạnh thể thao cao cấp (Polyester + Spandex co giãn 4 chiều). Đặc tính: siêu thoáng mát, thấm hút mồ hôi tốt, không phai màu hay xù lông khi giặt.
- Quần Short/Quần gió: Vải dù gió micro nhẹ tênh, nhanh khô, chống cản gió nhẹ.

## 3. Chính sách bán hàng:
- Phí vận chuyển: Đồng giá ship 30.000đ toàn quốc. Miễn phí vận chuyển cho tất cả các đơn hàng từ 500.000đ trở lên.
- Đổi trả: Hỗ trợ đổi size hoặc đổi mẫu MIỄN PHÍ tận nhà trong vòng 7 ngày kể từ khi nhận hàng.

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

## Ví dụ 3: Khách đồng ý xem chi tiết sau khi được tư vấn
Khách: "có" (sau khi Bot giới thiệu Giày Puma)
Model: "Dạ đây là chi tiết về Giày Thể Thao Puma: sản phẩm được thiết kế với đế cao su chống trượt tốt, chất liệu da PU cao cấp bền bỉ. Mẫu này lên chân rất êm và tôn dáng. Shop hỗ trợ đổi size miễn phí trong 7 ngày nên bạn hoàn toàn yên tâm nha!"

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
          maxOutputTokens: 500,
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
