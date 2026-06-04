import React, { useState, useEffect, useRef } from "react";
import { 
  MessageSquare, 
  X, 
  Send, 
  Bot, 
  User as UserIcon, 
  Sparkles, 
  ChevronRight,
  ShoppingBag
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getProducts } from "../services/client/product/apiClient";
import axiosInstance from "../utils/axiosConfig";
import ip from "../utils/ip";

interface Message {
  id: string;
  sender: "bot" | "user";
  text: string;
  timestamp: Date;
  suggestions?: string[];
  links?: { label: string; url: string }[];
  products?: {
    id: number;
    name: string;
    image_url: string;
    price: number;
    brand: string;
  }[];
}

export default function AIChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      sender: "bot",
      text: "Xin chào! Tôi là Trợ lý Ảo **SportStride AI**.\n\nTôi ở đây để hỗ trợ bạn trải nghiệm mua sắm tốt nhất. Bạn có thể chọn nhanh các nghiệp vụ hỗ trợ phổ biến dưới đây:",
      timestamp: new Date(),
      suggestions: [
        "📏 Tính Size: Cao & Nặng",
        "☀️ Chọn đồ thể thao Mùa Hè",
        "❄️ Chọn đồ thể thao Mùa Đông",
        "🛒 Hướng dẫn mua & thanh toán",
        "❌ Hướng dẫn tự Hủy Đơn Hàng",
        "📞 Gửi khiếu nại & góp ý",
        "📍 Links nhanh: Giỏ hàng / Đơn hàng"
      ]
    }
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [unreadCount, setUnreadCount] = useState(1);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Tự động cuộn xuống cuối khi có tin nhắn mới
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isTyping]);

  const handleOpenToggle = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      setUnreadCount(0);
    }
  };

  const processUserMessage = (text: string) => {
    setIsTyping(true);

    setTimeout(async () => {
      const cleanedText = text.toLowerCase().trim();
      let replyText = "";
      let suggestions: string[] = [];
      let links: { label: string; url: string }[] = [];
      let foundProducts: any[] = [];

      // Hàm xử lý Local Fallback khi không có API key hoặc lỗi kết nối
      const runLocalFallback = async () => {
        // 1. Phân tích tư vấn size (Chiều cao / Cân nặng)
        const heightMatch = cleanedText.match(/(\d{1,3})\s*(cm|m|cm|met)/);
        const weightMatch = cleanedText.match(/(\d{1,3})\s*(kg|kí|kilogam)/);
        
        let detectedHeight = heightMatch ? parseInt(heightMatch[1]) : null;
        let detectedWeight = weightMatch ? parseInt(weightMatch[1]) : null;

        if (!detectedHeight) {
          const metMatch = cleanedText.match(/1m(\d{2})/);
          if (metMatch) {
            detectedHeight = 100 + parseInt(metMatch[1]);
          } else if (cleanedText.includes("1.7") || cleanedText.includes("1,7")) {
            detectedHeight = 170;
          } else if (cleanedText.includes("1.8") || cleanedText.includes("1,8")) {
            detectedHeight = 180;
          } else if (cleanedText.includes("1.6") || cleanedText.includes("1,6")) {
            detectedHeight = 160;
          }
        }

        if (!detectedWeight) {
          const weightWordMatch = cleanedText.match(/(nặng|nặng|nặng khoảng|nặng tầm)\s*(\d{2,3})/);
          if (weightWordMatch) detectedWeight = parseInt(weightWordMatch[2]);
        }
        if (!detectedHeight) {
          const heightWordMatch = cleanedText.match(/(cao|cao khoảng|cao tầm)\s*(\d{2,3})/);
          if (heightWordMatch) detectedHeight = parseInt(heightWordMatch[2]);
        }

        const isSearchIntent = 
          cleanedText.includes("tìm") || 
          cleanedText.includes("mua") || 
          cleanedText.includes("áo") || 
          cleanedText.includes("quần") || 
          cleanedText.includes("giày") || 
          cleanedText.includes("mẫu") || 
          cleanedText.includes("sneaker") || 
          cleanedText.includes("adidas") || 
          cleanedText.includes("nike") || 
          cleanedText.includes("jacket") || 
          cleanedText.includes("short");

        if (cleanedText.includes("tính size: cao & nặng") || cleanedText.includes("tính size nhanh")) {
          replyText = `Bạn hãy nhập chiều cao và cân nặng để tôi tính size chính xác cho bạn nhé!\n\n**Ví dụ:** Nhập *"Tôi cao 1m70 nặng 65kg"* hoặc chỉ cần gõ ngắn gọn *"1m75 70kg"*.`;
          suggestions = ["Tôi cao 1m70 nặng 65kg", "Tôi cao 1m62 nặng 52kg"];
        }
        else if (detectedWeight || detectedHeight) {
          const w = detectedWeight || 65; 
          const h = detectedHeight || 170; 

          let recommendedSize = "L";
          let adviceText = "";

          if (w < 50) {
            recommendedSize = "S";
            adviceText = "Bạn có vóc dáng khá thanh mảnh, size S sẽ ôm vừa vặn và tôn dáng nhất.";
          } else if (w >= 50 && w < 62) {
            recommendedSize = "M";
            adviceText = "Với cân nặng này, size M sẽ mang lại cảm giác thoải mái, vừa vặn mà không quá rộng.";
          } else if (w >= 62 && w < 73) {
            recommendedSize = "L";
            adviceText = "Size L là lựa chọn chuẩn xác nhất cho bạn, vừa đảm bảo tính thời trang vừa thoải mái vận động thể thao.";
          } else if (w >= 73 && w < 85) {
            recommendedSize = "XL";
            adviceText = "Bạn nên chọn size XL để có độ rộng rãi thoải mái tối đa khi tập luyện hay dạo phố.";
          } else {
            recommendedSize = "XXL";
            adviceText = "Size XXL là phù hợp nhất để mang lại sự dễ chịu cho các hoạt động thể thao cường độ cao.";
          }

          if (h > 180 && recommendedSize === "M") {
            recommendedSize = "L";
            adviceText += " (Do bạn cao trên 1m80, nên lấy lên size L để chiều dài áo quần được thoải mái hơn).";
          } else if (h < 160 && recommendedSize === "L") {
            recommendedSize = "M";
            adviceText += " (Do chiều cao dưới 1m60, bạn có thể cân nhắc size M để tránh bị quá dài rộng).";
          }

          replyText = `Dựa trên chỉ số của bạn (**Cao ${h}cm, Nặng ${w}kg**):\n\n👉 Size trang phục SportStride phù hợp nhất là: **Size ${recommendedSize}**.\n\n${adviceText}\n\n*Lưu ý: Bảng size mang tính chất tham khảo 90%. Nếu bạn thích mặc ôm (body fit) hoặc rộng rãi (oversize), hãy điều chỉnh tăng/giảm 1 size nhé!*`;
          suggestions = ["🛍️ Xem tất cả sản phẩm", "💬 Tư vấn size khác"];
        }
        else if (cleanedText.includes("size") || cleanedText.includes("kích cỡ") || cleanedText.includes("chọn cỡ") || cleanedText.includes("chọn size")) {
          replyText = `**HƯỚNG DẪN CHỌN SIZE TRANG PHỤC SPORTSTRIDE**\n\nBạn có thể tự tính size nhanh bằng cách gửi chiều cao & cân nặng cho tôi (Ví dụ: *"Tôi cao 1m72 nặng 64kg"*).\n\n**Bảng size tham khảo:**\n• **Size S**: Cao dưới 1m60 | Nặng dưới 50kg\n• **Size M**: Cao 1m60 - 1m68 | Nặng 50 - 61kg\n• **Size L**: Cao 1m68 - 1m75 | Nặng 62 - 72kg\n• **Size XL**: Cao 1m75 - 1m82 | Nặng 73 - 84kg\n• **Size XXL**: Cao trên 1m80 | Nặng trên 85kg`;
          suggestions = ["Tôi cao 1m70 nặng 65kg", "Tôi cao 1m60 nặng 50kg", "🛍️ Mua sắm ngay"];
        }
        else if (cleanedText.includes("mùa") || cleanedText.includes("hè") || cleanedText.includes("nóng") || cleanedText.includes("đông") || cleanedText.includes("lạnh") || cleanedText.includes("thời tiết")) {
          if (cleanedText.includes("hè") || cleanedText.includes("nóng") || cleanedText.includes("ấm")) {
            replyText = `**TƯ VẤN THỜI TRANG MÙA HÈ (SUMMER ACTIVE)**\n\nĐối với thời tiết nắng nóng, bạn nên chọn các sản phẩm làm từ chất liệu **Polyester khô nhanh (Dry-fit)** hoặc cotton pha thun co giãn tốt:\n\n1. **Áo thun thể thao**: Thấm hút mồ hôi vượt trội, thoáng khí cực mát.\n2. **Quần short chạy bộ/tập gym**: Thiết kế gọn nhẹ, xẻ gấu giúp cử động linh hoạt.\n3. **Giày thể thao thoáng khí**: Lớp lưới (Mesh) giúp chân luôn khô ráo.`;
            links = [
              { label: "Xem Bộ sưu tập Mùa Hè", url: "/collections/1" },
              { label: "Xem Sản phẩm Bán chạy", url: "/best-sellers" }
            ];
          } else if (cleanedText.includes("đông") || cleanedText.includes("lạnh") || cleanedText.includes("mưa")) {
            replyText = `**TƯ VẤN THỜI TRANG MÙA ĐÔNG (WINTER COLD-READY)**\n\nGiữ ấm cơ thể khi tập luyện ngoài trời lạnh là rất quan trọng. SportStride gợi ý:\n\n1. **Áo khoác gió 2 lớp chống nước nhẹ**: Cản gió, chống sương muối.\n2. **Áo Hoodie & Sweater thể thao**: Ấm áp, phong cách streetwear năng động.\n3. **Quần jogger nỉ/thun dày**: Co giãn tốt mà vẫn giữ ấm đôi chân cực tốt.`;
            links = [
              { label: "Áo Khoác & Hoodie", url: "/products?category=ao-khoac" },
              { label: "Quần dài thể thao", url: "/products?category=quan-dai" }
            ];
          } else {
            replyText = `Thời tiết hiện tại rất thích hợp để tập luyện thể thao! SportStride luôn có đầy đủ các bộ sưu tập theo mùa:\n\n• **Mùa hè**: Áo thun dry-fit, áo ba lỗ, quần đùi.\n• **Mùa đông**: Áo khoác gió, áo hoodie dày, quần jogger nỉ co giãn.\n\nBạn muốn xem đồ cho mùa nào để tôi gửi link trực tiếp?`;
            suggestions = ["☀️ Đồ thể thao Mùa Hè", "❄️ Đồ giữ ấm Mùa Đông"];
          }
        }
        else if (cleanedText.includes("đặt hàng") || cleanedText.includes("mua hàng") || cleanedText.includes("thanh toán") || cleanedText.includes("cách đặt")) {
          replyText = `**CÁC BƯỚC ĐẶT HÀNG TRÊN SPORTSTRIDE:**\n\n1. **Bước 1**: Chọn sản phẩm yêu thích, chọn size và màu sắc rồi bấm **Thêm vào giỏ hàng**.\n2. **Bước 2**: Bấm vào biểu tượng **Giỏ hàng** ở góc trên màn hình.\n3. **Bước 3**: Nhập thông tin giao hàng (Họ tên, SĐT, Địa chỉ chi tiết).\n4. **Bước 4**: Chọn phương thức thanh toán (COD hoặc chuyển khoản qua ngân hàng/ví điện tử) và bấm **Đặt hàng**.\n\nHệ thống sẽ gửi email xác nhận ngay lập tức cho bạn khi đơn được tạo thành công!`;
          links = [
            { label: "Đi tới Giỏ hàng", url: "/cart" },
            { label: "Khám phá Sản phẩm", url: "/products" }
          ];
        }
        else if (cleanedText.includes("hủy đơn") || cleanedText.includes("hủy hàng") || cleanedText.includes("hủy") || cleanedText.includes("cancel")) {
          replyText = `**HƯỚNG DẪN HỦY ĐƠN HÀNG:**\n\nBạn hoàn toàn có thể tự gửi yêu cầu hủy đơn hàng cực kỳ dễ dàng:\n\n1. Vào trang **Lịch sử đơn hàng** trong mục tài khoản cá nhân.\n2. Tìm đơn hàng bạn muốn hủy (Đơn phải ở trạng thái **Chờ duyệt** hoặc **Đã xác nhận**).\n3. Bấm nút **Yêu cầu hủy**, điền lý do và xác nhận.\n\n*Lưu ý: Nếu đơn hàng đã chuyển sang trạng thái "Đang đóng gói" hoặc "Đang giao", bạn vui lòng liên hệ trực tiếp hotline hoặc mục khiếu nại để được hỗ trợ.*`;
          links = [
            { label: "Xem Đơn hàng của tôi", url: "/orders" }
          ];
          suggestions = ["📞 Gửi khiếu nại & góp ý"];
        }
        else if (cleanedText.includes("khiếu nại") || cleanedText.includes("góp ý") || cleanedText.includes("phản hồi")) {
          replyText = `**HƯỚNG DẪN GỬI KHIẾU NẠI & GÓP Ý:**\n\nSportStride luôn sẵn sàng lắng nghe mọi ý kiến đóng góp của bạn để nâng cao chất lượng dịch vụ:\n\n1. Hãy đăng nhập vào tài khoản của bạn.\n2. Đi tới trang **Hồ sơ cá nhân**.\n3. Chọn mục **Khiếu nại** ở thanh menu bên trái.\n4. Bấm nút **Gửi khiếu nại mới**, chọn đơn hàng liên quan, nhập nội dung và bấm gửi.\n\nBan quản trị sẽ kiểm tra và phản hồi lại bạn sớm nhất kèm thông báo qua Email!`;
          links = [
            { label: "👤 Đi tới Hồ sơ & Khiếu nại", url: "/profile" }
          ];
          suggestions = ["🛒 Hướng dẫn mua hàng", "📦 Đơn hàng của tôi"];
        }
        else if (cleanedText.includes("ở đâu") || cleanedText.includes("địa chỉ") || cleanedText.includes("chuyên mục") || cleanedText.includes("links nhanh") || cleanedText.includes("tìm mục")) {
          replyText = `Đây là các đường dẫn nhanh đến các chuyên mục lớn trên website của chúng tôi:\n\n• 🛒 **Giỏ hàng**: Quản lý các sản phẩm đã chọn và tiến hành thanh toán.\n• 📦 **Đơn hàng của tôi**: Theo dõi lịch sử, tiến trình giao hàng và gửi yêu cầu hủy đơn.\n• 👤 **Hồ sơ cá nhân**: Cập nhật thông tin giao hàng và gửi khiếu nại hỗ trợ.\n• 🌟 **Sản phẩm mới**: Cập nhật xu hướng thời trang thể thao mới nhất.\n• 🔥 **Bán chạy nhất**: Các mẫu giày, quần áo thể thao đang hot nhất.`;
          links = [
            { label: "🛒 Giỏ hàng", url: "/cart" },
            { label: "📦 Đơn hàng của tôi", url: "/orders" },
            { label: "👤 Hồ sơ cá nhân", url: "/profile" },
            { label: "🌟 Sản phẩm mới", url: "/new-arrivals" }
          ];
        }
        else if (isSearchIntent) {
          let cleanQuery = cleanedText;
          for (const word of ["tìm kiếm", "tìm", "muốn mua", "mua", "cần tìm", "có bán", "có", "sản phẩm"]) {
            if (cleanQuery.startsWith(word)) {
              cleanQuery = cleanQuery.slice(word.length).trim();
            }
          }
          
          try {
            const res = await getProducts({ search: cleanQuery || cleanedText, limit: 3 });
            if (res && res.data && res.data.data && res.data.data.length > 0) {
              foundProducts = res.data.data.map(p => ({
                id: p.id,
                name: p.name,
                brand: p.brand,
                price: p.base_price,
                image_url: p.product_images.find((img: any) => img.is_main)?.image_url || p.product_images[0]?.image_url || ""
              }));
              
              replyText = `🔍 Tôi tìm thấy **${res.data.data.length} sản phẩm** phù hợp với yêu cầu của bạn:\n\nBạn có thể click trực tiếp vào sản phẩm bên dưới để xem chi tiết và chọn size mua hàng!`;
              suggestions = ["🛍️ Xem tất cả sản phẩm", "📏 Tư vấn chọn size"];
            } else {
              replyText = `Chúng tôi hiện chưa tìm thấy sản phẩm nào khớp với từ khóa *"${cleanQuery || text}"*.\n\nBạn có thể thử tìm kiếm với từ khóa chung hơn như: *giày*, *áo thun*, *quần short* hoặc truy cập danh mục sản phẩm của shop nhé!`;
              links = [{ label: "🛍️ Khám phá cửa hàng", url: "/products" }];
              suggestions = ["📏 Tính Size: Cao & Nặng"];
            }
          } catch (err) {
            replyText = `Rất tiếc, đã xảy ra lỗi trong quá trình kết nối dữ liệu sản phẩm. Bạn có thể tự tìm kiếm bằng thanh tìm kiếm ở đầu trang nhé!`;
            links = [{ label: "🛍️ Danh sách sản phẩm", url: "/products" }];
          }
        }
        else if (cleanedText.includes("xin chào") || cleanedText.includes("hello") || cleanedText.includes("hi") || cleanedText.includes("chào")) {
          replyText = `Xin chào! Rất vui được trò chuyện với bạn. Tôi có thể hỗ trợ gì cho hành trình mua sắm đồ thể thao của bạn hôm nay?`;
          suggestions = ["📏 Tính Size: Cao & Nặng", "👟 Xem sản phẩm mới", "🛒 Hướng dẫn đặt hàng"];
        }
        else if (cleanedText.includes("cảm ơn") || cleanedText.includes("cám ơn") || cleanedText.includes("thank")) {
          replyText = `Dạ không có gì ạ! Chúc bạn có một trải nghiệm mua sắm tuyệt vời tại SportStride. Nếu cần hỗ trợ thêm, bạn cứ nhắn tin nhé! 😊`;
          suggestions = ["🛍️ Tiếp tục mua sắm", "❓ Hỏi câu khác"];
        }
        else {
          try {
            const res = await getProducts({ search: cleanedText, limit: 3 });
            if (res && res.data && res.data.data && res.data.data.length > 0) {
              foundProducts = res.data.data.map(p => ({
                id: p.id,
                name: p.name,
                brand: p.brand,
                price: p.base_price,
                image_url: p.product_images.find((img: any) => img.is_main)?.image_url || p.product_images[0]?.image_url || ""
              }));
              
              replyText = `🔍 Tôi tìm thấy một số sản phẩm phù hợp với câu hỏi của bạn:\n\nBạn có thể click trực tiếp vào sản phẩm bên dưới để xem chi tiết!`;
              suggestions = ["🛍️ Xem tất cả sản phẩm", "📏 Tư vấn chọn size"];
            } else {
              replyText = `Tôi đã nhận được câu hỏi của bạn. Để giúp bạn nhanh nhất, bạn có thể tham khảo các chủ đề hỗ trợ phổ biến bên dưới, hoặc nhập cụ thể hơn như *"Tôi cao 1m75 nặng 70kg thì mặc size gì?"*, *"hướng dẫn hủy đơn"* hoặc *"xem đồ mùa hè"* nhé!`;
              suggestions = [
                "📏 Tính Size: Cao & Nặng",
                "🛒 Hướng dẫn mua & thanh toán",
                "❌ Hướng dẫn tự Hủy Đơn Hàng",
                "📞 Gửi khiếu nại & góp ý"
              ];
            }
          } catch (err) {
            replyText = `Tôi chưa hiểu rõ câu hỏi của bạn. Bạn vui lòng chọn một trong các nghiệp vụ hỗ trợ bên dưới hoặc nhập chi tiết hơn nhé!`;
            suggestions = [
              "📏 Tính Size: Cao & Nặng",
              "🛒 Hướng dẫn mua & thanh toán",
              "❌ Hướng dẫn tự Hủy Đơn Hàng",
              "📞 Gửi khiếu nại & góp ý"
            ];
          }
        }
      };

      // Gọi backend API gửi tin nhắn tới Gemini
      try {
        const response = await axiosInstance.post(`${ip}/chatbot`, { message: text });
        if (response.data && response.data.mode === "gemini") {
          replyText = response.data.reply;
          foundProducts = response.data.products || [];
          suggestions = [
            "📏 Tính Size: Cao & Nặng",
            "🛍️ Xem sản phẩm mới",
            "📞 Gửi khiếu nại & góp ý",
            "📍 Links nhanh"
          ];
        } else {
          // Chế độ fallback nếu API trả về fallback mode
          await runLocalFallback();
        }
      } catch (err) {
        console.warn("Lỗi kết nối tới backend Chatbot API, chuyển sang chạy Local NLP:", err);
        await runLocalFallback();
      }

      const botMessage: Message = {
        id: Math.random().toString(),
        sender: "bot",
        text: replyText,
        timestamp: new Date(),
        suggestions,
        links,
        products: foundProducts
      };

      setMessages(prev => [...prev, botMessage]);
      setIsTyping(false);
    }, 1000);
  };

  const handleSendMessage = (textToSend?: string) => {
    const text = textToSend || inputValue;
    if (!text.trim()) return;

    // Add user message
    const userMessage: Message = {
      id: Math.random().toString(),
      sender: "user",
      text,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    if (!textToSend) {
      setInputValue("");
    }

    processUserMessage(text);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSendMessage();
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    const cleanText = suggestion.replace(/^[\p{Emoji}\s]+/u, "");
    handleSendMessage(cleanText);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
  };

  const renderMessageText = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return <strong key={i} className="font-semibold text-gray-900">{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };

  return (
    <div className="fixed z-50 font-sans">
      {/* Floating Chat Button */}
      {!isOpen && (
        <button
          onClick={handleOpenToggle}
          style={{ position: "fixed", right: "24px", bottom: "85px" }}
          className="flex items-center justify-center w-14 h-14 bg-[#af101a] text-white rounded-full shadow-2xl hover:scale-105 active:scale-95 transition-all duration-300 relative group"
          title="SportStride AI Assistant"
        >
          <div className="absolute inset-0 bg-[#af101a] rounded-full animate-ping opacity-25"></div>
          <MessageSquare className="w-6 h-6" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-yellow-500 text-black text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center shadow-lg border border-white">
              {unreadCount}
            </span>
          )}
          
          {/* Tooltip */}
          <span className="absolute right-16 scale-0 group-hover:scale-100 transition-all duration-200 bg-[#191c1e] text-white text-xs px-3 py-2 rounded-lg whitespace-nowrap shadow-lg">
            ⚡ Trò chuyện với AI SportStride
          </span>
        </button>
      )}

      {/* Glassmorphic Chat Window */}
      {isOpen && (
        <div 
          style={{ position: "fixed", right: "24px", bottom: "20px" }}
          className="flex flex-col w-[370px] sm:w-[400px] h-[500px] bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-gray-200/80 overflow-hidden transition-all duration-300 animate-in fade-in slide-in-from-bottom-10"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 bg-[#191c1e] text-white border-b border-[#af101a]">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="flex items-center justify-center w-10 h-10 bg-[#af101a] rounded-full text-white">
                  <Bot className="w-5 h-5" />
                </div>
                <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-[#191c1e] animate-pulse"></div>
              </div>
              <div>
                <h3 className="font-bold text-sm leading-none flex items-center gap-1.5">
                  SportStride AI <Sparkles className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
                </h3>
                <span className="text-[10px] text-gray-400 flex items-center gap-1">
                  Trợ lý thời trang & dịch vụ tự động
                </span>
              </div>
            </div>
            <button 
              onClick={handleOpenToggle}
              className="p-1.5 hover:bg-white/10 rounded-full transition-colors text-gray-300 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50">
            {messages.map((msg) => (
              <div 
                key={msg.id}
                className={`flex gap-2.5 max-w-[85%] ${msg.sender === "user" ? "ml-auto flex-row-reverse" : ""}`}
              >
                {/* Avatar */}
                <div className={`flex items-center justify-center w-7 h-7 rounded-full shrink-0 ${
                  msg.sender === "bot" ? "bg-[#af101a] text-white" : "bg-gray-200 text-gray-600"
                }`}>
                  {msg.sender === "bot" ? <Bot className="w-4 h-4" /> : <UserIcon className="w-4 h-4" />}
                </div>

                {/* Message Box */}
                <div className="space-y-1.5">
                  <div className={`p-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                    msg.sender === "bot" 
                      ? "bg-white text-gray-800 rounded-tl-none border border-gray-100 shadow-sm" 
                      : "bg-[#af101a] text-white rounded-tr-none shadow-sm"
                  }`}>
                    {renderMessageText(msg.text)}

                    {/* Render Products cards if any */}
                    {msg.products && msg.products.length > 0 && (
                      <div className="mt-3 space-y-2">
                        {msg.products.map((prod) => (
                          <div 
                            key={prod.id}
                            onClick={() => {
                              setIsOpen(false);
                              navigate(`/products/${prod.id}`);
                            }}
                            className="flex items-center gap-3 p-2 bg-white hover:bg-gray-50 border border-gray-150 rounded-xl cursor-pointer transition-colors shadow-sm group"
                          >
                            <img 
                              src={prod.image_url || "/placeholder-product.png"} 
                              alt={prod.name} 
                              className="w-12 h-12 object-cover rounded-lg border border-gray-100" 
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-semibold text-gray-800 truncate group-hover:text-[#af101a]">{prod.name}</p>
                              <p className="text-[10px] text-gray-400 font-medium">{prod.brand}</p>
                              <p className="text-xs font-bold text-[#af101a] mt-0.5">
                                {prod.price.toLocaleString("vi-VN")} đ
                              </p>
                            </div>
                            <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-[#af101a] shrink-0" />
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Render Navigation Links if any */}
                    {msg.links && msg.links.length > 0 && (
                      <div className="mt-3 pt-2.5 border-t border-gray-100 space-y-2">
                        {msg.links.map((link, idx) => (
                          <button
                            key={idx}
                            onClick={() => {
                              setIsOpen(false);
                              navigate(link.url);
                            }}
                            className="flex items-center justify-between w-full px-3 py-1.5 text-xs text-left font-medium text-[#af101a] bg-[#ffdad6]/30 hover:bg-[#ffdad6]/60 rounded-lg transition-colors group/link"
                          >
                            <span className="flex items-center gap-1.5">
                              <ShoppingBag className="w-3.5 h-3.5" />
                              {link.label}
                            </span>
                            <ChevronRight className="w-3.5 h-3.5 transform group-hover/link:translate-x-0.5 transition-transform" />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  {/* Timestamp */}
                  <span className={`text-[10px] text-gray-400 block ${msg.sender === "user" ? "text-right" : ""}`}>
                    {formatTime(msg.timestamp)}
                  </span>

                  {/* Suggestions Chips (only for latest bot message) */}
                  {msg.sender === "bot" && msg.suggestions && msg.suggestions.length > 0 && msg.id === messages[messages.length - 1].id && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {msg.suggestions.map((sug, i) => (
                        <button
                          key={i}
                          onClick={() => handleSuggestionClick(sug)}
                          className="px-2.5 py-1 text-xs bg-white text-gray-700 hover:text-[#af101a] hover:bg-[#ffdad6]/20 border border-gray-200 hover:border-[#af101a]/50 rounded-full transition-all duration-200 shadow-sm flex items-center gap-1"
                        >
                          {sug}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Typing Indicator */}
            {isTyping && (
              <div className="flex gap-2.5 max-w-[85%]">
                <div className="flex items-center justify-center w-7 h-7 rounded-full bg-[#af101a] text-white shrink-0">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="p-3 bg-white border border-gray-100 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-1.5">
                  <span className="w-2 h-2 bg-[#af101a] rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></span>
                  <span className="w-2 h-2 bg-[#af101a] rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></span>
                  <span className="w-2 h-2 bg-[#af101a] rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Footer Input Bar */}
          <div className="p-3 bg-white border-t border-gray-100 flex items-center gap-2">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Nhập câu hỏi của bạn (Ví dụ: Cao 1m75 nặng 65kg)..."
              className="flex-1 px-4 py-2.5 text-sm bg-gray-50 border border-gray-200 focus:border-[#af101a]/50 focus:bg-white rounded-full outline-none transition-all"
            />
            <button
              onClick={() => handleSendMessage()}
              disabled={!inputValue.trim()}
              className="flex items-center justify-center w-10 h-10 bg-[#af101a] disabled:bg-gray-100 text-white disabled:text-gray-400 rounded-full hover:scale-105 active:scale-95 transition-all shrink-0 shadow-md"
            >
              <Send className="w-4.5 h-4.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
