import React, { useState, useMemo } from 'react';
import { Table, Button, Input, Select, Switch, Avatar, message, Tag, Space, Modal, Form, Tooltip, Popconfirm } from 'antd';
import { Download, UserPlus, Users, BadgeCheck, Lock, Edit, Shield, Gavel, Search, Key } from 'lucide-react';
import type { ColumnsType } from 'antd/es/table';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'Admin' | 'Staff' | 'Customer';
  status: 'Active' | 'Locked';
  lastLogin: string;
  createdAt: string;
}

const mockData: User[] = [
  { id: '1', name: 'John Doe', email: 'john.doe@prosports.com', role: 'Admin', status: 'Active', lastLogin: '2023-10-27 09:41', createdAt: '2023-01-15' },
  { id: '2', name: 'Sarah Smith', email: 's.smith@prosports.com', role: 'Staff', status: 'Active', lastLogin: '2023-10-26 14:22', createdAt: '2023-02-20' },
  { id: '3', name: 'Mike Johnson', email: 'mike.j@external.com', role: 'Customer', status: 'Locked', lastLogin: '2023-09-15 11:05', createdAt: '2023-05-10' },
  { id: '4', name: 'Amanda Lee', email: 'amanda.lee@external.com', role: 'Customer', status: 'Active', lastLogin: '2023-10-27 08:15', createdAt: '2023-06-01' },
];

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>(mockData);
  const [searchText, setSearchText] = useState('');
  const [roleFilter, setRoleFilter] = useState<'All' | 'Admin' | 'Staff' | 'Customer'>('All');
  
  // Pagination state (simulated ?page=1&limit=20)
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [form] = Form.useForm();

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

  const handleExport = () => {
    message.success('Successfully exported user list (CSV)');
  };

  const handleToggleLock = (checked: boolean, record: User) => {
    const newStatus = checked ? 'Active' : 'Locked';
    
    setUsers(prev => prev.map(u => {
      if (u.id === record.id) {
        return { ...u, status: newStatus };
      }
      return u;
    }));

    if (newStatus === 'Locked') {
      message.warning(`Account ${record.email} has been locked.`);
    } else {
      message.success(`Unlocked account ${record.email}.`);
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

  const handleModalSave = async () => {
    try {
      const values = await form.validateFields();
      if (editingUser) {
        setUsers(prev => prev.map(u => 
          u.id === editingUser.id ? { ...u, ...values } : u
        ));
        message.success('Profile updated successfully');
      } else {
        const newUser: User = {
          id: Date.now().toString(),
          ...values,
          status: 'Active',
          lastLogin: 'Not logged in yet',
          createdAt: new Date().toISOString().split('T')[0]
        };
        setUsers([...users, newUser]);
        message.success('New account added successfully');
      }
      setIsModalOpen(false);
    } catch (error) {
      // Validate failed
    }
  };

  const handleRevokeTokens = (userId: string) => {
    message.success(`Revoked all JWT Tokens (Blacklisted). User ID: ${userId} will be logged out immediately.`);
  };

  const columns: ColumnsType<User> = [
    { 
      title: 'Full Name', 
      dataIndex: 'name', 
      render: (_, record) => (
        <div className="flex items-center gap-3">
          <Avatar className={record.role === 'Admin' ? 'bg-[#d32f2f]/20 text-[#d32f2f]' : 'bg-[#e0e3e5] text-[#5b403d]'}>
            {record.name.charAt(0)}
          </Avatar>
          <div>
            <div className="text-sm font-medium text-[#191c1e]">{record.name}</div>
            <div className="text-xs text-gray-500">{record.email}</div>
          </div>
        </div>
      )
    },
    { 
      title: 'Role', 
      dataIndex: 'role', 
      render: (val: string) => {
        let color = 'default';
        if (val === 'Admin') color = 'magenta';
        if (val === 'Staff') color = 'blue';
        if (val === 'Customer') color = 'green';
        return <Tag color={color}>{val}</Tag>;
      }
    },
    { 
      title: 'Date Created', 
      dataIndex: 'createdAt', 
      className: 'text-gray-500' 
    },
    { 
      title: 'Status', 
      dataIndex: 'status', 
      render: (val: string, record) => (
        <div className="flex items-center gap-2">
          <Switch 
            size="small" 
            checked={val === 'Active'} 
            onChange={(checked) => handleToggleLock(checked, record)} 
          />
          <span className={`text-sm ${val === 'Locked' ? 'text-red-500 font-medium' : 'text-green-600'}`}>
            {val === 'Active' ? 'Active' : 'Locked'}
          </span>
        </div>
      )
    },
    { 
      title: 'Actions', 
      key: 'action', 
      align: 'right', 
      render: (_, record) => (
        <Space size="middle">
          <Tooltip title="Edit Profile & Permissions">
            <Button type="text" icon={<Edit size={16}/>} onClick={() => showModal(record)} className="text-[#00799c] hover:bg-blue-50" />
          </Tooltip>
          <Tooltip title="Revoke Access (Blacklist JWT)">
            <Popconfirm title="Logout Device?" description="This action blacklists the JWT, forcing the user to log in again." onConfirm={() => handleRevokeTokens(record.id)}>
              <Button type="text" danger icon={<Key size={16}/>} />
            </Popconfirm>
          </Tooltip>
        </Space>
      )
    },
  ];

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-[1600px] mx-auto">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-[#191c1e]">User Management</h1>
          <p className="text-[#5b403d] mt-1 text-sm">Manage profiles, roles, and access control.</p>
        </div>
        <div className="flex gap-3">
          <Button icon={<Download size={18} />} onClick={handleExport}>Export File</Button>
          <Button type="primary" icon={<UserPlus size={18} />} className="bg-[#af101a] hover:bg-[#930010]" onClick={() => showModal()}>Add Account</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: 'Total Accounts', val: users.length, sub: 'Entire system', icon: Users, color: 'text-[#af101a]', bg: 'bg-[#ffdad6]/50', border: 'border-t-[#af101a]' },
          { label: 'Admins & Staff', val: users.filter(u => u.role === 'Admin' || u.role === 'Staff').length, sub: 'Admin access rights', icon: Shield, color: 'text-[#00799c]', bg: 'bg-[#e0f2fe]' },
          { label: 'Locked Accounts', val: users.filter(u => u.status === 'Locked').length, sub: 'Requires review', icon: Lock, color: 'text-red-600', bg: 'bg-red-50', subColor: 'text-red-600' },
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

      <div className="bg-white border border-[#d8dadc] rounded-xl shadow-sm flex flex-col">
        <div className="p-4 border-b border-[#eceef0] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex w-full sm:w-auto">
            <Select 
              value={roleFilter} 
              onChange={setRoleFilter}
              className="w-full sm:w-48 rounded-lg"
              options={[
                { value: 'All', label: 'All roles' },
                { value: 'Admin', label: 'Admin only' },
                { value: 'Staff', label: 'Staff only' },
                { value: 'Customer', label: 'Customer only' },
              ]}
            />
          </div>
          <Input 
            prefix={<Search size={16} className="text-gray-400"/>} 
            placeholder="Search by name or email..." 
            className="w-full sm:w-64 rounded-lg"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            allowClear
          />
        </div>
        <Table 
          columns={columns} 
          dataSource={filteredUsers} 
          rowKey="id" 
          pagination={{ 
            current: currentPage,
            pageSize: itemsPerPage,
            onChange: (page) => setCurrentPage(page),
            showSizeChanger: true
          }} 
          className="custom-table"
          scroll={{ x: 'max-content' }}
        />
      </div>

      <Modal
        title={editingUser ? "Edit Profile" : "Add New Account"}
        open={isModalOpen}
        onOk={handleModalSave}
        onCancel={() => setIsModalOpen(false)}
        okText="Save Info"
        cancelText="Cancel"
        okButtonProps={{ className: "bg-[#00799c] hover:bg-[#006280]" }}
      >
        <Form form={form} layout="vertical" className="mt-4">
          <Form.Item name="name" label="Full Name" rules={[{ required: true, message: 'Please enter full name' }]}>
            <Input placeholder="John Doe" />
          </Form.Item>
          <Form.Item name="email" label="Email Address" rules={[{ required: true, type: 'email', message: 'Please enter a valid email' }]}>
            <Input placeholder="example@email.com" disabled={!!editingUser && editingUser.role === 'Admin'} />   
          </Form.Item>
          <Form.Item name="role" label="Role" rules={[{ required: true, message: 'Please select a role' }]}>
            <Select
              options={[
                { value: 'Customer', label: 'Customer' },
                { value: 'Staff', label: 'Staff' },
                { value: 'Admin', label: 'Admin' }
              ]}
            />
          </Form.Item>
          {editingUser && (
            <div className="bg-gray-50 border border-gray-200 rounded p-3 text-sm text-gray-600">
              <p><strong>Last Login:</strong> {editingUser.lastLogin}</p>
              <p><strong>Account Created Date:</strong> {editingUser.createdAt}</p>
            </div>
          )}
        </Form>
      </Modal>
    </div>
  );
}