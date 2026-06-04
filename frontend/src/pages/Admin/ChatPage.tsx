import React, { useState, useEffect, useRef } from "react";
import { List, Avatar, Badge, Card, Input, Button, Tabs, Tag, Result, Spin, message, Modal } from "antd";
import {
  MessageOutlined,
  UserOutlined,
  SendOutlined,
  LockOutlined,
  CloseCircleOutlined,
  CheckCircleOutlined,
  InfoCircleOutlined
} from "@ant-design/icons";
import { socket } from "../../utils/socket";
import {
  getAdminRooms,
  getAdminMessages,
  sendAdminMessage,
  assignStaffToRoom,
  closeChatRoom,
  markAdminMessagesRead
} from "../../services/admin/chatService";

const { TabPane } = Tabs;

export default function ChatPage() {
  const [rooms, setRooms] = useState<any[]>([]);
  const [activeRoom, setActiveRoom] = useState<any | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [loadingRooms, setLoadingRooms] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [activeTab, setActiveTab] = useState("all"); // all, waiting, assigned_me

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const userStr = localStorage.getItem("user");
  const userObj = userStr ? JSON.parse(userStr) : null;
  const userId = userObj?.id;
  const userRole = userObj?.role; // 'Admin' | 'Staff' | 'Client'

  // 1. Tải danh sách phòng chat khi load trang
  const loadRooms = async () => {
    try {
      setLoadingRooms(true);
      const res = await getAdminRooms();
      setRooms(res.data);
    } catch (err: any) {
      message.error("Lỗi khi tải danh sách phòng chat.");
    } finally {
      setLoadingRooms(false);
    }
  };

  useEffect(() => {
    if (!userId) return;
    loadRooms();

    // Join room 'admins' để nhận thông báo real-time của tất cả các phòng
    socket.emit("join", { userId, role: userRole });

    // Lắng nghe các sự kiện socket real-time
    const handleNewMessage = (msg: any) => {
      // 1. Thêm tin nhắn mới vào phòng hiện tại nếu khớp
      if (activeRoom && msg.room_id === activeRoom.id) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === msg.id)) return prev;
          return [...prev, msg];
        });
        // Tự động đánh dấu đã xem tin nhắn nếu đang mở phòng đó
        if (msg.sender_id !== userId) {
          markAdminMessagesRead(activeRoom.id, userId);
        }
      }

      // 2. Cập nhật tin nhắn cuối cùng trong danh sách phòng
      setRooms((prevRooms) =>
        prevRooms.map((r) => {
          if (r.id === msg.room_id) {
            return {
              ...r,
              updated_at: msg.created_at,
              last_message: {
                content: msg.content,
                message_type: msg.message_type,
                created_at: msg.created_at,
                sender_id: msg.sender_id
              },
              // Tăng số tin chưa đọc từ Client gửi
              unread_count:
                activeRoom && activeRoom.id === msg.room_id
                  ? 0
                  : msg.sender_id !== userId
                  ? r.unread_count + 1
                  : r.unread_count
            };
          }
          return r;
        }).sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
      );
    };

    const handleRoomAssigned = (data: { roomId: number; assigned_staff_id: number; status: string; staffName: string }) => {
      // Cập nhật trạng thái phòng trong danh sách
      setRooms((prevRooms) =>
        prevRooms.map((r) => {
          if (r.id === data.roomId) {
            return {
              ...r,
              status: data.status,
              assigned_staff_id: data.assigned_staff_id,
              staff: { id: data.assigned_staff_id, full_name: data.staffName }
            };
          }
          return r;
        })
      );

      // Cập nhật phòng đang chat hiện tại
      if (activeRoom && activeRoom.id === data.roomId) {
        setActiveRoom((prev: any) => ({
          ...prev,
          status: data.status,
          assigned_staff_id: data.assigned_staff_id,
          staff: { id: data.assigned_staff_id, full_name: data.staffName }
        }));
        
        // Nếu là mình vừa nhận phòng, tải lại lịch sử tin nhắn
        if (data.assigned_staff_id === userId) {
          loadHistory(data.roomId);
        }
      }
    };

    const handleRoomDeleted = (data: { roomId: number }) => {
      setRooms((prevRooms) => prevRooms.filter((r) => r.id !== data.roomId));
      if (activeRoom && activeRoom.id === data.roomId) {
        setActiveRoom(null);
        setMessages([]);
        message.info("Phòng chat hiện tại đã được đóng.");
      }
    };

    socket.on("chat:newMessage", handleNewMessage);
    socket.on("chat:roomAssigned", handleRoomAssigned);
    socket.on("chat:roomDeleted", handleRoomDeleted);

    return () => {
      socket.off("chat:newMessage", handleNewMessage);
      socket.off("chat:roomAssigned", handleRoomAssigned);
      socket.off("chat:roomDeleted", handleRoomDeleted);
    };
  }, [userId, activeRoom, userRole]);

  // Cuộn xuống cuối tin nhắn
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // 2. Tải lịch sử chat
  const loadHistory = async (roomId: number) => {
    try {
      setLoadingMessages(true);
      const res = await getAdminMessages(roomId, userId, userRole);
      setMessages(res.data);

      // Xóa số lượng tin nhắn chưa đọc của phòng này trên UI danh sách phòng
      setRooms((prevRooms) =>
        prevRooms.map((r) => (r.id === roomId ? { ...r, unread_count: 0 } : r))
      );
    } catch (err: any) {
      if (err.response?.status === 403) {
        // Lỗi phân quyền đã khóa nội dung (ROOM_WAITING hoặc ROOM_LOCKED)
        setMessages([]);
      } else {
        message.error("Lỗi khi tải lịch sử cuộc trò chuyện.");
      }
    } finally {
      setLoadingMessages(false);
    }
  };

  const handleSelectRoom = (room: any) => {
    setActiveRoom(room);
    loadHistory(room.id);
  };

  // 3. Nhận hỗ trợ phòng chat
  const handleAssignMe = async () => {
    if (!activeRoom) return;
    try {
      const res = await assignStaffToRoom(activeRoom.id, userId);
      message.success("Bạn đã nhận hỗ trợ phòng chat này thành công.");
      
      // Cập nhật lại UI phòng chat hiện tại
      const updated = res.data;
      setActiveRoom((prev: any) => ({
        ...prev,
        status: updated.status,
        assigned_staff_id: updated.assigned_staff_id,
        staff: updated.staff
      }));

      // Tải lại lịch sử chat
      loadHistory(activeRoom.id);
    } catch (err: any) {
      message.error(err.response?.data?.message || "Không thể nhận hỗ trợ phòng này.");
    }
  };

  // 4. Gửi tin nhắn
  const handleSendMessage = async () => {
    if (!inputValue.trim() || !activeRoom) return;

    try {
      const text = inputValue;
      setInputValue("");

      await sendAdminMessage({
        roomId: activeRoom.id,
        userId,
        role: userRole,
        message_type: 'text',
        content: text
      });
    } catch (err: any) {
      message.error(err.response?.data?.message || "Không thể gửi tin nhắn.");
    }
  };

  // 5. Đóng hỗ trợ (Xóa sạch chat phòng & tin nhắn)
  const handleCloseRoom = () => {
    if (!activeRoom) return;
    Modal.confirm({
      title: "Xác nhận đóng cuộc hỗ trợ?",
      content: "⚠️ Cảnh báo: Toàn bộ lịch sử cuộc trò chuyện này sẽ bị xóa vĩnh viễn và không thể khôi phục lại được. Bạn có chắc chắn muốn đóng?",
      okText: "Đóng & Xóa lịch sử",
      okType: "danger",
      cancelText: "Hủy",
      onOk: async () => {
        try {
          await closeChatRoom(activeRoom.id, userId, userRole);
          message.success("Đã đóng phiên hỗ trợ thành công.");
          setActiveRoom(null);
          setMessages([]);
        } catch (err: any) {
          message.error(err.response?.data?.message || "Lỗi khi đóng phiên hỗ trợ.");
        }
      }
    });
  };

  // Lọc phòng theo tab chọn
  const filteredRooms = rooms.filter((room) => {
    if (activeTab === "waiting") {
      return room.status === "waiting";
    }
    if (activeTab === "assigned_me") {
      return room.status === "in_progress" && room.assigned_staff_id === userId;
    }
    return true; // "all"
  });

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(price);

  // 🛡️ Kiểm tra xem phòng hiện tại có bị LOCK hay không
  const isWaiting = activeRoom?.status === "waiting";
  const isLockedForMe =
    activeRoom?.status === "in_progress" &&
    activeRoom?.assigned_staff_id !== userId &&
    userRole !== "Admin";

  const showLockScreen = isWaiting || isLockedForMe;

  return (
    <div style={{ display: "flex", height: "calc(100vh - 120px)", backgroundColor: "#fff", borderRadius: 12, overflow: "hidden", boxShadow: "0 4px 16px rgba(0,0,0,0.06)", fontFamily: "sans-serif" }}>
      {/* 🟢 CỘT TRÁI: DANH SÁCH PHÒNG CHAT */}
      <div style={{ width: 340, borderRight: "1px solid #f0f0f0", display: "flex", flexDirection: "column" }}>
        <div style={{ padding: "16px 16px 8px 16px", borderBottom: "1px solid #f0f0f0" }}>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "#1f1f1f", display: "flex", alignItems: "center", gap: 8 }}>
            <MessageOutlined style={{ color: "#af101a" }} /> Kênh Hỗ Trợ Khách Hàng
          </h2>
        </div>

        {/* Tabs Phân loại phòng */}
        <Tabs activeKey={activeTab} onChange={setActiveTab} centered size="small" tabBarStyle={{ marginBottom: 0 }}>
          <TabPane tab="Tất cả" key="all" />
          <TabPane tab="Đang chờ" key="waiting" />
          <TabPane tab="Tôi nhận" key="assigned_me" />
        </Tabs>

        {/* Danh sách phòng */}
        <div style={{ flex: 1, overflowY: "auto" }}>
          {loadingRooms ? (
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: 200 }}>
              <Spin size="medium" />
            </div>
          ) : filteredRooms.length === 0 ? (
            <div style={{ textAlign: "center", color: "#8c8c8c", marginTop: 40, padding: 16 }}>
              Không có phòng chat nào trong mục này.
            </div>
          ) : (
            <List
              dataSource={filteredRooms}
              renderItem={(room) => {
                const isActive = activeRoom?.id === room.id;
                const lastMsg = room.last_message;
                const isClientMsg = lastMsg?.sender_id === room.client_id;
                
                return (
                  <List.Item
                    onClick={() => handleSelectRoom(room)}
                    style={{
                      padding: "12px 16px",
                      cursor: "pointer",
                      backgroundColor: isActive ? "#faf5f5" : "#ffffff",
                      borderLeft: isActive ? "4px solid #af101a" : "4px solid transparent",
                      borderBottom: "1px solid #f5f5f5",
                      transition: "all 0.2s"
                    }}
                    className="chat-room-item"
                  >
                    <div style={{ display: "flex", width: "100%", gap: 12 }}>
                      <Badge count={room.unread_count} style={{ backgroundColor: "#af101a" }}>
                        <Avatar
                          src={room.client?.avatar}
                          icon={<UserOutlined />}
                          style={{ backgroundColor: "#87d068" }}
                        />
                      </Badge>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 2 }}>
                          <span style={{ fontWeight: 600, color: "#262626", fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {room.client?.full_name || "Khách hàng ẩn danh"}
                          </span>
                          <span style={{ fontSize: 10, color: "#bfbfbf" }}>
                            {lastMsg ? new Date(lastMsg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ""}
                          </span>
                        </div>

                        {/* Tin nhắn cuối cùng */}
                        <div style={{ fontSize: 12, color: "#8c8c8c", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {lastMsg ? (
                            lastMsg.message_type === 'product' ? (
                              "🛍️ [Gửi thẻ sản phẩm]"
                            ) : (
                              `${isClientMsg ? "Khách: " : "Bạn: "}${lastMsg.content}`
                            )
                          ) : (
                            "Chưa có tin nhắn"
                          )}
                        </div>

                        {/* Status Tag */}
                        <div style={{ marginTop: 6, display: "flex", gap: 6, alignItems: "center" }}>
                          {room.status === "waiting" ? (
                            <Tag color="orange" style={{ margin: 0, fontSize: 10 }}>Đang chờ</Tag>
                          ) : (
                            <Tag color="green" style={{ margin: 0, fontSize: 10 }}>
                              {room.staff?.id === userId ? "Bạn đang hỗ trợ" : `Staff: ${room.staff?.full_name || "Khác"}`}
                            </Tag>
                          )}
                        </div>
                      </div>
                    </div>
                  </List.Item>
                );
              }}
            />
          )}
        </div>
      </div>

      {/* 🔴 CỘT PHẢI: KHÔNG GIAN CHAT HỖ TRỢ */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", backgroundColor: "#f5f5f5" }}>
        {!activeRoom ? (
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Result
              icon={<MessageOutlined style={{ fontSize: 48, color: "#bfbfbf" }} />}
              title="Chọn phòng chat bên trái để bắt đầu hỗ trợ khách hàng"
              subTitle="Bạn có thể nhận phòng hỗ trợ khách hàng mới hoặc tiếp tục chat với các phòng bạn đang nhận."
            />
          </div>
        ) : (
          <>
            {/* Header phòng chat */}
            <div style={{ padding: "12px 24px", backgroundColor: "#ffffff", borderBottom: "1px solid #e8e8e8", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <Avatar src={activeRoom.client?.avatar} icon={<UserOutlined />} style={{ backgroundColor: "#87d068" }} />
                <div>
                  <h4 style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>{activeRoom.client?.full_name}</h4>
                  <p style={{ margin: 0, fontSize: 11, color: "#8c8c8c" }}>{activeRoom.client?.email}</p>
                </div>
              </div>

              {/* Trạng thái phòng & Nút Đóng phòng hỗ trợ */}
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  {activeRoom.status === "waiting" ? (
                    <Tag color="orange">Chờ Nhân Viên</Tag>
                  ) : (
                    <Tag color="green">Đang hỗ trợ bởi {activeRoom.staff?.full_name}</Tag>
                  )}
                </div>

                {/* Cho phép đóng cuộc chat nếu là Admin hoặc chính Staff được gán */}
                {(userRole === "Admin" || activeRoom.assigned_staff_id === userId) && (
                  <Button
                    type="primary"
                    danger
                    icon={<CloseCircleOutlined />}
                    onClick={handleCloseRoom}
                    size="small"
                  >
                    Đóng hỗ trợ
                  </Button>
                )}
              </div>
            </div>

            {/* Vùng Tin nhắn / Hoặc Màn hình Khóa */}
            <div style={{ flex: 1, display: "flex", flexDirection: "column", position: "relative", overflow: "hidden" }}>
              {showLockScreen ? (
                /* 🛡️ MÀN HÌNH KHÓA (LOCK SCREEN) */
                <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(245, 245, 245, 0.95)", zIndex: 10, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", padding: 24 }}>
                  <Card
                    style={{ width: 420, borderRadius: 12, boxShadow: "0 4px 12px rgba(0,0,0,0.08)", textAlign: "center" }}
                  >
                    <LockOutlined style={{ fontSize: 48, color: "#faad14", marginBottom: 16 }} />
                    
                    {isWaiting ? (
                      <>
                        <h3 style={{ fontSize: 16, fontWeight: 700, margin: "0 0 8px 0" }}>Khách hàng đang chờ hỗ trợ</h3>
                        <p style={{ color: "#595959", fontSize: 13, marginBottom: 20 }}>
                          Phòng chat này chưa được nhân viên nào tiếp nhận. Bấm vào nút bên dưới để gán bản thân và bắt đầu trò chuyện với khách hàng.
                        </p>
                        <Button type="primary" size="large" icon={<CheckCircleOutlined />} onClick={handleAssignMe} style={{ backgroundColor: "#389e0d", borderColor: "#389e0d" }}>
                          Nhận Hỗ Trợ Phòng Này
                        </Button>
                      </>
                    ) : (
                      <>
                        <h3 style={{ fontSize: 16, fontWeight: 700, margin: "0 0 8px 0" }}>Cuộc hội thoại đã bị khóa</h3>
                        <p style={{ color: "#595959", fontSize: 13, marginBottom: 0 }}>
                          Phòng chat này đã được nhân viên khác nhận hỗ trợ:
                        </p>
                        <p style={{ fontWeight: 600, color: "#1f1f1f", fontSize: 14, margin: "6px 0 20px 0" }}>
                          👤 {activeRoom.staff?.full_name || "Nhân viên khác"}
                        </p>
                        <p style={{ color: "#8c8c8c", fontSize: 11, margin: 0 }}>
                          * Chỉ Admin hoặc nhân viên phụ trách mới có quyền xem nội dung và gửi tin nhắn.
                        </p>
                      </>
                    )}
                  </Card>
                </div>
              ) : null}

              {/* Danh sách tin nhắn */}
              <div style={{ flex: 1, overflowY: "auto", padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
                {loadingMessages ? (
                  <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: 100 }}>
                    <Spin size="medium" />
                  </div>
                ) : (
                  <>
                    {messages.map((msg) => {
                      if (msg.system) {
                        return (
                          <div key={msg.id} style={{ alignSelf: "center", backgroundColor: "#d9d9d9", color: "#434343", fontSize: 11, padding: "4px 12px", borderRadius: 10, margin: "4px 0" }}>
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
                            maxWidth: "70%",
                            display: "flex",
                            flexDirection: "column",
                            alignItems: isOwn ? "flex-end" : "flex-start"
                          }}
                        >
                          {/* Tên người gửi */}
                          <span style={{ fontSize: 10, color: "#8c8c8c", marginBottom: 2 }}>
                            {isOwn ? `Bạn (${userRole})` : msg.sender?.full_name || "Khách hàng"}
                          </span>

                          {/* Bong bóng chat */}
                          {msg.message_type === 'product' && msg.product ? (
                            /* THẺ SẢN PHẨM MINI */
                            <Card
                              hoverable
                              styles={{ body: { padding: 10 } }}
                              style={{
                                borderRadius: 8,
                                border: "1px solid #d9d9d9",
                                width: 240,
                                cursor: "pointer"
                              }}
                              onClick={() => {
                                // Mở trang sản phẩm ở tab mới
                                window.open(`/products/${msg.product.id}`, "_blank");
                              }}
                            >
                              <div style={{ display: "flex", gap: 10 }}>
                                <img
                                  src={msg.product.image_url}
                                  alt=""
                                  style={{ width: 56, height: 56, objectFit: "cover", borderRadius: 4, flexShrink: 0 }}
                                />
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <div style={{ fontSize: 12, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                    {msg.product.name}
                                  </div>
                                  <div style={{ fontSize: 11, color: "#8c8c8c" }}>{msg.product.brand}</div>
                                  <div style={{ fontSize: 12, color: "#af101a", fontWeight: 700, marginTop: 4 }}>
                                    {formatPrice(msg.product.base_price)}
                                  </div>
                                </div>
                              </div>
                            </Card>
                          ) : (
                            /* TIN NHẮN VĂN BẢN */
                            <div
                              style={{
                                backgroundColor: isOwn ? "#af101a" : "#ffffff",
                                color: isOwn ? "#ffffff" : "#1f1f1f",
                                padding: "10px 14px",
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

                          {/* Thời gian nhắn */}
                          <span style={{ fontSize: 9, color: "#bfbfbf", marginTop: 4 }}>
                            {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </>
                )}
              </div>

              {/* Ô Nhập nội dung tin nhắn */}
              <div style={{ padding: "16px 24px", backgroundColor: "#ffffff", borderTop: "1px solid #e8e8e8", display: "flex", gap: 12 }}>
                <Input
                  placeholder="Nhập tin nhắn phản hồi khách hàng..."
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onPressEnter={handleSendMessage}
                  disabled={showLockScreen || loadingMessages}
                  style={{ borderRadius: 6 }}
                />
                <Button
                  type="primary"
                  icon={<SendOutlined />}
                  onClick={handleSendMessage}
                  disabled={!inputValue.trim() || showLockScreen || loadingMessages}
                  style={{ backgroundColor: "#af101a", borderColor: "#af101a", borderRadius: 6 }}
                />
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
