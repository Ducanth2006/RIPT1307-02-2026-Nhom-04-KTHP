import React, {
  useEffect,
  useMemo,
  useState
} from 'react';

import dayjs from 'dayjs';

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
  Progress,
  Alert,
  Card,
  Statistic,
  Row,
  Col,
  Empty
} from 'antd';

import type { ColumnsType } from 'antd/es/table';

import {
  Ticket,
  Search,
  Plus,
  Edit,
  Trash2,
  CheckCircle,
  Clock,
  Ban,
  RefreshCw
} from 'lucide-react';

import axiosInstance from '../../utils/axiosConfig';
import ip from '../../utils/ip';

const { RangePicker } = DatePicker;

interface Voucher {
  id: string;
  code: string;
  description: string;

  discountType:
    | 'percentage'
    | 'fixed';

  discountValue: number;

  maxDiscount?: number;

  minOrderValue: number;

  usageLimit: number;

  usedCount: number;

  quantityRemaining: number;

  startDate: string;

  endDate: string;

  isActive: boolean;
}

export default function VouchersPage() {
  const [messageApi, contextHolder] =
    message.useMessage();

  const [vouchers, setVouchers] =
    useState<Voucher[]>([]);

  const [loading, setLoading] =
    useState(false);

  const [searchText, setSearchText] =
    useState('');

  const [statusFilter, setStatusFilter] =
    useState('all');

  const [isModalOpen, setIsModalOpen] =
    useState(false);

  const [editingVoucher, setEditingVoucher] =
    useState<Voucher | null>(
      null
    );

  const [discountType, setDiscountType] =
    useState<
      'percentage' | 'fixed'
    >('percentage');

  const [form] = Form.useForm();

  // =========================
  // FORMAT
  // =========================

  const formatDate = (
    value?: string
  ) => {
    if (!value) return '---';

    const date = new Date(value);

    if (isNaN(date.getTime())) {
      return '---';
    }

    return dayjs(date).format(
      'DD/MM/YYYY'
    );
  };

  // =========================
  // API
  // =========================

  const taiDanhSachVoucher =
    async () => {
      try {
        setLoading(true);

        const response =
          await axiosInstance.get(
            `${ip}/admin/vouchers`
          );

        const data =
          response.data?.data || [];

        const normalizedData =
          data.map((item: any) => ({
            id: String(item.id),

            code:
              item.code || '',

            description:
              item.description || '',

            discountType:
              item.discount_type ===
              'fixed'
                ? 'fixed'
                : 'percentage',

            discountValue: Number(
              item.discount_value || 0
            ),

            maxDiscount: Number(
              item.max_discount || 0
            ),

            minOrderValue: Number(
              item.min_order_value || 0
            ),

            usageLimit: Number(
              item.quantity || 0
            ),

            usedCount: Number(
              item.used_count || 0
            ),

            quantityRemaining:
              Number(item.quantity || 0) -
              Number(
                item.used_count || 0
              ),

            startDate:
              item.start_date || '',

            endDate:
              item.end_date || '',

            isActive:
              item.is_active ??
              true
          }));

        setVouchers(
          normalizedData
        );
      } catch (error: any) {
        console.log(error);

        messageApi.error(
          error.response?.data
            ?.message ||
            'Không thể tải danh sách voucher!'
        );
      } finally {
        setLoading(false);
      }
    };

  useEffect(() => {
    taiDanhSachVoucher();
  }, []);

  // =========================
  // STATS
  // =========================

  const stats = useMemo(() => {
    const totalVouchers =
      vouchers.length;

    const activeVouchers =
      vouchers.filter(
        (v) =>
          v.isActive &&
          dayjs().isBefore(
            dayjs(v.endDate)
          )
      ).length;

    const totalUsed =
      vouchers.reduce(
        (sum, item) =>
          sum + item.usedCount,
        0
      );

    const totalQuantityRemaining =
      vouchers.reduce(
        (sum, item) =>
          sum +
          item.quantityRemaining,
        0
      );

    const expiringSoon =
      vouchers.filter((v) => {
        const diff =
          dayjs(
            v.endDate
          ).diff(
            dayjs(),
            'day'
          );

        return (
          diff >= 0 &&
          diff <= 7
        );
      });

    return {
      totalVouchers,
      activeVouchers,
      totalUsed,
      totalQuantityRemaining,
      expiringSoon
    };
  }, [vouchers]);

  // =========================
  // FILTER
  // =========================

  const filteredVouchers =
    useMemo(() => {
      return vouchers.filter(
        (v) => {
          const matchSearch =
            v.code
              .toLowerCase()
              .includes(
                searchText.toLowerCase()
              );

          let currentStatus =
            'active';

          if (
            dayjs().isAfter(
              dayjs(v.endDate)
            )
          ) {
            currentStatus =
              'expired';
          } else if (
            !v.isActive
          ) {
            currentStatus =
              'disabled';
          }

          const matchStatus =
            statusFilter ===
              'all' ||
            currentStatus ===
              statusFilter;

          return (
            matchSearch &&
            matchStatus
          );
        }
      );
    }, [
      vouchers,
      searchText,
      statusFilter
    ]);

  // =========================
  // MODAL
  // =========================

  const showModal = (
    voucher?: Voucher
  ) => {
    if (voucher) {
      setEditingVoucher(
        voucher
      );

      setDiscountType(
        voucher.discountType
      );

      form.setFieldsValue({
        code: voucher.code,

        description:
          voucher.description,

        discountType:
          voucher.discountType,

        discountValue:
          voucher.discountValue,

        maxDiscount:
          voucher.maxDiscount,

        minOrderValue:
          voucher.minOrderValue,

        usageLimit:
          voucher.usageLimit,

        isActive:
          voucher.isActive,

        dates: [
          dayjs(
            voucher.startDate
          ),

          dayjs(
            voucher.endDate
          )
        ]
      });
    } else {
      setEditingVoucher(
        null
      );

      setDiscountType(
        'percentage'
      );

      form.resetFields();

      form.setFieldsValue({
        discountType:
          'percentage',

        isActive: true
      });
    }

    setIsModalOpen(true);
  };

  // =========================
  // CREATE / UPDATE
  // =========================

  const handleSave =
    async () => {
      try {
        const values =
          await form.validateFields();

        setLoading(true);

        const payload = {
          code: values.code,

          description:
            values.description,

          discount_type:
            values.discountType,

          discount_value:
            Number(
              values.discountValue
            ),

          max_discount:
            values.discountType ===
            'percentage'
              ? Number(
                  values.maxDiscount || 0
                )
              : null,

          min_order_value:
            Number(
              values.minOrderValue
            ),

          quantity: Number(
            values.usageLimit
          ),

          start_date:
            values.dates[0].format(
              'YYYY-MM-DD'
            ),

          end_date:
            values.dates[1].format(
              'YYYY-MM-DD'
            ),

          is_active:
            values.isActive
        };

        if (editingVoucher) {
          await axiosInstance.put(
            `${ip}/admin/vouchers/${editingVoucher.id}`,
            payload
          );

          messageApi.success(
            'Cập nhật voucher thành công!'
          );
        } else {
          await axiosInstance.post(
            `${ip}/admin/vouchers`,
            payload
          );

          messageApi.success(
            'Tạo voucher thành công!'
          );
        }

        setIsModalOpen(false);

        form.resetFields();

        await taiDanhSachVoucher();
      } catch (error: any) {
        console.log(error);

        messageApi.error(
          error.response?.data
            ?.message ||
            'Có lỗi xảy ra!'
        );
      } finally {
        setLoading(false);
      }
    };

  // =========================
  // TOGGLE
  // =========================

  const handleToggle =
    async (
      checked: boolean,
      record: Voucher
    ) => {
      try {
        await axiosInstance.patch(
          `${ip}/admin/vouchers/${record.id}/toggle`,
          {
            is_active:
              checked
          }
        );

        messageApi.success(
          checked
            ? `Đã kích hoạt voucher ${record.code}`
            : `Đã vô hiệu hóa voucher ${record.code}`
        );

        await taiDanhSachVoucher();
      } catch (error: any) {
        console.log(error);

        messageApi.error(
          error.response?.data
            ?.message ||
            'Không thể cập nhật trạng thái!'
        );
      }
    };

  // =========================
  // DELETE
  // =========================

  const handleDelete =
    async (
      record: Voucher
    ) => {
      try {
        await axiosInstance.delete(
          `${ip}/admin/vouchers/${record.id}`
        );

        messageApi.success(
          'Xóa voucher thành công!'
        );

        await taiDanhSachVoucher();
      } catch (error: any) {
        console.log(error);

        messageApi.error(
          error.response?.data
            ?.message ||
            'Không thể xóa voucher!'
        );
      }
    };

  // =========================
  // TABLE
  // =========================

  const columns: ColumnsType<Voucher> =
    [
      {
        title: 'Mã Voucher',

        dataIndex: 'code',

        render: (
          text,
          record
        ) => (
          <div>
            <div className="font-bold text-[#af101a] text-base font-mono">
              {text}
            </div>

            <div className="text-xs text-gray-500 mt-1">
              {
                record.description
              }
            </div>
          </div>
        )
      },

      {
        title:
          'Giảm giá',

        render: (
          _,
          record
        ) => {
          if (
            record.discountType ===
            'percentage'
          ) {
            return (
              <div>
                <div className="font-semibold">
                  {
                    record.discountValue
                  }
                  %
                </div>

                {record.maxDiscount ? (
                  <div className="text-xs text-gray-500">
                    Tối đa:{' '}
                    {record.maxDiscount.toLocaleString()}
                    đ
                  </div>
                ) : null}
              </div>
            );
          }

          return (
            <div className="font-semibold text-green-600">
              {record.discountValue.toLocaleString()}
              đ
            </div>
          );
        }
      },

      {
        title:
          'Đơn tối thiểu',

        dataIndex:
          'minOrderValue',

        render: (
          value
        ) => (
          <span>
            {value.toLocaleString()}
            đ
          </span>
        )
      },

      // ======================
      // FIX CỘT THỜI GIAN
      // ======================

      {
        title:
          'Thời gian',

        width: 260,

        render: (
          _,
          record
        ) => (
          <div className="text-sm leading-6">
            <div>
              <span className="text-gray-400">
                Bắt đầu:
              </span>{' '}
              <span className="font-medium">
                {formatDate(
                  record.startDate
                )}
              </span>
            </div>

            <div>
              <span className="text-gray-400">
                Kết thúc:
              </span>{' '}
              <span className="font-medium">
                {formatDate(
                  record.endDate
                )}
              </span>
            </div>
          </div>
        )
      },

      {
        title:
          'Lượt dùng',

        render: (
          _,
          record
        ) => {
          const total =
            record.usedCount +
            record.quantityRemaining;

          const percent =
            total > 0
              ? (record.usedCount /
                  total) *
                100
              : 0;

          return (
            <div className="min-w-[180px]">
              <div className="flex justify-between text-xs mb-1">
                <span>
                  {
                    record.usedCount
                  }{' '}
                  / {total}
                </span>

                <span className="font-medium">
                  {percent.toFixed(
                    0
                  )}
                  %
                </span>
              </div>

              <Progress
                percent={
                  percent
                }
                showInfo={
                  false
                }
                strokeColor="#af101a"
              />
            </div>
          );
        }
      },

      {
        title:
          'Trạng thái',

        render: (
          _,
          record
        ) => {
          const expired =
            dayjs().isAfter(
              dayjs(
                record.endDate
              )
            );

          if (expired) {
            return (
              <Tag
                color="warning"
                className="flex items-center gap-1 w-max"
              >
                <Clock
                  size={
                    12
                  }
                />
                Hết hạn
              </Tag>
            );
          }

          if (
            !record.isActive
          ) {
            return (
              <Tag
                color="default"
                className="flex items-center gap-1 w-max"
              >
                <Ban
                  size={
                    12
                  }
                />
                Vô hiệu hóa
              </Tag>
            );
          }

          return (
            <Tag
              color="success"
              className="flex items-center gap-1 w-max"
            >
              <CheckCircle
                size={
                  12
                }
              />
              Hoạt động
            </Tag>
          );
        }
      },

      {
        title:
          'Bật / Tắt',

        render: (
          _,
          record
        ) => (
          <Switch
            checked={
              record.isActive
            }
            disabled={dayjs().isAfter(
              dayjs(
                record.endDate
              )
            )}
            onChange={(
              checked
            ) =>
              handleToggle(
                checked,
                record
              )
            }
          />
        )
      },

      // ======================
      // ĐÃ XOÁ NÚT THỐNG KÊ
      // ======================

      {
        title:
          'Thao tác',

        key: 'action',

        align: 'right',

        render: (
          _,
          record
        ) => (
          <Space>
            <Tooltip title="Chỉnh sửa">
              <Button
                type="text"
                icon={
                  <Edit
                    size={
                      16
                    }
                  />
                }
                onClick={() =>
                  showModal(
                    record
                  )
                }
              />
            </Tooltip>

            <Popconfirm
              title="Bạn có chắc muốn xóa voucher này?"
              okText="Xóa"
              cancelText="Hủy"
              okButtonProps={{
                danger: true
              }}
              onConfirm={() =>
                handleDelete(
                  record
                )
              }
            >
              <Tooltip title="Xóa voucher">
                <Button
                  danger
                  type="text"
                  icon={
                    <Trash2
                      size={
                        16
                      }
                    />
                  }
                />
              </Tooltip>
            </Popconfirm>
          </Space>
        )
      }
    ];

  return (
    <div className="p-6">
      {contextHolder}

      <Card
        className="shadow-sm border-2 border-gray-300"
        title={
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Ticket
                size={24}
                className="text-[#af101a]"
              />
              Quản Lý Voucher
            </h1>

            <p className="text-gray-500 text-sm mt-1">
              Quản lý mã giảm giá và chương trình khuyến mãi
            </p>
          </div>
        }
        extra={
          <Space>
            <Button
              onClick={
                taiDanhSachVoucher
              }
              icon={
                <RefreshCw size={16} />
              }
            >
              Làm mới
            </Button>

            <Button
              type="primary"
              icon={
                <Plus
                  size={16}
                />
              }
              onClick={() =>
                showModal()
              }
            >
              Thêm Voucher
            </Button>
          </Space>
        }
      >
        <Row gutter={[16, 16]}>
          <Col xs={24} md={6}>
            <Card bordered>
              <Statistic
                title="Tổng Voucher"
                value={
                  stats.totalVouchers
                }
              />
            </Card>
          </Col>

          <Col xs={24} md={6}>
            <Card bordered>
              <Statistic
                title="Đang hoạt động"
                value={
                  stats.activeVouchers
                }
                valueStyle={{
                  color:
                    '#16a34a'
                }}
              />
            </Card>
          </Col>

          <Col xs={24} md={6}>
            <Card bordered>
              <Statistic
                title="Đã sử dụng"
                value={
                  stats.totalUsed
                }
                valueStyle={{
                  color:
                    '#2563eb'
                }}
              />
            </Card>
          </Col>

          <Col xs={24} md={6}>
            <Card bordered>
              <Statistic
                title="Lượt còn lại"
                value={
                  stats.totalQuantityRemaining
                }
                valueStyle={{
                  color:
                    '#ea580c'
                }}
              />
            </Card>
          </Col>
        </Row>

        <div className="mt-5">
          {stats.expiringSoon
            .length > 0 && (
            <Alert
              type="warning"
              showIcon
              message={`Có ${stats.expiringSoon.length} voucher sắp hết hạn trong vòng 7 ngày`}
            />
          )}
        </div>

        <div className="bg-white rounded-xl border p-5 mt-5">
          <div className="flex flex-col md:flex-row gap-4">
            <Input
              prefix={
                <Search
                  size={16}
                />
              }
              placeholder="Tìm mã voucher..."
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
              className="max-w-md"
            />

            <Select
              value={
                statusFilter
              }
              onChange={
                setStatusFilter
              }
              className="w-[220px]"
              options={[
                {
                  value:
                    'all',
                  label:
                    'Tất cả trạng thái'
                },

                {
                  value:
                    'active',
                  label:
                    'Hoạt động'
                },

                {
                  value:
                    'disabled',
                  label:
                    'Vô hiệu hóa'
                },

                {
                  value:
                    'expired',
                  label:
                    'Hết hạn'
                }
              ]}
            />
          </div>
        </div>

        <div className="mt-5">
          <Table<Voucher>
            rowKey="id"
            columns={
              columns
            }
            dataSource={
              filteredVouchers
            }
            loading={
              loading
            }
            bordered
            scroll={{
              x: 1200
            }}
            pagination={{
              pageSize: 10
            }}
            locale={{
              emptyText:
                (
                  <Empty description="Không có dữ liệu voucher" />
                )
            }}
          />
        </div>
      </Card>

      <Modal
        title={
          editingVoucher
            ? 'Chỉnh sửa Voucher'
            : 'Thêm Voucher'
        }
        open={
          isModalOpen
        }
        onCancel={() =>
          setIsModalOpen(
            false
          )
        }
        onOk={handleSave}
        okText={
          editingVoucher
            ? 'Cập nhật'
            : 'Tạo Voucher'
        }
        cancelText="Hủy"
        confirmLoading={
          loading
        }
        width={750}
      >
        <Form
          form={form}
          layout="vertical"
          className="mt-5"
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="code"
                label="Mã Voucher"
                rules={[
                  {
                    required:
                      true,
                    message:
                      'Vui lòng nhập mã voucher'
                  }
                ]}
              >
                <Input placeholder="SUMMER2026" />
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item
                name="isActive"
                label="Kích hoạt"
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>
            </Col>

            <Col span={24}>
              <Form.Item
                name="description"
                label="Mô tả"
              >
                <Input.TextArea
                  rows={3}
                />
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item
                name="discountType"
                label="Loại giảm giá"
                rules={[
                  {
                    required:
                      true
                  }
                ]}
              >
                <Select
                  onChange={(
                    value
                  ) =>
                    setDiscountType(
                      value
                    )
                  }
                  options={[
                    {
                      value:
                        'percentage',
                      label:
                        'Phần trăm (%)'
                    },

                    {
                      value:
                        'fixed',
                      label:
                        'Tiền mặt'
                    }
                  ]}
                />
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item
                name="discountValue"
                label="Giá trị giảm"
                rules={[
                  {
                    required:
                      true
                  }
                ]}
              >
                <InputNumber
                  className="w-full"
                  min={1}
                  addonAfter={
                    discountType ===
                    'percentage'
                      ? '%'
                      : 'đ'
                  }
                />
              </Form.Item>
            </Col>

            {discountType ===
              'percentage' && (
              <Col span={12}>
                <Form.Item
                  name="maxDiscount"
                  label="Giảm tối đa"
                >
                  <InputNumber
                    className="w-full"
                    min={0}
                    addonAfter="đ"
                  />
                </Form.Item>
              </Col>
            )}

            <Col span={12}>
              <Form.Item
                name="minOrderValue"
                label="Đơn tối thiểu"
                rules={[
                  {
                    required:
                      true
                  }
                ]}
              >
                <InputNumber
                  className="w-full"
                  min={0}
                  addonAfter="đ"
                />
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item
                name="usageLimit"
                label="Giới hạn lượt dùng"
                rules={[
                  {
                    required:
                      true
                  }
                ]}
              >
                <InputNumber
                  className="w-full"
                  min={1}
                />
              </Form.Item>
            </Col>

            <Col span={24}>
              <Form.Item
                name="dates"
                label="Thời gian áp dụng"
                rules={[
                  {
                    required:
                      true,
                    message:
                      'Vui lòng chọn thời gian'
                  }
                ]}
              >
                <RangePicker className="w-full" />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  );
}