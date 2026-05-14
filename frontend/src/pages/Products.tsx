import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Table, Input, Select, Space, message, Popconfirm, Dropdown, MenuProps } from 'antd';
import { Plus, Search, SlidersHorizontal, Edit, Trash2, EyeOff, Eye, Image as ImageIcon, MoreHorizontal, Download } from 'lucide-react';
import { Product } from '../types';

const initialData: any[] = [
  { key: '1', id: 'PRD-8921', img: true, name: 'Pro-Runner X1 Elite', category: 'Footwear', price: 149.99, stock: 420, status: 'ACTIVE' },
  { key: '2', id: 'PRD-8922', img: false, name: "Tech-Fleece Joggers Men's", category: 'Apparel', price: 85.00, stock: 12, status: 'ACTIVE' },
  { key: '3', id: 'PRD-8923', img: false, name: 'Championship Series Basketball', category: 'Equipment', price: 110.00, stock: 0, status: 'HIDDEN' },
  { key: '4', id: 'PRD-8924', img: false, name: 'Compression Sleeve Black', category: 'Accessories', price: 24.50, stock: 1204, status: 'ACTIVE' },
  { key: '5', id: 'PRD-8925', img: false, name: 'Hydration Pack 2L', category: 'Accessories', price: 45.00, stock: 89, status: 'ACTIVE' },
];

