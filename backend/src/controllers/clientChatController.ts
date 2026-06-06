import type { Request, Response } from 'express';
import * as chatService from '../services/chatService';
import { getIO } from '../config/socket';
import supabaseClient from '../config/supabase';
import { generateBotReply, ensureBotUserExists } from '../services/aiService';

// ID của Bot User trong DB (configurable qua .env)
const BOT_USER_ID = Number(process.env.BOT_USER_ID || '999999');

/**
 * Helper nội bộ: Gọi AI Bot tự động trả lời khi phòng ở trạng thái waiting.
 * Chạy bất đồng bộ, KHÔNG block response trả về cho client.
 */
async function triggerBotReply(roomId: number, clientId: number, activeProductId?: number): Promise<void> {
    try {
        // 1. Đảm bảo Bot User tồn tại trong DB
        await ensureBotUserExists();

        // 2. Lấy lịch sử tin nhắn gần nhất làm context cho AI
        const history = await chatService.getRoomMessages(roomId);
        const recentHistory = history.slice(-10);

        // 3. Lấy tin nhắn cuối cùng của client để làm input
        const lastClientMsg = [...recentHistory]
            .reverse()
            .find((m: any) => m.sender_id === clientId);

        if (!lastClientMsg?.content && lastClientMsg?.message_type !== 'product') {
            console.log('⚠️ Bot: Không tìm thấy tin nhắn client để xử lý.');
            return;
        }

        // Nếu client gửi thẻ sản phẩm, tạo context cho AI từ tên sản phẩm
        const userInput = lastClientMsg.message_type === 'product' && lastClientMsg.product
            ? `Tôi muốn hỏi về sản phẩm: ${lastClientMsg.product.name}`
            : (lastClientMsg.content || '');

        // 3b. Lấy thông tin sản phẩm active mà khách hàng đang xem trên màn hình (nếu có)
        let activeProductContext = '';
        if (activeProductId) {
            try {
                const { data: activeProduct } = await supabaseClient
                    .from('products')
                    .select('id, name, brand, base_price, description')
                    .eq('id', activeProductId)
                    .maybeSingle();
                if (activeProduct) {
                    activeProductContext = `Khách hàng đang xem sản phẩm này:\n- [MÃ SẢN PHẨM: ${activeProduct.id}] Tên: ${activeProduct.name}, Hãng: ${activeProduct.brand}, Giá: ${new Intl.NumberFormat("vi-VN").format(activeProduct.base_price)}đ, Mô tả/Chất liệu: ${activeProduct.description || "Chưa cập nhật mô tả"}.\nNếu câu hỏi của khách hàng có các đại từ chỉ định như "áo này", "quần này", "mẫu này", "đồ này", "mô tả", "chất liệu", "phối đồ", hãy ngầm hiểu là khách hàng đang hỏi về sản phẩm này.`;
                }
            } catch (err: any) {
                console.error('⚠️ Lỗi lấy activeProductContext:', err.message);
            }
        }
        // 4. Hệ thống phân loại câu hỏi tĩnh — Không tốn token AI
        // Chuẩn hóa: bỏ dấu, chữ thường để so sánh từ khóa
        const raw = userInput.trim().toLowerCase();
        const norm = raw
            .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
            .replace(/đ/g, 'd').replace(/Đ/g, 'D');

        let botText = '';
        let recommendedProductId: number | null = null;
        let isStaticResponse = false;

        // ── Kỹ thuật trích xuất chiều cao & cân nặng tự động tính size ──────────────────
        let heightCm: number | null = null;
        let weightKg: number | null = null;

        // Bắt chiều cao dạng: 1m72, 1.72m, 172cm, 172 cm, m72, m7, cao 170
        const heightMatch = norm.match(/(?:cao|size)?\s*(1\s*[m,.]\s*\d{1,2}|\d{3}\s*cm|\d{3}\s*cm|m\d{1,2})/i);
        if (heightMatch) {
            const hStr = heightMatch[1].replace(/\s+/g, '');
            if (hStr.includes('cm')) {
                heightCm = parseInt(hStr.replace('cm', ''), 10);
            } else if (hStr.includes('m') || hStr.includes(',') || hStr.includes('.')) {
                const cleanH = hStr.replace('m', '').replace(',', '.');
                const val = parseFloat(cleanH);
                if (val < 3) {
                    heightCm = Math.round(val * 100);
                } else {
                    heightCm = Math.round(val);
                }
            }
        }
        // Fallback nếu chỉ ghi số 150-200
        if (!heightCm) {
            const fallbackHeightMatch = norm.match(/\b(1[4-9]\d|200)\b/);
            if (fallbackHeightMatch) {
                heightCm = parseInt(fallbackHeightMatch[1], 10);
            }
        }

        // Bắt cân nặng dạng: 68kg, 68 kg, 68 ký, 68 ky, nang 68, 68kilo
        const weightMatch = norm.match(/(?:nang|ky|kg|kilo)?\s*(\d{2,3})\s*(?:kg|ky|ki|kilo|cang|cang)\b/i) || norm.match(/\b(\d{2,3})\s*(?:kg|ky|ki)\b/i);
        if (weightMatch) {
            weightKg = parseInt(weightMatch[1], 10);
        } else {
            // Fallback nếu ghi "nặng 68" hoặc "68 kg"
            const fallbackWeightMatch = norm.match(/(?:nang|cang)\s*(\d{2,3})\b/i);
            if (fallbackWeightMatch) {
                weightKg = parseInt(fallbackWeightMatch[1], 10);
            }
        }

        // Nếu bắt được cả hai số đo hợp lệ, thực hiện tính toán trả về size ngay lập tức
        if (heightCm && weightKg && heightCm >= 140 && heightCm <= 210 && weightKg >= 35 && weightKg <= 120) {
            let recommendedSize = '';
            if (weightKg <= 55 && heightCm <= 160) {
                recommendedSize = 'S';
            } else if (weightKg <= 65 && heightCm <= 168) {
                recommendedSize = 'M';
            } else if (weightKg <= 75 && heightCm <= 175) {
                recommendedSize = 'L';
            } else if (weightKg <= 85 && heightCm <= 182) {
                recommendedSize = 'XL';
            } else {
                recommendedSize = 'XXL';
            }
            botText = `Dạ với số đo chiều cao **${heightCm}cm** và cân nặng **${weightKg}kg** của bạn, ProSports gợi ý bạn chọn **Size ${recommendedSize}** là vừa vặn và tôn dáng nhất ạ!\n\n💡 *Mẹo nhỏ*: Nếu bạn thích mặc rộng rãi thoải mái hoặc có xương vai rộng, mình có thể tăng lên 1 size nhé ạ! Bạn có cần shop tư vấn thêm về sản phẩm nào không?`;
            isStaticResponse = true;
        }
        // ── Nhóm 1: Vận chuyển & Phí ship ──────────────────────────────
        else if (/\b(phi\s*ship|phi\s*van\s*chuyen|ship\s*bao\s*nhieu|gia\s*ship|cuoc\s*ship|mien\s*phi\s*ship|free\s*ship|giao\s*hang|van\s*chuyen|freeship|ship\s*cod|khi\s*nao\s*nhan|bao\s*lau\s*den|ship\s*tinh|ship\s*nhiu|co\s*ship\s*khong|ship\s*khong|ship\s*ve|ship\s*di|giao\s*hang\s*khong)\b/.test(norm)) {
            botText = 'Dạ shop hỗ trợ giao hàng toàn quốc với phí ship **đồng giá 30.000đ**. Đơn hàng từ **500.000đ trở lên** được **miễn phí vận chuyển** hoàn toàn ạ! Thời gian giao hàng thường từ 2-5 ngày tuỳ khu vực.';
            isStaticResponse = true;
        }
        // ── Nhóm 2: Đổi trả hàng ──────────────────────────────────────
        else if (/\b(doi\s*tra|tra\s*hang|doi\s*hang|hoan\s*tien|bao\s*hanh|chinh\s*sach\s*doi|doi\s*size|hoan\s*tien|tra\s*lai|pass\s*lai|doi\s*mau)\b/.test(norm)) {
            botText = 'Dạ shop hỗ trợ **đổi size hoặc đổi mẫu MIỄN PHÍ tận nhà** trong vòng **7 ngày** kể từ khi nhận hàng ạ!\n\nĐiều kiện đổi trả: Sản phẩm còn nguyên tag, chưa qua giặt/sử dụng, còn hoá đơn mua hàng. Bạn cần hỗ trợ đổi trả thì để lại thông tin nhé, nhân viên sẽ liên hệ hỗ trợ ạ!';
            isStaticResponse = true;
        }
        // ── Nhóm 3: Hủy đơn hàng ──────────────────────────────────────
        else if (/\b(huy\s*don|tu\s*huy|cancel|huy\s*order|bo\s*don)\b/.test(norm)) {
            botText = 'Dạ, bạn có thể tự hủy đơn hàng **chưa được xử lý** bằng cách vào [Lịch sử đơn hàng](/orders) và nhấn nút **Hủy Đơn**. Nếu đơn đã được xác nhận/đang giao thì bạn cần liên hệ nhân viên để được hỗ trợ nhé ạ!';
            isStaticResponse = true;
        }
        // ── Nhóm 4: Hướng dẫn mua hàng & thanh toán ──────────────────
        else if (/\b(mua\s*hang|thanh\s*toan|dat\s*hang|cach\s*mua|huong\s*dan\s*mua|phuong\s*thuc\s*thanh\s*toan|cod|ngan\s*hang|chuyen\s*khoan|huong\s*dan\s*dat|mua\s*sao|dat\s*sao)\b/.test(norm)) {
            botText = 'Dạ, để đặt hàng bạn chọn sản phẩm → chọn size/màu → **Thêm vào giỏ** → vào [Giỏ hàng](/cart) và thanh toán ạ!\n\nShop hỗ trợ các hình thức thanh toán:\n- **COD** (Thanh toán khi nhận hàng)\n- **Chuyển khoản ngân hàng**\n- **Ví điện tử** (MoMo, ZaloPay)';
            isStaticResponse = true;
        }
        // ── Nhóm 5: Theo dõi đơn hàng ────────────────────────────────
        // Mở rộng bắt thêm: don o dau, don dang
        else if (/\b(don\s*hang\s*cua\s*toi|xem\s*don|lich\s*su\s*don|trang\s*thai\s*don|theo\s*doi\s*don|don\s*o\s*dau|don\s*dang)\b/.test(norm)) {
            botText = 'Dạ, bạn có thể xem trạng thái và lịch sử tất cả đơn hàng [tại đây](/orders) ạ! Nếu cần hỗ trợ thêm về một đơn hàng cụ thể hãy cung cấp mã đơn cho nhân viên nhé.';
            isStaticResponse = true;
        }
        // ── Nhóm 6: Tính size / bảng size ────────────────────────────
        else if (/\b(tinh\s*size|bang\s*size|chon\s*size|size\s*bao\s*nhieu|nen\s*mac\s*size|size\s*nao\s*vua|tu\s*van\s*size|sz\s*gi|bang\s*sz|size\s*(s|m|l|xl|xxl|2xl)|sz\s*(s|m|l|xl|xxl|2xl)|tu\s*van\s*sz|mac\s*sz|mac\s*size)\b/.test(norm)) {
            botText = '**Bảng size quần áo thể thao ProSports:**\n- **Size S**: Cao 1m50–1m60 | Nặng 45–55kg\n- **Size M**: Cao 1m60–1m68 | Nặng 55–65kg\n- **Size L**: Cao 1m68–1m75 | Nặng 65–75kg\n- **Size XL**: Cao 1m75–1m82 | Nặng 75–85kg\n- **Size XXL**: Cao trên 1m80 | Nặng trên 85kg\n\n💡 Bạn muốn tôi tư vấn size chính xác hơn? Hãy cho tôi biết **chiều cao và cân nặng** của bạn nhé!';
            isStaticResponse = true;
        }
        // ── Nhóm 7: Khiếu nại & Góp ý ───────────────────────────────
        else if (/\b(khieu\s*nai|gop\s*y|phan\s*anh|bao\s*cao|chan\s*nan|that\s*vong|te|kem\s*chat\s*luong|hang\s*loi|hang\s*hong|chua\s*nhan\s*duoc\s*hang)\b/.test(norm)) {
            botText = 'Dạ, shop rất tiếc khi bạn gặp vấn đề! Shop xin lỗi vì sự bất tiện này ạ 🙏\n\nBạn có thể gửi khiếu nại chi tiết [tại đây](/complaints) hoặc nhắn thêm thông tin để nhân viên hỗ trợ xử lý nhanh nhất cho bạn. **Yêu cầu của bạn sẽ được ưu tiên giải quyết trong 24h ạ!**';
            isStaticResponse = true;
        }
        // ── Nhóm 8: Giờ hoạt động / Liên hệ ─────────────────────────
        else if (/\b(gio\s*lam\s*viec|gio\s*hoat\s*dong|lam\s*viec\s*may\s*gio|hotline|so\s*dien\s*thoai|sdt|lien\s*he|dia\s*chi|cua\s*hang|dia\s*chi\s*shop|showroom|chi\s*nhanh|o\s*dau|cho\s*nao|o\s*khu\s*vuc\s*nao)\b/.test(norm)) {
            botText = '**Thông tin liên hệ ProSports:**\n- 🕐 Giờ hỗ trợ trực tuyến: **7:00 – 22:00** mỗi ngày\n- 📞 Hotline: **1800-xxxx** (Miễn phí)\n- 📍 Địa chỉ: Xem [tại đây](/about)\n\nNgoài giờ hỗ trợ, bạn có thể để lại tin nhắn — nhân viên sẽ phản hồi sớm nhất khi trực tuyến ạ!';
            isStaticResponse = true;
        }
        // ── Nhóm 9: Voucher / Mã giảm giá ───────────────────────────
        else if (/\b(voucher|ma\s*giam\s*gia|khuyen\s*mai|sale|giam\s*gia|uu\s*dai|ma\s*coupon|code\s*giam|km|gg|ma\s*gg|ma\s*km|chiet\s*khau|code)\b/.test(norm)) {
            botText = 'Dạ, các mã giảm giá và voucher khuyến mãi của shop được cập nhật thường xuyên trên trang chủ và tại mục [Voucher của tôi](/vouchers)! Bạn có thể xem và lưu voucher trước khi thanh toán ạ 🎁';
            isStaticResponse = true;
        }
        // ── Nhóm 10: Chào hỏi đơn giản ──────────────────────────────
        else if (/^(xin\s*chao|chao\s*shop|hello|hi|alo|hey|chao|bonjour|good\s*morning|chao\s*ban)(\s*(a|nhe|oi|nha|admin|nhe\s*shop|nha\s*shop))*[\s!.]*$/.test(norm)) {
            botText = 'Xin chào bạn! 👋 Tôi là **Trợ lý AI ProSports**, rất vui được hỗ trợ bạn hôm nay!\n\nBạn cần tư vấn về sản phẩm, size, hay có câu hỏi gì về đơn hàng? Cứ hỏi tôi nhé, hoặc chọn một gợi ý phía dưới để bắt đầu nhanh hơn ạ 😊';
            isStaticResponse = true;
        }
        // ── Nhóm 11: Cảm ơn ─────────────────────────────────────────
        else if (/^(cam\s*on|thanks|thank\s*you|thank|cảm\s*ơn|ok\s*cam\s*on|ok\s*thanks)[\s!.]*$/.test(norm)) {
            botText = 'Dạ không có gì ạ! Rất vui được hỗ trợ bạn 😊 Nếu cần thêm gì bạn cứ nhắn tin bất cứ lúc nào nhé. Chúc bạn mua sắm vui vẻ tại ProSports! 🛒';
            isStaticResponse = true;
        }

        // ══ GIAI ĐOẠN TRƯỚC KHI MUA — Tâm lý lo ngại, cân nhắc ══════════

        // ── Nhóm 12: Hàng có sẵn / Tồn kho ─────────────────────────
        else if (/\b(con\s*hang|co\s*san|het\s*hang|con\s*size|con\s*mau|het\s*size|het\s*mau|ton\s*kho|hang\s*co\s*san|still\s*available|con\s*k\s*shop|sold\s*out|con\s*khong|con\s*ko|co\s*san\s*ko|san\s*ko|con\s*sz|con\s*size\s*ko|het\s*chua)\b/.test(norm)) {
            botText = 'Dạ tồn kho sản phẩm được cập nhật **real-time** theo từng màu sắc và size ạ! Bạn có thể kiểm tra trực tiếp trên trang sản phẩm — nếu size/màu nào **hết hàng** sẽ hiện nút **"Hết hàng"** và không cho thêm vào giỏ.\n\nNếu size bạn muốn đã hết, hãy để lại thông tin để shop báo ngay khi có hàng về nhé ạ! 📦';
            isStaticResponse = true;
        }
        // ── Nhóm 13: Hàng có chính hãng không / Nguồn gốc ──────────
        else if (/\b(chinh\s*hang|hang\s*that|hang\s*chinh\s*hieu|chinh\s*goc|nguon\s*goc|auth|authentic|fake|nhai|gia|hang\s*gia|bao\s*dam\s*chinh|real|chinh\s*hang\s*ko|chinh\s*hang\s*khong|hang\s*chuan|chuan\s*auth)\b/.test(norm)) {
            botText = 'Dạ shop **cam kết 100% hàng chính hãng** được nhập khẩu và phân phối chính thức ạ! 🏅\n\nTất cả sản phẩm tại ProSports đều có:\n- **Tem chính hãng** kèm mã QR xác thực\n- **Hoá đơn VAT** theo yêu cầu\n- Chế độ **đổi trả miễn phí 7 ngày** nếu phát hiện lỗi sản xuất\n\nBạn cứ yên tâm mua sắm ạ! 💪';
            isStaticResponse = true;
        }
        // ── Nhóm 14: Màu sắc có giống ảnh không ────────────────────
        else if (/\b(mau\s*co\s*giong\s*anh|mau\s*thuc\s*te|mau\s*ngoai\s*doi|anh\s*chup\s*that|co\s*dep\s*nhu\s*anh|mau\s*khac\s*anh|anh\s*vs\s*thuc\s*te|photoshop|xin\s*anh\s*that|co\s*video\s*ko|chup\s*cam\s*thuong)\b/.test(norm)) {
            botText = 'Dạ các ảnh sản phẩm tại ProSports được chụp dưới ánh sáng tự nhiên, **không qua chỉnh sửa màu sắc** để phản ánh trung thực nhất ạ! 📸\n\nTuy nhiên màu sắc có thể có **sai lệch nhỏ 5–10%** tuỳ theo màn hình thiết bị và ánh sáng môi trường. Nếu nhận hàng và màu không như kỳ vọng, bạn được **đổi miễn phí trong 7 ngày** ạ!';
            isStaticResponse = true;
        }
        // ── Nhóm 15: Thời gian giao hàng bao lâu ───────────────────
        else if (/\b(bao\s*lau\s*nhan\s*hang|may\s*ngay|may\s*hom|giao\s*bao\s*lau|khi\s*nao\s*nhan|nhanh\s*khong|giao\s*nhanh|express|dat\s*bay|toc\s*do\s*giao|bao\s*lau\s*toi|bao\s*lau\s*co|khi\s*nao\s*co|khi\s*nao\s*giao|giao\s*hoa\s*toc|ship\s*hoa\s*toc|giao\s*trong\s*ngay)\b/.test(norm)) {
            botText = 'Dạ thời gian giao hàng dự kiến:\n- 🏙️ **Nội thành TP.HCM / Hà Nội**: 1–2 ngày\n- 🌆 **Tỉnh thành lớn khác**: 2–3 ngày\n- 🗺️ **Vùng xa, hải đảo**: 4–7 ngày\n\n⚡ Shop hỗ trợ **giao hàng hoả tốc** (same-day) tại TP.HCM cho đơn đặt trước **12:00 trưa** với phí phụ thêm. Bạn cần giao gấp hãy cho shop biết nhé!';
            isStaticResponse = true;
        }

        // ══ GIAI ĐOẠN ĐANG MUA — Cần tư vấn nhanh, sợ quyết định sai ═

        // ── Nhóm 16: Mua về mặc tập gym / chạy bộ / thể thao ───────
        else if (/\b(tap\s*gym|chay\s*bo|the\s*thao|yoga|boi|da\s*bong|bong\s*ro|tennis|mac\s*tap|quan\s*ao\s*tap|do\s*tap)\b/.test(norm) && !norm.includes('chat\s*lieu') && !norm.includes('tim')) {
            botText = 'Dạ toàn bộ sản phẩm tại ProSports đều được thiết kế chuyên biệt cho **hoạt động thể thao** ạ! 🏃‍♂️\n\nĐặc điểm nổi bật:\n- **Vải thun lạnh 4 chiều** co giãn tối đa, không cản chuyển động\n- **Thoát ẩm DryFit** — thấm hút mồ hôi, khô nhanh\n- **Đường may phẳng** tránh cọ xát khi vận động mạnh\n\nBạn đang tìm sản phẩm cho môn thể thao nào để shop tư vấn cụ thể hơn ạ?';
            isStaticResponse = true;
        }
        // ── Nhóm 17: Người gầy / béo / cao / thấp mặc có đẹp không ─
        else if (/\b(nguoi\s*gay|nguoi\s*beo|nguoi\s*cao|nguoi\s*thap|bung\s*to|vai\s*rong|chan\s*dai|hinh\s*the\s*nao|dang\s*nao|body|mac\s*vua\s*khong)\b/.test(norm)) {
            botText = 'Dạ ProSports có đủ size từ **S đến XXL**, thiết kế phù hợp cho nhiều dáng người ạ!\n\n- Người **gầy cao**: Nên chọn áo form slim-fit, quần jogger ôm nhẹ để tạo dáng cân đối\n- Người **đầy đặn**: Chọn áo form oversize hoặc regular-fit có độ co giãn tốt sẽ thoải mái hơn\n- Người **lùn**: Quần short hoặc jogger cắt ngang gối giúp chân trông dài hơn\n\n💡 Cho shop biết **chiều cao và cân nặng** để tư vấn size chính xác nhé ạ!';
            isStaticResponse = true;
        }
        // ── Nhóm 18: Vải có bị phai / nhăn / xù không ──────────────
        else if (/\b(bi\s*phai\s*mau|phai\s*mau|bi\s*xuu|xu\s*long|bi\s*nhan|nhan\s*nheo|ben\s*khong|chat\s*luong\s*tot\s*khong|lau\s*ben|giat\s*nhieu)\b/.test(norm)) {
            botText = 'Dạ vải thể thao ProSports được xử lý **công nghệ kháng phai màu** và **chống xù lông** cao cấp ạ! 💪\n\nĐể giữ chất lượng lâu dài bạn nên:\n- 🌡️ **Giặt nước lạnh** (không quá 30°C)\n- 🚫 **Không dùng thuốc tẩy** hay nước xả vải mạnh\n- ☀️ **Phơi trong bóng mát**, tránh ánh nắng trực tiếp\n- 🔄 **Giặt lộn trái** để bảo vệ mặt in/thêu\n\nLàm đúng cách, sản phẩm bền đẹp cả **2–3 năm** ạ!';
            isStaticResponse = true;
        }
        // ── Nhóm 19: Có túi không / chi tiết sản phẩm ──────────────
        else if (/\b(co\s*tui\s*khong|tui\s*ao|tui\s*quan|co\s*dây\s*kéo|day\s*ke|co\s*non|co\s*mu|chi\s*tiet|thong\s*so\s*ky\s*thuat)\b/.test(norm)) {
            botText = 'Dạ chi tiết từng sản phẩm (túi, dây kéo, mũ...) được mô tả đầy đủ trong **phần mô tả sản phẩm** tại trang chi tiết ạ!\n\nNhìn chung bộ sưu tập ProSports:\n- 👖 **Quần short thể thao**: Thường có **túi hai bên** + túi sau có khoá\n- 🩳 **Quần jogger**: Có **túi hông** + túi sau nắp cúc\n- 👕 **Áo thun**: Không có túi, thiết kế gọn nhẹ\n\nBạn đang xem sản phẩm nào cụ thể, shop kiểm tra ngay cho bạn nhé!';
            isStaticResponse = true;
        }
        // ── Nhóm 20: Mua nhiều có giảm giá không / combo ────────────
        else if (/\b(mua\s*nhieu|so\s*luong\s*lon|mua\s*si|mua\s*combo|giam\s*gia\s*them|buy\s*more|bulk|tich\s*luy|diem\s*thuong)\b/.test(norm)) {
            botText = 'Dạ ProSports có **chính sách ưu đãi** cho khách hàng thân thiết và mua số lượng lớn ạ! 🎉\n\n- 🛍️ Mua **2+ sản phẩm**: Áp dụng voucher giảm thêm tại [mục Voucher](/vouchers)\n- 👑 **Thành viên VIP**: Tích điểm mỗi đơn, đổi thưởng ưu đãi\n- 🏢 **Mua sỉ/đồng phục nhóm**: Liên hệ nhân viên để được báo giá đặc biệt ạ!';
            isStaticResponse = true;
        }

        // ══ GIAI ĐOẠN CẢM XÚC — Bực bội, hỏi nhanh, so sánh ════════

        // ── Nhóm 21: Muốn gặp nhân viên / người thật ────────────────
        else if (/\b(gap\s*nhan\s*vien|noi\s*chuyen\s*voi\s*nguoi\s*that|ket\s*noi\s*nhan\s*vien|muon\s*gap\s*staff|lien\s*he\s*truc\s*tiep|nhan\s*vien\s*dau)\b/.test(norm)) {
            botText = 'Dạ, yêu cầu của bạn đã được **chuyển ưu tiên tới nhân viên hỗ trợ** rồi ạ! 🙋‍♂️\n\nNhân viên sẽ kết nối với bạn sớm nhất có thể. Trong thời gian chờ, nếu có câu hỏi nào tôi có thể giúp ngay, bạn cứ nhắn tôi nhé!\n\n⏰ Giờ hỗ trợ: **7:00 – 22:00** hàng ngày.';
            isStaticResponse = true;
        }
        // ── Nhóm 22: Trả góp / Mua trước trả sau ───────────────────
        else if (/\b(tra\s*gop|mua\s*truoc\s*tra\s*sau|gop\s*thang|installment|bnpl|kredivo|alepay|0%\s*lai\s*suat)\b/.test(norm)) {
            botText = 'Dạ hiện tại ProSports **chưa hỗ trợ hình thức trả góp** qua app ạ. Tuy nhiên bạn có thể:\n- 💳 Dùng **thẻ tín dụng** ngân hàng của bạn để tự thiết lập trả góp\n- 🎁 Sử dụng **voucher giảm giá** để tiết kiệm chi phí\n\nNếu có nhu cầu mua sỉ/số lượng lớn, nhân viên có thể hỗ trợ thêm nhé ạ!';
            isStaticResponse = true;
        }
        // ── Nhóm 23: Hóa đơn VAT / Xuất hóa đơn ───────────────────
        else if (/\b(hoa\s*don\s*vat|xuat\s*hoa\s*don|vat\s*invoice|bao\s*gom\s*thue|hoa\s*don\s*do\s*red\s*invoice)\b/.test(norm)) {
            botText = 'Dạ shop **hỗ trợ xuất hóa đơn VAT đỏ** theo yêu cầu ạ! 🧾\n\nĐể xuất hoá đơn, vui lòng cung cấp khi đặt hàng:\n- Tên công ty / Cá nhân\n- Mã số thuế\n- Địa chỉ xuất hoá đơn\n- Email nhận hoá đơn điện tử\n\nHoá đơn sẽ được gửi **trong vòng 24h sau khi giao hàng thành công** ạ!';
            isStaticResponse = true;
        }
        // ── Nhóm 24: Hàng mới về / Sản phẩm mới nhất ───────────────
        else if (/\b(hang\s*moi|san\s*pham\s*moi|moi\s*ve|new\s*arrival|drop\s*moi|bst\s*moi|bo\s*suu\s*tap\s*moi|new\s*collection|mua\s*moi)\b/.test(norm)) {
            botText = 'Dạ ProSports liên tục cập nhật **bộ sưu tập mới** mỗi tuần ạ! 🔥\n\nBạn xem các sản phẩm mới nhất [tại đây](/products?sort=newest) nhé! Shop thường **ra hàng mới vào thứ 6 hàng tuần** và thông báo qua:\n- 🔔 Thông báo trên web khi đăng nhập\n- 📣 Fanpage ProSports\n\nBạn có muốn tôi giới thiệu một vài mẫu đang hot hiện tại không ạ?';
            isStaticResponse = true;
        }
        // ── Nhóm 25: Địa chỉ / Cửa hàng vật lý ────────────────────
        else if (/\b(cua\s*hang\s*o\s*dau|co\s*showroom\s*khong|co\s*shop\s*offline|den\s*xem\s*truc\s*tiep|thu\s*do\s*truoc|try\s*on|o\s*dau|cho\s*nao|o\s*khu\s*vuc\s*nao|showroom\s*o\s*dau|tiem\s*o\s*dau|dia\s*chi\s*o\s*dau)\b/.test(norm)) {
            botText = 'Dạ ProSports hiện **tập trung kinh doanh online** để tối ưu chi phí và mang lại giá tốt nhất cho bạn ạ! 💻\n\nTuy nhiên bạn hoàn toàn yên tâm vì:\n- **Ảnh thực tế** 360° từ nhiều góc độ\n- **Chính sách đổi trả miễn phí 7 ngày** nếu không ưng\n- **Tư vấn size chi tiết** qua chat này\n\nBạn cần thêm hình ảnh hay thông tin gì về sản phẩm cụ thể không ạ?';
            isStaticResponse = true;
        }

        // ══ GIAI ĐOẠN PHÁT SINH VẬN HÀNH / FAQ MỚI ══════════════════

        // ── Nhóm 26: Sửa thông tin đơn hàng ────────────────────────
        else if (/\b(doi\s*dia\s*chi|sai\s*so\s*dien\s*thoai|them\s*do\s*vao\s*don|gop\s*don|sua\s*thong\s*tin\s*nhan|sua\s*don|doi\s*sdt)\b/.test(norm)) {
            botText = 'Dạ nếu đơn hàng **chưa được xử lý**, bạn có thể liên hệ ngay hotline **1800-xxxx** hoặc gửi lời nhắn yêu cầu cụ thể tại đây kèm **mã đơn hàng** để nhân viên hỗ trợ sửa địa chỉ/số điện thoại/sản phẩm nhanh nhất cho bạn nhé ạ!';
            isStaticResponse = true;
        }
        // ── Nhóm 27: Hướng dẫn bảo quản chung ──────────────────────
        else if (/\b(giat\s*may|co\s*duoc\s*say|co\s*ui\s*duoc|giat\s*co\s*bi\s*lem|cach\s*giat|giat\s*ao|bao\s*quan)\b/.test(norm)) {
            botText = '**Hướng dẫn giặt & bảo quản đồ thể thao ProSports:**\n- 🧼 Nên giặt bằng **nước lạnh** và lộn trái quần áo trước khi giặt.\n- 🚫 **Tránh sử dụng thuốc tẩy** mạnh hoặc nước xả làm mềm vải (vì sẽ làm giảm tính năng DryFit hút mồ hôi).\n- 💨 Hạn chế sấy ở nhiệt độ cao, nên **phơi tự nhiên** dưới bóng mát.\n- 🌡️ Ủi (nếu cần) ở **nhiệt độ thấp**, tránh ủi trực tiếp lên các logo in/thêu.';
            isStaticResponse = true;
        }
        // ── Nhóm 28: Tài khoản & Đăng nhập ────────────────────────
        else if (/\b(quen\s*mat\s*khau|khong\s*dang\s*nhap|tao\s*tai\s*khoan|loi\s*dang\s*nhap|xoa\s*tai\s*khoan|reg\s*acc|dang\s*ky)\b/.test(norm)) {
            botText = 'Dạ, bạn có thể đăng ký tài khoản mới bằng cách nhấn **Đăng Ký** ở góc phải màn hình, hoặc lấy lại mật khẩu bằng cách bấm nút **Quên mật khẩu** tại trang đăng nhập. Nếu gặp lỗi đăng nhập nào khác hãy chụp màn hình gửi shop hỗ trợ nhé!';
            isStaticResponse = true;
        }
        // ── Nhóm 29: Đóng gói & Quà tặng ──────────────────────────
        else if (/\b(co\s*hop\s*khong|goi\s*qua|tui\s*giay|che\s*ten|che\s*ten\s*san\s*pham|hop\s*giay)\b/.test(norm)) {
            botText = 'Dạ shop đóng gói tiêu chuẩn bằng túi niêm phong gọn gàng và thẩm mỹ ạ. Nếu bạn cần **đóng hộp giấy làm quà tặng** hoặc yêu cầu **che tên sản phẩm** trên nhãn giao hàng, vui lòng để lại ghi chú khi đặt hàng hoặc nhắn trực tiếp cho shop sau khi lên đơn nhé!';
            isStaticResponse = true;
        }
        // ── Nhóm 30: Lịch làm việc Lễ/Tết ──────────────────────────
        else if (/\b(tet\s*co\s*giao|le\s*shop\s*co|chu\s*nhat\s*co\s*giao|nghi\s*le|giao\s*le|giao\s*tet)\b/.test(norm)) {
            botText = 'Dạ shop hoạt động nhận đơn online **24/7 xuyên Lễ/Tết** ạ! Tuy nhiên, việc vận chuyển thực tế sẽ phụ thuộc vào lịch nghỉ của các đơn vị đối tác (thường nghỉ Tết âm lịch 5-7 ngày). Các ngày lễ lớn khác shop vẫn đóng gói giao hàng bình thường ạ!';
            isStaticResponse = true;
        }
        // ── Nhóm 31: Small Talk & Phản hồi bot ────────────────────
        else if (/\b(may\s*la\s*bot|co\s*ai\s*truc|rep\s*cham|tra\s*loi\s*di|tu\s*van\s*voi|admin\s*dau|co\s*nguoi\s*truc|robot)\b/.test(norm)) {
            botText = 'Dạ, mình là **Trợ lý AI** của ProSports ạ. Mình có thể hỗ trợ giải đáp nhanh các thông tin về size, phí ship, đổi trả... Nếu bạn cần gặp nhân viên tư vấn trực tiếp thì cứ nhắn tin nhé, nhân viên sẽ tiếp quản cuộc trò chuyện ngay khi trực tuyến ạ! 🤝';
            isStaticResponse = true;
        }

        if (!isStaticResponse) {
            // Gọi Gemini AI để sinh câu trả lời (chỉ cho các câu hỏi phức tạp)
            const aiReply = await generateBotReply(
                userInput,
                recentHistory,
                activeProductContext
            );
            botText = aiReply.text;
            recommendedProductId = aiReply.recommendedProductId;
        } else {
            console.log(`⚡ Bot trả lời tĩnh (không tốn token): "${userInput.substring(0, 40)}..."`);
        }

        // 5. Lưu tin nhắn bot vào DB (dùng sendChatMessage như Staff gửi bình thường)
        // Dùng conditional spread để tránh lỗi exactOptionalPropertyTypes:
        // khi không có sản phẩm, key 'product_id' hoàn toàn vắng mặt (absent) thay vì gán undefined
        let validProductId: number | undefined = undefined;
        if (recommendedProductId) {
            const { data: prodExists } = await supabaseClient
                .from('products')
                .select('id')
                .eq('id', recommendedProductId)
                .maybeSingle();
            if (prodExists) {
                validProductId = recommendedProductId;
            } else {
                console.warn(`⚠️ Bot suggested non-existent product ID: ${recommendedProductId}`);
            }
        }

        const botMessage = await chatService.sendChatMessage(roomId, BOT_USER_ID, {
            message_type: validProductId ? 'product' : 'text',
            content: botText,
            ...(validProductId ? { product_id: validProductId } : {})
        });

        // 6. Emit socket cho client nhận được tin nhắn bot real-time
        const io = getIO();
        io.to(`user:${clientId}`).emit('chat:newMessage', botMessage);
        // Cũng emit tới admins để ChatPage & badge của Admin/Staff cập nhật real-time
        io.to('admins').emit('chat:newMessage', botMessage);

        console.log(`🤖 Bot đã trả lời phòng #${roomId}: "${botText.substring(0, 60)}..."`);
    } catch (err: any) {
        console.error(`⚠️ Lỗi Bot reply cho phòng #${roomId}:`, err.message);
    }
}

