import { Button, Typography } from "antd";
import { Link } from "react-router-dom";

const { Title, Text } = Typography;

const HeroBanner = () => {
  return (
    <div
      style={{
        height: "680px",
        backgroundImage: `url('https://picsum.photos/id/1005/2000/1200')`, // ảnh runner đen trắng giống design
        backgroundSize: "cover",
        backgroundPosition: "center 30%",
        position: "relative",
        display: "flex",
        alignItems: "center",
        color: "#fff",
      }}
    >
      {/* Overlay tối giống design */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "linear-gradient(to right, rgba(0,0,0,0.65) 40%, rgba(0,0,0,0.3) 100%)",
        }}
      />

      {/* Nội dung text */}
      <div
        style={{
          position: "relative",
          zIndex: 2,
          maxWidth: 1200,
          margin: "0 auto",
          padding: "0 40px",
          width: "100%",
        }}
      >
        <Title
          level={1}
          style={{
            fontSize: "78px",
            fontWeight: 900,
            lineHeight: 1,
            marginBottom: 12,
            textTransform: "uppercase",
            letterSpacing: "-2px",
          }}
        >
          Thời trang cao cấp
        </Title>

        <Text style={{ fontSize: 22, display: "block", marginBottom: 40 }}>Dẫn đầu xu hướng, dẫn đầu phong cách</Text>

        <div style={{ display: "flex", gap: 16 }}>
          <Link to="/products">
            <Button
              size="large"
              style={{
                background: "#ff4d4f",
                color: "#fff",
                border: "none",
                height: 56,
                padding: "0 48px",
                fontSize: 18,
                fontWeight: 700,
                borderRadius: 4,
              }}
            >
              Nam
            </Button>
          </Link>

          <Link to="/products">
            <Button
              size="large"
              style={{
                background: "transparent",
                color: "#fff",
                border: "2px solid #fff",
                height: 56,
                padding: "0 48px",
                fontSize: 18,
                fontWeight: 700,
                borderRadius: 4,
              }}
            >
              Nữ
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default HeroBanner;
