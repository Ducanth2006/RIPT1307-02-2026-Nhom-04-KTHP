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
  ThunderboltOutlined,
} from "@ant-design/icons";
import { getProductById } from "../../../services/Product/apiClient";
import { addToCartApi } from "../../../services/Cart/apiClient";
import type { Products } from "../../../services/Product/typing";
import ProductReviews from "../../../components/product/ProductReviews";
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

  const userStr = localStorage.getItem("user");
  const userObj = userStr ? JSON.parse(userStr) : null;
  const userId = userObj?.id;

  // API Mutation: Add to Cart
  const addToCartMutation = useMutation({
    mutationFn: (data: { userId: number; variantId: number; quantity: number }) => addToCartApi(data),
    onSuccess: () => {
      message.success("Đã thêm sản phẩm vào giỏ hàng!");
      queryClient.invalidateQueries({ queryKey: ["cart", userId] }); // Cập nhật Header
    },
    onError: () => {
      message.error("Không thể thêm vào giỏ hàng. Vui lòng thử lại!");
    },
  });

  // API Mutation: Buy Now (add to cart silently then navigate)
  const buyNowMutation = useMutation({
    mutationFn: (data: { userId: number; variantId: number; quantity: number }) => addToCartApi(data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["cart", userId] });
      navigate("/cart", { state: { buyNowVariantId: variables.variantId } });
    },
    onError: () => {
      message.error("Không thể xử lý. Vui lòng thử lại!");
    },
  });

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);

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
        message.error("Không thể tải sản phẩm");
        console.error(err);
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
    const token = localStorage.getItem("accessToken");
    if (!token || !userId) {
      message.warning("Vui lòng đăng nhập để thêm vào giỏ hàng");
      navigate("/login");
      return;
    }
    addToCartMutation.mutate({
      userId,
      variantId: selectedVariantId,
      quantity,
    });
  };

  const handleBuyNow = () => {
    if (!product || !selectedVariantId) {
      message.warning("Vui lòng chọn phiên bản sản phẩm trước khi mua");
      return;
    }
    const token = localStorage.getItem("accessToken");
    if (!token || !userId) {
      message.warning("Vui lòng đăng nhập để mua hàng");
      navigate("/login");
      return;
    }
    buyNowMutation.mutate({
      userId,
      variantId: selectedVariantId,
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
        <Row gutter={[12, 12]} align="stretch" className="product-row">
          <Col xs={24} lg={10} className="product-col">
            <Card className="gallery-card">
              <ProductGallery
                mainImage={mainImage}
                images={product.product_images}
                setMainImage={setMainImage}
                productName={product.name}
              />
            </Card>
          </Col>

          <Col xs={24} lg={14} className="product-col">
            <Card className="info-card">
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
                onBuyNow={handleBuyNow}
                isBuyingNow={buyNowMutation.isPending}
              />
            </Card>
          </Col>
        </Row>
        <ProductReviews productId={product.id} />
      </div>
    </div>
  );
};

// --- Sub-components ---

interface ProductGalleryProps {
  mainImage: string;
  images?: Products.IRecord["product_images"];
  setMainImage: (url: string) => void;
  productName: string;
}

const ProductGallery = ({ mainImage, images, setMainImage, productName }: ProductGalleryProps) => (
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

interface ProductInfoProps {
  product: Products.IRecord;
  selectedVariant: Products.IVariant | null;
  selectedVariantId: number | null;
  setSelectedVariantId: (id: number | null) => void;
  quantity: number;
  setQuantity: (qty: number) => void;
  formatPrice: (price: number) => string;
  onAddToCart: () => void;
  isAdding: boolean;
  onBuyNow: () => void;
  isBuyingNow: boolean;
}

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
  onBuyNow,
  isBuyingNow,
}: ProductInfoProps) => {
  const stock = selectedVariant?.stock_quantity || 0;

  return (
    <div className="info-panel">
      <Space direction="vertical" size={24} >
        <div>
          {/* <Tag className="product-tag">{product.categories?.name}</Tag> */}
          <Title className="product-title">{product.name}</Title>
          <Text className="brand-text">
            Thương hiệu: <span>{product.brand}</span>
          </Text>
        </div>
        <div>
          <Text className="des-text">Mô tả sản phẩm: <span>{product.description}</span></Text>
          {/* <Paragraph className="description">{product.description}</Paragraph> */}
        </div>
        <div>
          <div className="product-price">{formatPrice(selectedVariant?.price || product.base_price)}</div>
          <Text className={`stock ${stock > 0 ? "in-stock" : "out-stock"}`}>
            {stock > 0 ? `Sản phẩm có sẵn (${stock})` : "Hết hàng"}
          </Text>
        </div>
        <Divider style={{ marginTop: "0px", marginBottom: "0px" }} />
        {!!product.product_variants?.length && (
          <div>
            <Title level={5}>Lựa chọn:</Title>
            <Radio.Group value={selectedVariantId} onChange={(e) => setSelectedVariantId(e.target.value)}>
              <div className="variant-list">
                {product.product_variants.map((v) => (
                  <Radio.Button key={v.id} value={v.id} className="variant-item">
                    <div className="variant-size">
                      {v.size} / {v.color}
                    </div>
                  </Radio.Button>
                ))}
              </div>
            </Radio.Group>
          </div>
        )}
        <div>
          <div className="quantity-selector">
            <Title level={5}>Số lượng: </Title>
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
          <div className="action-main-btns">
            <Button
              type="default"
              size="large"
              icon={<ShoppingCartOutlined />}
              className="add-cart-btn"
              disabled={stock <= 0}
              onClick={onAddToCart}
              loading={isAdding}
            >
              Thêm vào giỏ hàng
            </Button>
            <Button
              type="primary"
              size="large"
              className="buy-now-btn"
              disabled={stock <= 0}
              onClick={onBuyNow}
            >
              Mua ngay
            </Button>
          </div>
        </div>
        {/* <Row gutter={[16, 16]}>
          <ServiceCard icon={<TruckOutlined />} title="Miễn phí vận chuyển" sub="Đơn hàng trên 1 triệu" />
          <ServiceCard icon={<SafetyCertificateOutlined />} title="Cam kết chính hãng" sub="Hoàn tiền 100%" />
        </Row> */}
      </Space>
    </div>
  );
};

interface ServiceCardProps {
  icon: React.ReactNode;
  title: string;
  sub: string;
}

const ServiceCard = ({ icon, title, sub }: ServiceCardProps) => (
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
