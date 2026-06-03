import { useState, useEffect } from "react";
import {
  Layout,
  Menu,
  Form,
  Input,
  Button,
  Upload,
  message,
  Typography,
  Divider,
  Spin,
  Modal,
  Switch,
  Popconfirm,
  Tag,
  Empty,
  Select,
  Tooltip,
  Space,
} from "antd";
import {
  UserOutlined,
  LockOutlined,
  UploadOutlined,
  EnvironmentOutlined,
  PlusOutlined,
  DeleteOutlined,
  EditOutlined,
  MessageOutlined,
  EyeOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  SyncOutlined,
} from "@ant-design/icons";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getProfile, updateProfile, changePassword } from "../../services/client/profile/apiClient";
import {
  getAddresses,
  createAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
} from "../../services/client/address/apiClient";
import { getComplaints, getComplaintById, createComplaint } from "../../services/client/complaint/apiClient";
import type { IAddress, IUpdateAddressRequest } from "../../services/client/address/typing";
import type { IProfile, IUpdateProfileRequest, IChangePasswordRequest } from "../../services/client/profile/typing";
import type { IComplaint, ICreateComplaintRequest } from "../../services/client/complaint/typing";
import { getOrders } from "../../services/client/order/apiClient";
import type { RcFile } from "antd/es/upload";
import ImageCropUploader from "../../components/ImageCropUploader";
import "./Profile.less";

const { Sider, Content } = Layout;
const { Title, Text } = Typography;

