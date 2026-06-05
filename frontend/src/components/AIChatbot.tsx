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
      let replyText = "";
      let suggestions: string[] = [];
      let links: { label: string; url: string }[] = [];
      let foundProducts: any[] = [];

      // Gọi backend API (Hybrid: Local Logic + Gemini AI)
      try {
        const response = await axiosInstance.post(`${ip}/chatbot`, { message: text });
        const data = response.data;

        if (data && (data.mode === "local" || data.mode === "gemini")) {
          replyText = data.reply || "Xin lỗi, mình chưa hiểu rõ ý bạn.";
          foundProducts = data.products || [];
          suggestions = data.suggestions || [];
          links = data.links || [];
        } else {
          replyText = "Dạ hiện tại hệ thống đang bảo trì. Bạn vui lòng thử lại sau nhé! 😊";
          suggestions = ["📏 Tính Size", "🛒 Giỏ hàng", "📦 Đơn hàng"];
        }
      } catch (err) {
        console.warn("Lỗi kết nối Chatbot API:", err);
        replyText = "Xin lỗi, không thể kết nối đến hệ thống. Bạn vui lòng thử lại sau hoặc liên hệ hotline nhé!";
        suggestions = ["📏 Tính Size", "🛒 Giỏ hàng", "📦 Đơn hàng"];
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
    }, 500);
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
