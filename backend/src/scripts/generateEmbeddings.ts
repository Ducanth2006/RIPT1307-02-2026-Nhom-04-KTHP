import dotenv from "dotenv";
import path from "path";

// Tải cấu hình từ file .env ở thư mục backend
dotenv.config({ path: path.join(__dirname, "../../.env") });

import supabaseClient from "../config/supabase";
import { GoogleGenAI } from "@google/genai";

const aiKey = process.env.GEMINI_API_KEY;

async function main() {
  if (!aiKey) {
    console.error("❌ Lỗi: Thiếu GEMINI_API_KEY trong file .env!");
    process.exit(1);
  }

  console.log("=== BẮT ĐẦU ĐỒNG BỘ VECTOR EMBEDDINGS CHO SẢN PHẨM ===");
  const ai = new GoogleGenAI({ apiKey: aiKey });

  try {
    // 1. Lấy tất cả sản phẩm chưa có vector embedding hoặc tất cả sản phẩm để đồng bộ lại
    const { data: products, error: fetchError } = await supabaseClient
      .from("products")
      .select("id, name, brand, description")
      .is("deleted_at", null);

    if (fetchError) {
      throw fetchError;
    }

    if (!products || products.length === 0) {
      console.log("ℹ️ Không tìm thấy sản phẩm nào trong database.");
      return;
    }

    console.log(`📦 Tìm thấy ${products.length} sản phẩm cần xử lý.`);

    for (let i = 0; i < products.length; i++) {
      const p = products[i];
      if (!p) continue;

      const textToEmbed = `${p.name} ${p.brand || ""} ${p.description || ""}`.trim();
      
      console.log(`[${i + 1}/${products.length}] Đang tạo vector cho: "${p.name}" (ID: ${p.id})...`);

      try {
        // Gọi API Gemini để tạo embedding
        const response = await ai.models.embedContent({
          model: "gemini-embedding-001",
          contents: textToEmbed,
          config: {
            outputDimensionality: 768
          }
        });

        const embeddings = response.embeddings;
        if (embeddings && embeddings.length > 0 && embeddings[0] && embeddings[0].values) {
          const vector = embeddings[0].values;

          // Cập nhật vector vào database
          const { error: updateError } = await supabaseClient
            .from("products")
            .update({ embedding: vector })
            .eq("id", p.id);

          if (updateError) {
            console.error(`❌ Lỗi khi lưu vector cho sản phẩm ID ${p.id}:`, updateError.message);
          } else {
            console.log(`   ✅ Đã lưu vector thành công.`);
          }
        } else {
          console.error(`❌ Không lấy được giá trị vector từ Gemini API cho sản phẩm ID ${p.id}`);
        }
      } catch (err: any) {
        console.error(`❌ Lỗi xử lý sản phẩm ID ${p.id}:`, err?.message || err);
      }

      // Giãn cách một chút tránh hit rate limit
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    console.log("\n🎉 HOÀN THÀNH QUÁ TRÌNH ĐỒNG BỘ VECTOR EMBEDDINGS!");
  } catch (err: any) {
    console.error("❌ Lỗi hệ thống:", err?.message || err);
  }
}

main();
