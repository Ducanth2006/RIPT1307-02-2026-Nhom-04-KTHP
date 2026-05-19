import { Typography, Row, Col, Spin, Empty } from "antd";
import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import ProductCard from "../../../components/product/ProductCard";
import { getProducts } from "../../../services/Product/apiClient";
import ProductPagination from "../../../components/layout/ProductPagination";

const { Title } = Typography;

const ProductGrid = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const search = searchParams.get("search") || "";
  const currentPage = Number(searchParams.get("page")) || 1;
  const pageSize = 12;

  // Lấy dữ liệu từ API dùng useQuery để clean và tối ưu cache
  const { data, isLoading } = useQuery({
    queryKey: ["products-grid", currentPage, search],
    queryFn: () => getProducts({ page: currentPage, limit: pageSize, search }).then((res) => res.data),
  });

  const handlePageChange = (page: number) => {
    searchParams.set("page", page.toString());
    setSearchParams(searchParams);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const products = data?.data || [];
  const totalItems = data?.pagination?.total || 0;

  return (
    <div style={{ maxWidth: 1400, margin: "0 auto", padding: "20px 10px" }}>
      <div style={{ marginBottom: 40, borderBottom: "2px solid #000", paddingBottom: 10 }}>
        <Title level={2} style={{ textTransform: "uppercase", margin: 0, fontWeight: 800 }}>
          {search ? `SEARCH RESULTS: "${search}"` : "ALL PRODUCTS"}
        </Title>
      </div>

      <Spin spinning={isLoading} size="large">
        <Row gutter={[20, 20]} style={{ minHeight: 400 }}>
          {products.length > 0
            ? products.map((p) => (
                <Col xs={12} sm={8} md={6} lg={4} key={p.id} style={{ display: "flex" }}>
                  <ProductCard product={p} />
                </Col>
              ))
            : !isLoading && (
                <div style={{ width: "100%", padding: "100px 0" }}>
                  <Empty description="No products found" />
                </div>
              )}
        </Row>
      </Spin>

      {totalItems > pageSize && (
        <div style={{ marginTop: 40, display: "flex", justifyContent: "center" }}>
          <ProductPagination current={currentPage} total={totalItems} pageSize={pageSize} onChange={handlePageChange} />
        </div>
      )}
    </div>
  );
};

export default ProductGrid;
