import React, { useState } from 'react';
import {
  Table,
  Button,
  Input,
  Tag,
  Space,
  Modal,
  Form,
  InputNumber,
  Select,
  DatePicker,
  Switch,
  message,
  Tooltip,
  Popconfirm,
  Spin,
  Card,
  Statistic,
  Row,
  Col,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  Ticket,
  Search,
  Plus,
  Edit,
  Ban,
  CheckCircle,
  Clock,
  Trash2,
} from 'lucide-react';
import dayjs from 'dayjs';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import {
  getAdminVouchers,
  getAdminVoucherStats,
  createAdminVoucher,
  updateAdminVoucher,
  deleteAdminVoucher,
  toggleAdminVoucherStatus,
} from '../../services/adminVoucherService';

interface Voucher {
  id: number;
  code: string;
  description: string | null;
  discount_type: 'Percentage' | 'Fixed';
  discount_value: number;
  max_discount: number | null;
  min_order_value: number;
  start_date: string | null;
  end_date: string | null;
  status: string;
  quantity: number;
  used_count: number;
  created_at: string;
}

interface VoucherStats {
  totalVouchers: number;
  activeVouchers: number;
  expiredVouchers: number;
  disabledVouchers: number;
  totalQuantityRemaining: number;
  totalUsed: number;
  totalDiscountGiven: number;
}

