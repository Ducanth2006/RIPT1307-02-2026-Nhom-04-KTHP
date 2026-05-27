import React, {
  useState,
  useMemo,
  useEffect
} from 'react';

import axiosInstance from '../../utils/axiosConfig';
import ip from '../../utils/ip';

import {
  Button,
  Input,
  Table,
  Tag,
  Space,
  Modal,
  Form,
  Select,
  Switch,
  message,
  Popconfirm,
  Card,
  Statistic,
  Empty
} from 'antd';

import {
  Plus,
  Search,
  Edit2,
  Trash2,
  FolderTree,
  Activity
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

const generateSlug = (
  text: string
) => {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(
      /[\u0300-\u036f]/g,
      ''
    )
    .replace(
      /[^\w\s-]/g,
      ''
    )
    .replace(
      /[\s_-]+/g,
      '-'
    )
    .replace(
      /^-+|-+$/g,
      ''
    );
};

export default function Categories() {
  // =========================
  // STATE
  // =========================

  const [categories, setCategories] =
    useState<Category[]>([]);

  const [stats, setStats] =
    useState({
      parent_categories: 0,
      child_categories: 0,
      active_items: 0
    });

  const [loading, setLoading] =
    useState(true);

  const [searchText, setSearchText] =
    useState('');

  const [
    isModalVisible,
    setIsModalVisible
  ] = useState(false);

  const [
    editingCategory,
    setEditingCategory
  ] =
    useState<Category | null>(
      null
    );

  const [form] = Form.useForm();

  // =========================
  // EFFECT
  // =========================

  useEffect(() => {
    fetchCategories();
  }, []);

  // =========================
  // COMPUTED
  // =========================

  const activeCategoriesCount =
    useMemo(() => {
      let count = 0;

      const traverse = (
        items: Category[]
      ) => {
        items.forEach(
          (item) => {
            if (
              item.status ===
              'Active'
            ) {
              count++;
            }

            if (
              item.children
            ) {
              traverse(
                item.children
              );
            }
          }
        );
      };

      traverse(categories);

      return count;
    }, [categories]);

  const parentCategoryOptions =
    useMemo(() => {
      return categories.map(
        (c) => ({
          label: c.name,
          value: c.id
        })
      );
    }, [categories]);

  // =========================
  // BUILD TREE
  // =========================

  const buildCategoryTree = (
    flatList: Category[]
  ) => {
    const listMap: Record<
      number,
      Category
    > = {};

    const rootNodes: Category[] =
      [];

    flatList.forEach(
      (item) => {
        listMap[item.id] = {
          ...item,
          children:
            undefined
        };
      }
    );

    flatList.forEach(
      (item) => {
        const node =
          listMap[item.id];

        if (
          node.parent_id &&
          listMap[
            node.parent_id
          ]
        ) {
          const parent =
            listMap[
              node.parent_id
            ];

          if (
            !parent.children
          ) {
            parent.children = [];
          }

          parent.children.push(
            node
          );
        } else {
          rootNodes.push(node);
        }
      }
    );

    return rootNodes;
  };

  // =========================
  // API
  // =========================

  const fetchCategories =
    async () => {
      setLoading(true);

      try {
        const response =
          await axiosInstance.get(
            `${ip}/admin/categories`
          );

        if (
          response.status ===
            200 &&
          response.data.data
        ) {
          setCategories(
            buildCategoryTree(
              response.data.data
            )
          );
        }

        const statsRes =
          await axiosInstance.get(
            `${ip}/admin/categories/stats`
          );

        if (
          statsRes.status ===
            200 &&
          statsRes.data.data
        ) {
          setStats(
            statsRes.data.data
          );
        }
      } catch (error: any) {
        console.log(error);

        message.error(
          error.response?.data
            ?.message ||
            'Tải danh mục thất bại'
        );
      } finally {
        setLoading(false);
      }
    };

  // =========================
  // FILTER
  // =========================

  const filteredData =
    useMemo(() => {
      let result =
        categories;

      const cloneAndFilter =
        (
          items: Category[]
        ): Category[] => {
          return items
            .map((item) => ({
              ...item
            }))
            .filter(
              (item) => {
                const match =
                  item.name
                    .toLowerCase()
                    .includes(
                      searchText.toLowerCase()
                    ) ||
                  item.slug
                    .toLowerCase()
                    .includes(
                      searchText.toLowerCase()
                    );

                if (
                  item.children
                ) {
                  item.children =
                    cloneAndFilter(
                      item.children
                    );

                  if (
                    item.children
                      .length > 0
                  ) {
                    return true;
                  }
                }

                return (
                  match ||
                  (item.children &&
                    item
                      .children
                      .length > 0)
                );
              }
            );
        };

      if (searchText) {
        result =
          cloneAndFilter(
            result
          );
      }

      return result;
    }, [
      categories,
      searchText
    ]);

  // =========================
  // ACTIONS
  // =========================

  const handleDelete =
    async (
      category: Category
    ) => {
      try {
        await axiosInstance.delete(
          `${ip}/admin/categories/${category.id}`
        );

        message.success(
          'Xóa danh mục thành công'
        );

        fetchCategories();
      } catch (error: any) {
        message.error(
          error.response?.data
            ?.message ||
            'Xóa thất bại'
        );
      }
    };

  const handleToggleStatus =
    async (
      category: Category,
      checked: boolean
    ) => {
      try {
        await axiosInstance.patch(
          `${ip}/admin/categories/${category.id}`,
          {
            status:
              checked
                ? 'Active'
                : 'Draft'
          }
        );

        message.success(
          'Cập nhật trạng thái thành công'
        );

        fetchCategories();
      } catch (error) {
        message.error(
          'Cập nhật trạng thái thất bại'
        );

        fetchCategories();
      }
    };

  // =========================
  // MODAL
  // =========================

  const openModal = (
    category?: Category
  ) => {
    if (category) {
      setEditingCategory(
        category
      );

      form.setFieldsValue({
        name: category.name,
        slug: category.slug,
        parent_id:
          category.parent_id,
        description:
          category.description,
        status:
          category.status ===
          'Active'
      });
    } else {
      setEditingCategory(
        null
      );

      form.resetFields();
    }

    setIsModalVisible(true);
  };

  const onModalOk = () => {
    form
      .validateFields()
      .then(
        async (values) => {
          message.loading({
            content:
              'Đang lưu...',
            key: 'saveCat'
          });

          const payload = {
            name: values.name,

            description:
              values.description ||
              null,

            slug:
              values.slug ||
              generateSlug(
                values.name
              ),

            parent_id:
              values.parent_id ||
              null,

            status:
              values.status
                ? 'Active'
                : 'Draft'
          };

          try {
            if (
              editingCategory
            ) {
              await axiosInstance.patch(
                `${ip}/admin/categories/${editingCategory.id}`,
                payload
              );

              message.success(
                {
                  content:
                    'Cập nhật thành công',
                  key: 'saveCat'
                }
              );
            } else {
              await axiosInstance.post(
                `${ip}/admin/categories`,
                payload
              );

              message.success(
                {
                  content:
                    'Tạo danh mục thành công',
                  key: 'saveCat'
                }
              );
            }

            setIsModalVisible(
              false
            );

            fetchCategories();
          } catch (error: any) {
            message.error({
              content:
                error.response
                  ?.data
                  ?.message ||
                'Lưu thất bại',
              key: 'saveCat'
            });
          }
        }
      );
  };

  // =========================
  // TABLE
  // =========================

  const columns: ColumnsType<Category> =
    [
      {
        title:
          'Tên danh mục',

        dataIndex: 'name',

        key: 'name',

        render: (
          text,
          record
        ) => (
          <div>
            <div className="font-semibold text-[15px] text-[#191c1e]">
              {text}
            </div>

            <div className="text-[#5b403d] text-sm mt-1">
              {record.slug}
            </div>
          </div>
        )
      },

      {
        title: 'Mô tả',

        dataIndex:
          'description',

        key: 'description',

        render: (v) =>
          v || '-'
      },

      {
        title: 'Sản phẩm',

        key: 'items',

        render: (
          _,
          record
        ) => {
          if (
            record.parent_id ===
            null
          ) {
            return (
              <Tag color="processing">
              </Tag>
            );
          }

          if (
            record.items > 0
          ) {
            return (
              <Tag color="green">
                Có sản phẩm (
                {
                  record.items
                }
                )
              </Tag>
            );
          }

          return (
            <Tag color="default">
              Chưa có sản phẩm
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

            {status ===
            'Active' ? (
              <Tag color="green">
                Active
              </Tag>
            ) : (
              <Tag>
                Draft
              </Tag>
            )}
          </Space>
        )
      },

      {
        title:
          'Ngày tạo',

        dataIndex:
          'created_at',

        key: 'created_at',

        render: (
          date
        ) => {
          if (!date)
            return '-';

          return new Date(
            date
          ).toLocaleString(
            'vi-VN',
            {
              day: '2-digit',
              month:
                '2-digit',
              year: 'numeric',
              hour: '2-digit',
              minute:
                '2-digit'
            }
          );
        }
      },

      {
        title:
          'Hành động',

        key: 'action',

        width: 120,

        render: (
          _,
          record
        ) => (
          <Space>
            <Button
              type="text"
              icon={
                <Edit2
                  size={16}
                />
              }
              onClick={() =>
                openModal(
                  record
                )
              }
            />

            <Popconfirm
              title="Xóa danh mục"
              description={`Bạn có chắc muốn xóa "${record.name}"?`}
              onConfirm={() =>
                handleDelete(
                  record
                )
              }
              okText="Xóa"
              cancelText="Hủy"
              okButtonProps={{
                danger: true
              }}
            >
              <Button
                type="text"
                danger
                icon={
                  <Trash2
                    size={16}
                  />
                }
              />
            </Popconfirm>
          </Space>
        )
      }
    ];

  // =========================
  // UI
  // =========================

  return (
    <div className="p-4 md:p-6 max-w-[1600px] mx-auto space-y-6">
      {/* HEADER */}

      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#191c1e] flex items-center gap-3">
            <FolderTree
              size={30}
              className="text-[#af101a]"
            />
            Quản Lý Danh Mục
          </h1>

          <p className="text-[#5b403d] mt-2">
            Quản lý danh mục ngành hàng và danh
            mục sản phẩm trong hệ thống.
          </p>
        </div>

        <Space wrap>
          <Button
            size="large"
            onClick={fetchCategories}
            icon={<Activity size={16} />}
          >
            Làm mới
          </Button>

          <Button
            type="primary"
            size="large"
            icon={<Plus size={18} />}
            className="bg-[#af101a] hover:!bg-[#930010] border-none"
            onClick={() => openModal()}
          >
            Tạo Danh Mục
          </Button>
        </Space>
      </div>

      {/* STATS */}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <Card className="rounded-2xl border border-[#ead0d0] shadow-sm">
          <Statistic
            title="Danh mục ngành hàng"
            value={stats.parent_categories}
            prefix={
              <FolderTree
                size={18}
                className="text-[#af101a]"
              />
            }
          />
        </Card>

        <Card className="rounded-2xl border border-[#ead0d0] shadow-sm">
          <Statistic
            title="Danh mục sản phẩm"
            value={stats.child_categories}
            prefix={
              <FolderTree
                size={18}
                className="text-[#2563eb]"
              />
            }
          />
        </Card>

        <Card className="rounded-2xl border border-[#ead0d0] shadow-sm">
          <Statistic
            title="Đang hoạt động"
            value={activeCategoriesCount}
            prefix={
              <Activity
                size={18}
                className="text-[#16a34a]"
              />
            }
            valueStyle={{
              color: '#16a34a'
            }}
          />
        </Card>
      </div>

      {/* MAIN */}

      <div className="bg-white border border-[#ead0d0] rounded-3xl shadow-sm overflow-hidden">
        {/* FILTER */}

        <div className="p-5 border-b border-[#f1dede]">
          <Input
            size="large"
            placeholder="Tìm theo tên hoặc slug..."
            prefix={<Search size={16} />}
            value={searchText}
            onChange={(e) =>
              setSearchText(e.target.value)
            }
            allowClear
            className="max-w-md"
          />
        </div>

        {/* TABLE */}

        <div className="p-4">
          <Table<Category>
            rowKey="id"
            columns={columns}
            dataSource={filteredData}
            loading={loading}
            pagination={{
              pageSize: 10
            }}
            scroll={{
              x: 1200
            }}
            locale={{
              emptyText: (
                <Empty description="Không có dữ liệu danh mục" />
              )
            }}
          />
        </div>
      </div>

      {/* MODAL */}

      <Modal
        title={
          editingCategory
            ? 'Chỉnh sửa danh mục'
            : 'Thêm danh mục mới'
        }
        open={isModalVisible}
        onOk={onModalOk}
        onCancel={() =>
          setIsModalVisible(false)
        }
        width={700}
        okText="Lưu thay đổi"
        cancelText="Hủy"
        okButtonProps={{
          className:
            'bg-[#af101a] border-none hover:!bg-[#930010]'
        }}
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            status: true
          }}
          className="mt-5"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Form.Item
              name="name"
              label="Tên danh mục"
              rules={[
                {
                  required: true,
                  message:
                    'Vui lòng nhập tên danh mục'
                }
              ]}
            >
              <Input size="large" />
            </Form.Item>

            <Form.Item
              name="parent_id"
              label="Danh mục"
            >
              <Select
                size="large"
                allowClear
                placeholder="Làm danh mục gốc"
                options={parentCategoryOptions.filter(
                  (c) =>
                    c.value !==
                    editingCategory?.id
                )}
              />
            </Form.Item>

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
          </div>

          <Form.Item
            name="description"
            label="Mô tả"
          >
            <Input.TextArea
              rows={4}
              placeholder="Nhập mô tả danh mục..."
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}