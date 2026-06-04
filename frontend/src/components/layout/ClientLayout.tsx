import { useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { FloatButton } from "antd";
import Header from "./Header";
import Footer from "./Footer";
import ChatWidget from "./ChatWidget";
import { colorPrimary } from "@/src/constants";
import { socket } from "../../utils/socket";
import { useQueryClient } from "@tanstack/react-query";

const ClientLayout = () => {
  const location = useLocation();
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

    const refreshClientNotifications = () => {
      console.log("📡 Khách hàng nhận được cập nhật trạng thái đơn hàng, tự động tải lại quả chuông thông báo...");
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
        style={{ right: 24, bottom: 24, backgroundColor: colorPrimary, color: "#f5f5f5" }}
        duration={500}
      />
    </>
  );
};

export default ClientLayout;
