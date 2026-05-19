import { useState } from "react";
import { Typography, Button } from "antd";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
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
  const { data, isLoading } = useQuery({
    queryKey: ["products", currentPage, genderFilter],
    queryFn: () => getProducts({ page: currentPage, limit: pageSize }).then((res) => res.data),
  });

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    document.getElementById("trending-now")?.scrollIntoView({ behavior: "smooth" });
  };

  const products = data?.data || [];
  const totalItems = data?.pagination?.total || 0;

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
          TRENDING NOW
        </Title>
        <Link to="/products">
          <Button type="link" style={{ fontSize: 16, fontWeight: 800, color: "#000", padding: 0 }}>
            VIEW ALL →
          </Button>
        </Link>
      </div>

      <div
        style={{
          display: "flex",
          gap: 24,
          overflowX: "auto",
          paddingBottom: 20,
          scrollBehavior: "smooth",
          minHeight: "400px",
          opacity: isLoading ? 0.5 : 1,
          transition: "opacity 0.3s",
        }}
        className="hide-scrollbar"
      >
        {products.map((product) => (
          <div key={product.id} style={{ minWidth: "280px", flexShrink: 0 }}>
            <ProductCard product={product} />
          </div>
        ))}
        {products.length === 0 && !isLoading && (
          <div style={{ width: "100%", textAlign: "center", padding: "100px 0" }}>
            <Text type="secondary">No products found.</Text>
          </div>
        )}
      </div>

      {totalItems > pageSize && (
        <ProductPagination current={currentPage} total={totalItems} pageSize={pageSize} onChange={handlePageChange} />
      )}
    </div>
  );
};

export default ProductList;
