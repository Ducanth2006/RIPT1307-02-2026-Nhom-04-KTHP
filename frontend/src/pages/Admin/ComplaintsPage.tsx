import React, {
  useEffect,
  useState,
  useMemo,
} from 'react';

import {
  Table,
  Tag,
  Space,
  Button,
  Drawer,
  message,
  Input,
  Spin,
  Card,
  Row,
  Col,
  Select,
  Image,
  Statistic,
} from 'antd';

import type { ColumnsType } from 'antd/es/table';

import {
  Eye,
  CheckCircle,
  Send,
  AlertTriangle,
  Search,
  RefreshCw,
  Clock,
  Settings,
} from 'lucide-react';

import {
  getAdminComplaints,
  getAdminComplaintById,
  confirmAdminComplaint,
  replyAdminComplaint,
} from '../../services/adminComplaintService';

const { TextArea } = Input;

// ================= TYPES =================
interface Complaint {
  id: number;
  order_id: number;
  title: string;
  content: string;
  status: 'New' | 'In Progress' | 'Resolved' | 'Closed';
  created_at: string;
  users?: {
    full_name?: string;
    email?: string;
  };
  reply?: string;
  images?: string[];
}

export default function ComplaintsPage() {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(false);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [replyText, setReplyText] = useState('');

  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  // ================= FILTER =================
  const filteredComplaints = useMemo(() => {
    return complaints.filter((c) => {
      const matchesStatus = statusFilter === 'All' || c.status === statusFilter;
      
      const searchLower = searchText.trim().toLowerCase();
      if (!searchLower) return matchesStatus;

      const matchesSearch = 
        String(c.id).toLowerCase().includes(searchLower) ||
        String(c.order_id).toLowerCase().includes(searchLower) ||
        (c.users?.full_name && c.users.full_name.toLowerCase().includes(searchLower)) ||
        (c.users?.email && c.users.email.toLowerCase().includes(searchLower)) ||
        (c.content && c.content.toLowerCase().includes(searchLower));

      return matchesStatus && matchesSearch;
    });
  }, [complaints, searchText, statusFilter]);

  // ================= FETCH =================
  const fetchComplaints = async () => {
    try {
      setLoading(true);
      const data = await getAdminComplaints();
      setComplaints(data?.data || []);
    } catch (error) {
      message.error('Không thể tải danh sách khiếu nại');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, []);

  // ================= STATUS TAG =================
  const renderStatus = (status: Complaint['status']) => {
    switch (status) {
      case 'New':
        return <Tag color="orange" className="rounded-full px-3 py-1 m-0">Chờ xử lý</Tag>;
      case 'In Progress':
        return <Tag color="processing" className="rounded-full px-3 py-1 m-0">Đang xử lý</Tag>;
      case 'Resolved':
        return <Tag color="success" className="rounded-full px-3 py-1 m-0">Đã giải quyết</Tag>;
      default:
        return <Tag className="rounded-full px-3 py-1 m-0">{status}</Tag>;
    }
  };

  // ================= VIEW DETAIL =================
  const handleViewDetail = async (complaint: Complaint) => {
    try {
      setDetailLoading(true);
      setDrawerOpen(true);
      const data = await getAdminComplaintById(complaint.id);
      setSelectedComplaint(data?.data);
    } catch (error) {
      message.error('Không thể tải chi tiết khiếu nại');
    } finally {
      setDetailLoading(false);
    }
  };

  // ================= CONFIRM =================
  const handleConfirmComplaint = async () => {
    if (!selectedComplaint) return;
    try {
      await confirmAdminComplaint(selectedComplaint.id);
      message.success('Đã xác nhận khiếu nại thành công!');
      setDrawerOpen(false);
      fetchComplaints();
    } catch (error) {
      message.error('Xác nhận khiếu nại thất bại');
    }
  };

  // ================= REPLY =================
  const handleReplyComplaint = async () => {
    if (!selectedComplaint) return;
    if (!replyText.trim()) {
      message.warning('Vui lòng nhập nội dung phản hồi');
      return;
    }
    try {
      await replyAdminComplaint(selectedComplaint.id, { reply: replyText });
      message.success('Gửi phản hồi thành công!');
      setReplyText('');
      setDrawerOpen(false);
      fetchComplaints();
    } catch (error) {
      message.error('Gửi phản hồi thất bại');
    }
  };

  // ================= TABLE =================
  const columns: ColumnsType<Complaint> = [
    {
      title: 'Mã khiếu nại',
      dataIndex: 'id',
      key: 'id',
      width: 130,
      render: (value) => (
        <span className="font-semibold text-[#af101a] text-[15px]">
          #{value}
        </span>
      ),
    },
    {
      title: 'Mã đơn hàng',
      dataIndex: 'order_id',
      key: 'order_id',
      render: (value) => (
        <span className="font-semibold text-[#191c1e]">
          #{value}
        </span>
      ),
    },
    {
      title: 'Khách hàng',
      key: 'customer',
      render: (_, record) => (
        <div>
          <div className="font-semibold text-[15px] text-[#191c1e]">
            {record.users?.full_name || 'Không xác định'}
          </div>
          <div className="text-[13px] text-[#5b403d] mt-1">
            {record.users?.email || '—'}
          </div>
        </div>
      ),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (status) => renderStatus(status),
    },
    {
      title: 'Thao tác',
      key: 'action',
      align: 'right',
      render: (_, record) => (
        <Space>
          <Button
            type="text"
            icon={<Eye size={18} />}
            onClick={() => handleViewDetail(record)}
            className="text-[#5b403d] hover:!text-[#af101a]"
          />
        </Space>
      ),
    },
  ];

  return (
    <div className="p-4 md:p-6 max-w-[1600px] mx-auto space-y-6">
      
      {/* HEADER */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#191c1e] flex items-center gap-3">
            <AlertTriangle size={30} className="text-[#af101a]" />
            Quản Lý Khiếu Nại
          </h1>
          <p className="text-[#5b403d] mt-2">
            Theo dõi, phản hồi và xử lý các vấn đề từ phía khách hàng.
          </p>
        </div>

        <Space wrap>
          <Button
            size="large"
            onClick={fetchComplaints}
            icon={<RefreshCw size={16} />}
          >
            Làm mới
          </Button>
        </Space>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
        <Card className="rounded-2xl border border-[#ead0d0] shadow-sm">
          <Statistic
            title="Tổng khiếu nại"
            value={complaints.length}
            prefix={<AlertTriangle size={18} className="text-[#af101a]" />}
            valueStyle={{ color: '#191c1e', fontWeight: 'bold' }}
          />
        </Card>

        <Card className="rounded-2xl border border-[#ead0d0] shadow-sm">
          <Statistic
            title="Chờ xử lý"
            value={complaints.filter((c) => c.status === 'New').length}
            prefix={<Clock size={18} className="text-[#f97316]" />}
            valueStyle={{ color: '#f97316', fontWeight: 'bold' }}
          />
        </Card>

        <Card className="rounded-2xl border border-[#ead0d0] shadow-sm">
          <Statistic
            title="Đang xử lý"
            value={complaints.filter((c) => c.status === 'In Progress').length}
            prefix={<Settings size={18} className="text-blue-600" />}
            valueStyle={{ color: '#2563eb', fontWeight: 'bold' }}
          />
        </Card>

        <Card className="rounded-2xl border border-[#ead0d0] shadow-sm">
          <Statistic
            title="Đã giải quyết"
            value={complaints.filter((c) => c.status === 'Resolved').length}
            prefix={<CheckCircle size={18} className="text-green-600" />}
            valueStyle={{ color: '#16a34a', fontWeight: 'bold' }}
          />
        </Card>
      </div>

      {/* MAIN CONTENT */}
      <div className="bg-white border border-[#ead0d0] rounded-3xl shadow-sm overflow-hidden">
        
        {/* FILTER BAR */}
        <div className="p-5 border-b border-[#f1dede]">
          <div className="flex flex-wrap gap-3 items-center">
            <Input
              size="large"
              placeholder="Tìm theo mã KN, đơn hàng, tên khách..."
              prefix={<Search size={16} />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              allowClear
              className="max-w-md"
            />
            
            <Select
              size="large"
              value={statusFilter}
              onChange={(value) => setStatusFilter(value)}
              style={{ width: 220 }}
              options={[
                { value: 'All', label: 'Tất cả trạng thái' },
                { value: 'New', label: 'Chờ xử lý' },
                { value: 'In Progress', label: 'Đang xử lý' },
                { value: 'Resolved', label: 'Đã giải quyết' },
              ]}
            />
          </div>
        </div>

        {/* TABLE */}
        <div className="p-4">
          <Table
            rowKey="id"
            loading={loading}
            columns={columns}
            dataSource={filteredComplaints}
            scroll={{ x: 1000 }}
            pagination={{
              pageSize: 10,
              showSizeChanger: true
            }}
          />
        </div>
      </div>

      {/* DRAWER CHI TIẾT */}
      <Drawer
        title={<span className="text-[18px] font-bold text-[#191c1e]">Chi tiết khiếu nại #{selectedComplaint?.id || ''}</span>}
        open={drawerOpen}
        onClose={() => {
          setDrawerOpen(false);
          setReplyText('');
        }}
        width={550}
      >
        <Spin spinning={detailLoading}>
          {selectedComplaint && (
            <div className="space-y-6">
              
              {/* HEAD INFO */}
              <div className="grid grid-cols-2 gap-4 border-b border-[#f1dede] pb-5">
                <div>
                  <span className="text-[#5b403d] text-[13px] block mb-1">Mã đơn hàng</span>
                  <span className="font-bold text-[#191c1e] text-[15px]">#{selectedComplaint.order_id}</span>
                </div>
                <div>
                  <span className="text-[#5b403d] text-[13px] block mb-1">Trạng thái</span>
                  <div>{renderStatus(selectedComplaint.status)}</div>
                </div>
                <div className="col-span-2 mt-2">
                  <span className="text-[#5b403d] text-[13px] block mb-1">Khách hàng</span>
                  <div className="font-semibold text-[#191c1e] text-[15px]">{selectedComplaint.users?.full_name || '—'}</div>
                  <div className="text-sm text-[#5b403d]">{selectedComplaint.users?.email || '—'}</div>
                </div>
              </div>

              {/* CONTENT INFO */}
              <div>
                <span className="text-[#5b403d] text-[14px] font-semibold block mb-2">Nội dung khiếu nại:</span>
                <div className="bg-gray-50 border border-[#ead0d0] rounded-xl p-4 text-[#191c1e] text-[14px] whitespace-pre-line leading-relaxed shadow-sm">
                  {selectedComplaint.content}
                </div>
              </div>

              {/* IMAGES */}
              {selectedComplaint.images && selectedComplaint.images.length > 0 && (
                <div>
                  <span className="text-[#5b403d] text-[14px] font-semibold block mb-3">
                    Hình ảnh minh chứng ({selectedComplaint.images.length}):
                  </span>
                  <div className="flex flex-wrap gap-3">
                    <Image.PreviewGroup>
                      {selectedComplaint.images.map((imgUrl, idx) => (
                        <Image
                          key={idx}
                          src={imgUrl}
                          alt={`complaint-image-${idx}`}
                          width={100}
                          height={100}
                          className="object-cover rounded-xl border border-[#ead0d0] shadow-sm cursor-pointer hover:opacity-85 transition-opacity"
                        />
                      ))}
                    </Image.PreviewGroup>
                  </div>
                </div>
              )}

              {/* ACTIONS - CONFIRM */}
              {selectedComplaint.status === 'New' && (
                <div className="pt-4 border-t border-[#f1dede]">
                  <Button
                    type="primary"
                    size="large"
                    icon={<CheckCircle size={18} />}
                    onClick={handleConfirmComplaint}
                    className="w-full bg-[#af101a] hover:!bg-[#930010] border-none font-semibold rounded-xl h-[48px]"
                  >
                    Xác nhận tiếp nhận khiếu nại
                  </Button>
                </div>
              )}

              {/* ACTIONS - REPLY */}
              {selectedComplaint.status === 'In Progress' && (
                <div className="pt-4 border-t border-[#f1dede] space-y-3">
                  <h3 className="font-bold text-[#191c1e] text-[16px]">Phản hồi khách hàng</h3>
                  <TextArea
                    rows={5}
                    size="large"
                    className="rounded-xl border-[#ead0d0] p-3 text-[14px]"
                    placeholder="Nhập nội dung phản hồi, kết quả xử lý..."
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                  />
                  <Button
                    type="primary"
                    size="large"
                    icon={<Send size={16} />}
                    onClick={handleReplyComplaint}
                    className="bg-[#15803d] hover:!bg-[#166534] border-none font-semibold rounded-xl h-[48px] w-full"
                  >
                    Gửi phản hồi & Giải quyết
                  </Button>
                </div>
              )}

              {/* PREVIOUS REPLY READONLY */}
              {selectedComplaint.status === 'Resolved' && selectedComplaint.reply && (
                <div className="pt-4 border-t border-[#f1dede]">
                  <span className="text-[#15803d] text-[14px] font-semibold block mb-2">Phản hồi của hệ thống:</span>
                  <div className="bg-[#f0fdf4] border border-[#bbf7d0] rounded-xl p-4 text-[#166534] text-[14px] whitespace-pre-line shadow-sm">
                    {selectedComplaint.reply}
                  </div>
                </div>
              )}

            </div>
          )}
        </Spin>
      </Drawer>
    </div>
  );
}