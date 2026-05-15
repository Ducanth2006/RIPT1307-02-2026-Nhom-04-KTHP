import React, { useState } from 'react';
import { Card, Table, Tag, Button, Input, Space, Badge, Avatar } from 'antd';
import { MessageSquare, Clock, AlertCircle, CheckCircle, Search, Filter, Mail, Send } from 'lucide-react';

interface Ticket {
  key: string;
  id: string;
  customer: string;
  subject: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  lastUpdate: string;
  avatar: string;
}

const mockTickets: Ticket[] = [
  {
    key: '1',
    id: 'TKT-8902',
    customer: 'Le Van C',
    subject: 'Cannot login to my account',
    priority: 'HIGH',
    status: 'OPEN',
    lastUpdate: '10 mins ago',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Le',
  },
  {
    key: '2',
    id: 'TKT-8895',
    customer: 'Nguyen Thi D',
    subject: 'Order #ORD-8091 missing item',
    priority: 'MEDIUM',
    status: 'IN_PROGRESS',
    lastUpdate: '2 hours ago',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Nguyen',
  },
  {
    key: '3',
    id: 'TKT-8890',
    customer: 'Michael Jordan',
    subject: 'Question about sizing for Elite Shoes',
    priority: 'LOW',
    status: 'RESOLVED',
    lastUpdate: '1 day ago',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Michael',
  },
];

export default function Support() {
  const [searchText, setSearchText] = useState('');

  const columns = [
    {
      title: 'Ticket ID',
      dataIndex: 'id',
      key: 'id',
      className: 'font-mono font-bold text-[#af101a]',
    },
    {
      title: 'Customer',
      dataIndex: 'customer',
      key: 'customer',
      render: (text: string, record: Ticket) => (
        <div className="flex items-center gap-2">
          <Avatar src={record.avatar} size="small" />
          <span className="font-medium">{text}</span>
        </div>
      ),
    },
    {
      title: 'Subject',
      dataIndex: 'subject',
      key: 'subject',
      className: 'max-w-xs truncate',
    },
    {
      title: 'Priority',
      dataIndex: 'priority',
      key: 'priority',
      render: (priority: string) => {
        let color = 'blue';
        if (priority === 'HIGH') color = 'red';
        if (priority === 'MEDIUM') color = 'orange';
        return <Tag color={color}>{priority}</Tag>;
      },
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Badge status={status === 'RESOLVED' ? 'success' : status === 'OPEN' ? 'error' : 'processing'} text={status.replace('_', ' ')} />
      ),
    },
    {
      title: 'Last Update',
      dataIndex: 'lastUpdate',
      key: 'lastUpdate',
      render: (text: string) => (
        <div className="flex items-center gap-1 text-xs text-[#5b403d]">
          <Clock size={12} /> {text}
        </div>
      ),
    },
    {
      title: 'Action',
      key: 'action',
      render: () => (
        <Button type="link" className="text-[#00799c] p-0 font-bold">Reply</Button>
      ),
    },
  ];

  return (
    <div className="p-6 space-y-6 max-w-[1400px] mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#191c1e] flex items-center gap-2">
            <MessageSquare size={32} className="text-[#af101a]" />
            Support Center
          </h1>
          <p className="text-[#5b403d] mt-1">Manage customer inquiries and support tickets.</p>
        </div>
        <div className="flex gap-2">
          <Button icon={<Mail size={18} />}>Email Inbox</Button>
          <Button type="primary" className="bg-[#af101a]" icon={<Send size={18} />}>New Message</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { title: 'Open Tickets', count: 12, icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-50' },
          { title: 'In Progress', count: 8, icon: Clock, color: 'text-blue-600', bg: 'bg-blue-50' },
          { title: 'Resolved (24h)', count: 45, icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50' },
        ].map((stat, i) => (
          <Card key={i} className="shadow-sm border-[#d8dadc]">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-[#5b403d] text-sm font-medium">{stat.title}</p>
                <h3 className="text-3xl font-bold text-[#191c1e] mt-1">{stat.count}</h3>
              </div>
              <div className={`p-3 rounded-xl ${stat.bg} ${stat.color}`}>
                <stat.icon size={24} />
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="bg-white border border-[#d8dadc] rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-[#eceef0] flex justify-between items-center bg-[#f7f9fb]">
          <div className="flex gap-3 items-center">
            <Input 
              placeholder="Search tickets..." 
              prefix={<Search size={18} className="text-[#8f6f6c]" />}
              className="w-64 rounded-lg"
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
            />
            <Button icon={<Filter size={18} />}>Filters</Button>
          </div>
          <div className="flex gap-2">
            <Tag className="cursor-pointer">High Priority</Tag>
            <Tag className="cursor-pointer">Needs Reply</Tag>
          </div>
        </div>
        <Table 
          columns={columns} 
          dataSource={mockTickets} 
          className="custom-table"
        />
      </div>
    </div>
  );
}
