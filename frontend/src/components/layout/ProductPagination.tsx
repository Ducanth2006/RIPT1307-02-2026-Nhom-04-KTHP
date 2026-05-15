import { Pagination } from "antd";
import type { PaginationProps } from "antd";
import { LeftOutlined, RightOutlined } from "@ant-design/icons";

interface Props {
  current: number;
  total: number;
  pageSize: number;
  onChange: (page: number, pageSize: number) => void;
}

const ProductPagination = ({ current, total, pageSize, onChange }: Props) => {
  const itemRender: PaginationProps["itemRender"] = (_, type, originalElement) => {
    if (type === "prev") {
      return <LeftOutlined style={{ fontSize: 14 }} />;
    }
    if (type === "next") {
      return <RightOutlined style={{ fontSize: 14 }} />;
    }
    return originalElement;
  };

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        marginTop: "48px",
        padding: "20px 0",
      }}
    >
      <Pagination
        current={current}
        total={total}
        pageSize={pageSize}
        onChange={onChange}
        showSizeChanger={false}
        itemRender={itemRender}
        style={{
          fontSize: "16px",
          fontWeight: 600,
        }}
      />
      <style>{`
        .ant-pagination-item {
          border-radius: 4px !important;
          border: 1px solid #e8e8e8 !important;
        }
        .ant-pagination-item-active {
          border-color: #000 !important;
          background: #000 !important;
        }
        .ant-pagination-item-active a {
          color: #fff !important;
        }
        .ant-pagination-item:hover {
          border-color: #000 !important;
        }
        .ant-pagination-item:hover a {
          color: #000 !important;
        }
        .ant-pagination-prev, .ant-pagination-next {
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .ant-pagination-prev:hover .ant-pagination-item-link,
        .ant-pagination-next:hover .ant-pagination-item-link {
          color: #000 !important;
          border-color: #000 !important;
        }
      `}</style>
    </div>
  );
};

export default ProductPagination;
