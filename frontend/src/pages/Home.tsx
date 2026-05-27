import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Row, Col, Typography, Carousel } from "antd";
import { LeftOutlined, RightOutlined } from "@ant-design/icons";
import ProductList from "./products/ProductList";
import NewArrivals from "./products/NewArrivals";
import LimitedProducts from "./products/LimitedProducts";
import CategoryBar from "../components/layout/CategoryBar";
import HomepageCollections from "../components/BoSuuTap/HomepageCollections";

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
      <div style={{ position: "relative", height: "680px" }}>
        <Carousel
          ref={carouselRef}
          autoplay
          autoplaySpeed={4000}
          effect="scrollx"
          speed={800}
          easing="cubic-bezier(0.25, 1, 0.5, 1)"
          infinite={true}
          dots={true}
          style={{ height: "680px" }}
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
                  height: "680px",
                  cursor: "pointer",
                  overflow: "hidden",
                  transform: "translate3d(0,0,0)", // Bắt buộc sử dụng GPU để dịch chuyển mượt mà
                  willChange: "transform"
                }}
              >
                <img
                  src={item.img}
                  alt={`Hero Banner ${idx}`}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    objectPosition: "center",
                    display: "block",
                    transform: "translateZ(0)" // Tối ưu gia tốc phần cứng cho riêng thẻ ảnh
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

      <CategoryBar />

      <NewArrivals />

      <LimitedProducts />

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
            Hãy trở thành thành viên của ELITE PERFORMANCE và nhận ngay Voucher 15%.
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
      </div>

      {/* FOOTER */}
      <footer style={{ background: "#111", color: "#ccc", padding: "80px 40px 40px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <Row gutter={[40, 40]}>
            <Col xs={24} sm={6}>
              <h4 style={{ color: "#fff", marginBottom: 20, fontSize: 18 }}>ELITE PERFORMANCE</h4>
              <p style={{ fontSize: 14, lineHeight: 1.7 }}>
                Được thiết kế cho những người không ngừng nỗ lực.
                <br />
                Thời trang cao cấp
              </p>
            </Col>
            <Col xs={24} sm={4}>
              <h4 style={{ color: "#fff", marginBottom: 20 }}>Dịch vụ:</h4>
              <p style={{ fontSize: 14, lineHeight: 2.2 }}>
                Hỗ trợ khách hàng
                <br />
                Đặt hàng
                <br />
                Đổi trả
              </p>
            </Col>
            <Col xs={24} sm={8}>
              <h4 style={{ color: "#fff", marginBottom: 20 }}>Chi nhánh:</h4>
              <p style={{ fontSize: 14, lineHeight: 2.2 }}>
                Cơ sở 1: 123 Nguyễn Trãi, Thanh Xuân, Hà Nội
                <br />
                Cơ sở 2: 456 Lê Lợi, Quận 1, TP.HCM
                <br />
                Cơ sở 3: 789 Phạm Văn Đồng, Thủ Đức, TP.HCM
              </p>
            </Col>
            <Col xs={24} sm={6}>
              <h4 style={{ color: "#fff", marginBottom: 20 }}>Liên hệ với chúng tôi:</h4>
              <div style={{ display: "flex", gap: 8 }}>
                <input
                  type="email"
                  placeholder="Nhập email..."
                  style={{
                    flex: 1,
                    height: 34,
                    padding: "14px 16px",
                    border: "none",
                    borderRadius: "4px 0 0 4px",
                    background: "#222",
                    color: "#fff",
                  }}
                />
                <Button
                  style={{
                    background: "#fff",
                    color: "#000",
                    borderRadius: "0 4px 4px 0",
                    fontWeight: 600,
                  }}
                >
                  Đăng ký
                </Button>
              </div>
            </Col>
          </Row>

          <div
            style={{
              textAlign: "center",
              marginTop: 80,
              paddingTop: 30,
              borderTop: "1px solid #333",
              fontSize: 13,
              opacity: 0.6,
            }}
          >
            © 2024 ELITE PERFORMANCE. ALL RIGHTS RESERVED.
          </div>
        </div>
      </footer>
    </>
  );
};

export default Home;
