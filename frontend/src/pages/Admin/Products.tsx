import React, {
  useEffect,
  useMemo,
  useState
} from 'react';

import { useNavigate } from 'react-router-dom';

import {
  Table,
  Input,
  Button,
  Modal,
  Form,
  InputNumber,
  message,
  Tag,
  Image,
  Empty,
  Select,
  Space,
  Alert,
  Switch,
  Popconfirm,
  Dropdown,
  Card,
  Statistic,
  Divider
} from 'antd';

import type {
  ColumnsType
} from 'antd/es/table';

import type {
  MenuProps
} from 'antd';

import {
  AlertTriangle,
  Search,
  RefreshCw,
  Package2,
  Plus,
  Box,
  Activity,
  CheckCircle,
  Edit2,
  Trash2,
  ShoppingBag,
  Layers3,
  CircleDollarSign
} from 'lucide-react';

import {
  getAdminProducts,
  getAdminProductStats,
  deleteAdminProduct,
  updateAdminProduct
} from '../../services/admin/productService';

import axiosInstance from '../../utils/axiosConfig';
import ip from '../../utils/ip';
import ProductImageUploader from '../../components/ProductImageUploader';

interface ProductImage {
  is_main?: boolean;
  url?: string;
  image_url?: string;
}

interface ProductVariant {
  id?: number;
  size?: string;
  color?: string;
  price?: number;
  stock_quantity?: number;
  sku?: string;
  cost_price?: number;
}

interface ProductItem {
  id: string;
  name: string;
  brand: string;
  base_price: number;
  total_stock: number;
  status: string;
  category_id: number;
  main_image?: string;
  description?: string;

  categories?: {
    id: number;
    name: string;
  };

  product_images?: ProductImage[];
  product_variants?: ProductVariant[];
}

