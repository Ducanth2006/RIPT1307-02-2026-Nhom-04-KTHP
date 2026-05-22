// =========================
// IMPORT
// =========================

import React, {
  useEffect,
  useMemo,
  useState
} from 'react';

import {
  Button,
  Table,
  Tag,
  Input,
  Drawer,
  message,
  Divider,
  Spin,
  Empty,
  Card,
  Row,
  Col,
  Select
} from 'antd';

import {
  Download,
  Search,
  Eye,
  Package,
  Truck,
  Check,
  XCircle,
  CheckCircle,
  RefreshCw,
  ShoppingCart,
  DollarSign,
  TrendingUp,
  Clock3,
  Ban
} from 'lucide-react';

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts';

import type { ColumnsType } from 'antd/es/table';

import axiosInstance from '../../utils/axiosConfig';
import ip from '../../utils/ip';

// =========================
// TYPES
// =========================

type BackendOrderStatus =
  | 'Pending'
  | 'Confirmed'
  | 'Packing'
  | 'Shipping'
  | 'Completed'
  | 'Cancelled';

type OrderStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'PACKING'
  | 'SHIPPING'
  | 'SUCCESS'
  | 'FAILED';

interface BackendOrder {
  id: string;

  created_at: string;

  status: BackendOrderStatus;

  payment_status: string;

  final_amount: number;

  khachHang?: {
    name?: string;
    email?: string;
  } | null;

  nguoiNhan?: string | null;

  soDienThoaiNhan?: string | null;

  diaChiGiaoHang?: string | null;

  thanhToan?: {
    method?: string | null;
  } | null;
}

interface Order {
  id: string;

  customerName: string;

  phone: string;

  email: string;

  address: string;

  date: string;

  paymentMethod: string;

  status: OrderStatus;

  total: number;
}

interface DashboardStats {
  tongDoanhThu: number;

  tongSoDon: number;

  donChoDuyet: number;

  donDangDongGoi: number;

  donDangGiao: number;

  donDaHuy: number;
}

// =========================
// STATUS MAP
// =========================

const mapBackendStatusToFrontend = (
  status: BackendOrderStatus
): OrderStatus => {
  switch (status) {
    case 'Pending':
      return 'PENDING';

    case 'Confirmed':
      return 'CONFIRMED';

    case 'Packing':
      return 'PACKING';

    case 'Shipping':
      return 'SHIPPING';

    case 'Completed':
      return 'SUCCESS';

    case 'Cancelled':
      return 'FAILED';

    default:
      return 'PENDING';
  }
};

// =========================
// STATUS CONFIG
// =========================

const statusConfig: Record<
  OrderStatus,
  {
    label: string;
    color: string;
    icon: React.ReactNode;
  }
> = {
  PENDING: {
    label: 'Chờ duyệt',
    color: 'warning',
    icon: <Clock3 size={14} />
  },

  CONFIRMED: {
    label: 'Đã duyệt',
    color: 'blue',
    icon: <CheckCircle size={14} />
  },

  PACKING: {
    label: 'Đóng gói',
    color: 'processing',
    icon: <Package size={14} />
  },

  SHIPPING: {
    label: 'Đang giao',
    color: 'purple',
    icon: <Truck size={14} />
  },

  SUCCESS: {
    label: 'Hoàn thành',
    color: 'success',
    icon: <Check size={14} />
  },

  FAILED: {
    label: 'Đã huỷ',
    color: 'error',
    icon: <XCircle size={14} />
  }
};

// =========================
// COMPONENT
// =========================

