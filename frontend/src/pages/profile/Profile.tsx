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
} from "antd";
import {
  UserOutlined,
  LockOutlined,
  UploadOutlined,
  EnvironmentOutlined,
  PlusOutlined,
  DeleteOutlined,
  EditOutlined,
} from "@ant-design/icons";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getProfile, updateProfile, changePassword } from "../../services/Profile/apiClient";
import {
  getAddresses,
  createAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
} from "../../services/Address/apiClient";
import type { IAddress, IUpdateAddressRequest } from "../../services/Address/typing";
import type { IProfile, IUpdateProfileRequest, IChangePasswordRequest } from "../../services/Profile/typing";
import type { RcFile } from "antd/es/upload";
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
          </Menu>
        </Sider>
        <Content className="profile-content">
          {activeTab === "profile" && <ProfileForm profile={profile} userId={userId} />}
          {activeTab === "addresses" && <AddressesList userId={userId} />}
          {activeTab === "password" && <PasswordForm userId={userId} />}
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
                style={{ backgroundColor: "#ee4d2d", border: "none" }}
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
              style={{ backgroundColor: "#ee4d2d", border: "none" }}
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
          style={{ backgroundColor: "#ee4d2d", border: "none" }}
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
                    <Tag color="red" style={{ borderColor: "#ee4d2d", color: "#ee4d2d", backgroundColor: "#fff5f2" }}>
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
              style={{ backgroundColor: "#ee4d2d", borderColor: "#ee4d2d" }}
            >
              Lưu lại
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Profile;
