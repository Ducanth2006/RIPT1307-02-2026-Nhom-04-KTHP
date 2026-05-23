import React, { useState, useMemo, useEffect } from 'react';
import { Table, Button, Input, Select, Switch, Avatar, message, Tag, Space, Modal, Form, Tooltip, Popconfirm } from 'antd';
import { Download, UserPlus, Users, BadgeCheck, Lock, Edit, Shield, Search, Key } from 'lucide-react';
import type { ColumnsType } from 'antd/es/table';
import {
  getAdminUsers,
  createAdminUser,
  updateAdminUser,
  toggleAdminUserLock,
  revokeAdminUserTokens
} from '../../services/adminUserService';

interface User {
  id: string;
  name: string;
  email: string;
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
  
  // Phân trang
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  // Trạng thái Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [form] = Form.useForm();

  // Gọi API tải danh sách tài khoản
  const loadUsers = async () => {
    setLoading(true);
    try {
      const res = await getAdminUsers();
      // res.data chứa danh sách người dùng đã được định dạng chuẩn từ backend
      setUsers(res.data || []);
    } catch (err: any) {
      message.error('Không thể tải danh sách tài khoản: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const filteredUsers = useMemo(() => {
    return users.filter(item => {
      let matchRole = true;
      if (roleFilter !== 'All') matchRole = item.role === roleFilter;
      
      let matchSearch = true;
      if (searchText) {
        const lowerSearch = searchText.toLowerCase();
        matchSearch = item.name.toLowerCase().includes(lowerSearch) || item.email.toLowerCase().includes(lowerSearch);
      }
      
      return matchRole && matchSearch;
    });
  }, [users, roleFilter, searchText]);

  // Xuất file CSV tiếng Việt chuẩn UTF-8
  const handleExport = () => {
    try {
      const headers = ['Mã tài khoản', 'Họ tên', 'Email', 'Vai trò', 'Trạng thái', 'Ngày tạo'];
      const dataRows = filteredUsers.map(u => [
        u.id,
        u.name,
        u.email,
        u.role === 'Admin' ? 'Quản trị viên' : u.role === 'Staff' ? 'Nhân viên' : 'Khách hàng',
        u.status === 'Active' ? 'Đang hoạt động' : 'Đã khóa',
        u.createdAt
      ]);
      
      const BOM = '\uFEFF';
      const csvContent = BOM + [
        headers.join(','),
        ...dataRows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `Danh_Sach_Nguoi_Dung_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      message.success('Xuất danh sách người dùng (CSV) thành công!');
    } catch (error) {
      message.error('Xuất danh sách thất bại');
    }
  };

  // Khóa / Mở khóa tài khoản qua API
  const handleToggleLock = async (checked: boolean, record: User) => {
    const isLocked = !checked; // true = khóa, false = kích hoạt
    try {
      await toggleAdminUserLock(record.id, isLocked);
      
      setUsers(prev => prev.map(u => {
        if (u.id === record.id) {
          return { ...u, status: checked ? 'Active' : 'Locked' };
        }
        return u;
      }));

      if (isLocked) {
        message.warning(`Tài khoản ${record.email} đã bị khóa.`);
      } else {
        message.success(`Đã mở khóa tài khoản ${record.email} thành công.`);
      }
    } catch (err: any) {
      message.error('Không thể thay đổi trạng thái tài khoản: ' + (err.response?.data?.message || err.message));
    }
  };

  const showModal = (user?: User) => {
    if (user) {
      setEditingUser(user);
      form.setFieldsValue(user);
    } else {
      setEditingUser(null);
      form.resetFields();
    }
    setIsModalOpen(true);
  };

  // Lưu tài khoản (Tạo mới hoặc Cập nhật qua API)
  const handleModalSave = async () => {
    try {
      const values = await form.validateFields();
      if (editingUser) {
        const res = await updateAdminUser(editingUser.id, values);
        message.success(res.message || 'Cập nhật thông tin tài khoản thành công!');
        loadUsers();
      } else {
        // Tạo tài khoản mới, truyền thêm mật khẩu mặc định là '12345678'
        const res = await createAdminUser({ ...values, password: '12345678' });
        message.success('Thêm tài khoản mới thành công! Mật khẩu mặc định là: 12345678');
        loadUsers();
      }
      setIsModalOpen(false);
    } catch (err: any) {
      if (err.errorFields) return; // Lỗi validate form
      message.error('Lỗi khi lưu thông tin tài khoản: ' + (err.response?.data?.message || err.message));
    }
  };

  // Thu hồi phiên đăng nhập qua API
  const handleRevokeTokens = async (userId: string) => {
    try {
      const res = await revokeAdminUserTokens(userId);
      message.success(res.message || `Đã thu hồi toàn bộ token đăng nhập. Người dùng sẽ lập tức bị đăng xuất khỏi mọi thiết bị.`);
    } catch (err: any) {
      message.error('Không thể thu hồi phiên đăng nhập: ' + (err.response?.data?.message || err.message));
    }
  };

  const columns: ColumnsType<User> = [
    { 
      title: 'Họ và tên', 
      dataIndex: 'name', 
      render: (_, record) => (
        <div className="flex items-center gap-3">
          <Avatar className={record.role === 'Admin' ? 'bg-[#d32f2f]/20 text-[#d32f2f]' : 'bg-[#e0e3e5] text-[#5b403d]'}>
            {record.name.charAt(0).toUpperCase()}
          </Avatar>
          <div>
            <div className="text-sm font-medium text-[#191c1e]">{record.name}</div>
            <div className="text-xs text-gray-500">{record.email}</div>
          </div>
        </div>
      )
    },
    { 
      title: 'Vai trò', 
      dataIndex: 'role', 
      render: (val: string) => {
        let color = 'default';
        let label = val;
        if (val === 'Admin') {
          color = 'magenta';
          label = 'Quản trị viên';
        } else if (val === 'Staff') {
          color = 'blue';
          label = 'Nhân viên';
        } else if (val === 'Customer') {
          color = 'green';
          label = 'Khách hàng';
        }
        return <Tag color={color}>{label}</Tag>;
      }
    },
    { 
      title: 'Ngày tạo tài khoản', 
      dataIndex: 'createdAt', 
      className: 'text-gray-500' 
    },
    { 
      title: 'Trạng thái hoạt động', 
      dataIndex: 'status', 
      render: (val: string, record) => (
        <div className="flex items-center gap-2">
          <Switch 
            size="small" 
            checked={val === 'Active'} 
            onChange={(checked) => handleToggleLock(checked, record)} 
          />
          <span className={`text-sm ${val === 'Locked' ? 'text-red-500 font-medium' : 'text-green-600'}`}>
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
          <Tooltip title="Chỉnh sửa thông tin & Quyền hạn">
            <Button type="text" icon={<Edit size={16}/>} onClick={() => showModal(record)} className="text-[#00799c] hover:bg-blue-50" />
          </Tooltip>
          <Tooltip title="Thu hồi quyền truy cập (Đăng xuất ngay lập tức)">
            <Popconfirm 
              title="Đăng xuất thiết bị?" 
              description="Hành động này sẽ thu hồi toàn bộ token đăng nhập hiện tại, buộc người dùng đăng xuất." 
              onConfirm={() => handleRevokeTokens(record.id)}
              okText="Đồng ý"
              cancelText="Hủy"
            >
              <Button type="text" danger icon={<Key size={16}/>} />
            </Popconfirm>
          </Tooltip>
        </Space>
      )
    },
  ];

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-[1600px] mx-auto">
      {/* Tiêu đề trang */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-[#191c1e]">Quản Lý Người Dùng</h1>
          <p className="text-[#5b403d] mt-1 text-sm">Quản lý hồ sơ cá nhân, phân chia vai trò truy cập và kiểm soát trạng thái hoạt động.</p>
        </div>
        <div className="flex gap-3">
          <Button icon={<Download size={18} />} onClick={handleExport}>Xuất báo cáo (CSV)</Button>
          <Button type="primary" icon={<UserPlus size={18} />} className="bg-[#af101a] hover:bg-[#930010]" onClick={() => showModal()}>Thêm tài khoản mới</Button>
        </div>
      </div>

      {/* Thẻ thống kê */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: 'Tổng số tài khoản', val: users.length, sub: 'Toàn bộ hệ thống', icon: Users, color: 'text-[#af101a]', bg: 'bg-[#ffdad6]/50', border: 'border-t-[#af101a]' },
          { label: 'Quản trị viên & Nhân viên', val: users.filter(u => u.role === 'Admin' || u.role === 'Staff').length, sub: 'Có quyền truy cập Admin', icon: Shield, color: 'text-[#00799c]', bg: 'bg-[#e0f2fe]' },
          { label: 'Tài khoản đang khóa', val: users.filter(u => u.status === 'Locked').length, sub: 'Cần rà soát lý do khóa', icon: Lock, color: 'text-red-600', bg: 'bg-red-50', subColor: 'text-red-600' },
        ].map((s, i) => (
          <div key={i} className={`bg-white border border-[#d8dadc] rounded-xl p-5 shadow-sm ${s.border ? 'border-t-4 ' + s.border : ''}`}>
            <div className="flex justify-between items-start mb-2">
              <span className="text-sm font-medium text-[#5b403d]">{s.label}</span>
              <div className={`p-2 rounded-lg ${s.bg} ${s.color}`}><s.icon size={20} /></div>
            </div>
            <div className="text-3xl font-bold text-[#191c1e]">{s.val}</div>
            <div className={`text-xs mt-1 ${s.subColor || 'text-gray-500'}`}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Thanh bộ lọc & Bảng danh sách */}
      <div className="bg-white border border-[#d8dadc] rounded-xl shadow-sm flex flex-col">
        <div className="p-4 border-b border-[#eceef0] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex w-full sm:w-auto">
            <Select 
              value={roleFilter} 
              onChange={setRoleFilter}
              className="w-full sm:w-56 rounded-lg"
              options={[
                { value: 'All', label: 'Tất cả các vai trò' },
                { value: 'Admin', label: 'Quản trị viên (Admin)' },
                { value: 'Staff', label: 'Nhân viên (Staff)' },
                { value: 'Customer', label: 'Khách hàng (Customer)' },
              ]}
            />
          </div>
          <Input 
            prefix={<Search size={16} className="text-gray-400"/>} 
            placeholder="Tìm kiếm theo họ tên hoặc email..." 
            className="w-full sm:w-72 rounded-lg"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            allowClear
          />
        </div>
        <Table 
          columns={columns} 
          dataSource={filteredUsers} 
          rowKey="id" 
          loading={loading}
          pagination={{ 
            current: currentPage,
            pageSize: itemsPerPage,
            onChange: (page) => setCurrentPage(page),
            showSizeChanger: true,
            locale: {
              items_per_page: '/ trang'
            }
          }} 
          className="custom-table"
          scroll={{ x: 'max-content' }}
        />
      </div>

      {/* Modal Thêm mới / Chỉnh sửa */}
      <Modal
        title={editingUser ? "Chỉnh sửa thông tin tài khoản" : "Thêm mới tài khoản hệ thống"}
        open={isModalOpen}
        onOk={handleModalSave}
        onCancel={() => setIsModalOpen(false)}
        okText="Lưu thông tin"
        cancelText="Hủy bỏ"
        okButtonProps={{ className: "bg-[#00799c] hover:bg-[#006280]" }}
      >
        <Form form={form} layout="vertical" className="mt-4">
          <Form.Item name="name" label="Họ và tên" rules={[{ required: true, message: 'Vui lòng điền họ và tên người dùng' }]}>
            <Input placeholder="Nguyễn Văn A" />
          </Form.Item>
          <Form.Item name="email" label="Địa chỉ Email" rules={[{ required: true, type: 'email', message: 'Vui lòng nhập đúng địa chỉ email' }]}>
            <Input placeholder="example@email.com" disabled={!!editingUser && editingUser.role === 'Admin'} />   
          </Form.Item>
          <Form.Item name="role" label="Vai trò / Quyền truy cập" rules={[{ required: true, message: 'Vui lòng chọn quyền truy cập' }]}>
            <Select
              options={[
                { value: 'Customer', label: 'Khách hàng (Customer)' },
                { value: 'Staff', label: 'Nhân viên (Staff)' },
                { value: 'Admin', label: 'Quản trị viên (Admin)' }
              ]}
            />
          </Form.Item>
          {editingUser && (
            <div className="bg-gray-50 border border-gray-200 rounded p-3 text-sm text-gray-600">
              <p><strong>Lần đăng nhập cuối:</strong> {editingUser.lastLogin}</p>
              <p><strong>Ngày khởi tạo tài khoản:</strong> {editingUser.createdAt}</p>
            </div>
          )}
        </Form>
      </Modal>
    </div>
  );
}