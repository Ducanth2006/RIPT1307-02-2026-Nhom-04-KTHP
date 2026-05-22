import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Table, Tag, Button, message } from 'antd';
import { ArrowUpRight, ArrowDownRight, Minus, Plus, ChevronRight, Package2, ShoppingCart, Users, Ticket, RefreshCw } from 'lucide-react';
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer } from 'recharts';

const data = [
  { name: 'Jan', revenue: 120000 },
  { name: 'Feb', revenue: 150000 },
  { name: 'Mar', revenue: 140000 },
  { name: 'Apr', revenue: 180000 },
  { name: 'May', revenue: 170000 },
  { name: 'Jun', revenue: 210000 },
  { name: 'Jul', revenue: 230000 },
  { name: 'Aug', revenue: 220000 },
  { name: 'Sep', revenue: 250000 },
  { name: 'Oct', revenue: 284592 },
];

const topProducts = [
  { id: '#PRD-9012', name: 'Pro-Grade Football Helmet V2', volume: '1,245', revenue: '$311,250.00', trend: 'up' },
  { id: '#PRD-8841', name: 'Elite Series Basketball Shoes', volume: '982', revenue: '$147,300.00', trend: 'up' },
  { id: '#PRD-7730', name: 'Compression Training Tights', volume: '854', revenue: '$51,240.00', trend: 'neutral' },
  { id: '#PRD-6522', name: 'Carbon Fiber Tennis Racket', volume: '412', revenue: '$82,400.00', trend: 'down' },
  { id: '#PRD-5109', name: 'Hydration Pack 2L', volume: '389', revenue: '$15,560.00', trend: 'up' },
];

const TrendIcon = ({ trend }: { trend: string }) => {
  if (trend === 'up') return <ArrowUpRight className="text-[#00799c]" size={16} />;
  if (trend === 'down') return <ArrowDownRight className="text-[#af101a]" size={16} />;
  return <Minus className="text-[#8f6f6c]" size={16} />;
};