/**
 * Lấy hoặc Khởi tạo phòng chat của Khách hàng
 */
export const initClientRoom = async (req: Request, res: Response): Promise<any> => {
    try {
        const { userId } = req.body;
        if (!userId) {
            return res.status(400).json({ message: 'Vui lòng cung cấp userId khách hàng.' });
        }

        // Kiểm tra xem phòng đã tồn tại trước đó chưa
        const { data: existingRoom } = await supabaseClient
            .from('chat_rooms')
            .select('id')
            .eq('client_id', userId)
            .maybeSingle();

        const room = await chatService.getOrCreateRoom(Number(userId));

        // Nếu phòng chưa tồn tại (tức là vừa được tạo mới), phát socket báo cho admin
        if (!existingRoom) {
            try {
                const io = getIO();
                const roomData = {
                    ...room,
                    last_message: null,
                    unread_count: 0
                };
                io.to('admins').emit('chat:roomCreated', roomData);
            } catch (socketErr) {
                console.error('⚠️ Lỗi phát socket chat:roomCreated:', socketErr);
            }
        }

        return res.status(200).json({
            message: 'Khởi tạo phòng chat thành công.',
            data: room
        });
    } catch (error: any) {
        return res.status(500).json({ message: error.message });
    }
};

/**
 * Lấy lịch sử tin nhắn của phòng chat
 */
