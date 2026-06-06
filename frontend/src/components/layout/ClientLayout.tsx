import { useEffect } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { FloatButton, notification } from "antd";
import Header from "./Header";
import Footer from "./Footer";
import ChatWidget from "./ChatWidget";
import { colorPrimary } from "@/src/constants";
import { socket } from "../../utils/socket";
import { useQueryClient } from "@tanstack/react-query";
import { playNotificationSound } from "../../utils/notificationSound";

const ClientLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const hideHeader = ["/login", "/register", "/forgot-password"].includes(location.pathname);
  const queryClient = useQueryClient();

  const userStr = localStorage.getItem("user");
  const userObj = userStr ? JSON.parse(userStr) : null;
  const userId = userObj?.id;

  useEffect(() => {
    if (userId) {
      socket.emit("join", { userId, role: userObj?.role });
      console.log(`📡 Customer #${userId} đã tham gia các phòng socket`);
    }
  }, [userId, userObj?.role]);

  // Real-time: Lắng nghe sự kiện để cập nhật thông báo (quả chuông) cho khách hàng
  useEffect(() => {
    if (!userId) return;

    const refreshClientNotifications = (data: any) => {
      console.log("📡 Khách hàng nhận được cập nhật trạng thái đơn hàng:", data);
      playNotificationSound();
      
      const displayStatusMap: Record<string, string> = {
        'Pending': 'Chờ duyệt',
        'Confirmed': 'Đã xác nhận',
        'Packing': 'Đang đóng gói',
        'Shipping': 'Đang giao hàng',
        'Completed': 'Đã hoàn thành',
        'Cancelled': 'Đã hủy',
        'CancelRequested': 'Yêu cầu hủy'
      };
      const vietnameseStatus = displayStatusMap[data.status] || data.status;
      
      notification.info({
        message: "📦 Cập nhật đơn hàng",
        description: `Đơn hàng #${data.orderId} của bạn đã thay đổi trạng thái sang: "${vietnameseStatus}". Bấm để xem chi tiết.`,
        placement: "bottomRight",
        duration: 6,
        onClick: () => {
          navigate(`/orders?openOrderId=${data.orderId}`);
        },
        style: { cursor: 'pointer' }
      });
      queryClient.invalidateQueries({ queryKey: ["notifications", userId] });
    };

    socket.on('client:orderStatusUpdated', refreshClientNotifications);

    return () => {
      socket.off('client:orderStatusUpdated', refreshClientNotifications);
    };
  }, [userId, queryClient]);

  return (
    <>
      {!hideHeader && <Header />}

      <main style={{ minHeight: "100vh", background: "#ffffff" }}>
        <Outlet />
      </main>

      {!hideHeader && <ChatWidget />}

      {!hideHeader && <Footer />}

      <FloatButton.BackTop
        style={{ right: 24, bottom: 90, backgroundColor: colorPrimary, color: "#f5f5f5" }}
        duration={500}
      />
    </>
  );
};

export default ClientLayout;
