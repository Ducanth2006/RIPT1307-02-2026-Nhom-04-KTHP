import { Modal, Empty, List, Typography, Divider, Tag, Button } from "antd";
import { CheckOutlined } from "@ant-design/icons";
import type { IAddress } from "../../../services/Address/typing";

const { Text } = Typography;

interface AddressSelectModalProps {
  open: boolean;
  onCancel: () => void;
  addresses: IAddress[];
  selectedAddress: IAddress | null;
  onSelect: (addr: IAddress) => void;
  onOpenAddAddress: () => void;
}

const AddressSelectModal = ({
  open,
  onCancel,
  addresses,
  selectedAddress,
  onSelect,
  onOpenAddAddress,
}: AddressSelectModalProps) => {
  return (
    <Modal
      title="Địa chỉ của tôi"
      open={open}
      onCancel={onCancel}
      footer={null}
      width={550}
      destroyOnClose
    >
      <div style={{ maxHeight: 400, overflowY: "auto", marginBottom: 20 }}>
        {addresses.length === 0 ? (
          <Empty description="Chưa có địa chỉ nào được lưu." />
        ) : (
          <List
            dataSource={addresses}
            renderItem={(addr) => (
              <div
                onClick={() => {
                  onSelect(addr);
                  onCancel();
                }}
                style={{
                  padding: "16px",
                  border: "1px solid #f0f0f0",
                  borderRadius: 8,
                  marginBottom: 12,
                  cursor: "pointer",
                  backgroundColor: selectedAddress?.id === addr.id ? "#fffcfb" : "#fff",
                  borderColor: selectedAddress?.id === addr.id ? "#ee4d2d" : "#f0f0f0",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  transition: "all 0.2s",
                }}
              >
                <div style={{ flex: 1, paddingRight: 10 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                    <Text strong style={{ fontSize: 14 }}>
                      {addr.recipient_name}
                    </Text>
                    <Divider type="vertical" style={{ margin: "0 2px" }} />
                    <Text type="secondary" style={{ fontSize: 13 }}>
                      {addr.phone}
                    </Text>
                    {addr.is_default && (
                      <Tag
                        color="red"
                        style={{ borderColor: "#ee4d2d", color: "#ee4d2d", backgroundColor: "#fff5f2" }}
                      >
                        Mặc định
                      </Tag>
                    )}
                  </div>
                  <div style={{ color: "#666", fontSize: 13 }}>{addr.address_line}</div>
                  <div style={{ color: "#999", fontSize: 12 }}>{addr.city}</div>
                </div>
                {selectedAddress?.id === addr.id && <CheckOutlined style={{ color: "#ee4d2d", fontSize: 16 }} />}
              </div>
            )}
          />
        )}
      </div>
      <div style={{ textAlign: "center" }}>
        <Button
          type="primary"
          onClick={() => {
            onCancel();
            onOpenAddAddress();
          }}
          style={{ backgroundColor: "#ee4d2d", border: "none", width: "100%", height: 40 }}
        >
          + Thêm địa chỉ mới
        </Button>
      </div>
    </Modal>
  );
};

export default AddressSelectModal;
