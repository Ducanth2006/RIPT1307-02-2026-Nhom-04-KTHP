import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Table, Input, Select, Space, message, Popconfirm, Dropdown, MenuProps, Switch, Modal, Form, InputNumber } from 'antd';
import { Plus, Search, SlidersHorizontal, Edit2, Trash2, Image as ImageIcon, Box, Activity, AlertTriangle, CheckCircle } from 'lucide-react';
import { getAdminProducts, getAdminProductStats, deleteAdminProduct, updateAdminProduct } from '../../services/adminProductService';
import axiosInstance from '../../utils/axiosConfig';
import ip from '../../utils/ip';
import type { ColumnsType } from 'antd/es/table';

export default function Products() {
  const navigate = useNavigate();

  const [data, setData] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({ totalProducts: 0, activeProducts: 0, totalStock: 0, lowStockAlerts: 0 });
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [selectedParent, setSelectedParent] = useState<string | number>('Tất cả');
  const [selectedChild, setSelectedChild] = useState<string | number>('Tất cả');
  const [priceRange, setPriceRange] = useState('Tất cả mức giá');
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [allCategories, setAllCategories] = useState<any[]>([]);

  // Update Modal State
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any | null>(null);
  const [form] = Form.useForm();

  const fetchData = async () => {
    setLoading(true);
    try {
      const [statsRes, productsRes, categoriesRes] = await Promise.all([
        getAdminProductStats(),
        getAdminProducts(),
        axiosInstance.get(`${ip}/admin/categories`)
      ]);
      setStats(statsRes.data || { totalProducts: 0, activeProducts: 0, totalStock: 0, lowStockAlerts: 0 });
      setData(productsRes.data || []);
      setAllCategories(categoriesRes.data?.data || []);
    } catch (error) {
      message.error('Lỗi khi tải dữ liệu sản phẩm!');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDelete = async (id: string | number) => {
    try {
      await deleteAdminProduct(id);
      message.success('Đã xóa sản phẩm thành công');
      fetchData(); // Tải lại danh sách
    } catch (error) {
      message.error('Xóa sản phẩm thất bại');
    }
  };

  const handleToggleStatus = async (record: any, checked: boolean) => {
    const newStatus = checked ? 'Active' : 'Draft';
    try {
      await updateAdminProduct(record.id, { status: newStatus });
      message.success(`Đã cập nhật trạng thái thành ${newStatus}`);
      fetchData();
    } catch (error) {
      message.error('Cập nhật trạng thái thất bại');
    }
  };

  const openEditModal = (product: any) => {
    setEditingProduct(product);
    form.setFieldsValue({
      name: product.name,
      brand: product.brand,
      base_price: product.base_price,
      status: product.status === 'Active'
    });
    setIsModalVisible(true);
  };

  const onEditModalOk = () => {
    form.validateFields().then(async values => {
      message.loading({ content: 'Đang lưu...', key: 'saveProd' });
      const payload = {
        name: values.name,
        brand: values.brand,
        base_price: values.base_price,
        status: values.status ? 'Active' : 'Draft'
      };

      try {
        await updateAdminProduct(editingProduct.id, payload);
        message.success({ content: 'Cập nhật sản phẩm thành công.', key: 'saveProd' });
        setIsModalVisible(false);
        fetchData();
      } catch (error: any) {
        message.error({ content: 'Lưu thất bại', key: 'saveProd' });
      }
    });
  };

  const handleBulkAction: MenuProps['onClick'] = async (e) => {
    if (selectedRowKeys.length === 0) {
      message.warning('Vui lòng chọn sản phẩm trước');
      return;
    }
    
    message.loading({ content: 'Đang xử lý...', key: 'bulk' });
    try {
      if (e.key === 'delete') {
        await Promise.all(selectedRowKeys.map(id => deleteAdminProduct(id as string)));
        message.success({ content: `Đã xóa ${selectedRowKeys.length} sản phẩm`, key: 'bulk' });
      } else if (e.key === 'hide') {
        await Promise.all(selectedRowKeys.map(id => updateAdminProduct(id as string, { status: 'Draft' })));
        message.success({ content: `Đã ẩn ${selectedRowKeys.length} sản phẩm`, key: 'bulk' });
      } else if (e.key === 'activate') {
        await Promise.all(selectedRowKeys.map(id => updateAdminProduct(id as string, { status: 'Active' })));
        message.success({ content: `Đã bật bán ${selectedRowKeys.length} sản phẩm`, key: 'bulk' });
      }
      setSelectedRowKeys([]);
      fetchData();
    } catch (error) {
      message.error({ content: 'Lỗi khi xử lý hàng loạt', key: 'bulk' });
    }
  };

  const bulkMenuItems: MenuProps['items'] = [
    { key: 'activate', label: 'Bật trạng thái (Active)' },
    { key: 'hide', label: 'Tắt trạng thái (Draft)' },
    { type: 'divider' },
    { key: 'delete', label: 'Xóa đã chọn', danger: true },
  ];

  const columns: ColumnsType<any> = [
    { 
      title: 'Hình ảnh', 
      dataIndex: 'main_image', 
      width: 80,
      render: (img: string) => (
        <div className="w-12 h-12 rounded-lg border border-[#d8dadc] flex items-center justify-center bg-[#e0e3e5] text-[#8f6f6c] overflow-hidden shadow-sm">
          {img ? <img src={img} className="w-full h-full object-cover" alt="product" /> : <ImageIcon size={20} />}
        </div>
      ) 
    },
    { 
      title: 'Tên Sản Phẩm', 
      dataIndex: 'name', 
      render: (text: string, record: any) => (
        <div>
          <div className="font-bold text-[15px] text-[#191c1e]">{text}</div>
          <div className="text-[13px] text-[#5b403d] mt-0.5">ID: PRD-{record.id} | {record.brand || 'No Brand'}</div>
        </div>
      )
    },
    { 
      title: 'Danh mục', 
      render: (_: any, record: any) => <span className="text-[#5b403d] font-medium text-[15px]">{record.categories?.name || '---'}</span> 
    },
    { 
      title: 'Giá bán', 
      dataIndex: 'base_price', 
      align: 'right' as const, 
      className: 'font-mono text-[15px] font-bold text-[#af101a]', 
      render: (val: number) => `${Number(val).toLocaleString('vi-VN')} đ` 
    },
    { 
      title: 'Tồn kho', 
      dataIndex: 'total_stock', 
      align: 'right' as const, 
      render: (val: number) => (
        <span className="flex items-center justify-end gap-2 text-[15px] font-medium text-[#191c1e]">
          <span className={`w-2.5 h-2.5 rounded-full ${val === 0 ? 'bg-red-500' : val < 20 ? 'bg-amber-500' : 'bg-green-500'}`}></span>
          {val}
        </span>
      )
    },
    { 
      title: 'Trạng thái', 
      dataIndex: 'status', 
      align: 'center' as const,
      width: 140,
      render: (status: string, record: any) => (
        <Space>
          <Switch 
            checked={status === 'Active'} 
            onChange={(checked) => handleToggleStatus(record, checked)} 
            size="small" 
          />
          <span className={`px-3 py-1 rounded-full text-[13px] font-bold tracking-wide ${
            status === 'Active' ? 'bg-[#d5fcde] text-[#2a7a40]' : 'bg-[#eceef0] text-[#5b403d]'
          }`}>
            {status}
          </span>
        </Space>
      ) 
    },
    { 
      title: 'Hành động', 
      key: 'action', 
      align: 'right' as const, 
      width: 120,
      render: (_: any, record: any) => (
        <Space size="middle">
          <Button type="text" icon={<Edit2 size={16} />} onClick={() => openEditModal(record)} className="text-[#00799c] hover:bg-[#e0f2fe]" title="Sửa" />
          <Popconfirm
            title="Xóa sản phẩm"
            description={`Bạn có chắc muốn xóa "${record.name}"?`}
            onConfirm={() => handleDelete(record.id)}
            okText="Xóa"
            cancelText="Hủy"
            placement="topRight"
            okButtonProps={{ danger: true }}
          >
            <Button type="text" danger icon={<Trash2 size={16} />} title="Xóa" />
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
          !item.name?.toLowerCase().includes(searchLower) && 
          !String(item.id).includes(searchLower)) {
        return false;
      }
      
      // Lọc theo danh mục con trước (ưu tiên cao hơn vì chi tiết hơn)
      if (selectedChild !== 'Tất cả') {
        if (item.category_id !== Number(selectedChild)) return false;
      } 
      // Nếu không chọn danh mục con cụ thể, lọc theo danh mục cha
      else if (selectedParent !== 'Tất cả') {
        const parentId = Number(selectedParent);
        const childIds = allCategories
          .filter(c => c.parent_id === parentId)
          .map(c => c.id);
        
        if (item.category_id !== parentId && !childIds.includes(item.category_id)) {
          return false;
        }
      }

      // Price filter
      const price = Number(item.base_price || 0);
      if (priceRange === 'Dưới 500k' && price >= 500000) return false;
      if (priceRange === '500k - 1 Triệu' && (price < 500000 || price > 1000000)) return false;
      if (priceRange === 'Trên 1 Triệu' && price <= 1000000) return false;

      return true;
    });
  }, [data, searchText, selectedParent, selectedChild, priceRange, allCategories]);

  const parentCategoryOptions = useMemo(() => {
    const parents = allCategories.filter(c => !c.parent_id);
    return [
      { value: 'Tất cả', label: 'Tất cả danh mục hàng' },
      ...parents.map(p => ({ value: p.id, label: p.name }))
    ];
  }, [allCategories]);

  const childCategoryOptions = useMemo(() => {
    let children = allCategories.filter(c => c.parent_id);
    if (selectedParent !== 'Tất cả') {
      children = children.filter(c => c.parent_id === Number(selectedParent));
    }
    return [
      { value: 'Tất cả', label: 'Tất cả danh mục sản phẩm' },
      ...children.map(c => ({ value: c.id, label: c.name }))
    ];
  }, [allCategories, selectedParent]);

  const handleParentChange = (val: string | number) => {
    setSelectedParent(val);
    setSelectedChild('Tất cả');
  };

  return (
    <div className="p-4 md:p-6 max-w-[1440px] mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-[#191c1e] tracking-tight">Quản lý Sản Phẩm</h1>
          <p className="text-[15px] text-[#5b403d] mt-2 font-medium">Theo dõi kho hàng, giá bán và trạng thái sản phẩm.</p>
        </div>
        <Button 
          type="primary" 
          icon={<Plus size={20} />} 
          className="bg-[#d32f2f] hover:bg-[#ba1a20] h-10 text-[15px] font-bold px-6 rounded-xl shadow-sm"
          onClick={() => navigate('/admin/products/new')}
        >
          Tạo Sản Phẩm Mới
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Tổng số Sản Phẩm', value: stats.totalProducts.toLocaleString('vi-VN'), icon: Box, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Sản phẩm Hoạt động', value: stats.activeProducts.toLocaleString('vi-VN'), icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Tổng Tồn Kho', value: stats.totalStock.toLocaleString('vi-VN'), icon: Activity, color: 'text-green-600', bg: 'bg-green-50' },
          { label: 'Cảnh báo Hết Hàng', value: stats.lowStockAlerts.toLocaleString('vi-VN'), icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50' },
        ].map((stat, i) => (
          <div key={i} className="bg-white p-5 rounded-2xl border border-[#d8dadc] shadow-sm flex items-center gap-5 hover:shadow-md transition-shadow">
            <div className={`w-14 h-14 flex items-center justify-center rounded-xl ${stat.bg}`}>
              <stat.icon className={stat.color} size={28} />
            </div>
            <div>
              <p className="text-2xl md:text-3xl font-extrabold text-[#191c1e]">{stat.value}</p>
              <p className="text-[14px] text-[#5b403d] font-bold mt-1">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white border border-[#d8dadc] rounded-xl shadow-sm">
        <div className="p-4 border-b border-[#d8dadc] flex flex-col md:flex-row gap-4 justify-between items-center bg-[#f7f9fb] rounded-t-xl">
          <div className="flex-1 w-full flex flex-col md:flex-row gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5b403d]" size={18} />
              <Input 
                placeholder="Tìm theo ID hoặc tên sản phẩm..." 
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className="w-full pl-10 h-10 text-[15px] font-medium rounded-xl"
                allowClear
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Select 
                value={selectedParent}
                onChange={handleParentChange}
                style={{ width: 220 }} 
                className="h-10 text-[15px] font-medium"
                options={parentCategoryOptions} 
              />
              <Select 
                value={selectedChild}
                onChange={setSelectedChild}
                style={{ width: 220 }} 
                className="h-10 text-[15px] font-medium"
                options={childCategoryOptions} 
              />
              <Select 
                value={priceRange}
                onChange={setPriceRange}
                style={{ width: 160 }} 
                className="h-10 text-[15px] font-medium" 
                options={[
                  { value: 'Tất cả mức giá' }, 
                  { value: 'Dưới 500k' },
                  { value: '500k - 1 Triệu' },
                  { value: 'Trên 1 Triệu' }
                ]} 
              />
              {selectedRowKeys.length > 0 && (
                <Dropdown menu={{ items: bulkMenuItems, onClick: handleBulkAction }} trigger={['click']}>
                  <Button type="primary" className="bg-[#00799c] h-10 rounded-xl font-bold">
                    Thao tác ({selectedRowKeys.length})
                  </Button>
                </Dropdown>
              )}
            </div>
          </div>
        </div>

        <Table 
          columns={columns} 
          dataSource={filteredData} 
          rowKey="id"
          rowSelection={{
            selectedRowKeys,
            onChange: (keys) => setSelectedRowKeys(keys),
          }}
          loading={loading}
          scroll={{ x: 'max-content', y: 600 }}
          pagination={{
            showSizeChanger: true,
            showTotal: (total, range) => `${range[0]}-${range[1]} trong ${total} sản phẩm`,
            defaultPageSize: 20
          }}
          className="custom-table"
        />
      </div>

      {/* Cập Nhật Sản Phẩm Nổi (Edit Modal) */}
      <Modal
        title={<span className="text-xl font-extrabold text-[#191c1e]">Cập nhật Thông tin Cơ bản</span>}
        open={isModalVisible}
        onOk={onEditModalOk}
        onCancel={() => setIsModalVisible(false)}
        width={600}
        okText="Lưu Thay Đổi"
        cancelText="Hủy"
        okButtonProps={{ className: "bg-[#d32f2f] hover:bg-[#ba1a20] h-10 font-bold px-6 rounded-lg text-[15px]" }}
        cancelButtonProps={{ className: "h-10 font-bold px-6 rounded-lg text-[15px]" }}
      >
        <Form 
          form={form} 
          layout="vertical" 
          className="mt-6 text-[#191c1e] text-[15px] font-medium"
        >
          <Form.Item 
            name="name" 
            label="Tên sản phẩm" 
            rules={[{ required: true, message: 'Vui lòng nhập tên!' }]}
          >
            <Input size="large" />
          </Form.Item>

          <div className="grid grid-cols-2 gap-4">
            <Form.Item 
              name="base_price" 
              label="Giá bán cơ bản (VNĐ)" 
              rules={[{ required: true, message: 'Vui lòng nhập giá!' }]}
            >
              <InputNumber size="large" className="w-full" min={0} />
            </Form.Item>

            <Form.Item name="brand" label="Thương hiệu">
              <Input size="large" />
            </Form.Item>
          </div>

          <Form.Item name="status" label="Trạng thái hiển thị" valuePropName="checked">
             <Switch checkedChildren="Đang Bán" unCheckedChildren="Tạm Ẩn" />
          </Form.Item>
          
          <p className="text-xs text-gray-500 mt-2 italic">* Để chỉnh sửa sâu về Hình ảnh và Phân loại (Size/Màu), sếp vui lòng xóa và tạo mới sản phẩm để tránh sai lệch kho hàng.</p>
        </Form>
      </Modal>
    </div>
  );
}
