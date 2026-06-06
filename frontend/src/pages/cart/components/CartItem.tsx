import { Link } from "react-router-dom";
import { MinusOutlined, PlusOutlined } from "@ant-design/icons";
import type { Cart as CartType } from "../../../services/client/cart/typing";

interface CartItemProps {
  item: CartType.ICartItem;
  onUpdate: (qty: number) => void;
  onRemove: () => void;
  loading: boolean;
  checked: boolean;
  onToggle: () => void;
}

const formatPrice = (p: number) => Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(p);

const CartItem = ({
  item,
  onUpdate,
  onRemove,
  loading,
  checked,
  onToggle,
}: CartItemProps) => {
  const img = item.imageUrl || "/placeholder.svg";
  const price = item.price;

  return (
    <div className={`cart-item-row${checked ? " selected" : ""}`}>
      <div className="item-check">
        <input
          type="checkbox"
          checked={checked}
          onChange={onToggle}
          className="cart-checkbox"
        />
      </div>
      <div className="product-info">
        <img src={img} alt="" />
        <div className="details">
          <Link to={`/products/${item.productId}`} className="name">
            {item.productName}
          </Link>
          <div className="variant">
            Phân loại: {item.size || "N/A"} / {item.color || "N/A"}
          </div>
        </div>
      </div>
      <div className="unit-price">{formatPrice(price)}</div>
      <div className="quantity">
        <div className="quantity-toggle">
          <button onClick={() => onUpdate(item.quantity - 1)} disabled={item.quantity <= 1 || loading}>
            <MinusOutlined />
          </button>
          <input type="text" value={item.quantity} readOnly />
          <button
            onClick={() => onUpdate(item.quantity + 1)}
            disabled={item.quantity >= (item.stockQuantity || 99) || loading}
          >
            <PlusOutlined />
          </button>
        </div>
      </div>
      <div className="total-price">{formatPrice(price * item.quantity)}</div>
      <div className="action">
        <button onClick={onRemove} disabled={loading}>
          Xóa
        </button>
      </div>
    </div>
  );
};

export default CartItem;
