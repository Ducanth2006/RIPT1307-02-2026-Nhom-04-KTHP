import { useRef, useEffect, useState } from "react";
import { Typography, Button } from "antd";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { LeftOutlined, RightOutlined } from "@ant-design/icons";
import ProductCard from "../../components/product/ProductCard";
import { getNewArrivals } from "../../services/client/product/apiClient";

const { Title, Text } = Typography;

const NewArrivals = () => {
  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["newArrivals"],
    queryFn: () => getNewArrivals().then((res) => res.data),
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
    }, 3500);
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
    <div style={{ padding: "24px 40px" }} id="new-arrivals">
      {/* Banner thay thế cho tiêu đề chữ */}
      <div style={{ position: "relative", marginBottom: "28px", borderRadius: "16px", overflow: "hidden", boxShadow: "0 4px 20px rgba(0,0,0,0.08)" }}>
        <Link to="/new-arrivals">
          <img
            src="/bst2.png"
            alt="Sản phẩm mới"
            style={{
               width: "100%",
               aspectRatio: "3/1",
               objectFit: "cover",
               height: "auto",
               display: "block",
               transition: "transform 0.6s cubic-bezier(0.25, 1, 0.5, 1)",
               imageRendering: "-webkit-optimize-contrast",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.02)")}
            onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
          />
          <div style={{
            position: "absolute",
            bottom: "8%",
            left: "5%",
            zIndex: 10
          }}>
            <Button
              size="large"
              style={{
                backgroundColor: "#096dd9",
                color: "#fff",
                border: "none",
                borderRadius: "8px",
                fontWeight: 800,
                boxShadow: "0 4px 15px rgba(9, 109, 217, 0.4)",
                display: "flex",
                alignItems: "center",
                height: "48px",
                padding: "0 28px",
                fontSize: "15px"
              }}
            >
              MUA NGAY →
            </Button>
          </div>
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
            <div key={product.id} style={{ width: "280px", minWidth: "280px", flexShrink: 0, scrollSnapAlign: "start" }}>
              <ProductCard product={product} />
            </div>
          ))}
          {products.length === 0 && !isLoading && (
            <div style={{ width: "100%", textAlign: "center", padding: "100px 0" }}>
              <Text type="secondary">Chưa có sản phẩm mới nào.</Text>
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

export default NewArrivals;
