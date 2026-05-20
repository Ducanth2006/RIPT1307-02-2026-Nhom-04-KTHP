import { Empty, Button } from "antd";
import { Link } from "react-router-dom";

const EmptyCart = () => (
  <div className="cart-page">
    <div className="cart-container" style={{ textAlign: "center", padding: "100px 0" }}>
      <Empty description="Giỏ hàng trống">
        <Link to="/products">
          <Button type="primary" size="large" style={{ background: "#000" }}>
            MUA SẮM NGAY
          </Button>
        </Link>
      </Empty>
    </div>
  </div>
);

export default EmptyCart;
