import { Card, Image, Button, Typography } from "antd";
import { HeartOutlined, HeartFilled } from "@ant-design/icons";
import { useState } from "react";
import { Link } from "react-router-dom";
import type { Products } from "../../services/Product/typing";

const { Text } = Typography;

interface Props {
  product: Products.IRecord;
}

const ProductCard = ({ product }: Props) => {
  const [liked, setLiked] = useState(false);

  // Lấy ảnh chính hoặc ảnh đầu tiên, nếu không có dùng placeholder
  const imageUrl =
    product.product_images?.find((img) => img.is_main)?.image_url ||
    product.product_images?.[0]?.image_url ||
    "/placeholder.jpg";

  return (
    <Card
      hoverable
      style={{ height: "100%", borderRadius: 8, overflow: "hidden" }}
      cover={
        <div style={{ position: "relative" }}>
          <Image src={imageUrl} alt={product.name} style={{ height: 280, objectFit: "cover" }} preview={false} />

          {/* Badge NEW/BEST SELLER có thể thêm logic ở đây nếu API trả về */}
          {product.status === "NEW" && (
            <div
              style={{
                position: "absolute",
                top: 12,
                left: 12,
                background: "#f50",
                color: "#fff",
                padding: "4px 10px",
                fontSize: "12px",
                fontWeight: "bold",
                borderRadius: 4,
              }}
            >
              NEW
            </div>
          )}
          {/* {product.isBestSeller && (
            <div
              style={{
                position: "absolute",
                top: 12,
                left: 12,
                background: "#faad14",
                color: "#fff",
                padding: "4px 10px",
                fontSize: "12px",
                fontWeight: "bold",
                borderRadius: 4,
              }}
            >
              BEST SELLER
            </div>
          )} */}

          <Button
            shape="circle"
            icon={liked ? <HeartFilled style={{ color: "#f50" }} /> : <HeartOutlined />}
            onClick={(e) => {
              e.stopPropagation();
              setLiked(!liked);
            }}
            style={{
              position: "absolute",
              top: 12,
              right: 12,
              background: "rgba(255,255,255,0.9)",
              border: "none",
            }}
          />
        </div>
      }
      bodyStyle={{ padding: 16 }}
    >
      <Link to={`/products/${product.id}`} style={{ textDecoration: "none", color: "inherit" }}>
        <Text type="secondary" style={{ fontSize: 12, display: "block", marginBottom: 4 }}>
          {product.brand}
        </Text>
        <Text strong style={{ fontSize: 16, display: "block", marginBottom: 6, height: 48, overflow: "hidden" }}>
          {product.name}
        </Text>
        <Text style={{ fontSize: 18, fontWeight: 700, color: "#f50" }}>
          {new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(product.base_price)}
        </Text>
      </Link>
    </Card>
  );
};

export default ProductCard;
