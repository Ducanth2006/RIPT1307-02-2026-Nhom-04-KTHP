import { Button, Space, Spin } from "antd";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getCategories } from "../../services/Category/apiClient";

const CategoryBar = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const categoryIdStr = searchParams.get("category_id");

  const { data, isLoading } = useQuery({
    queryKey: ["categories"],
    queryFn: () => getCategories().then((res) => res.data),
  });

  const categories = data?.data || [];
  // Lọc chỉ lấy các danh mục cha (parent_id === null) để hiển thị trên thanh CategoryBar cho gọn và đẹp mắt
  const parentCategories = categories.filter((cat) => cat.parent_id === null);

  const handleClick = (id?: number) => {
    if (id === undefined) {
      searchParams.delete("category_id");
    } else {
      searchParams.set("category_id", id.toString());
    }
    searchParams.set("page", "1"); // Reset về trang 1 khi chuyển danh mục
    navigate({
      pathname: "/products",
      search: searchParams.toString(),
    });
  };

  const activeId = categoryIdStr ? Number(categoryIdStr) : undefined;

  if (isLoading) {
    return (
      <div style={{ background: "#fff", padding: "12px 40px", textAlign: "center" }}>
        <Spin size="small" />
      </div>
    );
  }

  return (
    <div
      style={{
        background: "#fff",
        borderBottom: "2px solid #111",
        padding: "12px 40px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
      }}
    >
      <Space size="large" wrap>
        <Button
          type="text"
          onClick={() => handleClick(undefined)}
          style={{
            fontSize: 16,
            fontWeight: activeId === undefined ? 700 : 600,
            color: activeId === undefined ? "#ee4d2d" : "#312e2e",
            borderBottom: activeId === undefined ? "3px solid #ee4d2d" : "none",
            borderRadius: 0,
            paddingBottom: 8,
            textTransform: "uppercase",
          }}
        >
          Tất cả
        </Button>
        {parentCategories.map((cat) => (
          <Button
            key={cat.id}
            type="text"
            onClick={() => handleClick(cat.id)}
            style={{
              fontSize: 16,
              fontWeight: activeId === cat.id ? 700 : 600,
              color: activeId === cat.id ? "#ee4d2d" : "#312e2e",
              borderBottom: activeId === cat.id ? "3px solid #ee4d2d" : "none",
              borderRadius: 0,
              paddingBottom: 8,
              textTransform: "uppercase",
            }}
          >
            {cat.name}
          </Button>
        ))}
      </Space>
    </div>
  );
};

export default CategoryBar;
