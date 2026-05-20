import { useState } from "react";
import { Button, Row, Col, Typography } from "antd";
import ProductList from "./products/ProductList";
import CategoryBar from "../components/layout/CategoryBar";

const { Title, Text } = Typography;

const Home = () => {
  const [genderFilter, setGenderFilter] = useState<string | undefined>(undefined);

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
      <div
        style={{
          height: "680px",
          backgroundImage: `linear-gradient(rgba(0,0,0,0.45), rgba(0,0,0,0.35)), url('/chạy.jpg')`,
          backgroundSize: "cover",
          backgroundPosition: "center 30%",
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "flex-start",
          color: "white",
          padding: "0 80px 120px 80px",
        }}
      >
        <div style={{ maxWidth: "660px" }}>
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

      <CategoryBar />

      <div id="trending-now">
        <ProductList genderFilter={genderFilter} />
      </div>

      <div style={{ padding: "0 40px 80px" }}>
        <Row gutter={24}>
          <Col xs={24} md={12}>
            <div
              style={{
                height: "380px",
                backgroundImage: `url('/gym.png')`,
                backgroundSize: "cover",
                backgroundPosition: "center",
                borderRadius: "12px",
                position: "relative",
                display: "flex",
                alignItems: "flex-end",
                padding: "40px",
                color: "#fff",
                cursor: "pointer",
              }}
            >
              <h2
                style={{
                  fontSize: "42px",
                  fontWeight: 900,
                  lineHeight: 1,
                  textShadow: "0 4px 12px rgba(0,0,0,0.7)",
                }}
              >
                RUNNING
                <br />
                ESSENTIALS
              </h2>
            </div>
          </Col>

          <Col xs={24} md={12}>
            <div
              style={{
                height: "380px",
                backgroundImage: `url('/chạy1.png')`,
                backgroundSize: "cover",
                backgroundPosition: "center",
                borderRadius: "12px",
                position: "relative",
                display: "flex",
                alignItems: "flex-end",
                padding: "40px",
                color: "#fff",
                cursor: "pointer",
              }}
            >
              <h2
                style={{
                  fontSize: "42px",
                  fontWeight: 900,
                  lineHeight: 1,
                  textShadow: "0 4px 12px rgba(0,0,0,0.7)",
                }}
              >
                TRAINING
                <br />
                GEAR
              </h2>
            </div>
          </Col>
        </Row>
      </div>

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
