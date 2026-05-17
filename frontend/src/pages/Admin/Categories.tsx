import React, { useState, useMemo, useEffect } from 'react';
import axiosInstance from '../../utils/axiosConfig';
import ip from '../../utils/ip';
import { 
  Button, Input, Table, Tag, Space, 
  Modal, Form, Select, Switch, message, Popconfirm 
} from 'antd';
import { 
  Plus, Search, Edit2, Trash2, 
  FolderTree, Activity, AlertCircle 
} from 'lucide-react';
import type { ColumnsType } from 'antd/es/table';

interface Category {
  id: number;
  name: string;
  description: string | null;
  items: number;
  status: 'Active' | 'Draft';
  parent_id: number | null;
  slug: string;
  created_at: string;
  children?: Category[];
}

const generateSlug = (text: string) => {
  return text
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

export default function Categories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [stats, setStats] = useState({ parent_categories: 0, child_categories: 0, active_items: 0 });
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [levelFilter, setLevelFilter] = useState<string>('all');
  
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchCategories();
  }, []);

  const buildCategoryTree = (flatList: Category[]) => {
    const listMap: Record<number, Category> = {};
    const rootNodes: Category[] = [];

    // Lọc và chuẩn bị các node
    flatList.forEach(item => {
      listMap[item.id] = { ...item, children: undefined };
    });

    flatList.forEach(item => {
      const node = listMap[item.id];
      if (node.parent_id && listMap[node.parent_id]) {
        const parent = listMap[node.parent_id];
        if (!parent.children) parent.children = [];
        parent.children.push(node);
      } else {
        rootNodes.push(node);
      }
    });

    return rootNodes;
  };

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get(`${ip}/admin/categories`);
      if (response.status === 200 && response.data.data) {
        setCategories(buildCategoryTree(response.data.data));
      }
      
      const statsRes = await axiosInstance.get(`${ip}/admin/categories/stats`);
      if (statsRes.status === 200 && statsRes.data.data) {
        setStats(statsRes.data.data);
      }
    } catch (error: any) {
      console.error(error);
      const errorMsg = error.response?.data?.message || 'Tải danh sách danh mục thất bại';
      message.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // Chỉ hiển thị các danh mục gốc (không có parent_id) trong dropdown
  const parentCategoryOptions = useMemo(() => {
    return categories.map(c => ({ label: c.name, value: c.id }));
  }, [categories]);

  // Filtering
  const filteredData = useMemo(() => {
    let result = categories;

    // We deep clone to filter children safely
    const cloneAndFilter = (items: Category[]): Category[] => {
      return items.map(item => ({ ...item })).filter(item => {
        const matchSearch = item.name.toLowerCase().includes(searchText.toLowerCase()) || 
                            item.slug.toLowerCase().includes(searchText.toLowerCase());
        
        let matchLevel = true;
        if (levelFilter === 'parent') matchLevel = !item.parent_id;
        if (levelFilter === 'child') matchLevel = !!item.parent_id;

        if (item.children) {
          item.children = cloneAndFilter(item.children);
          // If a child matches but parent doesn't, we still want to keep the parent if searching
          if (item.children.length > 0 && levelFilter === 'all') {
            return true;
          }
        }

        return (matchSearch && matchLevel) || (item.children && item.children.length > 0 && matchLevel);
      });
    };

    if (searchText || levelFilter !== 'all') {
      result = cloneAndFilter(result);
    }

    return result;
  }, [categories, searchText, levelFilter]);


  const handleDelete = async (category: Category) => {
    try {
      const res = await axiosInstance.delete(`${ip}/admin/categories/${category.id}`);
      if (res.status === 200) {
        message.success('Xóa danh mục thành công.');
        fetchCategories();
      }
    } catch (error: any) {
      if (error.response && error.response.data && error.response.data.message) {
        message.error(error.response.data.message);
      } else {
        message.error('Xóa danh mục thất bại');
      }
    }
  };

  const handleToggleStatus = async (category: Category, checked: boolean) => {
    const newStatus = checked ? 'Active' : 'Draft';
    try {
      await axiosInstance.patch(`${ip}/admin/categories/${category.id}`, { status: newStatus });
      message.success(`Đã cập nhật trạng thái thành ${newStatus}`);
      fetchCategories();
    } catch (error: any) {
      message.error('Cập nhật trạng thái thất bại');
      fetchCategories(); // Reset UI on fail
    }
  };

  const openModal = (category?: Category) => {
    if (category) {
      setEditingCategory(category);
      form.setFieldsValue({
        name: category.name,
        slug: category.slug,
        parent_id: category.parent_id,
        description: category.description,
        status: category.status === 'Active'
      });
    } else {
      setEditingCategory(null);
      form.resetFields();
    }
    setIsModalVisible(true);
  };

  const onModalOk = () => {
    form.validateFields().then(async values => {
      message.loading({ content: 'Đang lưu...', key: 'saveCat' });
      const payload: any = {
        name: values.name,
        description: values.description || null,
        slug: values.slug || generateSlug(values.name),
        parent_id: values.parent_id || null,
        status: values.status ? 'Active' : 'Draft',
      };

      try {
        if (editingCategory) {
          // Update
          await axiosInstance.patch(`${ip}/admin/categories/${editingCategory.id}`, payload);
          message.success({ content: 'Cập nhật danh mục thành công.', key: 'saveCat' });
        } else {
          // Create
          await axiosInstance.post(`${ip}/admin/categories`, payload);
          message.success({ content: 'Thêm danh mục mới thành công.', key: 'saveCat' });
        }
        setIsModalVisible(false);
        fetchCategories();
      } catch (error: any) {
        const errorMsg = error.response?.data?.message || 'Lưu danh mục thất bại';
        message.error({ content: errorMsg, key: 'saveCat' });
      }
    });
  };

  const columns: ColumnsType<Category> = [
    {
      title: 'Tên danh mục',
      dataIndex: 'name',
      key: 'name',
      render: (text) => (
        <div className="font-medium text-[#191c1e]">{text}</div>
      ),
    },
    {
      title: 'Mô tả',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
      className: 'text-[#5b403d]',
    },
    {
      title: 'Số lượng sản phẩm',
      dataIndex: 'items',
      key: 'items',
      width: 160,
      render: (count) => (
        <Tag color={count === 0 ? 'default' : 'blue'}>{count} sản phẩm</Tag>
      ),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      width: 140,
      render: (status, record) => (
        <Space>
          <Switch 
            checked={status === 'Active'} 
            onChange={(checked) => handleToggleStatus(record, checked)} 
            size="small" 
          />
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
            status === 'Active' ? 'bg-[#d5fcde] text-[#2a7a40]' : 'bg-[#eceef0] text-[#5b403d]'
          }`}>
            {status}
          </span>
        </Space>
      ),
    },
    {
      title: 'Ngày tạo',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 120,
      render: (date) => {
        if (!date) return <span className="text-sm text-gray-500">-</span>;
        const formattedDate = new Date(date).toLocaleString('vi-VN', {
          day: '2-digit', month: '2-digit', year: 'numeric',
          hour: '2-digit', minute: '2-digit'
        });
        return <span className="text-sm text-gray-500">{formattedDate}</span>;
      }
    },
    {
      title: 'Hành động',
      key: 'action',
      width: 120,
      render: (_, record) => (
        <Space size="middle">
          <Button type="text" icon={<Edit2 size={16} />} onClick={() => openModal(record)} className="text-[#00799c] hover:bg-[#e0f2fe]" />
          <Popconfirm 
            title="Xóa danh mục" 
            description={`Bạn có chắc muốn xóa "${record.name}"?`}
            onConfirm={() => handleDelete(record)}
            okText="Xóa"
            cancelText="Hủy"
            okButtonProps={{ danger: true }}
          >
            <Button type="text" danger icon={<Trash2 size={16} />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="p-4 md:p-6 max-w-[1440px] mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-2">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-[#191c1e]">Quản lý Danh Mục</h1>
          <p className="text-sm text-[#5b403d] mt-1">Sắp xếp và quản lý phân loại sản phẩm.</p>
        </div>
        <Button 
          type="primary" 
          icon={<Plus size={18} />} 
          className="bg-[#d32f2f] hover:bg-[#ba1a20] h-10"
          onClick={() => openModal()}
        >
          Tạo danh mục
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Tổng danh mục Hàng (Cha)', value: stats.parent_categories, icon: FolderTree, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Tổng danh mục Sản phẩm (Con)', value: stats.child_categories, icon: FolderTree, color: 'text-purple-600', bg: 'bg-purple-50' },
          { label: 'Sản phẩm đang bán', value: stats.active_items, icon: Activity, color: 'text-green-600', bg: 'bg-green-50' },
        ].map((stat, i) => (
          <div key={i} className="bg-white p-4 rounded-xl border border-[#d8dadc] shadow-sm flex items-center gap-4">
            <div className={`w-12 h-12 flex items-center justify-center rounded-lg ${stat.bg}`}>
              <stat.icon className={stat.color} size={24} />
            </div>
            <div>
              <p className="text-2xl font-bold text-[#191c1e]">{stat.value}</p>
              <p className="text-sm text-[#5b403d] font-medium">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white border border-[#d8dadc] rounded-xl shadow-sm">
        <div className="p-4 border-b border-[#d8dadc] flex flex-col md:flex-row justify-between gap-4">
          <div className="flex flex-1 gap-4">
            <Input 
              placeholder="Tìm theo tên hoặc slug..." 
              prefix={<Search size={16} className="text-[#8f6f6c]" />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="max-w-sm rounded-lg"
              allowClear
            />
            <Select 
              value={levelFilter} 
              onChange={setLevelFilter}
              className="w-48 rounded-lg"
              options={[
                { value: 'all', label: 'Tất cả cấp bậc' },
                { value: 'parent', label: 'Danh mục cha' },
                { value: 'child', label: 'Danh mục con' },
              ]}
            />
          </div>
        </div>
        
        <Table<Category>
          rowKey="id"
          columns={columns}
          dataSource={filteredData}
          pagination={{ 
            defaultCurrent: 1, 
            pageSize: 10, 
            showSizeChanger: true, 
            pageSizeOptions: ['10', '20', '50'] 
          }}
          scroll={{ x: 'max-content', y: 500 }}
          loading={loading}
          className="overflow-x-auto custom-table"
        />
      </div>

      {/* Add / Edit Category Modal */}
      <Modal
        title={<span className="text-lg font-bold">{editingCategory ? 'Chỉnh sửa danh mục' : 'Thêm danh mục mới'}</span>}
        open={isModalVisible}
        onOk={onModalOk}
        onCancel={() => setIsModalVisible(false)}
        width={600}
        okText="Lưu"
        cancelText="Hủy"
        okButtonProps={{ className: "bg-[#00799c] hover:bg-[#006280]" }}
      >
        <Form 
          form={form} 
          layout="vertical" 
          className="mt-6 text-[#191c1e]"
          initialValues={{ status: true }}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
            <Form.Item 
              name="name" 
              label="Tên danh mục" 
              rules={[{ required: true, message: 'Vui lòng nhập tên danh mục!' }]}
            >
              <Input 
                onChange={(e) => {
                  if (!editingCategory) {
                    form.setFieldsValue({ slug: generateSlug(e.target.value) });
                  }
                }}
              />
            </Form.Item>

            <Form.Item name="slug" label="Đường dẫn (Slug)">
              <Input prefix="/" placeholder="tu-dong-tao" />
            </Form.Item>

            <Form.Item name="parent_id" label="Danh mục cha (Tùy chọn)">
              <Select 
                allowClear
                placeholder="Làm danh mục gốc"
                options={parentCategoryOptions.filter(c => c.value !== editingCategory?.id)}
              />
            </Form.Item>

            <Form.Item name="status" label="Trạng thái" valuePropName="checked">
              <Switch checkedChildren="Active" unCheckedChildren="Draft" />
            </Form.Item>
          </div>

          <Form.Item name="description" label="Mô tả chi tiết">
            <Input.TextArea rows={3} />
          </Form.Item>

        </Form>
      </Modal>
    </div>
  );
}
