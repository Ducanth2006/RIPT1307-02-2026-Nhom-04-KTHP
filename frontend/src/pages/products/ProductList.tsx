import { useState } from "react";
import { Typography, Button, Row, Col } from "antd";
import { Link } from "react-router-dom";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import ProductCard from "../../components/product/ProductCard";
import { getProducts } from "../../services/Product/apiClient";
import ProductPagination from "../../components/layout/ProductPagination";

const { Text } = Typography;

interface ProductListProps {
  genderFilter?: string;
}

const ProductList = ({ genderFilter }: ProductListProps) => {
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10; // 5 sản phẩm mỗi hàng, 2 hàng = 10 sản phẩm

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

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    document.getElementById("trending-now")?.scrollIntoView({ behavior: "smooth" });
  };

  const products = data?.data || [];
  const totalItems = data?.pagination?.total || 0;

  return (
    <div style={{ padding: "16px 40px 60px" }} id="trending-now">
      <style>{`
        .trending-grid {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 24px;
        }
        @media (max-width: 1400px) {
          .trending-grid {
            grid-template-columns: repeat(4, 1fr);
          }
        }
        @media (max-width: 1100px) {
          .trending-grid {
            grid-template-columns: repeat(3, 1fr);
          }
        }
        @media (max-width: 768px) {
          .trending-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
      `}</style>

      <div style={{ position: "relative", marginBottom: "28px", borderRadius: "16px", overflow: "hidden", boxShadow: "0 4px 20px rgba(0,0,0,0.08)" }}>
        <Link to="/products">
          <img
            src="/bst3.png"
            alt="Sản phẩm thịnh hành"
            style={{
              width: "100%",
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
                backgroundColor: "#2ea63a",
                color: "#fff",
                border: "none",
                borderRadius: "8px",
                fontWeight: 800,
                boxShadow: "0 4px 15px rgba(46, 166, 58, 0.4)",
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

      {/* Grid sản phẩm chia thành 2 hàng, mỗi hàng tối đa 5 sản phẩm */}
      <div style={{ minHeight: "400px", opacity: isFetching ? 0.6 : 1, transition: "opacity 0.3s", maxWidth: "1400px", margin: "0 auto" }}>
        <div className="trending-grid">
          {products.map((product) => (
            <div key={product.id} style={{ minWidth: 0 }}>
              <ProductCard product={product} />
            </div>
          ))}
          {products.length === 0 && !isLoading && (
            <div style={{ width: "100%", textAlign: "center", padding: "100px 0", gridColumn: "span 5" }}>
              <Text type="secondary">Không tìm thấy sản phẩm nào.</Text>
            </div>
          )}
        </div>
      </div>

      {totalItems > pageSize && (
        <div style={{ display: "flex", justifyContent: "center", marginTop: 32 }}>
          <ProductPagination current={currentPage} total={totalItems} pageSize={pageSize} onChange={handlePageChange} />
        </div>
      )}
    </div>
  );
};

export default ProductList;
