import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Row, Col, Typography, Breadcrumb, Spin } from "antd";
import { getHomepageCollections } from "../../services/client/product/apiClient";
import type { Products } from "../../services/client/product/typing";
import ProductCard from "../../components/product/ProductCard";

const { Title, Text } = Typography;

const CollectionDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [collection, setCollection] = useState<Products.ICollectionData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    window.scrollTo(0, 0);
    const fetchCollection = async () => {
      try {
        const response = await getHomepageCollections();
        if (response.data && response.data.data && id) {
          const colData = response.data.data[id];
          if (colData) {
            setCollection(colData);
          }
        }
      } catch (error) {
        console.error("Error fetching collection details:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchCollection();
  }, [id]);

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "100px 0" }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!collection) {
    return (
      <div style={{ textAlign: "center", padding: "100px 0" }}>
        <Title level={3}>Không tìm thấy bộ sưu tập</Title>
        <Link to="/">Quay lại trang chủ</Link>
      </div>
    );
  }

  return (
    <div style={{ padding: "40px", maxWidth: 1200, margin: "0 auto" }}>
      <Breadcrumb style={{ marginBottom: "4px" }}>
        <Breadcrumb.Item><Link to="/">Trang chủ</Link></Breadcrumb.Item>
        <Breadcrumb.Item>Bộ sưu tập</Breadcrumb.Item>
        <Breadcrumb.Item>{collection.title}</Breadcrumb.Item>
      </Breadcrumb>

      <div style={{ textAlign: "center", marginBottom: "30px" }}>
        <Title level={2}>{collection.title}</Title>
        <Text type="secondary" style={{ fontSize: "16px" }}>{collection.subtitle}</Text>
      </div>

      <Row gutter={[24, 24]}>
        {collection.products && collection.products.map((product) => (
          <Col xs={24} sm={12} md={8} lg={6} key={product.id}>
            <ProductCard product={product} />
          </Col>
        ))}
        {(!collection.products || collection.products.length === 0) && (
          <Col span={24} style={{ textAlign: "center", padding: "40px 0" }}>
            <Text type="secondary">Chưa có sản phẩm nào trong bộ sưu tập này.</Text>
          </Col>
        )}
      </Row>
    </div>
  );
};

export default CollectionDetail;
