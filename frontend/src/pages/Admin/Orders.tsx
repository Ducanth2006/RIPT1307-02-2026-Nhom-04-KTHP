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
  Empty,
  Card,
  Row,
  Col,
  Select,
  Steps,
  Space,
  Spin,
  Divider,
  Modal,
  Avatar,
  Image
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
  Ban,
  User,
  MapPin,
  Phone,
  Mail,
  CreditCard
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

interface BackendOrderItem {
  id: string;

  quantity: number;

  price: number;

  sanPhamChiTiet?: {
    sku?: string;

    mauSac?: {
      tenMau?: string;
    };

    kichThuoc?: {
      tenKichThuoc?: string;
    };

    sanPham?: {
      tenSanPham?: string;
      hinhAnh?: string;
    };
  };
}

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

  chiTietDonHang?: BackendOrderItem[];
}

interface OrderItem {
  id: string;

  name: string;

  image: string;

  sku: string;

  color: string;

  size: string;

  quantity: number;

  price: number;
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

  items: OrderItem[];
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

const mapFrontendStatusToBackend = (
  status: OrderStatus
): BackendOrderStatus => {
  switch (status) {
    case 'PENDING':
      return 'Pending';

    case 'CONFIRMED':
      return 'Confirmed';

    case 'PACKING':
      return 'Packing';

    case 'SHIPPING':
      return 'Shipping';

    case 'SUCCESS':
      return 'Completed';

    case 'FAILED':
      return 'Cancelled';

    default:
      return 'Pending';
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
    label: 'Đã xác nhận',
    color: 'blue',
    icon: <CheckCircle size={14} />
  },

  PACKING: {
    label: 'Đang đóng gói',
    color: 'processing',
    icon: <Package size={14} />
  },

  SHIPPING: {
    label: 'Đang vận chuyển',
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

  const [actionLoading, setActionLoading] =
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
              ),

              items:
                order.chiTietDonHang?.map(
                  (item) => ({
                    id: item.id,

                    name:
                      item
                        .sanPhamChiTiet
                        ?.sanPham
                        ?.tenSanPham ||
                      'Sản phẩm',

                    image:
                      item
                        .sanPhamChiTiet
                        ?.sanPham
                        ?.hinhAnh ||
                      '',

                    sku:
                      item
                        .sanPhamChiTiet
                        ?.sku ||
                      '---',

                    color:
                      item
                        .sanPhamChiTiet
                        ?.mauSac
                        ?.tenMau ||
                      '---',

                    size:
                      item
                        .sanPhamChiTiet
                        ?.kichThuoc
                        ?.tenKichThuoc ||
                      '---',

                    quantity:
                      item.quantity,

                    price:
                      item.price
                  })
                ) || []
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
  // UPDATE STATUS
  // =========================

  const capNhatTrangThaiDonHang =
    async (
      orderId: string,
      newStatus: OrderStatus
    ) => {
      try {
        setActionLoading(true);

        await axiosInstance.patch(
          `${ip}/admin/orders/${orderId}/status`,
          {
            status:
              mapFrontendStatusToBackend(
                newStatus
              )
          }
        );

        messageApi.success(
          'Cập nhật trạng thái thành công'
        );

        await taiDanhSachDonHang();
        await taiThongKe();

        if (selectedOrder) {
          setSelectedOrder({
            ...selectedOrder,
            status: newStatus
          });
        }
      } catch (error) {
        console.log(error);

        messageApi.error(
          'Không thể cập nhật trạng thái'
        );
      } finally {
        setActionLoading(false);
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
  // STEP
  // =========================

  const getStepCurrent = (
    status: OrderStatus
  ) => {
    switch (status) {
      case 'PENDING':
        return 0;

      case 'CONFIRMED':
        return 1;

      case 'PACKING':
        return 2;

      case 'SHIPPING':
        return 3;

      case 'SUCCESS':
        return 4;

      case 'FAILED':
        return 4;

      default:
        return 0;
    }
  };

  // =========================
  // ACTION BUTTONS
  // =========================

  const renderActionButtons = () => {
    if (!selectedOrder) return null;

    switch (selectedOrder.status) {
      case 'PENDING':
        return (
          <Space wrap>
            <Button
              type="primary"
              size="large"
              loading={actionLoading}
              className="rounded-xl bg-green-600"
              onClick={() =>
                capNhatTrangThaiDonHang(
                  selectedOrder.id,
                  'CONFIRMED'
                )
              }
            >
              Duyệt đơn hàng
            </Button>

            <Button
              danger
              size="large"
              loading={actionLoading}
              className="rounded-xl"
              onClick={() =>
                capNhatTrangThaiDonHang(
                  selectedOrder.id,
                  'FAILED'
                )
              }
            >
              Huỷ đơn
            </Button>
          </Space>
        );

      case 'CONFIRMED':
        return (
          <Space wrap>
            <Button
              type="primary"
              size="large"
              loading={actionLoading}
              className="rounded-xl"
              onClick={() =>
                capNhatTrangThaiDonHang(
                  selectedOrder.id,
                  'PACKING'
                )
              }
            >
              Bắt đầu soạn hàng
            </Button>

            <Button
              danger
              size="large"
              loading={actionLoading}
              className="rounded-xl"
              onClick={() =>
                capNhatTrangThaiDonHang(
                  selectedOrder.id,
                  'FAILED'
                )
              }
            >
              Huỷ đơn
            </Button>
          </Space>
        );

      case 'PACKING':
        return (
          <Space wrap>
            <Button
              type="primary"
              size="large"
              loading={actionLoading}
              className="rounded-xl bg-purple-600"
              onClick={() =>
                capNhatTrangThaiDonHang(
                  selectedOrder.id,
                  'SHIPPING'
                )
              }
            >
              Bắt đầu vận chuyển
            </Button>

            <Button
              danger
              size="large"
              loading={actionLoading}
              className="rounded-xl"
              onClick={() =>
                capNhatTrangThaiDonHang(
                  selectedOrder.id,
                  'FAILED'
                )
              }
            >
              Huỷ đơn
            </Button>
          </Space>
        );

      case 'SHIPPING':
        return (
          <Space wrap>
            <Button
              type="primary"
              size="large"
              loading={actionLoading}
              className="rounded-xl bg-green-600"
              onClick={() =>
                capNhatTrangThaiDonHang(
                  selectedOrder.id,
                  'SUCCESS'
                )
              }
            >
              Giao hàng thành công
            </Button>

            <Button
              danger
              size="large"
              loading={actionLoading}
              className="rounded-xl"
              onClick={() =>
                capNhatTrangThaiDonHang(
                  selectedOrder.id,
                  'FAILED'
                )
              }
            >
              Giao hàng thất bại
            </Button>
          </Space>
        );

      case 'SUCCESS':
        return (
          <Tag
            color="success"
            className="px-5 py-2 rounded-full"
          >
            Đơn hàng đã hoàn thành
          </Tag>
        );

      case 'FAILED':
        return (
          <Tag
            color="error"
            className="px-5 py-2 rounded-full"
          >
            Đơn hàng đã bị huỷ
          </Tag>
        );

      default:
        return null;
    }
  };

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
            className="rounded-xl"
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
            Xem chi tiết
          </Button>
        )
      }
    ];

