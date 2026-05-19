import { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Row, Col, Typography, Button, Tag, Space, Divider, Spin, message, Radio, Card } from "antd";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ShoppingCartOutlined,
  HeartOutlined,
  ArrowLeftOutlined,
  SafetyCertificateOutlined,
  TruckOutlined,
  MinusOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import { getProductById } from "../../../services/Product/apiClient";
import { addToCartApi } from "../../../services/Cart/apiClient";
import type { Products } from "../../../services/Product/typing";
import "./ProductDetail.less";

const { Title, Text, Paragraph } = Typography;

const ProductDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [product, setProduct] = useState<Products.IRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedVariantId, setSelectedVariantId] = useState<number | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [mainImage, setMainImage] = useState("");

  const selectedVariant = useMemo(
    () => product?.product_variants?.find((v) => v.id === selectedVariantId) || null,
    [product, selectedVariantId],
  );

  // API Mutation: Add to Cart
  const addToCartMutation = useMutation({
    mutationFn: (data: { product_id: number; variant_id: number; quantity: number }) => addToCartApi(data),
    onSuccess: () => {
      message.success("Đã thêm sản phẩm vào giỏ hàng!");
      queryClient.invalidateQueries({ queryKey: ["cart"] }); // Cập nhật Header
    },
    onError: () => {
      message.error("Không thể thêm vào giỏ hàng. Vui lòng thử lại!");
    },
  });

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        setLoading(true);
        const { data: res } = await getProductById(id);
        const data = res.data as Products.IRecord;
        setProduct(data);
        setMainImage(
          data.product_images?.find((i) => i.is_main)?.image_url || data.product_images?.[0]?.image_url || "",
        );
        if (data.product_variants?.length) setSelectedVariantId(data.product_variants[0].id);
      } catch (err) {
        message.error("Không thể tải sản phẩm", err);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(price);

  const handleAddToCart = () => {
    if (!product || !selectedVariantId) {
      message.warning("Vui lòng chọn phiên bản sản phẩm");
      return;
    }
    addToCartMutation.mutate({
      product_id: product.id,
      variant_id: selectedVariantId,
      quantity,
    });
  };

  if (loading)
    return (
      <div className="product-loading">
        <Spin size="large" />
      </div>
    );
  if (!product)
    return (
      <div className="product-loading">
        <Title level={3}>Sản phẩm không tồn tại</Title>
      </div>
    );

  return (
    <div className="product-detail">
      <div className="product-detail__container">
        <Button type="text" icon={<ArrowLeftOutlined />} className="back-btn" onClick={() => navigate(-1)}>
          Quay lại
        </Button>
        <Row gutter={[40, 40]}>
          <Col xs={24} lg={13}>
            <ProductGallery
              mainImage={mainImage}
              images={product.product_images}
              setMainImage={setMainImage}
              productName={product.name}
            />
          </Col>
          <Col xs={24} lg={11}>
            <ProductInfo
              product={product}
              selectedVariant={selectedVariant}
              selectedVariantId={selectedVariantId}
              setSelectedVariantId={setSelectedVariantId}
              quantity={quantity}
              setQuantity={setQuantity}
              formatPrice={formatPrice}
              onAddToCart={handleAddToCart}
              isAdding={addToCartMutation.isPending}
            />
          </Col>
        </Row>
      </div>
    </div>
  );
};

// --- Sub-components ---

const ProductGallery = ({ mainImage, images, setMainImage, productName }) => (
  <div className="gallery">
    <div className="gallery__main">
      <img src={mainImage} alt={productName} />
    </div>
    <div className="gallery__thumbs">
      {images?.map((img) => (
        <div
          key={img.id}
          className={`gallery__thumb ${mainImage === img.image_url ? "active" : ""}`}
          onClick={() => setMainImage(img.image_url)}
        >
          <img src={img.image_url} alt="" />
        </div>
      ))}
    </div>
  </div>
);