export default function Orders() {
  const [messageApi, contextHolder] =
    message.useMessage();

  const [orders, setOrders] = useState<
    Order[]
  >([]);

  const [loading, setLoading] =
    useState(false);

  const [stats, setStats] =
    useState<DashboardStats>({
      tongDoanhThu: 0,
      tongSoDon: 0,
      donChoDuyet: 0,
      donDangDongGoi: 0,
      donDangGiao: 0,
      donDaHuy: 0
    });

  const [selectedOrder, setSelectedOrder] =
    useState<Order | null>(null);

  const [isDrawerOpen, setIsDrawerOpen] =
    useState(false);

  const [searchText, setSearchText] =
    useState('');

  const [filterStatus, setFilterStatus] =
    useState<string>('ALL');

  // =========================
  // FORMAT
  // =========================

  const dinhDangTien = (
    soTien?: number | null
  ) => {
    return new Intl.NumberFormat(
      'vi-VN',
      {
        style: 'currency',
        currency: 'VND'
      }
    ).format(Number(soTien || 0));
  };

  // =========================
  // API
  // =========================

  const taiThongKe = async () => {
    try {
      const res =
        await axiosInstance.get(
          `${ip}/admin/orders/stats`
        );

      const data =
        res.data?.data || {};

      setStats({
        tongDoanhThu:
          data.tongDoanhThu || 0,

        tongSoDon:
          data.tongSoDon || 0,

        donChoDuyet:
          data.donChoDuyet || 0,

        donDangDongGoi:
          data.donDangDongGoi || 0,

        donDangGiao:
          data.donDangGiao || 0,

        donDaHuy:
          data.donDaHuy || 0
      });
    } catch (error) {
      console.log(error);
    }
  };

  const taiDanhSachDonHang =
    async () => {
      try {
        setLoading(true);

        const res =
          await axiosInstance.get(
            `${ip}/admin/orders`
          );

        const data =
          res.data?.data || [];

        const mapped: Order[] =
          data.map(
            (order: BackendOrder) => ({
              id: String(order.id),

              customerName:
                order.nguoiNhan ||
                order.khachHang?.name ||
                '---',

              phone:
                order.soDienThoaiNhan ||
                '---',

              email:
                order.khachHang
                  ?.email || '---',

              address:
                order.diaChiGiaoHang ||
                '---',

              date: new Date(
                order.created_at
              ).toLocaleString(
                'vi-VN'
              ),

              paymentMethod:
                order.thanhToan
                  ?.method || '---',

              status:
                mapBackendStatusToFrontend(
                  order.status
                ),

              total: Number(
                order.final_amount ||
                  0
              )
            })
          );

        setOrders(mapped);
      } catch (error) {
        console.log(error);

        messageApi.error(
          'Không thể tải đơn hàng'
        );
      } finally {
        setLoading(false);
      }
    };

  // =========================
  // EFFECT
  // =========================

  useEffect(() => {
    taiThongKe();
    taiDanhSachDonHang();
  }, []);

  // =========================
  // FILTER
  // =========================

  const filteredOrders =
    useMemo(() => {
      let result = orders;

      if (filterStatus !== 'ALL') {
        result = result.filter(
          (o) =>
            o.status ===
            filterStatus
        );
      }

      if (searchText.trim()) {
        const keyword =
          searchText.toLowerCase();

        result = result.filter(
          (o) =>
            o.id
              .toLowerCase()
              .includes(keyword) ||
            o.customerName
              .toLowerCase()
              .includes(keyword) ||
            o.phone
              .toLowerCase()
              .includes(keyword)
        );
      }

      return result;
    }, [
      orders,
      filterStatus,
      searchText
    ]);

  // =========================
  // TABLE
  // =========================

  const columns: ColumnsType<Order> =
    [
      {
        title: 'Mã Đơn',
        dataIndex: 'id',

        render: (id) => (
          <span className="font-bold text-red-600 text-lg">
            #{id}
          </span>
        )
      },

      {
        title: 'Khách Hàng',

        render: (_, record) => (
          <div>
            <div className="font-semibold text-[15px]">
              {
                record.customerName
              }
            </div>

            <div className="text-gray-400 text-xs mt-1">
              {record.phone}
            </div>
          </div>
        )
      },

      {
        title: 'Ngày Đặt',
        dataIndex: 'date'
      },

      {
        title: 'Thanh Toán',

        render: (_, record) => (
          <Tag
            color="geekblue"
            className="px-3 py-1 rounded-full"
          >
            {
              record.paymentMethod
            }
          </Tag>
        )
      },

      {
        title: 'Tổng Tiền',

        render: (_, record) => (
          <span className="font-bold text-green-600">
            {dinhDangTien(
              record.total
            )}
          </span>
        )
      },

      {
        title: 'Trạng Thái',

        render: (_, record) => (
          <Tag
            color={
              statusConfig[
                record.status
              ].color
            }
            icon={
              statusConfig[
                record.status
              ].icon
            }
            className="px-3 py-1 rounded-full"
          >
            {
              statusConfig[
                record.status
              ].label
            }
          </Tag>
        )
      },

      {
        title: 'Hành Động',

        render: (_, record) => (
          <Button
            type="default"
            className="rounded-xl border-gray-300"
            icon={
              <Eye size={16} />
            }
            onClick={() => {
              setSelectedOrder(
                record
              );

              setIsDrawerOpen(
                true
              );
            }}
          >
            Xem
          </Button>
        )
      }
    ];

  // =========================
  // CHART DATA
  // =========================

  const revenueData = [
    {
      day: '15/05',
      revenue: 350000
    },
    {
      day: '16/05',
      revenue: 420000
    },
    {
      day: '17/05',
      revenue: 280000
    },
    {
      day: '18/05',
      revenue: 650000
    },
    {
      day: '19/05',
      revenue: 720000
    },
    {
      day: '20/05',
      revenue: 900000
    },
    {
      day: '21/05',
      revenue: 100000
    }
  ];

  // =========================
  // EXPORT CSV
  // =========================

  const exportCSV = () => {
    const headers = [
      'Mã đơn',
      'Khách hàng',
      'SĐT',
      'Thanh toán',
      'Tổng tiền'
    ].join(',');

    const rows =
      filteredOrders
        .map(
          (o) =>
            `"${o.id}","${o.customerName}","${o.phone}","${o.paymentMethod}","${o.total}"`
        )
        .join('\n');

    const csv =
      '\uFEFF' +
      headers +
      '\n' +
      rows;

    const blob = new Blob(
      [csv],
      {
        type: 'text/csv'
      }
    );

    const link =
      document.createElement(
        'a'
      );

    link.href =
      URL.createObjectURL(blob);

    link.download =
      'orders.csv';

    link.click();
  };

  // =========================
  // UI
  // =========================

  return (
    <div className="min-h-screen bg-[#f4f6fb] p-7">
      {contextHolder}

      {/* HEADER */}
      <div className="bg-white rounded-[32px] border border-gray-200 p-8 shadow-sm mb-7">
        <div className="flex justify-between items-start flex-wrap gap-5">
          <div>
            <h1 className="text-5xl font-black text-[#111827]">
              Quản Lý Đơn Hàng
            </h1>

            <p className="text-gray-500 mt-3 text-lg">
              Theo dõi trạng thái đơn hàng,
              doanh thu và vận chuyển
            </p>
          </div>

          <Button
            type="primary"
            danger
            size="large"
            className="h-[54px] px-7 rounded-2xl font-semibold shadow-md"
            icon={
              <RefreshCw size={18} />
            }
            onClick={() => {
              taiThongKe();
              taiDanhSachDonHang();
            }}
          >
            Làm mới dữ liệu
          </Button>
        </div>
      </div>

      {/* DASHBOARD */}
      <Row gutter={[24, 24]}>
        {/* LEFT */}
        <Col xs={24} xl={9}>
          <div className="grid grid-cols-2 gap-5">
            {/* DOANH THU */}
            <Card
              bordered={false}
              className="rounded-[28px] shadow-sm col-span-2 border border-gray-100"
            >
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-gray-500 text-base">
                    Tổng doanh thu
                  </p>

                  <h2 className="text-4xl font-black text-green-600 mt-2">
                    {dinhDangTien(
                      stats.tongDoanhThu
                    )}
                  </h2>

                  <div className="flex items-center gap-2 mt-4 text-green-500 font-semibold">
                    <TrendingUp size={16} />
                    +12.5% tháng này
                  </div>
                </div>

                <div className="w-20 h-20 rounded-3xl bg-green-100 flex items-center justify-center">
                  <DollarSign
                    size={40}
                    className="text-green-600"
                  />
                </div>
              </div>
            </Card>

            {/* TOTAL */}
            <Card
              bordered={false}
              className="rounded-[28px] shadow-sm border border-gray-100"
            >
              <div className="flex flex-col gap-4">
                <div className="w-14 h-14 rounded-2xl bg-blue-100 flex items-center justify-center">
                  <ShoppingCart
                    size={28}
                    className="text-blue-600"
                  />
                </div>

                <div>
                  <p className="text-gray-500">
                    Tổng đơn
                  </p>

                  <h2 className="text-4xl font-black text-blue-600 mt-2">
                    {stats.tongSoDon}
                  </h2>
                </div>
              </div>
            </Card>

            {/* PENDING */}
            <Card
              bordered={false}
              className="rounded-[28px] shadow-sm border border-gray-100"
            >
              <div className="flex flex-col gap-4">
                <div className="w-14 h-14 rounded-2xl bg-orange-100 flex items-center justify-center">
                  <Clock3
                    size={28}
                    className="text-orange-500"
                  />
                </div>

                <div>
                  <p className="text-gray-500">
                    Chờ duyệt
                  </p>

                  <h2 className="text-4xl font-black text-orange-500 mt-2">
                    {
                      stats.donChoDuyet
                    }
                  </h2>
                </div>
              </div>
            </Card>

            {/* PACKING */}
            <Card
              bordered={false}
              className="rounded-[28px] shadow-sm border border-gray-100"
            >
              <div className="flex flex-col gap-4">
                <div className="w-14 h-14 rounded-2xl bg-purple-100 flex items-center justify-center">
                  <Package
                    size={28}
                    className="text-purple-500"
                  />
                </div>

                <div>
                  <p className="text-gray-500">
                    Đóng gói
                  </p>

                  <h2 className="text-4xl font-black text-purple-500 mt-2">
                    {
                      stats.donDangDongGoi
                    }
                  </h2>
                </div>
              </div>
            </Card>

            {/* SHIPPING */}
            <Card
              bordered={false}
              className="rounded-[28px] shadow-sm border border-gray-100"
            >
              <div className="flex flex-col gap-4">
                <div className="w-14 h-14 rounded-2xl bg-cyan-100 flex items-center justify-center">
                  <Truck
                    size={28}
                    className="text-cyan-500"
                  />
                </div>

                <div>
                  <p className="text-gray-500">
                    Đang giao
                  </p>

                  <h2 className="text-4xl font-black text-cyan-500 mt-2">
                    {
                      stats.donDangGiao
                    }
                  </h2>
                </div>
              </div>
            </Card>

            {/* CANCEL */}
            <Card
              bordered={false}
              className="rounded-[28px] shadow-sm border border-gray-100"
            >
              <div className="flex flex-col gap-4">
                <div className="w-14 h-14 rounded-2xl bg-red-100 flex items-center justify-center">
                  <Ban
                    size={28}
                    className="text-red-500"
                  />
                </div>

                <div>
                  <p className="text-gray-500">
                    Đã huỷ
                  </p>

                  <h2 className="text-4xl font-black text-red-500 mt-2">
                    {
                      stats.donDaHuy
                    }
                  </h2>
                </div>
              </div>
            </Card>
          </div>
        </Col>

        {/* CHART */}
        <Col xs={24} xl={15}>
          <Card
            bordered={false}
            className="rounded-[32px] shadow-sm border border-gray-100 h-full"
          >
            <div className="flex justify-between items-center mb-8">
              <div>
                <p className="uppercase tracking-[4px] text-red-500 font-bold text-sm">
                  Revenue Graph
                </p>

                <h2 className="text-4xl font-black mt-2 text-[#111827]">
                  Biểu đồ doanh thu
                </h2>

                <p className="text-gray-400 mt-2">
                  Thống kê doanh thu 7 ngày gần nhất
                </p>
              </div>

              <div className="bg-red-50 text-red-500 px-5 py-3 rounded-2xl font-bold text-lg">
                +18.2%
              </div>
            </div>

            <ResponsiveContainer
              width="100%"
              height={500}
            >
              <AreaChart
                data={revenueData}
              >
                <defs>
                  <linearGradient
                    id="colorRevenue"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="5%"
                      stopColor="#ef4444"
                      stopOpacity={0.4}
                    />

                    <stop
                      offset="95%"
                      stopColor="#ef4444"
                      stopOpacity={0}
                    />
                  </linearGradient>
                </defs>

                <CartesianGrid
                  strokeDasharray="4 4"
                  vertical={false}
                  stroke="#e5e7eb"
                />

                <XAxis
                  dataKey="day"
                  tickLine={false}
                  axisLine={false}
                />

                <YAxis
                  tickLine={false}
                  axisLine={false}
                />

                <Tooltip />

                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#dc2626"
                  fillOpacity={1}
                  fill="url(#colorRevenue)"
                  strokeWidth={5}
                />
              </AreaChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>

      {/* FILTER */}
      <Card
        bordered={false}
        className="rounded-[32px] shadow-sm border border-gray-100 mt-8"
      >
        <div className="flex flex-wrap gap-4 items-center">
          <Input
            size="large"
            placeholder="Tìm kiếm mã đơn, khách hàng..."
            prefix={
              <Search size={18} />
            }
            value={searchText}
            onChange={(e) =>
              setSearchText(
                e.target.value
              )
            }
            className="rounded-2xl h-[54px] flex-1 min-w-[300px]"
          />

          <Select
            size="large"
            value={filterStatus}
            style={{
              width: 240,
              height: 54
            }}
            onChange={(value) =>
              setFilterStatus(
                value
              )
            }
            options={[
              {
                label:
                  'Tất cả trạng thái',
                value: 'ALL'
              },

              {
                label:
                  'Chờ duyệt',
                value:
                  'PENDING'
              },

              {
                label:
                  'Đã duyệt',
                value:
                  'CONFIRMED'
              },

              {
                label:
                  'Đóng gói',
                value:
                  'PACKING'
              },

              {
                label:
                  'Đang giao',
                value:
                  'SHIPPING'
              },

              {
                label:
                  'Hoàn thành',
                value:
                  'SUCCESS'
              },

              {
                label:
                  'Đã huỷ',
                value:
                  'FAILED'
              }
            ]}
          />

          <Button
            size="large"
            icon={
              <Download size={18} />
            }
            onClick={exportCSV}
            className="rounded-2xl h-[54px] px-6 font-semibold"
          >
            Export CSV
          </Button>
        </div>
      </Card>

      {/* TABLE */}
      <Card
        bordered={false}
        className="rounded-[32px] shadow-sm border border-gray-100 mt-8 overflow-hidden"
      >
        <Table
          rowKey="id"
          loading={loading}
          columns={columns}
          dataSource={
            filteredOrders
          }
          pagination={{
            pageSize: 10
          }}
          locale={{
            emptyText: (
              <Empty description="Không có đơn hàng" />
            )
          }}
        />
      </Card>

      {/* DRAWER */}
      <Drawer
        title={`Chi tiết đơn ${
          selectedOrder?.id || ''
        }`}
        open={isDrawerOpen}
        width={500}
        onClose={() =>
          setIsDrawerOpen(false)
        }
      >
        {!selectedOrder ? (
          <Spin />
        ) : (
          <div className="space-y-5">
            <div>
              <strong>
                Khách hàng:
              </strong>{' '}
              {
                selectedOrder.customerName
              }
            </div>

            <div>
              <strong>
                SĐT:
              </strong>{' '}
              {
                selectedOrder.phone
              }
            </div>

            <div>
              <strong>
                Email:
              </strong>{' '}
              {
                selectedOrder.email
              }
            </div>

            <div>
              <strong>
                Địa chỉ:
              </strong>{' '}
              {
                selectedOrder.address
              }
            </div>

            <div>
              <strong>
                Tổng tiền:
              </strong>{' '}
              {dinhDangTien(
                selectedOrder.total
              )}
            </div>

            <Divider />

            <Tag
              color={
                statusConfig[
                  selectedOrder
                    .status
                ].color
              }
              className="px-4 py-1 rounded-full"
            >
              {
                statusConfig[
                  selectedOrder
                    .status
                ].label
              }
            </Tag>
          </div>
        )}
      </Drawer>
    </div>
  );
}