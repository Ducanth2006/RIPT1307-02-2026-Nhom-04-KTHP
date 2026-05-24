// =========================
// IMPORT
// =========================

import React, {
  useEffect,
  useMemo,
  useState
} from 'react';
import { useSearchParams } from 'react-router-dom';

import {
  Button,
  Table,
  Tag,
  Input,
  Drawer,
  message,
  Empty,
  Card,
  Select,
  Steps,
  Space,
  Spin,
  Divider,
  Modal,
  Avatar,
  Image,
  Tooltip as AntdTooltip
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
  Clock3,
  Ban,
  User,
  MapPin,
  Phone,
  Mail,
  CreditCard,
  AlertTriangle
} from 'lucide-react';

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
  | 'Cancelled'
  | 'CancelRequested';

type OrderStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'PACKING'
  | 'SHIPPING'
  | 'SUCCESS'
  | 'FAILED'
  | 'CANCEL_REQUESTED';

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
  total_amount?: number;
  discount_amount?: number;
  cancel_reason?: string | null;
  timeline?: any | null;
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
  paymentStatus: string;
  status: OrderStatus;
  total: number;
  originalAmount: number;
  discountAmount: number;
  cancelReason?: string | null;
  timeline?: any | null;
  items: OrderItem[];
}

interface DashboardStats {
  tongDoanhThu: number;
  tongSoDon: number;
  donChoDuyet: number;
  donDangDongGoi: number;
  donDangGiao: number;
  donDaHuy: number;
  donYeuCauHuy: number;
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
    case 'CancelRequested':
      return 'CANCEL_REQUESTED';
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
    case 'CANCEL_REQUESTED':
      return 'CancelRequested';
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
  },
  CANCEL_REQUESTED: {
    label: 'Yêu cầu huỷ',
    color: 'orange',
    icon: <Clock3 size={14} />
  }
};

// =========================
// COMPONENT
// =========================

