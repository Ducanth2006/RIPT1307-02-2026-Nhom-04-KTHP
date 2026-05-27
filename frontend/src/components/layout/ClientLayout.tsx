import { Outlet, useLocation } from "react-router-dom";
import { FloatButton } from "antd";
import Header from "./Header";
import Footer from "./Footer";
import { colorPrimary } from "@/src/constants";

const ClientLayout = () => {
  const location = useLocation();
  const hideHeader = ["/login", "/register", "/forgot-password"].includes(location.pathname);

  return (
    <>
      {!hideHeader && <Header />}

      <main style={{ minHeight: "100vh", background: "#ffffff" }}>
        <Outlet />
      </main>

      {!hideHeader && <Footer />}

      <FloatButton.BackTop
        style={{ right: 24, bottom: 24, backgroundColor: colorPrimary, color: "#f5f5f5" }}
        duration={500}
      />
    </>
  );
};

export default ClientLayout;
