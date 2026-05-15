import React, { useState } from 'react';
import { Table, Tag, Button, Input, Space, Avatar, message } from 'antd';
import { Search, UserPlus, Mail, Phone, MoreHorizontal, Edit, Trash2, ShieldCheck } from 'lucide-react';

interface UserData {
  key: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'MANAGER' | 'STAFF' | 'CUSTOMER';
  status: 'ACTIVE' | 'INACTIVE' | 'BANNED';
  phone: string;
  joinDate: string;
  avatar: string;
}

const initialData: UserData[] = [
  {
    key: '1',
    name: 'Admin User',
    email: 'admin@prosports.com',
    role: 'ADMIN',
    status: 'ACTIVE',
    phone: '0901234567',
    joinDate: '2023-01-15',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Admin',
  },
  {
    key: '2',
    name: 'Nguyen Van A',
    email: 'nva@customer.com',
    role: 'CUSTOMER',
    status: 'ACTIVE',
    phone: '0987654321',
    joinDate: '2023-11-20',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=A',
  },
  {
    key: '3',
    name: 'Tran Thi B',
    email: 'ttb@staff.com',
    role: 'STAFF',
    status: 'INACTIVE',
    phone: '0912345678',
    joinDate: '2023-05-10',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=B',
  },
];

export default function UsersPage() {
  const [searchText, setSearchText] = useState('');
  const [data, setData] = useState(initialData);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchText(e.target.value);
  };

  const filteredData = data.filter(user => 
    user.name.toLowerCase().includes(searchText.toLowerCase()) ||
    user.email.toLowerCase().includes(searchText.toLowerCase())
  );

  const columns = [
    {
      title: 'User',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: UserData) => (
        <div className="flex items-center gap-3">
          <Avatar src={record.avatar} size="large" className="bg-[#f0f0f0]" />
          <div>
            <div className="font-bold text-[#191c1e]">{text}</div>
            <div className="text-xs text-[#5b403d]">{record.email}</div>
          </div>
        </div>
      ),
    },
    {
      title: 'Role',
      dataIndex: 'role',
      key: 'role',
      render: (role: string) => {
        let color = 'blue';
        if (role === 'ADMIN') color = 'volcano';
        if (role === 'STAFF') color = 'green';
        return <Tag color={color} className="font-semibold">{role}</Tag>;
      },
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        let color = 'success';
        if (status === 'INACTIVE') color = 'warning';
        if (status === 'BANNED') color = 'error';
        return <Tag color={color} variant="soft" className="rounded-full px-3">{status}</Tag>;
      },
    },
    {
      title: 'Contact',
      key: 'contact',
      render: (_: any, record: UserData) => (
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 text-xs text-[#5b403d]">
            <Phone size={12} /> {record.phone}
          </div>
          <div className="flex items-center gap-2 text-xs text-[#5b403d]">
            <Mail size={12} /> {record.email}
          </div>
        </div>
      ),
    },
    {
      title: 'Join Date',
      dataIndex: 'joinDate',
      key: 'joinDate',
      className: 'text-[#5b403d] text-sm',
    },
    {
      title: 'Actions',
      key: 'actions',
      render: () => (
        <Space>
          <Button type="text" icon={<Edit size={16} />} className="text-[#00799c]" />
          <Button type="text" icon={<Trash2 size={16} />} danger />
          <Button type="text" icon={<MoreHorizontal size={16} />} />
        </Space>
      ),
    },
  ];

  return (
    <div className="p-6 space-y-6 max-w-[1400px] mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#191c1e] flex items-center gap-2">
            <ShieldCheck size={32} className="text-[#af101a]" />
            User Management
          </h1>
          <p className="text-[#5b403d] mt-1">Manage system users, roles, and permissions.</p>
        </div>
        <Button 
          type="primary" 
          icon={<UserPlus size={18} />} 
          className="bg-[#af101a] hover:bg-[#ba1a20] h-10 px-6 font-bold"
          onClick={() => message.info('Add user feature coming soon!')}
        >
          Add New User
        </Button>
      </div>

      <div className="bg-white border border-[#d8dadc] rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-[#eceef0] bg-[#f7f9fb]">
          <Input 
            placeholder="Search users by name, email..." 
            prefix={<Search size={18} className="text-[#8f6f6c]" />}
            className="max-w-md rounded-lg"
            value={searchText}
            onChange={handleSearch}
            allowClear
          />
        </div>
        <Table 
          columns={columns} 
          dataSource={filteredData} 
          className="custom-table"
          pagination={{ pageSize: 10 }}
        />
      </div>
    </div>
  );
}