export default function Products() {
  const navigate = useNavigate();

  const [data, setData] = useState<any[]>(initialData);
  const [searchText, setSearchText] = useState('');
  const [category, setCategory] = useState('All Categories');
  const [priceRange, setPriceRange] = useState('Price: All');
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

  const handleDelete = (id: string) => {
    setData((prev) => prev.filter((item) => item.id !== id));
    message.success('Product deleted successfully');
  };

  const handleToggleStatus = (id: string) => {
    setData((prev) => prev.map((item) => {
      if (item.id === id) {
        const newStatus = item.status === 'ACTIVE' ? 'HIDDEN' : 'ACTIVE';
        message.success(`Product ${newStatus.toLowerCase()}`);
        return { ...item, status: newStatus };
      }
      return item;
    }));
  };

  const handleBulkAction: MenuProps['onClick'] = (e) => {
    if (selectedRowKeys.length === 0) {
      message.warning('Please select products first');
      return;
    }
    if (e.key === 'delete') {
      setData((prev) => prev.filter((item) => !selectedRowKeys.includes(item.key)));
      setSelectedRowKeys([]);
      message.success(`${selectedRowKeys.length} products deleted`);
    } else if (e.key === 'hide') {
      setData((prev) => prev.map((item) => selectedRowKeys.includes(item.key) ? { ...item, status: 'HIDDEN' } : item));
      setSelectedRowKeys([]);
      message.success(`${selectedRowKeys.length} products hidden`);
    } else if (e.key === 'activate') {
      setData((prev) => prev.map((item) => selectedRowKeys.includes(item.key) ? { ...item, status: 'ACTIVE' } : item));
      setSelectedRowKeys([]);
      message.success(`${selectedRowKeys.length} products activated`);
    }
  };

  const bulkMenuItems: MenuProps['items'] = [
    { key: 'activate', label: 'Mark as Active' },
    { key: 'hide', label: 'Mark as Hidden' },
    { type: 'divider' },
    { key: 'delete', label: 'Delete Selected', danger: true },
  ];

  const columns = [
    { title: 'ID', dataIndex: 'id', className: 'font-mono text-xs text-[#5b403d]' },
    { title: 'Img', dataIndex: 'img', render: (img: boolean) => (
        <div className="w-8 h-8 rounded border border-[#d8dadc] flex items-center justify-center bg-[#e0e3e5] text-[#8f6f6c]">
          {img ? <img src="https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=100&h=100&fit=crop" className="w-full h-full object-cover rounded" alt="product" /> : <ImageIcon size={16} />}
        </div>
      ) 
    },
    { title: 'Product Name', dataIndex: 'name', className: 'font-medium min-w-[200px]' },
    { title: 'Category', dataIndex: 'category', className: 'text-[#5b403d]' },
    { title: 'Price', dataIndex: 'price', align: 'right' as const, className: 'font-mono text-sm', render: (val: number) => `$${val.toFixed(2)}` },
    { title: 'Stock', dataIndex: 'stock', align: 'right' as const, render: (val: number) => (
        <span className="flex items-center justify-end gap-1">
          <span className={`w-2 h-2 rounded-full ${val === 0 ? 'bg-red-500' : val < 20 ? 'bg-amber-500' : 'bg-[#00799c]'}`}></span>
          {val}
        </span>
      )
    },
    { title: 'Status', dataIndex: 'status', align: 'center' as const, render: (val: string) => (
        <span className={`px-2 py-0.5 rounded-sm text-[11px] font-semibold tracking-wide uppercase border ${
          val === 'ACTIVE' ? 'bg-[#00799c]/10 text-[#00799c] border-[#00799c]/20' : 'bg-[#e0e3e5] text-[#5b403d] border-[#e4beba]'
        }`}>
          {val}
        </span>
      ) 
    },
    { title: 'Actions', key: 'action', align: 'right' as const, render: (_: any, record: Product) => (
        <Space className="opacity-50 hover:opacity-100 transition-opacity">
          <Button type="text" icon={<Edit size={16} />} size="small" className="text-[#5b403d] hover:text-[#af101a]" onClick={() => navigate('/products/new')} title="Edit" />
          {record.status === 'ACTIVE' ? (
            <Button type="text" icon={<EyeOff size={16} />} size="small" className="text-[#5b403d] hover:text-red-500" onClick={() => handleToggleStatus(record.id)} title="Hide" />
          ) : (
            <Button type="text" icon={<Eye size={16} />} size="small" className="text-[#5b403d] hover:text-[#00799c]" onClick={() => handleToggleStatus(record.id)} title="Show" />
          )}
          <Popconfirm
            title="Delete this product?"
            description="Are you sure you want to delete this product?"
            onConfirm={() => handleDelete(record.id)}
            okText="Yes"
            cancelText="No"
            placement="topRight"
          >
            <Button type="text" icon={<Trash2 size={16} />} size="small" className="text-[#5b403d] hover:text-red-500" title="Delete" />
          </Popconfirm>
        </Space>
      ) 
    },
  ];

  const filteredData = useMemo(() => {
    return data.filter(item => {
      // Search filter
      const searchLower = searchText.toLowerCase();
      if (searchText && 
          !item.name.toLowerCase().includes(searchLower) && 
          !item.id.toLowerCase().includes(searchLower)) {
        return false;
      }
      
      // Category filter
      if (category !== 'All Categories' && item.category !== category) {
        return false;
      }

      // Price filter
      if (priceRange === '$0 - $50' && (item.price < 0 || item.price > 50)) return false;
      if (priceRange === '$50 - $100' && (item.price <= 50 || item.price > 100)) return false;
      if (priceRange === '$100+' && item.price <= 100) return false;

      return true;
    });
  }, [data, searchText, category, priceRange]);

  const onSelectChange = (newSelectedRowKeys: React.Key[]) => {
    setSelectedRowKeys(newSelectedRowKeys);
  };

  const rowSelection = {
    selectedRowKeys,
    onChange: onSelectChange,
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#191c1e]">Product Management</h1>
          <p className="text-[#5b403d] mt-1 text-sm">Manage catalog inventory, pricing, and status.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            icon={<Download size={18} />} 
            className="text-[#5b403d] px-4 py-4"
            onClick={() => message.info('Exporting product catalog...')}
          >
            Export
          </Button>
          <button 
            onClick={() => navigate('/products/new')}
            className="bg-[#d32f2f] text-white text-sm font-medium px-4 py-2 rounded shadow-sm hover:bg-[#b71c1c] transition-colors flex items-center gap-2 border-b border-[#b71c1c]"
          >
            <Plus size={18} />
            Add New Product
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Products', val: '64,230', sub: '+12%', subCls: 'text-[#00799c]', border: 'border-t-4 border-t-[#d32f2f]' },
          { label: 'Active Listings', val: '59,102', sub: '92%', subCls: 'text-[#5b403d]' },
          { label: 'Low Stock Alerts', val: '1,432', valCls: 'text-red-600', sub: 'Action Required', subCls: 'text-red-600' },
          { label: 'Pending Sync', val: '84', sub: 'Warehouse A', subCls: 'text-[#5b403d]' },
        ].map((stat, i) => (
          <div key={i} className={`bg-white border border-[#d8dadc] rounded-lg p-4 shadow-sm ${stat.border || ''}`}>
            <p className="text-xs font-medium text-[#5b403d] mb-1">{stat.label}</p>
            <div className="flex items-baseline gap-2">
              <span className={`text-3xl font-bold ${stat.valCls || 'text-[#191c1e]'}`}>{stat.val}</span>
              <span className={`text-sm ${stat.subCls}`}>{stat.sub}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white border border-[#d8dadc] rounded-lg shadow-sm flex flex-col">
        <div className="p-4 border-b border-[#d8dadc] flex flex-col md:flex-row gap-4 justify-between items-center bg-[#f7f9fb] rounded-t-lg">
          <div className="flex-1 w-full flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5b403d]" size={20} />
              <input 
                type="text" 
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                placeholder="Search by ID, Name, or SKU..." 
                className="w-full pl-10 pr-4 py-2 bg-white border border-[#d8dadc] rounded-md text-sm focus:outline-none focus:border-[#af101a] focus:ring-1 focus:ring-[#af101a]/20"
              />
            </div>
            <div className="flex gap-2">
              <Select 
                value={category}
                onChange={setCategory}
                style={{ width: 140 }} 
                options={[
                  { value: 'All Categories' }, 
                  { value: 'Footwear' }, 
                  { value: 'Apparel' },
                  { value: 'Equipment' },
                  { value: 'Accessories' }
                ]} 
              />
              <Select 
                value={priceRange}
                onChange={setPriceRange}
                style={{ width: 120 }} 
                options={[
                  { value: 'Price: All' }, 
                  { value: '$0 - $50' },
                  { value: '$50 - $100' },
                  { value: '$100+' }
                ]} 
                className="hidden sm:block" 
              />
              <Button icon={<SlidersHorizontal size={18} />} onClick={() => message.info('Toggle advanced filters panel')} />
              {selectedRowKeys.length > 0 && (
                <Dropdown menu={{ items: bulkMenuItems, onClick: handleBulkAction }} trigger={['click']}>
                  <Button type="primary" className="bg-[#00799c]">
                    Bulk Actions ({selectedRowKeys.length})
                  </Button>
                </Dropdown>
              )}
            </div>
          </div>
        </div>

        <Table 
          columns={columns} 
          dataSource={filteredData} 
          rowSelection={rowSelection}
          pagination={{
            showSizeChanger: true,
            showTotal: (total, range) => `${range[0]}-${range[1]} of ${total}`,
            defaultPageSize: 50
          }}
          className="border-b"
          rowClassName={(r) => r.status === 'HIDDEN' ? 'opacity-75 bg-[#f7f9fb]' : 'hover:bg-[#f2f4f6]'}
        />
      </div>
    </div>
  );
}
