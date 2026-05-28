import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Table, Button, message, Spin } from 'antd';
import {
  ArrowUpRight, ArrowDownRight, Plus, ChevronRight, ChevronLeft,
  DollarSign, ShoppingCart, Users, Clock, Headset,
  RefreshCw, AlertCircle, Package, Boxes, BarChart2,
  Ticket, FolderTree, Home
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { getAdminDashboardStats } from '../../services/adminDashboardService';

// ═══════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════
interface KPIs {
  revenueThisMonth: number;
  revenueGrowth: number;
  totalOrders: number;
  ordersGrowth: number;
  newCustomers: number;
  customersGrowth: number;
  pendingOrders: number;
  openComplaints: number;
  totalComplaints: number;
}

interface DailyRevenueItem {
  day: string;
  label: string;
  revenue: number;
}

interface TopProduct {
  rank: number;
  id: string;
  name: string;
  imageUrl: string | null;
  volume: number;
  revenue: number;
}

interface DashboardData {
  kpis: KPIs;
  dailyRevenue: DailyRevenueItem[];
  chartMonthLabel: string;
  topProducts: TopProduct[];
}

// ═══════════════════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════════════════

/** Format số tiền sang dạng rút gọn */
const formatCurrency = (value: number): string => {
  if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)}B`;
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return value.toLocaleString('vi-VN');
};

/** Format số tiền đầy đủ với đơn vị */
const formatFullCurrency = (value: number): string => {
  return value.toLocaleString('vi-VN') + ' ₫';
};

/** Format số lượng */
const formatNumber = (value: number): string => {
  return value.toLocaleString('vi-VN');
};

/** Tính chartMonth string (YYYY-MM) từ offset so với tháng hiện tại */
const getChartMonthString = (offset: number): string => {
  const now = new Date();
  const d = new Date(now.getFullYear(), now.getMonth() + offset, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

/** Custom tooltip cho biểu đồ */
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-[#e4beba] rounded-lg shadow-lg p-3 min-w-[160px]">
        <p className="text-xs font-semibold text-[#515f74] uppercase mb-1">Ngày {label}</p>
        <p className="text-base font-bold text-[#191c1e]">
          {formatFullCurrency(payload[0].value)}
        </p>
      </div>
    );
  }
  return null;
};

// ═══════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════
export default function Dashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [chartLoading, setChartLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<DashboardData | null>(null);
  const [chartMonthOffset, setChartMonthOffset] = useState(0); // 0 = tháng hiện tại

  // ── Fetch data from API ──
  const fetchDashboard = useCallback(async (monthOffset = 0, isChartOnly = false) => {
    try {
      if (isChartOnly) {
        setChartLoading(true);
      } else {
        setLoading(true);
        setError(null);
      }

      const chartMonth = getChartMonthString(monthOffset);
      const response = await getAdminDashboardStats(chartMonth);
      setData(response.data);
    } catch (err: any) {
      console.error('Lỗi tải dữ liệu:', err);
      if (!isChartOnly) {
        setError(err?.response?.data?.message || 'Không thể tải dữ liệu');
        message.error('Không thể tải dữ liệu Trang chủ');
      }
    } finally {
      setLoading(false);
      setChartLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard(0, false);
  }, [fetchDashboard]);

  // ── Chuyển tháng biểu đồ ──
  const handlePrevMonth = () => {
    const newOffset = chartMonthOffset - 1;
    setChartMonthOffset(newOffset);
    fetchDashboard(newOffset, true);
  };

  const handleNextMonth = () => {
    if (chartMonthOffset >= 0) return; // Không cho vượt quá tháng hiện tại
    const newOffset = chartMonthOffset + 1;
    setChartMonthOffset(newOffset);
    fetchDashboard(newOffset, true);
  };

  // ── Quick Actions handler ──
  const handleQuickAction = (path: string) => {
    navigate(path);
  };

  // ── Loading state ──
  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center">
          <Spin size="large" />
          <p className="mt-4 text-[#515f74] font-medium">Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  // ── Error state ──
  if (error || !data) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center max-w-md">
          <AlertCircle size={48} className="text-[#af101a] mx-auto mb-4" />
          <h3 className="text-xl font-bold text-[#191c1e] mb-2">Không thể tải dữ liệu</h3>
          <p className="text-[#515f74] mb-4">{error || 'Đã xảy ra lỗi không xác định'}</p>
          <Button
            type="primary"
            onClick={() => fetchDashboard(0, false)}
            icon={<RefreshCw size={16} />}
            className="flex items-center gap-2 mx-auto"
          >
            Thử lại
          </Button>
        </div>
      </div>
    );
  }

  const { kpis, dailyRevenue, chartMonthLabel, topProducts } = data;

  interface KpiCard {
    title: string;
    value: string;
    fullValue?: string;
    growth: number | null;
    icon: any;
    color: string;
    bgColor: string;
    highlight?: boolean;
    clickPath?: string;
    urgent?: boolean;
    subtitle?: string;
  }

  // ── KPI card configurations (5 cards) ──
  const kpiCards: KpiCard[] = [
    {
      title: 'Doanh thu tháng',
      value: formatCurrency(kpis.revenueThisMonth),
      fullValue: formatFullCurrency(kpis.revenueThisMonth),
      growth: kpis.revenueGrowth,
      icon: DollarSign,
      color: 'text-[#af101a]',
      bgColor: 'bg-[#fff2f0]',
      highlight: true
    },
    {
      title: 'Đơn hàng mới',
      value: formatNumber(kpis.totalOrders),
      growth: kpis.ordersGrowth,
      icon: ShoppingCart,
      color: 'text-[#00799c]',
      bgColor: 'bg-[#e0f2fe]'
    },
    {
      title: 'Khách hàng mới',
      value: formatNumber(kpis.newCustomers),
      growth: kpis.customersGrowth,
      icon: Users,
      color: 'text-[#2a7a40]',
      bgColor: 'bg-[#d5fcde]'
    },
    {
      title: 'Đơn chờ xử lý',
      value: formatNumber(kpis.pendingOrders),
      growth: null,
      icon: Clock,
      color: 'text-[#d97706]',
      bgColor: 'bg-[#fef3c7]',
      clickPath: '/admin/orders',
      urgent: kpis.pendingOrders > 0
    },
    {
      title: 'Khiếu nại chờ xử lý',
      value: formatNumber(kpis.openComplaints),
      growth: null,
      icon: Headset,
      color: 'text-[#7c3aed]',
      bgColor: 'bg-[#f4ebff]',
      clickPath: '/admin/complaints',
      urgent: kpis.openComplaints > 0
    }
  ];

  // ── Quick Actions (6 items to fill space) ──
  const quickActions = [
    { label: 'Thêm sản phẩm', desc: 'Tạo sản phẩm mới', icon: Plus, path: '/admin/products/new' },
    { label: 'Đơn hàng', desc: 'Quản lý đơn đặt hàng', icon: ShoppingCart, path: '/admin/orders' },
    { label: 'Quản lý kho', desc: 'Kiểm tra tồn kho', icon: Boxes, path: '/admin/inventory' },
    { label: 'Danh mục', desc: 'Quản lý ngành hàng', icon: FolderTree, path: '/admin/categories' },
    { label: 'Voucher', desc: 'Quản lý mã giảm giá', icon: Ticket, path: '/admin/vouchers' },
    { label: 'Người dùng', desc: 'Quản lý người dùng', icon: Users, path: '/admin/users' },
  ];

  // ── Render ──
  return (
    <div className="p-6 max-w-[1440px] mx-auto space-y-6">
      {/* ═══ Header ═══ */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#191c1e] flex items-center gap-3">
            <Home size={30} className="text-[#af101a]" />
            Trang Chủ
          </h1>
          <p className="text-[#5b403d] mt-2">
            Tổng quan hoạt động kinh doanh, thống kê doanh thu và phân tích hiệu suất bán hàng.
          </p>
        </div>

        <Button
          onClick={() => { setChartMonthOffset(0); fetchDashboard(0, false); }}
          icon={<RefreshCw size={14} />}
          className="flex items-center gap-2 text-[#515f74] border-[#d8dadc] hover:border-[#af101a] hover:text-[#af101a] h-10 px-4 rounded-lg"
        >
          Làm mới
        </Button>
      </div>

      {/* ═══ KPI Cards Row (5 cards) ═══ */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {kpiCards.map((kpi, i) => {
          const isHighlight = kpi.highlight;
          return (
            <div
              key={i}
              className={`bg-white border border-[#e4beba] rounded-xl p-4 shadow-sm relative overflow-hidden group transition-all hover:shadow-md ${
                isHighlight ? 'border-t-2 border-t-[#af101a]' : kpi.urgent ? 'border-[#d97706]' : ''
              } ${kpi.clickPath ? 'cursor-pointer' : ''}`}
              onClick={kpi.clickPath ? () => navigate(kpi.clickPath!) : undefined}
            >
              <div className="flex justify-between items-start mb-2">
                <span className="text-[11px] font-bold text-[#5b403d] uppercase tracking-wider">
                  {kpi.title}
                </span>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${kpi.bgColor}`}>
                  <kpi.icon size={16} className={kpi.color} />
                </div>
              </div>

              <div className="flex items-baseline gap-1.5">
                <h2
                  className="text-2xl font-black text-[#191c1e]"
                  title={kpi.fullValue || kpi.value}
                >
                  {kpi.value}
                </h2>
                {kpi.subtitle && (
                  <span className="text-xs font-semibold text-[#8f6f6c]">{kpi.subtitle}</span>
                )}
              </div>

              <div className="mt-1.5">
                {kpi.growth !== null && kpi.growth !== undefined ? (
                  <div className={`text-xs font-bold flex items-center gap-1 ${
                    kpi.growth >= 0 ? 'text-[#2a7a40]' : 'text-[#af101a]'
                  }`}>
                    {kpi.growth >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                    <span>{kpi.growth >= 0 ? '+' : ''}{kpi.growth}% so với tháng trước</span>
                  </div>
                ) : (
                  kpi.urgent && (
                    <div className="text-xs font-bold text-[#d97706] flex items-center gap-1">
                      <AlertCircle size={12} />
                      <span>Cần xử lý</span>
                    </div>
                  )
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ═══ Revenue Chart (30 ngày) & Quick Actions ═══ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Revenue Chart - Daily */}
        <div className="lg:col-span-8 bg-white border border-[#e4beba] rounded-xl shadow-sm overflow-hidden flex flex-col border-t-4 border-t-[#af101a]">
          <div className="p-4 border-b border-[#eceef0] flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold text-[#191c1e]">Xu hướng Doanh thu</h3>
              <p className="text-xs text-[#515f74] mt-0.5">Doanh thu theo ngày trong tháng</p>
            </div>
            {/* Nút chuyển tháng */}
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrevMonth}
                className="w-8 h-8 rounded-lg border border-[#d8dadc] flex items-center justify-center hover:border-[#af101a] hover:text-[#af101a] text-[#515f74] transition-colors"
                title="Tháng trước"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="text-sm font-semibold text-[#191c1e] min-w-[120px] text-center">
                {chartLoading ? '...' : chartMonthLabel}
              </span>
              <button
                onClick={handleNextMonth}
                disabled={chartMonthOffset >= 0}
                className={`w-8 h-8 rounded-lg border flex items-center justify-center transition-colors ${
                  chartMonthOffset >= 0
                    ? 'border-[#eceef0] text-[#d8dadc] cursor-not-allowed'
                    : 'border-[#d8dadc] hover:border-[#af101a] hover:text-[#af101a] text-[#515f74]'
                }`}
                title="Tháng sau"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
          <div className="p-4 h-[320px] relative">
            {chartLoading && (
              <div className="absolute inset-0 bg-white/70 z-10 flex items-center justify-center">
                <Spin />
              </div>
            )}
            {dailyRevenue && dailyRevenue.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dailyRevenue} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#af101a" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#af101a" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eceef0" />
                  <XAxis
                    dataKey="day"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fill: '#8f6f6c' }}
                    dy={10}
                    interval={2}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fill: '#8f6f6c' }}
                    tickFormatter={(val) => formatCurrency(val)}
                    width={55}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#af101a"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorRevenue)"
                    dot={false}
                    activeDot={{ r: 4, fill: '#af101a', stroke: '#fff', strokeWidth: 2 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-[#515f74]">
                <p>Chưa có dữ liệu doanh thu</p>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions (6 items) */}
        <div className="lg:col-span-4 bg-white border border-[#e4beba] rounded-xl shadow-sm p-5 flex flex-col">
          <h3 className="text-lg font-semibold text-[#191c1e] mb-3">Hành động nhanh</h3>
          <div className="flex flex-col gap-2 flex-1">
            {quickActions.map((action, i) => (
              <button
                key={i}
                onClick={() => handleQuickAction(action.path)}
                className="w-full flex items-center justify-between p-2.5 rounded-lg border border-[#e4beba] hover:border-[#af101a] hover:bg-[#fff2f0] transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#eceef0] flex items-center justify-center text-[#af101a] group-hover:bg-[#af101a] group-hover:text-white transition-colors">
                    <action.icon size={16} />
                  </div>
                  <div className="text-left">
                    <span className="text-sm font-medium text-[#191c1e] block leading-tight">{action.label}</span>
                    <span className="text-[11px] text-[#8f6f6c] leading-tight">{action.desc}</span>
                  </div>
                </div>
                <ChevronRight size={16} className="text-[#515f74] group-hover:text-[#af101a] transition-colors shrink-0" />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ═══ Top Selling Products ═══ */}
      <div className="bg-white border border-[#e4beba] rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-[#eceef0] flex justify-between items-center bg-[#f7f9fb]">
          <div>
            <h3 className="text-lg font-semibold text-[#191c1e]">Sản phẩm bán chạy nhất</h3>
            <p className="text-xs text-[#515f74] mt-0.5">Top 5 sản phẩm có số lượng bán cao nhất từ đơn hàng hoàn tất</p>
          </div>
          <Button
            type="link"
            className="text-[#af101a] p-0 font-medium flex items-center gap-1"
            onClick={() => navigate('/admin/products')}
          >
            Xem tất cả <ChevronRight size={16} />
          </Button>
        </div>

        {topProducts.length > 0 ? (
          <Table
            dataSource={topProducts}
            rowKey="id"
            pagination={false}
            className="w-full"
            columns={[
              {
                title: '#',
                dataIndex: 'rank',
                width: 50,
                align: 'center' as const,
                render: (rank: number) => (
                  <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${
                    rank === 1 ? 'bg-[#af101a] text-white' :
                    rank === 2 ? 'bg-[#00799c] text-white' :
                    rank === 3 ? 'bg-[#d97706] text-white' :
                    'bg-[#eceef0] text-[#515f74]'
                  }`}>
                    {rank}
                  </span>
                )
              },
              {
                title: 'SẢN PHẨM',
                dataIndex: 'name',
                render: (_: any, record: TopProduct) => (
                  <div className="flex items-center gap-3">
                    {record.imageUrl ? (
                      <img
                        src={record.imageUrl}
                        alt={record.name}
                        className="w-10 h-10 rounded-lg object-cover border border-[#eceef0]"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-[#eceef0] flex items-center justify-center">
                        <Package size={16} className="text-[#8f6f6c]" />
                      </div>
                    )}
                    <span className="font-medium text-[#191c1e] text-sm">{record.name}</span>
                  </div>
                )
              },
              {
                title: 'SỐ LƯỢNG BÁN',
                dataIndex: 'volume',
                align: 'right' as const,
                render: (volume: number) => (
                  <span className="font-semibold text-[#191c1e]">{formatNumber(volume)}</span>
                )
              },
              {
                title: 'DOANH THU',
                dataIndex: 'revenue',
                align: 'right' as const,
                render: (revenue: number) => (
                  <span className="font-semibold text-[#2a7a40]">{formatFullCurrency(revenue)}</span>
                )
              }
            ]}
          />
        ) : (
          <div className="p-12 text-center">
            <Package size={40} className="text-[#d8dadc] mx-auto mb-3" />
            <p className="text-[#515f74] font-medium">Chưa có dữ liệu sản phẩm bán chạy</p>
            <p className="text-xs text-[#8f6f6c] mt-1">Dữ liệu sẽ hiển thị khi có đơn hàng hoàn tất</p>
          </div>
        )}
      </div>
    </div>
  );
}
