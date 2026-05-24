import { useRef, useEffect, useState } from "react";
import { Typography, Button } from "antd";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { LeftOutlined, RightOutlined } from "@ant-design/icons";
import ProductCard from "../../components/product/ProductCard";
import { getLowStockProducts } from "../../services/Product/apiClient";

const { Title, Text } = Typography;

const LimitedProducts = () => {
  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["limitedProducts"],
    queryFn: () => getLowStockProducts().then((res) => res.data),
  });

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [scrollState, setScrollState] = useState({ isAtStart: true, isAtEnd: false });

  const checkScroll = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      setScrollState({
        isAtStart: scrollLeft <= 0,
        isAtEnd: Math.ceil(scrollLeft + clientWidth) >= scrollWidth - 1
      });
    }
  };

  const [isHovering, setIsHovering] = useState(false);

  useEffect(() => {
    if (isHovering || !data?.data || data.data.length === 0) return;
    const interval = setInterval(() => {
      if (scrollContainerRef.current) {
        const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
        const scrollAmount = clientWidth * 0.8;
        if (Math.ceil(scrollLeft + clientWidth) >= scrollWidth - 1) {
          scrollContainerRef.current.scrollTo({ left: 0, behavior: "smooth" });
        } else {
          scrollContainerRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
        }
      }
    }, 4000);
    return () => clearInterval(interval);
  }, [isHovering, data?.data]);

  const products = data?.data || [];

  const handleScroll = (direction: 'left' | 'right') => {
    if (!scrollContainerRef.current) return;
    const { clientWidth } = scrollContainerRef.current;
    const scrollAmount = clientWidth * 0.8;

    if (direction === 'right') {
      scrollContainerRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
    } else {
      scrollContainerRef.current.scrollBy({ left: -scrollAmount, behavior: "smooth" });
    }
  };

  const showLeftBtn = !scrollState.isAtStart;
  const showRightBtn = !scrollState.isAtEnd && products.length > 0;

  return (
    <div style={{ padding: "16px 40px" }} id="limited-products">
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 8,
        }}
      >
        <Title level={2} style={{ margin: 0 }}>
          Sản phẩm giới hạn
        </Title>
        <Link to="/limited-products">
          <Button type="link" style={{ fontSize: 16, fontWeight: 800, color: "#000", padding: 0 }}>
            Tất cả sản phẩm giới hạn →
          </Button>
        </Link>
      </div>

      <div
        style={{ position: "relative" }}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
      >
        {showLeftBtn && (
          <Button
            shape="circle"
            icon={<LeftOutlined />}
            onClick={() => handleScroll('left')}
            style={{
              position: 'absolute',
              left: -20,
              top: '50%',
              transform: 'translateY(-50%)',
              zIndex: 10,
              boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
              width: 40,
              height: 40
            }}
          />
        )}

        <div
          ref={scrollContainerRef}
          onScroll={checkScroll}
          style={{
            display: "flex",
            gap: 24,
            overflowX: "auto",
            paddingBottom: 20,
            scrollBehavior: "smooth",
            minHeight: "400px",
            opacity: isFetching ? 0.6 : 1,
            transition: "opacity 0.3s",
            scrollSnapType: "x mandatory",
          }}
          className="hide-scrollbar"
        >
          {products.map((product) => (
            <div key={product.id} style={{ minWidth: "280px", flexShrink: 0, scrollSnapAlign: "start" }}>
              <ProductCard product={product} badge="LIMITED" />
            </div>
          ))}
          {products.length === 0 && !isLoading && (
            <div style={{ width: "100%", textAlign: "center", padding: "100px 0" }}>
              <Text type="secondary">Chưa có sản phẩm giới hạn nào.</Text>
            </div>
          )}
        </div>

        {showRightBtn && (
          <Button
            shape="circle"
            icon={<RightOutlined />}
            onClick={() => handleScroll('right')}
            style={{
              position: 'absolute',
              right: -20,
              top: '50%',
              transform: 'translateY(-50%)',
              zIndex: 10,
              boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
              width: 40,
              height: 40
            }}
          />
        )}
      </div>
    </div>
  );
};

export default LimitedProducts;
