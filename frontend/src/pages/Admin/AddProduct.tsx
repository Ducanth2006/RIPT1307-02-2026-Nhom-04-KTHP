import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Input, Select, InputNumber, Switch, Form, message, Modal, Space } from "antd";
import { ArrowLeft, Save, UploadCloud, Image as ImageIcon, Plus, Trash2 } from "lucide-react";
import axiosInstance from "../../utils/axiosConfig";
import ip from "../../utils/ip";
import { createAdminProduct } from "../../services/adminProductService";

const { TextArea } = Input;
const { confirm } = Modal;

export default function AddProduct() {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  
  const [allCategories, setAllCategories] = useState<any[]>([]);
  const [parentCategories, setParentCategories] = useState<{ value: number; label: string }[]>([]);
  const [availableChildCats, setAvailableChildCats] = useState<{ value: number; label: string }[]>([]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await axiosInstance.get(`${ip}/admin/categories`);
        const cats = response.data?.data || [];
        setAllCategories(cats);
        
        // Lấy danh mục cha
        const parents = cats.filter((c: any) => !c.parent_id);
        setParentCategories(
          parents.map((p: any) => ({ value: p.id, label: p.name }))
        );
      } catch (error) {
        message.error("Lỗi khi tải danh mục từ hệ thống!");
        console.error(error);
      }
    };
    fetchCategories();
  }, []);

  const handleParentCategoryChange = (parentId: number) => {
    const children = allCategories.filter((c: any) => c.parent_id === parentId);
    setAvailableChildCats(
      children.map((child: any) => ({ value: child.id, label: child.name }))
    );
    form.setFieldsValue({ category_id: undefined }); // Reset danh mục con
  };

  const handleDiscard = () => {
    confirm({
      title: "Hủy bỏ thay đổi?",
      content: "Bạn có chắc muốn hủy? Mọi thông tin đang nhập sẽ bị mất.",
      okText: "Đồng ý",
      okType: "danger",
      cancelText: "Hủy",
      onOk() {
        navigate("/admin/products");
      },
    });
  };

  const handleSave = () => {
    form
      .validateFields()
      .then(async (values) => {
        const payload = {
            name: values.name,
            category_id: values.category_id,
            base_price: Number(values.base_price || 0),
            brand: values.brand || "",
            description: values.description || "",
            status: values.status ? 'Active' : 'Draft',
            sku: values.sku || null,
            variants: (values.variants || []).map((v: any) => ({
              size: v.size || null,
              color: v.color || null,
              price: v.price ? Number(v.price) : Number(values.base_price || 0),
              cost_price: Number(v.cost_price || 0),
              stock_quantity: Number(v.stock_quantity || 0),
              sku: v.sku || null
            })),
            images: []
        };
        
        message.loading({ content: "Đang lưu sản phẩm...", key: "save" });
        try {
          await createAdminProduct(payload);
          message.success({ content: "Lưu sản phẩm thành công!", key: "save", duration: 2 });
          navigate("/admin/products");
        } catch (error: any) {
          message.error({ content: error.response?.data?.message || "Lưu sản phẩm thất bại!", key: "save" });
          console.error(error);
        }
      })
      .catch((err) => {
        message.error("Vui lòng điền đầy đủ các thông tin bắt buộc.");
      });
  };

  return (
    <Form
      form={form}
      layout="vertical"
      className="p-4 md:p-6 max-w-[1200px] mx-auto space-y-6"
      initialValues={{ status: true, variants: [{}] }}
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <Button icon={<ArrowLeft size={18} />} onClick={() => navigate("/admin/products")} />
          <div>
            <h1 className="text-3xl font-bold text-[#191c1e]">Thêm Sản Phẩm Mới</h1>
            <p className="text-[#5b403d] mt-1 text-sm bg-transparent">Tạo danh sách sản phẩm mới vào danh mục.</p>
          </div>
        </div>
        <div className="flex gap-3">
          <Button onClick={handleDiscard}>Hủy bỏ</Button>
          <Button
            type="primary"
            icon={<Save size={18} />}
            onClick={handleSave}
            className="bg-[#d32f2f] hover:bg-[#ba1a20]"
          >
            Lưu Sản Phẩm
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Details */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-[#d8dadc] rounded-lg shadow-sm p-6 flex flex-col gap-4">
            <h2 className="text-lg font-semibold text-[#191c1e] mb-2 border-b border-[#eceef0] pb-2">
              Thông Tin Chung
            </h2>

            <div className="space-y-4">
              <Form.Item
                name="name"
                label={<span className="text-xs font-semibold text-[#5b403d]">Tên sản phẩm *</span>}
                rules={[{ required: true, message: "Vui lòng nhập tên sản phẩm" }]}
                className="mb-0"
              >
                <Input placeholder="Nhập tên sản phẩm..." size="large" />
              </Form.Item>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Form.Item
                  name="parent_category"
                  label={<span className="text-xs font-semibold text-[#5b403d]">Danh mục hàng *</span>}
                  rules={[{ required: true, message: "Vui lòng chọn danh mục hàng trước" }]}
                  className="mb-0"
                >
                  <Select
                    placeholder="Chọn danh mục hàng"
                    size="large"
                    options={parentCategories}
                    onChange={handleParentCategoryChange}
                  />
                </Form.Item>

                <Form.Item
                  name="category_id"
                  label={<span className="text-xs font-semibold text-[#5b403d]">Danh mục sản phẩm *</span>}
                  rules={[{ required: true, message: "Vui lòng chọn danh mục sản phẩm" }]}
                  className="mb-0"
                >
                  <Select
                    placeholder={availableChildCats.length === 0 ? "Vui lòng chọn Danh mục hàng trước" : "Chọn danh mục con"}
                    size="large"
                    options={availableChildCats}
                    disabled={availableChildCats.length === 0}
                  />
                </Form.Item>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Form.Item
                  name="base_price"
                  label={<span className="text-xs font-semibold text-[#5b403d]">Giá cơ bản (Base Price) *</span>}
                  rules={[{ required: true, message: "Bắt buộc nhập" }]}
                  className="mb-0"
                >
                  <InputNumber style={{ width: "100%" }} size="large" min={0} placeholder="0" />
                </Form.Item>
                <Form.Item
                  name="brand"
                  label={<span className="text-xs font-semibold text-[#5b403d]">Thương hiệu</span>}
                  className="mb-0"
                >
                  <Input placeholder="VD: Nike, Adidas..." size="large" />
                </Form.Item>
                <Form.Item
                  name="sku"
                  label={<span className="text-xs font-semibold text-[#5b403d]">Mã sản phẩm (SKU gốc)</span>}
                  className="mb-0"
                >
                  <Input placeholder="Để trống tự tạo" size="large" className="font-mono" />
                </Form.Item>
              </div>

              <Form.Item
                name="description"
                label={<span className="text-xs font-semibold text-[#5b403d]">Mô tả chi tiết</span>}
                className="mb-0"
              >
                <TextArea rows={4} placeholder="Nhập mô tả sản phẩm..." />
              </Form.Item>
            </div>
          </div>

          <div className="bg-white border border-[#d8dadc] rounded-lg shadow-sm p-6">
            <div className="flex justify-between items-center mb-4 border-b border-[#eceef0] pb-2">
                <h2 className="text-lg font-semibold text-[#191c1e]">Phân Loại Hàng (Size & Color)</h2>
            </div>
            <p className="text-sm text-gray-500 mb-4">Thêm các kích cỡ và màu sắc khác nhau cho quần áo. Nếu sản phẩm chỉ có 1 loại, bạn chỉ cần điền 1 dòng.</p>

            <Form.List name="variants">
              {(fields, { add, remove }) => (
                <div className="space-y-4">
                  {fields.map(({ key, name, ...restField }) => (
                    <div key={key} className="p-4 border border-[#eceef0] rounded-lg relative bg-[#fcfcfc] transition-all hover:border-[#d8dadc]">
                      {fields.length > 1 && (
                        <Button 
                          type="text" 
                          danger 
                          icon={<Trash2 size={16} />} 
                          onClick={() => remove(name)}
                          className="absolute top-2 right-2 hover:bg-red-50"
                        />
                      )}
                      <div className="grid grid-cols-2 md:grid-cols-6 gap-3 pr-8">
                        <Form.Item
                          {...restField}
                          name={[name, 'size']}
                          label={<span className="text-[11px] font-semibold text-[#5b403d] uppercase">Size</span>}
                          className="mb-0"
                        >
                          <Input placeholder="S, M, L..." />
                        </Form.Item>
                        <Form.Item
                          {...restField}
                          name={[name, 'color']}
                          label={<span className="text-[11px] font-semibold text-[#5b403d] uppercase">Màu Sắc</span>}
                          className="mb-0"
                        >
                          <Input placeholder="Đỏ, Đen..." />
                        </Form.Item>
                        <Form.Item
                          {...restField}
                          name={[name, 'price']}
                          label={<span className="text-[11px] font-semibold text-[#5b403d] uppercase">Giá Riêng</span>}
                          className="mb-0"
                        >
                          <InputNumber className="w-full" min={0} placeholder="Trống = Giá cơ bản" />
                        </Form.Item>
                        <Form.Item
                          {...restField}
                          name={[name, 'cost_price']}
                          label={<span className="text-[11px] font-semibold text-[#5b403d] uppercase">Giá Vốn</span>}
                          className="mb-0"
                        >
                          <InputNumber className="w-full" min={0} />
                        </Form.Item>
                        <Form.Item
                          {...restField}
                          name={[name, 'stock_quantity']}
                          label={<span className="text-[11px] font-semibold text-[#5b403d] uppercase">Tồn Kho *</span>}
                          rules={[{ required: true, message: 'Nhập số' }]}
                          className="mb-0"
                        >
                          <InputNumber className="w-full" min={0} />
                        </Form.Item>
                        <Form.Item
                          {...restField}
                          name={[name, 'sku']}
                          label={<span className="text-[11px] font-semibold text-[#5b403d] uppercase">SKU Riêng</span>}
                          className="mb-0"
                        >
                          <Input placeholder="Tự tạo" className="font-mono text-xs" />
                        </Form.Item>
                      </div>
                    </div>
                  ))}
                  <Button type="dashed" onClick={() => add()} block icon={<Plus size={16} className="mx-auto" />} className="h-12 border-[#d8dadc] text-[#5b403d] hover:border-[#191c1e] hover:text-[#191c1e]">
                    Thêm một phân loại (Size/Màu)
                  </Button>
                </div>
              )}
            </Form.List>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="bg-white border border-[#d8dadc] rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-[#191c1e] mb-4 border-b border-[#eceef0] pb-2">Trạng thái</h2>
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-[#191c1e] text-sm">Hiển thị (Active)</div>
                <div className="text-xs text-[#5b403d]">Khách hàng có thể nhìn thấy sản phẩm này</div>
              </div>
              <Form.Item name="status" valuePropName="checked" className="mb-0">
                <Switch />
              </Form.Item>
            </div>
          </div>

          <div className="bg-white border border-[#d8dadc] rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-[#191c1e] mb-4 border-b border-[#eceef0] pb-2">Hình ảnh sản phẩm</h2>
            <div className="border-2 border-dashed border-[#d8dadc] rounded-lg p-8 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-[#f7f9fb] transition-colors">
              <div className="w-12 h-12 rounded-full bg-[#eceef0] flex items-center justify-center text-[#5b403d] mb-3">
                <UploadCloud size={24} />
              </div>
              <div className="font-medium text-[#191c1e] text-sm mb-1">Click để tải ảnh lên</div>
              <div className="text-xs text-[#5b403d]">SVG, PNG, JPG (tối đa 5MB)</div>
            </div>

            <div className="mt-4 flex gap-2">
              <div className="w-16 h-16 rounded border border-[#d8dadc] bg-[#f7f9fb] flex items-center justify-center text-[#8f6f6c]">
                <ImageIcon size={20} />
              </div>
              <div className="w-16 h-16 rounded border border-[#d8dadc] border-dashed flex items-center justify-center text-[#8f6f6c] cursor-pointer hover:bg-[#f7f9fb]">
                <Plus size={20} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </Form>
  );
}
