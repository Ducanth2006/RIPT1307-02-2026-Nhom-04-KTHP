import { useState, useRef, useEffect } from "react";
import { Button, Spin } from "antd";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { LeftOutlined, RightOutlined } from "@ant-design/icons";
import { getCategories } from "../../services/Category/apiClient";

const CategoryBar = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const categoryIdStr = searchParams.get("category_id");

  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["categories"],
    queryFn: () => getCategories().then((res) => res.data),
  });

  const categories = data?.data || [];
  const parentCategories = categories.filter((cat) => cat.parent_id === null);

  const checkScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 1);
    }
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener("resize", checkScroll);
    return () => window.removeEventListener("resize", checkScroll);
  }, [categories]);

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const scrollAmount = 300;
      scrollRef.current.scrollBy({ left: direction === "left" ? -scrollAmount : scrollAmount, behavior: "smooth" });
      setTimeout(checkScroll, 350);
    }
  };

  const handleClick = (id?: number) => {
    if (id === undefined) {
      searchParams.delete("category_id");
    } else {
      searchParams.set("category_id", id.toString());
    }
    searchParams.set("page", "1");
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
        position: "relative",
      }}
    >
      {canScrollLeft && (
        <Button
          shape="circle"
          icon={<LeftOutlined />}
          onClick={() => scroll("left")}
          style={{
            position: "absolute",
            left: 16,
            top: "50%",
            transform: "translateY(-50%)",
            zIndex: 10,
            boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
            border: "none",
            backgroundColor: "rgba(255,255,255,0.9)"
          }}
        />
      )}

      <div
        ref={scrollRef}
        onScroll={checkScroll}
        style={{
          display: "flex",
          overflowX: "auto",
          scrollbarWidth: "none",
          msOverflowStyle: "none",
          gap: 24,
          padding: "0 8px",
          whiteSpace: "nowrap"
        }}
        className="category-scroll-container"
      >
        <style>{`.category-scroll-container::-webkit-scrollbar { display: none; }`}</style>
        <Button
          type="text"
          onClick={() => handleClick(undefined)}
          style={{
            fontSize: 16,
            fontWeight: activeId === undefined ? 700 : 600,
            color: activeId === undefined ? "#af101a" : "#312e2e",
            borderBottom: activeId === undefined ? "3px solid #af101a" : "none",
            borderRadius: 0,
            paddingBottom: 8,
            textTransform: "uppercase",
            flexShrink: 0
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
              color: activeId === cat.id ? "#af101a" : "#312e2e",
              borderBottom: activeId === cat.id ? "3px solid #af101a" : "none",
              borderRadius: 0,
              paddingBottom: 8,
              textTransform: "uppercase",
              flexShrink: 0
            }}
          >
            {cat.name}
          </Button>
        ))}
      </div>

      {canScrollRight && (
        <Button
          shape="circle"
          icon={<RightOutlined />}
          onClick={() => scroll("right")}
          style={{
            position: "absolute",
            right: 16,
            top: "50%",
            transform: "translateY(-50%)",
            zIndex: 10,
            boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
            border: "none",
            backgroundColor: "rgba(255,255,255,0.9)"
          }}
        />
      )}
    </div>
  );
};

export default CategoryBar;
