import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, Navigate } from "react-router-dom";
import {
  Typography,
  Tabs,
  Card,
  Tag,
  Button,
  Modal,
  Form,
  Input,
  message,
  Spin,
  Empty,
  Descriptions,
  Steps,
  Divider,
} from "antd";
import {
  ShoppingOutlined,
  CalendarOutlined,
  DollarCircleOutlined,
  CloseCircleOutlined,
  EyeOutlined,
  CarOutlined,
} from "@ant-design/icons";
import { getOrders, cancelOrder, getOrderById } from "../../services/Order/apiClient";
import type { IOrder, IOrderItem } from "../../services/Order/typing";
import "./Orders.less";

const { Title, Text } = Typography;

const formatPrice = (p: number) => new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(p);

const Orders = () => {
  const queryClient = useQueryClient();
  const userStr = localStorage.getItem("user");
  const userObj = userStr ? JSON.parse(userStr) : null;
  const userId = userObj?.id;

  const [activeTab, setActiveTab] = useState<string>("all");
  const [trackingOrderId, setTrackingOrderId] = useState<number | null>(null);
  const [cancelOrderId, setCancelOrderId] = useState<number | null>(null);
  const [cancelForm] = Form.useForm<{ cancelReason: string }>();

  // Get personal orders
  const { data: ordersData, isLoading } = useQuery({
    queryKey: ["orders", userId],
    queryFn: () => getOrders(userId!).then((res) => res.data),
    enabled: !!userId,
  });

  // Get order tracking detail
  const { data: trackingData, isLoading: isLoadingTracking } = useQuery({
    queryKey: ["orderTracking", trackingOrderId, userId],
    queryFn: () => getOrderById(trackingOrderId!, userId!).then((res) => res.data),
    enabled: !!trackingOrderId && !!userId,
  });

  const orders = ordersData?.data || [];

  // Cancel order mutation
  const cancelOrderMutation = useMutation({
    mutationFn: (args: { id: number; cancelReason: string }) =>
      cancelOrder(args.id, { userId: userId!, cancelReason: args.cancelReason }),
    onSuccess: () => {
      message.success("Hủy đơn hàng thành công!");
      queryClient.invalidateQueries({ queryKey: ["orders", userId] });
      setCancelOrderId(null);
      cancelForm.resetFields();
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { message?: string } } };
      message.error(err.response?.data?.message || "Không thể hủy đơn hàng này.");
    },
  });

  if (!userId) {
    return <Navigate to="/login" replace />;
  }

  if (isLoading) {
    return (
      <div className="orders-loading">
        <Spin size="large" tip="Đang tải lịch sử đơn hàng..." />
      </div>
    );
  }

  // Filter orders based on active tab
  const filteredOrders = orders.filter((order) => {
    if (activeTab === "all") return true;
    return order.status.toLowerCase() === activeTab.toLowerCase();
  });

  const handleCancelSubmit = (values: { cancelReason: string }) => {
    if (cancelOrderId) {
      cancelOrderMutation.mutate({ id: cancelOrderId, cancelReason: values.cancelReason });
    }
  };

  const getStatusTag = (status: IOrder["status"]) => {
    switch (status) {
      case "Pending":
        return <Tag color="warning">Chờ xử lý</Tag>;
      case "Confirmed":
        return <Tag color="processing">Đã xác nhận</Tag>;
      case "Packing":
        return <Tag color="purple">Đang đóng gói</Tag>;
      case "Shipping":
        return <Tag color="cyan">Đang giao hàng</Tag>;
      case "Completed":
        return <Tag color="success">Đã hoàn thành</Tag>;
      case "Cancelled":
        return <Tag color="error">Đã hủy</Tag>;
      default:
        return <Tag>{status}</Tag>;
    }
  };

  const getStepStatusIndex = (status: IOrder["status"]) => {
    switch (status) {
      case "Pending":
        return 0;
      case "Confirmed":
        return 1;
      case "Packing":
        return 2;
      case "Shipping":
        return 3;
      case "Completed":
        return 4;
      default:
        return 0;
    }
  };

  const tabsItems = [
    { key: "all", label: "Tất cả" },
    { key: "Pending", label: "Chờ xử lý" },
    { key: "Confirmed", label: "Đã xác nhận" },
    { key: "Packing", label: "Đang đóng gói" },
    { key: "Shipping", label: "Đang giao hàng" },
    { key: "Completed", label: "Đã hoàn thành" },
    { key: "Cancelled", label: "Đã hủy" },
  ];

  return (
    <div className="orders-page">
      <div className="orders-container">
        <div className="orders-header">
          <Title level={3} className="orders-title">
            <ShoppingOutlined /> Đơn Hàng Của Tôi
          </Title>
          <Text type="secondary">Xem lịch sử mua hàng và hành trình đơn hàng của bạn</Text>
        </div>

        <Tabs activeKey={activeTab} onChange={setActiveTab} className="orders-tabs" items={tabsItems} />

        {filteredOrders.length === 0 ? (
          <Empty description="Không tìm thấy đơn hàng nào" className="orders-empty">
            <Link to="/products">
              <Button type="primary" size="large" style={{ backgroundColor: "#ee4d2d", border: "none" }}>
                MUA SẮM NGAY
              </Button>
            </Link>
          </Empty>
        ) : (
          <div className="orders-list">
            {filteredOrders.map((order) => (
              <Card key={order.id} className="order-card" hoverable>
                <div className="order-card-header">
                  <div className="order-date-id">
                    <CalendarOutlined style={{ marginRight: 6 }} />
                    <Text strong style={{ fontSize: 14 }}>
                      Mã đơn: #{order.id}
                    </Text>
                    <Divider type="vertical" />
                    <Text type="secondary" style={{ fontSize: 13 }}>
                      Ngày đặt:{" "}
                      {new Date(order.created_at).toLocaleDateString("vi-VN", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </Text>
                  </div>
                  <div className="order-status">{getStatusTag(order.status)}</div>
                </div>

                <div className="order-items">
                  {order.items?.map((item: IOrderItem) => (
                    <div key={item.id} className="order-item-row">
                      <img src={item.imageUrl || "/placeholder.jpg"} alt={item.productName} className="item-image" />
                      <div className="item-details">
                        <Text strong className="item-name">
                          {item.productName}
                        </Text>
                        <Text type="secondary" className="item-variant">
                          Phân loại: {item.variantSize || "N/A"} / {item.variantColor || "N/A"}
                        </Text>
                        <Text type="secondary" className="item-quantity">
                          x{item.quantity}
                        </Text>
                      </div>
                      <div className="item-price">{formatPrice(item.price)}</div>
                    </div>
                  ))}
                </div>

                <div className="order-card-footer">
                  <div className="order-payment-info">
                    <DollarCircleOutlined style={{ marginRight: 6, color: "#52c41a" }} />
                    <Text type="secondary">Phương thức: </Text>
                    <Text strong>{order.paymentMethod}</Text>
                    {order.voucherDiscount ? (
                      <span style={{ marginLeft: 15 }}>
                        <Tag color="green">Voucher: -{formatPrice(order.voucherDiscount)}</Tag>
                      </span>
                    ) : null}
                  </div>
                  <div className="order-action-total">
                    <div className="order-total">
                      <Text type="secondary" style={{ fontSize: 14, marginRight: 8 }}>
                        Tổng số tiền:
                      </Text>
                      <Text className="total-amount">{formatPrice(order.totalPrice)}</Text>
                    </div>
                    <div className="order-actions">
                      <Button
                        icon={<EyeOutlined />}
                        onClick={() => setTrackingOrderId(order.id)}
                        className="action-btn"
                      >
                        Chi tiết lộ trình
                      </Button>
                      {(order.status === "Pending" || order.status === "Confirmed") && (
                        <Button
                          danger
                          icon={<CloseCircleOutlined />}
                          onClick={() => setCancelOrderId(order.id)}
                          className="action-btn"
                        >
                          Hủy đơn
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Modal Track/Detail Order */}
      <Modal
        title={
          <span>
            <CarOutlined style={{ marginRight: 8, color: "#1890ff" }} /> Chi Tiết Lộ Trình & Trạng Thái Đơn Hàng #
            {trackingOrderId}
          </span>
        }
        open={trackingOrderId !== null}
        onCancel={() => setTrackingOrderId(null)}
        footer={[
          <Button key="close" type="primary" onClick={() => setTrackingOrderId(null)}>
            Đóng
          </Button>,
        ]}
        width={750}
        destroyOnClose
      >
        {isLoadingTracking ? (
          <div style={{ textAlign: "center", padding: "50px 0" }}>
            <Spin size="large" />
          </div>
        ) : trackingData?.data ? (
          <div className="tracking-modal-content">
            <Steps
              current={getStepStatusIndex(trackingData.data.status)}
              className="tracking-steps"
              direction="horizontal"
              size="small"
              items={[
                { title: "Chờ xử lý", description: "Chờ cửa hàng duyệt" },
                { title: "Đã xác nhận", description: "Đã nhận đơn hàng" },
                { title: "Đóng gói", description: "Đang soạn hàng" },
                { title: "Giao hàng", description: "Đang vận chuyển" },
                { title: "Hoàn thành", description: "Giao hàng thành công" },
              ]}
            />

            {trackingData.data.status === "Cancelled" && (
              <div className="cancelled-alert">
                <CloseCircleOutlined style={{ color: "#ff4d4f", fontSize: 20, marginRight: 8 }} />
                <div>
                  <Text strong style={{ color: "#ff4d4f" }}>
                    Đơn hàng này đã bị hủy
                  </Text>
                  <br />
                  <Text type="secondary">Lý do: {trackingData.data.cancel_reason || "Khách hàng yêu cầu hủy"}</Text>
                </div>
              </div>
            )}

            <Divider />

            <Descriptions title="Thông tin giao hàng" bordered column={1} size="small">
              <Descriptions.Item label="Người nhận">{trackingData.data.shippingAddress?.fullName}</Descriptions.Item>
              <Descriptions.Item label="Số điện thoại">{trackingData.data.shippingAddress?.phone}</Descriptions.Item>
              <Descriptions.Item label="Địa chỉ giao hàng">
                {trackingData.data.shippingAddress?.address}
              </Descriptions.Item>
              <Descriptions.Item label="Thanh toán">
                <Text>
                  {trackingData.data.paymentMethod} ({trackingData.data.paymentStatus})
                </Text>
              </Descriptions.Item>
            </Descriptions>
          </div>
        ) : (
          <Empty description="Không tìm thấy chi tiết đơn hàng" />
        )}
      </Modal>

      {/* Modal Hủy Đơn Hàng */}
      <Modal
        title="Lý Do Hủy Đơn Hàng"
        open={cancelOrderId !== null}
        onCancel={() => {
          setCancelOrderId(null);
          cancelForm.resetFields();
        }}
        footer={null}
        destroyOnClose
      >
        <Form form={cancelForm} layout="vertical" onFinish={handleCancelSubmit}>
          <Form.Item
            label="Vui lòng cho biết lý do bạn muốn hủy đơn hàng này"
            name="cancelReason"
            rules={[{ required: true, message: "Vui lòng nhập lý do hủy đơn!" }]}
          >
            <Input.TextArea rows={4} placeholder="Ví dụ: Tôi muốn thay đổi địa chỉ nhận hàng, chọn nhầm sản phẩm..." />
          </Form.Item>
          <Form.Item style={{ textAlign: "right", marginBottom: 0 }}>
            <Button
              style={{ marginRight: 8 }}
              onClick={() => {
                setCancelOrderId(null);
                cancelForm.resetFields();
              }}
            >
              Hủy bỏ
            </Button>
            <Button type="primary" danger htmlType="submit" loading={cancelOrderMutation.isPending}>
              Xác nhận hủy đơn
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Orders;
