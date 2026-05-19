import React, { useState } from 'react';
import { Select, DatePicker, Button, Table, message, Dropdown, MenuProps } from 'antd';
import { Download, TrendingUp, DollarSign, ShoppingBag, Users as UsersIcon } from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';

const { RangePicker } = DatePicker;

const salesData = [
  { name: 'Mon', sales: 4000, orders: 240 },
  { name: 'Tue', sales: 3000, orders: 139 },
  { name: 'Wed', sales: 2000, orders: 98 },
  { name: 'Thu', sales: 2780, orders: 390 },
  { name: 'Fri', sales: 1890, orders: 480 },
  { name: 'Sat', sales: 2390, orders: 380 },
  { name: 'Sun', sales: 3490, orders: 430 },
];

const categoryData = [
  { name: 'Electronics', value: 400 },
  { name: 'Clothing', value: 300 },
  { name: 'Home & Garden', value: 300 },
  { name: 'Accessories', value: 200 },
];

const COLORS = ['#00799c', '#d32f2f', '#2a7a40', '#f5a623'];

const topProductsData = [
  { key: '1', name: 'Wireless Headphones', category: 'Electronics', sales: 1240, revenue: '$124,000' },
  { key: '2', name: 'Cotton T-Shirt', category: 'Clothing', sales: 980, revenue: '$29,400' },
  { key: '3', name: 'Coffee Maker', category: 'Home & Garden', sales: 850, revenue: '$68,000' },
  { key: '4', name: 'Leather Wallet', category: 'Accessories', sales: 720, revenue: '$36,000' },
  { key: '5', name: 'Smart Watch', category: 'Electronics', sales: 650, revenue: '$195,000' },
];