const Profile = () => {
  const [activeTab, setActiveTab] = useState("profile");
  const userStr = localStorage.getItem("user");
  const userObj = userStr ? JSON.parse(userStr) : null;
  const userId = userObj?.id;

  const { data, isLoading } = useQuery({
    queryKey: ["profile", userId],
    queryFn: () => getProfile(userId!).then((res) => res.data),
    enabled: !!userId,
  });

  const profile = data?.data;

  if (isLoading) {
    return (
      <div style={{ textAlign: "center", padding: "100px" }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div style={{ textAlign: "center", padding: "100px" }}>
        <Text>Vui lòng đăng nhập để xem thông tin.</Text>
      </div>
    );
  }

  return (
    <div className="profile-container">
      <Layout className="profile-layout">
        <Sider width={250} className="profile-sider" theme="light">
          <div className="profile-user-info">
            <div className="profile-avatar-mini">
              {profile.avatar ? (
                <img src={profile.avatar} alt="avatar" />
              ) : (
                <div className="avatar-placeholder">{profile.full_name?.charAt(0) || "U"}</div>
              )}
            </div>
            <div className="profile-name-mini">
              <Text strong>{profile.full_name}</Text>
              <br />
              <Text type="secondary" style={{ fontSize: 12 }}>
                Sửa hồ sơ
              </Text>
            </div>
          </div>
          <Divider style={{ margin: "10px 0" }} />
          <Menu mode="inline" selectedKeys={[activeTab]} onClick={(e) => setActiveTab(e.key)} className="profile-menu">
            <Menu.Item key="profile" icon={<UserOutlined />}>
              Hồ Sơ Của Tôi
            </Menu.Item>
            <Menu.Item key="addresses" icon={<EnvironmentOutlined />}>
              Địa Chỉ Nhận Hàng
            </Menu.Item>
            <Menu.Item key="password" icon={<LockOutlined />}>
              Đổi Mật Khẩu
            </Menu.Item>
            <Menu.Item key="complaints" icon={<MessageOutlined />}>
              Phản Hồi & Khiếu Nại
            </Menu.Item>
          </Menu>
        </Sider>
        <Content className="profile-content">
          {activeTab === "profile" && <ProfileForm profile={profile} userId={userId} />}
          {activeTab === "addresses" && <AddressesList userId={userId} />}
          {activeTab === "password" && <PasswordForm userId={userId} />}
          {activeTab === "complaints" && <ComplaintsSection userId={userId} />}
        </Content>
      </Layout>
    </div>
  );
};

const ProfileForm = ({ profile, userId }: { profile: IProfile; userId: number }) => {
  const [form] = Form.useForm();
  const queryClient = useQueryClient();
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar);

  useEffect(() => {
    form.setFieldsValue({
      full_name: profile.full_name,
      email: profile.email,
    });
  }, [profile, form]);

  const updateMutation = useMutation({
    mutationFn: (data: IUpdateProfileRequest) => updateProfile(data),
    onSuccess: () => {
      message.success("Cập nhật hồ sơ thành công!");
      
      const updatedUser = {
        ...JSON.parse(localStorage.getItem("user") || "{}"),
        full_name: form.getFieldValue("full_name"),
        avatar: avatarUrl,
      };
      localStorage.setItem("user", JSON.stringify(updatedUser));
      window.dispatchEvent(new Event("userUpdated"));

      queryClient.invalidateQueries({ queryKey: ["profile", userId] });
    },
    onError: () => {
      message.error("Có lỗi xảy ra, vui lòng thử lại.");
    },
  });

  const onFinish = (values: { full_name: string }) => {
    updateMutation.mutate({
      userId,
      full_name: values.full_name,
      avatar: avatarUrl,
    });
  };

  const uploadProps = {
    showUploadList: false,
    beforeUpload: (file: RcFile) => {
      // Dummy upload, in real app you'd upload to a server/S3 and get the URL
      const reader = new FileReader();
      reader.onload = (e) => {
        setAvatarUrl(e.target?.result as string);
      };
      reader.readAsDataURL(file);
      return false; // Prevent auto upload
    },
  };

  return (
    <div className="profile-section">
      <div className="section-header">
        <Title level={4}>Hồ Sơ Của Tôi</Title>
        <Text type="secondary">Quản lý thông tin hồ sơ để bảo mật tài khoản</Text>
      </div>
      <Divider />
      <div className="profile-form-wrapper">
        <div className="profile-form-left">
          <Form form={form} layout="horizontal" onFinish={onFinish} labelCol={{ span: 6 }} wrapperCol={{ span: 18 }}>
            <Form.Item label="Tên đăng nhập" style={{ marginBottom: 16 }}>
              <Text strong>{profile.email.split("@")[0]}</Text>
            </Form.Item>
            <Form.Item label="Tên" name="full_name" rules={[{ required: true, message: "Vui lòng nhập tên!" }]}>
              <Input />
            </Form.Item>
            <Form.Item label="Email" name="email">
              <Input disabled />
            </Form.Item>
            <Form.Item wrapperCol={{ offset: 6, span: 18 }}>
              <Button
                type="primary"
                htmlType="submit"
                loading={updateMutation.isPending}
                style={{ backgroundColor: "#af101a", border: "none" }}
              >
                Lưu
              </Button>
            </Form.Item>
          </Form>
        </div>
        <div className="profile-form-right">
          <div className="avatar-uploader">
            <div className="avatar-preview">
              {avatarUrl ? (
                <img src={avatarUrl} alt="avatar" />
              ) : (
                <div className="avatar-placeholder">{profile.full_name?.charAt(0) || "U"}</div>
              )}
            </div>
            <Upload {...uploadProps}>
              <Button icon={<UploadOutlined />}>Chọn Ảnh</Button>
            </Upload>
            <div className="upload-hint">
              <Text type="secondary" style={{ fontSize: 12 }}>
                Dụng lượng file tối đa 1 MB
              </Text>
              <br />
              <Text type="secondary" style={{ fontSize: 12 }}>
                Định dạng: .JPEG, .PNG
              </Text>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const PasswordForm = ({ userId }: { userId: number }) => {
  const [form] = Form.useForm();
  const changePasswordMutation = useMutation({
    mutationFn: (data: IChangePasswordRequest) => changePassword(data),
    onSuccess: () => {
      message.success("Đổi mật khẩu thành công!");
      form.resetFields();
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { message?: string } } };
      message.error(err.response?.data?.message || "Đổi mật khẩu thất bại.");
    },
  });

  const onFinish = (values: { currentPassword?: string; newPassword?: string }) => {
    changePasswordMutation.mutate({
      userId,
      currentPassword: values.currentPassword,
      newPassword: values.newPassword,
    });
  };

  return (
    <div className="profile-section">
      <div className="section-header">
        <Title level={4}>Đổi Mật Khẩu</Title>
        <Text type="secondary">Để bảo mật tài khoản, vui lòng không chia sẻ mật khẩu cho người khác</Text>
      </div>
      <Divider />
      <div style={{ maxWidth: 500, padding: "20px 40px" }}>
        <Form form={form} layout="vertical" onFinish={onFinish}>
          <Form.Item
            label="Mật khẩu hiện tại"
            name="currentPassword"
            rules={[{ required: true, message: "Vui lòng nhập mật khẩu hiện tại!" }]}
          >
            <Input.Password />
          </Form.Item>
          <Form.Item
            label="Mật khẩu mới"
            name="newPassword"
            rules={[
              { required: true, message: "Vui lòng nhập mật khẩu mới!" },
              { min: 6, message: "Mật khẩu phải có ít nhất 6 ký tự!" },
            ]}
          >
            <Input.Password />
          </Form.Item>
          <Form.Item
            label="Xác nhận mật khẩu mới"
            name="confirmPassword"
            dependencies={["newPassword"]}
            rules={[
              { required: true, message: "Vui lòng xác nhận mật khẩu mới!" },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue("newPassword") === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error("Hai mật khẩu không khớp!"));
                },
              }),
            ]}
          >
            <Input.Password />
          </Form.Item>
          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={changePasswordMutation.isPending}
              style={{ backgroundColor: "#af101a", border: "none" }}
            >
              Xác nhận
            </Button>
          </Form.Item>
        </Form>
      </div>
    </div>
  );
};