export default function VouchersPage() {
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVoucher, setEditingVoucher] =
    useState<Voucher | null>(null);

  const [discountType, setDiscountType] = useState<
    'percentage' | 'fixed'
  >('percentage');

  const [form] = Form.useForm();

  const queryClient = useQueryClient();

  // ================= QUERIES =================
  const { data: vouchersResponse, isLoading } =
    useQuery({
      queryKey: ['admin-vouchers'],
      queryFn: getAdminVouchers,
    });

  const { data: statsResponse } = useQuery({
    queryKey: ['admin-voucher-stats'],
    queryFn: getAdminVoucherStats,
  });

  const vouchers: Voucher[] =
    vouchersResponse?.data || [];

  const stats: VoucherStats | null =
    statsResponse?.data || null;

  // ================= MUTATIONS =================
  const createMutation = useMutation({
    mutationFn: createAdminVoucher,

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['admin-vouchers'],
      });

      queryClient.invalidateQueries({
        queryKey: ['admin-voucher-stats'],
      });

      message.success(
        'Tạo mã giảm giá mới thành công!',
      );

      setIsModalOpen(false);
      form.resetFields();
    },

    onError: (error: any) => {
      message.error(
        error?.response?.data?.message ||
          'Lỗi khi tạo mã giảm giá.',
      );
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: number;
      data: any;
    }) => updateAdminVoucher(id, data),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['admin-vouchers'],
      });

      queryClient.invalidateQueries({
        queryKey: ['admin-voucher-stats'],
      });

      message.success(
        'Cập nhật mã giảm giá thành công!',
      );

      setIsModalOpen(false);
      form.resetFields();
    },

    onError: (error: any) => {
      message.error(
        error?.response?.data?.message ||
          'Lỗi khi cập nhật mã giảm giá.',
      );
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) =>
      deleteAdminVoucher(id),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['admin-vouchers'],
      });

      queryClient.invalidateQueries({
        queryKey: ['admin-voucher-stats'],
      });

      message.success(
        'Xóa mã giảm giá thành công!',
      );
    },

    onError: (error: any) => {
      message.error(
        error?.response?.data?.message ||
          'Lỗi khi xóa mã giảm giá.',
      );
    },
  });

  const toggleMutation = useMutation({
    mutationFn: (id: number) =>
      toggleAdminVoucherStatus(id),

    onSuccess: (data: any) => {
      queryClient.invalidateQueries({
        queryKey: ['admin-vouchers'],
      });

      queryClient.invalidateQueries({
        queryKey: ['admin-voucher-stats'],
      });

      message.success(
        data?.message ||
          'Thay đổi trạng thái thành công!',
      );
    },

    onError: (error: any) => {
      message.error(
        error?.response?.data?.message ||
          'Lỗi khi thay đổi trạng thái.',
      );
    },
  });

  // ================= HELPERS =================
  const formatPrice = (value: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(value || 0);
  };

  const numberFormatter = (
    value?: string | number,
  ) => {
    if (!value) return '';

    return `${value}`.replace(
      /\B(?=(\d{3})+(?!\d))/g,
      ',',
    );
  };

  const numberParser = (value?: string) => {
    if (!value) return 0;

    return Number(value.replace(/\$\s?|(,*)/g, ''));
  };

  const getDisplayStatus = (
    voucher: Voucher,
  ) => {
    if (
      voucher.status?.toLowerCase() ===
      'disabled'
    ) {
      return 'disabled';
    }

    if (
      voucher.end_date &&
      new Date(voucher.end_date) < new Date()
    ) {
      return 'expired';
    }

    if (
      voucher.status?.toLowerCase() ===
      'active'
    ) {
      return 'active';
    }

    return 'disabled';
  };

  // ================= FILTER =================
  const filteredVouchers = vouchers.filter(
    (voucher) => {
      const matchesSearch =
        voucher.code
          .toLowerCase()
          .includes(
            searchText.toLowerCase(),
          ) ||
        (voucher.description || '')
          .toLowerCase()
          .includes(
            searchText.toLowerCase(),
          );

      const displayStatus =
        getDisplayStatus(voucher);

      const matchesStatus =
        statusFilter === 'all' ||
        displayStatus === statusFilter;

      return (
        matchesSearch && matchesStatus
      );
    },
  );

  // ================= MODAL =================
  const showModal = (voucher?: Voucher) => {
    setEditingVoucher(voucher || null);

    if (voucher) {
      const currentType =
        voucher.discount_type ===
        'Percentage'
          ? 'percentage'
          : 'fixed';

      setDiscountType(currentType);

      form.setFieldsValue({
        code: voucher.code,
        description:
          voucher.description || '',
        discountType: currentType,
        discountValue:
          voucher.discount_value,
        maxDiscount:
          voucher.max_discount,
        minOrderValue:
          voucher.min_order_value,
        usageLimit: voucher.quantity,
        dates:
          voucher.start_date &&
          voucher.end_date
            ? [
                dayjs(
                  voucher.start_date,
                ),
                dayjs(voucher.end_date),
              ]
            : undefined,
        isActive:
          voucher.status?.toLowerCase() ===
          'active',
      });
    } else {
      form.resetFields();

      setDiscountType('percentage');

      form.setFieldsValue({
        discountType: 'percentage',
        isActive: true,
      });
    }

    setIsModalOpen(true);
  };

  const handleModalSave = async () => {
    try {
      const values =
        await form.validateFields();

      const payload = {
        code: values.code
          ?.trim()
          .toUpperCase(),

        description:
          values.description || '',

        discountType:
          values.discountType,

        discountValue:
          values.discountValue,

        maxDiscount:
          values.discountType ===
          'percentage'
            ? values.maxDiscount ||
              null
            : null,

        minOrderValue:
          values.minOrderValue || 0,

        usageLimit: values.usageLimit,

        startDate:
          values.dates?.[0]?.toISOString() ||
          null,

        endDate:
          values.dates?.[1]?.toISOString() ||
          null,

        isActive:
          values.isActive !== false,
      };

      if (editingVoucher) {
        updateMutation.mutate({
          id: editingVoucher.id,
          data: payload,
        });
      } else {
        createMutation.mutate(payload);
      }
    } catch (error) {
      console.error(error);
    }
  };

  // ================= COLUMNS =================
  const columns: ColumnsType<Voucher> = [
    {
      title: 'Mã Voucher',
      dataIndex: 'code',
      key: 'code',

      render: (
        text: string,
        record: Voucher,
      ) => (
        <div>
          <div className="font-bold font-mono text-[#af101a] text-base">
            {text}
          </div>

          <div className="text-xs text-gray-500 mt-1">
            {record.description || '—'}
          </div>
        </div>
      ),
    },

    {
      title: 'Giá trị giảm',
      key: 'value',

      render: (_, record) => {
        if (
          record.discount_type ===
          'Percentage'
        ) {
          return (
            <div>
              <span className="font-semibold">
                {record.discount_value}%
              </span>

              {record.max_discount && (
                <div className="text-xs text-gray-500 mt-1">
                  Tối đa:{' '}
                  {formatPrice(
                    record.max_discount,
                  )}
                </div>
              )}
            </div>
          );
        }

        return (
          <span className="font-semibold text-green-600">
            {formatPrice(
              record.discount_value,
            )}
          </span>
        );
      },
    },

    {
      title: 'Đơn tối thiểu',
      dataIndex: 'min_order_value',
      key: 'min_order_value',

      render: (value: number) => (
        <span className="text-gray-600">
          {value
            ? formatPrice(value)
            : '—'}
        </span>
      ),
    },

    {
      title: 'Thời gian',
      key: 'duration',

      render: (_, record) => (
        <div className="text-sm">
          <div>
            <span className="text-gray-400">
              Từ:
            </span>{' '}
            {record.start_date
              ? dayjs(
                  record.start_date,
                ).format(
                  'DD/MM/YYYY',
                )
              : '—'}
          </div>

          <div>
            <span className="text-gray-400">
              Đến:
            </span>{' '}
            {record.end_date
              ? dayjs(
                  record.end_date,
                ).format(
                  'DD/MM/YYYY',
                )
              : '—'}
          </div>
        </div>
      ),
    },

    {
      title: 'Sử dụng',
      key: 'usage',

      render: (_, record) => {
        const usedCount =
          record.used_count || 0;

        const total =
          record.quantity || 0;

        const percentage =
          total > 0
            ? Math.min(
                100,
                (usedCount / total) *
                  100,
              )
            : 0;

        return (
          <div className="w-32">
            <div className="flex justify-between text-xs mb-1">
              <span className="text-gray-500">
                Đã dùng:
              </span>

              <span className="font-semibold">
                {usedCount} / {total}
              </span>
            </div>

            <div className="w-full bg-gray-200 rounded-full h-1.5">
              <div
                className="bg-[#af101a] h-1.5 rounded-full transition-all duration-500"
                style={{
                  width: `${percentage}%`,
                }}
              />
            </div>
          </div>
        );
      },
    },

    {
      title: 'Trạng thái',
      key: 'status',

      render: (_, record) => {
        const displayStatus =
          getDisplayStatus(record);

        let color:
          | 'success'
          | 'warning'
          | 'default' = 'default';

        let icon = <Ban size={12} />;
        let label = 'Vô hiệu';

        if (displayStatus === 'active') {
          color = 'success';
          icon = (
            <CheckCircle size={12} />
          );
          label = 'Hoạt động';
        }

        if (
          displayStatus === 'expired'
        ) {
          color = 'warning';
          icon = <Clock size={12} />;
          label = 'Hết hạn';
        }

        return (
          <Tag
            color={color}
            className="flex items-center gap-1 w-max"
          >
            {icon}
            {label}
          </Tag>
        );
      },
    },

    {
      title: 'Thao tác',
      key: 'action',
      align: 'right',

      render: (_, record) => {
        const displayStatus =
          getDisplayStatus(record);

        return (
          <Space size="middle">
            <Tooltip title="Chỉnh sửa">
              <Button
                type="text"
                icon={<Edit size={16} />}
                onClick={() =>
                  showModal(record)
                }
                className="text-[#00799c] hover:bg-[#e0f2fe]"
              />
            </Tooltip>

            {displayStatus !==
              'expired' && (
              <Popconfirm
                title={
                  displayStatus ===
                  'active'
                    ? 'Vô hiệu hóa voucher này?'
                    : 'Kích hoạt lại voucher?'
                }
                onConfirm={() =>
                  toggleMutation.mutate(
                    record.id,
                  )
                }
                okText="Đồng ý"
                cancelText="Hủy"
              >
                <Tooltip
                  title={
                    displayStatus ===
                    'active'
                      ? 'Vô hiệu hóa'
                      : 'Kích hoạt'
                  }
                >
                  <Button
                    type="text"
                    danger={
                      displayStatus ===
                      'active'
                    }
                    icon={
                      <Ban size={16} />
                    }
                  />
                </Tooltip>
              </Popconfirm>
            )}

            <Popconfirm
              title="Xóa voucher này? (Chỉ xóa được nếu chưa có đơn hàng sử dụng)"
              onConfirm={() =>
                deleteMutation.mutate(
                  record.id,
                )
              }
              okText="Xóa"
              cancelText="Hủy"
              okButtonProps={{
                danger: true,
              }}
            >
              <Tooltip title="Xóa">
                <Button
                  type="text"
                  danger
                  icon={
                    <Trash2 size={16} />
                  }
                />
              </Tooltip>
            </Popconfirm>
          </Space>
        );
      },
    },
  ];

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-[1600px] mx-auto">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-[#191c1e] flex items-center gap-2">
            <Ticket
              className="text-[#af101a]"
              size={28}
            />

            Quản Lý Mã Giảm Giá
          </h1>

          <p className="text-[#5b403d] mt-1 text-sm">
            Tạo mới, theo dõi và quản lý
            các chiến dịch giảm giá.
          </p>
        </div>

        <Button
          type="primary"
          size="large"
          icon={<Plus size={18} />}
          className="bg-[#af101a] hover:bg-[#930010] font-semibold"
          onClick={() => showModal()}
        >
          Tạo Voucher Mới
        </Button>
      </div>

      {/* STATS */}
      {stats && (
        <Row gutter={[16, 16]}>
          <Col xs={12} sm={6}>
            <Card
              size="small"
              className="border border-[#d8dadc] shadow-sm"
            >
              <Statistic
                title={
                  <span className="text-xs text-gray-500">
                    Tổng Voucher
                  </span>
                }
                value={stats.totalVouchers}
                valueStyle={{
                  fontSize: 24,
                  fontWeight: 700,
                  color: '#191c1e',
                }}
              />
            </Card>
          </Col>

          <Col xs={12} sm={6}>
            <Card
              size="small"
              className="border border-[#d8dadc] shadow-sm"
            >
              <Statistic
                title={
                  <span className="text-xs text-gray-500">
                    Đang hoạt động
                  </span>
                }
                value={stats.activeVouchers}
                valueStyle={{
                  fontSize: 24,
                  fontWeight: 700,
                  color: '#52c41a',
                }}
              />
            </Card>
          </Col>

          <Col xs={12} sm={6}>
            <Card
              size="small"
              className="border border-[#d8dadc] shadow-sm"
            >
              <Statistic
                title={
                  <span className="text-xs text-gray-500">
                    Tổng lượt sử dụng
                  </span>
                }
                value={stats.totalUsed}
                valueStyle={{
                  fontSize: 24,
                  fontWeight: 700,
                  color: '#1890ff',
                }}
              />
            </Card>
          </Col>

          <Col xs={12} sm={6}>
            <Card
              size="small"
              className="border border-[#d8dadc] shadow-sm"
            >
              <Statistic
                title={
                  <span className="text-xs text-gray-500">
                    Tổng tiền giảm giá
                  </span>
                }
                value={
                  stats.totalDiscountGiven
                }
                valueStyle={{
                  fontSize: 24,
                  fontWeight: 700,
                  color: '#af101a',
                }}
                formatter={(value) =>
                  formatPrice(
                    Number(value),
                  )
                }
              />
            </Card>
          </Col>
        </Row>
      )}

      {/* FILTER */}
      <div className="bg-white border border-[#d8dadc] p-4 rounded-xl shadow-sm flex flex-col sm:flex-row gap-4">
        <Input
          prefix={
            <Search
              size={16}
              className="text-gray-400"
            />
          }
          placeholder="Tìm kiếm theo mã voucher hoặc mô tả..."
          className="w-full sm:max-w-md rounded-lg"
          value={searchText}
          onChange={(e) =>
            setSearchText(
              e.target.value,
            )
          }
          allowClear
        />

        <Select
          value={statusFilter}
          onChange={setStatusFilter}
          className="w-full sm:w-48"
          options={[
            {
              value: 'all',
              label:
                'Tất cả trạng thái',
            },
            {
              value: 'active',
              label:
                'Đang hoạt động',
            },
            {
              value: 'expired',
              label: 'Đã hết hạn',
            },
            {
              value: 'disabled',
              label:
                'Đã vô hiệu',
            },
          ]}
        />
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-xl shadow-sm border border-[#d8dadc] overflow-hidden">
        <Spin spinning={isLoading}>
          <Table
            columns={columns}
            dataSource={
              filteredVouchers
            }
            rowKey="id"
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
            }}
            scroll={{ x: 1000 }}
            locale={{
              emptyText:
                'Chưa có mã giảm giá nào',
            }}
          />
        </Spin>
      </div>

      {/* MODAL */}
      <Modal
        title={
          <span className="text-lg font-bold flex items-center gap-2">
            <Ticket
              size={20}
              className="text-[#af101a]"
            />

            {editingVoucher
              ? 'Chỉnh Sửa Voucher'
              : 'Tạo Voucher Mới'}
          </span>
        }
        open={isModalOpen}
        onOk={handleModalSave}
        onCancel={() =>
          setIsModalOpen(false)
        }
        okText={
          editingVoucher
            ? 'Cập Nhật'
            : 'Tạo Mới'
        }
        cancelText="Hủy"
        width={700}
        destroyOnClose
        okButtonProps={{
          className:
            'bg-[#af101a] hover:bg-[#930010]',
          loading:
            createMutation.isPending ||
            updateMutation.isPending,
        }}
      >
        <Form
          form={form}
          layout="vertical"
          className="mt-4"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
            <Form.Item
              name="code"
              label="Mã Voucher"
              rules={[
                {
                  required: true,
                  message:
                    'Vui lòng nhập mã voucher',
                },
              ]}
            >
              <Input
                placeholder="Ví dụ: SUMMER2024"
                className="font-mono uppercase text-lg"
              />
            </Form.Item>

            <Form.Item
              name="isActive"
              label="Trạng thái"
              valuePropName="checked"
            >
              <Switch
                checkedChildren="Hoạt động"
                unCheckedChildren="Vô hiệu"
              />
            </Form.Item>

            <Form.Item
              name="description"
              label="Mô tả"
              className="md:col-span-2"
            >
              <Input.TextArea
                rows={2}
                placeholder="Ghi chú nội bộ hoặc mô tả cho khách hàng..."
              />
            </Form.Item>

            {/* CONFIG */}
            <div className="md:col-span-2 mt-4 mb-2 border-b pb-2">
              <h4 className="font-bold text-[#191c1e] uppercase text-xs tracking-wider">
                Cấu hình giảm giá
              </h4>
            </div>

            <Form.Item
              name="discountType"
              label="Loại giảm giá"
              rules={[
                {
                  required: true,
                },
              ]}
            >
              <Select
                onChange={(
                  value:
                    | 'percentage'
                    | 'fixed',
                ) =>
                  setDiscountType(value)
                }
                options={[
                  {
                    value: 'percentage',
                    label:
                      'Phần trăm (%)',
                  },
                  {
                    value: 'fixed',
                    label:
                      'Cố định (VNĐ)',
                  },
                ]}
              />
            </Form.Item>

            <Form.Item
              name="discountValue"
              label="Giá trị giảm"
              rules={[
                {
                  required: true,
                  message: 'Bắt buộc',
                },
              ]}
            >
              <InputNumber
                className="w-full"
                min={1}
                controls={false}
                max={
                  discountType ===
                  'percentage'
                    ? 100
                    : undefined
                }
                addonAfter={
                  discountType ===
                  'percentage'
                    ? '%'
                    : '₫'
                }
                placeholder={
                  discountType ===
                  'percentage'
                    ? 'VD: 10'
                    : 'VD: 50000'
                }
                formatter={numberFormatter}
                parser={numberParser}
              />
            </Form.Item>

            {discountType ===
              'percentage' && (
              <Form.Item
                name="maxDiscount"
                label="Giảm tối đa"
                tooltip="Số tiền giảm tối đa cho voucher phần trăm"
              >
                <InputNumber
                  className="w-full"
                  min={0}
                  controls={false}
                  addonAfter="₫"
                  placeholder="VD: 100000"
                  formatter={
                    numberFormatter
                  }
                  parser={numberParser}
                />
              </Form.Item>
            )}

            <Form.Item
              name="minOrderValue"
              label="Đơn hàng tối thiểu (VNĐ)"
              rules={[
                {
                  required: true,
                },
              ]}
            >
              <InputNumber
                className="w-full"
                min={0}
                controls={false}
                placeholder="0 = không giới hạn"
                formatter={
                  numberFormatter
                }
                parser={numberParser}
              />
            </Form.Item>

            {/* TIME */}
            <div className="md:col-span-2 mt-4 mb-2 border-b pb-2">
              <h4 className="font-bold text-[#191c1e] uppercase text-xs tracking-wider">
                Sử dụng & Thời hạn
              </h4>
            </div>

            <Form.Item
              name="usageLimit"
              label="Tổng lượt sử dụng"
              rules={[
                {
                  required: true,
                },
              ]}
            >
              <InputNumber
                className="w-full"
                min={1}
                controls={false}
                placeholder="Số lượt tối đa voucher có thể được sử dụng"
                formatter={
                  numberFormatter
                }
                parser={numberParser}
              />
            </Form.Item>

            <Form.Item
              name="dates"
              label="Thời gian hiệu lực"
              rules={[
                {
                  required: true,
                  message:
                    'Vui lòng chọn thời gian',
                },
              ]}
            >
              <DatePicker.RangePicker
                className="w-full"
                format="DD/MM/YYYY"
              />
            </Form.Item>
          </div>
        </Form>
      </Modal>
    </div>
  );
}