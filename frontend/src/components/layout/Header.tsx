import { Layout, Input, Badge, Button, Popover, Empty, List } from "antd";
import { SearchOutlined, ShoppingCartOutlined, UserOutlined } from "@ant-design/icons";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getCart } from "../../services/Cart/apiClient";
import type { Cart as CartType } from "../../services/Cart/typing";

const { Header: AntHeader } = Layout;

const Header = () => {
  const { data } = useQuery({
    queryKey: ["cart"],
    queryFn: () => getCart().then((res) => res.data),
    retry: false,
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
              const img =
                item.product_images?.find((i) => i.is_main)?.image_url ||
                item.product_images?.[0]?.image_url ||
                "/placeholder.jpg";
              const variant = item.product_variants?.find((v) => v.id === item.selectedVariantId);
              return (
                <List.Item>
                  <List.Item.Meta
                    avatar={<img src={img} style={{ width: 40, height: 40, objectFit: "cover" }} alt="" />}
                    title={<div style={{ fontSize: 13, fontWeight: 600 }}>{item.name}</div>}
                    description={
                      <div style={{ fontSize: 12 }}>
                        {variant ? `${variant.size} / ${variant.color}` : ""} x {item.quantity}
                      </div>
                    }
                  />
                  <div style={{ color: "#ff4d4f", fontSize: 13, fontWeight: 600 }}>
                    {new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(
                      (variant?.price || item.base_price) * item.quantity,
                    )}
                  </div>
                </List.Item>
              );
            }}
          />
          <div style={{ marginTop: 15, textAlign: "right" }}>
            <Link to="/cart">
              <Button type="primary" danger>
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
          <Link to="/" style={{ color: "#ff4d4f", fontWeight: 700 }}>
            MEN
          </Link>
          <Link to="/" style={{ color: "#111" }}>
            WOMEN
          </Link>
          <Link to="/" style={{ color: "#111" }}>
            KIDS
          </Link>
          <Link to="/" style={{ color: "#111" }}>
            SPORTS
          </Link>
          <Link to="/" style={{ color: "#111" }}>
            BRANDS
          </Link>
          <Link to="/" style={{ color: "#111" }}>
            RELEASES
          </Link>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <Input
            placeholder="Search"
            prefix={<SearchOutlined />}
            style={{
              width: 280,
              borderRadius: 30,
              backgroundColor: "#f5f5f5",
            }}
          />

          <Link to="/login">
            <Button type="text" icon={<UserOutlined />} style={{ color: "#111" }} />
          </Link>

          <Popover content={cartPreview} placement="bottomRight" arrow={true}>
            <Badge count={cartCount} offset={[0, 4]}>
              <Link to="/cart">
                <Button type="text" icon={<ShoppingCartOutlined />} style={{ color: "#111", fontSize: 22 }} />
              </Link>
            </Badge>
          </Popover>
        </div>
      </AntHeader>
    </>
  );
};

export default Header;
