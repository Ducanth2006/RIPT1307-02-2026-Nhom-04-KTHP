import { Modal, Form, Input, Radio, Divider, Tag, Button, Typography } from "antd";
import { ShoppingCartOutlined, EnvironmentOutlined, DollarCircleOutlined } from "@ant-design/icons";
import type { IAddress } from "../../../services/Address/typing";

const { Text } = Typography;
const formatPrice = (p: number) => Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(p);

interface CheckoutFormValues {
  paymentMethod: string;
  voucherCode?: string;
}

interface CheckoutModalProps {
  open: boolean;
  onCancel: () => void;
  selectedAddress: IAddress | null;
  onOpenAddressSelect: () => void;
  onOpenAddAddress: () => void;
  selectedItemsCount: number;
  totalPrice: number;
  loading: boolean;
  onSubmit: (values: CheckoutFormValues) => void;
}

const CheckoutModal = ({
  open,
  onCancel,
  selectedAddress,
  onOpenAddressSelect,
  onOpenAddAddress,
  selectedItemsCount,
  totalPrice,
  loading,
  onSubmit,
}: CheckoutModalProps) => {
  const [form] = Form.useForm<CheckoutFormValues>();

  return (
    <Modal
      title={
        <span>
          <ShoppingCartOutlined style={{ marginRight: 8, color: "#ee4d2d" }} /> Xác Nhận Đặt Hàng & Thanh Toán
        </span>
      }
      open={open}
      onCancel={() => {
        form.resetFields();
        onCancel();
      }}
      footer={null}
      destroyOnClose
      width={1000}
    >
      <div style={{ margin: "16px 0" }}>
        <Text type="secondary">
          Vui lòng hoàn tất thông tin để đặt hàng.
        </Text>
      </div>
      <Divider />
      <Form
        form={form}
        layout="vertical"
        onFinish={(values) => {
          onSubmit(values);
          form.resetFields();
        }}
        initialValues={{ paymentMethod: "COD" }}
      >
        <div style={{ marginBottom: 16 }}>
          <Text strong style={{ fontSize: 15, display: "flex", alignItems: "center", gap: 6 }}>
            <EnvironmentOutlined style={{ color: "#ee4d2d" }} /> Địa chỉ nhận hàng
          </Text>
        </div>

        {selectedAddress ? (
          <div
            style={{
              padding: "16px",
              border: "1px solid #f0f0f0",
              borderRadius: 8,
              backgroundColor: "#fafafa",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 20,
            }}
          >
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                <Text strong style={{ fontSize: 15 }}>
                  {selectedAddress.recipient_name}
                </Text>
                <Divider type="vertical" style={{ margin: "0 4px" }} />
                <Text strong>{selectedAddress.phone}</Text>
                {selectedAddress.is_default && (
                  <Tag color="red" style={{ borderColor: "#ee4d2d", color: "#ee4d2d", backgroundColor: "#fff5f2" }}>
                    Mặc định
                  </Tag>
                )}
              </div>
              <div style={{ color: "#555", fontSize: 14 }}>
                {selectedAddress.address_line}, {selectedAddress.city}
              </div>
            </div>
            <Button
              type="link"
              onClick={onOpenAddressSelect}
              style={{ color: "#ee4d2d", fontWeight: 500 }}
            >
              Thay đổi
            </Button>
          </div>
        ) : (
          <div
            style={{
              padding: "24px",
              border: "1px dashed #d9d9d9",
              borderRadius: 8,
              textAlign: "center",
              marginBottom: 20,
            }}
          >
            <Text type="secondary" style={{ display: "block", marginBottom: 12 }}>
              Bạn chưa chọn hoặc chưa có địa chỉ nhận hàng nào.
            </Text>
            <Button
              type="primary"
              onClick={onOpenAddAddress}
              style={{ backgroundColor: "#ee4d2d", border: "none" }}
            >
              + Thêm địa chỉ mới
            </Button>
          </div>
        )}

        <Divider />

        <div style={{ marginBottom: 16 }}>
          <Text strong style={{ fontSize: 15, display: "flex", alignItems: "center", gap: 6 }}>
            <DollarCircleOutlined style={{ color: "#52c41a" }} /> Phương Thức Thanh Toán
          </Text>
        </div>
        <Form.Item name="paymentMethod">
          <Radio.Group style={{ width: "100%" }}>
            <Radio value="COD" style={{ display: "block", marginBottom: 12 }}>
              Thanh toán khi nhận hàng (COD)
            </Radio>
            <Radio value="Banking" style={{ display: "block" }}>
              Chuyển khoản ngân hàng (Qua thẻ ngân hàng/Ví điện tử)
            </Radio>
          </Radio.Group>
        </Form.Item>

        <Divider />

        <Form.Item label="Mã giảm giá / Voucher (nếu có)" name="voucherCode">
          <Input placeholder="Ví dụ: SUMMER20, WELCOME50" style={{ textTransform: "uppercase" }} />
        </Form.Item>

        <div
          style={{
            marginTop: 24,
            padding: "16px",
            backgroundColor: "#fafafa",
            borderRadius: 8,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            <Text type="secondary">Tổng số tiền cần thanh toán ({selectedItemsCount} sản phẩm):</Text>
            <br />
            <Text style={{ fontSize: 22, fontWeight: 600, color: "#ee4d2d" }}>{formatPrice(totalPrice)}</Text>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <Button onClick={() => {
              form.resetFields();
              onCancel();
            }}>
              Quay lại
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              style={{ backgroundColor: "#ee4d2d", borderColor: "#ee4d2d" }}
            >
              Đặt Hàng Ngay
            </Button>
          </div>
        </div>
      </Form>
    </Modal>
  );
};

export default CheckoutModal;
