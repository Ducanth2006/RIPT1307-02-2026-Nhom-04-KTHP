import React, {
  useState,
  useMemo,
  useEffect
} from 'react';

import dayjs from 'dayjs';

import {
  Table,
  Button,
  Input,
  Select,
  Switch,
  Avatar,
  message,
  Tag,
  Space,
  Modal,
  Form,
  Tooltip,
  Popconfirm,
  DatePicker
} from 'antd';

import {
  Download,
  UserPlus,
  Users,
  Lock,
  Edit,
  Shield,
  Search,
  Key
} from 'lucide-react';

import type { ColumnsType } from 'antd/es/table';

import {
  getAdminUsers,
  createAdminUser,
  updateAdminUser,
  toggleAdminUserLock,
  revokeAdminUserTokens
} from '../../services/adminUserService';

const { RangePicker } =
  DatePicker;

interface User {
  id: string;
  name: string;
  email: string;
  username?: string;
  phone?: string;
  role:
    | 'Admin'
    | 'Staff'
    | 'Customer';
  status:
    | 'Active'
    | 'Locked';
  lastLogin: string;
  createdAt: string;
}

export default function UsersPage() {
  const [users, setUsers] =
    useState<User[]>([]);

  const [loading, setLoading] =
    useState(false);

  const [searchText, setSearchText] =
    useState('');

  const [roleFilter, setRoleFilter] =
    useState<
      | 'All'
      | 'Admin'
      | 'Staff'
      | 'Customer'
    >('All');

  // FILTER DATE
  const [
    createdDateFilter,
    setCreatedDateFilter
  ] = useState<any>(null);

  // PAGINATION
  const [currentPage, setCurrentPage] =
    useState(1);

  const itemsPerPage = 20;

  // MODAL
  const [isModalOpen, setIsModalOpen] =
    useState(false);

  const [editingUser, setEditingUser] =
    useState<User | null>(
      null
    );

  const [saving, setSaving] =
    useState(false);

  const [form] = Form.useForm();

  // =========================
  // LOAD USERS
  // =========================

  const loadUsers = async () => {
    try {
      setLoading(true);

      const res =
        await getAdminUsers();

      setUsers(res.data || []);
    } catch (err: any) {
      message.error(
        'Không thể tải danh sách tài khoản: ' +
          (err.response?.data
            ?.message ||
            err.message)
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  // =========================
  // FILTER USERS
  // =========================

  const filteredUsers =
    useMemo(() => {
      return users.filter(
        (item) => {
          // ROLE
          let matchRole = true;

          if (
            roleFilter !== 'All'
          ) {
            matchRole =
              item.role ===
              roleFilter;
          }

          // SEARCH
          let matchSearch = true;

          if (searchText) {
            const lowerSearch =
              searchText.toLowerCase();

            const matchSearch =
              item.name
                .toLowerCase()
                .includes(
                  lowerSearch
                ) ||
              item.email
                .toLowerCase()
                .includes(
                  lowerSearch
                ) ||
              item.username
                ?.toLowerCase()
                .includes(
                  lowerSearch
                ) ||
              item.phone
                ?.toLowerCase()
                .includes(
                  lowerSearch
                );
          }

          // DATE
          let matchDate = true;

          if (
            createdDateFilter &&
            createdDateFilter.length ===
              2
          ) {
            const startDate =
              createdDateFilter[0].startOf(
                'day'
              );

            const endDate =
              createdDateFilter[1].endOf(
                'day'
              );

            const createdAt =
              dayjs(
                item.createdAt
              );

            matchDate =
              createdAt.isAfter(
                startDate
              ) &&
              createdAt.isBefore(
                endDate
              );
          }

          return (
            matchRole &&
            matchSearch &&
            matchDate
          );
        }
      );
    }, [
      users,
      roleFilter,
      searchText,
      createdDateFilter
    ]);

  // =========================
  // EXPORT CSV
  // =========================

  const handleExport = () => {
    try {
      const headers = [
        'Mã tài khoản',
        'Họ tên',
        'Email',
        'Username',
        'Số điện thoại',
        'Vai trò',
        'Trạng thái',
        'Ngày tạo'
      ];

      const dataRows =
        filteredUsers.map(
          (u) => [
            u.id,
            u.name,
            u.email,
            u.username || '',
            u.phone || '',
            u.role === 'Admin'
              ? 'Quản trị viên'
              : u.role ===
                'Staff'
              ? 'Nhân viên'
              : 'Khách hàng',
            u.status ===
            'Active'
              ? 'Đang hoạt động'
              : 'Đã khóa',
            u.createdAt
          ]
        );

      const BOM = '\uFEFF';

      const csvContent =
        BOM +
        [
          headers.join(','),
          ...dataRows.map(
            (row) =>
              row
                .map(
                  (cell) =>
                    `"${String(
                      cell
                    ).replace(
                      /"/g,
                      '""'
                    )}"`
                )
                .join(',')
          )
        ].join('\n');

      const blob = new Blob(
        [csvContent],
        {
          type: 'text/csv;charset=utf-8;'
        }
      );

      const url =
        URL.createObjectURL(
          blob
        );

      const link =
        document.createElement(
          'a'
        );

      link.setAttribute(
        'href',
        url
      );

      link.setAttribute(
        'download',
        `Danh_Sach_Nguoi_Dung_${
          new Date()
            .toISOString()
            .split('T')[0]
        }.csv`
      );

      document.body.appendChild(
        link
      );

      link.click();

      document.body.removeChild(
        link
      );

      message.success(
        'Xuất danh sách người dùng thành công!'
      );
    } catch {
      message.error(
        'Xuất danh sách thất bại'
      );
    }
  };

  // =========================
  // LOCK USER
  // =========================

  const handleToggleLock =
    async (
      checked: boolean,
      record: User
    ) => {
      const isLocked =
        !checked;

      try {
        await toggleAdminUserLock(
          record.id,
          isLocked
        );

        setUsers((prev) =>
          prev.map((u) => {
            if (
              u.id ===
              record.id
            ) {
              return {
                ...u,
                status: checked
                  ? 'Active'
                  : 'Locked'
              };
            }

            return u;
          })
        );

        if (isLocked) {
          message.warning(
            `Tài khoản ${record.email} đã bị khóa`
          );
        } else {
          message.success(
            `Đã mở khóa tài khoản ${record.email}`
          );
        }
      } catch (err: any) {
        message.error(
          'Không thể thay đổi trạng thái tài khoản: ' +
            (err.response?.data
              ?.message ||
              err.message)
        );
      }
    };

  // =========================
  // SHOW MODAL
  // =========================

  const showModal = (
    user?: User
  ) => {
    if (user) {
      setEditingUser(user);

      form.setFieldsValue({
        name: user.name,
        email: user.email,
        username:
          user.username || '',
        phone:
          user.phone || '',
        role: user.role,
        newPassword: ''
      });
    } else {
      setEditingUser(null);

      form.resetFields();
    }

    setIsModalOpen(true);
  };

  // =========================
  // CLOSE MODAL
  // =========================

  const closeModal = () => {
    setIsModalOpen(false);

    setEditingUser(null);

    form.resetFields();
  };

  // =========================
  // SAVE USER
  // =========================

  const handleModalSave =
    async () => {
      try {
        const values =
          await form.validateFields();

        setSaving(true);

        // UPDATE
        if (editingUser) {
          const payload: any = {
            name: values.name,
            email: values.email,
            username:
              values.username,
            phone:
              values.phone,
            role: values.role
          };

          if (
            values.newPassword &&
            values.newPassword.trim()
          ) {
            payload.password =
              values.newPassword;
          }

          const res =
            await updateAdminUser(
              editingUser.id,
              payload
            );

          message.success(
            res.message ||
              'Cập nhật thông tin tài khoản thành công!'
          );

          await loadUsers();

          closeModal();
        }

        // CREATE
        else {
          const payload = {
            name: values.name,
            email: values.email,
            username:
              values.username,
            phone:
              values.phone,
            password:
              values.password,
            role: values.role
          };

          const res =
            await createAdminUser(
              payload
            );

          message.success(
            res.message ||
              'Tạo tài khoản mới thành công!'
          );

          await loadUsers();

          closeModal();
        }
      } catch (err: any) {
        if (err.errorFields) {
          return;
        }

        const backendMessage =
          err.response?.data
            ?.message;

        message.error(
          backendMessage ||
            'Lưu thông tin tài khoản thất bại'
        );
      } finally {
        setSaving(false);
      }
    };

  // =========================
  // REVOKE TOKENS
  // =========================

  const handleRevokeTokens =
    async (
      userId: string,
      userName?: string
    ) => {
      try {
        const res =
          await revokeAdminUserTokens(
            userId
          );

        message.success(
          res.message ||
            `Đã thu hồi phiên đăng nhập thành công! ${
              userName || ''
            } sẽ bị đăng xuất ngay lập tức.`
        );
      } catch (err: any) {
        message.error(
          err.response?.data
            ?.message ||
            'Không thể thu hồi phiên đăng nhập.'
        );
      }
    };

  // =========================
  // TABLE COLUMNS
  // =========================

  const columns: ColumnsType<User> =
    [
      {
        title: 'Họ và tên',

        dataIndex: 'name',

        render: (
          _,
          record
        ) => (
          <div className="flex items-center gap-3">
            <Avatar
              className={
                record.role ===
                'Admin'
                  ? 'bg-[#d32f2f]/20 text-[#d32f2f]'
                  : 'bg-[#e0e3e5] text-[#5b403d]'
              }
            >
              {record.name
                .charAt(0)
                .toUpperCase()}
            </Avatar>

            <div>
              <div className="text-sm font-medium text-[#191c1e]">
                {
                  record.name
                }
              </div>

              <div className="text-xs text-gray-500">
                {
                  record.email
                }
              </div>
            </div>
          </div>
        )
      },

      {
        title: 'Vai trò',

        dataIndex: 'role',

        render: (
          val: string
        ) => {
          let color =
            'default';

          let label = val;

          if (
            val === 'Admin'
          ) {
            color =
              'magenta';

            label =
              'Quản trị viên';
          } else if (
            val === 'Staff'
          ) {
            color = 'blue';

            label =
              'Nhân viên';
          } else if (
            val ===
            'Customer'
          ) {
            color =
              'green';

            label =
              'Khách hàng';
          }

          return (
            <Tag color={color}>
              {label}
            </Tag>
          );
        }
      },

      {
        title:
          'Ngày tạo tài khoản',

        dataIndex:
          'createdAt',

        render: (
          val: string
        ) =>
          dayjs(val).format(
            'DD/MM/YYYY HH:mm'
          )
      },

      {
        title:
          'Trạng thái hoạt động',

        dataIndex:
          'status',

        render: (
          val: string,
          record
        ) => (
          <div className="flex items-center gap-2">
            <Switch
              size="small"
              checked={
                val ===
                'Active'
              }
              onChange={(
                checked
              ) =>
                handleToggleLock(
                  checked,
                  record
                )
              }
            />

            <span
              className={`text-sm ${
                val ===
                'Locked'
                  ? 'text-red-500 font-medium'
                  : 'text-green-600'
              }`}
            >
              {val ===
              'Active'
                ? 'Đang hoạt động'
                : 'Đã khóa'}
            </span>
          </div>
        )
      },

      {
        title: 'Thao tác',

        key: 'action',

        align: 'right',

        render: (
          _,
          record
        ) => (
          <Space size="middle">
            {/* EDIT */}
            <Tooltip title="Chỉnh sửa thông tin">
              <Button
                type="text"
                icon={
                  <Edit
                    size={16}
                  />
                }
                onClick={() =>
                  showModal(
                    record
                  )
                }
                className="text-[#00799c] hover:bg-blue-50"
              />
            </Tooltip>

            {/* REVOKE */}
            <Tooltip title="Thu hồi đăng nhập">
              <Popconfirm
                title="Bạn có chắc chắn muốn đăng xuất thiết bị của người dùng này?"
                description="Phiên làm việc của họ sẽ bị thu hồi ngay lập tức."
                okText="Đồng ý"
                cancelText="Hủy"
                okButtonProps={{
                  danger: true
                }}
                onConfirm={() =>
                  handleRevokeTokens(
                    record.id,
                    record.name
                  )
                }
              >
                <Button
                  type="text"
                  danger
                  icon={
                    <Key
                      size={16}
                    />
                  }
                  className="hover:bg-red-50"
                />
              </Popconfirm>
            </Tooltip>
          </Space>
        )
      }
    ];

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-[1600px] mx-auto">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-[#191c1e]">
            Quản Lý Người Dùng
          </h1>

          <p className="text-[#5b403d] mt-1 text-sm">
            Quản lý tài khoản,
            phân quyền và trạng thái hoạt động.
          </p>
        </div>

        <div className="flex gap-3">
          <Button
            icon={
              <Download
                size={18}
              />
            }
            onClick={
              handleExport
            }
          >
            Xuất báo cáo
          </Button>

          <Button
            type="primary"
            icon={
              <UserPlus
                size={18}
              />
            }
            className="bg-[#af101a] hover:bg-[#930010]"
            onClick={() =>
              showModal()
            }
          >
            Thêm tài khoản mới
          </Button>
        </div>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          {
            label:
              'Tổng số tài khoản',
            val: users.length,
            sub: 'Toàn bộ hệ thống',
            icon: Users,
            color:
              'text-[#af101a]',
            bg: 'bg-[#ffdad6]/50'
          },

          {
            label:
              'Nhân viên & Quản trị',

            val: users.filter(
              (u) =>
                u.role ===
                  'Admin' ||
                u.role ===
                  'Staff'
            ).length,

            sub: 'Có quyền quản trị',

            icon: Shield,

            color:
              'text-[#00799c]',

            bg: 'bg-[#e0f2fe]'
          },

          {
            label:
              'Tài khoản bị khóa',

            val: users.filter(
              (u) =>
                u.status ===
                'Locked'
            ).length,

            sub: 'Cần kiểm tra',

            icon: Lock,

            color:
              'text-red-600',

            bg: 'bg-red-50'
          }
        ].map((s, i) => (
          <div
            key={i}
            className="bg-white border border-[#d8dadc] rounded-xl p-5 shadow-sm"
          >
            <div className="flex justify-between items-start mb-2">
              <span className="text-sm font-medium text-[#5b403d]">
                {s.label}
              </span>

              <div
                className={`p-2 rounded-lg ${s.bg} ${s.color}`}
              >
                <s.icon
                  size={20}
                />
              </div>
            </div>

            <div className="text-3xl font-bold text-[#191c1e]">
              {s.val}
            </div>

            <div className="text-xs mt-1 text-gray-500">
              {s.sub}
            </div>
          </div>
        ))}
      </div>

      {/* TABLE */}
      <div className="bg-white border border-[#d8dadc] rounded-xl shadow-sm flex flex-col">
        <div className="p-4 border-b border-[#eceef0] flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          {/* FILTER */}
          <div className="flex flex-col sm:flex-row gap-3 w-full">
            {/* ROLE FILTER */}
            <Select
              value={
                roleFilter
              }
              onChange={
                setRoleFilter
              }
              className="w-full sm:w-56 rounded-lg"
              options={[
                {
                  value:
                    'All',
                  label:
                    'Tất cả vai trò'
                },

                {
                  value:
                    'Admin',
                  label:
                    'Quản trị viên'
                },

                {
                  value:
                    'Staff',
                  label:
                    'Nhân viên'
                },

                {
                  value:
                    'Customer',
                  label:
                    'Khách hàng'
                }
              ]}
            />

            {/* DATE FILTER */}
            <RangePicker
              format="DD/MM/YYYY"
              placeholder={[
                'Từ ngày',
                'Đến ngày'
              ]}
              value={
                createdDateFilter
              }
              onChange={(
                dates
              ) =>
                setCreatedDateFilter(
                  dates
                )
              }
              className="w-full sm:w-80"
              allowClear
            />
          </div>

          {/* SEARCH */}
          <Input
            prefix={
              <Search
                size={16}
                className="text-gray-400"
              />
            }
            placeholder="Tìm kiếm theo họ tên, email, username..."
            className="w-full lg:w-72 rounded-lg"
            value={
              searchText
            }
            onChange={(
              e
            ) =>
              setSearchText(
                e.target.value
              )
            }
            allowClear
          />
        </div>

        <Table
          columns={
            columns
          }
          dataSource={
            filteredUsers
          }
          rowKey="id"
          loading={
            loading
          }
          pagination={{
            current:
              currentPage,

            pageSize:
              itemsPerPage,

            onChange: (
              page
            ) =>
              setCurrentPage(
                page
              ),

            showSizeChanger:
              true
          }}
          scroll={{
            x: 'max-content'
          }}
        />
      </div>

      {/* MODAL */}
      <Modal
        title={
          editingUser
            ? 'Chỉnh sửa thông tin tài khoản'
            : 'Thêm tài khoản mới'
        }
        open={
          isModalOpen
        }
        onOk={
          handleModalSave
        }
        onCancel={
          closeModal
        }
        okText="Lưu thông tin"
        cancelText="Hủy bỏ"
        confirmLoading={
          saving
        }
        okButtonProps={{
          className:
            'bg-[#af101a] hover:bg-[#930010]'
        }}
        width={650}
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          className="mt-5"
        >
          {/* NAME */}
          <Form.Item
            name="name"
            label="Họ và tên hiển thị"
            rules={[
              {
                required:
                  true,
                message:
                  'Vui lòng nhập họ và tên hiển thị'
              }
            ]}
          >
            <Input placeholder="Nguyễn Văn A" />
          </Form.Item>

          {/* EMAIL */}
          <Form.Item
            name="email"
            label="Địa chỉ Email"
            rules={[
              {
                required:
                  true,
                message:
                  'Vui lòng nhập email'
              },

              {
                type: 'email',
                message:
                  'Email không đúng định dạng'
              }
            ]}
          >
            <Input
              placeholder="example@email.com"
              disabled={
                !!editingUser &&
                editingUser.role ===
                  'Admin'
              }
            />
          </Form.Item>

          {/* USERNAME */}
          <Form.Item
            name="username"
            label="Tên đăng nhập (Username)"
            rules={[
              {
                required:
                  true,
                message:
                  'Vui lòng nhập username'
              },

              {
                pattern:
                  /^[a-zA-Z0-9_]+$/,
                message:
                  'Username không được chứa ký tự đặc biệt'
              }
            ]}
          >
            <Input placeholder="nguyenvana" />
          </Form.Item>

          {/* PHONE */}
          <Form.Item
            name="phone"
            label="Số điện thoại liên hệ"
            rules={[
              {
                required:
                  true,
                message:
                  'Vui lòng nhập số điện thoại'
              },

              {
                pattern:
                  /^(0[3|5|7|8|9])+([0-9]{8})$/,
                message:
                  'Số điện thoại Việt Nam không hợp lệ'
              }
            ]}
          >
            <Input placeholder="0912345678" />
          </Form.Item>

          {/* PASSWORD */}
          {!editingUser ? (
            <Form.Item
              name="password"
              label="Mật khẩu khởi tạo"
              rules={[
                {
                  required:
                    true,
                  message:
                    'Vui lòng nhập mật khẩu'
                },

                {
                  min: 6,
                  message:
                    'Mật khẩu tối thiểu phải có 6 ký tự'
                }
              ]}
            >
              <Input.Password placeholder="Nhập mật khẩu khởi tạo" />
            </Form.Item>
          ) : (
            <Form.Item
              name="newPassword"
              label="Mật khẩu mới (Bỏ trống nếu không muốn đổi)"
              rules={[
                {
                  min: 6,
                  message:
                    'Mật khẩu tối thiểu phải có 6 ký tự'
                }
              ]}
            >
              <Input.Password placeholder="Nhập mật khẩu mới..." />
            </Form.Item>
          )}

          {/* ROLE */}
          <Form.Item
            name="role"
            label="Vai trò / Quyền truy cập"
            rules={[
              {
                required:
                  true,
                message:
                  'Vui lòng chọn vai trò'
              }
            ]}
          >
            <Select
              options={[
                {
                  value:
                    'Customer',
                  label:
                    'Khách hàng (Customer)'
                },

                {
                  value:
                    'Staff',
                  label:
                    'Nhân viên (Staff)'
                },

                {
                  value:
                    'Admin',
                  label:
                    'Quản trị viên (Admin)'
                }
              ]}
            />
          </Form.Item>

          {/* EDIT INFO */}
          {editingUser && (
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-sm text-gray-600 mt-4">
              <p>
                <strong>
                  Lần đăng nhập cuối:
                </strong>{' '}
                {
                  editingUser.lastLogin
                }
              </p>

              <p className="mt-2">
                <strong>
                  Ngày tạo tài khoản:
                </strong>{' '}
                {
                  editingUser.createdAt
                }
              </p>
            </div>
          )}
        </Form>
      </Modal>
    </div>
  );
}