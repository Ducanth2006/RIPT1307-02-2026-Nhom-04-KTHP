import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Row, Col, Typography, Button, Rate, Avatar, List, Pagination, Spin, Card, Space, Empty } from "antd";
import { ArrowLeftOutlined, UserOutlined } from "@ant-design/icons";
import { getProductById } from "../../services/client/product/apiClient";
import { getProductReviewsApi } from "../../services/client/review/apiClient";
import type { Products } from "../../services/client/product/typing";
import type { IReview } from "../../services/client/review/typing";

const { Title, Text, Paragraph } = Typography;

export default function ProductReviewsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [product, setProduct] = useState<Products.IRecord | null>(null);
  const [reviews, setReviews] = useState<IReview[]>([]);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [loadingProduct, setLoadingProduct] = useState(true);
  const [loadingReviews, setLoadingReviews] = useState(true);
  const limit = 10;

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        setLoadingProduct(true);
        const { data: res } = await getProductById(id);
        setProduct(res.data);
      } catch (err) {
        console.error("Failed to load product details", err);
      } finally {
        setLoadingProduct(false);
      }
    })();
  }, [id]);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        setLoadingReviews(true);
        const { data: res } = await getProductReviewsApi(id, { page: currentPage, limit });
        setReviews(res.data || []);
        setTotal(res.total || 0);
      } catch (err) {
        console.error("Failed to load reviews", err);
      } finally {
        setLoadingReviews(false);
      }
    })();
  }, [id, currentPage]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (loadingProduct) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "70vh" }}>
        <Spin size="large" tip="Đang tải thông tin sản phẩm..." />
      </div>
    );
  }

  if (!product) {
    return (
      <div style={{ textAlign: "center", padding: "80px 24px" }}>
        <Title level={3}>Sản phẩm không tồn tại</Title>
        <Button type="primary" onClick={() => navigate("/")} style={{ marginTop: 16 }}>
          Quay lại Trang chủ
        </Button>
      </div>
    );
  }

  const mainImage = product.product_images?.find((i) => i.is_main)?.image_url || product.product_images?.[0]?.image_url || "";

  return (
    <div style={{ maxWidth: 900, margin: "40px auto", padding: "0 24px" }}>
      <Button
        type="text"
        icon={<ArrowLeftOutlined />}
        onClick={() => navigate(`/products/${id}`)}
        style={{ marginBottom: 24, fontWeight: 600, display: "inline-flex", alignItems: "center" }}
      >
        Quay lại chi tiết sản phẩm
      </Button>

      {/* Product Summary Header Card */}
      <Card style={{ marginBottom: 32, borderRadius: 16, border: "1px solid #f0f0f0", overflow: "hidden" }}>
        <div style={{ padding: 24 }}>
          <Row gutter={24} align="middle">
            <Col xs={24} sm={6}>
              <div style={{ borderRadius: 12, overflow: "hidden", border: "1px solid #eee" }}>
                <img src={mainImage} alt={product.name} style={{ width: "100%", height: 120, objectFit: "cover", display: "block" }} />
              </div>
            </Col>
            <Col xs={24} sm={18}>
              <Space direction="vertical" size={4}>
                <Text type="secondary" style={{ fontSize: 13, textTransform: "uppercase", letterSpacing: 0.5 }}>
                  {product.categories?.name}
                </Text>
                <Title level={3} style={{ margin: 0, fontWeight: 700 }}>
                  {product.name}
                </Title>
                <Text type="secondary">
                  Thương hiệu: <span style={{ fontWeight: 600, color: "#111" }}>{product.brand}</span>
                </Text>
              </Space>
            </Col>
          </Row>
        </div>
      </Card>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <Title level={4} style={{ margin: 0, fontWeight: 700 }}>
          Tất Cả Đánh Giá ({total})
        </Title>
      </div>

      {loadingReviews ? (
        <div style={{ textAlign: "center", padding: "60px 0" }}>
          <Spin size="large" tip="Đang tải danh sách đánh giá..." />
        </div>
      ) : reviews.length === 0 ? (
        <Card style={{ borderRadius: 16, textAlign: "center", padding: "40px 0" }}>
          <Empty description="Sản phẩm này chưa có đánh giá nào." />
        </Card>
      ) : (
        <div>
          <Card style={{ borderRadius: 16, border: "1px solid #f0f0f0" }}>
            <div style={{ padding: "8px 24px" }}>
              <List
                itemLayout="vertical"
                dataSource={reviews}
                renderItem={(review) => (
                  <List.Item
                    key={review.id}
                    style={{ padding: "24px 0" }}
                  >
                    <Row wrap={false} gutter={16}>
                      <Col>
                        <Avatar
                          src={review.users?.avatar || undefined}
                          icon={<UserOutlined />}
                          size={44}
                          style={{ backgroundColor: "#111" }}
                        />
                      </Col>
                      <Col flex="auto">
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                          <div>
                            <Text strong style={{ fontSize: 15, display: "block" }}>
                              {review.users?.full_name || "Khách hàng"}
                            </Text>
                            <Rate disabled value={review.rating} style={{ fontSize: 12, color: "#fadb14" }} />
                          </div>
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            {new Date(review.created_at).toLocaleDateString("vi-VN", {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit"
                            })}
                          </Text>
                        </div>
                        <Paragraph style={{ color: "#444", fontSize: 14, margin: "8px 0 0", lineHeight: 1.6 }}>
                          {review.comment || "Không có bình luận chi tiết."}
                        </Paragraph>
                      </Col>
                    </Row>
                  </List.Item>
                )}
              />
            </div>
          </Card>

          {total > limit && (
            <div style={{ display: "flex", justifyContent: "center", marginTop: 32 }}>
              <Pagination
                current={currentPage}
                pageSize={limit}
                total={total}
                onChange={handlePageChange}
                showSizeChanger={false}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
