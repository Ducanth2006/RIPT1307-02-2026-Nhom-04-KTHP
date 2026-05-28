import React, { useState, useEffect, useCallback } from 'react';
import { Select, DatePicker, Button, Table, message, Dropdown, Spin } from 'antd';
import type { MenuProps } from 'antd';
import {
  Download, BarChart2, DollarSign, ShoppingBag, Users as UsersIcon,
  TrendingUp, RefreshCw, AlertCircle
} from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar, ComposedChart, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts';
import { getAdminReportData } from '../../services/adminReportService';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;

// ═══════════════════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════════════════

const formatCurrency = (value: number): string => {
  if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)}B`;
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return value.toLocaleString('vi-VN');
};

const formatFullCurrency = (value: number): string =>
  value.toLocaleString('vi-VN') + ' ₫';

const formatNumber = (value: number): string =>
  value.toLocaleString('vi-VN');

const COLORS = ['#af101a', '#00799c', '#2a7a40', '#d97706', '#7c3aed', '#ec4899'];

// ═══════════════════════════════════════════════════════════
// Custom Tooltip
// ═══════════════════════════════════════════════════════════

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-[#e4beba] rounded-lg shadow-lg p-3 min-w-[180px]">
        <p className="text-xs font-semibold text-[#515f74] uppercase mb-1">Ngày {label}</p>
        {payload.map((p: any, i: number) => (
          <p key={i} className="text-sm" style={{ color: p.color }}>
            <span className="font-medium">{p.name}: </span>
            {['revenue', 'cost', 'profit'].includes(p.dataKey) ? formatFullCurrency(p.value) : formatNumber(p.value)}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const PieTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-[#e4beba] rounded-lg shadow-lg p-3 min-w-[140px]">
        <p className="text-sm font-semibold text-[#191c1e]">{payload[0].name}</p>
        <p className="text-sm text-[#af101a] font-bold">{formatFullCurrency(payload[0].value)}</p>
      </div>
    );
  }
  return null;
};

// ═══════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════

interface KPIs {
  revenue: number;
  revenueGrowth: number;
  totalOrders: number;
  ordersGrowth: number;
  aov: number;
  aovGrowth: number;
  newCustomers: number;
  customersGrowth: number;
  totalProfit?: number;
  profitGrowth?: number;
  avgMargin?: number;
  marginGrowth?: number;
  bestSellerVolume?: string;
  bestSellerRevenue?: string;
}

interface ReportData {
  kpis: KPIs;
  dailyChart: { name: string; revenue: number; cost?: number; profit?: number; orders: number }[];
  categoryData: { name: string; value: number }[];
  voucherData?: { name: string; value: number; count: number; discount: number }[];
  topProducts: {
    key: string;
    rank: number;
    id: string;
    name: string;
    category: string;
    imageUrl: string | null;
    volume: number;
    revenue: number;
  }[];
  exportOrders: any[];
}

// ═══════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════

export default function ReportsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<ReportData | null>(null);
  const [timeRange, setTimeRange] = useState('30days');
  const [customDates, setCustomDates] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null);
  const [messageApi, contextHolder] = message.useMessage();

  // ── Fetch data ──
  const fetchReport = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params: any = {};
      if (customDates) {
        params.startDate = customDates[0].format('YYYY-MM-DD');
        params.endDate = customDates[1].format('YYYY-MM-DD');
      } else {
        params.timeRange = timeRange;
      }

      const response = await getAdminReportData(params);
      setData(response.data);
    } catch (err: any) {
      console.error('Lỗi tải báo cáo:', err);
      setError(err?.response?.data?.message || 'Không thể tải dữ liệu báo cáo');
      messageApi.error('Không thể tải dữ liệu báo cáo');
    } finally {
      setLoading(false);
    }
  }, [timeRange, customDates, messageApi]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  // ── CSV Export ──
  const exportCSV = (filename: string, headers: string[], rows: any[][]) => {
    try {
      const BOM = '\uFEFF';
      const csvContent = BOM + [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = filename;
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      messageApi.success(`Xuất ${filename} thành công!`);
    } catch {
      messageApi.error('Xuất báo cáo thất bại');
    }
  };

  const handleExportAction: MenuProps['onClick'] = (e) => {
    if (!data) return;

    const statusVi: Record<string, string> = {
      Pending: 'Chờ duyệt',
      Confirmed: 'Đã duyệt',
      Packing: 'Đang đóng gói',
      Shipping: 'Đang giao',
      Completed: 'Hoàn thành',
      Failed: 'Đã huỷ'
    };

    switch (e.key) {
      case 'orders':
        exportCSV(
          `Bao_Cao_Don_Hang_${timeRange}.csv`,
          ['Mã đơn', 'Khách hàng', 'SĐT', 'Email', 'Địa chỉ', 'Tổng thanh toán', 'Phí vận chuyển', 'Giảm giá', 'Trạng thái', 'Phương thức TT', 'Ngày đặt', 'Cập nhật lần cuối'],
          data.exportOrders.map(o => [
            o.id, o.customerName, o.phone, o.email, o.address,
            o.total, o.shippingFee, o.discount,
            statusVi[o.status] || o.status, o.paymentMethod,
            o.createdAt ? new Date(o.createdAt).toLocaleString('vi-VN') : '',
            o.updatedAt ? new Date(o.updatedAt).toLocaleString('vi-VN') : ''
          ])
        );
        break;
      case 'revenue':
        exportCSV(
          `Bao_Cao_Doanh_Thu_${timeRange}.csv`,
          ['Ngày', 'Doanh thu (₫)', 'Số đơn hàng'],
          data.dailyChart.map(d => [d.name, d.revenue, d.orders])
        );
        break;
      case 'products':
        exportCSV(
          `Bao_Cao_Doanh_Thu_San_Pham_${timeRange}.csv`,
          ['Hạng', 'Tên sản phẩm', 'Danh mục', 'Đã bán (SP)', 'Doanh thu đóng góp (₫)'],
          data.topProducts.map(p => [p.rank, p.name, p.category, p.volume, p.revenue])
        );
        break;
    }
  };

  const exportMenuItems: MenuProps['items'] = [
    { key: 'orders', label: 'Báo cáo đơn hàng' },
    { key: 'revenue', label: 'Báo cáo doanh thu' },
    { key: 'products', label: 'Báo cáo sản phẩm doanh thu cao' },
  ];

  // ── Growth badge ──
  const GrowthBadge = ({ value }: { value: number }) => {
    const positive = value >= 0;
    return (
      <span className={`text-xs ml-2 font-semibold px-1.5 py-0.5 rounded ${positive ? 'text-green-700 bg-green-50' : 'text-red-600 bg-red-50'}`}>
        {positive ? '+' : ''}{value}%
      </span>
    );
  };

  // ── Loading ──
  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center">
          <Spin size="large" />
          <p className="mt-4 text-[#515f74] font-medium">Đang tải dữ liệu báo cáo...</p>
        </div>
      </div>
    );
  }

  // ── Error ──
  if (error || !data) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center max-w-md">
          <AlertCircle size={48} className="text-[#af101a] mx-auto mb-4" />
          <h3 className="text-xl font-bold text-[#191c1e] mb-2">Không thể tải dữ liệu</h3>
          <p className="text-[#515f74] mb-4">{error || 'Đã xảy ra lỗi không xác định'}</p>
          <Button
            type="primary"
            onClick={fetchReport}
            icon={<RefreshCw size={16} />}
            className="flex items-center gap-2 mx-auto"
            style={{ backgroundColor: '#af101a', borderColor: '#af101a' }}
          >
            Thử lại
          </Button>
        </div>
      </div>
    );
  }

  const { kpis, dailyChart, categoryData, voucherData = [], topProducts } = data;

  // ═══════════════════════════════════════════════════════════
  // KPI Cards config
  // ═══════════════════════════════════════════════════════════
  const kpiCards = [
    {
      title: 'Tổng doanh thu',
      value: formatCurrency(kpis.revenue),
      fullValue: formatFullCurrency(kpis.revenue),
      growth: kpis.revenueGrowth,
      icon: DollarSign,
      color: 'text-[#af101a]',
      bgColor: 'bg-[#fff2f0]',
      highlight: true
    },
    {
      title: 'Tổng lợi nhuận',
      value: formatCurrency(kpis.totalProfit || 0),
      fullValue: formatFullCurrency(kpis.totalProfit || 0),
      growth: kpis.profitGrowth,
      icon: DollarSign,
      color: 'text-[#2a7a40]',
      bgColor: 'bg-[#d5fcde]',
      highlight: true
    },
    {
      title: 'Biên lợi nhuận TB',
      value: `${kpis.avgMargin || 0}%`,
      growth: kpis.marginGrowth,
      icon: TrendingUp,
      color: 'text-[#7c3aed]',
      bgColor: 'bg-[#f4ebff]'
    },
    {
      title: 'Tổng đơn hàng',
      value: formatNumber(kpis.totalOrders),
      growth: kpis.ordersGrowth,
      icon: ShoppingBag,
      color: 'text-[#00799c]',
      bgColor: 'bg-[#e0f2fe]'
    },
    {
      title: 'Giá trị TB đơn hàng',
      value: formatCurrency(kpis.aov),
      fullValue: formatFullCurrency(kpis.aov),
      growth: kpis.aovGrowth,
      icon: TrendingUp,
      color: 'text-[#00799c]',
      bgColor: 'bg-[#e0f2fe]'
    },
    {
      title: 'Khách hàng mới',
      value: formatNumber(kpis.newCustomers),
      growth: kpis.customersGrowth,
      icon: UsersIcon,
      color: 'text-[#7c3aed]',
      bgColor: 'bg-[#f4ebff]'
    },
    {
      title: 'SP bán chạy nhất',
      value: kpis.bestSellerVolume || 'N/A',
      icon: ShoppingBag,
      color: 'text-[#d97706]',
      bgColor: 'bg-[#fef3c7]',
      isText: true
    },
    {
      title: 'SP doanh thu cao nhất',
      value: kpis.bestSellerRevenue || 'N/A',
      icon: DollarSign,
      color: 'text-[#af101a]',
      bgColor: 'bg-[#fff2f0]',
      isText: true
    }
  ];

  // ═══════════════════════════════════════════════════════════
  // Top Products Table columns
  // ═══════════════════════════════════════════════════════════
  const topProductColumns = [
    {
      title: '#',
      dataIndex: 'rank',
      key: 'rank',
      width: 50,
      render: (rank: number) => (
        <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${rank <= 3 ? 'bg-[#fff2f0] text-[#af101a]' : 'bg-gray-100 text-gray-500'}`}>
          {rank}
        </span>
      )
    },
    {
      title: 'Sản phẩm',
      dataIndex: 'name',
      key: 'name',
      render: (name: string, record: any) => (
        <div className="flex items-center gap-3">
          {record.imageUrl ? (
            <img src={record.imageUrl} alt={name} className="w-10 h-10 rounded-lg object-cover border border-[#e4beba]" />
          ) : (
            <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400 text-xs">N/A</div>
          )}
          <span className="font-medium text-[#191c1e]">{name}</span>
        </div>
      )
    },
    {
      title: 'Danh mục',
      dataIndex: 'category',
      key: 'category',
      render: (cat: string) => <span className="text-[#5b403d]">{cat}</span>
    },
    {
      title: 'Đã bán',
      dataIndex: 'volume',
      key: 'volume',
      render: (v: number) => <span className="font-semibold text-[#191c1e]">{formatNumber(v)} SP</span>
    },
    {
      title: 'Doanh thu',
      dataIndex: 'revenue',
      key: 'revenue',
      render: (r: number) => <span className="font-bold text-[#af101a]">{formatFullCurrency(r)}</span>
    }
  ];

  // ═══════════════════════════════════════════════════════════
  // Render
  // ═══════════════════════════════════════════════════════════
  return (
    <div className="p-4 md:p-6 space-y-6 max-w-[1440px] mx-auto">
      {contextHolder}

      {/* ═══ Header ═══ */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#191c1e] flex items-center gap-3">
            <BarChart2 size={30} className="text-[#af101a]" />
            Báo Cáo & Phân Tích
          </h1>
          <p className="text-[#5b403d] mt-2">
            Theo dõi hiệu suất kinh doanh, phân tích xu hướng doanh thu và cơ cấu bán hàng.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <RangePicker
            className="rounded-lg border-[#d8dadc]"
            placeholder={['Từ ngày', 'Đến ngày']}
            value={customDates}
            onChange={(dates) => {
              if (dates && dates[0] && dates[1]) {
                setCustomDates([dates[0], dates[1]]);
              } else {
                setCustomDates(null);
              }
            }}
          />

          <Select
            value={customDates ? undefined : timeRange}
            onChange={(val) => {
              setCustomDates(null);
              setTimeRange(val);
            }}
            className="w-36"
            placeholder="Khoảng thời gian"
            options={[
              { value: 'today', label: 'Hôm nay' },
              { value: '7days', label: '7 ngày qua' },
              { value: '30days', label: '30 ngày qua' },
              { value: 'year', label: 'Năm nay' },
            ]}
          />

          <Dropdown menu={{ items: exportMenuItems, onClick: handleExportAction }} trigger={['click']}>
            <Button
              icon={<Download size={16} />}
              className="flex items-center gap-2 border-[#ead0d0] hover:!text-[#af101a] hover:!border-[#af101a] h-8 rounded-lg"
            >
              Xuất Báo Cáo
            </Button>
          </Dropdown>

          <Button
            onClick={fetchReport}
            icon={<RefreshCw size={14} />}
            className="flex items-center gap-2 text-[#515f74] border-[#d8dadc] hover:border-[#af101a] hover:text-[#af101a] h-8 rounded-lg"
          >
            Làm mới
          </Button>
        </div>
      </div>

      {/* ═══ KPI Cards ═══ */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {kpiCards.map((kpi, i) => (
          <div
            key={i}
            className={`bg-white border border-[#e4beba] rounded-xl p-4 shadow-sm relative overflow-hidden group transition-all hover:shadow-md ${kpi.highlight ? 'border-t-2 border-t-[#af101a]' : ''}`}
          >
            <div className="flex justify-between items-start mb-2">
              <span className="text-[11px] font-bold text-[#5b403d] uppercase tracking-wider">
                {kpi.title}
              </span>
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${kpi.bgColor}`}>
                <kpi.icon size={16} className={kpi.color} />
              </div>
            </div>
            <div className="flex items-baseline gap-1.5 mt-2 w-full overflow-hidden">
              {kpi.isText ? (
                <h2
                  className="text-sm font-bold text-[#191c1e] truncate w-full"
                  title={kpi.fullValue || kpi.value}
                >
                  {kpi.value}
                </h2>
              ) : (
                <>
                  <h2
                    className="text-2xl font-black text-[#191c1e]"
                    title={kpi.fullValue}
                  >
                    {kpi.value}
                  </h2>
                  {kpi.growth !== undefined && <GrowthBadge value={kpi.growth} />}
                </>
              )}
            </div>
            {kpi.growth !== undefined ? (
              <p className="text-[10px] text-[#8f6f6c] mt-1 uppercase tracking-wide">
                so với kỳ trước
              </p>
            ) : (
              <p className="text-[10px] text-[#8f6f6c] mt-1 uppercase tracking-wide">
                Sản phẩm dẫn đầu
              </p>
            )}
          </div>
        ))}
      </div>

      {/* ═══ Charts ═══ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Line Chart */}
        <div className="lg:col-span-2 bg-white border border-[#e4beba] shadow-sm rounded-xl p-6">
          <h3 className="font-bold text-[#191c1e] mb-4 flex items-center gap-2">
            <TrendingUp size={18} className="text-[#af101a]" />
            Xu hướng doanh thu & đơn hàng
          </h3>
          <div className="h-[320px]">
            {dailyChart.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dailyChart} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eceef0" />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#8f6f6c', fontSize: 11 }}
                    interval={dailyChart.length > 15 ? Math.floor(dailyChart.length / 10) : 0}
                  />
                  <YAxis
                    yAxisId="left"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#8f6f6c', fontSize: 11 }}
                    tickFormatter={(v) => formatCurrency(v)}
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#8f6f6c', fontSize: 11 }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend iconType="circle" />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    name="Doanh thu"
                    dataKey="revenue"
                    stroke="#af101a"
                    strokeWidth={2.5}
                    dot={{ r: 3, strokeWidth: 2 }}
                    activeDot={{ r: 5 }}
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    name="Đơn hàng"
                    dataKey="orders"
                    stroke="#00799c"
                    strokeWidth={2.5}
                    dot={{ r: 3, strokeWidth: 2 }}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-[#8f6f6c]">
                Chưa có dữ liệu doanh thu trong khoảng thời gian này
              </div>
            )}
          </div>
        </div>

        {/* Pie Chart */}
        <div className="bg-white border border-[#e4beba] shadow-sm rounded-xl p-6">
          <h3 className="font-bold text-[#191c1e] mb-4 flex items-center gap-2">
            <BarChart2 size={18} className="text-[#af101a]" />
            Cơ cấu doanh thu theo danh mục
          </h3>
          <div className="h-[320px]">
            {categoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="45%"
                    innerRadius={55}
                    outerRadius={95}
                    paddingAngle={4}
                    dataKey="value"
                    label={({ name, percent }) => `${name} (${((percent ?? 0) * 100).toFixed(0)}%)`}
                    labelLine={{ strokeWidth: 1 }}
                  >
                    {categoryData.map((_entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<PieTooltip />} />
                  <Legend iconType="circle" layout="horizontal" verticalAlign="bottom" />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-[#8f6f6c]">
                Chưa có dữ liệu danh mục
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ═══ Financial & Voucher Analytics Row ═══ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6 mb-6">
        {/* Financial Combo (Composed) Chart */}
        <div className="lg:col-span-2 bg-white border border-[#e4beba] shadow-sm rounded-xl p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
            <div>
              <h3 className="font-bold text-[#191c1e] text-base flex items-center gap-2">
                <DollarSign size={18} className="text-[#af101a]" />
                Phân tích hiệu quả tài chính & Lợi nhuận
              </h3>
              <p className="text-xs text-[#8f6f6c] mt-0.5">
                So sánh Doanh thu thực nhận, Giá vốn hàng bán (trục Y trái) và Lợi nhuận thực tế (trục Y phải) theo ngày
              </p>
            </div>
          </div>
          <div className="h-[320px]">
            {dailyChart.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={dailyChart} margin={{ top: 10, right: 10, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eceef0" />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#8f6f6c', fontSize: 11 }}
                    interval={dailyChart.length > 15 ? Math.floor(dailyChart.length / 10) : 0}
                  />
                  {/* Trục Y chính bên trái cho Doanh thu & Giá vốn */}
                  <YAxis
                    yAxisId="left"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#8f6f6c', fontSize: 11 }}
                    tickFormatter={(v) => formatCurrency(v)}
                  />
                  {/* Trục Y phụ bên phải cho Lợi nhuận */}
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#af101a', fontSize: 11 }}
                    tickFormatter={(v) => formatCurrency(v)}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend iconType="circle" />
                  <Bar yAxisId="left" name="Doanh thu" dataKey="revenue" fill="#00799c" radius={[4, 4, 0, 0]} maxBarSize={30} />
                  <Bar yAxisId="left" name="Giá vốn" dataKey="cost" fill="#94a3b8" radius={[4, 4, 0, 0]} maxBarSize={30} />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    name="Lợi nhuận thực tế"
                    dataKey="profit"
                    stroke="#af101a"
                    strokeWidth={3}
                    dot={{ r: 4, strokeWidth: 2, fill: '#fff' }}
                    activeDot={{ r: 6 }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-[#8f6f6c]">
                Chưa có dữ liệu tài chính trong khoảng thời gian này
              </div>
            )}
          </div>
        </div>

        {/* Voucher Pie Chart */}
        <div className="bg-white border border-[#e4beba] shadow-sm rounded-xl p-6">
          <h3 className="font-bold text-[#191c1e] mb-4 flex items-center gap-2">
            <BarChart2 size={18} className="text-[#af101a]" />
            Cơ cấu doanh thu theo Voucher
          </h3>
          <div className="h-[320px]">
            {voucherData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={voucherData}
                    cx="50%"
                    cy="45%"
                    innerRadius={55}
                    outerRadius={95}
                    paddingAngle={4}
                    dataKey="value"
                    label={({ name, percent }) => `${name} (${((percent ?? 0) * 100).toFixed(0)}%)`}
                    labelLine={{ strokeWidth: 1 }}
                  >
                    {voucherData.map((_entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<PieTooltip />} />
                  <Legend iconType="circle" layout="horizontal" verticalAlign="bottom" />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-[#8f6f6c]">
                Chưa có dữ liệu sử dụng Voucher
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="bg-white border border-[#e4beba] shadow-sm rounded-xl overflow-hidden">
        <div className="px-6 py-5 border-b border-[#f3dede]">
          <h3 className="font-bold text-[#191c1e] flex items-center gap-2">
            <ShoppingBag size={18} className="text-[#af101a]" />
            Top 5 sản phẩm có doanh thu cao nhất
          </h3>
        </div>
        <Table
          dataSource={topProducts}
          columns={topProductColumns}
          pagination={false}
          className="px-2"
          locale={{ emptyText: 'Chưa có dữ liệu sản phẩm có doanh thu cao nhất trong khoảng thời gian này' }}
        />
      </div>
    </div>
  );
}
