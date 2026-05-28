import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { Row, Col, Typography, Rate, Progress, Avatar, Button, Empty, Spin } from "antd";
import { UserOutlined, MessageOutlined } from "@ant-design/icons";
import { getProductReviewsApi } from "../../services/client/review/apiClient";
import type { IReview } from "../../services/client/review/typing";

const { Title, Text, Paragraph } = Typography;

interface ProductReviewsProps {
  productId: string | number;
}

export default function ProductReviews({ productId }: ProductReviewsProps) {
  const [reviews, setReviews] = useState<IReview[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!productId) return;
    (async () => {
      try {
        setLoading(true);
        const { data: res } = await getProductReviewsApi(productId, { page: 1, limit: 10 });
        setReviews(res.data || []);
        setTotal(res.total || 0);
      } catch (err) {
        console.error("Failed to load reviews", err);
      } finally {
        setLoading(false);
      }
    })();
  }, [productId]);

  // Calculate statistics
  const stats = useMemo(() => {
    if (reviews.length === 0) {
      return {
        avgRating: 0,
        distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
        percentages: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
      };
    }

    const counts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    let sum = 0;

    reviews.forEach((r) => {
      const rate = Math.round(r.rating) as 5 | 4 | 3 | 2 | 1;
      if (counts[rate] !== undefined) {
        counts[rate]++;
      }
      sum += r.rating;
    });

    const avg = total > 0 ? Number((sum / reviews.length).toFixed(1)) : 0;
    const totalCount = reviews.length;

    const percentages = {
      5: totalCount > 0 ? Math.round((counts[5] / totalCount) * 100) : 0,
      4: totalCount > 0 ? Math.round((counts[4] / totalCount) * 100) : 0,
      3: totalCount > 0 ? Math.round((counts[3] / totalCount) * 100) : 0,
      2: totalCount > 0 ? Math.round((counts[2] / totalCount) * 100) : 0,
      1: totalCount > 0 ? Math.round((counts[1] / totalCount) * 100) : 0,
    };

    return {
      avgRating: avg,
      distribution: counts,
      percentages,
    };
  }, [reviews, total]);

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "40px 0" }}>
        <Spin size="medium" tip="Đang tải đánh giá..." />
      </div>
    );
  }

  return (
    <div className="product-reviews-section" style={{ marginTop: 48 }}>
      <DividerComponent />
      <Title level={3} style={{ marginBottom: 24, fontWeight: 700 }}>
        Đánh Giá Khách Hàng <MessageOutlined style={{ marginLeft: 8, fontSize: 20 }} />
      </Title>

      {reviews.length === 0 ? (
        <Empty
          description="Chưa có đánh giá nào cho sản phẩm này."
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          style={{ padding: "20px 0" }}
        />
      ) : (
        <div>
          {/* Summary Stats */}
          <div className="reviews-summary-card" style={{ marginBottom: 32 }}>
            <Row gutter={[24, 24]} align="middle">
              <Col xs={24} md={8} style={{ textAlign: "center", borderRight: "1px solid #f0f0f0" }}>
                <div style={{ fontSize: 48, fontWeight: 800, color: "#111", lineHeight: 1 }}>
                  {stats.avgRating}
                </div>
                <div style={{ margin: "12px 0 8px" }}>
                  <Rate disabled allowHalf value={stats.avgRating} style={{ fontSize: 20, color: "#fadb14" }} />
                </div>
                <Text type="secondary" style={{ fontSize: 14 }}>
                  Có {total} lượt đánh giá sản phẩm
                </Text>
              </Col>
              <Col xs={24} md={16} style={{ paddingLeft: 32 }}>
                {[5, 4, 3, 2, 1].map((stars) => (
                  <Row key={stars} align="middle" style={{ marginBottom: 8 }} gutter={12}>
                    <Col span={4} style={{ textAlign: "right" }}>
                      <Text strong style={{ fontSize: 13 }}>{stars} sao</Text>
                    </Col>
                    <Col span={16}>
                      <Progress
                        percent={stats.percentages[stars as 5 | 4 | 3 | 2 | 1]}
                        showInfo={false}
                        strokeColor="#fadb14"
                        trailColor="#f5f5f5"
                        strokeWidth={8}
                      />
                    </Col>
                    <Col span={4}>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        {stats.percentages[stars as 5 | 4 | 3 | 2 | 1]}%
                      </Text>
                    </Col>
                  </Row>
                ))}
              </Col>
            </Row>
          </div>

          {/* List of Recent Reviews */}
          <div className="reviews-list">
            {reviews.slice(0, 3).map((review) => (
              <div
                key={review.id}
                className="review-item"
                style={{
                  padding: "24px 0",
                  borderBottom: "1px solid #f0f0f0",
                }}
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
                        })}
                      </Text>
                    </div>
                    <Paragraph style={{ color: "#444", fontSize: 14, margin: "8px 0 0", lineHeight: 1.6 }}>
                      {review.comment || "Không có bình luận chi tiết."}
                    </Paragraph>
                  </Col>
                </Row>
              </div>
            ))}
          </div>

          {/* View All Button */}
          {total > 3 && (
            <div style={{ textAlign: "center", marginTop: 32 }}>
              <Link to={`/products/${productId}/reviews`}>
                <Button size="large" style={{ borderRadius: 8, padding: "0 32px", fontWeight: 600 }}>
                  Xem tất cả {total} đánh giá
                </Button>
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function DividerComponent() {
  return <div style={{ height: "1px", backgroundColor: "#f0f0f0", margin: "24px 0" }} />;
}
