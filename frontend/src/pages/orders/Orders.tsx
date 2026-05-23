import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, Navigate, useSearchParams } from "react-router-dom";
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
  Rate,
  Row,
  Col,
} from "antd";
import {
  ShoppingOutlined,
  CalendarOutlined,
  DollarCircleOutlined,
  CloseCircleOutlined,
  EyeOutlined,
  CarOutlined,
  StarOutlined,
  ClockCircleOutlined,
} from "@ant-design/icons";
import { getOrders, cancelOrder, getOrderById } from "../../services/Order/apiClient";
import { getMyReviewsApi, createReviewApi } from "../../services/Review/apiClient";
import type { IOrder, IOrderItem } from "../../services/Order/typing";
import "./Orders.less";

const { Title, Text, Paragraph } = Typography;

const formatPrice = (p: number) => new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(p);

const Orders = () => {
  const queryClient = useQueryClient();
  const userStr = localStorage.getItem("user");
  const userObj = userStr ? JSON.parse(userStr) : null;
  const userId = userObj?.id;

  const [searchParams, setSearchParams] = useSearchParams();
  const openOrderId = searchParams.get("openOrderId");

  const [activeTab, setActiveTab] = useState<string>("all");
  const [trackingOrderId, setTrackingOrderId] = useState<number | null>(null);
  const [cancelOrderId, setCancelOrderId] = useState<number | null>(null);
  const [cancelForm] = Form.useForm<{ cancelReason: string }>();
  const [proofImageBase64, setProofImageBase64] = useState<string | null>(null);

  // Review states
  const [reviewingOrder, setReviewingOrder] = useState<IOrder | null>(null);
  const [reviewInputs, setReviewInputs] = useState<Record<number, { rating: number; comment: string }>>({});
  const [submittingProductId, setSubmittingProductId] = useState<number | null>(null);

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

  // Get my reviews history
  const { data: myReviewsData, refetch: refetchMyReviews } = useQuery({
    queryKey: ["myReviews", userId],
    queryFn: () => getMyReviewsApi(userId!).then((res) => res.data),
    enabled: !!userId,
  });
  const myReviews = myReviewsData?.data || [];

  const reviewedKeys = useMemo(() => {
    const set = new Set<string>();
    myReviews.forEach((r: any) => {
      if (r.order_id && r.products?.id) {
        set.add(`${r.order_id}_${r.products.id}`);
      }
    });
    return set;
  }, [myReviews]);

  const orders = ordersData?.data || [];

  // Cancel order mutation
  const cancelOrderMutation = useMutation({
    mutationFn: (args: { id: number; cancelReason: string }) =>
      cancelOrder(args.id, { userId: userId!, cancelReason: args.cancelReason }),
    onSuccess: () => {
      message.success("Gửi yêu cầu hủy đơn hàng thành công! Vui lòng chờ admin phê duyệt.");
      queryClient.invalidateQueries({ queryKey: ["orders", userId] });
      setCancelOrderId(null);
      setProofImageBase64(null);
      cancelForm.resetFields();
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { message?: string } } };
      message.error(err.response?.data?.message || "Không thể gửi yêu cầu hủy đơn hàng này.");
    },
  });

  useEffect(() => {
    if (openOrderId && orders.length > 0) {
      const foundOrder = orders.find(o => String(o.id) === String(openOrderId));
      if (foundOrder) {
        setTrackingOrderId(foundOrder.id);
        const newParams = new URLSearchParams(searchParams);
        newParams.delete("openOrderId");
        setSearchParams(newParams, { replace: true });
      }
    }
  }, [openOrderId, orders, setSearchParams, searchParams]);

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
      const packagedReason = JSON.stringify({
        reason: values.cancelReason,
        image: proofImageBase64
      });
      cancelOrderMutation.mutate({ id: cancelOrderId, cancelReason: packagedReason });
    }
  };

  const handleRatingChange = (productId: number, rating: number) => {
    setReviewInputs((prev) => ({
      ...prev,
      [productId]: { ...prev[productId], rating },
    }));
  };

  const handleCommentChange = (productId: number, comment: string) => {
    setReviewInputs((prev) => ({
      ...prev,
      [productId]: { ...prev[productId], comment },
    }));
  };

  const handleSubmitSingleReview = async (productId: number) => {
    if (!userId || !reviewingOrder) return;
    const input = reviewInputs[productId];
    if (!input || !input.rating) {
      message.warning("Vui lòng chọn số sao đánh giá!");
      return;
    }

    try {
      setSubmittingProductId(productId);
      await createReviewApi({
        userId,
        productId,
        orderId: reviewingOrder.id,
        rating: input.rating,
        comment: input.comment,
      });
      message.success("Đánh giá sản phẩm thành công!");
      refetchMyReviews();
    } catch (error: any) {
      message.error(error.response?.data?.message || "Lỗi khi gửi đánh giá.");
    } finally {
      setSubmittingProductId(null);
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
      case "CancelRequested":
        return <Tag color="orange">Đang yêu cầu hủy</Tag>;
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
      case "CancelRequested":
        return 2;
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
    { key: "CancelRequested", label: "Yêu cầu hủy" },
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
                        Chi tiết đơn hàng
                      </Button>
                      {order.status === "Completed" && (
                        <Button
                          icon={<StarOutlined />}
                          onClick={() => {
                            setReviewingOrder(order);
                            setReviewInputs({});
                          }}
                          className="action-btn"
                          style={{ borderColor: "#faad14", color: "#faad14" }}
                        >
                          Đánh giá sản phẩm
                        </Button>
                      )}
                      {order.status === "CancelRequested" ? (
                        <Button
                          disabled
                          icon={<ClockCircleOutlined />}
                          className="action-btn"
                          style={{ opacity: 0.6, cursor: "not-allowed" }}
                        >
                          Đang yêu cầu hủy
                        </Button>
                      ) : (
                        <Button
                          danger={order.status === "Pending" || order.status === "Confirmed" || order.status === "Packing"}
                          disabled={!["Pending", "Confirmed", "Packing"].includes(order.status)}
                          icon={<CloseCircleOutlined />}
                          onClick={() => setCancelOrderId(order.id)}
                          className="action-btn"
                          style={
                            !["Pending", "Confirmed", "Packing"].includes(order.status)
                              ? { opacity: 0.5, cursor: "not-allowed", backgroundColor: "#f5f5f5", color: "rgba(0, 0, 0, 0.25)", borderColor: "#d9d9d9" }
                              : {}
                          }
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
            <CarOutlined style={{ marginRight: 8, color: "#1890ff" }} /> Chi tiết đơn hàng #
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
            {/* Steps Timeline with Exact Times */}
            {(() => {
              const timeline = trackingData.data.shippingAddress?.timeline || {};
              const formatTimelineTime = (isoString?: string) => {
                if (!isoString) return "";
                const date = new Date(isoString);
                return date.toLocaleString("vi-VN", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit"
                });
              };
              
              const stepItems = [
                { title: "Chờ xử lý", description: timeline.Pending ? formatTimelineTime(timeline.Pending) : "" },
                { title: "Đã xác nhận", description: timeline.Confirmed ? formatTimelineTime(timeline.Confirmed) : "" },
                { title: "Đóng gói", description: timeline.Packing ? formatTimelineTime(timeline.Packing) : "" },
                { title: "Giao hàng", description: timeline.Shipping ? formatTimelineTime(timeline.Shipping) : "" },
                { title: "Hoàn thành", description: timeline.Completed ? formatTimelineTime(timeline.Completed) : "" },
              ];

              return (
                <Steps
                  current={getStepStatusIndex(trackingData.data.status)}
                  className="tracking-steps"
                  direction="horizontal"
                  size="small"
                  items={stepItems}
                  style={{ marginBottom: 24 }}
                />
              );
            })()}

            {trackingData.data.status === "CancelRequested" && (
              <div className="cancelled-alert" style={{ background: "#fffbe6", border: "1px solid #ffe58f", color: "#d46b08", padding: "12px", borderRadius: "6px", marginBottom: "16px", display: "flex", gap: 10, alignItems: "center" }}>
                <ClockCircleOutlined style={{ color: "#faad14", fontSize: 20 }} />
                <div>
                  <Text strong style={{ color: "#d46b08" }}>
                    Đơn hàng này đang chờ phê duyệt hủy từ Admin
                  </Text>
                  <br />
                  <Text type="secondary">
                    Lý do hủy: {(() => {
                      try {
                        const parsed = JSON.parse(trackingData.data.cancel_reason || "");
                        return parsed.reason || trackingData.data.cancel_reason;
                      } catch {
                        return trackingData.data.cancel_reason || "Khách hàng yêu cầu hủy";
                      }
                    })()}
                  </Text>
                  {(() => {
                    try {
                      const parsed = JSON.parse(trackingData.data.cancel_reason || "");
                      if (parsed.image) {
                        return (
                          <div style={{ marginTop: 8 }}>
                            <Text type="secondary" style={{ display: "block", marginBottom: 4 }}>Minh chứng hủy hàng:</Text>
                            <img src={parsed.image} alt="Proof" style={{ maxWidth: 200, maxHeight: 150, borderRadius: 4, border: "1px solid #ddd" }} />
                          </div>
                        );
                      }
                    } catch {}
                    return null;
                  })()}
                </div>
              </div>
            )}

            {trackingData.data.status === "Cancelled" && (
              <div className="cancelled-alert" style={{ background: "#fff2f0", border: "1px solid #ffccc7", color: "#ff4d4f", padding: "12px", borderRadius: "6px", marginBottom: "16px", display: "flex", gap: 10, alignItems: "center" }}>
                <CloseCircleOutlined style={{ color: "#ff4d4f", fontSize: 20 }} />
                <div>
                  <Text strong style={{ color: "#ff4d4f" }}>
                    Đơn hàng này đã bị hủy
                  </Text>
                  <br />
                  <Text type="secondary">
                    Lý do: {(() => {
                      try {
                        const parsed = JSON.parse(trackingData.data.cancel_reason || "");
                        return parsed.reason || trackingData.data.cancel_reason;
                      } catch {
                        return trackingData.data.cancel_reason || "Khách hàng yêu cầu hủy";
                      }
                    })()}
                  </Text>
                  {(() => {
                    try {
                      const parsed = JSON.parse(trackingData.data.cancel_reason || "");
                      if (parsed.image) {
                        return (
                          <div style={{ marginTop: 8 }}>
                            <img src={parsed.image} alt="Proof" style={{ maxWidth: 200, maxHeight: 150, borderRadius: 4, border: "1px solid #ddd" }} />
                          </div>
                        );
                      }
                    } catch {}
                    return null;
                  })()}
                </div>
              </div>
            )}

            <Divider orientation={"left" as any}>Danh sách sản phẩm</Divider>
            <div className="order-items-list" style={{ marginBottom: 24 }}>
              {trackingData.data.items?.map((item: any) => {
                const image = item.imageUrl || "https://placehold.co/80";
                return (
                  <div key={item.id} style={{ display: "flex", gap: 16, padding: "12px 0", borderBottom: "1px solid #f0f0f0" }}>
                    <img src={image} alt={item.productName} style={{ width: 64, height: 64, objectFit: "cover", borderRadius: 4 }} />
                    <div style={{ flex: 1 }}>
                      <h4 style={{ margin: "0 0 4px 0", fontSize: 14 }}>{item.productName}</h4>
                      <div style={{ fontSize: 12, color: "#8c8c8c" }}>
                        Phân loại: {item.variantColor || "-"} / {item.variantSize || "-"}
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
                        <span style={{ fontSize: 13, color: "#595959" }}>
                          {formatPrice(item.price)} x {item.quantity}
                        </span>
                        <span style={{ fontWeight: 600, marginLeft: "auto" }}>
                          {formatPrice(item.price * item.quantity)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            
            <div style={{ background: "#fafafa", padding: 16, borderRadius: 8, textAlign: "right", marginBottom: 24 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <Text type="secondary">Tạm tính:</Text>
                <Text strong>{formatPrice(trackingData.data.totalPrice + (trackingData.data.voucherDiscount || 0))}</Text>
              </div>
              {(trackingData.data.voucherDiscount || 0) > 0 && (
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, color: "#ff4d4f" }}>
                  <Text type="secondary" style={{ color: "#ff4d4f" }}>Giảm giá:</Text>
                  <Text strong style={{ color: "#ff4d4f" }}>-{formatPrice(trackingData.data.voucherDiscount || 0)}</Text>
                </div>
              )}
              <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px solid #f0f0f0", paddingTop: 8 }}>
                <Text strong style={{ fontSize: 16 }}>Tổng tiền:</Text>
                <Text strong style={{ fontSize: 18, color: "#af101a" }}>{formatPrice(trackingData.data.totalPrice)}</Text>
              </div>
            </div>

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
        title="Yêu Cầu Hủy Đơn Hàng"
        open={cancelOrderId !== null}
        onCancel={() => {
          setCancelOrderId(null);
          setProofImageBase64(null);
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

          <Form.Item
            label="Tải lên hình ảnh minh chứng (nếu có)"
            extra="Vui lòng tải lên ảnh chụp sản phẩm lỗi hoặc tin nhắn xác nhận để Admin duyệt nhanh hơn."
          >
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  const reader = new FileReader();
                  reader.onloadend = () => {
                    setProofImageBase64(reader.result as string);
                  };
                  reader.readAsDataURL(file);
                }
              }}
              style={{ display: "block", marginBottom: 12 }}
            />
            {proofImageBase64 && (
              <div style={{ marginTop: 8 }}>
                <Text type="secondary" style={{ display: "block", marginBottom: 4 }}>Xem trước hình ảnh:</Text>
                <img
                  src={proofImageBase64}
                  alt="Preview proof"
                  style={{ maxWidth: "100%", maxHeight: 200, borderRadius: 8, border: "1px solid #ddd", objectFit: "contain" }}
                />
              </div>
            )}
          </Form.Item>

          <Form.Item style={{ textAlign: "right", marginBottom: 0 }}>
            <Button
              style={{ marginRight: 8 }}
              onClick={() => {
                setCancelOrderId(null);
                setProofImageBase64(null);
                cancelForm.resetFields();
              }}
            >
              Hủy bỏ
            </Button>
            <Button type="primary" danger htmlType="submit" loading={cancelOrderMutation.isPending}>
              Gửi yêu cầu hủy đơn
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      {/* Modal Đánh Giá Sản Phẩm */}
      <Modal
        title={
          <span>
            <StarOutlined style={{ marginRight: 8, color: "#faad14" }} />
            Đánh Giá Sản Phẩm (Đơn hàng #{reviewingOrder?.id})
          </span>
        }
        open={reviewingOrder !== null}
        onCancel={() => setReviewingOrder(null)}
        footer={[
          <Button key="close" type="primary" onClick={() => setReviewingOrder(null)}>
            Đóng
          </Button>,
        ]}
        width={700}
        destroyOnClose
      >
        <div style={{ maxHeight: "60vh", overflowY: "auto", paddingRight: 8 }}>
          {reviewingOrder?.items?.map((item: IOrderItem) => {
            const hasReviewed = reviewedKeys.has(`${reviewingOrder.id}_${item.productId}`);
            const inputVal = reviewInputs[item.productId] || { rating: 0, comment: "" };

            return (
              <div
                key={item.id}
                style={{
                  padding: "20px 0",
                  borderBottom: "1px solid #f0f0f0",
                }}
              >
                <Row gutter={16} align="top">
                  <Col span={4}>
                    <img
                      src={item.imageUrl || "/placeholder.jpg"}
                      alt={item.productName}
                      style={{
                        width: "100%",
                        height: 70,
                        objectFit: "cover",
                        borderRadius: 8,
                        border: "1px solid #eee",
                      }}
                    />
                  </Col>
                  <Col span={20}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                      <div>
                        <Text strong style={{ fontSize: 15, display: "block" }}>
                          {item.productName}
                        </Text>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          Phân loại: {item.variantSize || "N/A"} / {item.variantColor || "N/A"}
                        </Text>
                      </div>
                      {hasReviewed ? (
                        <Tag color="success" style={{ borderRadius: 4, padding: "2px 8px" }}>
                          Đã đánh giá thành công
                        </Tag>
                      ) : (
                        <Tag color="warning" style={{ borderRadius: 4, padding: "2px 8px" }}>
                          Chưa đánh giá
                        </Tag>
                      )}
                    </div>

                    {hasReviewed ? (
                      <div style={{ background: "#f9f9f9", padding: "12px 16px", borderRadius: 8, marginTop: 8 }}>
                        {(() => {
                          const prevReview = myReviews.find((r: any) => Number(r.order_id) === reviewingOrder.id && Number(r.products?.id) === item.productId);
                          return (
                            <>
                              <Rate disabled value={prevReview?.rating || 5} style={{ fontSize: 14, color: "#faad14", marginBottom: 4 }} />
                              <Paragraph style={{ margin: 0, color: "#555", fontSize: 13, fontStyle: "italic" }}>
                                "{prevReview?.comment || "Sản phẩm tốt, đúng như mô tả!"}"
                              </Paragraph>
                            </>
                          );
                        })()}
                      </div>
                    ) : (
                      <div style={{ marginTop: 12 }}>
                        <div style={{ marginBottom: 12, display: "flex", alignItems: "center", gap: 12 }}>
                          <span style={{ fontSize: 14, fontWeight: 600 }}>Điểm đánh giá:</span>
                          <Rate
                            value={inputVal.rating}
                            onChange={(val) => handleRatingChange(item.productId, val)}
                            style={{ fontSize: 20, color: "#faad14" }}
                          />
                        </div>
                        <div style={{ marginBottom: 12 }}>
                          <Input.TextArea
                            rows={3}
                            placeholder="Chia sẻ nhận xét của bạn về sản phẩm này (chất lượng, đóng gói, giao hàng...)"
                            value={inputVal.comment}
                            onChange={(e) => handleCommentChange(item.productId, e.target.value)}
                            style={{ borderRadius: 8 }}
                          />
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <Button
                            type="primary"
                            disabled={inputVal.rating === 0}
                            loading={submittingProductId === item.productId}
                            onClick={() => handleSubmitSingleReview(item.productId)}
                            style={{
                              backgroundColor: inputVal.rating > 0 ? "#ee4d2d" : "#ccc",
                              borderColor: inputVal.rating > 0 ? "#ee4d2d" : "#ccc",
                              borderRadius: 6,
                              fontWeight: 600,
                            }}
                          >
                            Gửi đánh giá
                          </Button>
                        </div>
                      </div>
                    )}
                  </Col>
                </Row>
              </div>
            );
          })}
        </div>
      </Modal>
    </div>
  );
};

export default Orders;
