import { useState } from "react";
import { Typography, Empty, Button, message, Spin, Modal, Form, Input, Radio, Divider, Tag, List, Switch } from "antd";
import {
  MinusOutlined,
  PlusOutlined,
  ShoppingCartOutlined,
  DollarCircleOutlined,
  EnvironmentOutlined,
  CheckOutlined,
} from "@ant-design/icons";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getCart, updateCartItemApi, removeCartItemApi } from "../../services/Cart/apiClient";
import { createOrder } from "../../services/Order/apiClient";
import { getAddresses, createAddress } from "../../services/Address/apiClient";
import type { IAddress } from "../../services/Address/typing";
import type { Cart as CartType } from "../../services/Cart/typing";
import type { ICreateOrderRequest } from "../../services/Order/typing";
import "./Cart.less";

const { Title, Text } = Typography;
const formatPrice = (p: number) => Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(p);

const Cart = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const userStr = localStorage.getItem("user");
  const userObj = userStr ? JSON.parse(userStr) : null;
  const userId = userObj?.id;
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);

  // Địa chỉ giao hàng
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);
  const [isAddressSelectModalOpen, setIsAddressSelectModalOpen] = useState(false);
  const [isAddNewAddressOpen, setIsAddNewAddressOpen] = useState(false);

  const { data: addressesData } = useQuery({
    queryKey: ["addresses", userId],
    queryFn: () => getAddresses(userId!).then((res) => res.data),
    enabled: !!userId,
  });

  const addresses = addressesData?.data || [];
  const defaultOrFirst = addresses.find((addr) => addr.is_default) || addresses[0] || null;
  const selectedAddress = selectedAddressId
    ? addresses.find((addr) => addr.id === selectedAddressId) || defaultOrFirst
    : defaultOrFirst;

  const addNewAddressMutation = useMutation({
    mutationFn: createAddress,
    onSuccess: (res: { data: { data: IAddress } }) => {
      message.success("Thêm địa chỉ thành công!");
      queryClient.invalidateQueries({ queryKey: ["addresses", userId] });
      setSelectedAddressId(res.data.data.id);
      setIsAddNewAddressOpen(false);
    },
    onError: () => {
      message.error("Lưu địa chỉ thất bại.");
    },
  });

  const { data, isLoading } = useQuery({
    queryKey: ["cart", userId],
    queryFn: () => getCart(userId!).then((res) => res.data),
    retry: false,
    enabled: !!userId,
  });

  const cartItems: CartType.ICartItem[] = data?.data || [];
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["cart", userId] });

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

  const createOrderMutation = useMutation({
    mutationFn: (data: ICreateOrderRequest) => createOrder(data),
    onSuccess: () => {
      message.success("Đặt hàng thành công!");
      queryClient.invalidateQueries({ queryKey: ["cart", userId] });
      setIsCheckoutModalOpen(false);
      navigate("/orders");
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { message?: string } } };
      message.error(err.response?.data?.message || "Đặt hàng không thành công. Vui lòng thử lại.");
    },
  });

  const [checkoutForm] = Form.useForm<{
    paymentMethod: string;
    voucherCode?: string;
  }>();

  const [newAddressForm] = Form.useForm<{
    recipient_name: string;
    phone: string;
    address_line: string;
    city: string;
    is_default: boolean;
  }>();

  const handleCheckoutSubmit = (values: { paymentMethod: string; voucherCode?: string }) => {
    if (!selectedAddress) {
      message.error("Vui lòng chọn hoặc thêm địa chỉ nhận hàng!");
      return;
    }
    createOrderMutation.mutate({
      userId: userId!,
      shippingAddress: {
        fullName: selectedAddress.recipient_name,
        phone: selectedAddress.phone,
        address: `${selectedAddress.address_line}, ${selectedAddress.city}`,
      },
      paymentMethod: values.paymentMethod,
      voucherCode: values.voucherCode,
    });
  };

  if (!userId) {
    return <Navigate to="/login" replace />;
  }

  if (isLoading)
    return (
      <div className="cart-page-loading">
        <Spin size="large" />
      </div>
    );
  if (!cartItems.length) return <EmptyCart />;

  const totalPrice = cartItems.reduce((s: number, i: CartType.ICartItem) => {
    return s + i.price * i.quantity;
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
              key={item.cartItemId}
              item={item}
              onUpdate={(qty: number) => updateQty.mutate({ id: item.cartItemId, qty })}
              onRemove={() => removeIdx.mutate(item.cartItemId)}
              loading={updateQty.isPending || removeIdx.isPending}
            />
          ))}
        </div>
        <div className="cart-summary-bar">
          <div className="total-label">Tổng thanh toán ({cartItems.length} sản phẩm):</div>
          <div className="total-amount">{formatPrice(totalPrice)}</div>
          <Button className="checkout-btn" onClick={() => setIsCheckoutModalOpen(true)}>
            Mua Hàng
          </Button>
        </div>
      </div>

      {/* Checkout Modal */}
      <Modal
        title={
          <span>
            <ShoppingCartOutlined style={{ marginRight: 8, color: "#ee4d2d" }} /> Xác Nhận Đặt Hàng & Thanh Toán
          </span>
        }
        open={isCheckoutModalOpen}
        onCancel={() => {
          setIsCheckoutModalOpen(false);
          checkoutForm.resetFields();
        }}
        footer={null}
        destroyOnClose
        width={600}
      >
        <div style={{ margin: "16px 0" }}>
          <Text type="secondary">
            Vui lòng hoàn tất thông tin nhận hàng và chọn phương thức thanh toán để đặt hàng.
          </Text>
        </div>
        <Divider />
        <Form
          form={checkoutForm}
          layout="vertical"
          onFinish={handleCheckoutSubmit}
          initialValues={{ paymentMethod: "COD" }}
        >
          <div style={{ marginBottom: 16 }}>
            <Text strong style={{ fontSize: 15, display: "flex", alignItems: "center", gap: 6 }}>
              <EnvironmentOutlined style={{ color: "#ee4d2d" }} /> Địa Chỉ Nhận Hàng
            </Text>
          </div>

          {selectedAddress ? (
            <div
              style={{
                padding: "16px",
                border: "1px solid #f0f0f0",
                borderRadius: 8,
                backgroundColor: "#fafafa",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 20,
              }}
            >
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                  <Text strong style={{ fontSize: 15 }}>
                    {selectedAddress.recipient_name}
                  </Text>
                  <Divider type="vertical" style={{ margin: "0 4px" }} />
                  <Text strong>{selectedAddress.phone}</Text>
                  {selectedAddress.is_default && (
                    <Tag color="red" style={{ borderColor: "#ee4d2d", color: "#ee4d2d", backgroundColor: "#fff5f2" }}>
                      Mặc định
                    </Tag>
                  )}
                </div>
                <div style={{ color: "#555", fontSize: 14 }}>
                  {selectedAddress.address_line}, {selectedAddress.city}
                </div>
              </div>
              <Button
                type="link"
                onClick={() => setIsAddressSelectModalOpen(true)}
                style={{ color: "#ee4d2d", fontWeight: 500 }}
              >
                Thay đổi
              </Button>
            </div>
          ) : (
            <div
              style={{
                padding: "24px",
                border: "1px dashed #d9d9d9",
                borderRadius: 8,
                textAlign: "center",
                marginBottom: 20,
              }}
            >
              <Text type="secondary" style={{ display: "block", marginBottom: 12 }}>
                Bạn chưa chọn hoặc chưa có địa chỉ nhận hàng nào.
              </Text>
              <Button
                type="primary"
                onClick={() => setIsAddNewAddressOpen(true)}
                style={{ backgroundColor: "#ee4d2d", border: "none" }}
              >
                + Thêm Địa Chỉ Mới
              </Button>
            </div>
          )}

          <Divider />

          <div style={{ marginBottom: 16 }}>
            <Text strong style={{ fontSize: 15, display: "flex", alignItems: "center", gap: 6 }}>
              <DollarCircleOutlined style={{ color: "#52c41a" }} /> Phương Thức Thanh Toán
            </Text>
          </div>
          <Form.Item name="paymentMethod">
            <Radio.Group style={{ width: "100%" }}>
              <Radio value="COD" style={{ display: "block", marginBottom: 12 }}>
                Thanh toán khi nhận hàng (COD)
              </Radio>
              <Radio value="Banking" style={{ display: "block" }}>
                Chuyển khoản ngân hàng (Qua thẻ ngân hàng/Ví điện tử)
              </Radio>
            </Radio.Group>
          </Form.Item>

          <Divider />

          <Form.Item label="Mã giảm giá / Voucher (nếu có)" name="voucherCode">
            <Input placeholder="Ví dụ: SUMMER20, WELCOME50" style={{ textTransform: "uppercase" }} />
          </Form.Item>

          <div
            style={{
              marginTop: 24,
              padding: "16px",
              backgroundColor: "#fafafa",
              borderRadius: 8,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div>
              <Text type="secondary">Tổng số tiền cần thanh toán:</Text>
              <br />
              <Text style={{ fontSize: 22, fontWeight: 600, color: "#ee4d2d" }}>{formatPrice(totalPrice)}</Text>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <Button onClick={() => setIsCheckoutModalOpen(false)}>Quay lại</Button>
              <Button
                type="primary"
                htmlType="submit"
                loading={createOrderMutation.isPending}
                style={{ backgroundColor: "#ee4d2d", borderColor: "#ee4d2d" }}
              >
                Đặt Hàng Ngay
              </Button>
            </div>
          </div>
        </Form>
      </Modal>

      {/* Address Selection Modal (Shopee Style) */}
      <Modal
        title="Địa Chỉ Của Tôi"
        open={isAddressSelectModalOpen}
        onCancel={() => setIsAddressSelectModalOpen(false)}
        footer={null}
        width={550}
        destroyOnClose
      >
        <div style={{ maxHeight: 400, overflowY: "auto", marginBottom: 20 }}>
          {addresses.length === 0 ? (
            <Empty description="Chưa có địa chỉ nào được lưu." />
          ) : (
            <List
              dataSource={addresses}
              renderItem={(addr) => (
                <div
                  onClick={() => {
                    setSelectedAddressId(addr.id);
                    setIsAddressSelectModalOpen(false);
                  }}
                  style={{
                    padding: "16px",
                    border: "1px solid #f0f0f0",
                    borderRadius: 8,
                    marginBottom: 12,
                    cursor: "pointer",
                    backgroundColor: selectedAddress?.id === addr.id ? "#fffcfb" : "#fff",
                    borderColor: selectedAddress?.id === addr.id ? "#ee4d2d" : "#f0f0f0",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    transition: "all 0.2s",
                  }}
                >
                  <div style={{ flex: 1, paddingRight: 10 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                      <Text strong style={{ fontSize: 14 }}>
                        {addr.recipient_name}
                      </Text>
                      <Divider type="vertical" style={{ margin: "0 2px" }} />
                      <Text type="secondary" style={{ fontSize: 13 }}>
                        {addr.phone}
                      </Text>
                      {addr.is_default && (
                        <Tag
                          color="red"
                          style={{ borderColor: "#ee4d2d", color: "#ee4d2d", backgroundColor: "#fff5f2" }}
                        >
                          Mặc định
                        </Tag>
                      )}
                    </div>
                    <div style={{ color: "#666", fontSize: 13 }}>{addr.address_line}</div>
                    <div style={{ color: "#999", fontSize: 12 }}>{addr.city}</div>
                  </div>
                  {selectedAddress?.id === addr.id && <CheckOutlined style={{ color: "#ee4d2d", fontSize: 16 }} />}
                </div>
              )}
            />
          )}
        </div>
        <div style={{ textAlign: "center" }}>
          <Button
            type="primary"
            onClick={() => {
              setIsAddressSelectModalOpen(false);
              setIsAddNewAddressOpen(true);
            }}
            style={{ backgroundColor: "#ee4d2d", border: "none", width: "100%", height: 40 }}
          >
            + Thêm Địa Chỉ Mới
          </Button>
        </div>
      </Modal>

      {/* Add New Address Modal (Inside Checkout) */}
      <Modal
        title="Thêm Địa Chỉ Mới"
        open={isAddNewAddressOpen}
        onCancel={() => setIsAddNewAddressOpen(false)}
        footer={null}
        destroyOnClose
      >
        <Form
          form={newAddressForm}
          layout="vertical"
          onFinish={(values: {
            recipient_name: string;
            phone: string;
            address_line: string;
            city: string;
            is_default: boolean;
          }) => {
            addNewAddressMutation.mutate({
              userId: userId!,
              recipient_name: values.recipient_name,
              phone: values.phone,
              address_line: values.address_line,
              city: values.city,
              is_default: !!values.is_default,
            });
          }}
        >
          <Form.Item
            label="Họ và tên người nhận"
            name="recipient_name"
            rules={[{ required: true, message: "Vui lòng nhập họ tên người nhận!" }]}
          >
            <Input placeholder="Nguyễn Văn A" />
          </Form.Item>

          <Form.Item
            label="Số điện thoại"
            name="phone"
            rules={[
              { required: true, message: "Vui lòng nhập số điện thoại!" },
              { pattern: /^[0-9]{10}$/, message: "Số điện thoại phải gồm 10 chữ số!" },
            ]}
          >
            <Input placeholder="0901234567" />
          </Form.Item>

          <Form.Item
            label="Địa chỉ chi tiết (Số nhà, Tên đường...)"
            name="address_line"
            rules={[{ required: true, message: "Vui lòng nhập địa chỉ chi tiết!" }]}
          >
            <Input placeholder="Ví dụ: 123 Đường Lê Lợi, Phường Bến Nghé" />
          </Form.Item>

          <Form.Item
            label="Tỉnh/Thành phố, Quận/Huyện"
            name="city"
            rules={[{ required: true, message: "Vui lòng nhập thông tin Tỉnh/Thành phố!" }]}
          >
            <Input placeholder="Ví dụ: Quận 1, TP. Hồ Chí Minh" />
          </Form.Item>

          <Form.Item label="Đặt làm địa chỉ mặc định" name="is_default" valuePropName="checked">
            <Switch />
          </Form.Item>

          <Form.Item style={{ textAlign: "right", marginBottom: 0, marginTop: 24 }}>
            <Button style={{ marginRight: 8 }} onClick={() => setIsAddNewAddressOpen(false)}>
              Hủy
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              loading={addNewAddressMutation.isPending}
              style={{ backgroundColor: "#ee4d2d", borderColor: "#ee4d2d" }}
            >
              Lưu & Chọn
            </Button>
          </Form.Item>
        </Form>
      </Modal>
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
  const img = item.imageUrl || "/placeholder.jpg";
  const price = item.price;

  return (
    <div className="cart-item-row">
      <div className="product-info">
        <img src={img} alt="" />
        <div className="details">
          <Link to={`/products/${item.productId}`} className="name">
            {item.productName}
          </Link>
          <div className="variant">
            Phân loại: {item.size || "N/A"} / {item.color || "N/A"}
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
            disabled={item.quantity >= (item.stockQuantity || 99) || loading}
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
