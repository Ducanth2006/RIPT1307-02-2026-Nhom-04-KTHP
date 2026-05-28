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
  const [hoverLeft, setHoverLeft] = useState(false);
  const [hoverRight, setHoverRight] = useState(false);
  const carouselRef = useRef<any>(null);

  const navigate = useNavigate();

  const heroImages = [
    { img: '/chạy.jpg', categoryId: null },
    { img: '/bgr1.png', categoryId: 42 },    // Link tới category 
    { img: '/bgr3.png', categoryId: 41 }
  ];

  const nextImage = () => carouselRef.current?.next();
  const prevImage = () => carouselRef.current?.prev();

  const handleShopMen = () => {
    setGenderFilter("men");
    document.getElementById("trending-now")?.scrollIntoView({ behavior: "smooth" });
  };

  const handleShopWomen = () => {
    setGenderFilter("women");
    document.getElementById("trending-now")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <>
      {/* ==================== HERO BANNER ==================== */}
      <div style={{ position: "relative", height: "680px" }}>
        <Carousel
          ref={carouselRef}
          autoplay
          autoplaySpeed={3000}
          effect="scrollx"
          dots={true}
          style={{ height: "680px" }}
        >
          {heroImages.map((item, idx) => (
            <div key={idx}>
              <div
                onClick={() => {
                  if (idx !== 0 && item.categoryId) {
                    navigate(`/products?category_id=${item.categoryId}`);
                  }
                }}
                style={{
                  position: "relative",
                  height: "680px",
                  backgroundImage: `linear-gradient(rgba(0,0,0,0.45), rgba(0,0,0,0.35)), url('${item.img}')`,
                  backgroundSize: "100% 100%",
                  backgroundRepeat: "no-repeat",
                  cursor: idx === 0 ? "default" : "pointer"
                }}
              >
                {/* Text Content Overlay (only on first slide) */}
                {idx === 0 && (
                  <div
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      display: "flex",
                      alignItems: "flex-end",
                      justifyContent: "flex-start",
                      color: "white",
                      padding: "0 80px 120px 80px",
                    }}
                  >
                    <div style={{ maxWidth: "660px", zIndex: 1 }}>
                      <h1
                        style={{
                          fontSize: "82px",
                          fontWeight: 900,
                          lineHeight: 1.05,
                          marginBottom: "16px",
                          letterSpacing: "-4px",
                          textTransform: "uppercase",
                        }}
                      >
                        Thời trang cao cấp
                      </h1>
                      <p style={{ fontSize: "24px", marginBottom: "52px", opacity: 0.98 }}>Dẫn đầu xu hướng, dẫn đầu phong cách</p>

                      <div style={{ display: "flex", gap: "20px" }}>
                        <Button
                          size="large"
                          onClick={handleShopMen}
                          style={{
                            height: 62,
                            padding: "0 56px",
                            fontSize: "18px",
                            fontWeight: 700,
                            backgroundColor: "#af101a",
                            border: "none",
                            borderRadius: "8px",
                            color: "#fff",
                          }}
                        >
                          Nam
                        </Button>

                        <Button
                          size="large"
                          onClick={handleShopWomen}
                          style={{
                            height: 62,
                            padding: "0 56px",
                            fontSize: "18px",
                            fontWeight: 700,
                            backgroundColor: "#000",
                            color: "#fff",
                            border: "2px solid #fff",
                            borderRadius: "8px",
                          }}
                        >
                          Nữ
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </Carousel>

        {/* Navigation Zones */}
        <div
          onClick={prevImage}
          onMouseEnter={() => setHoverLeft(true)}
          onMouseLeave={() => setHoverLeft(false)}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            bottom: 0,
            width: "50px",
            zIndex: 2,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            paddingLeft: "16px",
          }}
        >
          <LeftOutlined
            style={{
              color: "white",
              fontSize: "42px",
              opacity: hoverLeft ? 0.8 : 0,
              transition: "opacity 0.3s ease",
            }}
          />
        </div>

        <div
          onClick={nextImage}
          onMouseEnter={() => setHoverRight(true)}
          onMouseLeave={() => setHoverRight(false)}
          style={{
            position: "absolute",
            top: 0,
            right: 0,
            bottom: 0,
            width: "50px",
            zIndex: 2,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
            paddingRight: "16px",
          }}
        >
          <RightOutlined
            style={{
              color: "white",
              fontSize: "42px",
              opacity: hoverRight ? 0.8 : 0,
              transition: "opacity 0.3s ease",
            }}
          />
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
      </div>    </>
  );
};

export default Home;
