import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Row, Col, Typography, Breadcrumb, Spin } from "antd";
import { getLowStockProducts } from "../../services/Product/apiClient";
import type { Products } from "../../services/Product/typing";
import ProductCard from "../../components/product/ProductCard";

const { Title, Text } = Typography;

const LimitedProductsPage: React.FC = () => {
  const [products, setProducts] = useState<Products.IRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    window.scrollTo(0, 0);
    const fetchLimitedProducts = async () => {
      try {
        const response = await getLowStockProducts();
        if (response.data && response.data.data) {
          setProducts(response.data.data);
        }
      } catch (error) {
        console.error("Error fetching limited products:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchLimitedProducts();
  }, []);

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "100px 0" }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div style={{ padding: "40px", maxWidth: 1200, margin: "0 auto" }}>
      <Breadcrumb style={{ marginBottom: "24px" }}>
        <Breadcrumb.Item><Link to="/">Trang chủ</Link></Breadcrumb.Item>
        <Breadcrumb.Item>Sản phẩm giới hạn</Breadcrumb.Item>
      </Breadcrumb>

      <div style={{ textAlign: "center", marginBottom: "40px" }}>
        <Title level={2}>Sản phẩm giới hạn</Title>
        <Text type="secondary" style={{ fontSize: "16px" }}>
          Nhanh tay sở hữu các sản phẩm độc đáo số lượng có hạn
        </Text>
      </div>

      <Row gutter={[24, 24]}>
        {products.map((product) => (
          <Col xs={24} sm={12} md={8} lg={6} key={product.id}>
            <ProductCard product={product} badge="LIMITED" />
          </Col>
        ))}
        {products.length === 0 && (
          <Col span={24} style={{ textAlign: "center", padding: "40px 0" }}>
            <Text type="secondary">Chưa có sản phẩm giới hạn nào.</Text>
          </Col>
        )}
      </Row>
    </div>
  );
};

export default LimitedProductsPage;