export default function ReportsPage() {
  const [timeRange, setTimeRange] = useState('7days');

  const exportCSV = (filename: string, headers: string[], data: any[][]) => {
    try {
      const BOM = '\uFEFF';
      const csvContent = BOM + [
        headers.join(','),
        ...data.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      message.success(`${filename} exported successfully`);
    } catch (error) {
      message.error(`Failed to export ${filename}`);
    }
  };

  const handleExportAction: MenuProps['onClick'] = (e) => {
    switch (e.key) {
      case 'orders':
        exportCSV(
          `Orders_List_Report_${timeRange}.csv`,
          ['Order ID', 'Customer ID', 'Customer Name', 'Phone', 'Email', 'Address', 'Products', 'Subtotal', 'Shipping Fee', 'Voucher', 'Discount Amount', 'Total Payment', 'Status', 'Payment Method', 'Order Date', 'Last Update Date'],
          [
            ['ORD-001', 'USR-001', 'Customer A', '0901234567', 'a@email.com', '123 Street A, District B, City C', 'Black T-Shirt (SKU-A-M) x 2', 400000, 30000, 'FREESHIP', 30000, 400000, 'Success', 'COD', '2023-11-20 10:00', '2023-11-22 14:00'],
            ['ORD-002', 'USR-002', 'Customer B', '0912345678', 'b@email.com', '456 Street X, District Y, City Z', 'Coffee Maker (SKU-CF) x 1', 1200000, 50000, 'GIAM50K', 50000, 1200000, 'Packing', 'Transfer', '2023-11-21 09:30', '2023-11-21 11:00']
          ]
        );
        break;
      case 'revenue':
        exportCSV(
          `Revenue_Report_${timeRange}.csv`,
          ['Time', 'Total Orders', 'Successful Orders', 'Canceled Orders', 'Total Revenue', 'Total Discount', 'Total Shipping Fee', 'AOV (Average Order Value)'],
          [
            ['11/2023', 500, 450, 50, 150000000, 5000000, 12500000, 333333],
            ['10/2023', 420, 380, 40, 120000000, 4000000, 10500000, 315789]
          ]
        );
        break;
      case 'inventory':
        exportCSV(
          `Inventory_Report_${timeRange}.csv`,
          ['Product ID', 'Product Name', 'Category', 'Variant (Size/Color)', 'Stock Quantity', 'Price', 'Sold Count', 'Status'],
          [
            ['PRO-001', 'Basic T-Shirt', 'Clothing', 'Size L / Black', 150, 200000, 850, 'Visible'],
            ['PRO-002', 'Wireless Headphones', 'Electronics', 'White', 30, 1500000, 210, 'Visible'],
            ['PRO-003', 'Sports Shoes', 'Clothing', 'Size 42 / Blue', 5, 850000, 120, 'Hidden (Low Stock)']
          ]
        );
        break;
    }
  };

  const exportMenuItems: MenuProps['items'] = [
    { key: 'orders', label: 'Orders List Report' },
    { key: 'revenue', label: 'Revenue Report' },
    { key: 'inventory', label: 'Products & Inventory Report' },
  ];

  const getPercentageChange = (positive: boolean, value: string) => (
    <span className={`text-xs ml-2 font-medium ${positive ? 'text-green-600' : 'text-red-500'}`}>
      {positive ? '+' : '-'}{value}%
    </span>
  );

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#191c1e]">Reports & Analytics</h1>
          <p className="text-[#5b403d] mt-1 text-sm">Monitor your store's performance and sales trends.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <RangePicker className="rounded-lg border-[#d8dadc]" />
          <Select
            value={timeRange}
            onChange={setTimeRange}
            className="w-32"
            options={[
              { value: 'today', label: 'Today' },
              { value: '7days', label: 'Last 7 Days' },
              { value: '30days', label: 'Last 30 Days' },
              { value: 'year', label: 'This Year' },
            ]}
          />
          <Dropdown menu={{ items: exportMenuItems, onClick: handleExportAction }} trigger={['click']}>
            <Button icon={<Download size={16} />} className="flex items-center gap-2 text-[#5b403d]">
              Export
            </Button>
          </Dropdown>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-[#d8dadc] shadow-sm rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[#5b403d] font-medium text-sm">Total Revenue</span>
            <div className="p-2 bg-[#e0f2fe] rounded-lg text-[#00799c]">
              <DollarSign size={18} />
            </div>
          </div>
          <div className="flex items-end mt-2">
            <span className="text-2xl font-bold text-[#191c1e]">$24,560</span>
            {getPercentageChange(true, '12.5')}
          </div>
        </div>
        
        <div className="bg-white border border-[#d8dadc] shadow-sm rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[#5b403d] font-medium text-sm">Total Orders</span>
            <div className="p-2 bg-[#fff2f0] rounded-lg text-[#af101a]">
              <ShoppingBag size={18} />
            </div>
          </div>
          <div className="flex items-end mt-2">
            <span className="text-2xl font-bold text-[#191c1e]">1,245</span>
            {getPercentageChange(true, '8.2')}
          </div>
        </div>

        <div className="bg-white border border-[#d8dadc] shadow-sm rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[#5b403d] font-medium text-sm">Conversion Rate</span>
            <div className="p-2 bg-[#d5fcde] rounded-lg text-[#2a7a40]">
              <TrendingUp size={18} />
            </div>
          </div>
          <div className="flex items-end mt-2">
            <span className="text-2xl font-bold text-[#191c1e]">3.4%</span>
            {getPercentageChange(false, '1.1')}
          </div>
        </div>

        <div className="bg-white border border-[#d8dadc] shadow-sm rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[#5b403d] font-medium text-sm">New Customers</span>
            <div className="p-2 bg-[#f4ebff] rounded-lg text-[#7c3aed]">
              <UsersIcon size={18} />
            </div>
          </div>
          <div className="flex items-end mt-2">
            <span className="text-2xl font-bold text-[#191c1e]">342</span>
            {getPercentageChange(true, '14.5')}
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white border border-[#d8dadc] shadow-sm rounded-xl p-6">
          <h3 className="font-bold text-[#191c1e] mb-4">Revenue Overview</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={salesData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eceef0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#8f6f6c', fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#8f6f6c', fontSize: 12 }} tickFormatter={(value) => `$${value}`} />
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: '1px solid #d8dadc', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}
                />
                <Legend iconType="circle" />
                <Line type="monotone" name="Revenue" dataKey="sales" stroke="#00799c" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                <Line type="monotone" name="Orders" dataKey="orders" stroke="#d32f2f" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white border border-[#d8dadc] shadow-sm rounded-xl p-6">
          <h3 className="font-bold text-[#191c1e] mb-4">Sales by Category</h3>
          <div className="h-[300px]">
             <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend iconType="circle" layout="horizontal" verticalAlign="bottom" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Top Products Table */}
      <div className="bg-white border border-[#d8dadc] shadow-sm rounded-xl p-6">
        <h3 className="font-bold text-[#191c1e] mb-4">Top Selling Products</h3>
        <Table 
          dataSource={topProductsData} 
          pagination={false}
          columns={[
            { title: 'Product Name', dataIndex: 'name', key: 'name', className: 'text-[#191c1e] font-medium' },
            { title: 'Category', dataIndex: 'category', key: 'category', className: 'text-[#5b403d]' },
            { title: 'Sales (Units)', dataIndex: 'sales', key: 'sales', className: 'text-[#5b403d]' },
            { title: 'Revenue', dataIndex: 'revenue', key: 'revenue', className: 'text-[#191c1e] font-medium right-align' },
          ]}
        />
      </div>
    </div>
  );
}