export default function Products() {
  const navigate = useNavigate();

  const [messageApi, contextHolder] =
    message.useMessage();

  // =========================
  // STATE
  // =========================

  const [data, setData] = useState<
    ProductItem[]
  >([]);

  const [stats, setStats] = useState({
    totalProducts: 0,
    activeProducts: 0,
    totalStock: 0,
    lowStockAlerts: 0
  });

  const [loading, setLoading] =
    useState(false);

  const [searchText, setSearchText] =
    useState('');

  const [selectedParent, setSelectedParent] =
    useState<string | number>(
      'Tất cả'
    );

  const [selectedChild, setSelectedChild] =
    useState<string | number>(
      'Tất cả'
    );

  const [priceRange, setPriceRange] =
    useState('Tất cả mức giá');

  const [selectedRowKeys, setSelectedRowKeys] =
    useState<React.Key[]>([]);

  const [allCategories, setAllCategories] =
    useState<any[]>([]);

  const [isModalVisible, setIsModalVisible] =
    useState(false);

  const [editingProduct, setEditingProduct] =
    useState<ProductItem | null>(null);

  const [editingImages, setEditingImages] =
    useState<{ image_url: string; is_main: boolean }[]>([]);

  const [editingVariants, setEditingVariants] = useState<
    { key: number; id?: number; size: string; color: string; price: number; stock: number; cost_price: number }[]
  >([]);

  const [editingParentId, setEditingParentId] =
    useState<number | null>(null);

  const [form] = Form.useForm();

  // =========================
  // FORMAT
  // =========================

  const dinhDangTien = (
    soTien?: number | null
  ) => {
    return new Intl.NumberFormat(
      'vi-VN',
      {
        style: 'currency',
        currency: 'VND'
      }
    ).format(Number(soTien || 0));
  };

  const layAnh = (
    record: ProductItem
  ) => {
    if (record.main_image) {
      return record.main_image;
    }

    if (
      record.product_images?.length
    ) {
      const main =
        record.product_images.find(
          (item) => item.is_main
        );

      return (
        main?.url ||
        record.product_images?.[0]?.url
      );
    }

    return '';
  };

  // =========================
  // API
  // =========================

  const fetchData = async () => {
    try {
      setLoading(true);

      const [
        statsRes,
        productsRes,
        categoriesRes
      ] = await Promise.all([
        getAdminProductStats(),
        getAdminProducts(),
        axiosInstance.get(
          `${ip}/admin/categories`
        )
      ]);

      setStats(
        statsRes.data || {
          totalProducts: 0,
          activeProducts: 0,
          totalStock: 0,
          lowStockAlerts: 0
        }
      );

      setData(
        productsRes.data || []
      );

      setAllCategories(
        categoriesRes.data?.data || []
      );
    } catch (error) {
      messageApi.error(
        'Lỗi khi tải dữ liệu sản phẩm!'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // =========================
  // ACTION
  // =========================

  const handleDelete = async (
    id: string
  ) => {
    try {
      await deleteAdminProduct(id);

      messageApi.success(
        'Đã xóa sản phẩm'
      );

      fetchData();
    } catch (error) {
      messageApi.error(
        'Xóa sản phẩm thất bại'
      );
    }
  };

  const handleToggleStatus =
    async (
      record: ProductItem,
      checked: boolean
    ) => {
      const newStatus = checked
        ? 'Active'
        : 'Draft';

      try {
        await updateAdminProduct(
          record.id,
          {
            status: newStatus
          }
        );

        messageApi.success(
          'Đã cập nhật trạng thái'
        );

        fetchData();
      } catch (error) {
        messageApi.error(
          'Cập nhật trạng thái thất bại'
        );
      }
    };

  const openEditModal = (
    product: ProductItem
  ) => {
    setEditingProduct(product);

    const imgs = product.product_images?.map(img => ({
      image_url: img.image_url || img.url || '',
      is_main: !!img.is_main
    })) || [];
    setEditingImages(imgs);

    const varts = product.product_variants?.map((v, index) => ({
      key: v.id || Date.now() + index + Math.random(),
      id: v.id,
      size: v.size || 'M',
      color: v.color || 'Trắng',
      price: v.price || product.base_price || 0,
      stock: v.stock_quantity || 0,
      cost_price: v.cost_price || 0
    })) || [];
    setEditingVariants(varts);

    // Tìm parent_id của danh mục sản phẩm hiện tại
    const currentCategory = allCategories.find((c) => c.id === product.category_id);
    const parentId = currentCategory ? currentCategory.parent_id : null;
    setEditingParentId(parentId);

    form.setFieldsValue({
      name: product.name,
      brand: product.brand,
      base_price: product.base_price,
      parent_category_id: parentId,
      category_id: product.category_id,
      description: product.description || '',
      status: product.status === 'Active'
    });

    setIsModalVisible(true);
  };

  const onEditModalOk =
    async () => {
      try {
        const values =
          await form.validateFields();

        if (editingVariants.length === 0) {
          messageApi.warning('Vui lòng thêm ít nhất một phân loại (Size & Màu sắc)!');
          return;
        }

        const mappedVariants = editingVariants.map((v, index) => ({
          sku: `SKU-${Date.now()}-${index}`,
          size: v.size,
          color: v.color,
          price: v.price || values.base_price || 0,
          cost_price: v.cost_price || 0,
          stock_quantity: v.stock || 0
        }));

        await updateAdminProduct(
          editingProduct?.id || '',
          {
            name: values.name,
            brand: values.brand,
            base_price: values.base_price,
            category_id: values.category_id,
            description: values.description,
            status: values.status ? 'Active' : 'Draft',
            images: editingImages,
            variants: mappedVariants
          }
        );

        messageApi.success(
          'Cập nhật thành công'
        );

        setIsModalVisible(false);

        fetchData();
      } catch (error) {
        messageApi.error(
          'Cập nhật thất bại'
        );
      }
    };

  // =========================
  // FILTER
  // =========================

  const filteredData = useMemo(() => {
    return data.filter((item) => {
      const keyword =
        searchText
          .toLowerCase()
          .trim();

      if (
        keyword &&
        !item.name
          ?.toLowerCase()
          .includes(keyword) &&
        !String(item.id).includes(
          keyword
        )
      ) {
        return false;
      }

      if (
        selectedChild !==
        'Tất cả'
      ) {
        if (
          item.category_id !==
          Number(selectedChild)
        ) {
          return false;
        }
      } else if (
        selectedParent !==
        'Tất cả'
      ) {
        const parentId =
          Number(selectedParent);

        const childIds =
          allCategories
            .filter(
              (c) =>
                c.parent_id ===
                parentId
            )
            .map((c) => c.id);

        if (
          item.category_id !==
            parentId &&
          !childIds.includes(
            item.category_id
          )
        ) {
          return false;
        }
      }

      const price = Number(
        item.base_price || 0
      );

      if (
        priceRange ===
          'Dưới 500k' &&
        price >= 500000
      ) {
        return false;
      }

      if (
        priceRange ===
          '500k - 1 Triệu' &&
        (price < 500000 ||
          price > 1000000)
      ) {
        return false;
      }

      if (
        priceRange ===
          'Trên 1 Triệu' &&
        price <= 1000000
      ) {
        return false;
      }

      return true;
    });
  }, [
    data,
    searchText,
    selectedParent,
    selectedChild,
    priceRange,
    allCategories
  ]);

  // =========================
  // SELECT OPTION
  // =========================

  const parentCategoryOptions =
    useMemo(() => {
      const parents =
        allCategories.filter(
          (c) => !c.parent_id
        );

      return [
        {
          value: 'Tất cả',
          label:
            'Tất cả danh mục'
        },

        ...parents.map((p) => ({
          value: p.id,
          label: p.name
        }))
      ];
    }, [allCategories]);

  const childCategoryOptions =
    useMemo(() => {
      let children =
        allCategories.filter(
          (c) => c.parent_id
        );

      if (
        selectedParent !==
        'Tất cả'
      ) {
        children =
          children.filter(
            (c) =>
              c.parent_id ===
              Number(
                selectedParent
              )
          );
      }

      return [
        {
          value: 'Tất cả',
          label:
            'Tất cả sản phẩm'
        },

        ...children.map((c) => ({
          value: c.id,
          label: c.name
        }))
      ];
    }, [
      allCategories,
      selectedParent
    ]);

  // =========================
  // BULK ACTION
  // =========================

  const handleBulkAction:
    MenuProps['onClick'] =
    async (e) => {
      if (
        selectedRowKeys.length ===
        0
      ) {
        return messageApi.warning(
          'Vui lòng chọn sản phẩm'
        );
      }

      try {
        if (e.key === 'delete') {
          await Promise.all(
            selectedRowKeys.map(
              (id) =>
                deleteAdminProduct(
                  String(id)
                )
            )
          );

          messageApi.success(
            'Đã xóa sản phẩm'
          );
        }

        if (e.key === 'hide') {
          await Promise.all(
            selectedRowKeys.map(
              (id) =>
                updateAdminProduct(
                  String(id),
                  {
                    status:
                      'Draft'
                  }
                )
            )
          );

          messageApi.success(
            'Đã ẩn sản phẩm'
          );
        }

        if (
          e.key ===
          'activate'
        ) {
          await Promise.all(
            selectedRowKeys.map(
              (id) =>
                updateAdminProduct(
                  String(id),
                  {
                    status:
                      'Active'
                  }
                )
            )
          );

          messageApi.success(
            'Đã bật sản phẩm'
          );
        }

        setSelectedRowKeys([]);

        fetchData();
      } catch (error) {
        messageApi.error(
          'Lỗi thao tác hàng loạt'
        );
      }
    };

  const bulkMenuItems:
    MenuProps['items'] = [
    {
      key: 'activate',
      label:
        'Bật trạng thái'
    },

    {
      key: 'hide',
      label:
        'Ẩn sản phẩm'
    },

    {
      type: 'divider'
    },

    {
      key: 'delete',
      label: 'Xóa đã chọn',
      danger: true
    }
  ];

  // =========================
  // TABLE
  // =========================

  const columns: ColumnsType<ProductItem> =
    [
      {
        title: 'Ảnh',
        key: 'image',
        width: 90,

        render: (
          _: any,
          record
        ) => {
          const anh =
            layAnh(record);

          if (!anh) {
            return (
              <div className="w-[54px] h-[54px] rounded-xl bg-gray-100 flex items-center justify-center">
                <Package2 size={18} />
              </div>
            );
          }

          return (
            <Image
              src={anh}
              width={54}
              height={54}
              className="rounded-xl object-cover"
              preview={false}
            />
          );
        }
      },

      {
        title:
          'Tên sản phẩm',

        key: 'product',

        render: (
          _: any,
          record
        ) => (
          <div>
            <div className="font-semibold text-[15px] text-[#191c1e]">
              {record.name}
            </div>

            <div className="text-[#5b403d] text-sm mt-1">
              ID: PRD-
              {record.id}
              {' • '}
              {record.brand ||
                'No Brand'}
            </div>
          </div>
        )
      },

      {
        title: 'Danh mục',
        key: 'category',

        render: (
          _: any,
          record
        ) => (
          <Tag
            className="rounded-full px-3 py-1"
            color="processing"
          >
            {record.categories
              ?.name || '-'}
          </Tag>
        )
      },

      {
        title: 'Giá bán',
        dataIndex: 'base_price',
        key: 'base_price',

        render: (v) => (
          <span className="font-bold text-[#15803d]">
            {dinhDangTien(v)}
          </span>
        )
      },

      {
        title: 'Tồn kho',
        dataIndex: 'total_stock',
        key: 'total_stock',

        render: (
          stock: number
        ) => {
          if (stock <= 0) {
            return (
              <Tag color="red">
                Hết hàng
              </Tag>
            );
          }

          if (stock <= 10) {
            return (
              <Tag color="orange">
                Sắp hết ({stock})
              </Tag>
            );
          }

          return (
            <Tag color="green">
              Còn hàng ({stock})
            </Tag>
          );
        }
      },

      {
        title:
          'Trạng thái',

        dataIndex: 'status',
        key: 'status',

        render: (
          status,
          record
        ) => (
          <Space>
            <Switch
              checked={
                status ===
                'Active'
              }
              onChange={(
                checked
              ) =>
                handleToggleStatus(
                  record,
                  checked
                )
              }
            />

            <Tag
              color={
                status ===
                'Active'
                  ? 'green'
                  : 'default'
              }
            >
              {status}
            </Tag>
          </Space>
        )
      },

      {
        title:
          'Hành động',

        key: 'action',
        width: 130,

        render: (
          _: any,
          record
        ) => (
          <Space>
            <Button
              type="text"
              icon={
                <Edit2 size={16} />
              }
              onClick={() =>
                openEditModal(
                  record
                )
              }
            />

            <Popconfirm
              title="Xóa sản phẩm?"
              onConfirm={() =>
                handleDelete(
                  record.id
                )
              }
              okText="Xóa"
              cancelText="Hủy"
            >
              <Button
                type="text"
                danger
                icon={
                  <Trash2 size={16} />
                }
              />
            </Popconfirm>
          </Space>
        )
      }
    ];

  return (
    <div className="p-4 md:p-6 max-w-[1600px] mx-auto space-y-6">
      {contextHolder}

      {/* HEADER */}

      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#191c1e] flex items-center gap-3">
            <ShoppingBag
              size={30}
              className="text-[#af101a]"
            />
            Quản Lý Sản Phẩm
          </h1>

          <p className="text-[#5b403d] mt-2">
            Theo dõi sản phẩm, tồn kho và trạng
            thái hoạt động trong hệ thống.
          </p>
        </div>

        <Space wrap>
          <Button
            size="large"
            onClick={fetchData}
            icon={
              <RefreshCw size={16} />
            }
          >
            Làm mới
          </Button>

          <Button
            type="primary"
            size="large"
            icon={<Plus size={18} />}
            className="bg-[#af101a] hover:!bg-[#930010] border-none"
            onClick={() =>
              navigate(
                '/admin/products/new'
              )
            }
          >
            Tạo Sản Phẩm
          </Button>
        </Space>
      </div>

      {/* STATS */}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
        {/* Tổng sản phẩm - White card with Red Top Accent */}
        <div className="bg-white border border-[#e4beba] border-t-2 border-t-[#af101a] rounded-xl p-4 shadow-sm relative overflow-hidden group transition-all hover:shadow-md">
          <div className="flex justify-between items-start mb-2">
            <span className="text-[11px] font-bold text-[#5b403d] uppercase tracking-wider">
              Tổng sản phẩm
            </span>
            <div className="w-8 h-8 rounded-lg bg-[#fff2f0] flex items-center justify-center">
              <Box size={16} className="text-[#af101a]" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <h2 className="text-2xl font-black text-[#191c1e]">
              {stats.totalProducts}
            </h2>
          </div>
        </div>

        {/* Đang hoạt động - White card with Green Accent */}
        <div className="bg-white border border-[#e4beba] rounded-xl p-4 shadow-sm relative overflow-hidden group transition-all hover:shadow-md">
          <div className="flex justify-between items-start mb-2">
            <span className="text-[11px] font-bold text-[#5b403d] uppercase tracking-wider">
              Đang hoạt động
            </span>
            <div className="w-8 h-8 rounded-lg bg-[#f0fdf4] flex items-center justify-center">
              <CheckCircle size={16} className="text-[#16a34a]" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <h2 className="text-2xl font-black text-[#191c1e]">
              {stats.activeProducts}
            </h2>
          </div>
        </div>

        {/* Tổng tồn kho - White card with Blue Accent */}
        <div className="bg-white border border-[#e4beba] rounded-xl p-4 shadow-sm relative overflow-hidden group transition-all hover:shadow-md">
          <div className="flex justify-between items-start mb-2">
            <span className="text-[11px] font-bold text-[#5b403d] uppercase tracking-wider">
              Tổng tồn kho
            </span>
            <div className="w-8 h-8 rounded-lg bg-[#eff6ff] flex items-center justify-center">
              <Layers3 size={16} className="text-[#2563eb]" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <h2 className="text-2xl font-black text-[#191c1e]">
              {new Intl.NumberFormat('vi-VN').format(stats.totalStock)}
            </h2>
          </div>
        </div>

        {/* Sắp hết hàng - White card with Orange Accent */}
        <div className="bg-white border border-[#e4beba] rounded-xl p-4 shadow-sm relative overflow-hidden group transition-all hover:shadow-md">
          <div className="flex justify-between items-start mb-2">
            <span className="text-[11px] font-bold text-[#5b403d] uppercase tracking-wider">
              Sắp hết hàng
            </span>
            <div className="w-8 h-8 rounded-lg bg-[#fff7ed] flex items-center justify-center">
              <AlertTriangle size={16} className="text-[#f97316]" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <h2 className="text-2xl font-black text-[#191c1e]">
              {stats.lowStockAlerts}
            </h2>
          </div>
        </div>
      </div>

      {/* MAIN */}

      <div className="bg-white border border-[#e4beba] rounded-xl shadow-sm overflow-hidden">
        {/* FILTER */}

        <div className="p-5 border-b border-[#f1dede]">
          <div className="flex flex-wrap gap-3">
            <Input
              placeholder="Tìm ID hoặc tên sản phẩm..."
              prefix={
                <Search size={16} />
              }
              value={searchText}
              onChange={(e) =>
                setSearchText(
                  e.target.value
                )
              }
              allowClear
              size="large"
              className="max-w-md"
            />

            <Select
              size="large"
              value={
                selectedParent
              }
              onChange={(val) => {
                setSelectedParent(
                  val
                );

                setSelectedChild(
                  'Tất cả'
                );
              }}
              style={{
                width: 220
              }}
              options={
                parentCategoryOptions
              }
            />

            <Select
              size="large"
              value={
                selectedChild
              }
              onChange={
                setSelectedChild
              }
              style={{
                width: 220
              }}
              options={
                childCategoryOptions
              }
            />

            <Select
              size="large"
              value={priceRange}
              onChange={
                setPriceRange
              }
              style={{
                width: 190
              }}
              options={[
                {
                  value:
                    'Tất cả mức giá'
                },

                {
                  value:
                    'Dưới 500k'
                },

                {
                  value:
                    '500k - 1 Triệu'
                },

                {
                  value:
                    'Trên 1 Triệu'
                }
              ]}
            />

            {selectedRowKeys.length >
              0 && (
              <Dropdown
                menu={{
                  items:
                    bulkMenuItems,
                  onClick:
                    handleBulkAction
                }}
              >
                <Button
                  type="primary"
                  size="large"
                  className="bg-[#af101a]"
                >
                  Thao tác (
                  {
                    selectedRowKeys.length
                  }
                  )
                </Button>
              </Dropdown>
            )}
          </div>
        </div>

        {/* TABLE */}

        <div className="p-4">
          <Table<ProductItem>
            rowKey="id"
            columns={columns}
            dataSource={
              filteredData
            }
            loading={loading}
            rowSelection={{
              selectedRowKeys,
              onChange: (
                keys
              ) =>
                setSelectedRowKeys(
                  keys
                )
            }}
            scroll={{
              x: 1300
            }}
            pagination={{
              pageSize: 10
            }}
            locale={{
              emptyText: (
                <Empty description="Không có dữ liệu sản phẩm" />
              )
            }}
          />
        </div>
      </div>

      {/* MODAL */}

      <Modal
        open={isModalVisible}
        title={
          <div className="text-xl font-bold text-[#af101a] border-b border-[#f3dede] pb-3">
            Cập nhật sản phẩm
          </div>
        }
        onCancel={() => setIsModalVisible(false)}
        onOk={onEditModalOk}
        okText="Lưu thay đổi"
        cancelText="Hủy"
        width={1000}
        okButtonProps={{ style: { backgroundColor: '#af101a', borderColor: '#af101a' } }}
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          className="mt-4"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1">
            {/* Cột trái: Thông tin sản phẩm */}
            <div className="space-y-1">
              <Form.Item
                name="name"
                label={<span className="font-semibold text-[#5b403d]">Tên sản phẩm</span>}
                rules={[
                  {
                    required: true,
                    message: 'Nhập tên sản phẩm'
                  }
                ]}
              >
                <Input size="large" className="rounded-lg border-[#e4beba]" />
              </Form.Item>

              <div className="grid grid-cols-2 gap-4">
                <Form.Item
                  name="base_price"
                  label={<span className="font-semibold text-[#5b403d]">Giá bán (đ)</span>}
                  rules={[
                    {
                      required: true,
                      message: 'Nhập giá bán'
                    }
                  ]}
                >
                  <InputNumber
                    min={0}
                    size="large"
                    style={{ width: '100%' }}
                    className="rounded-lg border-[#e4beba]"
                  />
                </Form.Item>

                <Form.Item
                  name="brand"
                  label={<span className="font-semibold text-[#5b403d]">Thương hiệu</span>}
                >
                  <Input size="large" className="rounded-lg border-[#e4beba]" />
                </Form.Item>
              </div>

              <Form.Item
                name="parent_category_id"
                label={<span className="font-semibold text-[#5b403d]">Danh mục hàng</span>}
                rules={[
                  {
                    required: true,
                    message: 'Vui lòng chọn danh mục hàng'
                  }
                ]}
              >
                <Select
                  size="large"
                  placeholder="Chọn danh mục hàng..."
                  className="rounded-lg"
                  options={allCategories
                    .filter((c) => c.parent_id === null)
                    .map((item) => ({
                      value: item.id,
                      label: item.name
                    }))}
                  onChange={(val) => {
                    setEditingParentId(val);
                    form.setFieldValue('category_id', undefined);
                  }}
                />
              </Form.Item>

              <Form.Item
                name="category_id"
                label={<span className="font-semibold text-[#5b403d]">Danh mục sản phẩm</span>}
                rules={[
                  {
                    required: true,
                    message: 'Vui lòng chọn danh mục sản phẩm'
                  }
                ]}
              >
                <Select
                  size="large"
                  placeholder={editingParentId ? "Chọn danh mục sản phẩm..." : "Chọn danh mục hàng trước"}
                  className="rounded-lg"
                  disabled={!editingParentId}
                  options={allCategories
                    .filter((c) => c.parent_id === editingParentId)
                    .map((item) => ({
                      value: item.id,
                      label: item.name
                    }))}
                />
              </Form.Item>

              <Form.Item
                name="description"
                label={<span className="font-semibold text-[#5b403d]">Mô tả sản phẩm</span>}
              >
                <Input.TextArea
                  rows={4}
                  placeholder="Nhập mô tả sản phẩm..."
                  className="rounded-lg border-[#e4beba]"
                />
              </Form.Item>

              <Form.Item
                name="status"
                label={<span className="font-semibold text-[#5b403d]">Trạng thái kích hoạt</span>}
                valuePropName="checked"
              >
                <Switch
                  checkedChildren="Active"
                  unCheckedChildren="Draft"
                />
              </Form.Item>
            </div>

            {/* Cột phải: Hình ảnh sản phẩm */}
            <div className="border-t md:border-t-0 md:border-l border-[#f3dede] pt-4 md:pt-0 md:pl-6 space-y-4">
              <div>
                <h3 className="font-bold text-[#5b403d] mb-1">Hình ảnh sản phẩm</h3>
                <p className="text-xs text-gray-500 mb-4">
                  Quản lý hình ảnh trực tiếp. Ảnh có viền đỏ nổi bật là ảnh hiển thị chính đại diện cho sản phẩm.
                </p>
              </div>
              <div className="p-4 border border-dashed border-[#e4beba] rounded-xl bg-[#fffaf9]">
                <ProductImageUploader
                  value={editingImages}
                  onChange={setEditingImages}
                  maxImages={20}
                />
              </div>
            </div>
          </div>

          <Divider style={{ margin: '24px 0 16px 0', borderColor: '#f3dede' }}>
            <span className="text-[#af101a] font-bold flex items-center gap-2">
              <Layers3 size={18} /> Phân loại sản phẩm (Size & Màu sắc)
            </span>
          </Divider>

          <div className="p-4 border border-[#e4beba] rounded-xl bg-white space-y-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-semibold text-gray-500">
                Danh sách biến thể của sản phẩm
              </span>
              <Button
                type="dashed"
                onClick={() => {
                  const basePrice = form.getFieldValue('base_price') || 0;
                  setEditingVariants([
                    ...editingVariants,
                    {
                      key: Date.now() + Math.random(),
                      size: 'M',
                      color: 'Trắng',
                      price: basePrice,
                      stock: 10,
                      cost_price: 0
                    }
                  ]);
                }}
                icon={<Plus size={14} />}
                size="small"
              >
                Thêm phân loại
              </Button>
            </div>

            {editingVariants.length === 0 ? (
              <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Chưa có phân loại nào." />
            ) : (
              <div className="max-h-[300px] overflow-y-auto pr-1 space-y-3">
                {editingVariants.map((item, index) => (
                  <div
                    key={item.key}
                    className="flex flex-col sm:flex-row items-center gap-3 p-3 border border-[#f3dede] rounded-lg bg-[#fffcfc]"
                  >
                    <div className="w-full sm:w-1/6">
                      <label className="text-[11px] font-semibold text-[#5b403d] mb-0.5 block">Size</label>
                      <Input
                        value={item.size}
                        onChange={(e) => {
                          const updated = [...editingVariants];
                          updated[index].size = e.target.value;
                          setEditingVariants(updated);
                        }}
                        size="small"
                        placeholder="Nhập size..."
                      />
                    </div>

                    <div className="w-full sm:w-1/6">
                      <label className="text-[11px] font-semibold text-[#5b403d] mb-0.5 block">Màu sắc</label>
                      <Input
                        value={item.color}
                        onChange={(e) => {
                          const updated = [...editingVariants];
                          updated[index].color = e.target.value;
                          setEditingVariants(updated);
                        }}
                        size="small"
                        placeholder="Màu sắc..."
                      />
                    </div>

                    <div className="w-full sm:w-1/5">
                      <label className="text-[11px] font-semibold text-[#5b403d] mb-0.5 block">Giá vốn (VND)</label>
                      <InputNumber
                        value={item.cost_price || 0}
                        onChange={(val) => {
                          const updated = [...editingVariants];
                          updated[index].cost_price = val || 0;
                          setEditingVariants(updated);
                        }}
                        min={0}
                        size="small"
                        className="w-full"
                        placeholder="Giá nhập..."
                      />
                    </div>

                    <div className="w-full sm:w-1/5">
                      <label className="text-[11px] font-semibold text-[#5b403d] mb-0.5 block">Giá bán (VND)</label>
                      <InputNumber
                        value={item.price}
                        onChange={(val) => {
                          const updated = [...editingVariants];
                          updated[index].price = val || 0;
                          setEditingVariants(updated);
                        }}
                        min={0}
                        size="small"
                        className="w-full"
                        placeholder="Giá bán..."
                      />
                    </div>

                    <div className="w-full sm:w-1/6">
                      <label className="text-[11px] font-semibold text-[#5b403d] mb-0.5 block">Số lượng tồn</label>
                      <InputNumber
                        value={item.stock}
                        onChange={(val) => {
                          const updated = [...editingVariants];
                          updated[index].stock = val || 0;
                          setEditingVariants(updated);
                        }}
                        min={0}
                        size="small"
                        className="w-full"
                        placeholder="Số lượng..."
                      />
                    </div>

                    <div className="pt-4 self-end sm:self-center">
                      <Button
                        type="text"
                        danger
                        onClick={() => {
                          setEditingVariants(editingVariants.filter((v) => v.key !== item.key));
                        }}
                        icon={<Trash2 size={16} />}
                        size="small"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Form>
      </Modal>
    </div>
  );
}