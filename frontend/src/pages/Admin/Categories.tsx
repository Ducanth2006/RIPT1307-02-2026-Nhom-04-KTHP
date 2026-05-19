import React, { useState, useMemo } from 'react';
import { 
  Button, Input, Table, Tag, Space, 
  Modal, Form, Select, Upload, Switch, message, Popconfirm 
} from 'antd';
import { 
  Plus, Search, Edit2, Trash2, 
  Upload as UploadIcon, Filter 
} from 'lucide-react';
import type { ColumnsType } from 'antd/es/table';
import type { UploadFile } from 'antd/es/upload/interface';

interface Category {
  key: string;
  name: string;
  description: string;
  productCount: number;
  displayOrder: number;
  status: 'active' | 'inactive';
  parentId?: string;
  thumbnail?: string;
  slug: string;
  metaTitle?: string;
  metaDescription?: string;
  children?: Category[];
}

const generateSlug = (text: string) => {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

const initialData: Category[] = [
  {
    key: '1',
    name: 'Football Shoes',
    description: 'All kinds of football shoes',
    productCount: 150,
    displayOrder: 1,
    status: 'active',
    slug: 'football-shoes',
    metaTitle: 'Authentic Football Shoes',
    metaDescription: 'Buy high quality football shoes',
    children: [
      {
        key: '1-1',
        parentId: '1',
        name: 'Artificial Turf Shoes',
        description: 'TF Turf Shoes',
        productCount: 80,
        displayOrder: 1,
        status: 'active',
        slug: 'artificial-turf-shoes',
      },
      {
        key: '1-2',
        parentId: '1',
        name: 'Natural Grass Shoes',
        description: 'FG/SG Cleats',
        productCount: 70,
        displayOrder: 2,
        status: 'active',
        slug: 'natural-grass-shoes',
      }
    ]
  },
  {
    key: '2',
    name: 'Sports Apparel',
    description: 'Training and competition apparel',
    productCount: 320,
    displayOrder: 2,
    status: 'active',
    slug: 'sports-apparel',
  },
  {
    key: '3',
    name: 'Accessories',
    description: 'Socks, bands, shin guards',
    productCount: 0,
    displayOrder: 3,
    status: 'inactive',
    slug: 'accessories',
  }
];

export default function Categories() {
  const [categories, setCategories] = useState<Category[]>(initialData);
  const [searchText, setSearchText] = useState('');
  const [levelFilter, setLevelFilter] = useState<string>('all');
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [form] = Form.useForm();
  const [fileList, setFileList] = useState<UploadFile[]>([]);

  // Computed flat list for dropdown parent selection
  const flatCategories = useMemo(() => {
    const result: { label: string; value: string }[] = [];
    const traverse = (cats: Category[], prefix = '') => {
      cats.forEach(c => {
        result.push({ label: prefix + c.name, value: c.key });
        if (c.children) {
          traverse(c.children, prefix + '-- ');
        }
      });
    };
    traverse(categories);
    return result;
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
        if (levelFilter === 'parent') matchLevel = !item.parentId;
        if (levelFilter === 'child') matchLevel = !!item.parentId;

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


  const handleDelete = (category: Category) => {
    if (category.productCount > 0) {
      message.error(`Cannot delete "${category.name}" because it contains ${category.productCount} products. Please move them to a different category first.`);
      return;
    }
    
    // Recursive delete
    const deleteFromList = (list: Category[]): Category[] => {
      return list.filter(item => {
        if (item.key === category.key) return false;
        if (item.children) {
          item.children = deleteFromList(item.children);
        }
        return true;
      });
    };
    
    setCategories(deleteFromList(categories));
    message.success('Category deleted.');
  };

  const handleBulkStatusChange = (status: 'active' | 'inactive') => {
    if (selectedRowKeys.length === 0) return;
    
    const updateStatus = (list: Category[]): Category[] => {
      return list.map(item => {
        let newItem = { ...item };
        if (selectedRowKeys.includes(item.key)) {
          newItem.status = status;
        }
        if (newItem.children) {
          newItem.children = updateStatus(newItem.children);
        }
        return newItem;
      });
    };

    setCategories(updateStatus(categories));
    message.success(`Updated status for ${selectedRowKeys.length} categories.`);
    setSelectedRowKeys([]);
  };

  const openModal = (category?: Category) => {
    if (category) {
      setEditingCategory(category);
      form.setFieldsValue({
        ...category,
      });
    } else {
      setEditingCategory(null);
      form.resetFields();
    }
    setIsModalVisible(true);
  };

  const onModalOk = () => {
    form.validateFields().then(values => {
      const newNode: Category = {
        key: editingCategory ? editingCategory.key : Date.now().toString(),
        name: values.name,
        description: values.description || '',
        slug: values.slug || generateSlug(values.name),
        parentId: values.parentId,
        status: values.status ? 'active' : 'inactive',
        displayOrder: values.displayOrder || 1,
        productCount: editingCategory ? editingCategory.productCount : 0,
        metaTitle: values.metaTitle,
        metaDescription: values.metaDescription,
      };

      if (editingCategory) {
        // Update
        const updateInList = (list: Category[]): Category[] => {
          return list.map(item => {
            if (item.key === editingCategory.key) {
              return { ...item, ...newNode };
            }
            if (item.children) {
              return { ...item, children: updateInList(item.children) };
            }
            return item;
          });
        };
        setCategories(updateInList(categories));
        message.success('Category updated successfully.');
      } else {
        // Create
        if (newNode.parentId) {
          const insertToParent = (list: Category[]): Category[] => {
            return list.map(item => {
              if (item.key === newNode.parentId) {
                return { ...item, children: [...(item.children || []), newNode] };
              }
              if (item.children) {
                return { ...item, children: insertToParent(item.children) };
              }
              return item;
            });
          };
          setCategories(insertToParent(categories));
        } else {
          setCategories([...categories, newNode]);
        }
        message.success('New category added successfully.');
      }
      setIsModalVisible(false);
    });
  };

  const columns: ColumnsType<Category> = [
    {
      title: 'Category Name',
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => (
        <div>
          <div className="font-medium text-[#191c1e]">{text}</div>
          <div className="text-xs text-[#5b403d] font-mono">/{record.slug}</div>
        </div>
      ),
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
      className: 'text-[#5b403d]',
    },
    {
      title: 'Products',
      dataIndex: 'productCount',
      key: 'productCount',
      width: 120,
      render: (count) => (
        <Tag color={count === 0 ? 'default' : 'green'}>{count} items</Tag>
      ),
    },
    {
      title: 'Order',
      dataIndex: 'displayOrder',
      key: 'displayOrder',
      width: 100,
      align: 'center',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          status === 'active' ? 'bg-[#d5fcde] text-[#2a7a40]' : 'bg-[#eceef0] text-[#5b403d]'
        }`}>
          {status === 'active' ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    {
      title: 'Actions',
      key: 'action',
      width: 120,
      render: (_, record) => (
        <Space size="middle">
          <Button type="text" icon={<Edit2 size={16} />} onClick={() => openModal(record)} className="text-[#00799c] hover:bg-[#e0f2fe]" />
          <Popconfirm 
            title="Delete Category" 
            description={`Are you sure you want to delete "${record.name}"?`}
            onConfirm={() => handleDelete(record)}
            okText="Delete"
            cancelText="Cancel"
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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-[#191c1e]">Product Categories</h1>
          <p className="text-sm text-[#5b403d] mt-1">Manage product groups and taxonomies.</p>
        </div>
        <Button 
          type="primary" 
          icon={<Plus size={18} />} 
          className="bg-[#d32f2f] hover:bg-[#ba1a20] h-10"
          onClick={() => openModal()}
        >
          Add Category
        </Button>
      </div>

      <div className="bg-white border border-[#d8dadc] rounded-xl shadow-sm">
        <div className="p-4 border-b border-[#d8dadc] flex flex-col md:flex-row justify-between gap-4">
          <div className="flex flex-1 gap-4">
            <Input 
              placeholder="Search by name or slug..." 
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
                { value: 'all', label: 'All levels' },
                { value: 'parent', label: 'Parent Category' },
                { value: 'child', label: 'Child Category' },
              ]}
            />
          </div>
          {selectedRowKeys.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-[#5b403d]">Selected {selectedRowKeys.length}</span>
              <Button onClick={() => handleBulkStatusChange('active')} size="small" className="border-green-500 text-green-600">Show</Button>
              <Button onClick={() => handleBulkStatusChange('inactive')} size="small" danger>Hide</Button>
            </div>
          )}
        </div>
        
        <Table<Category>
          columns={columns}
          dataSource={filteredData}
          rowSelection={{
            selectedRowKeys,
            onChange: setSelectedRowKeys,
          }}
          pagination={false}
          className="overflow-x-auto custom-table"
        />
      </div>

      {/* Add / Edit Category Modal */}
      <Modal
        title={<span className="text-lg font-bold">{editingCategory ? 'Edit Category' : 'Add New Category'}</span>}
        open={isModalVisible}
        onOk={onModalOk}
        onCancel={() => setIsModalVisible(false)}
        width={700}
        okText="Save"
        cancelText="Cancel"
        okButtonProps={{ className: "bg-[#00799c] hover:bg-[#006280]" }}
      >
        <Form 
          form={form} 
          layout="vertical" 
          className="mt-6 text-[#191c1e]"
          initialValues={{ status: true, displayOrder: 1 }}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
            <Form.Item 
              name="name" 
              label="Category Name" 
              rules={[{ required: true, message: 'Please enter category name!' }]}
            >
              <Input 
                onChange={(e) => {
                  if (!editingCategory) {
                    form.setFieldsValue({ slug: generateSlug(e.target.value) });
                  }
                }}
              />
            </Form.Item>

            <Form.Item name="slug" label="Slug">
              <Input prefix="/" placeholder="auto-generated-from-name" />
            </Form.Item>

            <Form.Item name="parentId" label="Parent Category (Optional)">
              <Select 
                allowClear
                placeholder="As Root Category"
                options={flatCategories.filter(c => c.value !== editingCategory?.key)}
              />
            </Form.Item>

            <Form.Item name="displayOrder" label="Display Order">
              <Input type="number" min={1} />
            </Form.Item>
          </div>

          <Form.Item name="description" label="Description">
            <Input.TextArea rows={3} />
          </Form.Item>

          <div className="bg-[#f7f9fb] p-4 rounded-lg mb-6 border border-[#eceef0]">
            <h4 className="font-semibold mb-4 text-[#5b403d]">SEO & Display</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
              <Form.Item name="metaTitle" label="Meta Title">
                <Input placeholder="Page Title (Meta Title)" />
              </Form.Item>
              <Form.Item name="status" label="Status" valuePropName="checked" className="md:row-span-2">
                <Switch checkedChildren="Active" unCheckedChildren="Inactive" />
              </Form.Item>
              <Form.Item name="metaDescription" label="Meta Description">
                <Input.TextArea rows={2} placeholder="SEO Description..." />
              </Form.Item>
            </div>
          </div>

          <Form.Item label="Thumbnail/Icon">
            <Upload listType="picture-card" fileList={fileList} onChange={({ fileList: newFileList }) => setFileList(newFileList)}>
              {fileList.length >= 1 ? null : (
                <div>
                  <UploadIcon size={20} className="mx-auto text-gray-400" />
                  <div className="mt-2 text-xs text-gray-500">Upload</div>
                </div>
              )}
            </Upload>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