export const getClientChatHistory = async (req: Request, res: Response): Promise<any> => {
    try {
        const { roomId } = req.query;
        if (!roomId) {
            return res.status(400).json({ message: 'Vui lòng cung cấp roomId.' });
        }

        const messages = await chatService.getRoomMessages(Number(roomId));
        return res.status(200).json({
            message: 'Tải lịch sử chat thành công.',
            data: messages
        });
    } catch (error: any) {
        return res.status(500).json({ message: error.message });
    }
};

/**
 * Khách hàng gửi tin nhắn mới
 */
export const sendClientMessage = async (req: Request, res: Response): Promise<any> => {
    try {
        const { roomId, userId, message_type, content, product_id, active_product_id } = req.body;

        if (!roomId || !userId || !message_type) {
            return res.status(400).json({ message: 'Thiếu thông tin bắt buộc (roomId, userId, message_type).' });
        }

        // Lấy thông tin phòng chat để xác định trạng thái & nhân viên được gán
        const { data: room, error: roomErr } = await supabaseClient
            .from('chat_rooms')
            .select('assigned_staff_id, client_id, status')
            .eq('id', roomId)
            .maybeSingle();

        if (roomErr || !room) {
            return res.status(404).json({ message: 'Không tìm thấy phòng chat.' });
        }

        // Gửi tin nhắn lưu vào database
        const message = await chatService.sendChatMessage(Number(roomId), Number(userId), {
            message_type,
            content,
            product_id
        });

        // 🔌 Phát sự kiện Real-time Socket.io
        const io = getIO();

        // 1. Gửi tới chính khách hàng (đồng bộ nhiều tab nếu có)
        io.to(`user:${userId}`).emit('chat:newMessage', message);

        // 2. Gửi tới Staff đang nhận hỗ trợ phòng này
        if (room.assigned_staff_id) {
            io.to(`user:${room.assigned_staff_id}`).emit('chat:newMessage', message);
        }

        // 3. Gửi tới tất cả Admin/Staff qua phòng 'admins' để cập nhật danh sách chờ
        io.to('admins').emit('chat:newMessage', message);

        // ─────────────────────────────────────────────────────────────
        // 🤖 AI BOT AUTO-REPLY: Chỉ kích hoạt khi phòng đang "waiting"
        // (Chưa có Staff nào nhận — Bot đóng vai trò hỗ trợ tạm thời)
        // ─────────────────────────────────────────────────────────────
        if (room.status === 'waiting') {
            // Chạy bất đồng bộ không block response — client nhận response ngay
            triggerBotReply(Number(roomId), Number(userId), active_product_id ? Number(active_product_id) : undefined).catch(err =>
                console.error('⚠️ Không thể kích hoạt Bot reply:', err)
            );
        }

        return res.status(201).json({
            message: 'Gửi tin nhắn thành công.',
            data: message
        });
    } catch (error: any) {
        return res.status(500).json({ message: error.message });
    }
};

/**
 * Khách hàng đánh dấu đã đọc tin nhắn của Staff
 */
export const markClientMessagesRead = async (req: Request, res: Response): Promise<any> => {
    try {
        const { roomId, userId } = req.body;
        if (!roomId || !userId) {
            return res.status(400).json({ message: 'Thiếu roomId hoặc userId.' });
        }

        await chatService.markAsRead(Number(roomId), Number(userId));

        // Phát tín hiệu Socket cho Staff phụ trách biết tin đã được đọc
        const { data: room } = await supabaseClient
            .from('chat_rooms')
            .select('assigned_staff_id')
            .eq('id', roomId)
            .maybeSingle();

        if (room && room.assigned_staff_id) {
            getIO().to(`user:${room.assigned_staff_id}`).emit('chat:readStatus', { roomId, userId });
        }

        return res.status(200).json({ message: 'Đã đánh dấu xem tin nhắn.' });
    } catch (error: any) {
        return res.status(500).json({ message: error.message });
    }
};
