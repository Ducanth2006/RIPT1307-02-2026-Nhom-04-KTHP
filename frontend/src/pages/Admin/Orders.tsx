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
  Statistic,
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
  donHoanThanh: number;
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
    donYeuCauHuy: 0,
    donHoanThanh: 0
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
        donYeuCauHuy: data.donYeuCauHuy || 0,
        donHoanThanh: data.donHoanThanh || 0
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
              loading={actionLoading}
              className="bg-green-600 border-none"
              onClick={() => capNhatTrangThaiDonHang(selectedOrder.id, 'CONFIRMED')}
            >
              Duyệt đơn hàng
            </Button>
            <Button
              danger
              loading={actionLoading}
              onClick={() => capNhatTrangThaiDonHang(selectedOrder.id, 'FAILED')}
            >
              Huỷ đơn
            </Button>
            {selectedOrder.cancelReason && (
              <Button
                type="dashed"
                danger
                icon={<AlertTriangle size={16} />}
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
              loading={actionLoading}
              className="bg-blue-600 border-none hover:bg-blue-700"
              onClick={() => capNhatTrangThaiDonHang(selectedOrder.id, 'PACKING')}
            >
              Bắt đầu soạn hàng
            </Button>
            <Button
              danger
              loading={actionLoading}
              onClick={() => capNhatTrangThaiDonHang(selectedOrder.id, 'FAILED')}
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
              loading={actionLoading}
              className="bg-purple-600 border-none"
              onClick={() => capNhatTrangThaiDonHang(selectedOrder.id, 'SHIPPING')}
            >
              Bắt đầu vận chuyển
            </Button>
            <Button
              danger
              loading={actionLoading}
              onClick={() => capNhatTrangThaiDonHang(selectedOrder.id, 'FAILED')}
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
              loading={actionLoading}
              className="bg-green-600 border-none"
              onClick={() => capNhatTrangThaiDonHang(selectedOrder.id, 'SUCCESS')}
            >
              Giao hàng thành công
            </Button>
            <Button
              danger
              loading={actionLoading}
              onClick={() => capNhatTrangThaiDonHang(selectedOrder.id, 'FAILED')}
            >
              Giao hàng thất bại
            </Button>
          </Space>
        );

      case 'CANCEL_REQUESTED':
        return (
          <Space wrap>
            <Button
              type="primary"
              loading={actionLoading}
              icon={<AlertTriangle size={16} />}
              className="bg-amber-500 hover:bg-amber-600 border-none text-white flex items-center gap-2"
              onClick={() => setCancelRequestModalVisible(true)}
            >
              Xem yêu cầu hủy
            </Button>
            <Button
              loading={actionLoading}
              onClick={() => handleRejectCancel(selectedOrder)}
            >
              Từ chối hủy (Tiếp tục xử lý)
            </Button>
          </Space>
        );

      case 'SUCCESS':
        return (
          <Tag color="success" className="px-4 py-1.5 rounded-full">
            Đơn hàng đã hoàn thành
          </Tag>
        );

      case 'FAILED':
        return (
          <Space wrap align="center">
            <Tag color="error" className="px-4 py-1.5 rounded-full m-0">
              Đơn hàng đã bị huỷ
            </Tag>
            {selectedOrder.cancelReason && (
              <Button
                type="dashed"
                danger
                icon={<AlertTriangle size={16} />}
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
        <span className="font-semibold text-[#af101a]">
          #{id}
        </span>
      )
    },
    {
      title: 'Khách Hàng',
      render: (_, record) => (
        <div>
          <div className="font-semibold text-[15px] text-[#191c1e]">
            {record.customerName}
          </div>
          <div className="text-[#5b403d] text-sm mt-1">
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
        <Tag color="processing" className="rounded-full px-3 py-1">
          {record.paymentMethod}
        </Tag>
      )
    },
    {
      title: 'Tổng Tiền',
      render: (_, record) => (
        <span className="font-bold text-[#15803d]">
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
          className="rounded-full px-3 py-1"
        >
          {statusConfig[record.status].label}
        </Tag>
      )
    },
    {
      title: 'Hành Động',
      key: 'action',
      width: 140,
      render: (_, record) => (
        <div className="flex items-center gap-3">
          <Button
            type="text"
            icon={<Eye size={16} />}
            onClick={() => {
              setSelectedOrder(record);
              setIsDrawerOpen(true);
            }}
          />
          {record.status === 'CANCEL_REQUESTED' && (
            <AntdTooltip title="Yêu cầu hủy từ khách hàng!">
              <AlertTriangle size={18} className="text-amber-500 animate-pulse cursor-pointer" />
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
    <div className="p-4 md:p-6 max-w-[1600px] mx-auto space-y-6">
      {contextHolder}

      {/* HEADER */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#191c1e] flex items-center gap-3">
            <ShoppingCart size={30} className="text-[#af101a]" />
            Quản Lý Đơn Hàng
          </h1>
          <p className="text-[#5b403d] mt-2">
            Quản lý vòng đời đơn hàng, kiểm duyệt và vận chuyển.
          </p>
        </div>

        <Space wrap>
          <Button
            size="large"
            icon={<RefreshCw size={16} />}
            onClick={() => {
              taiThongKe();
              taiDanhSachDonHang();
            }}
          >
            Làm mới
          </Button>

          <Button
            size="large"
            icon={<Download size={18} />}
            onClick={exportCSV}
            className="border-[#ead0d0] hover:!text-[#af101a] hover:!border-[#af101a]"
          >
            Xuất CSV
          </Button>
        </Space>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {/* Tổng doanh thu */}
        <div className="bg-white border border-[#e4beba] border-t-2 border-t-[#af101a] rounded-xl p-4 shadow-sm relative overflow-hidden group transition-all hover:shadow-md">
          <div className="flex justify-between items-start mb-2">
            <span className="text-[11px] font-bold text-[#5b403d] uppercase tracking-wider">
              Tổng doanh thu
            </span>
            <div className="w-8 h-8 rounded-lg bg-[#fff2f0] flex items-center justify-center">
              <DollarSign size={16} className="text-[#af101a]" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <h2 className="text-2xl font-black text-[#191c1e]">
              {dinhDangTien(stats.tongDoanhThu)}
            </h2>
          </div>
        </div>

        {/* Tổng số đơn */}
        <div className="bg-white border border-[#e4beba] rounded-xl p-4 shadow-sm relative overflow-hidden group transition-all hover:shadow-md">
          <div className="flex justify-between items-start mb-2">
            <span className="text-[11px] font-bold text-[#5b403d] uppercase tracking-wider">
              Tổng số đơn
            </span>
            <div className="w-8 h-8 rounded-lg bg-[#eff6ff] flex items-center justify-center">
              <ShoppingCart size={16} className="text-blue-600" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <h2 className="text-2xl font-black text-[#191c1e]">
              {stats.tongSoDon}
            </h2>
          </div>
        </div>

        {/* Chờ duyệt */}
        <div className="bg-white border border-[#e4beba] rounded-xl p-4 shadow-sm relative overflow-hidden group transition-all hover:shadow-md">
          <div className="flex justify-between items-start mb-2">
            <span className="text-[11px] font-bold text-[#5b403d] uppercase tracking-wider">
              Chờ duyệt
            </span>
            <div className="w-8 h-8 rounded-lg bg-[#fff7ed] flex items-center justify-center">
              <Clock3 size={16} className="text-orange-500" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <h2 className="text-2xl font-black text-[#191c1e]">
              {stats.donChoDuyet}
            </h2>
          </div>
        </div>

        {/* Đang đóng gói */}
        <div className="bg-white border border-[#e4beba] rounded-xl p-4 shadow-sm relative overflow-hidden group transition-all hover:shadow-md">
          <div className="flex justify-between items-start mb-2">
            <span className="text-[11px] font-bold text-[#5b403d] uppercase tracking-wider">
              Đang đóng gói
            </span>
            <div className="w-8 h-8 rounded-lg bg-[#f5f3ff] flex items-center justify-center">
              <Package size={16} className="text-purple-600" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <h2 className="text-2xl font-black text-[#191c1e]">
              {stats.donDangDongGoi}
            </h2>
          </div>
        </div>

        {/* Đang giao */}
        <div className="bg-white border border-[#e4beba] rounded-xl p-4 shadow-sm relative overflow-hidden group transition-all hover:shadow-md">
          <div className="flex justify-between items-start mb-2">
            <span className="text-[11px] font-bold text-[#5b403d] uppercase tracking-wider">
              Đang giao
            </span>
            <div className="w-8 h-8 rounded-lg bg-[#ecfeff] flex items-center justify-center">
              <Truck size={16} className="text-cyan-600" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <h2 className="text-2xl font-black text-[#191c1e]">
              {stats.donDangGiao}
            </h2>
          </div>
        </div>

        {/* Yêu cầu huỷ */}
        <div className="bg-white border border-[#e4beba] rounded-xl p-4 shadow-sm relative overflow-hidden group transition-all hover:shadow-md">
          <div className="flex justify-between items-start mb-2">
            <span className="text-[11px] font-bold text-[#5b403d] uppercase tracking-wider">
              Yêu cầu huỷ
            </span>
            <div className="w-8 h-8 rounded-lg bg-[#fffbeb] flex items-center justify-center">
              <AlertTriangle size={16} className="text-amber-500" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <h2 className="text-2xl font-black text-[#191c1e]">
              {stats.donYeuCauHuy}
            </h2>
          </div>
        </div>

        {/* Đã huỷ */}
        <div className="bg-white border border-[#e4beba] rounded-xl p-4 shadow-sm relative overflow-hidden group transition-all hover:shadow-md">
          <div className="flex justify-between items-start mb-2">
            <span className="text-[11px] font-bold text-[#5b403d] uppercase tracking-wider">
              Đã huỷ
            </span>
            <div className="w-8 h-8 rounded-lg bg-[#fef2f2] flex items-center justify-center">
              <Ban size={16} className="text-red-500" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <h2 className="text-2xl font-black text-[#191c1e]">
              {stats.donDaHuy}
            </h2>
          </div>
        </div>

        {/* Đã hoàn thành */}
        <div className="bg-white border border-[#e4beba] rounded-xl p-4 shadow-sm relative overflow-hidden group transition-all hover:shadow-md">
          <div className="flex justify-between items-start mb-2">
            <span className="text-[11px] font-bold text-[#5b403d] uppercase tracking-wider">
              Đã hoàn thành
            </span>
            <div className="w-8 h-8 rounded-lg bg-[#f0fdf4] flex items-center justify-center">
              <CheckCircle size={16} className="text-[#16a34a]" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <h2 className="text-2xl font-black text-[#191c1e]">
              {stats.donHoanThanh}
            </h2>
          </div>
        </div>
      </div>

      {/* MAIN */}
      <div className="bg-white border border-[#e4beba] rounded-xl shadow-sm overflow-hidden">
        
        {/* FILTER */}
        <div className="p-5 border-b border-[#f1dede]">
          <div className="flex flex-wrap gap-3 items-center">
            <Input
              placeholder="Tìm mã đơn, khách hàng..."
              prefix={<Search size={16} />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              allowClear
              size="large"
              className="max-w-md"
            />

            <Select
              size="large"
              value={filterStatus}
              onChange={(value) => setFilterStatus(value)}
              style={{ width: 220 }}
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
          </div>
        </div>

        {/* TABLE */}
        <div className="p-4">
          <Table<Order>
            rowKey="id"
            loading={loading}
            columns={columns}
            dataSource={filteredOrders}
            scroll={{ x: 1000 }}
            pagination={{
              pageSize: 10,
              showSizeChanger: true
            }}
            locale={{
              emptyText: <Empty description="Không có đơn hàng" />
            }}
          />
        </div>
      </div>

      {/* DRAWER */}
      <Drawer
        title={<span className="text-lg font-bold text-[#191c1e]">Chi tiết đơn hàng #{selectedOrder?.id || ''}</span>}
        open={isDrawerOpen}
        width={750}
        onClose={() => setIsDrawerOpen(false)}
      >
        {!selectedOrder ? (
          <Spin className="flex justify-center mt-20" />
        ) : (
          <div className="space-y-6">
            {/* CANCEL PROOF IF APPLICABLE */}
            {selectedOrder.status === 'CANCEL_REQUESTED' && (
              <Card className="rounded-2xl border border-amber-200 bg-amber-50/50 shadow-sm">
                <div className="flex items-start gap-4">
                  <XCircle className="text-amber-500 mt-1" size={24} />
                  <div className="flex-1">
                    <h3 className="text-[16px] font-bold text-amber-700">Yêu cầu hủy đơn từ khách hàng</h3>
                    <p className="text-[#5b403d] mt-2 text-[14px]">
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
                              <span className="text-sm font-semibold text-[#5b403d] block mb-2">Minh chứng hủy đơn:</span>
                              <Image
                                src={parsed.image}
                                alt="Minh chứng hủy hàng"
                                className="rounded-xl border border-[#ead0d0] max-h-[300px] object-contain"
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
              <Card className="rounded-2xl border border-red-200 bg-red-50/50 shadow-sm">
                <div className="flex items-start gap-4">
                  <XCircle className="text-red-500 mt-1" size={24} />
                  <div className="flex-1">
                    <h3 className="text-[16px] font-bold text-red-700">Đơn hàng đã bị hủy</h3>
                    <p className="text-[#5b403d] mt-2 text-[14px]">
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
                  </div>
                </div>
              </Card>
            )}

            {/* CUSTOMER */}
            <Card className="rounded-2xl border border-[#ead0d0] shadow-sm">
              <div className="flex items-start gap-4">
                <Avatar
                  size={54}
                  className="bg-[#f1dede] text-[#af101a]"
                  icon={<User size={24} />}
                />
                <div className="flex-1">
                  <h2 className="text-[18px] font-bold text-[#191c1e]">
                    {selectedOrder.customerName}
                  </h2>
                  <div className="mt-3 space-y-2">
                    <div className="flex items-center gap-3 text-[#5b403d] text-[14px]">
                      <Phone size={16} className="text-gray-400" />
                      {selectedOrder.phone}
                    </div>
                    <div className="flex items-center gap-3 text-[#5b403d] text-[14px]">
                      <Mail size={16} className="text-gray-400" />
                      {selectedOrder.email}
                    </div>
                    <div className="flex items-center gap-3 text-[#5b403d] text-[14px]">
                      <MapPin size={16} className="text-gray-400" />
                      {selectedOrder.address}
                    </div>
                    <div className="flex items-center gap-3 text-[#5b403d] text-[14px]">
                      <CreditCard size={16} className="text-gray-400" />
                      {selectedOrder.paymentMethod} ({selectedOrder.paymentStatus})
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* PRODUCTS */}
            <Card className="rounded-2xl border border-[#ead0d0] shadow-sm">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-[16px] font-bold text-[#191c1e]">
                  Danh sách sản phẩm
                </h2>
                <div className="text-[18px] font-bold text-[#af101a]">
                  {dinhDangTien(selectedOrder.total)}
                </div>
              </div>

              <div className="space-y-3 mb-5">
                {selectedOrder.items.length === 0 && (
                  <Empty description="Không có sản phẩm" />
                )}

                {selectedOrder.items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-4 border border-[#f1dede] rounded-xl p-3 bg-gray-50/30"
                  >
                    <Image
                      width={64}
                      height={64}
                      className="rounded-lg object-cover"
                      src={item.image}
                      fallback="https://placehold.co/64x64"
                    />
                    <div className="flex-1">
                      <h3 className="font-semibold text-[15px] text-[#191c1e]">
                        {item.name}
                      </h3>
                      <div className="grid grid-cols-2 gap-2 mt-2 text-[13px] text-[#5b403d]">
                        <div>SKU: <span className="font-medium text-[#191c1e]">{item.sku}</span></div>
                        <div>SL: <span className="font-medium text-[#191c1e]">{item.quantity}</span></div>
                        <div>Màu: <span className="font-medium text-[#191c1e]">{item.color}</span></div>
                        <div>Size: <span className="font-medium text-[#191c1e]">{item.size}</span></div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-[#af101a]">
                        {dinhDangTien(item.price)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <Divider className="my-3 border-[#f1dede]" />

              {/* PAYMENT BREAKDOWN */}
              <div className="space-y-2 text-right">
                <div className="flex justify-between text-[#5b403d] text-[14px]">
                  <span>Tạm tính:</span>
                  <span className="font-medium">{dinhDangTien(selectedOrder.originalAmount)}</span>
                </div>
                {selectedOrder.discountAmount > 0 && (
                  <div className="flex justify-between text-[#af101a] text-[14px]">
                    <span>Giảm giá:</span>
                    <span className="font-medium">-{dinhDangTien(selectedOrder.discountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between items-center text-[15px] font-bold pt-2 mt-2">
                  <span className="text-[#191c1e]">Tổng cộng:</span>
                  <span className="text-[#af101a] text-[18px]">{dinhDangTien(selectedOrder.total)}</span>
                </div>
              </div>
            </Card>

            {/* STEPS */}
            <Card className="rounded-2xl border border-[#ead0d0] shadow-sm">
              <h2 className="text-[16px] font-bold mb-5 text-[#191c1e]">
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
                    size="small"
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
            <Card className="rounded-2xl border border-[#ead0d0] shadow-sm bg-gray-50/30">
              <h2 className="text-[16px] font-bold mb-4 text-[#191c1e]">
                Thao tác nghiệp vụ
              </h2>
              {renderActionButtons()}
            </Card>
          </div>
        )}
      </Drawer>

      {/* Modal Xem Yêu Cầu Hủy */}
      <Modal
        title={
          <span className="flex items-center gap-2 text-[#af101a] font-bold text-[16px]">
            <AlertTriangle size={20} />
            Yêu Cầu Hủy Đơn Hàng #{selectedOrder?.id}
          </span>
        }
        open={cancelRequestModalVisible}
        onCancel={() => setCancelRequestModalVisible(false)}
        footer={[
          <Button
            key="reject"
            onClick={() => {
              if (selectedOrder) {
                handleRejectCancel(selectedOrder);
                setCancelRequestModalVisible(false);
              }
            }}
          >
            Từ chối (Tiếp tục xử lý)
          </Button>,
          <Button
            key="approve"
            type="primary"
            className="bg-[#af101a] hover:!bg-[#930010] border-none"
            onClick={async () => {
              if (selectedOrder) {
                await capNhatTrangThaiDonHang(selectedOrder.id, 'FAILED');
                setCancelRequestModalVisible(false);
                setIsDrawerOpen(false); 
              }
            }}
          >
            Đồng ý hủy đơn
          </Button>
        ]}
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
            <div className="space-y-4 py-2">
              <div className="bg-[#f1dede] border-l-4 border-[#af101a] p-3 text-[14px]">
                <p className="text-[#af101a] font-semibold">Cảnh báo:</p>
                <p className="text-[#5b403d]">
                  Hủy đơn hàng này sẽ tự động hoàn trả số lượng vào tồn kho thực tế.
                </p>
              </div>
              <div>
                <div className="bg-white border border-[#ead0d0] p-3 rounded-xl text-[#191c1e] text-[14px] italic">
                  "{info.reason}"
                </div>
              </div>
            </div>
          );
        })()}
      </Modal>
    </div>
  );
}