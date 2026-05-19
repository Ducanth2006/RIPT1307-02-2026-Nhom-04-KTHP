import { Typography, Empty, Button, message, Spin } from "antd";
import { MinusOutlined, PlusOutlined, ShoppingCartOutlined } from "@ant-design/icons";
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getCart, updateCartItemApi, removeCartItemApi } from "../../services/Cart/apiClient";
import type { Cart as CartType } from "../../services/Cart/typing";
import "./Cart.less";

const { Title } = Typography;
const formatPrice = (p: number) => Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(p);

const Cart = () => {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["cart"],
    queryFn: () => getCart().then((res) => res.data),
    retry: false,
  });

  const cartItems: CartType.ICartItem[] = data?.data || [];
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["cart"] });

  const updateQty = useMutation({
    mutationFn: (args: { id: number; qty: number }) => updateCartItemApi(args.id, args.qty),
    onSuccess: invalidate,
  });

  const removeIdx = useMutation({
    mutationFn: removeCartItemApi,
    onSuccess: () => {
      message.success("Đã xóa khỏi giỏ");
      invalidate();
    },
  });

  if (isLoading)
    return (
      <div className="cart-page-loading">
        <Spin size="large" />
      </div>
    );
  if (!cartItems.length) return <EmptyCart />;

  const totalPrice = cartItems.reduce((s: number, i: CartType.ICartItem) => {
    const v = i.product_variants?.find((v) => v.id === i.selectedVariantId);
    return s + (v?.price || i.base_price) * i.quantity;
  }, 0);

  return (
    <div className="cart-page">
      <div className="cart-container">
        <Title level={3} className="cart-title">
          <ShoppingCartOutlined /> Giỏ Hàng
        </Title>
        <div className="cart-header-table">
          <div>Sản Phẩm</div>
          <div>Đơn Giá</div>
          <div>Số Lượng</div>
          <div>Số Tiền</div>
          <div>Thao Tác</div>
        </div>
        <div className="cart-items-list">
          {cartItems.map((item) => (
            <CartItem
              key={item.id}
              item={item}
              onUpdate={(qty: number) => updateQty.mutate({ id: item.id, qty })}
              onRemove={() => removeIdx.mutate(item.id)}
              loading={updateQty.isPending || removeIdx.isPending}
            />
          ))}
        </div>
        <div className="cart-summary-bar">
          <div className="total-label">Tổng thanh toán ({cartItems.length} sản phẩm):</div>
          <div className="total-amount">{formatPrice(totalPrice)}</div>
          <Button className="checkout-btn">Mua Hàng</Button>
        </div>
      </div>
    </div>
  );
};

const CartItem = ({
  item,
  onUpdate,
  onRemove,
  loading,
}: {
  item: CartType.ICartItem;
  onUpdate: (qty: number) => void;
  onRemove: () => void;
  loading: boolean;
}) => {
  const v = item.product_variants?.find((v) => v.id === item.selectedVariantId);
  const img =
    item.product_images?.find((img) => img.is_main)?.image_url ||
    item.product_images?.[0]?.image_url ||
    "/placeholder.jpg";
  const price = v?.price || item.base_price;

  return (
    <div className="cart-item-row">
      <div className="product-info">
        <img src={img} alt="" />
        <div className="details">
          <Link to={`/products/${item.id || item.id}`} className="name">
            {item.name}
          </Link>
          <div className="variant">
            Phân loại: {v?.size || "N/A"} / {v?.color || "N/A"}
          </div>
        </div>
      </div>
      <div className="unit-price">{formatPrice(price)}</div>
      <div className="quantity">
        <div className="quantity-toggle">
          <button onClick={() => onUpdate(item.quantity - 1)} disabled={item.quantity <= 1 || loading}>
            <MinusOutlined />
          </button>
          <input type="text" value={item.quantity} readOnly />
          <button
            onClick={() => onUpdate(item.quantity + 1)}
            disabled={item.quantity >= (v?.stock_quantity || 99) || loading}
          >
            <PlusOutlined />
          </button>
        </div>
      </div>
      <div className="total-price">{formatPrice(price * item.quantity)}</div>
      <div className="action">
        <button onClick={onRemove} disabled={loading}>
          Xóa
        </button>
      </div>
    </div>
  );
};

const EmptyCart = () => (
  <div className="cart-page">
    <div className="cart-container" style={{ textAlign: "center", padding: "100px 0" }}>
      <Empty description="Giỏ hàng trống">
        <Link to="/products">
          <Button type="primary" size="large" style={{ background: "#000" }}>
            MUA SẮM NGAY
          </Button>
        </Link>
      </Empty>
    </div>
  </div>
);

export default Cart;
