import { useState, useEffect } from "react";
import { List, Typography, Button, Space, Modal, Card, Pagination, Empty, Breadcrumb, message, Spin } from "antd";
import { BellOutlined, CheckOutlined, ClockCircleOutlined, EyeOutlined, HomeOutlined } from "@ant-design/icons";
import { Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getNotificationsApi, readAllNotificationsApi, readNotificationApi } from "../../services/Notification/apiClient";
import type { Notification as NotificationType } from "../../services/Notification/typing";

const { Text, Title, Paragraph } = Typography;

const Notifications = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const userStr = localStorage.getItem("user");
  const userObj = userStr ? JSON.parse(userStr) : null;
  const userId = userObj?.id;

  const [page, setPage] = useState(1);
  const limit = 10;
  const [selectedNotif, setSelectedNotif] = useState<NotificationType.INotificationItem | null>(null);

  // Redirect if not logged in
  useEffect(() => {
    if (!userId) {
      message.warning("Vui lòng đăng nhập để xem thông báo");
      navigate("/login");
    }
  }, [userId, navigate]);

  // Fetch notifications
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["notifications-page", userId, page],
    queryFn: () => getNotificationsApi(userId!, page, limit).then((res) => res.data),
    enabled: !!userId,
  });

  const rawNotifications = data?.data || [];
  const notifications = rawNotifications.filter((item: any) => {
    const adminTitles = ["Đơn hàng mới chờ duyệt", "Yêu cầu hủy đơn hàng mới"];
    return !adminTitles.includes(item.title);
  });
  const total = notifications.length;
  const unreadCount = notifications.filter((n: any) => !n.is_read).length;

  // Mutation: Mark all as read
  const readAllMutation = useMutation({
    mutationFn: () => readAllNotificationsApi(userId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications", userId] });
      queryClient.invalidateQueries({ queryKey: ["notifications-page", userId] });
      message.success("Đã đánh dấu đọc tất cả thông báo");
    },
    onError: () => {
      message.error("Lỗi khi cập nhật trạng thái");
    },
  });

  // Mutation: Mark single notification as read
  const readSingleMutation = useMutation({
    mutationFn: (id: number) => readNotificationApi(id, userId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications", userId] });
      queryClient.invalidateQueries({ queryKey: ["notifications-page", userId] });
    },
  });

  const handleMarkAllRead = () => {
    if (!userId || readAllMutation.isPending) return;
    readAllMutation.mutate();
  };

  const handleMarkItemRead = (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    if (!userId || readSingleMutation.isPending) return;
    readSingleMutation.mutate(id);
  };

  const handleItemClick = (item: NotificationType.INotificationItem) => {
    setSelectedNotif(item);
    if (!item.is_read) {
      readSingleMutation.mutate(item.id);
    }
  };

  const formatTime = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return `${d.getDate().toString().padStart(2, "0")}/${(d.getMonth() + 1)
        .toString()
        .padStart(2, "0")}/${d.getFullYear()} ${d.getHours().toString().padStart(2, "0")}:${d
          .getMinutes()
          .toString()
          .padStart(2, "0")}`;
    } catch {
      return dateStr;
    }
  };

  if (!userId) return null;

  return (
    <div style={{ backgroundColor: "#f5f5f5", minHeight: "80vh", padding: "24px 0" }}>
      <div style={{ maxWidth: 1000, margin: "0 auto", padding: "0 16px" }}>

        {/* Breadcrumb */}
        <Breadcrumb style={{ marginBottom: 16 }}>
          <Breadcrumb.Item>
            <Link to="/">
              <HomeOutlined /> Trang chủ
            </Link>
          </Breadcrumb.Item>
          <Breadcrumb.Item>Thông báo của tôi</Breadcrumb.Item>
        </Breadcrumb>

        <Card
          title={
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
              <span style={{ fontSize: 20, fontWeight: 500, display: "flex", alignItems: "center", gap: 8 }}>
                <BellOutlined style={{ color: "#af101a" }} /> Thông báo của tôi {unreadCount > 0 && `(${unreadCount} chưa đọc)`}
              </span>
              {unreadCount > 0 && (
                <Button
                  type="primary"
                  onClick={handleMarkAllRead}
                  loading={readAllMutation.isPending}
                  style={{ backgroundColor: "#af101a", borderColor: "#af101a" }}
                >
                  Đánh dấu đọc tất cả
                </Button>
              )}
            </div>
          }
          style={{ borderRadius: 8, boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}
        >
          {isLoading ? (
            <div style={{ textAlign: "center", padding: "60px 0" }}>
              <Spin size="large" />
            </div>
          ) : notifications.length === 0 ? (
            <div style={{ padding: "60px 0" }}>
              <Empty description="Bạn chưa có thông báo nào" />
            </div>
          ) : (
            <div>
              <List
                itemLayout="horizontal"
                dataSource={notifications}
                renderItem={(item) => (
                  <List.Item
                    onClick={() => handleItemClick(item)}
                    style={{
                      cursor: "pointer",
                      padding: "20px 24px",
                      backgroundColor: item.is_read ? "#ffffff" : "#fffcfb",
                      borderBottom: "1px solid #f0f0f0",
                      transition: "all 0.2s",
                      borderRadius: 4,
                      marginBottom: 8,
                      borderLeft: item.is_read ? "4px solid transparent" : "4px solid #af101a",
                    }}
                    actions={[
                      <Space key="actions" onClick={(e) => e.stopPropagation()}>
                        {!item.is_read && (
                          <Button
                            type="text"
                            icon={<CheckOutlined style={{ color: "#52c41a" }} />}
                            onClick={(e) => handleMarkItemRead(e, item.id)}
                            title="Đánh dấu đã đọc"
                          >
                            Đã đọc
                          </Button>
                        )}
                        <Button
                          type="text"
                          icon={<EyeOutlined style={{ color: "#888" }} />}
                          onClick={() => handleItemClick(item)}
                        >
                          Xem chi tiết
                        </Button>
                      </Space>
                    ]}
                  >
                    <List.Item.Meta
                      title={
                        <Space style={{ width: "100%", justifyContent: "space-between" }}>
                          <Text strong={!item.is_read} style={{ fontSize: 15, color: item.is_read ? "#333" : "#000" }}>
                            {item.title}
                          </Text>
                        </Space>
                      }
                      description={
                        <div style={{ marginTop: 6 }}>
                          <Paragraph
                            ellipsis={{ rows: 2 }}
                            style={{ color: "#666", fontSize: 13.5, marginBottom: 8, lineHeight: 1.5 }}
                          >
                            {item.message}
                          </Paragraph>
                          <span style={{ fontSize: 12, color: "#aaa", display: "flex", alignItems: "center", gap: 6 }}>
                            <ClockCircleOutlined /> {formatTime(item.created_at)}
                          </span>
                        </div>
                      }
                    />
                  </List.Item>
                )}
              />

              {/* Pagination */}
              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 24 }}>
                <Pagination
                  current={page}
                  pageSize={limit}
                  total={total}
                  onChange={(p) => setPage(p)}
                  showSizeChanger={false}
                />
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* Details Modal */}
      <Modal
        title={
          <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <BellOutlined style={{ color: "#af101a" }} /> Chi tiết thông báo
          </span>
        }
        open={!!selectedNotif}
        onCancel={() => setSelectedNotif(null)}
        footer={[
          <Button key="close" type="primary" onClick={() => setSelectedNotif(null)} style={{ backgroundColor: "#af101a", borderColor: "#af101a" }}>
            Đóng
          </Button>
        ]}
        destroyOnClose
      >
        {selectedNotif && (
          <div style={{ padding: "12px 0" }}>
            <Title level={4} style={{ marginTop: 0, marginBottom: 8, fontSize: 18 }}>
              {selectedNotif.title}
            </Title>
            <div style={{ fontSize: 12, color: "#bbb", marginBottom: 16, display: "flex", alignItems: "center", gap: 4 }}>
              <ClockCircleOutlined /> {formatTime(selectedNotif.created_at)}
            </div>
            <div
              style={{
                fontSize: 14.5,
                color: "#333",
                lineHeight: "1.6",
                whiteSpace: "pre-wrap",
                backgroundColor: "#f9f9f9",
                padding: 16,
                borderRadius: 8,
                border: "1px solid #f0f0f0",
              }}
            >
              {selectedNotif.message}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Notifications;
