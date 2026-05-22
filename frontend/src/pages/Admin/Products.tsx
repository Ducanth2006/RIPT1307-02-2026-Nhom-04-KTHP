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
  Card,
  Statistic,
  Empty,
  Select,
  Space,
  Alert,
  Switch,
  Popconfirm,
  Dropdown
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
  Image as ImageIcon
} from 'lucide-react';

import {
  getAdminProducts,
  getAdminProductStats,
  deleteAdminProduct,
  updateAdminProduct
} from '../../services/adminProductService';

import axiosInstance from '../../utils/axiosConfig';
import ip from '../../utils/ip';

interface ProductImage {
  is_main?: boolean;
  url: string;
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
  categories?: {
    id: number;
    name: string;
  };

  product_images?: ProductImage[];
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

    form.setFieldsValue({
      name: product.name,
      brand: product.brand,
      base_price:
        product.base_price,
      status:
        product.status ===
        'Active'
    });

    setIsModalVisible(true);
  };

  const onEditModalOk =
    async () => {
      try {
        const values =
          await form.validateFields();

        await updateAdminProduct(
          editingProduct?.id || '',
          {
            name: values.name,
            brand: values.brand,
            base_price:
              values.base_price,
            status: values.status
              ? 'Active'
              : 'Draft'
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
              <div className="w-[50px] h-[50px] rounded bg-gray-100 flex items-center justify-center">
                <Package2 size={18} />
              </div>
            );
          }

          return (
            <Image
              src={anh}
              width={50}
              height={50}
              className="rounded object-cover"
              preview={false}
            />
          );
        }
      },

      {
        title:
          'Tên Sản Phẩm',

        key: 'product',

        render: (
          _: any,
          record
        ) => (
          <div>
            <div className="font-semibold text-[15px]">
              {record.name}
            </div>

            <div className="text-gray-500 text-sm">
              ID: PRD-
              {record.id}
              {' | '}
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
        ) =>
          record.categories
            ?.name || '-'
      },

      {
        title: 'Giá bán',
        dataIndex: 'base_price',
        key: 'base_price',

        render: (v) => (
          <span className="font-semibold text-red-500">
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
                Sắp hết (
                {stock})
              </Tag>
            );
          }

          return (
            <Tag color="green">
              Còn hàng (
              {stock})
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

  // =========================
  // RENDER
  // =========================

  return (
    <div className="p-6">
      {contextHolder}

      <Card
        className="shadow-sm border-2 border-gray-300"
        title={
          <div>
            <h1 className="text-2xl font-bold">
              Quản Lý Sản Phẩm
            </h1>

            <p className="text-gray-500 text-sm mt-1">
              Theo dõi kho hàng,
              giá bán và trạng thái
              sản phẩm
            </p>
          </div>
        }
        extra={
          <Space>
            <Button
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
              onClick={() =>
                navigate(
                  '/admin/products/new'
                )
              }
            >
              Tạo Sản Phẩm
            </Button>
          </Space>
        }
      >
        <div className="space-y-5">
          {/* STATS */}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card bordered>
              <Statistic
                title="Tổng sản phẩm"
                value={
                  stats.totalProducts
                }
                prefix={
                  <Box size={18} />
                }
              />
            </Card>

            <Card bordered>
              <Statistic
                title="Sản phẩm hoạt động"
                value={
                  stats.activeProducts
                }
                prefix={
                  <CheckCircle size={18} />
                }
                valueStyle={{
                  color: '#16a34a'
                }}
              />
            </Card>

            <Card bordered>
              <Statistic
                title="Tổng tồn kho"
                value={
                  stats.totalStock
                }
                prefix={
                  <Activity size={18} />
                }
              />
            </Card>

            <Card bordered>
              <Statistic
                title="Sắp hết hàng"
                value={
                  stats.lowStockAlerts
                }
                prefix={
                  <AlertTriangle size={18} />
                }
                valueStyle={{
                  color: '#ef4444'
                }}
              />
            </Card>
          </div>

          {/* FILTER */}

          <div className="bg-white rounded-xl border p-5">
            <div className="flex flex-wrap gap-3 mb-4">
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
                className="max-w-md"
              />

              <Select
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
                value={priceRange}
                onChange={
                  setPriceRange
                }
                style={{
                  width: 180
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
                  <Button type="primary">
                    Thao tác (
                    {
                      selectedRowKeys.length
                    }
                    )
                  </Button>
                </Dropdown>
              )}
            </div>

            {/* TABLE */}

            <Table<ProductItem>
              rowKey="id"
              columns={columns}
              dataSource={
                filteredData
              }
              loading={loading}
              bordered
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
      </Card>

      {/* MODAL */}

      <Modal
        open={isModalVisible}
        title="Cập nhật sản phẩm"
        onCancel={() =>
          setIsModalVisible(false)
        }
        onOk={onEditModalOk}
        okText="Lưu thay đổi"
        cancelText="Hủy"
        width={650}
      >
        <Form
          form={form}
          layout="vertical"
        >
          <Form.Item
            name="name"
            label="Tên sản phẩm"
            rules={[
              {
                required: true,
                message:
                  'Nhập tên sản phẩm'
              }
            ]}
          >
            <Input />
          </Form.Item>

          <div className="grid grid-cols-2 gap-4">
            <Form.Item
              name="base_price"
              label="Giá bán"
              rules={[
                {
                  required: true,
                  message:
                    'Nhập giá bán'
                }
              ]}
            >
              <InputNumber
                min={0}
                style={{
                  width: '100%'
                }}
              />
            </Form.Item>

            <Form.Item
              name="brand"
              label="Thương hiệu"
            >
              <Input />
            </Form.Item>
          </div>

          <Form.Item
            name="status"
            label="Trạng thái"
            valuePropName="checked"
          >
            <Switch
              checkedChildren="Active"
              unCheckedChildren="Draft"
            />
          </Form.Item>

          <Alert
            type="info"
            showIcon
            message="Muốn chỉnh sửa ảnh hoặc biến thể nên vào trang chi tiết sản phẩm."
          />
        </Form>
      </Modal>
    </div>
  );
}