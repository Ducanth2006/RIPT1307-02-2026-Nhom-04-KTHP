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
  Upload,
  Switch,
  message,
  Divider,
  Space,
  Row,
  Col,
  Image,
  Spin,
  Alert
} from 'antd';

import type { UploadFile } from 'antd/es/upload/interface';

import {
  ArrowLeft,
  Save,
  PackagePlus,
  UploadCloud,
  Image as ImageIcon,
  BadgeDollarSign,
  Layers3,
  Package2,
  FileText,
  CheckCircle2
} from 'lucide-react';

import axiosInstance from '../../utils/axiosConfig';
import ip from '../../utils/ip';

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

  const [imageList, setImageList] =
    useState<UploadFile[]>([]);

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

        setSubmitting(true);

        const formData =
          new FormData();

        formData.append(
          'name',
          values.name
        );

        formData.append(
          'brand',
          values.brand || ''
        );

        formData.append(
          'base_price',
          values.base_price
        );

        formData.append(
          'category_id',
          values.category_id
        );

        formData.append(
          'description',
          values.description || ''
        );

        formData.append(
          'status',
          values.status
            ? 'Active'
            : 'Draft'
        );

        formData.append(
          'stock',
          values.stock || 0
        );

        imageList.forEach((file) => {
          if (file.originFileObj) {
            formData.append(
              'images',
              file.originFileObj
            );
          }
        });

        await axiosInstance.post(
          `${ip}/admin/products`,
          formData,
          {
            headers: {
              'Content-Type':
                'multipart/form-data'
            }
          }
        );

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

              <div className="bg-white border border-[#ead0d0] rounded-3xl shadow-sm overflow-hidden">
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

                    <Col xs={24} md={12}>
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

                    <Col xs={24} md={12}>
                      <Form.Item
                        name="category_id"
                        label="Danh mục"
                        rules={[
                          {
                            required: true,
                            message:
                              'Vui lòng chọn danh mục'
                          }
                        ]}
                      >
                        <Select
                          size="large"
                          placeholder="Chọn danh mục"
                          options={categories.map(
                            (item) => ({
                              value:
                                item.id,
                              label:
                                item.name
                            })
                          )}
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

              <div className="bg-white border border-[#ead0d0] rounded-3xl shadow-sm overflow-hidden">
                <div className="px-6 py-5 border-b border-[#f3dede]">
                  <h2 className="text-xl font-bold text-[#191c1e] flex items-center gap-2">
                    <ImageIcon
                      size={22}
                      className="text-[#af101a]"
                    />
                    Hình ảnh sản phẩm
                  </h2>
                </div>

                <div className="p-6 space-y-5">
                  <Upload.Dragger
                    multiple
                    beforeUpload={() =>
                      false
                    }
                    fileList={imageList}
                    onChange={({
                      fileList
                    }) =>
                      setImageList(
                        fileList
                      )
                    }
                    listType="picture"
                    className="rounded-2xl"
                  >
                    <p className="flex justify-center mb-3">
                      <UploadCloud
                        size={42}
                        className="text-[#af101a]"
                      />
                    </p>

                    <p className="text-lg font-semibold">
                      Upload ảnh sản phẩm
                    </p>

                    <p className="text-[#666] mt-1">
                      Kéo thả ảnh hoặc nhấn để tải
                      lên
                    </p>
                  </Upload.Dragger>

                  {imageList.length >
                    0 && (
                    <div className="flex flex-wrap gap-4">
                      {imageList.map(
                        (
                          file,
                          index
                        ) => (
                          <div
                            key={
                              index
                            }
                            className="border rounded-2xl overflow-hidden"
                          >
                            <Image
                              width={
                                110
                              }
                              height={
                                110
                              }
                              className="object-cover"
                              src={URL.createObjectURL(
                                file.originFileObj as Blob
                              )}
                            />
                          </div>
                        )
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* RIGHT */}

            <div className="space-y-6">
              {/* PRICE */}

              <Card className="rounded-3xl border border-[#ead0d0] shadow-sm">
                <div className="flex items-center gap-2 mb-5">
                  <BadgeDollarSign
                    size={22}
                    className="text-[#16a34a]"
                  />

                  <h3 className="text-lg font-bold">
                    Giá & Kho hàng
                  </h3>
                </div>

                <Form.Item
                  name="base_price"
                  label="Giá bán"
                  rules={[
                    {
                      required: true,
                      message:
                        'Vui lòng nhập giá bán'
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

                <Form.Item
                  name="stock"
                  label="Số lượng tồn"
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

              <Card className="rounded-3xl border border-[#ead0d0] shadow-sm">
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

              <Card className="rounded-3xl border border-[#ead0d0] shadow-sm">
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