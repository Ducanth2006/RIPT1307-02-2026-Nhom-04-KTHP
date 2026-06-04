import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Badge, Button, Input, Card, Spin, message } from "antd";
import { MessageOutlined, CloseOutlined, SendOutlined, InfoCircleOutlined } from "@ant-design/icons";
import { socket } from "../../utils/socket";
import {
  initClientRoom,
  getClientMessages,
  sendClientMessage,
  markClientMessagesRead
} from "../../services/client/chat/apiClient";

interface ProductPreview {
  id: number;
  name: string;
  brand: string;
  base_price: number;
  image_url: string;
}

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [roomId, setRoomId] = useState<number | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [unreadCount, setUnreadCount] = useState(0);
  const [pendingProduct, setPendingProduct] = useState<ProductPreview | null>(null);
  const [staffInfo, setStaffInfo] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const userStr = localStorage.getItem("user");
  const userObj = userStr ? JSON.parse(userStr) : null;
  const userId = userObj?.id;

  // 1. Lắng nghe Custom Event để mở Chat từ trang chi tiết sản phẩm
  useEffect(() => {
    const handleOpenChat = () => {
      setIsOpen(true);
      checkPendingProduct();
    };

    window.addEventListener("open_chat_widget", handleOpenChat);
    return () => {
      window.removeEventListener("open_chat_widget", handleOpenChat);
    };
  }, []);

  // Kiểm tra xem có sản phẩm nào đang chờ gửi không
  const checkPendingProduct = () => {
    const stored = sessionStorage.getItem("pending_chat_product");
    if (stored) {
      setPendingProduct(JSON.parse(stored));
    } else {
      setPendingProduct(null);
    }
  };

  // 2. Tự động kết nối Socket khi mở Widget & Khởi tạo Phòng
  useEffect(() => {
    if (!userId || !isOpen) return;

    const startChat = async () => {
      try {
        setLoading(true);
        // Khởi tạo/Lấy phòng chat
        const res = await initClientRoom(userId);
        const room = res.data;
        setRoomId(room.id);
        
        if (room.status === 'in_progress' && room.staff) {
          setStaffInfo(room.staff.full_name);
        }

        // Tải lịch sử tin nhắn
        const msgRes = await getClientMessages(room.id);
        setMessages(msgRes.data);

        // Đánh dấu đã đọc
        await markClientMessagesRead(room.id, userId);
        setUnreadCount(0);
      } catch (err: any) {
        console.error("Lỗi khi mở phòng chat:", err);
      } finally {
        setLoading(false);
      }
    };

    startChat();
  }, [userId, isOpen]);

  // 3. Lắng nghe sự kiện Real-time qua Socket.io
  useEffect(() => {
    if (!userId) return;

    // Đảm bảo user join room của mình
    socket.emit("join", { userId, role: userObj?.role });

    const handleNewMessage = (msg: any) => {
      if (msg.room_id === roomId) {
        setMessages((prev) => {
          // Tránh trùng lặp tin nhắn
          if (prev.some((m) => m.id === msg.id)) return prev;
          return [...prev, msg];
        });
        
        // Nếu widget đang đóng hoặc tin nhắn từ người khác, tăng unread
        if (!isOpen && msg.sender_id !== userId) {
          setUnreadCount((c) => c + 1);
        } else if (isOpen && msg.sender_id !== userId) {
          // Nếu đang mở và là tin của Staff, tự động gọi API đọc
          markClientMessagesRead(roomId!, userId);
        }
      }
    };

    const handleStaffConnected = (data: { staffName: string }) => {
      setStaffInfo(data.staffName);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now(),
          system: true,
          content: `Nhân viên ${data.staffName} đã tham gia hỗ trợ.`
        }
      ]);
    };

    const handleRoomClosed = () => {
      setRoomId(null);
      setMessages([]);
      setStaffInfo(null);
      setIsOpen(false);
      sessionStorage.removeItem("pending_chat_product");
      setPendingProduct(null);
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
  }, [userId, roomId, isOpen]);

  // Cuộn xuống cuối khung chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, pendingProduct]);

  const handleToggle = () => {
    if (!userId) {
      message.warning("Vui lòng đăng nhập để chat với nhân viên hỗ trợ!");
      navigate("/login");
      return;
    }
    setIsOpen(!isOpen);
    if (!isOpen) {
      checkPendingProduct();
    }
  };

  const handleSendText = async () => {
    if (!inputValue.trim() || !roomId || !userId) return;

    try {
      const text = inputValue;
      setInputValue("");
      await sendClientMessage({
        roomId,
        userId,
        message_type: 'text',
        content: text
      });
    } catch (err) {
      message.error("Lỗi khi gửi tin nhắn.");
    }
  };

  const handleSendProduct = async () => {
    if (!pendingProduct || !roomId || !userId) return;

    try {
      const prod = pendingProduct;
      setPendingProduct(null);
      sessionStorage.removeItem("pending_chat_product");

      await sendClientMessage({
        roomId,
        userId,
        message_type: 'product',
        product_id: prod.id
      });
    } catch (err) {
      message.error("Lỗi khi gửi thẻ sản phẩm.");
    }
  };

  const handleCancelProduct = () => {
    setPendingProduct(null);
    sessionStorage.removeItem("pending_chat_product");
  };

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(price);

  return (
    <div style={{ position: "fixed", bottom: 24, right: 90, zIndex: 1000, fontFamily: "sans-serif" }}>
      {/* 🔮 Chat Floating Button */}
      <Badge count={unreadCount} overflowCount={9} style={{ backgroundColor: "#af101a" }}>
        <Button
          type="primary"
          shape="circle"
          size="large"
          icon={isOpen ? <CloseOutlined /> : <MessageOutlined />}
          onClick={handleToggle}
          style={{
            width: 56,
            height: 56,
            backgroundColor: "#af101a",
            borderColor: "#af101a",
            boxShadow: "0 4px 12px rgba(175, 16, 26, 0.4)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 20
          }}
        />
      </Badge>

      {/* 💬 Chat Popup Window */}
      {isOpen && (
        <Card
          title={
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <span style={{ fontWeight: 600 }}>Hỗ trợ trực tuyến</span>
                <div style={{ fontSize: 11, color: staffInfo ? "#389e0d" : "#8c8c8c", fontWeight: 400 }}>
                  ● {staffInfo ? `Đang chat với ${staffInfo}` : "Đang chờ nhân viên kết nối..."}
                </div>
              </div>
              <CloseOutlined style={{ cursor: "pointer", fontSize: 14 }} onClick={() => setIsOpen(false)} />
            </div>
          }
          styles={{ header: { padding: "12px 16px" }, body: { padding: 0 } }}
          style={{
            position: "absolute",
            bottom: 72,
            right: 0,
            width: 360,
            height: 500,
            boxShadow: "0 8px 24px rgba(0, 0, 0, 0.15)",
            borderRadius: 12,
            overflow: "hidden",
            display: "flex",
            flexDirection: "column"
          }}
        >
          {/* Main message area */}
          <div style={{ flex: 1, height: 370, display: "flex", flexDirection: "column", backgroundColor: "#f5f5f5" }}>
            {loading ? (
              <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Spin size="medium" />
              </div>
            ) : (
              <div style={{ flex: 1, overflowY: "auto", padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
                {messages.length === 0 && (
                  <div style={{ textAlign: "center", color: "#8c8c8c", fontSize: 13, marginTop: 40 }}>
                    <InfoCircleOutlined style={{ fontSize: 24, marginBottom: 8, display: "block" }} />
                    Chào bạn! Gửi tin nhắn để bắt đầu cuộc trò chuyện. Nhân viên hỗ trợ sẽ kết nối ngay.
                  </div>
                )}

                {messages.map((msg) => {
                  if (msg.system) {
                    return (
                      <div key={msg.id} style={{ alignSelf: "center", backgroundColor: "#e8e8e8", color: "#595959", fontSize: 11, padding: "4px 10px", borderRadius: 10, textAlign: "center", margin: "4px 0" }}>
                        {msg.content}
                      </div>
                    );
                  }

                  const isOwn = msg.sender_id === userId;
                  return (
                    <div
                      key={msg.id}
                      style={{
                        alignSelf: isOwn ? "flex-end" : "flex-start",
                        maxWidth: "75%",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: isOwn ? "flex-end" : "flex-start"
                      }}
                    >
                      {/* Tên người gửi */}
                      <span style={{ fontSize: 10, color: "#8c8c8c", marginBottom: 2 }}>
                        {isOwn ? "Bạn" : msg.sender?.full_name || "Nhân viên"}
                      </span>

                      {/* Bong bóng chat */}
                      {msg.message_type === 'product' && msg.product ? (
                        /* THẺ SẢN PHẨM MINI */
                        <Card
                          hoverable
                          styles={{ body: { padding: 8 } }}
                          style={{
                            borderRadius: 8,
                            border: "1px solid #d9d9d9",
                            overflow: "hidden",
                            width: 220
                          }}
                          onClick={() => {
                            setIsOpen(false);
                            navigate(`/products/${msg.product.id}`);
                          }}
                        >
                          <div style={{ display: "flex", gap: 8 }}>
                            <img
                              src={msg.product.image_url}
                              alt=""
                              style={{ width: 50, height: 50, objectFit: "cover", borderRadius: 4, flexShrink: 0 }}
                            />
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: 12, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                {msg.product.name}
                              </div>
                              <div style={{ fontSize: 11, color: "#8c8c8c" }}>{msg.product.brand}</div>
                              <div style={{ fontSize: 12, color: "#af101a", fontWeight: 700, marginTop: 2 }}>
                                {formatPrice(msg.product.base_price)}
                              </div>
                            </div>
                          </div>
                        </Card>
                      ) : (
                        /* TIN NHẮN TEXT */
                        <div
                          style={{
                            backgroundColor: isOwn ? "#af101a" : "#ffffff",
                            color: isOwn ? "#ffffff" : "#1f1f1f",
                            padding: "8px 12px",
                            borderRadius: 12,
                            fontSize: 13,
                            lineHeight: 1.4,
                            boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
                            wordBreak: "break-word"
                          }}
                        >
                          {msg.content}
                        </div>
                      )}
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
            )}

            {/* 🏷️ Thẻ sản phẩm đang chờ gửi (Pending Product Preview) */}
            {pendingProduct && (
              <div style={{ padding: "8px 12px", backgroundColor: "#fffbe6", borderTop: "1px solid #ffe58f", display: "flex", alignItems: "center", gap: 8 }}>
                <img
                  src={pendingProduct.image_url}
                  alt=""
                  style={{ width: 40, height: 40, objectFit: "cover", borderRadius: 4 }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 11, color: "#8c8c8c" }}>Gửi sản phẩm đang xem?</div>
                  <div style={{ fontSize: 12, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {pendingProduct.name}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 4 }}>
                  <Button size="small" type="primary" onClick={handleSendProduct} style={{ fontSize: 11, height: 24, backgroundColor: "#af101a", borderColor: "#af101a" }}>
                    Gửi
                  </Button>
                  <Button size="small" onClick={handleCancelProduct} style={{ fontSize: 11, height: 24 }}>
                    Hủy
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Input text footer */}
          <div style={{ padding: 12, borderTop: "1px solid #f0f0f0", display: "flex", gap: 8, backgroundColor: "#fff" }}>
            <Input
              placeholder="Nhập tin nhắn..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onPressEnter={handleSendText}
              disabled={loading || !roomId}
              style={{ borderRadius: 6 }}
            />
            <Button
              type="primary"
              icon={<SendOutlined />}
              onClick={handleSendText}
              disabled={!inputValue.trim() || loading || !roomId}
              style={{ backgroundColor: "#af101a", borderColor: "#af101a", borderRadius: 6 }}
            />
          </div>
        </Card>
      )}
    </div>
  );
}