export default function Orders() {
  const [searchParams, setSearchParams] = useSearchParams();
  const openOrderId = searchParams.get('openOrderId');

  const [messageApi, contextHolder] = message.useMessage();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const [stats, setStats] = useState<DashboardStats>({
    tongDoanhThu: 0,
    tongSoDon: 0,
    donChoDuyet: 0,
    donDangDongGoi: 0,
    donDangGiao: 0,
    donDaHuy: 0,
    donYeuCauHuy: 0
  });

  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [cancelRequestModalVisible, setCancelRequestModalVisible] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  // =========================
  // FORMAT
  // =========================

  const dinhDangTien = (soTien?: number | null) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(Number(soTien || 0));
  };

  // =========================
  // API
  // =========================

  const taiThongKe = async () => {
    try {
      const res = await axiosInstance.get(`${ip}/admin/orders/stats`);
      const data = res.data?.data || {};

      setStats({
        tongDoanhThu: data.tongDoanhThu || 0,
        tongSoDon: data.tongSoDon || 0,
        donChoDuyet: data.donChoDuyet || 0,
        donDangDongGoi: data.donDangDongGoi || 0,
        donDangGiao: data.donDangGiao || 0,
        donDaHuy: data.donDaHuy || 0,
        donYeuCauHuy: data.donYeuCauHuy || 0
      });
    } catch (error) {
      console.log(error);
    }
  };

  const taiDanhSachDonHang = async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get(`${ip}/admin/orders`);
      const data = res.data?.data || [];

      const mapped: Order[] = data.map((order: BackendOrder) => ({
        id: String(order.id),
        customerName:
          order.nguoiNhan ||
          order.khachHang?.name ||
          '---',
        phone: order.soDienThoaiNhan || '---',
        email: order.khachHang?.email || '---',
        address: order.diaChiGiaoHang || '---',
        date: new Date(order.created_at).toLocaleString('vi-VN'),
        paymentMethod: order.thanhToan?.method || '---',
        paymentStatus: order.payment_status || '---',
        status: mapBackendStatusToFrontend(order.status),
        total: Number(order.final_amount || 0),
        originalAmount: Number(order.total_amount || order.final_amount || 0),
        discountAmount: Number(order.discount_amount || 0),
        cancelReason: order.cancel_reason || null,
        timeline: order.timeline || (order as any).shipping_address?.timeline || null,
        items: ((order as any).order_items || (order as any).chiTietDonHang || [])?.map(
          (item: any) => {
            const prod = item.product || item.sanPhamChiTiet?.sanPham || {};
            const bienThe = item.sanPhamChiTiet || {};
            return {
              id: String(item.id),
              name: prod.name || prod.tenSanPham || 'Sản phẩm',
              image: prod.image_url || prod.hinhAnh || '',
              sku: item.sku || prod.sku || bienThe.sku || '---',
              color: prod.color || bienThe.mauSac?.tenMau || '---',
              size: prod.size || bienThe.kichThuoc?.tenKichThuoc || '---',
              quantity: Number(item.quantity || 0),
              price: Number(item.price || item.unit_price || 0)
            };
          }
        ) || []
      }));

      setOrders(mapped);
    } catch (error) {
      console.log(error);
      messageApi.error('Không thể tải đơn hàng');
    } finally {
      setLoading(false);
    }
  };

  // =========================
  // UPDATE STATUS
  // =========================

  const capNhatTrangThaiDonHang = async (orderId: string, newStatus: OrderStatus) => {
    try {
      setActionLoading(true);
      const res = await axiosInstance.patch(`${ip}/admin/orders/${orderId}/status`, {
        status: mapFrontendStatusToBackend(newStatus)
      });

      messageApi.success('Cập nhật trạng thái thành công');

      await taiDanhSachDonHang();
      await taiThongKe();

      const updatedOrderRaw = res.data?.data;
      if (updatedOrderRaw) {
        const mappedItem = {
          id: String(updatedOrderRaw.id),
          customerName: updatedOrderRaw.nguoiNhan || updatedOrderRaw.khachHang?.name || '---',
          phone: updatedOrderRaw.soDienThoaiNhan || '---',
          email: updatedOrderRaw.khachHang?.email || '---',
          address: updatedOrderRaw.diaChiGiaoHang || '---',
          date: new Date(updatedOrderRaw.created_at).toLocaleString('vi-VN'),
          paymentMethod: updatedOrderRaw.thanhToan?.method || '---',
          paymentStatus: updatedOrderRaw.payment_status || '---',
          status: mapBackendStatusToFrontend(updatedOrderRaw.status),
          total: Number(updatedOrderRaw.final_amount || 0),
          originalAmount: Number(updatedOrderRaw.total_amount || updatedOrderRaw.final_amount || 0),
          discountAmount: Number(updatedOrderRaw.discount_amount || 0),
          cancelReason: updatedOrderRaw.cancel_reason || null,
          timeline: updatedOrderRaw.timeline || updatedOrderRaw.shipping_address?.timeline || null,
          items: ((updatedOrderRaw.order_items || updatedOrderRaw.chiTietDonHang || []) as any[])?.map(
            (item: any) => {
              const prod = item.product || item.sanPhamChiTiet?.sanPham || {};
              const bienThe = item.sanPhamChiTiet || {};
              return {
                id: String(item.id),
                name: prod.name || prod.tenSanPham || 'Sản phẩm',
                image: prod.image_url || prod.hinhAnh || '',
                sku: item.sku || prod.sku || bienThe.sku || '---',
                color: prod.color || bienThe.mauSac?.tenMau || '---',
                size: prod.size || bienThe.kichThuoc?.tenKichThuoc || '---',
                quantity: Number(item.quantity || 0),
                price: Number(item.price || item.unit_price || 0)
              };
            }
          ) || []
        };
        setSelectedOrder(mappedItem);
      }
    } catch (error) {
      console.log(error);
      messageApi.error('Không thể cập nhật trạng thái');
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

  useEffect(() => {
    if (openOrderId && orders.length > 0) {
      const foundOrder = orders.find(o => String(o.id) === String(openOrderId));
      if (foundOrder) {
        setSelectedOrder(foundOrder);
        setIsDrawerOpen(true);
        const newParams = new URLSearchParams(searchParams);
        newParams.delete('openOrderId');
        setSearchParams(newParams, { replace: true });
      }
    }
  }, [openOrderId, orders, setSearchParams, searchParams]);

  // =========================
  // FILTER
  // =========================

  const filteredOrders = useMemo(() => {
    let result = orders;

    if (filterStatus !== 'ALL') {
      result = result.filter(o => o.status === filterStatus);
    }

    if (searchText.trim()) {
      const keyword = searchText.toLowerCase();
      result = result.filter(
        o =>
          o.id.toLowerCase().includes(keyword) ||
          o.customerName.toLowerCase().includes(keyword) ||
          o.phone.toLowerCase().includes(keyword)
      );
    }

    return result;
  }, [orders, filterStatus, searchText]);

  // =========================
  // STEP
  // =========================

  const getStepCurrent = (status: OrderStatus) => {
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
      case 'FAILED':
        return 4;
      default:
        return 0;
    }
  };

  // =========================
  // ACTION BUTTONS
  // =========================

  const handleRejectCancel = (order: Order) => {
    const timeline = order.timeline || {};
    let restoredStatus: OrderStatus = 'PENDING';
    if (timeline.Packing) {
      restoredStatus = 'PACKING';
    } else if (timeline.Confirmed) {
      restoredStatus = 'CONFIRMED';
    }
    capNhatTrangThaiDonHang(order.id, restoredStatus);
  };

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
              className="rounded-xl bg-green-600 border-none"
              onClick={() => capNhatTrangThaiDonHang(selectedOrder.id, 'CONFIRMED')}
            >
              Duyệt đơn hàng
            </Button>
            <Button
              danger
              size="large"
              loading={actionLoading}
              className="rounded-xl"
              onClick={() => capNhatTrangThaiDonHang(selectedOrder.id, 'FAILED')}
            >
              Huỷ đơn
            </Button>
            {selectedOrder.cancelReason && (
              <Button
                type="dashed"
                danger
                size="large"
                icon={<AlertTriangle size={18} />}
                className="rounded-xl flex items-center gap-2 border-amber-500 text-amber-600 hover:text-amber-700 hover:border-amber-600"
                onClick={() => setCancelRequestModalVisible(true)}
              >
                Xem yêu cầu hủy
              </Button>
            )}
          </Space>
        );

      case 'CONFIRMED':
        return (
          <Space wrap>
            <Button
              type="primary"
              size="large"
              loading={actionLoading}
              className="rounded-xl border-none bg-blue-600 hover:bg-blue-700"
              onClick={() => capNhatTrangThaiDonHang(selectedOrder.id, 'PACKING')}
            >
              Bắt đầu soạn hàng
            </Button>
            <Button
              danger
              size="large"
              loading={actionLoading}
              className="rounded-xl"
              onClick={() => capNhatTrangThaiDonHang(selectedOrder.id, 'FAILED')}
            >
              Huỷ đơn
            </Button>
            {selectedOrder.cancelReason && (
              <Button
                type="dashed"
                danger
                size="large"
                icon={<AlertTriangle size={18} />}
                className="rounded-xl flex items-center gap-2 border-amber-500 text-amber-600 hover:text-amber-700 hover:border-amber-600"
                onClick={() => setCancelRequestModalVisible(true)}
              >
                Xem yêu cầu hủy
              </Button>
            )}
          </Space>
        );

      case 'PACKING':
        return (
          <Space wrap>
            <Button
              type="primary"
              size="large"
              loading={actionLoading}
              className="rounded-xl bg-purple-600 border-none"
              onClick={() => capNhatTrangThaiDonHang(selectedOrder.id, 'SHIPPING')}
            >
              Bắt đầu vận chuyển
            </Button>
            <Button
              danger
              size="large"
              loading={actionLoading}
              className="rounded-xl"
              onClick={() => capNhatTrangThaiDonHang(selectedOrder.id, 'FAILED')}
            >
              Huỷ đơn
            </Button>
            {selectedOrder.cancelReason && (
              <Button
                type="dashed"
                danger
                size="large"
                icon={<AlertTriangle size={18} />}
                className="rounded-xl flex items-center gap-2 border-amber-500 text-amber-600 hover:text-amber-700 hover:border-amber-600"
                onClick={() => setCancelRequestModalVisible(true)}
              >
                Xem yêu cầu hủy
              </Button>
            )}
          </Space>
        );

      case 'SHIPPING':
        return (
          <Space wrap>
            <Button
              type="primary"
              size="large"
              loading={actionLoading}
              className="rounded-xl bg-green-600 border-none"
              onClick={() => capNhatTrangThaiDonHang(selectedOrder.id, 'SUCCESS')}
            >
              Giao hàng thành công
            </Button>
            <Button
              danger
              size="large"
              loading={actionLoading}
              className="rounded-xl"
              onClick={() => capNhatTrangThaiDonHang(selectedOrder.id, 'FAILED')}
            >
              Giao hàng thất bại
            </Button>
            {selectedOrder.cancelReason && (
              <Button
                type="dashed"
                danger
                size="large"
                icon={<AlertTriangle size={18} />}
                className="rounded-xl flex items-center gap-2 border-amber-500 text-amber-600 hover:text-amber-700 hover:border-amber-600"
                onClick={() => setCancelRequestModalVisible(true)}
              >
                Xem yêu cầu hủy
              </Button>
            )}
          </Space>
        );

      case 'CANCEL_REQUESTED':
        return (
          <Space wrap>
            <Button
              type="primary"
              size="large"
              loading={actionLoading}
              icon={<AlertTriangle size={18} />}
              className="rounded-xl bg-amber-500 hover:bg-amber-600 border-none text-white flex items-center gap-2"
              onClick={() => setCancelRequestModalVisible(true)}
            >
              Xem yêu cầu hủy
            </Button>
            <Button
              size="large"
              loading={actionLoading}
              className="rounded-xl"
              onClick={() => handleRejectCancel(selectedOrder)}
            >
              Từ chối hủy (Tiếp tục xử lý)
            </Button>
          </Space>
        );

      case 'SUCCESS':
        return (
          <Tag color="success" className="px-5 py-2 rounded-full">
            Đơn hàng đã hoàn thành
          </Tag>
        );

      case 'FAILED':
        return (
          <Space wrap align="center">
            <Tag color="error" className="px-5 py-2 rounded-full m-0">
              Đơn hàng đã bị huỷ
            </Tag>
            {selectedOrder.cancelReason && (
              <Button
                type="dashed"
                danger
                size="large"
                icon={<AlertTriangle size={18} />}
                className="rounded-xl flex items-center gap-2 border-amber-500 text-amber-600 hover:text-amber-700 hover:border-amber-600"
                onClick={() => setCancelRequestModalVisible(true)}
              >
                Xem lý do hủy
              </Button>
            )}
          </Space>
        );

      default:
        return null;
    }
  };

  // =========================
  // TABLE
  // =========================

  const columns: ColumnsType<Order> = [
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
            {record.customerName}
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
        <Tag color="geekblue" className="px-3 py-1 rounded-full">
          {record.paymentMethod}
        </Tag>
      )
    },
    {
      title: 'Tổng Tiền',
      render: (_, record) => (
        <span className="font-bold text-green-600">
          {dinhDangTien(record.total)}
        </span>
      )
    },
    {
      title: 'Trạng Thái',
      render: (_, record) => (
        <Tag
          color={statusConfig[record.status].color}
          icon={statusConfig[record.status].icon}
          className="px-3 py-1 rounded-full"
        >
          {statusConfig[record.status].label}
        </Tag>
      )
    },
    {
      title: 'Hành Động',
      render: (_, record) => (
        <div className="flex items-center gap-2">
          <Button
            className="rounded-xl hover:text-red-600 hover:border-red-600"
            icon={<Eye size={16} />}
            onClick={() => {
              setSelectedOrder(record);
              setIsDrawerOpen(true);
            }}
          >
            Xem chi tiết
          </Button>
          {record.status === 'CANCEL_REQUESTED' && (
            <AntdTooltip title="Đơn hàng này có yêu cầu hủy từ khách hàng!">
              <AlertTriangle size={20} className="text-amber-500 animate-bounce cursor-pointer" />
            </AntdTooltip>
          )}
        </div>
      )
    }
  ];

  // =========================
  // EXPORT CSV
  // =========================

  const exportCSV = () => {
    const headers = ['Mã đơn', 'Khách hàng', 'SĐT', 'Thanh toán', 'Tổng tiền'].join(',');
    const rows = filteredOrders
      .map(o => `"${o.id}","${o.customerName}","${o.phone}","${o.paymentMethod}","${o.total}"`)
      .join('\n');

    const csv = '\uFEFF' + headers + '\n' + rows;
    const blob = new Blob([csv], { type: 'text/csv' });
    const link = document.createElement('a');

    link.href = URL.createObjectURL(blob);
    link.download = 'orders.csv';
    link.click();
  };

  // =========================
  // UI
  // =========================

  return (
    <div className="min-h-screen bg-[#f4f6fb] p-7">
      {contextHolder}

      {/* HEADER */}
      <div className="bg-white rounded-[24px] border border-gray-200 p-8 shadow-sm mb-7">
        <div className="flex justify-between items-start flex-wrap gap-5">
          <div>
            <h1 className="text-5xl font-black text-[#111827]">
              Quản Lý Đơn Hàng
            </h1>
            <p className="text-gray-500 mt-3 text-lg">
              Quản lý vòng đời đơn hàng, kiểm duyệt và vận chuyển
            </p>
          </div>

          <Button
            type="primary"
            danger
            size="large"
            className="h-[54px] px-7 rounded-2xl font-semibold bg-red-600 hover:bg-red-700 border-none"
            icon={<RefreshCw size={18} />}
            onClick={() => {
              taiThongKe();
              taiDanhSachDonHang();
            }}
          >
            Làm mới dữ liệu
          </Button>
        </div>
      </div>

      {/* DASHBOARD STATS */}
      <div className="mb-8 space-y-6">
        {/* Thẻ Tổng doanh thu */}
        <Card className="bg-gradient-to-r from-red-600 to-red-500 rounded-[24px] shadow-lg border-none overflow-hidden relative">
          <div className="absolute top-0 right-0 -mr-10 -mt-10 w-64 h-64 rounded-full bg-white opacity-10 blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 right-1/4 w-40 h-40 rounded-full bg-black opacity-10 blur-2xl pointer-events-none" />
          
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between p-2">
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md border border-white/30 shadow-inner">
                <DollarSign size={32} className="text-white" />
              </div>
              <div>
                <p className="text-red-100 text-sm font-bold mb-1 uppercase tracking-wider">
                  Tổng doanh thu
                </p>
                <h2 className="text-4xl md:text-5xl font-black text-white drop-shadow-sm tracking-tight">
                  {dinhDangTien(stats.tongDoanhThu)}
                </h2>
              </div>
            </div>
          </div>
        </Card>

        {/* Các thẻ thống kê phụ trợ */}
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-6">
          {[
            {
              title: 'Tổng số đơn',
              value: stats.tongSoDon,
              icon: <ShoppingCart size={22} />,
              color: 'text-blue-600',
              bg: 'bg-blue-50',
            },
            {
              title: 'Chờ duyệt',
              value: stats.donChoDuyet,
              icon: <Clock3 size={22} />,
              color: 'text-orange-500',
              bg: 'bg-orange-50',
            },
            {
              title: 'Đóng gói',
              value: stats.donDangDongGoi,
              icon: <Package size={22} />,
              color: 'text-purple-600',
              bg: 'bg-purple-50',
            },
            {
              title: 'Đang giao',
              value: stats.donDangGiao,
              icon: <Truck size={22} />,
              color: 'text-cyan-600',
              bg: 'bg-cyan-50',
            },
            {
              title: 'Yêu cầu huỷ',
              value: stats.donYeuCauHuy,
              icon: <AlertTriangle size={22} />,
              color: 'text-amber-500',
              bg: 'bg-amber-50',
            },
            {
              title: 'Đã huỷ',
              value: stats.donDaHuy,
              icon: <Ban size={22} />,
              color: 'text-red-500',
              bg: 'bg-red-50',
            }
          ].map((item, index) => (
            <Card
              key={index}
              bordered={false}
              className="rounded-[24px] shadow-sm hover:shadow-md border border-gray-100 bg-white transition-all duration-300 hover:-translate-y-1"
              bodyStyle={{ padding: '24px' }}
            >
              <div className="flex flex-col gap-4">
                <div className="flex justify-between items-center">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${item.bg}`}>
                    <div className={item.color}>
                      {item.icon}
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className={`text-3xl font-black ${item.color} mb-1`}>
                    {item.value}
                  </h3>
                  <p className="text-gray-500 text-sm font-medium">
                    {item.title}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* FILTER */}
      <Card
        bordered={false}
        className="rounded-[24px] shadow-sm border border-gray-100"
      >
        <div className="flex flex-wrap gap-4 items-center">
          <Input
            size="large"
            placeholder="Tìm kiếm mã đơn, khách hàng..."
            prefix={<Search size={18} className="text-red-500" />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="rounded-2xl h-[54px] flex-1 min-w-[300px] border-gray-200 hover:border-red-400 focus:border-red-500 focus:ring-red-500"
          />

          <Select
            size="large"
            value={filterStatus}
            style={{ width: 240 }}
            onChange={(value) => setFilterStatus(value)}
            className="h-[54px]"
            options={[
              { label: 'Tất cả trạng thái', value: 'ALL' },
              { label: 'Chờ duyệt', value: 'PENDING' },
              { label: 'Yêu cầu huỷ', value: 'CANCEL_REQUESTED' },
              { label: 'Đã xác nhận', value: 'CONFIRMED' },
              { label: 'Đóng gói', value: 'PACKING' },
              { label: 'Đang giao', value: 'SHIPPING' },
              { label: 'Hoàn thành', value: 'SUCCESS' },
              { label: 'Đã huỷ', value: 'FAILED' }
            ]}
          />

          <Button
            size="large"
            icon={<Download size={18} />}
            onClick={exportCSV}
            className="rounded-2xl h-[54px] px-6 font-semibold border-gray-200 hover:text-red-600 hover:border-red-600"
          >
            Export CSV
          </Button>
        </div>
      </Card>

      {/* TABLE */}
      <Card
        bordered={false}
        className="rounded-[24px] shadow-sm border border-gray-100 mt-8 overflow-hidden"
      >
        <Table
          rowKey="id"
          loading={loading}
          columns={columns}
          dataSource={filteredOrders}
          pagination={{
            pageSize: 10,
            showSizeChanger: true
          }}
          locale={{
            emptyText: <Empty description="Không có đơn hàng" />
          }}
        />
      </Card>

      {/* DRAWER */}
      <Drawer
        title={<span className="text-lg font-bold text-gray-800">Chi tiết đơn hàng #{selectedOrder?.id || ''}</span>}
        open={isDrawerOpen}
        width={750}
        onClose={() => setIsDrawerOpen(false)}
      >
        {!selectedOrder ? (
          <Spin className="flex justify-center mt-20" />
        ) : (
          <div className="space-y-7">
            {/* CANCEL PROOF IF APPLICABLE */}
            {selectedOrder.status === 'CANCEL_REQUESTED' && (
              <Card className="rounded-2xl border-orange-200 bg-orange-50/20">
                <div className="flex items-start gap-4">
                  <XCircle className="text-orange-500 mt-1" size={24} />
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-orange-700">Yêu cầu hủy đơn từ khách hàng</h3>
                    <p className="text-gray-600 mt-2 text-[15px]">
                      <strong>Lý do khách hàng cung cấp:</strong>{' '}
                      {(() => {
                        try {
                          const parsed = JSON.parse(selectedOrder.cancelReason || '');
                          return parsed.reason || selectedOrder.cancelReason;
                        } catch {
                          return selectedOrder.cancelReason || 'Chưa cung cấp lý do';
                        }
                      })()}
                    </p>
                    {(() => {
                      try {
                        const parsed = JSON.parse(selectedOrder.cancelReason || '');
                        if (parsed.image) {
                          return (
                            <div className="mt-4">
                              <span className="text-sm font-semibold text-gray-500 block mb-2">Hình ảnh minh chứng hủy đơn:</span>
                              <Image
                                src={parsed.image}
                                alt="Minh chứng hủy hàng"
                                className="rounded-xl border border-gray-200 max-h-[300px] object-contain shadow-sm"
                              />
                            </div>
                          );
                        }
                      } catch {}
                      return null;
                    })()}
                  </div>
                </div>
              </Card>
            )}

            {selectedOrder.status === 'FAILED' && selectedOrder.cancelReason && (
              <Card className="rounded-2xl border-red-200 bg-red-50/20">
                <div className="flex items-start gap-4">
                  <XCircle className="text-red-500 mt-1" size={24} />
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-red-700">Đơn hàng đã bị hủy</h3>
                    <p className="text-gray-600 mt-2 text-[15px]">
                      <strong>Lý do hủy đơn:</strong>{' '}
                      {(() => {
                        try {
                          const parsed = JSON.parse(selectedOrder.cancelReason || '');
                          return parsed.reason || selectedOrder.cancelReason;
                        } catch {
                          return selectedOrder.cancelReason || 'Chưa cung cấp lý do';
                        }
                      })()}
                    </p>
                    {(() => {
                      try {
                        const parsed = JSON.parse(selectedOrder.cancelReason || '');
                        if (parsed.image) {
                          return (
                            <div className="mt-4">
                              <Image
                                src={parsed.image}
                                alt="Minh chứng hủy đơn"
                                className="rounded-xl border border-gray-200 max-h-[300px] object-contain shadow-sm"
                              />
                            </div>
                          );
                        }
                      } catch {}
                      return null;
                    })()}
                  </div>
                </div>
              </Card>
            )}

            {/* CUSTOMER */}
            <Card className="rounded-2xl border-gray-100 shadow-sm">
              <div className="flex items-start gap-4">
                <Avatar
                  size={64}
                  className="bg-red-500"
                  icon={<User size={28} />}
                />
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-gray-800">
                    {selectedOrder.customerName}
                  </h2>
                  <div className="mt-4 space-y-3">
                    <div className="flex items-center gap-3 text-gray-600">
                      <Phone size={16} className="text-red-400" />
                      {selectedOrder.phone}
                    </div>
                    <div className="flex items-center gap-3 text-gray-600">
                      <Mail size={16} className="text-red-400" />
                      {selectedOrder.email}
                    </div>
                    <div className="flex items-center gap-3 text-gray-600">
                      <MapPin size={16} className="text-red-400" />
                      {selectedOrder.address}
                    </div>
                    <div className="flex items-center gap-3 text-gray-600">
                      <CreditCard size={16} className="text-red-400" />
                      {selectedOrder.paymentMethod} ({selectedOrder.paymentStatus})
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* PRODUCTS */}
            <Card className="rounded-2xl border-gray-100 shadow-sm">
              <div className="flex justify-between items-center mb-5">
                <h2 className="text-xl font-bold text-gray-800">
                  Danh sách sản phẩm
                </h2>
                <div className="text-2xl font-black text-red-600">
                  {dinhDangTien(selectedOrder.total)}
                </div>
              </div>

              <div className="space-y-4 mb-6">
                {selectedOrder.items.length === 0 && (
                  <Empty description="Không có sản phẩm" />
                )}

                {selectedOrder.items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-4 border border-gray-100 rounded-2xl p-4 bg-gray-50/50"
                  >
                    <Image
                      width={90}
                      height={90}
                      className="rounded-xl object-cover"
                      src={item.image}
                      fallback="https://placehold.co/100x100"
                    />
                    <div className="flex-1">
                      <h3 className="font-bold text-lg text-gray-800">
                        {item.name}
                      </h3>
                      <div className="grid grid-cols-2 gap-3 mt-3 text-sm text-gray-500">
                        <div>SKU: <span className="font-medium text-gray-700">{item.sku}</span></div>
                        <div>Màu: <span className="font-medium text-gray-700">{item.color}</span></div>
                        <div>Size: <span className="font-medium text-gray-700">{item.size}</span></div>
                        <div>SL: <span className="font-medium text-gray-700">{item.quantity}</span></div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-bold text-red-600">
                        {dinhDangTien(item.price)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <Divider className="my-4" />

              {/* PAYMENT BREAKDOWN */}
              <div className="space-y-3 text-right">
                <div className="flex justify-between text-gray-600 text-sm">
                  <span>Tạm tính:</span>
                  <span className="font-medium">{dinhDangTien(selectedOrder.originalAmount)}</span>
                </div>
                {selectedOrder.discountAmount > 0 && (
                  <div className="flex justify-between text-red-500 text-sm">
                    <span>Giảm giá (Voucher):</span>
                    <span className="font-medium">-{dinhDangTien(selectedOrder.discountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between items-center text-[16px] font-black border-t border-gray-100 pt-3 mt-3">
                  <span>Tổng cộng:</span>
                  <span className="text-red-600 text-2xl">{dinhDangTien(selectedOrder.total)}</span>
                </div>
              </div>
            </Card>

            {/* STEPS */}
            <Card className="rounded-2xl border-gray-100 shadow-sm">
              <h2 className="text-xl font-bold mb-6 text-gray-800">
                Tiến trình đơn hàng
              </h2>
              {(() => {
                const timeline = selectedOrder.timeline || {};
                const formatTimelineTime = (isoString?: string) => {
                  if (!isoString) return "";
                  const date = new Date(isoString);
                  return date.toLocaleString("vi-VN", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit"
                  });
                };
                
                return (
                  <Steps
                    current={getStepCurrent(selectedOrder.status)}
                    status={
                      selectedOrder.status === 'FAILED'
                        ? 'error'
                        : selectedOrder.status === 'CANCEL_REQUESTED'
                        ? 'error'
                        : 'process'
                    }
                    items={[
                      {
                        title: 'Chờ duyệt',
                        description: timeline.Pending ? formatTimelineTime(timeline.Pending) : ''
                      },
                      {
                        title: 'Xác nhận',
                        description: timeline.Confirmed ? formatTimelineTime(timeline.Confirmed) : ''
                      },
                      {
                        title: 'Đóng gói',
                        description: timeline.Packing ? formatTimelineTime(timeline.Packing) : ''
                      },
                      {
                        title: 'Vận chuyển',
                        description: timeline.Shipping ? formatTimelineTime(timeline.Shipping) : ''
                      },
                      {
                        title: selectedOrder.status === 'FAILED' ? 'Bị hủy' : 'Hoàn thành',
                        description: selectedOrder.status === 'FAILED' 
                          ? ''
                          : (timeline.Completed ? formatTimelineTime(timeline.Completed) : '')
                      }
                    ]}
                  />
                );
              })()}
            </Card>

            {/* ACTIONS */}
            <Card className="rounded-2xl border-gray-100 shadow-sm bg-gray-50/50">
              <h2 className="text-xl font-bold mb-5 text-gray-800">
                Điều hướng nghiệp vụ
              </h2>
              {renderActionButtons()}
            </Card>
          </div>
        )}
      </Drawer>

      {/* Modal Xem Yêu Cầu Hủy Đơn Hàng */}
      <Modal
        title={
          <span className="flex items-center gap-2 text-red-600 font-bold text-lg">
            <AlertTriangle size={22} className="text-red-500" />
            Yêu Cầu Hủy Đơn Hàng #{selectedOrder?.id}
          </span>
        }
        open={cancelRequestModalVisible}
        onCancel={() => setCancelRequestModalVisible(false)}
        footer={[
          <Button
            key="reject"
            size="large"
            className="rounded-xl"
            loading={actionLoading}
            onClick={() => {
              if (selectedOrder) {
                handleRejectCancel(selectedOrder);
                setCancelRequestModalVisible(false);
              }
            }}
          >
            Từ chối hủy (Tiếp tục xử lý)
          </Button>,
          <Button
            key="approve"
            type="primary"
            danger
            size="large"
            loading={actionLoading}
            className="rounded-xl bg-red-600 hover:bg-red-700 border-none"
            onClick={async () => {
              if (selectedOrder) {
                await capNhatTrangThaiDonHang(selectedOrder.id, 'FAILED');
                setCancelRequestModalVisible(false);
                setIsDrawerOpen(false); 
              }
            }}
          >
            Đồng ý hủy đơn (Hoàn lại kho)
          </Button>,
          <Button
            key="close"
            size="large"
            className="rounded-xl"
            onClick={() => setCancelRequestModalVisible(false)}
          >
            Đóng
          </Button>
        ]}
        width={600}
        destroyOnClose
      >
        {selectedOrder && (() => {
          const parseCancelReason = (reasonStr?: string | null) => {
            if (!reasonStr) return { reason: "Không có lý do cụ thể", image: null };
            try {
              const parsed = JSON.parse(reasonStr);
              if (parsed && typeof parsed === 'object') {
                return {
                  reason: parsed.reason || "Không có lý do cụ thể",
                  image: parsed.image || null
                };
              }
            } catch (e) {}
            return { reason: reasonStr, image: null };
          };

          const info = parseCancelReason(selectedOrder.cancelReason);

          return (
            <div className="space-y-6 py-4">
              <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-2xl">
                <p className="text-red-700 font-semibold mb-1">Cảnh báo nghiệp vụ:</p>
                <p className="text-red-600 text-sm">
                  Nếu đồng ý hủy đơn hàng này, toàn bộ số lượng sản phẩm đã mua sẽ được tự động hoàn trả lại vào tồn kho trong kho hàng theo thời gian thực.
                </p>
              </div>

              <div>
                <h3 className="text-gray-500 text-sm font-semibold mb-2">LÝ DO YÊU CẦU HỦY ĐƠN:</h3>
                <div className="bg-white border border-gray-200 p-4 rounded-2xl text-gray-800 text-base italic leading-relaxed shadow-sm">
                  "{info.reason}"
                </div>
              </div>

              {info.image && (
                <div>
                  <h3 className="text-gray-500 text-sm font-semibold mb-2">HÌNH ẢNH MINH CHỨNG ĐÍNH KÈM:</h3>
                  <div className="flex justify-center border border-dashed border-red-200 p-4 rounded-2xl bg-white shadow-sm">
                    <Image
                      src={info.image}
                      alt="Proof of Cancellation"
                      style={{ maxHeight: 300, objectFit: 'contain', borderRadius: 12 }}
                      className="max-w-full"
                    />
                  </div>
                </div>
              )}
            </div>
          );
        })()}
      </Modal>
    </div>
  );
}