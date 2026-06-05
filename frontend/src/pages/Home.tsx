import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Row, Col, Typography, Carousel } from "antd";
import {
  LeftOutlined,
  RightOutlined,
  TruckOutlined,
  RetweetOutlined,
  CustomerServiceOutlined,
  SafetyCertificateOutlined
} from "@ant-design/icons";
import ProductList from "./products/ProductList";
import NewArrivals from "./products/NewArrivals";
import BestSellingProducts from "./products/LimitedProducts";
import CategoryBar from "../components/layout/CategoryBar";
import HomepageCollections from "../components/collections/HomepageCollections";

const { Title, Text } = Typography;

const Home = () => {
  const [genderFilter, setGenderFilter] = useState<string | undefined>(undefined);
  const carouselRef = useRef<any>(null);

  const navigate = useNavigate();

  const heroImages = [
    { img: '/2.png', categoryId: 42 },
    { img: '/4.png', categoryId: 41 },
    { img: '/bgr1.png', categoryId: 42 }, //link tới danh mục tương ứng với id
    { img: '/bgr3.png', categoryId: 41 }
  ];

  const nextImage = () => carouselRef.current?.next();
  const prevImage = () => carouselRef.current?.prev();

  return (
    <>
      {/* ==================== HERO BANNER ==================== */}
      <div style={{ position: "relative" }}>
        <Carousel
          ref={carouselRef}
          autoplay
          autoplaySpeed={4000}
          effect="scrollx"
          speed={800}
          easing="cubic-bezier(0.25, 1, 0.5, 1)"
          infinite={true}
          dots={true}
        >
          {heroImages.map((item, idx) => (
            <div key={idx}>
              <div
                onClick={() => {
                  if (item.categoryId) {
                    navigate(`/products?category_id=${item.categoryId}`);
                  }
                }}
                style={{
                  position: "relative",
                  cursor: "pointer",
                  overflow: "hidden",
                }}
              >
                <img
                  src={item.img}
                  alt={`Hero Banner ${idx}`}
                  style={{
                    width: "100%",
                    height: "auto",
                    display: "block",
                  }}
                />
              </div>
            </div>
          ))}
        </Carousel>

        {/* Pure CSS Hover Styles for navigation zones to avoid React re-renders during slide transition */}
        <style>{`
          .carousel-nav-btn {
            position: absolute;
            top: 0;
            bottom: 0;
            width: 60px;
            z-index: 2;
            cursor: pointer;
            display: flex;
            align-items: center;
          }
          .carousel-nav-btn .anticon {
            color: white;
            font-size: 42px;
            opacity: 0;
            transition: opacity 0.3s ease, transform 0.3s ease;
          }
          .carousel-nav-btn:hover .anticon {
            opacity: 0.8;
            transform: scale(1.1);
          }
        `}</style>

        {/* Navigation Zones (Zero-Re-Render) */}
        <div
          onClick={prevImage}
          className="carousel-nav-btn"
          style={{
            left: 0,
            paddingLeft: "16px",
          }}
        >
          <LeftOutlined />
        </div>

        <div
          onClick={nextImage}
          className="carousel-nav-btn"
          style={{
            right: 0,
            justifyContent: "flex-end",
            paddingRight: "16px",
          }}
        >
          <RightOutlined />
        </div>
      </div>

      {/* ==================== TRUST / VALUE PROPOSITION BADGES ==================== */}
      <div style={{ background: "#fff", borderBottom: "1px solid #f0f0f0", padding: "24px 40px" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <Row gutter={[24, 24]} align="middle" justify="space-between">
            <Col xs={24} sm={12} lg={6}>
              <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                <div style={{
                  width: "56px",
                  height: "56px",
                  borderRadius: "12px",
                  background: "#f8f9fa",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "24px",
                  color: "#af101a",
                  flexShrink: 0
                }}>
                  <TruckOutlined />
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: "16px", color: "#111", lineHeight: 1.2 }}>Giao Hàng Miễn Phí</div>
                  <div style={{ fontSize: "13px", color: "#777", marginTop: "4px" }}>Cho đơn hàng từ 1.000.000đ</div>
                </div>
              </div>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                <div style={{
                  width: "56px",
                  height: "56px",
                  borderRadius: "12px",
                  background: "#f8f9fa",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "24px",
                  color: "#af101a",
                  flexShrink: 0
                }}>
                  <RetweetOutlined />
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: "16px", color: "#111", lineHeight: 1.2 }}>30 Ngày Đổi Trả</div>
                  <div style={{ fontSize: "13px", color: "#777", marginTop: "4px" }}>Bảo hành đổi trả dễ dàng</div>
                </div>
              </div>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                <div style={{
                  width: "56px",
                  height: "56px",
                  borderRadius: "12px",
                  background: "#f8f9fa",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "24px",
                  color: "#af101a",
                  flexShrink: 0
                }}>
                  <CustomerServiceOutlined />
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: "16px", color: "#111", lineHeight: 1.2 }}>Hỗ Trợ Tận Tâm</div>
                  <div style={{ fontSize: "13px", color: "#777", marginTop: "4px" }}>Tư vấn viên trực tuyến 24/7</div>
                </div>
              </div>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                <div style={{
                  width: "56px",
                  height: "56px",
                  borderRadius: "12px",
                  background: "#f8f9fa",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "24px",
                  color: "#af101a",
                  flexShrink: 0
                }}>
                  <SafetyCertificateOutlined />
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: "16px", color: "#111", lineHeight: 1.2 }}>100% Chính Hãng</div>
                  <div style={{ fontSize: "13px", color: "#777", marginTop: "4px" }}>Hoàn tiền nếu phát hiện hàng giả</div>
                </div>
              </div>
            </Col>
          </Row>
        </div>
      </div>

      <CategoryBar />

      <BestSellingProducts />

      <NewArrivals />

      <div id="trending-now">
        <ProductList genderFilter={genderFilter} />
      </div>

      <HomepageCollections />



      <div
        style={{
          background: "#000",
          color: "#fff",
          padding: "100px 40px 80px",
        }}
      >
        <div style={{ maxWidth: 1200, margin: "0 auto", textAlign: "center" }}>
          <Title level={2} style={{ color: "#fff", marginBottom: 4 }}>
            Đăng Ký Ngay &amp; Nhận Voucher 15%
          </Title>
          <Text
            style={{
              fontSize: 18,
              display: "block",
              marginBottom: 4,
              maxWidth: 600,
              marginLeft: "auto",
              marginRight: "auto",
            }}
          >
            Hãy trở thành thành viên của SportStride và nhận ngay Voucher 15%.
          </Text>
          <Button
            size="large"
            style={{
              backgroundColor: "#af101a",
              color: "#fff",
              height: 56,
              padding: "0 48px",
              fontSize: 18,
              fontWeight: 700,
              border: "none",
            }}
          >
            Đăng Ký Ngay
          </Button>
        </div>
      </div>    </>
  );
};

export default Home;
