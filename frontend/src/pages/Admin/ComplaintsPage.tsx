import React, { useState } from 'react';
import { 
  Table, 
  Button, 
  Input, 
  Tag, 
  Space, 
  Drawer, 
  Form, 
  Select, 
  message, 
  Tooltip
} from 'antd';
import { ColumnsType } from 'antd/es/table';
import { 
  MessageSquareWarning, 
  Search, 
  Eye, 
  ExternalLink,
  Send,
  CheckCircle,
  FileText
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface Complaint {
  id: string;
  orderId: string;
  customerName: string;
  customerEmail: string;
  title: string;
  content: string;
  date: string;
  status: 'New' | 'In Progress' | 'Closed';
  responses?: { sender: string; text: string; time: string }[];
}

const mockComplaints: Complaint[] = [
  {
    id: 'CMP-2023-01',
    orderId: 'ORD-8091',
    customerName: 'Nguyen Van A',
    customerEmail: 'nva@example.com',
    title: 'Wrong item received in my order',
    content: 'I ordered size 42, but received size 41. I need a replacement as soon as possible for my upcoming match.',
    date: '2023-11-20 14:30',
    status: 'New',
    responses: []
  },
  {
    id: 'CMP-2023-02',
    orderId: 'ORD-8085',
    customerName: 'Tran Thi B',
    customerEmail: 'ttb@example.com',
    title: 'Delayed shipping',
    content: 'My order has been stuck at the sorting facility for 3 days. When can I expect to receive it?',
    date: '2023-11-19 10:15',
    status: 'In Progress',
    responses: [
      { sender: 'Admin', text: 'We apologize for the delay. We are contacting the shipping provider to expedite this.', time: '2023-11-19 11:00' }
    ]
  },
  {
    id: 'CMP-2023-03',
    orderId: 'ORD-8050',
    customerName: 'Le Van C',
    customerEmail: 'lvc@example.com',
    title: 'Product damaged on arrival',
    content: 'The shoe box was completely crushed and there is a scratch on the left shoe.',
    date: '2023-11-15 09:20',
    status: 'Closed',
    responses: [
      { sender: 'Admin', text: 'We are very sorry for the issue. A replacement has been shipped.', time: '2023-11-15 10:30' },
      { sender: 'Customer', text: 'Thank you, I received the replacement today.', time: '2023-11-17 14:00' }
    ]
  }
];

export default function ComplaintsPage() {
  const [complaints, setComplaints] = useState<Complaint[]>(mockComplaints);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [replyText, setReplyText] = useState('');

  const filteredComplaints = complaints.filter(c => {
    const matchesSearch = c.orderId.toLowerCase().includes(searchText.toLowerCase()) || 
                          c.customerName.toLowerCase().includes(searchText.toLowerCase()) ||
                          c.title.toLowerCase().includes(searchText.toLowerCase());
    const matchesStatus = statusFilter === 'All' || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const openDrawer = (record: Complaint) => {
    setSelectedComplaint(record);
    setReplyText('');
    setIsDrawerOpen(true);
  };

  const handleSendReply = () => {
    if (!replyText.trim() || !selectedComplaint) {
      message.error('Please enter a response message');
      return;
    }
    
    const updatedComplaint = {
      ...selectedComplaint,
      responses: [
        ...(selectedComplaint.responses || []),
        { sender: 'Admin', text: replyText, time: new Date().toLocaleString() }
      ],
      status: selectedComplaint.status === 'New' ? 'In Progress' as const : selectedComplaint.status
    };

    setComplaints(prev => prev.map(c => c.id === updatedComplaint.id ? updatedComplaint : c));
    setSelectedComplaint(updatedComplaint);
    setReplyText('');
    message.success('Response sent to customer');
  };

  const handleUpdateStatus = (newStatus: 'New' | 'In Progress' | 'Closed') => {
    if (!selectedComplaint) return;
    
    setComplaints(prev => prev.map(c => 
      c.id === selectedComplaint.id ? { ...c, status: newStatus } : c
    ));
    setSelectedComplaint({ ...selectedComplaint, status: newStatus });
    message.success(`Status updated to ${newStatus}`);
  };

  const columns: ColumnsType<Complaint> = [
    {
      title: 'Complaint ID',
      dataIndex: 'id',
      key: 'id',
      className: 'font-mono text-sm',
    },
    {
      title: 'Order ID',
      dataIndex: 'orderId',
      key: 'orderId',
      render: (text) => (
        <span className="text-[#00799c] font-medium font-mono">{text}</span>
      )
    },
    {
      title: 'Customer',
      dataIndex: 'customerName',
      key: 'customerName',
      render: (text, record) => (
        <div>
          <div className="font-medium">{text}</div>
          <div className="text-xs text-gray-500">{record.customerEmail}</div>
        </div>
      )
    },
    {
      title: 'Title',
      dataIndex: 'title',
      key: 'title',
      ellipsis: true,
    },
    {
      title: 'Date Submitted',
      dataIndex: 'date',
      key: 'date',
      className: 'text-gray-500 text-sm'
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        let color = 'default';
        if (status === 'New') color = 'error';
        if (status === 'In Progress') color = 'processing';
        if (status === 'Closed') color = 'success';
        
        return <Tag color={color}>{status}</Tag>;
      }
    },
    {
      title: 'Action',
      key: 'action',
      align: 'right',
      render: (_, record) => (
        <Tooltip title="View Details">
          <Button 
            type="text" 
            icon={<Eye size={16} />} 
            onClick={() => openDrawer(record)} 
            className="text-[#af101a] hover:bg-red-50" 
          />
        </Tooltip>
      ),
    },
  ];

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-[1600px] mx-auto">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-[#191c1e] flex items-center gap-2">
            <MessageSquareWarning className="text-[#af101a]" size={28} />
            Customer Complaints
          </h1>
          <p className="text-[#5b403d] mt-1 text-sm">Monitor and resolve customer issues and feedback.</p>
        </div>
      </div>

      <div className="bg-white border border-[#d8dadc] p-4 rounded-xl shadow-sm flex flex-col sm:flex-row gap-4 justify-between">
        <div className="flex gap-4 flex-1">
          <Input 
            prefix={<Search size={16} className="text-gray-400" />} 
            placeholder="Search by Order ID, Customer name or Title..." 
            className="w-full sm:max-w-md rounded-lg"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            allowClear
          />
          <Select
            value={statusFilter}
            onChange={setStatusFilter}
            className="w-full sm:w-48"
            options={[
              { value: 'All', label: 'All Statuses' },
              { value: 'New', label: 'New' },
              { value: 'In Progress', label: 'In Progress' },
              { value: 'Closed', label: 'Closed' },
            ]}
          />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-[#d8dadc] overflow-hidden">
        <Table 
          columns={columns} 
          dataSource={filteredComplaints} 
          rowKey="id"
          pagination={{ pageSize: 10 }}
          scroll={{ x: 1000 }}
        />
      </div>

      <Drawer
        title={<span className="font-bold text-lg flex items-center gap-2"><FileText size={20} /> Complaint Details</span>}
        placement="right"
        width={600}
        onClose={() => setIsDrawerOpen(false)}
        open={isDrawerOpen}
      >
        {selectedComplaint && (
          <div className="space-y-6">
            {/* Header / Info */}
            <div className="bg-[#f7f9fb] p-4 rounded-xl border border-[#eceef0]">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-lg font-bold text-[#191c1e]">{selectedComplaint.title}</h2>
                  <p className="text-sm text-gray-500 mt-1">ID: {selectedComplaint.id} • {selectedComplaint.date}</p>
                </div>
                <Tag color={
                  selectedComplaint.status === 'New' ? 'error' : 
                  selectedComplaint.status === 'In Progress' ? 'processing' : 'success'
                }>
                  {selectedComplaint.status}
                </Tag>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm mt-4">
                <div>
                  <div className="text-gray-500 mb-1">Customer</div>
                  <div className="font-medium">{selectedComplaint.customerName}</div>
                  <div className="text-xs text-gray-400">{selectedComplaint.customerEmail}</div>
                </div>
                <div>
                  <div className="text-gray-500 mb-1">Related Order</div>
                  <Link to="/orders" className="text-[#00799c] font-medium font-mono flex items-center gap-1 hover:underline">
                    {selectedComplaint.orderId} <ExternalLink size={14} />
                  </Link>
                </div>
              </div>
            </div>

            {/* Original Complaint */}
            <div>
              <h3 className="font-semibold text-[#191c1e] mb-3">Issue Description</h3>
              <div className="bg-white border text-sm text-gray-800 border-[#d8dadc] p-4 rounded-lg shadow-sm leading-relaxed">
                {selectedComplaint.content}
              </div>
            </div>

            {/* Resolution History */}
            <div>
               <h3 className="font-semibold text-[#191c1e] mb-3">Resolution & Discussion</h3>
               <div className="space-y-4">
                  {selectedComplaint.responses && selectedComplaint.responses.length > 0 ? (
                    selectedComplaint.responses.map((resp, idx) => (
                      <div key={idx} className={`flex flex-col ${resp.sender === 'Admin' ? 'items-end' : 'items-start'}`}>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-xs text-gray-600">{resp.sender}</span>
                          <span className="text-[10px] text-gray-400">{resp.time}</span>
                        </div>
                        <div className={`p-3 rounded-lg text-sm max-w-[85%] ${resp.sender === 'Admin' ? 'bg-[#af101a] text-white rounded-br-none' : 'bg-gray-100 text-gray-800 rounded-bl-none'}`}>
                          {resp.text}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-6 text-gray-400 italic text-sm">
                      No responses yet.
                    </div>
                  )}
               </div>
            </div>

            {/* Action Bar */}
            <div className="pt-4 border-t border-[#eceef0]">
              {selectedComplaint.status !== 'Closed' ? (
                <>
                  <div className="mb-3">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Reply to Customer</label>
                    <Input.TextArea 
                      rows={3} 
                      placeholder="Write your response to the customer here..."
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                    />
                  </div>
                  <div className="flex justify-between items-center mt-4">
                    <Select
                      value={selectedComplaint.status}
                      onChange={handleUpdateStatus}
                      className="w-40"
                      options={[
                        { value: 'New', label: 'Mark as New', disabled: true },
                        { value: 'In Progress', label: 'Mark In Progress' },
                        { value: 'Closed', label: 'Mark as Closed' },
                      ]}
                    />
                    <Button 
                      type="primary" 
                      className="bg-[#af101a] hover:bg-[#930010] flex items-center gap-2"
                      onClick={handleSendReply}
                    >
                      <Send size={16} /> Send Reply
                    </Button>
                  </div>
                </>
              ) : (
                <div className="bg-green-50 text-green-700 border border-green-200 p-4 rounded-lg flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle size={20} />
                    <span className="font-medium">This complaint has been closed.</span>
                  </div>
                  <Button size="small" onClick={() => handleUpdateStatus('In Progress')}>Reopen</Button>
                </div>
              )}
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
}
