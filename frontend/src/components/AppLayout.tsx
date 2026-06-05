import React, { useEffect, useState, useCallback } from "react";
import { Outlet, Link, useLocation, useNavigate, Navigate } from "react-router-dom";
import {
  Home,
  Package2,
  ShoppingCart,
  Users,
  Headset,
  Settings as SettingsIcon,
  Bell,
  HelpCircle,
  Menu,
  FolderTree,
  User,
  LogOut,
  BarChart2,
  Ticket,
  Boxes,
  MessageCircle
} from "lucide-react";
import { Avatar, Dropdown, Popover, FloatButton, message, notification } from "antd";
import NotificationPanel from "./NotificationPanel";
import { logout } from "../services/client/auth/apiClient";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getNotificationsApi } from "../services/client/notification/apiClient";
import { socket } from "../utils/socket";
import { getAdminRooms } from "../services/admin/chatService";

export default function AppLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const currentPath = location.pathname;
  const queryClient = useQueryClient();

  const token = localStorage.getItem("accessToken");
  const [userObj, setUserObj] = useState(() => {
    const userStr = localStorage.getItem("user");
    return userStr ? JSON.parse(userStr) : null;
  });

  useEffect(() => {
    const handleUserUpdate = () => {
      const userStr = localStorage.getItem("user");
      setUserObj(userStr ? JSON.parse(userStr) : null);
    };

    window.addEventListener("userUpdated", handleUserUpdate);
    window.addEventListener("storage", handleUserUpdate);

    return () => {
      window.removeEventListener("userUpdated", handleUserUpdate);
      window.removeEventListener("storage", handleUserUpdate);
    };
  }, []);

  const userId = userObj?.id;
  const [unreadChatsCount, setUnreadChatsCount] = useState(0);

  const updateUnreadChatsCount = useCallback(async () => {
    if (userObj?.role !== "Admin") return;
    try {
      const res = await getAdminRooms();
      const rooms = res.data || [];
      const totalUnread = rooms.reduce((sum: number, room: any) => sum + (room.unread_count || 0), 0);
      setUnreadChatsCount(totalUnread);
    } catch (err) {
      console.error("Lỗi khi tải số tin nhắn chưa đọc:", err);
    }
  }, [userObj?.role]);

  // Tải số lượng tin nhắn chưa đọc lần đầu
  useEffect(() => {
    if (userObj?.role === "Admin") {
      updateUnreadChatsCount();
    }
  }, [userObj?.role, updateUnreadChatsCount]);

  // Real-time: Chat notifications cho Staff (Toast) và Admin (Badge)
  useEffect(() => {
    if (!userId) return;

    const handleChatNewMessage = (msg: any) => {
      // 1. Cho Staff: Hiển thị thông báo nổi (Messenger-like toast)
      if (userObj?.role === "Staff" && msg.sender_id !== userId) {
        const activeRoomId = (window as any).activeChatRoomId;
        const isCurrentActiveRoom = activeRoomId === msg.room_id;
        if (location.pathname !== "/admin/chat" || !isCurrentActiveRoom) {
          notification.info({
            message: `Tin nhắn mới từ ${msg.sender?.full_name || "Khách hàng"}`,
            description: msg.content || (msg.message_type === 'product' ? '🛍️ [Đã gửi thẻ sản phẩm]' : 'Có tin nhắn mới'),
            placement: 'bottomRight',
            duration: 4,
            style: { cursor: 'pointer' },
            onClick: () => {
              navigate('/admin/chat');
            }
          });
        }
      }

      // 2. Cho Admin: Cập nhật Badge
      if (userObj?.role === "Admin") {
        updateUnreadChatsCount();
      }
    };

    const handleChatReadStatus = () => {
      if (userObj?.role === "Admin") {
        updateUnreadChatsCount();
      }
    };

    socket.on("chat:newMessage", handleChatNewMessage);
    socket.on("chat:readStatus", handleChatReadStatus);

    return () => {
      socket.off("chat:newMessage", handleChatNewMessage);
      socket.off("chat:readStatus", handleChatReadStatus);
    };
  }, [userId, userObj?.role, location.pathname, updateUnreadChatsCount, navigate]);

  // Real-time: Đăng nhập vào phòng socket
  useEffect(() => {
    if (userId) {
      socket.emit("join", { userId, role: userObj?.role });
      console.log(`📡 Admin/Staff #${userId} đã tham gia các phòng socket`);
    }
  }, [userId, userObj?.role]);

  // Real-time: Lắng nghe sự kiện để cập nhật số lượng thông báo (quả chuông)
  useEffect(() => {
    if (!userId) return;

    const refreshNotifications = () => {
      console.log("📡 Admin nhận được sự kiện mới, tự động làm mới quả chuông thông báo...");
      queryClient.invalidateQueries({ queryKey: ["notifications", userId] });
    };

    socket.on('admin:orderCreated', refreshNotifications);
    socket.on('admin:orderCancelled', refreshNotifications);

    return () => {
      socket.off('admin:orderCreated', refreshNotifications);
      socket.off('admin:orderCancelled', refreshNotifications);
    };
  }, [userId, queryClient]);

  const { data: notificationsRes } = useQuery({
    queryKey: ["notifications", userId],
    queryFn: () => getNotificationsApi(userId!).then((res) => res.data),
    enabled: !!userId && !!token,
    refetchInterval: 30000,
  });

  const notificationsList = notificationsRes?.data || [];
  const adminTitles = ["Đơn hàng mới chờ duyệt", "Yêu cầu hủy đơn hàng mới", "Có khiếu nại mới cần xử lý"];
  const adminNotifications = notificationsList.filter((n: any) => adminTitles.includes(n.title));
  const unreadCount = adminNotifications.filter((n: any) => !n.is_read).length;

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // 🛡️ Chỉ Admin và Staff (Nhân viên) mới được truy cập vào trang quản trị /admin/*
  if (userObj?.role !== "Admin" && userObj?.role !== "Staff") {
    message.error("Bạn không có quyền truy cập vào trang quản trị!");
    return <Navigate to="/" replace />;
  }

  // 🛡️ Route Guard: Chỉ Quản trị viên (Admin) mới có quyền vào các trang ẩn (Users, Báo cáo & Cài đặt hệ thống)
  const isProtectedPath = currentPath.startsWith("/admin/users") || currentPath.startsWith("/admin/settings") || currentPath.startsWith("/admin/reports");
  if (isProtectedPath && userObj?.role !== "Admin") {
    message.error("Bạn không có quyền truy cập vào khu vực bảo mật này! Chỉ dành cho Quản trị viên (Admin).");
    return <Navigate to="/admin/dashboard" replace />;
  }

  const handleHelp = () => {
    navigate("/admin/help");
  };

  const navItems = [
    { name: "Trang chủ", path: "/admin/dashboard", icon: Home },
    { name: "Sản phẩm", path: "/admin/products", icon: Package2 },
    { name: "Danh mục", path: "/admin/categories", icon: FolderTree },
    { name: "Kho hàng", path:"/admin/inventory", icon: Boxes },
    { name: "Đơn hàng", path: "/admin/orders", icon: ShoppingCart },
    ...(userObj?.role === "Admin" ? [{ name: "Người dùng", path: "/admin/users", icon: Users }] : []),
    { name: "Voucher", path: "/admin/vouchers", icon: Ticket },
    ...(userObj?.role === "Admin" ? [{ name: "Báo cáo", path: "/admin/reports", icon: BarChart2 }] : []),
    { name: "Khiếu nại", path: "/admin/complaints", icon: Headset },
    { name: "Hỗ trợ chat", path: "/admin/chat", icon: MessageCircle },
    ...(userObj?.role === "Admin" ? [{ name: "Cài đặt", path: "/admin/settings", icon: SettingsIcon }] : []),
  ];

  return (
    <div className="flex h-screen bg-[#f7f9fb] font-sans text-[#191c1e] overflow-hidden">
      {/* Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-[#f7f9fb] border-r border-[#e4beba] h-full py-6 z-40 shrink-0">
        <div className="px-6 mb-8 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#d32f2f] text-white flex items-center justify-center font-bold text-lg">
            P
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#af101a] leading-tight">ProSports ERP</h1>
            <p className="text-xs text-[#5b403d] mt-1">Admin Console</p>
          </div>
        </div>

        <nav className="flex-1 flex flex-col overflow-y-auto px-2">
          {navItems.map((item) => {
            const isActive = currentPath.startsWith(item.path);
            const Icon = item.icon;

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 mx-2 my-0.5 rounded-lg transition-colors ${
                  isActive ? "text-[#af101a] font-bold bg-[#ffdad6]/50" : "text-[#5b403d] hover:bg-[#e0e3e5]"
                }`}
              >
                <Icon size={20} className={isActive ? "text-[#af101a]" : ""} />
                <span className="text-sm flex-1">{item.name}</span>
                {item.path === "/admin/chat" && userObj?.role === "Admin" && unreadChatsCount > 0 && (
                  <span className="bg-[#af101a] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[16px] h-[16px] flex items-center justify-center shadow-sm">
                    {unreadChatsCount}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Header */}
        <header className="bg-white sticky top-0 z-30 border-b border-[#e4beba] shadow-sm flex justify-between items-center h-16 px-6 shrink-0">
          <div className="flex items-center gap-4 flex-1">
            <button className="md:hidden text-[#5b403d]">
              <Menu size={24} />
            </button>
          </div>

          <div className="flex items-center gap-4">
            <Popover
              content={<NotificationPanel />}
              trigger="click"
              placement="bottomRight"
              overlayInnerStyle={{ padding: 0, borderRadius: "8px" }}
            >
              <button className="text-[#5b403d] hover:text-[#af101a] relative p-1">
                <Bell size={20} />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-[#af101a] text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full min-w-[16px] h-[16px] flex items-center justify-center shadow-sm">
                    {unreadCount}
                  </span>
                )}
              </button>
            </Popover>
            <button className="text-[#5b403d] hover:text-[#af101a] hidden sm:block" onClick={handleHelp}>
              <HelpCircle size={20} />
            </button>
            <Link to="/" className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#e4beba] text-[#5b403d] hover:text-[#af101a] hover:bg-[#ffdad6]/20 transition-all text-xs font-semibold hidden sm:flex">
              <ShoppingCart size={14} />
              <span>Trang bán hàng</span>
            </Link>
            <div className="h-6 w-px bg-[#e4beba] mx-2 hidden sm:block"></div>
            <Dropdown
              menu={{
                items: [
                  {
                    key: "account",
                    label: (
                      <Link to="/admin/account" className="flex items-center gap-2">
                        <User size={14} /> Tài khoản của tôi
                      </Link>
                    ),
                  },
                  {
                    key: "shop",
                    label: (
                      <Link to="/" className="flex items-center gap-2">
                        <ShoppingCart size={14} /> Xem trang bán hàng
                      </Link>
                    ),
                  },
                  { type: "divider" },
                  {
                    key: "logout",
                    label: (
                      <div
                        onClick={() => logout()}
                        className="flex items-center gap-2 text-red-600 cursor-pointer"
                      >
                        <LogOut size={14} /> Đăng xuất
                      </div>
                    ),
                  },
                ],
              }}
              placement="bottomRight"
            >
              <button className="flex items-center gap-2 hover:bg-[#eceef0] p-1 px-2 rounded transition-colors">
                <span className="text-sm font-medium hidden sm:block">
                  {userObj?.full_name || (userObj?.role === "Admin" ? "Quản trị viên" : userObj?.role === "Staff" ? "Nhân viên" : "Khách hàng")}
                </span>
                <Avatar src={userObj?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(userObj?.full_name || userObj?.role || 'Admin')}&background=0D8ABC&color=fff`} size="small" />
              </button>
            </Dropdown>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto bg-[#f7f9fb]">
          <Outlet />
        </main>
        <FloatButton.BackTop style={{ right: 24, bottom: 24 }} />
      </div>
    </div>
  );
}