export default function Dashboard() {
  const navigate = useNavigate();
  const [timeRange, setTimeRange] = useState('12M');

  const handleQuickAction = (actionLabel: string) => {
    switch (actionLabel) {
      case 'Add Product':
        navigate('/admin/products/new');
        break;
      case 'View Orders':
        navigate('/admin/orders');
        break;
      case 'Clear Cache':
        message.success('Cache cleared successfully!');
        break;
      default:
        break;
    }
  };
  return (
    <div className="p-6 max-w-[1440px] mx-auto space-y-6">
      {/* KPI Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { title: 'Revenue (Month)', value: '$284,592.00', trend: '+14.2% from last month', icon: Package2, color: 'text-primary' },
          { title: 'Total Orders', value: '3,492', trend: '+5.8% from last month', icon: ShoppingCart },
          { title: 'Active Users', value: '12,845', trend: '+2.4% from last month', icon: Users },
          { title: 'Ticket Volume', value: '142', trend: '-1.5% (Resolution improving)', icon: Ticket, negative: true },
        ].map((kpi, i) => (
          <div key={i} className="bg-white border border-[#e4beba] rounded-xl p-4 shadow-sm relative overflow-hidden group">
            {i === 0 && <div className="absolute top-0 left-0 w-full h-1 bg-[#af101a]"></div>}
            <div className="flex justify-between items-start mb-2">
              <span className="text-xs font-semibold text-[#515f74] uppercase tracking-wider">{kpi.title}</span>
              <kpi.icon size={20} className={kpi.color || 'text-[#515f74]'} />
            </div>
            <h2 className="text-3xl font-bold text-[#191c1e] mb-2">{kpi.value}</h2>
            <div className={`text-sm font-medium flex items-center gap-1 ${kpi.negative ? 'text-[#005f7b]' : 'text-[#00799c]'}`}>
              {kpi.negative ? <ArrowDownRight size={16} /> : <ArrowUpRight size={16} />}
              {kpi.trend}
            </div>
          </div>
        ))}
      </div>

      {/* Chart & Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 bg-white border border-[#e4beba] rounded-xl shadow-sm overflow-hidden flex flex-col border-t-4 border-t-[#af101a]">
          <div className="p-4 border-b border-[#eceef0] flex justify-between items-center">
            <h3 className="text-xl font-semibold text-[#191c1e]">Revenue Trends</h3>
            <div className="flex bg-[#eceef0] rounded p-1">
              <button 
                onClick={() => setTimeRange('12M')}
                className={`px-3 py-1 text-xs font-medium rounded ${timeRange === '12M' ? 'bg-white shadow-sm text-[#191c1e]' : 'text-[#515f74] hover:text-[#191c1e]'}`}>12M</button>
              <button 
                onClick={() => setTimeRange('30D')}
                className={`px-3 py-1 text-xs font-medium rounded ${timeRange === '30D' ? 'bg-white shadow-sm text-[#191c1e]' : 'text-[#515f74] hover:text-[#191c1e]'}`}>30D</button>
              <button 
                onClick={() => setTimeRange('7D')}
                className={`px-3 py-1 text-xs font-medium rounded ${timeRange === '7D' ? 'bg-white shadow-sm text-[#191c1e]' : 'text-[#515f74] hover:text-[#191c1e]'}`}>7D</button>
            </div>
          </div>
          <div className="p-4 h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#af101a" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#af101a" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#515f74' }} dy={10} />
                <Tooltip />
                <Area type="monotone" dataKey="revenue" stroke="#af101a" strokeWidth={2} fillOpacity={1} fill="url(#colorRev)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="lg:col-span-4 bg-white border border-[#e4beba] rounded-xl shadow-sm p-4 flex flex-col">
          <h3 className="text-xl font-semibold text-[#191c1e] mb-4">Quick Actions</h3>
          <div className="flex flex-col gap-3 flex-1 justify-center">
            {[
              { label: 'Add Product', icon: Plus },
              { label: 'View Orders', icon: ShoppingCart },
              { label: 'Clear Cache', icon: RefreshCw }
            ].map((action, i) => (
              <button 
                key={i} 
                onClick={() => handleQuickAction(action.label)}
                className="w-full flex items-center justify-between p-3 rounded-lg border border-[#e4beba] hover:border-[#af101a] hover:bg-[#fff2f0] transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded bg-[#eceef0] flex items-center justify-center text-[#af101a] group-hover:bg-[#af101a] group-hover:text-white transition-colors">
                    <action.icon size={18} />
                  </div>
                  <span className="text-sm font-medium text-[#191c1e]">{action.label}</span>
                </div>
                <ChevronRight size={20} className="text-[#515f74] group-hover:text-[#af101a]" />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Top Products */}
      <div className="bg-white border border-[#e4beba] rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-[#eceef0] flex justify-between items-center bg-[#f7f9fb]">
          <h3 className="text-xl font-semibold text-[#191c1e]">Top Selling Products</h3>
          <Button type="link" className="text-[#af101a] p-0 font-medium flex items-center gap-1" onClick={() => navigate('/admin/products')}>
            View All <ChevronRight size={16} />
          </Button>
        </div>
        <Table 
          dataSource={topProducts}
          rowKey="id"
          pagination={false}
          className="w-full"
          columns={[
            { title: 'PRODUCT ID', dataIndex: 'id', render: (_, r) => <span className="font-mono text-sm text-[#5b403d]">{r.id}</span> },
            { title: 'PRODUCT NAME', dataIndex: 'name', className: 'font-medium' },
            { title: 'VOLUME', dataIndex: 'volume', align: 'right' as const },
            { title: 'REVENUE', dataIndex: 'revenue', align: 'right' as const },
            { title: 'TREND', dataIndex: 'trend', align: 'center' as const, render: (t) => <TrendIcon trend={t} /> },
          ]}
        />
      </div>
    </div>
  );
}
