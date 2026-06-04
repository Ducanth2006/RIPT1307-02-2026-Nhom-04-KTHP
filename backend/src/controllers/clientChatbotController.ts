import type { Request, Response } from 'express';
import supabaseClient from '../config/supabase';

export const handleChatbotMessage = async (req: Request, res: Response): Promise<any> => {
    try {
        const { message } = req.body;
        if (!message) {
            return res.status(400).json({ message: "Thiếu nội dung tin nhắn." });
        }

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            console.warn("⚠️ GEMINI_API_KEY chưa được cấu hình trong file .env. Chatbot sẽ chạy ở chế độ fallback.");
            return res.status(200).json({
                mode: "fallback",
                message: "Chế độ Local Fallback"
            });
        }

        // 1. Lấy danh sách sản phẩm Active từ Supabase để làm ngữ cảnh
        const { data: dbProducts, error: dbError } = await supabaseClient
            .from('products')
            .select(`
                id,
                name,
                base_price,
                brand,
                categories (
                    name
                )
            `)
            .is('deleted_at', null)
            .eq('status', 'Active');

        if (dbError) {
            console.error("Lỗi lấy sản phẩm làm ngữ cảnh cho AI:", dbError);
        }

        // 2. Định dạng danh sách sản phẩm thành chuỗi text
        const productContext = dbProducts && dbProducts.length > 0
            ? dbProducts.map(p => `- [ID: ${p.id}] ${p.name} (Hãng: ${p.brand || 'Khác'}) - Giá: ${p.base_price.toLocaleString('vi-VN')} đ`).join('\n')
            : "Hiện tại không có sản phẩm nào.";

        // 3. Chuẩn bị system instruction và request body cho Gemini
        const systemInstruction = `Bạn là SportStride AI - Trợ lý ảo thông minh và thân thiện của cửa hàng đồ thể thao cao cấp SportStride.
Nhiệm vụ chính của bạn là hỗ trợ tư vấn size trang phục, gợi ý các sản phẩm phù hợp thời tiết/mùa, hướng dẫn đặt hàng/thanh toán, hướng dẫn hủy đơn và gửi khiếu nại.

Dưới đây là danh sách sản phẩm THỰC TẾ đang có trong cửa hàng:
${productContext}

QUY TẮC PHẢN HỒI:
1. Giao tiếp bằng tiếng Việt, xưng hô lịch sự, thân thiện (ví dụ: "Dạ chào bạn", "Cảm ơn bạn đã quan tâm").
2. Chỉ giới thiệu các sản phẩm thực tế có trong danh sách ở trên. Tuyệt đối không tự bịa ra sản phẩm hoặc thương hiệu không tồn tại.
3. Khi bạn đề xuất/giới thiệu một sản phẩm, hãy LUÔN viết kèm mã ID dạng "ID: [số]" (Ví dụ: "Áo thun thể thao Adidas (ID: 5)") để hệ thống hiển thị thẻ sản phẩm trực quan.
4. Trả lời ngắn gọn, cô đọng, dễ đọc (sử dụng các gạch đầu dòng khi cần).
5. Nếu khách hàng hỏi về size quần áo, hướng dẫn họ nhập chiều cao & cân nặng (Ví dụ: "Tôi cao 1m72 nặng 65kg").
6. Nếu khách hàng hỏi cách hủy đơn: Hướng dẫn họ vào trang "Đơn hàng của tôi" -> tìm đơn ở trạng thái chờ duyệt và chọn "Yêu cầu hủy".
7. Nếu khách hàng hỏi cách gửi khiếu nại: Hướng dẫn vào "Hồ sơ cá nhân" -> chọn mục "Khiếu nại" -> bấm "Gửi khiếu nại mới".`;

        const requestBody = {
            contents: [
                {
                    parts: [
                        { text: message }
                    ]
                }
            ],
            systemInstruction: {
                parts: [
                    { text: systemInstruction }
                ]
            }
        };

        // 4. Gửi request đến Google Gemini REST API
        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
        
        const response = await fetch(geminiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            const errText = await response.text();
            throw new Error(`Gemini API error status ${response.status}: ${errText}`);
        }

        const data = await response.json();
        const replyText = data.candidates?.[0]?.content?.parts?.[0]?.text || "Xin lỗi, tôi chưa hiểu rõ ý bạn. Bạn có thể cung cấp thêm chi tiết không?";

        // 5. Trích xuất các ID sản phẩm được nhắc đến trong câu trả lời của AI
        const idRegex = /ID:\s*(\d+)/gi;
        const matchedIds: number[] = [];
        let match;
        while ((match = idRegex.exec(replyText)) !== null) {
            if (match[1]) {
                const idVal = parseInt(match[1]);
                if (!matchedIds.includes(idVal)) {
                    matchedIds.push(idVal);
                }
            }
        }

        let matchedProducts: any[] = [];
        if (matchedIds.length > 0) {
            // Lấy thông tin đầy đủ kèm ảnh của các sản phẩm được đề xuất
            const { data: productsData } = await supabaseClient
                .from('products')
                .select(`
                    id,
                    name,
                    base_price,
                    brand,
                    product_images (
                        image_url,
                        is_main
                    )
                `)
                .in('id', matchedIds)
                .is('deleted_at', null);

            if (productsData) {
                matchedProducts = productsData.map(p => ({
                    id: p.id,
                    name: p.name,
                    brand: p.brand,
                    price: p.base_price,
                    image_url: p.product_images?.find((img: any) => img.is_main)?.image_url || p.product_images?.[0]?.image_url || ""
                }));
            }
        }

        res.status(200).json({
            mode: "gemini",
            reply: replyText,
            products: matchedProducts
        });

    } catch (error: any) {
        console.error("Lỗi API Chatbot:", error);
        res.status(500).json({
            message: "Lỗi hệ thống khi kết nối trợ lý AI",
            errorDetails: error.message || error
        });
    }
};
