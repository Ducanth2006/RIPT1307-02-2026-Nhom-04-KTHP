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
  DatePicker,
  Card,
  Statistic
} from 'antd';

import {
  Download,
  UserPlus,
  Users,
  Lock,
  Edit,
  Shield,
  Search,
  Trash2
} from 'lucide-react';

import type { ColumnsType } from 'antd/es/table';

import {
  getAdminUsers,
  createAdminUser,
  updateAdminUser,
  toggleAdminUserLock,
  deleteAdminUser
} from '../../services/admin/userService';

const { RangePicker } = DatePicker;

// =========================
// TYPES
// =========================

interface User {
  id: string;
  name: string;
  email: string;
  username?: string;
  phone?: string;
  role: 'Admin' | 'Staff' | 'Customer';
  status: 'Active' | 'Locked';
  lastLogin: string;
  createdAt: string;
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [roleFilter, setRoleFilter] = useState<'All' | 'Admin' | 'Staff' | 'Customer'>('All');
  const [createdDateFilter, setCreatedDateFilter] = useState<any>(null);

  // PAGINATION
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  // MODAL
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();

  // =========================
  // LOAD USERS
  // =========================

  const loadUsers = async () => {
    try {
      setLoading(true);
      const res = await getAdminUsers();
      setUsers(res.data || []);
    } catch (err: any) {
      message.error(
        'Không thể tải danh sách tài khoản: ' +
          (err.response?.data?.message || err.message)
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

  const filteredUsers = useMemo(() => {
    return users.filter((item) => {
      // ROLE
      let matchRole = true;
      if (roleFilter !== 'All') {
        matchRole = item.role === roleFilter;
      }

      // SEARCH
      let matchSearch = true;
      if (searchText) {
        const lowerSearch = searchText.toLowerCase();
        matchSearch =
          item.name.toLowerCase().includes(lowerSearch) ||
          item.email.toLowerCase().includes(lowerSearch) ||
          !!item.username?.toLowerCase().includes(lowerSearch) ||
          !!item.phone?.toLowerCase().includes(lowerSearch);
      }

      // DATE
      let matchDate = true;
      if (createdDateFilter && createdDateFilter.length === 2) {
        const startDate = createdDateFilter[0].startOf('day');
        const endDate = createdDateFilter[1].endOf('day');
        const createdAt = dayjs(item.createdAt);
        matchDate = createdAt.isAfter(startDate) && createdAt.isBefore(endDate);
      }

      return matchRole && matchSearch && matchDate;
    });
  }, [users, roleFilter, searchText, createdDateFilter]);

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

      const dataRows = filteredUsers.map((u) => [
        u.id,
        u.name,
        u.email,
        u.username || '',
        u.phone || '',
        u.role === 'Admin' ? 'Quản trị viên' : u.role === 'Staff' ? 'Nhân viên' : 'Khách hàng',
        u.status === 'Active' ? 'Đang hoạt động' : 'Đã khóa',
        u.createdAt
      ]);

      const BOM = '\uFEFF';
      const csvContent =
        BOM +
        [
          headers.join(','),
          ...dataRows.map((row) =>
            row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')
          )
        ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');

      link.setAttribute('href', url);
      link.setAttribute('download', `Danh_Sach_Nguoi_Dung_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      message.success('Xuất danh sách người dùng thành công!');
    } catch {
      message.error('Xuất danh sách thất bại');
    }
  };

  // =========================
  // LOCK USER
  // =========================

  const handleToggleLock = async (checked: boolean, record: User) => {
    const isLocked = !checked;

    try {
      await toggleAdminUserLock(record.id, isLocked);

      setUsers((prev) =>
        prev.map((u) => {
          if (u.id === record.id) {
            return { ...u, status: checked ? 'Active' : 'Locked' };
          }
          return u;
        })
      );

      if (isLocked) {
        message.warning(`Tài khoản ${record.email} đã bị khóa`);
      } else {
        message.success(`Đã mở khóa tài khoản ${record.email}`);
      }
    } catch (err: any) {
      message.error(
        'Không thể thay đổi trạng thái tài khoản: ' +
          (err.response?.data?.message || err.message)
      );
    }
  };

  // =========================
  // SHOW MODAL
  // =========================

  const showModal = (user?: User) => {
    if (user) {
      setEditingUser(user);
      form.setFieldsValue({
        name: user.name,
        email: user.email,
        role: user.role,
        newPassword: ''
      });
    } else {
      setEditingUser(null);
      form.resetFields();
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingUser(null);
    form.resetFields();
  };

  // =========================
  // SAVE USER
  // =========================

  const handleModalSave = async () => {
    try {
      const values = await form.validateFields();
      setSaving(true);

      if (editingUser) {
        const payload: any = {
          name: values.name,
          email: values.email,
          role: values.role
        };
        if (values.newPassword && values.newPassword.trim()) {
          payload.password = values.newPassword;
        }
        const res = await updateAdminUser(editingUser.id, payload);
        message.success(res.message || 'Cập nhật thông tin tài khoản thành công!');
        await loadUsers();
        closeModal();
      } else {
        const payload = {
          name: values.name,
          email: values.email,
          password: values.password,
          role: values.role
        };
        const res = await createAdminUser(payload);
        message.success(res.message || 'Tạo tài khoản mới thành công!');
        await loadUsers();
        closeModal();
      }
    } catch (err: any) {
      if (err.errorFields) return;
      message.error(err.response?.data?.message || 'Lưu thông tin tài khoản thất bại');
    } finally {
      setSaving(false);
    }
  };

  // =========================
  // DELETE USER
  // =========================

  const handleDeleteUser = async (userId: string, userName?: string) => {
    try {
      await deleteAdminUser(userId);
      message.success(`Đã xóa tài khoản ${userName || ''} thành công!`);
      await loadUsers();
    } catch (err: any) {
      message.error(
        'Không thể xóa tài khoản: ' + (err.response?.data?.message || err.message)
      );
    }
  };

  // =========================
  // TABLE COLUMNS
  // =========================

  const columns: ColumnsType<User> = [
    {
      title: 'Họ và tên',
      dataIndex: 'name',
      render: (_, record) => (
        <div className="flex items-center gap-3">
          <Avatar
            className={
              record.role === 'Admin'
                ? 'bg-[#af101a] text-white font-bold'
                : 'bg-[#f1dede] text-[#af101a] font-bold'
            }
          >
            {record.name.charAt(0).toUpperCase()}
          </Avatar>
          <div>
            <div className="font-semibold text-[15px] text-[#191c1e]">
              {record.name}
            </div>
            <div className="text-sm text-[#5b403d] mt-0.5">
              {record.email}
            </div>
          </div>
        </div>
      )
    },
    {
      title: 'Vai trò',
      dataIndex: 'role',
      render: (val: string) => {
        if (val === 'Admin') return <Tag color="red" className="rounded-full px-3 py-1">Quản trị viên</Tag>;
        if (val === 'Staff') return <Tag color="processing" className="rounded-full px-3 py-1">Nhân viên</Tag>;
        return <Tag color="green" className="rounded-full px-3 py-1">Khách hàng</Tag>;
      }
    },
    {
      title: 'Ngày tạo',
      dataIndex: 'createdAt',
      render: (val: string) => (
        <span className="text-[#5b403d]">{dayjs(val).format('DD/MM/YYYY HH:mm')}</span>
      )
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      render: (val: string, record) => (
        <div className="flex items-center gap-2">
          <Switch
            size="small"
            checked={val === 'Active'}
            onChange={(checked) => handleToggleLock(checked, record)}
          />
          <span
            className={`text-[14px] font-semibold ${
              val === 'Locked' ? 'text-[#af101a]' : 'text-[#15803d]'
            }`}
          >
            {val === 'Active' ? 'Đang hoạt động' : 'Đã khóa'}
          </span>
        </div>
      )
    },
    {
      title: 'Thao tác',
      key: 'action',
      align: 'right',
      render: (_, record) => (
        <Space size="middle">
          <Tooltip title="Chỉnh sửa thông tin">
            <Button
              type="text"
              icon={<Edit size={16} />}
              onClick={() => showModal(record)}
              className="text-[#5b403d] hover:!text-[#af101a]"
            />
          </Tooltip>

          <Tooltip title="Xóa tài khoản">
            <Popconfirm
              title="Bạn có chắc chắn muốn xóa tài khoản này?"
              description="Tài khoản sẽ bị xóa khỏi hệ thống."
              okText="Đồng ý"
              cancelText="Hủy"
              okButtonProps={{ className: 'bg-[#af101a] hover:!bg-[#930010] border-none' }}
              onConfirm={() => handleDeleteUser(record.id, record.name)}
            >
              <Button
                type="text"
                danger
                icon={<Trash2 size={16} />}
                className="text-[#af101a] hover:!text-[#930010]"
              />
            </Popconfirm>
          </Tooltip>
        </Space>
      )
    }
  ];

  return (
    <div className="p-4 md:p-6 max-w-[1600px] mx-auto space-y-6">
      
      {/* HEADER */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#191c1e] flex items-center gap-3">
            <Users size={30} className="text-[#af101a]" />
            Quản Lý Người Dùng
          </h1>
          <p className="text-[#5b403d] mt-2">
            Quản lý tài khoản, phân quyền và trạng thái hoạt động trên hệ thống.
          </p>
        </div>

        <Space wrap>
          <Button
            size="large"
            icon={<Download size={18} />}
            onClick={handleExport}
            className="border-[#ead0d0] hover:!text-[#af101a] hover:!border-[#af101a]"
          >
            Xuất CSV
          </Button>

          <Button
            type="primary"
            size="large"
            icon={<UserPlus size={18} />}
            className="bg-[#af101a] hover:!bg-[#930010] border-none"
            onClick={() => showModal()}
          >
            Thêm tài khoản
          </Button>
        </Space>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Tổng số tài khoản */}
        <div className="bg-white border border-[#e4beba] border-t-2 border-t-[#af101a] rounded-xl p-4 shadow-sm relative overflow-hidden group transition-all hover:shadow-md">
          <div className="flex justify-between items-start mb-2">
            <span className="text-[11px] font-bold text-[#5b403d] uppercase tracking-wider">
              Tổng số tài khoản
            </span>
            <div className="w-8 h-8 rounded-lg bg-[#fff2f0] flex items-center justify-center">
              <Users size={16} className="text-[#af101a]" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <h2 className="text-2xl font-black text-[#191c1e]">
              {users.length}
            </h2>
          </div>
        </div>

        {/* Nhân viên & Quản trị */}
        <div className="bg-white border border-[#e4beba] rounded-xl p-4 shadow-sm relative overflow-hidden group transition-all hover:shadow-md">
          <div className="flex justify-between items-start mb-2">
            <span className="text-[11px] font-bold text-[#5b403d] uppercase tracking-wider">
              Nhân viên & Quản trị
            </span>
            <div className="w-8 h-8 rounded-lg bg-[#eff6ff] flex items-center justify-center">
              <Shield size={16} className="text-blue-600" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <h2 className="text-2xl font-black text-[#191c1e]">
              {users.filter((u) => u.role === 'Admin' || u.role === 'Staff').length}
            </h2>
          </div>
        </div>

        {/* Tài khoản bị khóa */}
        <div className="bg-white border border-[#e4beba] rounded-xl p-4 shadow-sm relative overflow-hidden group transition-all hover:shadow-md">
          <div className="flex justify-between items-start mb-2">
            <span className="text-[11px] font-bold text-[#5b403d] uppercase tracking-wider">
              Tài khoản bị khóa
            </span>
            <div className="w-8 h-8 rounded-lg bg-[#fef2f2] flex items-center justify-center">
              <Lock size={16} className="text-red-500" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <h2 className="text-2xl font-black text-[#191c1e]">
              {users.filter((u) => u.status === 'Locked').length}
            </h2>
          </div>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="bg-white border border-[#e4beba] rounded-xl shadow-sm overflow-hidden">
        
        {/* FILTER */}
        <div className="p-5 border-b border-[#f1dede]">
          <div className="flex flex-wrap gap-3 items-center">
            <Input
              size="large"
              placeholder="Tìm kiếm họ tên, email, username..."
              prefix={<Search size={16} />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              allowClear
              className="max-w-md"
            />

            <Select
              size="large"
              value={roleFilter}
              onChange={setRoleFilter}
              style={{ width: 220 }}
              options={[
                { value: 'All', label: 'Tất cả vai trò' },
                { value: 'Admin', label: 'Quản trị viên' },
                { value: 'Staff', label: 'Nhân viên' },
                { value: 'Customer', label: 'Khách hàng' }
              ]}
            />

            <RangePicker
              size="large"
              format="DD/MM/YYYY"
              placeholder={['Từ ngày', 'Đến ngày']}
              value={createdDateFilter}
              onChange={(dates) => setCreatedDateFilter(dates)}
              style={{ width: 280 }}
              allowClear
            />
          </div>
        </div>

        {/* TABLE */}
        <div className="p-4">
          <Table
            columns={columns}
            dataSource={filteredUsers}
            rowKey="id"
            loading={loading}
            pagination={{
              current: currentPage,
              pageSize: itemsPerPage,
              onChange: (page) => setCurrentPage(page),
              showSizeChanger: true
            }}
            scroll={{ x: 1000 }}
          />
        </div>
      </div>

      {/* MODAL */}
      <Modal
        title={
          <span className="text-[18px] font-bold text-[#191c1e]">
            {editingUser ? 'Chỉnh sửa thông tin tài khoản' : 'Thêm tài khoản mới'}
          </span>
        }
        open={isModalOpen}
        onOk={handleModalSave}
        onCancel={closeModal}
        okText="Lưu thông tin"
        cancelText="Hủy bỏ"
        confirmLoading={saving}
        okButtonProps={{ className: 'bg-[#af101a] hover:!bg-[#930010] border-none' }}
        width={650}
        destroyOnClose
      >
        <Form form={form} layout="vertical" className="mt-5 space-y-4">
          <Form.Item
            name="name"
            label="Họ và tên hiển thị"
            rules={[{ required: true, message: 'Vui lòng nhập họ và tên hiển thị' }]}
          >
            <Input size="large" placeholder="Nguyễn Văn A" />
          </Form.Item>

          <Form.Item
            name="email"
            label="Địa chỉ Email"
            rules={[
              { required: true, message: 'Vui lòng nhập email' },
              { type: 'email', message: 'Email không đúng định dạng' }
            ]}
          >
            <Input
              size="large"
              placeholder="example@email.com"
              disabled={!!editingUser && editingUser.role === 'Admin'}
            />
          </Form.Item>

          {!editingUser ? (
            <Form.Item
              name="password"
              label="Mật khẩu khởi tạo"
              rules={[
                { required: true, message: 'Vui lòng nhập mật khẩu' },
                { min: 6, message: 'Mật khẩu tối thiểu phải có 6 ký tự' }
              ]}
            >
              <Input.Password size="large" placeholder="Nhập mật khẩu khởi tạo" />
            </Form.Item>
          ) : (
            <Form.Item
              name="newPassword"
              label="Mật khẩu mới (Bỏ trống nếu không muốn đổi)"
              rules={[{ min: 6, message: 'Mật khẩu tối thiểu phải có 6 ký tự' }]}
            >
              <Input.Password size="large" placeholder="Nhập mật khẩu mới..." />
            </Form.Item>
          )}

          <Form.Item
            name="role"
            label="Vai trò / Quyền truy cập"
            rules={[{ required: true, message: 'Vui lòng chọn vai trò' }]}
          >
            <Select
              size="large"
              options={[
                { value: 'Customer', label: 'Khách hàng (Customer)' },
                { value: 'Staff', label: 'Nhân viên (Staff)' },
                { value: 'Admin', label: 'Quản trị viên (Admin)' }
              ]}
            />
          </Form.Item>

          {editingUser && (
            <div className="bg-[#f1dede]/30 border border-[#ead0d0] rounded-xl p-4 text-[14px] text-[#5b403d] mt-4">
              <p><strong>Lần đăng nhập cuối:</strong> {editingUser.lastLogin}</p>
              <p className="mt-1"><strong>Ngày tạo tài khoản:</strong> {editingUser.createdAt}</p>
            </div>
          )}
        </Form>
      </Modal>
    </div>
  );
}