  // =========================
  // CHART
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
              Quản lý vòng đời đơn hàng,
              kiểm duyệt và vận chuyển
            </p>
          </div>

          <Button
            type="primary"
            danger
            size="large"
            className="h-[54px] px-7 rounded-2xl font-semibold"
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
        <Col xs={24} xl={9}>
          <div className="grid grid-cols-2 gap-5">
            {[
              {
                title:
                  'Tổng doanh thu',
                value:
                  dinhDangTien(
                    stats.tongDoanhThu
                  ),
                icon: (
                  <DollarSign
                    size={30}
                  />
                ),
                color:
                  'text-green-600',
                bg: 'bg-green-100'
              },

              {
                title:
                  'Tổng đơn',
                value:
                  stats.tongSoDon,
                icon: (
                  <ShoppingCart
                    size={30}
                  />
                ),
                color:
                  'text-blue-600',
                bg: 'bg-blue-100'
              },

              {
                title:
                  'Chờ duyệt',
                value:
                  stats.donChoDuyet,
                icon: (
                  <Clock3
                    size={30}
                  />
                ),
                color:
                  'text-orange-500',
                bg: 'bg-orange-100'
              },

              {
                title:
                  'Đóng gói',
                value:
                  stats.donDangDongGoi,
                icon: (
                  <Package
                    size={30}
                  />
                ),
                color:
                  'text-purple-500',
                bg: 'bg-purple-100'
              },

              {
                title:
                  'Đang giao',
                value:
                  stats.donDangGiao,
                icon: (
                  <Truck
                    size={30}
                  />
                ),
                color:
                  'text-cyan-500',
                bg: 'bg-cyan-100'
              },

              {
                title:
                  'Đã huỷ',
                value:
                  stats.donDaHuy,
                icon: (
                  <Ban
                    size={30}
                  />
                ),
                color:
                  'text-red-500',
                bg: 'bg-red-100'
              }
            ].map((item, index) => (
              <Card
                key={index}
                bordered={false}
                className="rounded-[28px] shadow-sm border border-gray-100"
              >
                <div className="flex flex-col gap-4">
                  <div
                    className={`w-14 h-14 rounded-2xl flex items-center justify-center ${item.bg}`}
                  >
                    <div
                      className={
                        item.color
                      }
                    >
                      {item.icon}
                    </div>
                  </div>

                  <div>
                    <p className="text-gray-500">
                      {item.title}
                    </p>

                    <h2
                      className={`text-3xl font-black mt-2 ${item.color}`}
                    >
                      {item.value}
                    </h2>
                  </div>
                </div>
              </Card>
            ))}
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
              width: 240
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
                  'Đã xác nhận',
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
        title={`Chi tiết đơn hàng #${
          selectedOrder?.id || ''
        }`}
        open={isDrawerOpen}
        width={750}
        onClose={() =>
          setIsDrawerOpen(false)
        }
      >
        {!selectedOrder ? (
          <Spin />
        ) : (
          <div className="space-y-7">
            {/* CUSTOMER */}
            <Card className="rounded-2xl">
              <div className="flex items-start gap-4">
                <Avatar
                  size={64}
                  className="bg-blue-500"
                  icon={<User size={28} />}
                />

                <div className="flex-1">
                  <h2 className="text-2xl font-bold">
                    {
                      selectedOrder.customerName
                    }
                  </h2>

                  <div className="mt-4 space-y-3">
                    <div className="flex items-center gap-3 text-gray-600">
                      <Phone size={16} />

                      {
                        selectedOrder.phone
                      }
                    </div>

                    <div className="flex items-center gap-3 text-gray-600">
                      <Mail size={16} />

                      {
                        selectedOrder.email
                      }
                    </div>

                    <div className="flex items-center gap-3 text-gray-600">
                      <MapPin size={16} />

                      {
                        selectedOrder.address
                      }
                    </div>

                    <div className="flex items-center gap-3 text-gray-600">
                      <CreditCard size={16} />

                      {
                        selectedOrder.paymentMethod
                      }
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* PRODUCTS */}
            <Card className="rounded-2xl">
              <div className="flex justify-between items-center mb-5">
                <h2 className="text-xl font-bold">
                  Danh sách sản phẩm
                </h2>

                <div className="text-2xl font-black text-green-600">
                  {dinhDangTien(
                    selectedOrder.total
                  )}
                </div>
              </div>

              <div className="space-y-4">
                {selectedOrder.items
                  .length === 0 && (
                  <Empty description="Không có sản phẩm" />
                )}

                {selectedOrder.items.map(
                  (item) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-4 border border-gray-100 rounded-2xl p-4"
                    >
                      <Image
                        width={90}
                        height={90}
                        className="rounded-xl object-cover"
                        src={item.image}
                        fallback="https://placehold.co/100x100"
                      />

                      <div className="flex-1">
                        <h3 className="font-bold text-lg">
                          {item.name}
                        </h3>

                        <div className="grid grid-cols-2 gap-3 mt-3 text-sm text-gray-500">
                          <div>
                            SKU:
                            {' '}
                            {item.sku}
                          </div>

                          <div>
                            Màu:
                            {' '}
                            {item.color}
                          </div>

                          <div>
                            Size:
                            {' '}
                            {item.size}
                          </div>

                          <div>
                            SL:
                            {' '}
                            {item.quantity}
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-xl font-bold text-green-600">
                          {dinhDangTien(
                            item.price
                          )}
                        </div>
                      </div>
                    </div>
                  )
                )}
              </div>
            </Card>

            {/* STEPS */}
            <Card className="rounded-2xl">
              <h2 className="text-xl font-bold mb-6">
                Tiến trình đơn hàng
              </h2>

              <Steps
                current={getStepCurrent(
                  selectedOrder.status
                )}
                status={
                  selectedOrder.status ===
                  'FAILED'
                    ? 'error'
                    : 'process'
                }
                items={[
                  {
                    title:
                      'Chờ duyệt'
                  },

                  {
                    title:
                      'Xác nhận'
                  },

                  {
                    title:
                      'Đóng gói'
                  },

                  {
                    title:
                      'Vận chuyển'
                  },

                  {
                    title:
                      selectedOrder.status ===
                      'FAILED'
                        ? 'Thất bại'
                        : 'Hoàn thành'
                  }
                ]}
              />
            </Card>

            {/* ACTIONS */}
            <Card className="rounded-2xl">
              <h2 className="text-xl font-bold mb-5">
                Điều hướng nghiệp vụ
              </h2>

              {renderActionButtons()}
            </Card>
          </div>
        )}
      </Drawer>
    </div>
  );
}