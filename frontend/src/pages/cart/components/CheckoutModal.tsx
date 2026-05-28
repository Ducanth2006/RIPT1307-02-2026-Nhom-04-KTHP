import { Modal, Form, Input, Radio, Divider, Tag, Button, Typography, Popover, List, Spin } from "antd";
import { ShoppingCartOutlined, EnvironmentOutlined, DollarCircleOutlined, TagsOutlined } from "@ant-design/icons";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getVouchers } from "../../../services/client/voucher/apiClient";
import type { IAddress } from "../../../services/client/address/typing";

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
  const [isVoucherOpen, setIsVoucherOpen] = useState(false);

  const { data: voucherData, isLoading: isLoadingVouchers } = useQuery({
    queryKey: ["vouchers"],
    queryFn: () => getVouchers().then((res) => res.data),
    enabled: open, // Only fetch when modal is open
  });
  const vouchers = voucherData?.data || [];

  const currentVoucherCode = Form.useWatch("voucherCode", form);

  let discountAmount = 0;
  let finalPrice = totalPrice;
  const activeVoucher = vouchers.find(v => v.code === currentVoucherCode?.toUpperCase());

  if (activeVoucher && totalPrice >= activeVoucher.min_order_value) {
    if (activeVoucher.discount_type === "Percentage") {
      discountAmount = (totalPrice * activeVoucher.discount_value) / 100;
    } else {
      discountAmount = activeVoucher.discount_value;
    }
    if (discountAmount > activeVoucher.max_discount) {
      discountAmount = activeVoucher.max_discount;
    }
    finalPrice = Math.max(0, totalPrice - discountAmount);
  }

  const voucherContent = (
    <div style={{ width: 350, maxHeight: 400, overflowY: "auto" }}>
      {isLoadingVouchers ? (
        <div style={{ textAlign: "center", padding: "20px" }}><Spin /></div>
      ) : vouchers.length > 0 ? (
        <List
          dataSource={vouchers}
          renderItem={(item) => {
            const isEligible = totalPrice >= item.min_order_value;
            return (
              <List.Item
                style={{ cursor: isEligible ? "pointer" : "not-allowed", padding: "8px 0", borderBottom: "none" }}
                onClick={() => {
                  if (isEligible) {
                    form.setFieldsValue({ voucherCode: item.code });
                    setIsVoucherOpen(false);
                  }
                }}
              >
                <div style={{ display: "flex", width: "100%", borderRadius: "4px", border: "1px solid #e8e8e8", overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.05)", opacity: isEligible ? 1 : 0.5 }}>
                  <div style={{ backgroundColor: "#af101a", color: "#fff", width: "100px", padding: "12px 8px", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", borderRight: "2px dashed #fff" }}>
                    <Text style={{ color: "#fff", fontSize: 16, fontWeight: 800, textAlign: "center", lineHeight: 1.2 }}>
                      {item.discount_type === "Percentage" ? `${item.discount_value}%` : `-${(item.discount_value / 1000)}k`}
                    </Text>
                    <Text style={{ color: "rgba(255,255,255,0.9)", fontSize: 11, marginTop: 4, fontWeight: 500 }}>GIẢM</Text>
                  </div>
                  <div style={{ flex: 1, padding: "12px", backgroundColor: "#fff", display: "flex", flexDirection: "column", justifyContent: "space-between", position: "relative" }}>
                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <Tag color="volcano" style={{ margin: 0, fontWeight: "bold" }}>{item.code}</Tag>
                        <Text type="secondary" style={{ fontSize: 11 }}>SL: {item.quantity}</Text>
                      </div>
                      <Text type="secondary" style={{ fontSize: 12, display: "block", marginTop: 8, lineHeight: 1.4 }}>
                        Đơn tối thiểu {formatPrice(item.min_order_value)} <br /> Giảm tối đa {formatPrice(item.max_discount)}
                      </Text>
                    </div>
                    <Text type="secondary" style={{ fontSize: 11, marginTop: 8 }}>
                      HSD: {new Date(item.end_date).toLocaleDateString("vi-VN")}
                    </Text>
                    {!isEligible && (
                      <div style={{ position: "absolute", bottom: 12, right: 12 }}>
                        <Text type="danger" style={{ fontSize: 11 }}>Chưa đủ điều kiện</Text>
                      </div>
                    )}
                  </div>
                </div>
              </List.Item>
            );
          }}
        />
      ) : (
        <div style={{ textAlign: "center", padding: "20px" }}><Text type="secondary">Không có mã giảm giá khả dụng</Text></div>
      )}
    </div>
  );

  return (
    <Modal
      title={
        <span>
          <ShoppingCartOutlined style={{ marginRight: 8, color: "#af101a" }} /> Xác Nhận Đặt Hàng & Thanh Toán
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
      style={{ paddingBottom: 16 }}
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
            <EnvironmentOutlined style={{ color: "#af101a" }} /> Địa chỉ nhận hàng
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
                  <Tag color="red" style={{ borderColor: "#af101a", color: "#af101a", backgroundColor: "#fff5f2" }}>
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
              style={{ color: "#af101a", fontWeight: 500 }}
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
              style={{ backgroundColor: "#af101a", border: "none" }}
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

        <Form.Item label="Mã giảm giá / Voucher (nếu có)" style={{ marginBottom: 0 }}>
          <div style={{ display: "flex", gap: "8px" }}>
            <Form.Item name="voucherCode" style={{ flex: 1, marginBottom: 0 }}>
              <Input placeholder="Ví dụ: SUMMER20, WELCOME50" style={{ textTransform: "uppercase" }} />
            </Form.Item>
            <Popover
              content={voucherContent}
              title={<span style={{ fontWeight: "bold" }}><TagsOutlined style={{ color: "#af101a", marginRight: 6 }} /> Chọn mã giảm giá</span>}
              trigger="click"
              placement="bottomRight"
              open={isVoucherOpen}
              onOpenChange={setIsVoucherOpen}
            >
              <Button type="primary" ghost style={{ borderColor: "#af101a", color: "#af101a" }}>Chọn Voucher</Button>
            </Popover>
          </div>
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
            <Text type="secondary">Tổng tiền hàng ({selectedItemsCount} sản phẩm):</Text>
            <br />
            <Text style={{ fontSize: 14, textDecoration: discountAmount > 0 ? "line-through" : "none", color: discountAmount > 0 ? "#999" : "#333" }}>
              {formatPrice(totalPrice)}
            </Text>
            {discountAmount > 0 && (
              <>
                <br />
                <Text type="secondary">Voucher giảm giá:</Text>
                <br />
                <Text style={{ fontSize: 14, color: "#52c41a" }}>- {formatPrice(discountAmount)}</Text>
              </>
            )}
            <br />
            <Text type="secondary">Tổng thanh toán:</Text>
            <br />
            <Text style={{ fontSize: 24, fontWeight: 700, color: "#af101a" }}>{formatPrice(finalPrice)}</Text>
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
              style={{ backgroundColor: "#af101a", borderColor: "#af101a" }}
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
