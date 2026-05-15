import React from "react";
import { useNavigate } from "react-router-dom";
import { Button, Input, Select, InputNumber, Switch, Form, message, Modal } from "antd";
import { ArrowLeft, Save, UploadCloud, Image as ImageIcon, Plus } from "lucide-react";

const { TextArea } = Input;
const { confirm } = Modal;

export default function AddProduct() {
  const navigate = useNavigate();
  const [form] = Form.useForm();

  const handleDiscard = () => {
    confirm({
      title: "Discard Changes?",
      content: "Are you sure you want to discard your changes? This action cannot be undone.",
      okText: "Yes, Discard",
      okType: "danger",
      cancelText: "Cancel",
      onOk() {
        navigate("/admin/products");
      },
    });
  };

  const handleSave = () => {
    form
      .validateFields()
      .then((values) => {
        // In a real app, send values to API
        console.log("Product data:", values);
        message.loading({ content: "Saving product...", key: "save" });
        setTimeout(() => {
          message.success({ content: "Product saved successfully!", key: "save", duration: 2 });
          navigate("/admin/products");
        }, 1000);
      })
      .catch((err) => {
        message.error("Please fill all required fields correctly.", err);
      });
  };

  return (
    <Form
      form={form}
      layout="vertical"
      className="p-4 md:p-6 max-w-[1200px] mx-auto space-y-6"
      initialValues={{ status: true }}
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <Button icon={<ArrowLeft size={18} />} onClick={() => navigate("/admin/products")} />
          <div>
            <h1 className="text-3xl font-bold text-[#191c1e]">Add New Product</h1>
            <p className="text-[#5b403d] mt-1 text-sm bg-transparent">Create a new product listing in the catalog.</p>
          </div>
        </div>
        <div className="flex gap-3">
          <Button onClick={handleDiscard}>Discard</Button>
          <Button
            type="primary"
            icon={<Save size={18} />}
            onClick={handleSave}
            className="bg-[#d32f2f] hover:bg-[#ba1a20]"
          >
            Save Product
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Details */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-[#d8dadc] rounded-lg shadow-sm p-6 flex flex-col gap-4">
            <h2 className="text-lg font-semibold text-[#191c1e] mb-2 border-b border-[#eceef0] pb-2">
              General Information
            </h2>

            <div className="space-y-4">
              <Form.Item
                name="name"
                label={<span className="text-xs font-semibold text-[#5b403d]">Product Name</span>}
                rules={[{ required: true, message: "Please enter product name" }]}
                className="mb-0"
              >
                <Input placeholder="Enter product name" size="large" />
              </Form.Item>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Form.Item
                  name="sku"
                  label={<span className="text-xs font-semibold text-[#5b403d]">SKU</span>}
                  rules={[{ required: true, message: "Please enter SKU" }]}
                  className="mb-0"
                >
                  <Input placeholder="e.g. PRD-1234" size="large" className="font-mono" />
                </Form.Item>

                <Form.Item
                  name="category"
                  label={<span className="text-xs font-semibold text-[#5b403d]">Category</span>}
                  rules={[{ required: true, message: "Please select category" }]}
                  className="mb-0"
                >
                  <Select
                    placeholder="Select category"
                    size="large"
                    className="w-full"
                    options={[
                      { value: "footwear", label: "Footwear" },
                      { value: "apparel", label: "Apparel" },
                      { value: "equipment", label: "Equipment" },
                      { value: "accessories", label: "Accessories" },
                    ]}
                  />
                </Form.Item>
              </div>

              <Form.Item
                name="description"
                label={<span className="text-xs font-semibold text-[#5b403d]">Description</span>}
                className="mb-0"
              >
                <TextArea rows={4} placeholder="Product description..." />
              </Form.Item>
            </div>
          </div>

          <div className="bg-white border border-[#d8dadc] rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-[#191c1e] mb-4 border-b border-[#eceef0] pb-2">
              Pricing & Inventory
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Form.Item
                name="price"
                label={<span className="text-xs font-semibold text-[#5b403d]">Price (USD)</span>}
                rules={[{ required: true, message: "Required" }]}
                className="mb-0"
              >
                <InputNumber prefix="$" style={{ width: "100%" }} size="large" min={0} placeholder="0.00" />
              </Form.Item>

              <Form.Item
                name="cost"
                label={<span className="text-xs font-semibold text-[#5b403d]">Cost per item (USD)</span>}
                className="mb-0"
              >
                <InputNumber prefix="$" style={{ width: "100%" }} size="large" min={0} placeholder="0.00" />
              </Form.Item>

              <Form.Item
                name="stock"
                label={<span className="text-xs font-semibold text-[#5b403d]">Stock Quantity</span>}
                rules={[{ required: true, message: "Required" }]}
                className="mb-0"
              >
                <InputNumber style={{ width: "100%" }} size="large" min={0} placeholder="0" />
              </Form.Item>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="bg-white border border-[#d8dadc] rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-[#191c1e] mb-4 border-b border-[#eceef0] pb-2">Product Status</h2>
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-[#191c1e] text-sm">Active</div>
                <div className="text-xs text-[#5b403d]">Make this product visible</div>
              </div>
              <Form.Item name="status" valuePropName="checked" className="mb-0">
                <Switch />
              </Form.Item>
            </div>
          </div>

          <div className="bg-white border border-[#d8dadc] rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-[#191c1e] mb-4 border-b border-[#eceef0] pb-2">Product Media</h2>
            <div className="border-2 border-dashed border-[#d8dadc] rounded-lg p-8 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-[#f7f9fb] transition-colors">
              <div className="w-12 h-12 rounded-full bg-[#eceef0] flex items-center justify-center text-[#5b403d] mb-3">
                <UploadCloud size={24} />
              </div>
              <div className="font-medium text-[#191c1e] text-sm mb-1">Click to upload</div>
              <div className="text-xs text-[#5b403d]">SVG, PNG, JPG (max. 5MB)</div>
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
