import { Button, Space } from "antd";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

const categories = [
  { key: "shoes", label: "SHOES" },
  { key: "clothing", label: "CLOTHING" },
  { key: "accessories", label: "ACCESSORIES" },
  { key: "new-arrivals", label: "NEW ARRIVALS" },
  { key: "best-sellers", label: "BEST SELLERS" },
];

const CategoryBar = () => {
  const navigate = useNavigate();
  const [active, setActive] = useState("clothing");

  const handleClick = (key: string) => {
    setActive(key);
    navigate("/products");
  };

  return (
    <div
      style={{
        background: "#fff",
        borderBottom: "2px solid #111", // ← Viền đen ở dưới (độ dày 2px)
        padding: "12px 40px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
      }}
    >
      <Space size="large" wrap>
        {categories.map((cat) => (
          <Button
            key={cat.key}
            type="text"
            onClick={() => handleClick(cat.key)}
            style={{
              fontSize: 16,
              fontWeight: active === cat.key ? 700 : 600,
              color: active === cat.key ? "#211e1e" : "#312e2e",
              borderBottom: active === cat.key ? "3px solid #353333" : "none",
              borderRadius: 0,
              paddingBottom: 8,
            }}
          >
            {cat.label}
          </Button>
        ))}
      </Space>
    </div>
  );
};

export default CategoryBar;
