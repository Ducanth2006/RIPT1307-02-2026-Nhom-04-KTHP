import React, {
  useEffect,
  useState,
} from 'react';

import {
  Table,
  Tag,
  Space,
  Button,
  Drawer,
  Typography,
  message,
  Input,
  Spin,
  Card,
  Row,
  Col,
} from 'antd';

import type { ColumnsType } from 'antd/es/table';

import {
  Eye,
  CheckCircle,
  Send,
  AlertTriangle,
} from 'lucide-react';

import {
  getAdminComplaints,
  getAdminComplaintById,
  confirmAdminComplaint,
  replyAdminComplaint,
} from '../../services/adminComplaintService';

const { Title, Text, Paragraph } =
  Typography;

const { TextArea } = Input;

interface Complaint {
  id: number;
  order_id: number;

  title: string;
  content: string;

  status:
    | 'New'
    | 'In Progress'
    | 'Resolved'
    | 'Closed';

  created_at: string;

  users?: {
    full_name?: string;
    email?: string;
  };

  reply?: string;
}

export default function ComplaintsPage() {
  const [complaints, setComplaints] = useState<
    Complaint[]
  >([]);

  const [loading, setLoading] =
    useState(false);

  const [drawerOpen, setDrawerOpen] =
    useState(false);

  const [selectedComplaint, setSelectedComplaint] =
    useState<Complaint | null>(null);

  const [detailLoading, setDetailLoading] =
    useState(false);

  const [replyText, setReplyText] =
    useState('');

  // ================= FETCH =================
  const fetchComplaints = async () => {
    try {
      setLoading(true);

      const data =
        await getAdminComplaints();

      setComplaints(data?.data || []);
    } catch (error) {
      message.error(
        'Không thể tải danh sách khiếu nại',
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, []);

  // ================= STATUS TAG =================
  const renderStatus = (
    status: Complaint['status'],
  ) => {
    switch (status) {
      case 'New':
        return (
          <Tag color="orange">
            Chờ xử lý
          </Tag>
        );

      case 'In Progress':
        return (
          <Tag color="blue">
            Đang xử lý
          </Tag>
        );

      case 'Resolved':
        return (
          <Tag color="green">
            Đã giải quyết
          </Tag>
        );

      case 'Closed':
        return (
          <Tag color="default">
            Đã đóng
          </Tag>
        );

      default:
        return <Tag>{status}</Tag>;
    }
  };

  // ================= VIEW DETAIL =================
  const handleViewDetail = async (
    complaint: Complaint,
  ) => {
    try {
      setDetailLoading(true);
      setDrawerOpen(true);

      const data =
        await getAdminComplaintById(
          complaint.id,
        );

      setSelectedComplaint(data?.data);
    } catch (error) {
      message.error(
        'Không thể tải chi tiết khiếu nại',
      );
    } finally {
      setDetailLoading(false);
    }
  };

  // ================= CONFIRM =================
  const handleConfirmComplaint =
    async () => {
      if (!selectedComplaint) return;

      try {
        await confirmAdminComplaint(
          selectedComplaint.id,
        );

        message.success(
          'Đã xác nhận khiếu nại thành công!',
        );

        setDrawerOpen(false);

        fetchComplaints();
      } catch (error) {
        message.error(
          'Xác nhận khiếu nại thất bại',
        );
      }
    };

  // ================= REPLY =================
  const handleReplyComplaint =
    async () => {
      if (!selectedComplaint) return;

      if (!replyText.trim()) {
        message.warning(
          'Vui lòng nhập nội dung phản hồi',
        );

        return;
      }

      try {
        await replyAdminComplaint(
          selectedComplaint.id,
          {
            reply: replyText,
          }
        );

        message.success(
          'Gửi phản hồi thành công!',
        );

        setReplyText('');

        setDrawerOpen(false);

        fetchComplaints();
      } catch (error) {
        message.error(
          'Gửi phản hồi thất bại',
        );
      }
    };

  // ================= TABLE =================
  const columns: ColumnsType<Complaint> =
    [
      {
        title: 'Mã khiếu nại',
        dataIndex: 'id',
        key: 'id',
        width: 140,

        render: (value) => (
          <span className="font-semibold text-[#af101a]">
            #{value}
          </span>
        ),
      },

      {
        title: 'Mã đơn hàng',
        dataIndex: 'order_id',
        key: 'order_id',

        render: (value) => (
          <span className="font-medium">
            #{value}
          </span>
        ),
      },

      {
        title: 'Khách hàng',
        key: 'customer',

        render: (_, record) => (
          <div>
            <div className="font-medium">
              {record.users?.full_name ||
                'Không có'}
            </div>

            <div className="text-xs text-gray-500">
              {record.users?.email || '—'}
            </div>
          </div>
        ),
      },

      {
        title: 'Tiêu đề',
        dataIndex: 'title',
        key: 'title',
      },

      {
        title: 'Trạng thái',
        dataIndex: 'status',
        key: 'status',

        render: (status) =>
          renderStatus(status),
      },

      {
        title: 'Thao tác',
        key: 'action',
        align: 'center',

        render: (_, record) => (
          <Space>
            <Button
              type="primary"
              icon={<Eye size={16} />}
              onClick={() =>
                handleViewDetail(record)
              }
            >
              Xem
            </Button>
          </Space>
        ),
      },
    ];

  return (
    <div className="p-6 space-y-6">
      {/* HEADER */}
      <div>
        <Title
          level={2}
          className="!mb-1"
        >
          <div className="flex items-center gap-2">
            <AlertTriangle
              className="text-[#af101a]"
              size={28}
            />

            Quản lý khiếu nại
          </div>
        </Title>

        <Text type="secondary">
          Theo dõi và xử lý các khiếu nại
          từ khách hàng
        </Text>
      </div>

      {/* STATS */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <div className="text-sm text-gray-500">
              Tổng khiếu nại
            </div>

            <div className="text-3xl font-bold mt-2">
              {complaints.length}
            </div>
          </Card>
        </Col>

        <Col xs={24} sm={12} md={6}>
          <Card>
            <div className="text-sm text-gray-500">
              Chờ xử lý
            </div>

            <div className="text-3xl font-bold mt-2 text-orange-500">
              {
                complaints.filter(
                  (c) =>
                    c.status === 'New',
                ).length
              }
            </div>
          </Card>
        </Col>

        <Col xs={24} sm={12} md={6}>
          <Card>
            <div className="text-sm text-gray-500">
              Đang xử lý
            </div>

            <div className="text-3xl font-bold mt-2 text-blue-500">
              {
                complaints.filter(
                  (c) =>
                    c.status ===
                    'In Progress',
                ).length
              }
            </div>
          </Card>
        </Col>

        <Col xs={24} sm={12} md={6}>
          <Card>
            <div className="text-sm text-gray-500">
              Đã giải quyết
            </div>

            <div className="text-3xl font-bold mt-2 text-green-500">
              {
                complaints.filter(
                  (c) =>
                    c.status ===
                    'Resolved',
                ).length
              }
            </div>
          </Card>
        </Col>
      </Row>

      {/* TABLE */}
      <Card>
        <Table
          rowKey="id"
          loading={loading}
          columns={columns}
          dataSource={complaints}
          pagination={{
            pageSize: 10,
          }}
        />
      </Card>

      {/* DRAWER */}
      <Drawer
        title="Chi tiết khiếu nại"
        open={drawerOpen}
        onClose={() => {
          setDrawerOpen(false);
          setReplyText('');
        }}
        width={520}
      >
        <Spin spinning={detailLoading}>
          {selectedComplaint && (
            <div className="space-y-5">
              <div>
                <Text strong>
                  Mã khiếu nại:
                </Text>

                <div>
                  #{selectedComplaint.id}
                </div>
              </div>

              <div>
                <Text strong>
                  Đơn hàng:
                </Text>

                <div>
                  #
                  {
                    selectedComplaint.order_id
                  }
                </div>
              </div>

              <div>
                <Text strong>
                  Khách hàng:
                </Text>

                <div>
                  {selectedComplaint.users
                    ?.full_name || '—'}
                </div>

                <div className="text-gray-500 text-sm">
                  {selectedComplaint.users
                    ?.email || '—'}
                </div>
              </div>

              <div>
                <Text strong>
                  Tiêu đề:
                </Text>

                <div>
                  {
                    selectedComplaint.title
                  }
                </div>
              </div>

              <div>
                <Text strong>
                  Nội dung:
                </Text>

                <Paragraph className="mt-2 whitespace-pre-line">
                  {
                    selectedComplaint.content
                  }
                </Paragraph>
              </div>

              <div>
                <Text strong>
                  Trạng thái:
                </Text>

                <div className="mt-2">
                  {renderStatus(
                    selectedComplaint.status,
                  )}
                </div>
              </div>

              {/* CONFIRM */}
              {selectedComplaint.status ===
                'New' && (
                <Button
                  type="primary"
                  size="large"
                  icon={
                    <CheckCircle
                      size={18}
                    />
                  }
                  onClick={
                    handleConfirmComplaint
                  }
                  className="w-full"
                >
                  Xác nhận khiếu nại
                </Button>
              )}

              {/* REPLY */}
              {selectedComplaint.status ===
                'In Progress' && (
                <div className="space-y-3">
                  <Title
                    level={5}
                    className="!mb-2"
                  >
                    Hồi đáp khách hàng
                  </Title>

                  <TextArea
                    rows={5}
                    placeholder="Nhập nội dung phản hồi..."
                    value={replyText}
                    onChange={(e) =>
                      setReplyText(
                        e.target.value,
                      )
                    }
                  />

                  <Button
                    type="primary"
                    icon={
                      <Send size={16} />
                    }
                    onClick={
                      handleReplyComplaint
                    }
                    className="bg-green-600"
                  >
                    Gửi phản hồi
                  </Button>
                </div>
              )}
            </div>
          )}
        </Spin>
      </Drawer>
    </div>
  );
}