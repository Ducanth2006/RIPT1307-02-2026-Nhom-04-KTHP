import { Modal, Form, Input, Switch, Button } from "antd";

interface AddAddressFormValues {
  recipient_name: string;
  phone: string;
  address_line: string;
  city: string;
  is_default: boolean;
}

interface AddAddressModalProps {
  open: boolean;
  onCancel: () => void;
  loading: boolean;
  onSubmit: (values: AddAddressFormValues) => void;
}

const AddAddressModal = ({
  open,
  onCancel,
  loading,
  onSubmit,
}: AddAddressModalProps) => {
  const [form] = Form.useForm<AddAddressFormValues>();

  return (
    <Modal
      title="Thêm địa chỉ mới"
      open={open}
      onCancel={() => {
        form.resetFields();
        onCancel();
      }}
      footer={null}
      destroyOnClose
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={(values) => {
          onSubmit(values);
          form.resetFields();
        }}
      >
        <Form.Item
          label="Họ và tên người nhận"
          name="recipient_name"
          rules={[{ required: true, message: "Vui lòng nhập họ tên người nhận!" }]}
        >
          <Input placeholder="Nguyễn Văn A" />
        </Form.Item>

        <Form.Item
          label="Số điện thoại"
          name="phone"
          rules={[
            { required: true, message: "Vui lòng nhập số điện thoại!" },
            { pattern: /^[0-9]{10}$/, message: "Số điện thoại phải gồm 10 chữ số!" },
          ]}
        >
          <Input placeholder="0901234567" />
        </Form.Item>

        <Form.Item
          label="Địa chỉ chi tiết (Số nhà, Tên đường...)"
          name="address_line"
          rules={[{ required: true, message: "Vui lòng nhập địa chỉ chi tiết!" }]}
        >
          <Input placeholder="Ví dụ: 123 Đường Lê Lợi, Phường Bến Nghé" />
        </Form.Item>

        <Form.Item
          label="Tỉnh/Thành phố, Quận/Huyện"
          name="city"
          rules={[{ required: true, message: "Vui lòng nhập thông tin Tỉnh/Thành phố!" }]}
        >
          <Input placeholder="Ví dụ: Quận 1, TP. Hồ Chí Minh" />
        </Form.Item>

        <Form.Item label="Đặt làm địa chỉ mặc định" name="is_default" valuePropName="checked">
          <Switch />
        </Form.Item>

        <Form.Item style={{ textAlign: "right", marginBottom: 0, marginTop: 24 }}>
          <Button style={{ marginRight: 8 }} onClick={() => {
            form.resetFields();
            onCancel();
          }}>
            Hủy
          </Button>
          <Button
            type="primary"
            htmlType="submit"
            loading={loading}
            style={{ backgroundColor: "#af101a", borderColor: "#af101a" }}
          >
            Lưu & Chọn
          </Button>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default AddAddressModal;
