import { useState } from "react";
import { Layout, Input, Badge, Button, Popover, Empty, List, Dropdown } from "antd";
import { SearchOutlined, ShoppingCartOutlined, UserOutlined, BellOutlined } from "@ant-design/icons";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getCart } from "../../services/Cart/apiClient";
import type { Cart as CartType } from "../../services/Cart/typing";
import { logout } from "../../services/Auth/apiClient";
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

  const userStr = localStorage.getItem("user");
  const userObj = userStr ? JSON.parse(userStr) : null;
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
              const img = item.imageUrl || "/placeholder.jpg";
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
      >
        <Link to="/" style={{ textDecoration: "none" }}>
          <div
            style={{
              fontSize: 24,
              fontWeight: 900,
              color: "#000",
              letterSpacing: -1,
            }}
          >
            ELITE PERFORMANCE
          </div>
        </Link>

        <div style={{ display: "flex", gap: 32, fontWeight: 600 }}>
          <Link to="/" style={{ color: "#af101a", fontWeight: 700 }}>
            Nam
          </Link>
          <Link to="/" style={{ color: "#111" }}>
            Nữ
          </Link>
          <Link to="/" style={{ color: "#111" }}>
            Trẻ em
          </Link>
          <Link to="/" style={{ color: "#111" }}>
            Thể thao
          </Link>
          <Link to="/" style={{ color: "#111" }}>
            Thương hiệu
          </Link>
          <Link to="/" style={{ color: "#111" }}>
            Thời trang
          </Link>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Input
            placeholder="Tìm kiếm sản phẩm..."
            prefix={
              <SearchOutlined style={{ cursor: "pointer", color: "#888" }} onClick={() => handleSearch(searchVal)} />
            }
            value={searchVal}
            onChange={(e) => setSearchVal(e.target.value)}
            onPressEnter={() => handleSearch(searchVal)}
            style={{
              width: 300,
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
              <Button type="text" icon={<UserOutlined />} style={{ color: "#111" }} />
            </Dropdown>
          ) : (
            <Link to="/login">
              <Button type="text" icon={<UserOutlined />} style={{ color: "#111" }} />
            </Link>
          )}
        </div>
      </AntHeader>
    </>
  );
};

export default Header;
