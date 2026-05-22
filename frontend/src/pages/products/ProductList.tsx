import { useState, useRef, useEffect } from "react";
import { Typography, Button } from "antd";
import { Link } from "react-router-dom";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { LeftOutlined, RightOutlined } from "@ant-design/icons";
import ProductCard from "../../components/product/ProductCard";
import { getProducts } from "../../services/Product/apiClient";
import ProductPagination from "../../components/layout/ProductPagination";

const { Title, Text } = Typography;

interface ProductListProps {
  genderFilter?: string;
}

const ProductList = ({ genderFilter }: ProductListProps) => {
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Reset page khi đổi filter
  const [prevFilter, setPrevFilter] = useState(genderFilter);
  if (genderFilter !== prevFilter) {
    setPrevFilter(genderFilter);
    setCurrentPage(1);
  }

  // Lấy dữ liệu từ API
  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["products", currentPage, genderFilter],
    queryFn: () => getProducts({ page: currentPage, limit: pageSize }).then((res) => res.data),
    placeholderData: keepPreviousData,
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

  useEffect(() => {
    // Reset scroll when data changes
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({ left: 0 });
    }
    // Timeout to allow DOM to render before checking scroll
    setTimeout(checkScroll, 100);
  }, [data]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    document.getElementById("trending-now")?.scrollIntoView({ behavior: "smooth" });
  };

  const products = data?.data || [];
  const totalItems = data?.pagination?.total || 0;

  const handleScroll = (direction: 'left' | 'right') => {
    if (!scrollContainerRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
    const scrollAmount = clientWidth * 0.8; // Scroll 80% of container width

    if (direction === 'right') {
      if (Math.ceil(scrollLeft + clientWidth) >= scrollWidth - 1) {
        if (currentPage * pageSize < totalItems) {
          handlePageChange(currentPage + 1);
        }
      } else {
        scrollContainerRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
      }
    } else {
      if (scrollLeft <= 0) {
        if (currentPage > 1) {
          handlePageChange(currentPage - 1);
        }
      } else {
        scrollContainerRef.current.scrollBy({ left: -scrollAmount, behavior: "smooth" });
      }
    }
  };

  const showLeftBtn = currentPage > 1 || !scrollState.isAtStart;
  const showRightBtn = (currentPage * pageSize < totalItems) || !scrollState.isAtEnd;

  return (
    <div style={{ padding: "40px 40px 60px" }} id="trending-now">
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 32,
        }}
      >
        <Title level={2} style={{ margin: 0 }}>
          Sản phẩm thịnh hành
        </Title>
        <Link to="/products">
          <Button type="link" style={{ fontSize: 16, fontWeight: 800, color: "#000", padding: 0 }}>
            Tất cả sản phẩm →
          </Button>
        </Link>
      </div>

      <div style={{ position: "relative" }}>
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
              <ProductCard product={product} />
            </div>
          ))}
          {products.length === 0 && !isLoading && (
            <div style={{ width: "100%", textAlign: "center", padding: "100px 0" }}>
              <Text type="secondary">No products found.</Text>
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

      {totalItems > pageSize && (
        <ProductPagination current={currentPage} total={totalItems} pageSize={pageSize} onChange={handlePageChange} />
      )}
    </div>
  );
};

export default ProductList;
