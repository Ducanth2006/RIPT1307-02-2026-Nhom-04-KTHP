import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Badge, Button, Input, Card, Spin, message } from "antd";
import {
  CloseOutlined, SendOutlined, InfoCircleOutlined,
  RobotOutlined, UserOutlined, ShoppingOutlined
} from "@ant-design/icons";
import { Bot, Sparkles, ChevronRight, ShoppingBag, X, Send, MessageSquare } from "lucide-react";
import { socket } from "../../utils/socket";
import {
  initClientRoom, getClientMessages,
  sendClientMessage, markClientMessagesRead
} from "../../services/client/chat/apiClient";

const BOT_USER_ID = 999999;

// Gợi ý chào mừng (giống AIChatbot cũ)
const WELCOME_SUGGESTIONS = [
  "📏 Tính Size: Cao & Nặng",
  "☀️ Chọn đồ thể thao Mùa Hè",
  "❄️ Chọn đồ thể thao Mùa Đông",
  "🛒 Hướng dẫn mua & thanh toán",
  "❌ Hướng dẫn tự Hủy Đơn Hàng",
  "📞 Gửi khiếu nại & góp ý",
];

interface ProductPreview {
  id: number; name: string; brand: string; base_price: number; image_url: string;
}

// ── Render **bold** markdown đơn giản ──────────────────────────
function renderMarkdown(text: string) {
  return text.split(/(\*\*.*?\*\*)/g).map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i} style={{ fontWeight: 700, color: "#1f1f1f" }}>{part.slice(2, -2)}</strong>;
    }
    return <span key={i}>{part}</span>;
  });
}

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [roomId, setRoomId] = useState<number | null>(null);
  const [roomStatus, setRoomStatus] = useState<"waiting" | "in_progress">("waiting");
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [unreadCount, setUnreadCount] = useState(0);
  const [pendingProduct, setPendingProduct] = useState<ProductPreview | null>(null);
  const [staffInfo, setStaffInfo] = useState<string | null>(null);
  const [isBotTyping, setIsBotTyping] = useState(false);
  const [isSending, setIsSending] = useState(false);
  // Suggestions của tin bot cuối cùng (không lưu DB, chỉ local state)
  const [currentSuggestions, setCurrentSuggestions] = useState<string[]>(WELCOME_SUGGESTIONS);

  // Refs để tránh stale closure trong socket handler
  const roomIdRef = useRef<number | null>(null);
  const isOpenRef = useRef(false); // sync với isOpen nhưng không trigger re-register listener

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const botTypingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const navigate = useNavigate();

  const userStr = localStorage.getItem("user");
  const userObj = userStr ? JSON.parse(userStr) : null;
  const userId = userObj?.id;

  // Mở chat từ trang chi tiết sản phẩm
  useEffect(() => {
    const handleOpenChat = () => { setIsOpen(true); checkPendingProduct(); };
    window.addEventListener("open_chat_widget", handleOpenChat);
    return () => window.removeEventListener("open_chat_widget", handleOpenChat);
  }, []);

  const checkPendingProduct = () => {
    const stored = sessionStorage.getItem("pending_chat_product");
    setPendingProduct(stored ? JSON.parse(stored) : null);
  };

  // Khởi tạo phòng chat khi mở widget
  useEffect(() => {
    if (!userId || !isOpen) return;
    const startChat = async () => {
      try {
        setLoading(true);
        const res = await initClientRoom(userId);
        const room = res.data;
        setRoomId(room.id);
        roomIdRef.current = room.id; // sync ref ngay lập tức
        setRoomStatus(room.status || "waiting");
        if (room.status === "in_progress" && room.staff) setStaffInfo(room.staff.full_name);
        const msgRes = await getClientMessages(room.id);
        setMessages(msgRes.data);
        await markClientMessagesRead(room.id, userId);
        setUnreadCount(0);
      } catch (err) {
        console.error("Lỗi khi mở phòng chat:", err);
      } finally {
        setLoading(false);
      }
    };
    startChat();
    // Sync isOpenRef khi isOpen thay đổi
    isOpenRef.current = isOpen;
  }, [userId, isOpen]);

  // Socket real-time — chỉ đăng ký 1 lần duy nhất khi userId có giá trị
  // Dùng isOpenRef để đọc giá trị isOpen mới nhất mà không cần re-register listener
  useEffect(() => {
    if (!userId) return;
    socket.emit("join", { userId, role: userObj?.role });

    const handleNewMessage = (msg: any) => {
      const fromOther = Number(msg.sender_id) !== Number(userId);

      // ── TRƯỜNG HỢP 1: Widget chưa được mở lần nào (roomIdRef = null) ──
      if (roomIdRef.current === null) {
        if (fromOther) setUnreadCount(c => c + 1);
        return;
      }

      // ── TRƯỜNG HỢP 2: Widget đã từng mở — lọc đúng phòng ──
      if (Number(msg.room_id) !== Number(roomIdRef.current)) return;

      // Xử lý Bot reply
      if (Number(msg.sender_id) === BOT_USER_ID) {
        setIsBotTyping(false);
        if (botTypingTimer.current) clearTimeout(botTypingTimer.current);
        setCurrentSuggestions(["📏 Tính Size", "🔍 Tìm sản phẩm khác", "📦 Xem đơn hàng", "📞 Liên hệ hỗ trợ"]);
      }

      // Thêm tin nhắn (chống trùng)
      setMessages(prev => prev.some(m => m.id === msg.id) ? prev : [...prev, msg]);

      // Dùng isOpenRef thay vì isOpen để tránh stale closure
      if (!isOpenRef.current && fromOther) {
        setUnreadCount(c => c + 1);
      } else if (isOpenRef.current && fromOther) {
        markClientMessagesRead(roomIdRef.current!, userId);
      }
    };

    const handleStaffConnected = (data: { staffName: string }) => {
      setStaffInfo(data.staffName);
      setRoomStatus("in_progress");
      setIsBotTyping(false);
      if (botTypingTimer.current) clearTimeout(botTypingTimer.current);
      setMessages(prev => [...prev, { id: Date.now(), system: true, content: `Nhân viên ${data.staffName} đã tham gia hỗ trợ.` }]);
    };

    const handleRoomClosed = () => {
      setRoomId(null); setMessages([]); setStaffInfo(null);
      roomIdRef.current = null;
      setRoomStatus("waiting"); setIsOpen(false); setIsBotTyping(false);
      sessionStorage.removeItem("pending_chat_product"); setPendingProduct(null);
      message.info("Phiên hỗ trợ đã được đóng bởi nhân viên.");
    };

    socket.on("chat:newMessage", handleNewMessage);
    socket.on("chat:staffConnected", handleStaffConnected);
    socket.on("chat:roomClosed", handleRoomClosed);
    return () => {
      socket.off("chat:newMessage", handleNewMessage);
      socket.off("chat:staffConnected", handleStaffConnected);
      socket.off("chat:roomClosed", handleRoomClosed);
    };
  }, [userId]); // ← Chỉ userId — không re-register khi isOpen/roomId thay đổi

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, pendingProduct, isBotTyping]);
  useEffect(() => () => { if (botTypingTimer.current) clearTimeout(botTypingTimer.current); }, []);

  const handleToggle = () => {
    if (!userId) {
      message.warning("Vui lòng đăng nhập để chat với nhân viên hỗ trợ!");
      navigate("/login"); return;
    }
    setIsOpen(o => !o);
    if (!isOpen) { setUnreadCount(0); checkPendingProduct(); }
  };

  const triggerBotTyping = () => {
    if (roomStatus === "waiting") {
      setIsBotTyping(true);
      botTypingTimer.current = setTimeout(() => setIsBotTyping(false), 15000);
    }
  };

  const handleSendText = async (textOverride?: string) => {
    const text = textOverride || inputValue;
    if (!text.trim() || !roomId || !userId || isSending) return;
    if (!textOverride) setInputValue("");
    setIsSending(true);
    // Xóa suggestions khi user gửi tin (không cần hiện lại cho đến khi bot reply)
    setCurrentSuggestions([]);
    try {
      await sendClientMessage({ roomId, userId, message_type: "text", content: text });
      triggerBotTyping();
    } catch { message.error("Lỗi khi gửi tin nhắn."); }
    finally { setIsSending(false); }
  };

  // Suggestions đặc biệt → điều hướng sang trang thay vì gửi tin nhắn AI
  const NAVIGATE_SUGGESTIONS: Record<string, string> = {
    "🛒 Hướng dẫn mua & thanh toán": "/cart",
    "❌ Hướng dẫn tự Hủy Đơn Hàng": "/orders",
    "📦 Xem đơn hàng": "/orders",
  };

  const handleSuggestionClick = (sug: string) => {
    // Nếu là suggestion điều hướng → đóng chat và chuyển trang
    if (NAVIGATE_SUGGESTIONS[sug]) {
      setIsOpen(false);
      navigate(NAVIGATE_SUGGESTIONS[sug]);
      return;
    }
    // Còn lại → gửi tin nhắn cho AI
    const clean = sug.replace(/^[\p{Emoji}\s]+/u, "").trim();
    handleSendText(clean);
  };

  const handleSendProduct = async () => {
    if (!pendingProduct || !roomId || !userId || isSending) return;
    const prod = pendingProduct;
    setPendingProduct(null); sessionStorage.removeItem("pending_chat_product"); setIsSending(true);
    try {
      await sendClientMessage({ roomId, userId, message_type: "product", product_id: prod.id });
      triggerBotTyping();
    } catch { message.error("Lỗi khi gửi thẻ sản phẩm."); }
    finally { setIsSending(false); }
  };

  const formatPrice = (p: any) => new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(Number(p) || 0);
  const formatTime = (d: string | Date) => new Date(d).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });

  const isBot = (msg: any) => Number(msg.sender_id) === BOT_USER_ID;
  const isOwn = (msg: any) => Number(msg.sender_id) === Number(userId);


  return (
    <div style={{ position: "fixed", bottom: 24, right: 24, zIndex: 1000, fontFamily: "'Inter', sans-serif" }}>

      {/* ── Floating Button ── */}
      {!isOpen && (
        <button
          onClick={handleToggle}
          style={{
            position: "relative", width: 56, height: 56, borderRadius: "50%",
            backgroundColor: "#af101a", color: "#fff", border: "none", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 4px 20px rgba(175,16,26,0.45)", transition: "transform 0.2s"
          }}
          onMouseEnter={e => (e.currentTarget.style.transform = "scale(1.08)")}
          onMouseLeave={e => (e.currentTarget.style.transform = "scale(1)")}
          title="Chat hỗ trợ"
        >
          <div style={{
            position: "absolute", inset: 0, borderRadius: "50%",
            backgroundColor: "#af101a", animation: "chatPing 2s ease-in-out infinite", opacity: 0.3
          }} />
          <MessageSquare size={22} />
          {unreadCount > 0 && (
            <span style={{
              position: "absolute", top: -4, right: -4, background: "#eab308",
              color: "#000", fontSize: 10, fontWeight: 700, borderRadius: "999px",
              minWidth: 18, padding: "1px 5px", textAlign: "center", border: "2px solid #fff"
            }}>{unreadCount}</span>
          )}
        </button>
      )}

      {/* ── Chat Window ── */}
      {isOpen && (
        <div style={{
          width: 380, height: 520, display: "flex", flexDirection: "column",
          borderRadius: 16, overflow: "hidden",
          boxShadow: "0 20px 60px rgba(0,0,0,0.18)",
          border: "1px solid rgba(255,255,255,0.15)",
          background: "#fff",
          animation: "slideUp 0.25s ease"
        }}>

          {/* Header */}
          <div style={{ padding: "12px 16px", background: "#191c1e", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "2px solid #af101a" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ position: "relative" }}>
                {/* Avatar: hiển thị icon Nhân viên khi staff kết nối, Bot khi chưa */}
                <div style={{
                  width: 40, height: 40, borderRadius: "50%",
                  background: staffInfo ? "#059669" : "#af101a",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  transition: "background 0.3s"
                }}>
                  {staffInfo
                    ? <UserOutlined style={{ fontSize: 18, color: "#fff" }} />
                    : <Bot size={20} color="#fff" />}
                </div>
                <div style={{ position: "absolute", bottom: 0, right: 0, width: 11, height: 11, background: "#22c55e", borderRadius: "50%", border: "2px solid #191c1e" }} />
              </div>
              <div>
                {/* Tiêu đề: tên Staff khi đang hỗ trợ, SportStride AI khi chưa */}
                <div style={{ color: "#fff", fontWeight: 700, fontSize: 13, display: "flex", alignItems: "center", gap: 6 }}>
                  {staffInfo
                    ? <><UserOutlined style={{ fontSize: 12, color: "#6ee7b7" }} /> {staffInfo}</>
                    : <>SportStride AI <Sparkles size={13} color="#facc15" fill="#facc15" /></>}
                </div>
                {staffInfo
                  ? <span style={{ color: "#4ade80", fontSize: 10 }}>● Nhân viên đang hỗ trợ trực tiếp</span>
                  : <span style={{ color: "#9ca3af", fontSize: 10 }}>Trợ lý thời trang &amp; dịch vụ tự động</span>}
              </div>
            </div>
            <button onClick={handleToggle} style={{ background: "none", border: "none", color: "#9ca3af", cursor: "pointer", padding: 4, borderRadius: 6, display: "flex" }}
              onMouseEnter={e => (e.currentTarget.style.color = "#fff")}
              onMouseLeave={e => (e.currentTarget.style.color = "#9ca3af")}>
              <X size={18} />
            </button>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: "auto", padding: 16, display: "flex", flexDirection: "column", gap: 14, background: "rgba(249,250,251,0.7)" }}>
            {loading && <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%" }}><Spin /></div>}

            {!loading && messages.length === 0 && (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 12 }}>
                {/* Welcome bubble */}
                <div style={{ display: "flex", gap: 8, maxWidth: "90%" }}>
                  <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#af101a", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Bot size={14} color="#fff" />
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <div style={{ padding: "9px 13px", borderRadius: "16px 16px 16px 4px", background: "#fff", border: "1px solid #e5e7eb", fontSize: 13, lineHeight: 1.5, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
                      Xin chào! Tôi là <strong>SportStride AI</strong> 🤖<br />
                      Tôi có thể giúp bạn tìm sản phẩm, tư vấn size, hướng dẫn đặt hàng. Chọn nhanh bên dưới:
                    </div>
                    {/* Welcome suggestions */}
                    {roomStatus === "waiting" && (
                      <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                          <div style={{ flex: 1, height: 1, background: "#e5e7eb" }} />
                          <span style={{ fontSize: 10, color: "#9ca3af", whiteSpace: "nowrap", padding: "0 4px" }}>👇 Chọn nhanh hoặc nhập câu hỏi bên dưới</span>
                          <div style={{ flex: 1, height: 1, background: "#e5e7eb" }} />
                        </div>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                          {WELCOME_SUGGESTIONS.map((sug, i) => (
                            <button key={i} onClick={() => handleSuggestionClick(sug)}
                              style={{
                                padding: "5px 11px", fontSize: 11, background: "#fff",
                                border: "1px solid #e5e7eb", borderRadius: 999, cursor: "pointer",
                                color: "#374151", transition: "all 0.15s", display: "flex", alignItems: "center", gap: 4
                              }}
                              onMouseEnter={e => { e.currentTarget.style.borderColor = "#af101a"; e.currentTarget.style.color = "#af101a"; }}
                              onMouseLeave={e => { e.currentTarget.style.borderColor = "#e5e7eb"; e.currentTarget.style.color = "#374151"; }}
                            >{sug}</button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {!loading && messages.map((msg) => {
              if (msg.system) return (
                <div key={msg.id} style={{ alignSelf: "center", background: "#e5e7eb", color: "#6b7280", fontSize: 11, padding: "3px 10px", borderRadius: 10, textAlign: "center" }}>
                  {msg.content}
                </div>
              );

              const own = isOwn(msg);
              const bot = isBot(msg);

              return (
                <div key={msg.id} style={{ display: "flex", gap: 8, maxWidth: "85%", alignSelf: own ? "flex-end" : "flex-start", flexDirection: own ? "row-reverse" : "row" }}>
                  {/* Avatar */}
                  <div style={{ width: 28, height: 28, borderRadius: "50%", background: own ? "#e5e7eb" : "#af101a", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    {own ? <UserOutlined style={{ fontSize: 13, color: "#6b7280" }} /> : <Bot size={14} color="#fff" />}
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: 4, alignItems: own ? "flex-end" : "flex-start" }}>
                    {/* Bubble */}
                    {msg.message_type === "product" && msg.product ? (
                      <div style={{ width: 220, borderRadius: 12, border: bot ? "1px solid #bae6fd" : "1px solid #e5e7eb", background: bot ? "#f0f9ff" : "#fff", padding: 8, cursor: "pointer", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}
                        onClick={() => { setIsOpen(false); navigate(`/products/${msg.product.id}`); }}>
                        {bot && <div style={{ fontSize: 10, color: "#0ea5e9", marginBottom: 5, display: "flex", alignItems: "center", gap: 3, fontWeight: 600 }}><RobotOutlined /> Gợi ý từ AI</div>}
                        <div style={{ display: "flex", gap: 8 }}>
                          <img src={msg.product.image_url || "/placeholder.jpg"} alt="" style={{ width: 48, height: 48, objectFit: "cover", borderRadius: 6, flexShrink: 0 }} />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 12, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{msg.product.name}</div>
                            <div style={{ fontSize: 11, color: "#9ca3af" }}>{msg.product.brand}</div>
                            <div style={{ fontSize: 12, color: "#af101a", fontWeight: 700, marginTop: 2 }}>{formatPrice(msg.product.base_price)}</div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div style={{
                        padding: "9px 13px", borderRadius: own ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                        background: own ? "#af101a" : bot ? "#f0f9ff" : "#fff",
                        color: own ? "#fff" : "#1f1f1f",
                        border: bot ? "1px solid #bae6fd" : own ? "none" : "1px solid #e5e7eb",
                        fontSize: 13, lineHeight: 1.5, boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
                        wordBreak: "break-word", whiteSpace: "pre-wrap"
                      }}>
                        {renderMarkdown(msg.content || "")}
                      </div>
                    )}

                    {/* Timestamp */}
                    <span style={{ fontSize: 10, color: "#9ca3af" }}>{formatTime(msg.created_at)}</span>

                    {/* Suggestion chips — chỉ hiện sau tin bot CUỐI CÙNG khi phòng waiting */}
                    {bot && !own && roomStatus === "waiting" &&
                      msg.id === [...messages].filter(m => isBot(m)).pop()?.id &&
                      currentSuggestions.length > 0 && (
                        <div style={{ display: "flex", flexDirection: "column", gap: 5, marginTop: 4 }}>
                          <span style={{ fontSize: 10, color: "#9ca3af", paddingLeft: 2 }}>💡 Gợi ý tiếp theo — nhấn để hỏi nhanh:</span>
                          <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                            {currentSuggestions.map((sug, i) => (
                              <button key={i} onClick={() => handleSuggestionClick(sug)}
                                style={{
                                  padding: "4px 10px", fontSize: 11, background: "#fff",
                                  border: "1px solid #e5e7eb", borderRadius: 999, cursor: "pointer",
                                  color: "#374151", transition: "all 0.15s", display: "flex", alignItems: "center"
                                }}
                                onMouseEnter={e => { e.currentTarget.style.borderColor = "#af101a"; e.currentTarget.style.color = "#af101a"; }}
                                onMouseLeave={e => { e.currentTarget.style.borderColor = "#e5e7eb"; e.currentTarget.style.color = "#374151"; }}
                              >{sug}</button>
                            ))}
                          </div>
                        </div>
                      )}
                  </div>
                </div>
              );
            })}

            {/* Bot typing indicator */}
            {isBotTyping && (
              <div style={{ display: "flex", gap: 8, maxWidth: "85%", alignSelf: "flex-start" }}>
                <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#af101a", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Bot size={14} color="#fff" />
                </div>
                <div style={{ padding: "10px 14px", borderRadius: "16px 16px 16px 4px", background: "#fff", border: "1px solid #e5e7eb", display: "flex", alignItems: "center", gap: 5, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
                  {[0, 150, 300].map(delay => (
                    <span key={delay} style={{ width: 8, height: 8, borderRadius: "50%", background: "#af101a", display: "inline-block", animation: "botBounce 1.2s infinite", animationDelay: `${delay}ms` }} />
                  ))}
                </div>
              </div>
            )}

            {/* Pending product preview */}
            {pendingProduct && (
              <div style={{ padding: "8px 12px", background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 10, display: "flex", alignItems: "center", gap: 8 }}>
                <img src={pendingProduct.image_url} alt="" style={{ width: 38, height: 38, objectFit: "cover", borderRadius: 6 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 10, color: "#92400e" }}>Gửi sản phẩm đang xem?</div>
                  <div style={{ fontSize: 12, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{pendingProduct.name}</div>
                </div>
                <div style={{ display: "flex", gap: 4 }}>
                  <button onClick={handleSendProduct} style={{ fontSize: 11, padding: "3px 9px", background: "#af101a", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer" }}>Gửi</button>
                  <button onClick={() => { setPendingProduct(null); sessionStorage.removeItem("pending_chat_product"); }} style={{ fontSize: 11, padding: "3px 9px", background: "#f3f4f6", border: "none", borderRadius: 6, cursor: "pointer" }}>Hủy</button>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Footer */}
          <div style={{ padding: "10px 12px", background: "#fff", borderTop: "1px solid #f3f4f6", display: "flex", gap: 8, alignItems: "center" }}>
            <input
              type="text"
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleSendText()}
              placeholder={
                isBotTyping
                  ? "⏳ AI đang soạn trả lời..."
                  : staffInfo
                  ? "Nhập tin nhắn cho nhân viên hỗ trợ..."
                  : "Nhập câu hỏi... (VD: cao 170 nặng 65kg)"
              }
              disabled={loading || !roomId || isSending}
              style={{
                flex: 1, padding: "9px 14px", fontSize: 13, borderRadius: 999,
                border: "1px solid #e5e7eb", background: "#f9fafb", outline: "none",
                transition: "border 0.2s", fontFamily: "inherit"
              }}
              onFocus={e => (e.target.style.borderColor = "#af101a")}
              onBlur={e => (e.target.style.borderColor = "#e5e7eb")}
            />
            <button
              onClick={() => handleSendText()}
              disabled={!inputValue.trim() || loading || !roomId || isSending}
              style={{
                width: 40, height: 40, borderRadius: "50%", flexShrink: 0, border: "none",
                background: !inputValue.trim() ? "#f3f4f6" : "#af101a",
                color: !inputValue.trim() ? "#9ca3af" : "#fff",
                cursor: !inputValue.trim() ? "default" : "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
                transition: "all 0.2s", boxShadow: inputValue.trim() ? "0 4px 12px rgba(175,16,26,0.3)" : "none"
              }}
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes chatPing { 0%,100%{transform:scale(1);opacity:.3} 50%{transform:scale(1.4);opacity:.15} }
        @keyframes botBounce { 0%,60%,100%{transform:translateY(0);opacity:.3} 30%{transform:translateY(-5px);opacity:1} }
        @keyframes slideUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
      `}</style>
    </div>
  );
}
