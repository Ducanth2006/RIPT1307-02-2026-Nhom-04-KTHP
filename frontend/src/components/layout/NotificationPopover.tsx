import { useState } from "react";
import { Popover, List, Typography, Button, Badge, Modal, Space, Empty, message } from "antd";
import { BellOutlined, CheckOutlined, ClockCircleOutlined, EyeOutlined } from "@ant-design/icons";
import { Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getNotificationsApi, readAllNotificationsApi, readNotificationApi } from "../../services/client/notification/apiClient";
import type { Notification as NotificationType } from "../../services/client/notification/typing";

const { Text, Title } = Typography;

interface NotificationPopoverProps {
  children: React.ReactNode;
}

const NotificationPopover = ({ children }: NotificationPopoverProps) => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  
  const userStr = localStorage.getItem("user");
  const userObj = userStr ? JSON.parse(userStr) : null;
  const userId = userObj?.id;

  const [visible, setVisible] = useState(false);
  const [selectedNotif, setSelectedNotif] = useState<NotificationType.INotificationItem | null>(null);

  // Fetch notifications (only if user is logged in)
  const { data, refetch } = useQuery({
    queryKey: ["notifications", userId],
    queryFn: () => getNotificationsApi(userId!, 1, 5).then((res) => res.data),
    enabled: !!userId,
    refetchInterval: 30000, // Auto-refetch every 30s
  });

  const rawNotifications = data?.data || [];
  const notifications = rawNotifications.filter((item: any) => {
    const adminTitles = ["Đơn hàng mới chờ duyệt", "Yêu cầu hủy đơn hàng mới", "Có khiếu nại mới cần xử lý"];
    return !adminTitles.includes(item.title);
  });
  const unreadCount = notifications.filter((n: any) => !n.is_read).length;

  // Mutation: Mark all as read
  const readAllMutation = useMutation({
    mutationFn: () => readAllNotificationsApi(userId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications", userId] });
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
    },
  });

  const handleMarkAllRead = (e: React.MouseEvent) => {
    e.stopPropagation();
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
    if (item.reference_type === "order" && item.reference_id) {
      setVisible(false);
      setSelectedNotif(null);
      const userStr = localStorage.getItem("user");
      const userObj = userStr ? JSON.parse(userStr) : null;
      const isAdmin = userObj?.role === "Admin";
      if (isAdmin) {
        navigate(`/admin/orders?openOrderId=${item.reference_id}`);
      } else {
        navigate(`/orders?openOrderId=${item.reference_id}`);
      }
    } else if (item.reference_type === "complaint") {
      setVisible(false);
      setSelectedNotif(null);
      navigate("/profile");
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

  const popoverContent = (
    <div style={{ width: 380, display: "flex", flexDirection: "column" }}>
      {/* Popover Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "10px 12px",
          borderBottom: "1px solid #f0f0f0",
          backgroundColor: "#fafafa",
        }}
      >
        <Text strong style={{ fontSize: 14, color: "#666" }}>
          Thông báo mới nhận
        </Text>
        {unreadCount > 0 && (
          <Button
            type="link"
            size="small"
            onClick={handleMarkAllRead}
            loading={readAllMutation.isPending}
            style={{ padding: 0, fontSize: 13, color: "#af101a" }}
          >
            Đánh dấu đã đọc tất cả
          </Button>
        )}
      </div>

      {/* Popover Body List */}
      <div style={{ maxHeight: 360, overflowY: "auto" }}>
        {!userId ? (
          <div style={{ padding: "30px 12px", textAlign: "center" }}>
            <Empty description="Vui lòng đăng nhập để xem thông báo" />
          </div>
        ) : notifications.length === 0 ? (
          <div style={{ padding: "30px 12px", textAlign: "center" }}>
            <Empty description="Bạn chưa có thông báo nào" />
          </div>
        ) : (
          <List
            dataSource={notifications}
            renderItem={(item) => (
              <div
                className="notif-popover-item"
                onClick={() => handleItemClick(item)}
                style={{
                  padding: "12px",
                  borderBottom: "1px solid #f5f5f5",
                  cursor: "pointer",
                  backgroundColor: item.is_read ? "#ffffff" : "#fff5f2",
                  transition: "background-color 0.2s",
                  position: "relative",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <Text
                    strong={!item.is_read}
                    style={{
                      fontSize: 13.5,
                      color: item.is_read ? "#444" : "#111",
                      lineHeight: "1.4",
                      paddingRight: 18,
                    }}
                  >
                    {item.title}
                  </Text>
                  {!item.is_read && (
                    <span
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        backgroundColor: "#af101a",
                        display: "inline-block",
                        marginTop: 5,
                        flexShrink: 0,
                      }}
                    />
                  )}
                </div>
                <div
                  style={{
                    fontSize: 12.5,
                    color: "#777",
                    marginTop: 4,
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    lineHeight: "1.4",
                  }}
                >
                  {item.message}
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginTop: 8,
                  }}
                >
                  <span style={{ fontSize: 11, color: "#aaa", display: "flex", alignItems: "center", gap: 4 }}>
                    <ClockCircleOutlined /> {formatTime(item.created_at)}
                  </span>

                  {/* Actions on Hover / Item */}
                  <Space size={8}>
                    {!item.is_read && (
                      <Button
                        type="text"
                        size="small"
                        icon={<CheckOutlined style={{ fontSize: 11, color: "#222" }} />}
                        onClick={(e) => handleMarkItemRead(e, item.id)}
                        title="Đánh dấu đã đọc"
                        style={{ height: 22, width: 22, display: "flex", alignItems: "center", justifyContent: "center" }}
                      />
                    )}
                    <Button
                      type="text"
                      size="small"
                      icon={<EyeOutlined style={{ fontSize: 11, color: "#777" }} />}
                      title="Xem chi tiết"
                      style={{ height: 22, width: 22, display: "flex", alignItems: "center", justifyContent: "center" }}
                    />
                  </Space>
                </div>
              </div>
            )}
          />
        )}
      </div>

      {/* Popover Footer */}
      {userId && (
        <div
          style={{
            borderTop: "1px solid #f0f0f0",
            textAlign: "center",
            padding: "8px 0",
            backgroundColor: "#fafafa",
          }}
        >
          <Link
            to="/notifications"
            onClick={() => setVisible(false)}
            style={{ color: "#af101a", fontSize: 13, fontWeight: 500 }}
          >
            Xem tất cả thông báo
          </Link>
        </div>
      )}
    </div>
  );

  return (
    <>
      <Popover
        content={popoverContent}
        trigger={["hover", "click"]}
        open={visible}
        onOpenChange={setVisible}
        placement="bottomRight"
        arrow={{ pointAtCenter: true }}
        overlayInnerStyle={{ padding: 0 }}
      >
        <Badge count={unreadCount} size="small" offset={[-2, 6]} color="#af101a">
          {children}
        </Badge>
      </Popover>

      {/* Detail Modal */}
      <Modal
        title={
          <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <BellOutlined style={{ color: "#af101a" }} /> Chi tiết thông báo
          </span>
        }
        open={!!selectedNotif}
        onCancel={() => setSelectedNotif(null)}
        footer={[
          <Button key="close" onClick={() => setSelectedNotif(null)}>
            Đóng
          </Button>,
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
    </>
  );
};

export default NotificationPopover;
