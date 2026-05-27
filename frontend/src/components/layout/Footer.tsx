import { Row, Col, Button } from "antd";

const Footer = () => {
  return (
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
          © 2026 ELITE PERFORMANCE. ALL RIGHTS RESERVED.
        </div>
      </div>
    </footer>
  );
};

export default Footer;