const ProductInfo = ({
  product,
  selectedVariant,
  selectedVariantId,
  setSelectedVariantId,
  quantity,
  setQuantity,
  formatPrice,
  onAddToCart,
  isAdding,
}) => {
  const stock = selectedVariant?.stock_quantity || 0;

  return (
    <div className="info-panel">
      <Space direction="vertical" size={24} className="w-full">
        <div>
          <Tag className="product-tag">{product.categories?.name}</Tag>
          <Title className="product-title">{product.name}</Title>
          <Text className="brand-text">
            Brand: <span>{product.brand}</span>
          </Text>
        </div>
        <div>
          <div className="product-price">{formatPrice(selectedVariant?.price || product.base_price)}</div>
          <Text className={`stock ${stock > 0 ? "in-stock" : "out-stock"}`}>
            {stock > 0 ? `Còn hàng (${stock})` : "Hết hàng"}
          </Text>
        </div>
        <Divider />
        {!!product.product_variants?.length && (
          <div>
            <Title level={5}>Lựa chọn phiên bản</Title>
            <Radio.Group value={selectedVariantId} onChange={(e) => setSelectedVariantId(e.target.value)}>
              <div className="variant-list">
                {product.product_variants.map((v) => (
                  <Radio.Button key={v.id} value={v.id} className="variant-item">
                    <div className="variant-size">
                      {v.size} / {v.color}
                    </div>
                    <div className="variant-stock">{v.stock_quantity} sản phẩm</div>
                  </Radio.Button>
                ))}
              </div>
            </Radio.Group>
          </div>
        )}
        <div>
          <Title level={5}>Số lượng</Title>
          <div className="quantity-selector">
            <button className="qty-btn" onClick={() => setQuantity(Math.max(1, quantity - 1))} disabled={quantity <= 1}>
              <MinusOutlined />
            </button>
            <input
              type="text"
              className="qty-input"
              value={quantity === 0 ? "" : quantity}
              onChange={(e) => {
                const val = e.target.value;
                if (val === "") {
                  setQuantity(0);
                  return;
                }
                const num = parseInt(val);
                if (!isNaN(num)) setQuantity(Math.min(num, stock || 1));
              }}
              onBlur={() => {
                if (quantity < 1) setQuantity(1);
              }}
            />
            <button
              className="qty-btn"
              onClick={() => setQuantity(Math.min(quantity + 1, stock || 1))}
              disabled={quantity >= (stock || 1)}
            >
              <PlusOutlined />
            </button>
            <Text type="secondary" className="stock-info">
              {stock} sản phẩm có sẵn
            </Text>
          </div>
        </div>
        <div className="action-group">
          <Button
            type="primary"
            size="large"
            icon={<ShoppingCartOutlined />}
            className="add-cart-btn"
            disabled={stock <= 0}
            onClick={onAddToCart}
            loading={isAdding}
          >
            Thêm vào giỏ hàng
          </Button>
          <Button size="large" icon={<HeartOutlined />} className="wishlist-btn" />
        </div>
        <Divider />
        <div>
          <Title level={5}>Mô tả sản phẩm</Title>
          <Paragraph className="description">{product.description}</Paragraph>
        </div>
        <Row gutter={[16, 16]}>
          <ServiceCard icon={<TruckOutlined />} title="Miễn phí vận chuyển" sub="Đơn hàng trên 1 triệu" />
          <ServiceCard icon={<SafetyCertificateOutlined />} title="Cam kết chính hãng" sub="Hoàn tiền 100%" />
        </Row>
      </Space>
    </div>
  );
};

const ServiceCard = ({ icon, title, sub }) => (
  <Col xs={24} sm={12}>
    <Card className="service-card">
      <div className="service-icon">{icon}</div>
      <div>
        <div className="service-title">{title}</div>
        <div className="service-sub">{sub}</div>
      </div>
    </Card>
  </Col>
);

export default ProductDetail;
