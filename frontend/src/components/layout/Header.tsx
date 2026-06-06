import { useState, useEffect } from "react";
import { Layout, Input, Badge, Button, Popover, Empty, List, Dropdown, Avatar } from "antd";
import { SearchOutlined, ShoppingCartOutlined, UserOutlined, BellOutlined } from "@ant-design/icons";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getCart } from "../../services/client/cart/apiClient";
import type { Cart as CartType } from "../../services/client/cart/typing";
import { logout } from "../../services/client/auth/apiClient";
import NotificationPopover from "./NotificationPopover";

const { Header: AntHeader } = Layout;

const Header = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const searchParamVal = searchParams.get("search") || "";
  const [searchVal, setSearchVal] = useState(searchParamVal);
  const [prevSearchParamVal, setPrevSearchParamVal] = useState(searchParamVal);

  if (searchParamVal !== prevSearchParamVal) {
    setSearchVal(searchParamVal);
    setPrevSearchParamVal(searchParamVal);
  }

  const handleSearch = (value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value.trim()) {
      params.set("search", value.trim());
    } else {
      params.delete("search");
    }
    params.set("page", "1"); // Reset trang về 1 khi tìm kiếm mới
    navigate({
      pathname: "/products",
      search: params.toString(),
    });
  };

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
  const hasToken = !!userId;

  const { data } = useQuery({
    queryKey: ["cart", userId],
    queryFn: () => getCart(userId).then((res) => res.data),
    retry: false,
    enabled: !!userId,
  });

  const cartItems: CartType.ICartItem[] = data?.data || [];
  const cartCount = cartItems.length;

  const cartPreview = (
    <div style={{ width: 400 }}>
      <div style={{ paddingBottom: 10, borderBottom: "1px solid #f0f0f0", marginBottom: 10, fontWeight: 500 }}>
        Sản phẩm mới thêm
      </div>
      {cartItems.length > 0 ? (
        <>
          <List
            itemLayout="horizontal"
            dataSource={cartItems.slice(0, 5)}
            renderItem={(item) => {
              const img = item.imageUrl || "/placeholder.svg";
              return (
                <List.Item>
                  <List.Item.Meta
                    avatar={<img src={img} style={{ width: 40, height: 40, objectFit: "cover" }} alt="" />}
                    title={<div style={{ fontSize: 13, fontWeight: 400 }}>{item.productName}</div>}
                    description={
                      <div style={{ fontSize: 12 }}>
                        {item.size || "N/A"} / {item.color || "N/A"} x {item.quantity}
                      </div>
                    }
                  />
                  <div style={{ color: "#000000ff", fontSize: 13, fontWeight: 600 }}>
                    {new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(
                      item.price * item.quantity,
                    )}
                  </div>
                </List.Item>
              );
            }}
          />
          <div style={{ marginTop: 15, textAlign: "right" }}>
            <Link to="/cart">
              <Button type="primary">
                Xem giỏ hàng
              </Button>
            </Link>
          </div>
        </>
      ) : (
        <Empty description="Giỏ hàng trống" />
      )}
    </div>
  );

  return (
    <>
      <div
        style={{
          background: "#000",
          color: "#fff",
          fontSize: "13px",
          textAlign: "center",
          padding: "8px 0",
          fontWeight: 500,
        }}
      >
        FREE STANDARD SHIPPING &amp; RETURNS | JOIN ELITE CLUB
      </div>

      <AntHeader
        style={{
          background: "#fff",
          padding: "0 40px",
          height: 70,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          position: "sticky",
          top: 0,
          zIndex: 1000,
          boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
        }}
        className="app-header"
      >
        <style>{`
          @media (max-width: 1100px) {
            .desktop-categories { display: none !important; }
          }
          @media (max-width: 768px) {
            .header-search { width: 160px !important; }
            .app-header { padding: 0 16px !important; }
            .header-logo { font-size: 18px !important; }
          }
        `}</style>
        <Link to="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 10 }}>
          <img src="/favicon.svg" alt="SportStride Logo" style={{ height: 32, width: 32 }} />
          <div
            className="header-logo"
            style={{
              fontSize: 24,
              fontWeight: 900,
              color: "#000",
              letterSpacing: -1,
            }}
          >
            SportStride
          </div>
        </Link>

        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <Input
            className="header-search"
            placeholder="Tìm kiếm..."
            prefix={
              <SearchOutlined style={{ cursor: "pointer", color: "#888" }} onClick={() => handleSearch(searchVal)} />
            }
            value={searchVal}
            onChange={(e) => setSearchVal(e.target.value)}
            onPressEnter={() => handleSearch(searchVal)}
            style={{
              width: 450,
              borderRadius: 30,
              backgroundColor: "#f5f5f5",
            }}
          />

          <Popover content={cartPreview} placement="bottomRight" arrow={true}>
            <Badge count={cartCount} offset={[0, 4]}>
              <Link to="/cart">
                <Button type="text" icon={<ShoppingCartOutlined />} style={{ color: "#111", fontSize: 22 }} />
              </Link>
            </Badge>
          </Popover>

          <NotificationPopover>
            <Button type="text" icon={<BellOutlined />} style={{ color: "#111", fontSize: 22 }} />
          </NotificationPopover>

          {hasToken ? (
            <Dropdown
              menu={{
                items: [
                  {
                    key: "profile",
                    label: <Link to="/profile">Tài khoản của tôi</Link>,
                  },
                  {
                    key: "orders",
                    label: <Link to="/orders">Đơn hàng của tôi</Link>,
                  },
                  ...(userObj?.role === "Admin" || userObj?.role === "Staff" ? [
                    {
                      key: "admin",
                      label: <Link to="/admin/dashboard">Trang quản trị</Link>,
                    }
                  ] : []),
                  { type: "divider" },
                  {
                    key: "logout",
                    label: (
                      <div
                        onClick={() => {
                          logout();
                        }}
                        style={{ color: "red" }}
                      >
                        Đăng xuất
                      </div>
                    ),
                  },
                ],
              }}
              placement="bottomRight"
              trigger={["hover"]}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", marginLeft: 8 }}>
                <Avatar
                  src={userObj?.avatar}
                  style={{ backgroundColor: "#af101a", verticalAlign: "middle" }}
                >
                  {(userObj?.full_name || userObj?.username || "T")
                    .replace(/\s*\([^)]*\)/g, "")
                    .trim()[0]?.toUpperCase()}
                </Avatar>
                <span style={{ fontWeight: 600, color: "#111", fontSize: 14 }}>
                  {(userObj?.full_name || userObj?.username || "Tài khoản").replace(/\s*\([^)]*\)/g, "").trim()}
                </span>
              </div>
            </Dropdown>
          ) : (
            <Link to="/login">
              <Button type="text" icon={<UserOutlined />} style={{ color: "#111", fontSize: 22 }} />
            </Link>
          )}
        </div>
      </AntHeader>
    </>
  );
};

export default Header;
