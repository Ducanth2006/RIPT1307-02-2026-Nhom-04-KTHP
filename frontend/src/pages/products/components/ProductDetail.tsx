import { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Row, Col, Typography, Button, Tag, Space, Divider, Spin, message, Radio, Card, Image } from "antd";
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
  MessageOutlined,
} from "@ant-design/icons";
import { getProductById } from "../../../services/client/product/apiClient";
import { addToCartApi } from "../../../services/client/cart/apiClient";
import type { Products } from "../../../services/client/product/typing";
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

  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);

  const selectedVariant = useMemo(
    () => product?.product_variants?.find((v) => v.id === selectedVariantId) || null,
    [product, selectedVariantId],
  );

  const uniqueColors = useMemo(() => {
    if (!product?.product_variants) return [];
    const colors = product.product_variants
      .map((v) => v.color)
      .filter((c): c is string => !!c);
    return Array.from(new Set(colors));
  }, [product]);

  const uniqueSizes = useMemo(() => {
    if (!product?.product_variants) return [];
    const sizes = product.product_variants
      .map((v) => v.size)
      .filter((s): s is string => !!s);
    return Array.from(new Set(sizes));
  }, [product]);

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
        if (data.product_variants?.length) {
          const firstVariant = data.product_variants[0];
          setSelectedVariantId(firstVariant.id);
          setSelectedColor(firstVariant.color || null);
          setSelectedSize(firstVariant.size || null);
        }
      } catch (err) {
        message.error("Không thể tải sản phẩm");
        console.error(err);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  // Tìm variant khớp với màu và size đang chọn
  useEffect(() => {
    if (!product?.product_variants) return;
    const match = product.product_variants.find((v) => {
      const colorMatch = !selectedColor || v.color === selectedColor;
      const sizeMatch = !selectedSize || v.size === selectedSize;
      return colorMatch && sizeMatch;
    });
    if (match) {
      setSelectedVariantId(match.id);
    } else {
      setSelectedVariantId(null);
    }
  }, [selectedColor, selectedSize, product]);

  // Khi chọn màu, tự động chuyển ảnh chính sang ảnh tương ứng với màu đó
  useEffect(() => {
    if (!selectedColor || !product?.product_images?.length || !uniqueColors.length) return;
    
    // Bước 1: Tìm xem có ảnh nào chứa tên màu trong URL không (bỏ dấu, viết thường)
    const normalizedColor = selectedColor.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, "");
    
    const matchedImage = product.product_images.find(img => {
      const urlLower = img.image_url.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, "");
      return urlLower.includes(normalizedColor);
    });

    if (matchedImage) {
      setMainImage(matchedImage.image_url);
    } else {
      // Bước 2: Phân bổ ảnh đều theo số lượng màu (Heuristic toán học cực thông minh)
      const colorIndex = uniqueColors.indexOf(selectedColor);
      if (colorIndex !== -1) {
        const imagesPerColor = Math.max(1, Math.floor(product.product_images.length / uniqueColors.length));
        const targetImageIndex = colorIndex * imagesPerColor;
        
        if (product.product_images[targetImageIndex]) {
          setMainImage(product.product_images[targetImageIndex].image_url);
        }
      }
    }
  }, [selectedColor, product, uniqueColors]);


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

  const handleChatWithShop = () => {
    if (!product) return;
    const token = localStorage.getItem("accessToken");
    if (!token || !userId) {
      message.warning("Vui lòng đăng nhập để chat hỗ trợ");
      navigate("/login");
      return;
    }
    
    const productInfo = {
      id: product.id,
      name: product.name,
      brand: product.brand,
      base_price: selectedVariant?.price || product.base_price,
      image_url: mainImage
    };
    sessionStorage.setItem("pending_chat_product", JSON.stringify(productInfo));
    
    const event = new CustomEvent("open_chat_widget");
    window.dispatchEvent(event);
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
                onChatWithShop={handleChatWithShop}
                selectedColor={selectedColor}
                setSelectedColor={setSelectedColor}
                selectedSize={selectedSize}
                setSelectedSize={setSelectedSize}
                uniqueColors={uniqueColors}
                uniqueSizes={uniqueSizes}
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
      <Image
        src={mainImage}
        alt={productName}
        width="100%"
        height={400}
        style={{ objectFit: "cover", display: "block" }}
        preview={{
          mask: (
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 15, fontWeight: 500 }}>
              🔍 Click để phóng to
            </div>
          ),
        }}
      />
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
  onChatWithShop: () => void;
  selectedColor: string | null;
  setSelectedColor: (color: string | null) => void;
  selectedSize: string | null;
  setSelectedSize: (size: string | null) => void;
  uniqueColors: string[];
  uniqueSizes: string[];
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
  onChatWithShop,
  selectedColor,
  setSelectedColor,
  selectedSize,
  setSelectedSize,
  uniqueColors,
  uniqueSizes,
}: ProductInfoProps) => {
  const stock = selectedVariant?.stock_quantity || 0;

  return (
    <div className="info-panel">
      <Space direction="vertical" size={24} style={{ width: "100%" }}>
        <div>
          {/* <Tag className="product-tag">{product.categories?.name}</Tag> */}
          <Title className="product-title" style={{ margin: 0 }}>{product.name}</Title>
          <Text className="brand-text" style={{ display: "block", marginTop: 8 }}>
            Thương hiệu: <span style={{ fontWeight: 600, color: "#af101a" }}>{product.brand}</span>
          </Text>
        </div>
        <div>
          <Text className="des-text" style={{ color: "#555" }}>Mô tả sản phẩm: <span>{product.description}</span></Text>
          {/* <Paragraph className="description">{product.description}</Paragraph> */}
        </div>
        <div>
          <div className="product-price" style={{ fontSize: 28, fontWeight: 700, color: "#af101a" }}>
            {formatPrice(selectedVariant?.price || product.base_price)}
          </div>
          <Text className={`stock ${stock > 0 ? "in-stock" : "out-stock"}`} style={{ display: "block", marginTop: 4 }}>
            {stock > 0 ? `Sản phẩm có sẵn (${stock})` : "Hết hàng"}
          </Text>
        </div>
        <Divider style={{ marginTop: "0px", marginBottom: "0px" }} />
        
        {/* BẢNG MÀU SẮC */}
        {uniqueColors.length > 0 && (
          <div>
            <Title level={5} style={{ fontSize: 14, color: "#666", marginBottom: 12 }}>MÀU SẮC:</Title>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
              {uniqueColors.map((color) => {
                const isSelected = selectedColor === color;
                return (
                  <button
                    key={color}
                    onClick={() => setSelectedColor(color)}
                    style={{
                      padding: "8px 16px",
                      borderRadius: "6px",
                      border: isSelected ? "2px solid #af101a" : "1px solid #d8dadc",
                      backgroundColor: isSelected ? "#af101a" : "#fff",
                      color: isSelected ? "#fff" : "#191c1e",
                      fontSize: "13px",
                      fontWeight: 600,
                      cursor: "pointer",
                      transition: "all 0.2s",
                      boxShadow: isSelected ? "0 2px 4px rgba(175,16,26,0.2)" : "none"
                    }}
                  >
                    {color}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* BẢNG KÍCH THƯỚC */}
        {uniqueSizes.length > 0 && (
          <div>
            <Title level={5} style={{ fontSize: 14, color: "#666", marginBottom: 12 }}>KÍCH THƯỚC (SIZE):</Title>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
              {uniqueSizes.map((size) => {
                const isSelected = selectedSize === size;
                // Kiểm tra xem size này có sẵn cho màu đã chọn không
                const isAvailable = product.product_variants?.some(
                  (v) => v.size === size && (!selectedColor || v.color === selectedColor) && (v.stock_quantity || 0) > 0
                );
                return (
                  <button
                    key={size}
                    onClick={() => isAvailable && setSelectedSize(size)}
                    style={{
                      width: "46px",
                      height: "46px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      borderRadius: "6px",
                      border: isSelected 
                        ? "2px solid #af101a" 
                        : !isAvailable 
                        ? "1px dashed #e4e6e8" 
                        : "1px solid #d8dadc",
                      backgroundColor: isSelected 
                        ? "#af101a" 
                        : !isAvailable 
                        ? "#fafbfc" 
                        : "#fff",
                      color: isSelected 
                        ? "#fff" 
                        : !isAvailable 
                        ? "#bbb" 
                        : "#191c1e",
                      fontSize: "14px",
                      fontWeight: 700,
                      cursor: isAvailable ? "pointer" : "not-allowed",
                      textDecoration: isAvailable ? "none" : "line-through",
                      transition: "all 0.2s",
                      boxShadow: isSelected ? "0 2px 4px rgba(175,16,26,0.2)" : "none"
                    }}
                  >
                    {size}
                  </button>
                );
              })}
            </div>
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
          <div className="action-main-btns" style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
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
            <Button
              type="default"
              size="large"
              icon={<MessageOutlined />}
              onClick={onChatWithShop}
              style={{
                borderColor: "#af101a",
                color: "#af101a",
                fontWeight: 600,
                height: "40px"
              }}
            >
              Chat với Shop
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
