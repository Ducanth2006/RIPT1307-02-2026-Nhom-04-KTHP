import { Typography, Row, Col, Spin, Empty, Card, Collapse, InputNumber, Button, Select, Divider } from "antd";
import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import ProductCard from "../../../components/product/ProductCard";
import { getProducts } from "../../../services/Product/apiClient";
import { getCategories } from "../../../services/Category/apiClient";
import type { ICategory } from "../../../services/Category/typing";
import ProductPagination from "../../../components/layout/ProductPagination";
import { UnorderedListOutlined } from "@ant-design/icons";

const { Title, Text } = Typography;

const ProductGrid = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const search = searchParams.get("search") || "";
  const currentPage = Number(searchParams.get("page")) || 1;
  const categoryIdStr = searchParams.get("category_id");
  const categoryId = categoryIdStr ? Number(categoryIdStr) : undefined;
  const pageSize = 12;

  const minPriceStr = searchParams.get("min_price");
  const maxPriceStr = searchParams.get("max_price");
  const minPrice = minPriceStr ? Number(minPriceStr) : undefined;
  const maxPrice = maxPriceStr ? Number(maxPriceStr) : undefined;
  const sortBy = searchParams.get("sortBy") || undefined;
  const order = searchParams.get("order") || undefined;

  // Lấy dữ liệu từ API dùng useQuery để clean và tối ưu cache
  const { data, isLoading } = useQuery({
    queryKey: ["products-grid", currentPage, search, categoryId, minPrice, maxPrice, sortBy, order],
    queryFn: () =>
      getProducts({ 
        page: currentPage, 
        limit: pageSize, 
        search, 
        category_id: categoryId,
        min_price: minPrice,
        max_price: maxPrice,
        sortBy,
        order
      }).then((res) => res.data),
  });

  // Lấy danh mục sản phẩm phục vụ bộ lọc tìm kiếm
  const { data: categoriesData } = useQuery({
    queryKey: ["categories-filter"],
    queryFn: () => getCategories().then((res) => res.data),
  });

  const categoriesList = categoriesData?.data || [];
  const parentCategories = categoriesList.filter((cat) => cat.parent_id === null);

  const [expandedKeys, setExpandedKeys] = useState<string[]>([]);

  useEffect(() => {
    if (categoriesList.length > 0) {
      if (categoryId !== undefined) {
        const selectedCat = categoriesList.find(c => c.id === categoryId);
        if (selectedCat) {
          const parentIdToExpand = selectedCat.parent_id === null ? selectedCat.id : selectedCat.parent_id;
          if (parentIdToExpand) {
            setExpandedKeys([parentIdToExpand.toString()]);
          }
        }
      } else {
        setExpandedKeys([]);
      }
    }
  }, [categoryId, categoriesList]);

  // Always scroll to top when filters or page change, or on initial load
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [categoryId, currentPage, search]);

  const handlePageChange = (page: number) => {
    searchParams.set("page", page.toString());
    setSearchParams(searchParams);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCategoryClick = (id?: number) => {
    if (id === undefined) {
      searchParams.delete("category_id");
    } else {
      searchParams.set("category_id", id.toString());
    }
    searchParams.set("page", "1");
    setSearchParams(searchParams);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const [localMinPrice, setLocalMinPrice] = useState<number | null>(minPrice || null);
  const [localMaxPrice, setLocalMaxPrice] = useState<number | null>(maxPrice || null);

  useEffect(() => {
    setLocalMinPrice(minPrice || null);
    setLocalMaxPrice(maxPrice || null);
  }, [minPrice, maxPrice]);

  const handlePriceApply = () => {
    if (localMinPrice !== null) {
      searchParams.set("min_price", localMinPrice.toString());
    } else {
      searchParams.delete("min_price");
    }
    if (localMaxPrice !== null) {
      searchParams.set("max_price", localMaxPrice.toString());
    } else {
      searchParams.delete("max_price");
    }
    searchParams.set("page", "1");
    setSearchParams(searchParams);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSortChange = (value: string) => {
    if (!value) {
      searchParams.delete("sortBy");
      searchParams.delete("order");
    } else {
      const [sort, orderVal] = value.split("-");
      searchParams.set("sortBy", sort);
      searchParams.set("order", orderVal);
    }
    searchParams.set("page", "1");
    setSearchParams(searchParams);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const products = data?.data || [];
  const totalItems = data?.pagination?.total || 0;

  const renderCategoryItem = (cat: ICategory, isChild = false) => {
    const isActive = categoryId === cat.id;
    return (
      <div
        key={cat.id}
        onClick={() => handleCategoryClick(cat.id)}
        style={{
          padding: "8px 12px",
          paddingLeft: isChild ? 24 : 12,
          cursor: "pointer",
          borderRadius: 4,
          fontSize: isChild ? 13 : 14,
          fontWeight: isActive ? 600 : 400,
          color: isActive ? "#af101a" : "#333",
          backgroundColor: isActive ? "#fff5f2" : "transparent",
          transition: "all 0.2s",
          display: "flex",
          alignItems: "center",
          gap: 6,
        }}
      >
        {!isChild && isActive && <span style={{ color: "#af101a" }}>●</span>}
        {cat.name}
      </div>
    );
  };

  return (
    <div style={{ maxWidth: 1400, margin: "0 auto", padding: "40px 20px" }}>
      <div style={{ marginBottom: 40, borderBottom: "2px solid #000", paddingBottom: 10 }}>
        <Title level={2} style={{ textTransform: "uppercase", margin: 0, fontWeight: 800 }}>
          {search ? `Kết quả tìm kiếm: "${search}"` : "Tất cả sản phẩm"}
        </Title>
      </div>

      <Row gutter={[24, 24]}>
        {/* Sidebar Filter */}
        <Col xs={24} md={6}>
          <Card
            bordered={false}
            style={{
              boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
              borderRadius: 8,
              border: "1px solid #e8e8e8",
            }}
            bodyStyle={{ padding: "16px 12px" }}
          >
            <div style={{ marginBottom: 16, display: "flex", alignItems: "center", gap: 8, padding: "0 8px" }}>
              <UnorderedListOutlined style={{ fontSize: 16, color: "#af101a" }} />
              <Text strong style={{ fontSize: 16 }}>
                Bộ lọc tìm kiếm
              </Text>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <div
                onClick={() => handleCategoryClick(undefined)}
                style={{
                  padding: "8px 12px",
                  cursor: "pointer",
                  borderRadius: 4,
                  fontSize: 14,
                  fontWeight: categoryId === undefined ? 600 : 400,
                  color: categoryId === undefined ? "#af101a" : "#333",
                  backgroundColor: categoryId === undefined ? "#fff5f2" : "transparent",
                  transition: "all 0.2s",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                {categoryId === undefined && <span style={{ color: "#af101a" }}>●</span>}
                Tất cả sản phẩm
              </div>
              <Collapse
                ghost
                expandIconPosition="end"
                activeKey={expandedKeys}
                onChange={(keys) => setExpandedKeys(keys as string[])}
                style={{ marginLeft: -12 }}
              >
                {parentCategories.map((parent) => {
                  const children = categoriesList.filter((cat) => cat.parent_id === parent.id);
                  const isActive = categoryId === parent.id;
                  return (
                    <Collapse.Panel
                      key={parent.id.toString()}
                      header={
                        <div
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCategoryClick(parent.id);
                          }}
                          style={{
                            fontSize: 14,
                            fontWeight: isActive ? 600 : 500,
                            color: isActive ? "#af101a" : "#333",
                            display: "flex",
                            alignItems: "center"
                          }}
                        >
                          {isActive && <span style={{ color: "#af101a", marginRight: 6 }}>●</span>}
                          {parent.name}
                        </div>
                      }
                      showArrow={children.length > 0}
                    >
                      {children.length > 0 && (
                        <div style={{ display: "flex", flexDirection: "column", gap: 4, paddingLeft: 12 }}>
                          {children.map((child) => renderCategoryItem(child, true))}
                        </div>
                      )}
                    </Collapse.Panel>
                  );
                })}
              </Collapse>
              
              <Divider style={{ margin: "16px 0" }} />
              
              <div style={{ marginBottom: 16, display: "flex", alignItems: "center", gap: 8, padding: "0 8px" }}>
                <Text strong style={{ fontSize: 16 }}>
                  Khoảng giá
                </Text>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 12, padding: "0 8px", marginBottom: 8 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <InputNumber 
                    placeholder="Từ" 
                    value={localMinPrice} 
                    onChange={setLocalMinPrice} 
                    style={{ width: "100%" }}
                    formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                    parser={(value) => value!.replace(/\$\s?|(,*)/g, '') as unknown as number}
                    min={0}
                  />
                  <Text>-</Text>
                  <InputNumber 
                    placeholder="Đến" 
                    value={localMaxPrice} 
                    onChange={setLocalMaxPrice} 
                    style={{ width: "100%" }}
                    formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                    parser={(value) => value!.replace(/\$\s?|(,*)/g, '') as unknown as number}
                    min={0}
                  />
                </div>
                <Button type="primary" onClick={handlePriceApply} block style={{ background: "#af101a" }}>
                  Áp dụng
                </Button>
              </div>
            </div>
          </Card>
        </Col>

        {/* Products Grid */}
        <Col xs={24} md={18}>
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 20 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <Text strong>Sắp xếp theo:</Text>
              <Select
                value={sortBy && order ? `${sortBy}-${order}` : ""}
                onChange={handleSortChange}
                style={{ width: 180 }}
                options={[
                  { value: "", label: "Mặc định" },
                  { value: "created_at-desc", label: "Mới nhất" },
                  { value: "base_price-asc", label: "Giá tăng dần" },
                  { value: "base_price-desc", label: "Giá giảm dần" },
                  { value: "name-asc", label: "Tên A-Z" },
                  { value: "name-desc", label: "Tên Z-A" },
                ]}
              />
            </div>
          </div>
          <Spin spinning={isLoading} size="large">
            <Row gutter={[20, 20]} style={{ minHeight: 400 }}>
              {products.length > 0
                ? products.map((p) => (
                  <Col xs={12} sm={12} md={8} lg={6} key={p.id} style={{ display: "flex" }}>
                    <ProductCard product={p} />
                  </Col>
                ))
                : !isLoading && (
                  <div style={{ width: "100%", padding: "100px 0" }}>
                    <Empty description="Không tìm thấy sản phẩm nào" />
                  </div>
                )}
            </Row>
          </Spin>

          {totalItems > pageSize && (
            <div style={{ marginTop: 40, display: "flex", justifyContent: "center" }}>
              <ProductPagination
                current={currentPage}
                total={totalItems}
                pageSize={pageSize}
                onChange={handlePageChange}
              />
            </div>
          )}
        </Col>
      </Row>
    </div>
  );
};

export default ProductGrid;
