import React, {
  useEffect,
  useState
} from 'react';

import { useNavigate } from 'react-router-dom';

import {
  Form,
  Input,
  InputNumber,
  Button,
  Select,
  Card,
  Switch,
  message,
  Divider,
  Space,
  Row,
  Col,
  Image,
  Spin,
  Alert,
  Empty
} from 'antd';

import {
  ArrowLeft,
  Save,
  PackagePlus,
  Image as ImageIcon,
  BadgeDollarSign,
  Layers3,
  Package2,
  FileText,
  CheckCircle2,
  Trash2,
  Plus
} from 'lucide-react';

import axiosInstance from '../../utils/axiosConfig';
import ip from '../../utils/ip';
import ProductImageUploader, { ProductImage } from '../../components/ProductImageUploader';
import { createAdminProduct } from '../../services/admin/productService';

export default function AddProduct() {
  const navigate = useNavigate();

  const [form] = Form.useForm();

  const [messageApi, contextHolder] =
    message.useMessage();

  const [loading, setLoading] =
    useState(false);

  const [submitting, setSubmitting] =
    useState(false);

  const [categories, setCategories] =
    useState<any[]>([]);

  const [images, setImages] =
    useState<ProductImage[]>([]);

  const [variants, setVariants] = useState<
    { key: number; size: string; color: string; price: number; stock: number; cost_price: number }[]
  >([
    { key: 1, size: 'M', color: 'Đen', price: 0, stock: 10, cost_price: 0 }
  ]);

  const [selectedParentId, setSelectedParentId] =
    useState<number | null>(null);

  // =========================
  // FETCH CATEGORY
  // =========================

  const fetchCategories =
    async () => {
      try {
        setLoading(true);

        const response =
          await axiosInstance.get(
            `${ip}/admin/categories`
          );

        setCategories(
          response.data?.data || []
        );
      } catch (error) {
        messageApi.error(
          'Không thể tải danh mục'
        );
      } finally {
        setLoading(false);
      }
    };

  useEffect(() => {
    fetchCategories();
  }, []);

  // =========================
  // SUBMIT
  // =========================

  const handleSubmit =
    async () => {
      try {
        const values =
          await form.validateFields();

        if (variants.length === 0) {
          messageApi.warning('Vui lòng thêm ít nhất một phân loại (Size & Màu sắc)!');
          return;
        }

        setSubmitting(true);

        const mappedVariants = variants.map((v, index) => ({
          sku: `SKU-${Date.now()}-${index}`,
          size: v.size,
          color: v.color,
          price: v.price || values.base_price || 0,
          cost_price: v.cost_price || 0,
          stock_quantity: v.stock || 0
        }));

        const payload = {
          name: values.name,
          brand: values.brand || '',
          base_price: values.base_price,
          category_id: values.category_id,
          description: values.description || '',
          status: values.status ? 'Active' : 'Draft',
          variants: mappedVariants,
          images: images
        };

        await createAdminProduct(payload);

        messageApi.success(
          'Tạo sản phẩm thành công'
        );

        navigate(
          '/admin/products'
        );
      } catch (error: any) {
        messageApi.error(
          error?.response?.data
            ?.message ||
            'Tạo sản phẩm thất bại'
        );
      } finally {
        setSubmitting(false);
      }
    };

  return (
    <div className="p-4 md:p-6 max-w-[1500px] mx-auto space-y-6">
      {contextHolder}

      {/* HEADER */}

      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#191c1e] flex items-center gap-3">
            <PackagePlus
              size={30}
              className="text-[#af101a]"
            />
            Thêm Sản Phẩm
          </h1>

          <p className="text-[#5b403d] mt-2">
            Tạo mới sản phẩm, cập nhật thông tin
            và quản lý hình ảnh sản phẩm.
          </p>
        </div>

        <Space wrap>
          <Button
            size="large"
            icon={
              <ArrowLeft size={18} />
            }
            onClick={() =>
              navigate(
                '/admin/products'
              )
            }
          >
            Quay lại
          </Button>

          <Button
            type="primary"
            size="large"
            loading={submitting}
            icon={<Save size={18} />}
            className="bg-[#af101a] hover:!bg-[#930010] border-none"
            onClick={handleSubmit}
          >
            Lưu sản phẩm
          </Button>
        </Space>
      </div>

      {/* CONTENT */}

      <Spin spinning={loading}>
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            status: true
          }}
        >
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* LEFT */}

            <div className="xl:col-span-2 space-y-6">
              {/* INFO */}

              <div className="bg-white border border-[#e4beba] rounded-xl shadow-sm overflow-hidden">
                <div className="px-6 py-5 border-b border-[#f3dede]">
                  <h2 className="text-xl font-bold text-[#191c1e] flex items-center gap-2">
                    <FileText
                      size={22}
                      className="text-[#af101a]"
                    />
                    Thông tin sản phẩm
                  </h2>
                </div>

                <div className="p-6">
                  <Row gutter={[20, 0]}>
                    <Col xs={24}>
                      <Form.Item
                        name="name"
                        label="Tên sản phẩm"
                        rules={[
                          {
                            required: true,
                            message:
                              'Vui lòng nhập tên sản phẩm'
                          }
                        ]}
                      >
                        <Input
                          size="large"
                          placeholder="Nhập tên sản phẩm..."
                        />
                      </Form.Item>
                    </Col>

                    <Col xs={24} md={8}>
                      <Form.Item
                        name="brand"
                        label="Thương hiệu"
                      >
                        <Input
                          size="large"
                          placeholder="Nike, Adidas..."
                        />
                      </Form.Item>
                    </Col>

                    <Col xs={24} md={8}>
                      <Form.Item
                        name="parent_category_id"
                        label="Danh mục hàng"
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
                          options={categories
                            .filter((c) => c.parent_id === null)
                            .map((item) => ({
                              value: item.id,
                              label: item.name
                            }))}
                          onChange={(val) => {
                            setSelectedParentId(val);
                            form.setFieldValue('category_id', undefined);
                          }}
                        />
                      </Form.Item>
                    </Col>

                    <Col xs={24} md={8}>
                      <Form.Item
                        name="category_id"
                        label="Danh mục sản phẩm"
                        rules={[
                          {
                            required: true,
                            message: 'Vui lòng chọn danh mục sản phẩm'
                          }
                        ]}
                      >
                        <Select
                          size="large"
                          placeholder={selectedParentId ? "Chọn danh mục sản phẩm..." : "Chọn danh mục hàng trước"}
                          disabled={!selectedParentId}
                          options={categories
                            .filter((c) => c.parent_id === selectedParentId)
                            .map((item) => ({
                              value: item.id,
                              label: item.name
                            }))}
                        />
                      </Form.Item>
                    </Col>

                    <Col xs={24}>
                      <Form.Item
                        name="description"
                        label="Mô tả sản phẩm"
                      >
                        <Input.TextArea
                          rows={6}
                          placeholder="Nhập mô tả sản phẩm..."
                        />
                      </Form.Item>
                    </Col>
                  </Row>
                </div>
              </div>

              {/* IMAGE */}

              <div className="bg-white border border-[#e4beba] rounded-xl shadow-sm overflow-hidden">
                <div className="px-6 py-5 border-b border-[#f3dede]">
                  <h2 className="text-xl font-bold text-[#191c1e] flex items-center gap-2">
                    <ImageIcon
                      size={22}
                      className="text-[#af101a]"
                    />
                    Hình ảnh sản phẩm
                  </h2>
                </div>

                <div className="p-6">
                  <ProductImageUploader value={images} onChange={setImages} maxImages={20} />
                </div>
              </div>

              {/* PHÂN LOẠI SẢN PHẨM (VARIANTS) */}
              <div className="bg-white border border-[#e4beba] rounded-xl shadow-sm overflow-hidden">
                <div className="px-6 py-5 border-b border-[#f3dede] flex items-center justify-between">
                  <h2 className="text-xl font-bold text-[#191c1e] flex items-center gap-2">
                    <Layers3 size={22} className="text-[#af101a]" />
                    Phân loại sản phẩm (Size & Màu sắc)
                  </h2>
                  <Button
                    type="dashed"
                    onClick={() => {
                      const basePrice = form.getFieldValue('base_price') || 0;
                      setVariants([
                        ...variants,
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
                    icon={<Plus size={16} />}
                  >
                    Thêm phân loại
                  </Button>
                </div>

                <div className="p-6">
                  {variants.length === 0 ? (
                    <Empty description="Chưa có phân loại nào. Nhấp 'Thêm phân loại' để thêm." />
                  ) : (
                    <div className="space-y-4">
                      {variants.map((item, index) => (
                        <div
                          key={item.key}
                          className="flex flex-col md:flex-row items-start md:items-center gap-4 p-4 border border-[#f3dede] rounded-xl bg-[#fffbfb]"
                        >
                          <div className="w-full md:w-1/6">
                            <label className="text-xs font-semibold text-[#5b403d] mb-1 block">Size</label>
                            <Select
                              value={item.size}
                              onChange={(val) => {
                                const updated = [...variants];
                                updated[index].size = val;
                                setVariants(updated);
                              }}
                              className="w-full"
                              placeholder="Chọn size"
                              options={[
                                { value: 'S', label: 'Size S' },
                                { value: 'M', label: 'Size M' },
                                { value: 'L', label: 'Size L' },
                                { value: 'XL', label: 'Size XL' },
                                { value: 'XXL', label: 'Size XXL' },
                                { value: 'Freesize', label: 'Freesize' }
                              ]}
                            />
                          </div>

                          <div className="w-full md:w-1/6">
                            <label className="text-xs font-semibold text-[#5b403d] mb-1 block">Màu sắc</label>
                            <Input
                              value={item.color}
                              onChange={(e) => {
                                const updated = [...variants];
                                updated[index].color = e.target.value;
                                setVariants(updated);
                              }}
                              placeholder="Ví dụ: Đen, Trắng..."
                            />
                          </div>

                          <div className="w-full md:w-1/5">
                            <label className="text-xs font-semibold text-[#5b403d] mb-1 block">Giá vốn (VND)</label>
                            <InputNumber
                              value={item.cost_price || 0}
                              onChange={(val) => {
                                const updated = [...variants];
                                updated[index].cost_price = val || 0;
                                setVariants(updated);
                              }}
                              min={0}
                              className="w-full"
                              placeholder="Giá nhập..."
                            />
                          </div>

                          <div className="w-full md:w-1/5">
                            <label className="text-xs font-semibold text-[#5b403d] mb-1 block">Giá bán (VND)</label>
                            <InputNumber
                              value={item.price}
                              onChange={(val) => {
                                const updated = [...variants];
                                updated[index].price = val || 0;
                                setVariants(updated);
                              }}
                              min={0}
                              className="w-full"
                              placeholder="Nhập giá..."
                            />
                          </div>

                          <div className="w-full md:w-1/6">
                            <label className="text-xs font-semibold text-[#5b403d] mb-1 block">Số lượng tồn</label>
                            <InputNumber
                              value={item.stock}
                              onChange={(val) => {
                                const updated = [...variants];
                                updated[index].stock = val || 0;
                                setVariants(updated);
                              }}
                              min={0}
                              className="w-full"
                              placeholder="Tồn kho"
                            />
                          </div>

                          <div className="pt-5 self-end md:self-center">
                            <Button
                              type="text"
                              danger
                              onClick={() => {
                                setVariants(variants.filter((v) => v.key !== item.key));
                              }}
                              icon={<Trash2 size={18} />}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* RIGHT */}

            <div className="space-y-6">
              {/* PRICE */}

              <Card className="rounded-xl border border-[#e4beba] shadow-sm">
                <div className="flex items-center gap-2 mb-5">
                  <BadgeDollarSign
                    size={22}
                    className="text-[#16a34a]"
                  />

                  <h3 className="text-lg font-bold">
                    Giá bán sản phẩm
                  </h3>
                </div>

                <Form.Item
                  name="base_price"
                  label="Giá cơ bản"
                  rules={[
                    {
                      required: true,
                      message:
                        'Vui lòng nhập giá cơ bản'
                    }
                  ]}
                >
                  <InputNumber
                    min={0}
                    size="large"
                    style={{
                      width: '100%'
                    }}
                    placeholder="0"
                  />
                </Form.Item>
              </Card>

              {/* STATUS */}

              <Card className="rounded-xl border border-[#e4beba] shadow-sm">
                <div className="flex items-center gap-2 mb-5">
                  <CheckCircle2
                    size={22}
                    className="text-[#2563eb]"
                  />

                  <h3 className="text-lg font-bold">
                    Trạng thái
                  </h3>
                </div>

                <Form.Item
                  name="status"
                  valuePropName="checked"
                >
                  <Switch
                    checkedChildren="Active"
                    unCheckedChildren="Draft"
                  />
                </Form.Item>

                <Divider />

                <Alert
                  type="info"
                  showIcon
                  message="Sản phẩm ở trạng thái Draft sẽ không hiển thị ngoài website."
                />
              </Card>

              {/* QUICK INFO */}

              <Card className="rounded-xl border border-[#e4beba] shadow-sm">
                <div className="flex items-center gap-2 mb-5">
                  <Package2
                    size={22}
                    className="text-[#f97316]"
                  />

                  <h3 className="text-lg font-bold">
                    Lưu ý
                  </h3>
                </div>

                <div className="space-y-3 text-[#5b403d]">
                  <div>
                    • Ảnh đầu tiên sẽ là ảnh đại
                    diện sản phẩm.
                  </div>

                  <div>
                    • Nên upload ảnh kích thước
                    vuông để hiển thị đẹp hơn.
                  </div>

                  <div>
                    • Sau khi tạo có thể thêm
                    biến thể và thuộc tính.
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </Form>
      </Spin>
    </div>
  );
}