const AddressesList = ({ userId }: { userId: number }) => {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<IAddress | null>(null);
  const [form] = Form.useForm<{
    recipient_name: string;
    phone: string;
    address_line: string;
    city: string;
    is_default: boolean;
  }>();

  // Lấy danh sách địa chỉ
  const { data, isLoading } = useQuery({
    queryKey: ["addresses", userId],
    queryFn: () => getAddresses(userId).then((res) => res.data),
    enabled: !!userId,
  });

  const addresses = data?.data || [];

  // Tạo địa chỉ mới
  const createMutation = useMutation({
    mutationFn: createAddress,
    onSuccess: () => {
      message.success("Thêm địa chỉ thành công!");
      queryClient.invalidateQueries({ queryKey: ["addresses", userId] });
      setIsModalOpen(false);
      form.resetFields();
    },
    onError: () => {
      message.error("Thêm địa chỉ thất bại, vui lòng thử lại.");
    },
  });

  // Cập nhật địa chỉ
  const updateMutation = useMutation({
    mutationFn: (args: { id: number; payload: IUpdateAddressRequest }) => updateAddress(args.id, args.payload),
    onSuccess: () => {
      message.success("Cập nhật địa chỉ thành công!");
      queryClient.invalidateQueries({ queryKey: ["addresses", userId] });
      setIsModalOpen(false);
      setEditingAddress(null);
      form.resetFields();
    },
    onError: () => {
      message.error("Cập nhật địa chỉ thất bại.");
    },
  });

  // Xóa địa chỉ
  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteAddress(id, userId),
    onSuccess: () => {
      message.success("Xóa địa chỉ thành công!");
      queryClient.invalidateQueries({ queryKey: ["addresses", userId] });
    },
    onError: () => {
      message.error("Không thể xóa địa chỉ này.");
    },
  });

  // Đặt mặc định
  const setDefaultMutation = useMutation({
    mutationFn: (id: number) => setDefaultAddress(id, userId),
    onSuccess: () => {
      message.success("Đặt địa chỉ mặc định thành công!");
      queryClient.invalidateQueries({ queryKey: ["addresses", userId] });
    },
    onError: () => {
      message.error("Đặt mặc định thất bại.");
    },
  });

  const handleOpenAdd = () => {
    setEditingAddress(null);
    form.resetFields();
    setIsModalOpen(true);
  };

  const handleOpenEdit = (addr: IAddress) => {
    setEditingAddress(addr);
    form.setFieldsValue({
      recipient_name: addr.recipient_name,
      phone: addr.phone,
      address_line: addr.address_line,
      city: addr.city,
      is_default: addr.is_default,
    });
    setIsModalOpen(true);
  };

  const onFinish = (values: {
    recipient_name: string;
    phone: string;
    address_line: string;
    city: string;
    is_default: boolean;
  }) => {
    const payload = {
      userId,
      recipient_name: values.recipient_name,
      phone: values.phone,
      address_line: values.address_line,
      city: values.city,
      is_default: !!values.is_default,
    };

    if (editingAddress) {
      updateMutation.mutate({ id: editingAddress.id, payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  return (
    <div className="profile-section">
      <div className="section-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <Title level={4}>Địa Chỉ Của Tôi</Title>
          <Text type="secondary">Quản lý địa chỉ nhận hàng để mua sắm thuận tiện hơn</Text>
        </div>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={handleOpenAdd}
          style={{ backgroundColor: "#af101a", border: "none" }}
        >
          Thêm địa chỉ mới
        </Button>
      </div>
      <Divider />

      {isLoading ? (
        <div style={{ textAlign: "center", padding: "40px" }}>
          <Spin />
        </div>
      ) : addresses.length === 0 ? (
        <Empty description="Bạn chưa lưu địa chỉ giao hàng nào." />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {addresses.map((addr) => (
            <div
              key={addr.id}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "20px",
                border: "1px solid #f0f0f0",
                borderRadius: 8,
                backgroundColor: addr.is_default ? "#fafafa" : "#fff",
                boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
              }}
            >
              <div style={{ flex: 1, paddingRight: 20 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
                  <Text strong style={{ fontSize: 16 }}>
                    {addr.recipient_name}
                  </Text>
                  <Divider type="vertical" />
                  <Text type="secondary">{addr.phone}</Text>
                  {addr.is_default && (
                    <Tag color="red" style={{ borderColor: "#af101a", color: "#af101a", backgroundColor: "#fff5f2" }}>
                      Mặc định
                    </Tag>
                  )}
                </div>
                <div style={{ color: "#555", fontSize: 14, marginBottom: 4 }}>{addr.address_line}</div>
                <div style={{ color: "#888", fontSize: 13 }}>{addr.city}</div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 12 }}>
                <div style={{ display: "flex", gap: 16 }}>
                  <Button type="text" icon={<EditOutlined />} onClick={() => handleOpenEdit(addr)}>
                    Sửa
                  </Button>
                  {!addr.is_default && (
                    <Popconfirm
                      title="Xác nhận xóa địa chỉ này?"
                      onConfirm={() => deleteMutation.mutate(addr.id)}
                      okText="Xóa"
                      cancelText="Hủy"
                    >
                      <Button type="text" danger icon={<DeleteOutlined />}>
                        Xóa
                      </Button>
                    </Popconfirm>
                  )}
                </div>
                {!addr.is_default && (
                  <Button size="small" onClick={() => setDefaultMutation.mutate(addr.id)}>
                    Thiết lập mặc định
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        title={editingAddress ? "Cập Nhật Địa Chỉ" : "Thêm Địa Chỉ Mới"}
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={onFinish}>
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
            <Button style={{ marginRight: 8 }} onClick={() => setIsModalOpen(false)}>
              Hủy
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              loading={createMutation.isPending || updateMutation.isPending}
              style={{ backgroundColor: "#af101a", borderColor: "#af101a" }}
            >
              Lưu lại
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

// ─── Complaints Section ───────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  New: { label: "Chờ xử lý", color: "blue", icon: <ClockCircleOutlined /> },
  "In Progress": { label: "Đã xác nhận", color: "orange", icon: <SyncOutlined spin /> },
  Resolved: { label: "Đã giải quyết", color: "green", icon: <CheckCircleOutlined /> },
  Closed: { label: "Đã đóng", color: "default", icon: <CloseCircleOutlined /> },
};

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount);

const formatDate = (dateStr: string) =>
  new Date(dateStr).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

const ComplaintsSection = ({ userId }: { userId: number }) => {
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState<IComplaint | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [createForm] = Form.useForm();
  const [uploadedImageUrls, setUploadedImageUrls] = useState<string[]>([]);

  // Lấy danh sách khiếu nại
  const { data: complaintsData, isLoading: complaintsLoading } = useQuery({
    queryKey: ["complaints", userId],
    queryFn: () => getComplaints(userId).then((res) => res.data),
    enabled: !!userId,
  });

  // Lấy đơn hàng để chọn khi tạo khiếu nại
  const { data: ordersData } = useQuery({
    queryKey: ["orders", userId],
    queryFn: () => getOrders(userId).then((res) => res.data),
    enabled: !!userId && isCreateOpen,
  });

  const complaints = complaintsData?.data || [];
  const orders = ordersData?.data || [];

  // Mutation tạo khiếu nại
  const createMutation = useMutation({
    mutationFn: (data: ICreateComplaintRequest) => createComplaint(data),
    onSuccess: () => {
      message.success("Gửi khiếu nại thành công!");
      queryClient.invalidateQueries({ queryKey: ["complaints", userId] });
      setIsCreateOpen(false);
      createForm.resetFields();
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { message?: string } } };
      message.error(err.response?.data?.message || "Gửi khiếu nại thất bại, vui lòng thử lại.");
    },
  });

  const handleViewDetail = async (complaint: IComplaint) => {
    setIsDetailOpen(true);
    setDetailLoading(true);
    try {
      const res = await getComplaintById(complaint.id, userId);
      setSelectedComplaint(res.data.data);
    } catch {
      message.error("Không thể tải chi tiết khiếu nại.");
      setIsDetailOpen(false);
    } finally {
      setDetailLoading(false);
    }
  };

  const onCreateFinish = (values: { orderId: number; subject: string; content: string }) => {
    createMutation.mutate({
      userId,
      orderId: values.orderId,
      subject: values.subject,
      content: values.content,
      images: uploadedImageUrls,
    });
  };

  return (
    <div className="profile-section">
      {/* Header */}
      <div
        className="section-header"
        style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}
      >
        <div>
          <Title level={4}>Phản Hồi & Khiếu Nại</Title>
          <Text type="secondary">Gửi khiếu nại hoặc phản hồi về đơn hàng, theo dõi trạng thái xử lý</Text>
        </div>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => setIsCreateOpen(true)}
          style={{ backgroundColor: "#af101a", border: "none" }}
        >
          Gửi Khiếu Nại Mới
        </Button>
      </div>
      <Divider />

      {/* Danh sách khiếu nại */}
      {complaintsLoading ? (
        <div style={{ textAlign: "center", padding: "60px" }}>
          <Spin size="large" />
        </div>
      ) : complaints.length === 0 ? (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={
            <span>
              Bạn chưa có khiếu nại nào.{" "}
              <Button type="link" style={{ padding: 0, color: "#af101a" }} onClick={() => setIsCreateOpen(true)}>
                Gửi khiếu nại ngay
              </Button>
            </span>
          }
        />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {complaints.map((c) => {
            const statusCfg = STATUS_CONFIG[c.status] || STATUS_CONFIG.New;
            return (
              <div
                key={c.id}
                style={{
                  border: "1px solid #f0f0f0",
                  borderRadius: 8,
                  padding: "20px 24px",
                  backgroundColor: "#fafafa",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  gap: 16,
                }}
              >
                {/* Thông tin chính */}
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                    <Text strong style={{ fontSize: 15 }}>
                      {c.subject}
                    </Text>
                    <Tag
                      color={statusCfg.color}
                      icon={statusCfg.icon}
                      style={{ borderRadius: 20, padding: "0 10px" }}
                    >
                      {statusCfg.label}
                    </Tag>
                  </div>

                  <Text type="secondary" style={{ fontSize: 13 }}>
                    Mã KN #{c.id} &bull; Đơn hàng #{c.order_id}
                    {c.orders && (
                      <> &bull; {formatCurrency(c.orders.final_amount)}</>
                    )}
                  </Text>
                  <br />
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    <ClockCircleOutlined style={{ marginRight: 4 }} />
                    {formatDate(c.created_at)}
                  </Text>

                  {/* Nội dung tóm tắt */}
                  <div
                    style={{
                      marginTop: 10,
                      padding: "10px 14px",
                      backgroundColor: "#fff",
                      borderRadius: 6,
                      border: "1px solid #e8e8e8",
                      fontSize: 13,
                      color: "#555",
                      maxHeight: 56,
                      overflow: "hidden",
                      position: "relative",
                    }}
                  >
                    {c.content}
                  </div>

                  {/* Phản hồi admin nếu có */}
                  {c.admin_response && (
                    <div
                      style={{
                        marginTop: 8,
                        padding: "10px 14px",
                        backgroundColor: "#f6ffed",
                        borderRadius: 6,
                        border: "1px solid #b7eb8f",
                        fontSize: 13,
                      }}
                    >
                      <Text type="success" strong style={{ fontSize: 12 }}>
                        Phản hồi từ Shop:
                      </Text>
                      <br />
                      <Text style={{ fontSize: 13, color: "#3a6b35" }}>{c.admin_response}</Text>
                    </div>
                  )}
                </div>

                {/* Nút thao tác */}
                <div style={{ flexShrink: 0, width: 100 }}>
                  <Tooltip title="Xem chi tiết đơn khiếu nại">
                    <Button
                      block
                      icon={<EyeOutlined />}
                      onClick={() => handleViewDetail(c)}
                    >
                      Xem
                    </Button>
                  </Tooltip>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: Gửi khiếu nại mới */}
      <Modal
        title={
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <MessageOutlined style={{ color: "#af101a" }} />
            <span>Gửi Khiếu Nại / Phản Hồi</span>
          </div>
        }
        open={isCreateOpen}
        onCancel={() => {
          setIsCreateOpen(false);
          createForm.resetFields();
          setUploadedImageUrls([]);
        }}
        footer={null}
        destroyOnClose
        width={600}
      >
        <Form form={createForm} layout="vertical" onFinish={onCreateFinish}>
          <Form.Item
            label="Đơn hàng liên quan"
            name="orderId"
            rules={[{ required: true, message: "Vui lòng chọn đơn hàng!" }]}
          >
            <Select
              placeholder="Chọn đơn hàng..."
              showSearch
              optionFilterProp="children"
              notFoundContent={
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description="Bạn chưa có đơn hàng nào."
                />
              }
            >
              {orders.map((o) => (
                <Select.Option key={o.id} value={o.id}>
                  Đơn #{o.id} — {formatCurrency((o as any).final_amount ?? (o as any).totalPrice ?? 0)} — {o.status}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            label="Tiêu đề"
            name="subject"
            rules={[
              { required: true, message: "Vui lòng nhập tiêu đề!" },
              { max: 200, message: "Tiêu đề không quá 200 ký tự." },
            ]}
          >
            <Input placeholder="Ví dụ: Sản phẩm bị lỗi, giao hàng sai..." />
          </Form.Item>

          <Form.Item
            label="Nội dung chi tiết"
            name="content"
            rules={[
              { required: true, message: "Vui lòng nhập nội dung!" },
              { min: 10, message: "Nội dung phải có ít nhất 10 ký tự." },
            ]}
          >
            <Input.TextArea
              rows={5}
              placeholder="Mô tả chi tiết vấn đề bạn gặp phải..."
              showCount
              maxLength={1000}
            />
          </Form.Item>

          <Form.Item label="Ảnh đính kèm (tuỳ chọn)">
            <ImageCropUploader
              userId={userId}
              maxImages={5}
              onChange={(urls) => setUploadedImageUrls(urls)}
            />
          </Form.Item>

          <Form.Item style={{ textAlign: "right", marginBottom: 0, marginTop: 8 }}>
            <Button
              style={{ marginRight: 8 }}
              onClick={() => {
                setIsCreateOpen(false);
                createForm.resetFields();
                setUploadedImageUrls([]);
              }}
            >
              Hủy
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              loading={createMutation.isPending}
              style={{ backgroundColor: "#af101a", borderColor: "#af101a" }}
            >
              Gửi Khiếu Nại
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      {/* Modal: Chi tiết khiếu nại */}
      <Modal
        title={
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <EyeOutlined style={{ color: "#af101a" }} />
            <span>Chi Tiết Khiếu Nại #{selectedComplaint?.id}</span>
          </div>
        }
        open={isDetailOpen}
        onCancel={() => {
          setIsDetailOpen(false);
          setSelectedComplaint(null);
        }}
        footer={
          <Button onClick={() => { setIsDetailOpen(false); setSelectedComplaint(null); }}>
            Đóng
          </Button>
        }
        width={640}
        destroyOnClose
      >
        {detailLoading ? (
          <div style={{ textAlign: "center", padding: "40px" }}>
            <Spin />
          </div>
        ) : selectedComplaint ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Trạng thái */}
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <Text strong>Trạng thái:</Text>
              {(() => {
                const s = STATUS_CONFIG[selectedComplaint.status] || STATUS_CONFIG.New;
                return (
                  <Tag color={s.color} icon={s.icon} style={{ borderRadius: 20, padding: "0 10px", fontSize: 13 }}>
                    {s.label}
                  </Tag>
                );
              })()}
            </div>

            {/* Đơn hàng */}
            {selectedComplaint.orders && (
              <div
                style={{
                  padding: "12px 16px",
                  backgroundColor: "#f8f8f8",
                  borderRadius: 8,
                  border: "1px solid #e8e8e8",
                }}
              >
                <Text type="secondary" style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: 0.5 }}>
                  Thông tin đơn hàng
                </Text>
                <div style={{ marginTop: 6 }}>
                  <Text>Đơn #{selectedComplaint.orders.id}</Text>
                  <span style={{ margin: "0 8px", color: "#ccc" }}>|</span>
                  <Text>{formatCurrency(selectedComplaint.orders.final_amount)}</Text>
                  <span style={{ margin: "0 8px", color: "#ccc" }}>|</span>
                  <Tag>{selectedComplaint.orders.status}</Tag>
                </div>
              </div>
            )}

            {/* Tiêu đề */}
            <div>
              <Text type="secondary" style={{ fontSize: 12 }}>Tiêu đề</Text>
              <div style={{ fontWeight: 600, fontSize: 15, marginTop: 4 }}>{selectedComplaint.subject}</div>
            </div>

            {/* Nội dung */}
            <div>
              <Text type="secondary" style={{ fontSize: 12 }}>Nội dung khiếu nại</Text>
              <div
                style={{
                  marginTop: 6,
                  padding: "12px 16px",
                  backgroundColor: "#fff",
                  borderRadius: 6,
                  border: "1px solid #e8e8e8",
                  fontSize: 14,
                  color: "#333",
                  lineHeight: 1.7,
                  whiteSpace: "pre-wrap",
                }}
              >
                {selectedComplaint.content}
              </div>
            </div>

            {/* Ảnh đính kèm */}
            {selectedComplaint.images && selectedComplaint.images.length > 0 && (
              <div>
                <Text type="secondary" style={{ fontSize: 12 }}>Ảnh đính kèm</Text>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 8 }}>
                  {selectedComplaint.images.map((url, idx) => (
                    <a key={idx} href={url} target="_blank" rel="noopener noreferrer">
                      <img
                        src={url}
                        alt={`Ảnh ${idx + 1}`}
                        style={{
                          width: 90,
                          height: 90,
                          objectFit: "cover",
                          borderRadius: 6,
                          border: "1px solid #e8e8e8",
                          cursor: "pointer",
                          transition: "transform 0.2s",
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.05)")}
                        onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
                      />
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Phản hồi admin */}
            {selectedComplaint.admin_response ? (
              <div>
                <Text type="secondary" style={{ fontSize: 12 }}>Phản hồi từ Shop</Text>
                <div
                  style={{
                    marginTop: 6,
                    padding: "12px 16px",
                    backgroundColor: "#f6ffed",
                    borderRadius: 6,
                    border: "1px solid #b7eb8f",
                    fontSize: 14,
                    color: "#3a6b35",
                    lineHeight: 1.7,
                    whiteSpace: "pre-wrap",
                  }}
                >
                  {selectedComplaint.admin_response}
                </div>
              </div>
            ) : (
              <div
                style={{
                  padding: "12px 16px",
                  backgroundColor: "#fffbe6",
                  borderRadius: 6,
                  border: "1px solid #ffe58f",
                  fontSize: 13,
                  color: "#8c6d1f",
                }}
              >
                <ClockCircleOutlined style={{ marginRight: 6 }} />
                Khiếu nại đang chờ xử lý. Chúng tôi sẽ phản hồi sớm nhất có thể.
              </div>
            )}

            {/* Thời gian gửi */}
            <Text type="secondary" style={{ fontSize: 12 }}>
              <ClockCircleOutlined style={{ marginRight: 4 }} />
              Gửi lúc: {formatDate(selectedComplaint.created_at)}
            </Text>
          </div>
        ) : null}
      </Modal>
    </div>
  );
};

export default Profile;
