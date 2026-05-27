import { useState, useEffect } from "react";
import { Typography, Button, message, Spin } from "antd";
import { ShoppingCartOutlined, ShopOutlined } from "@ant-design/icons";
import { Link, Navigate, useNavigate, useLocation } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getCart, updateCartItemApi, removeCartItemApi } from "../../services/Cart/apiClient";
import { createOrder } from "../../services/Order/apiClient";
import { getAddresses, createAddress } from "../../services/Address/apiClient";
import type { IAddress } from "../../services/Address/typing";
import type { Cart as CartType } from "../../services/Cart/typing";
import type { ICreateOrderRequest } from "../../services/Order/typing";

// Subcomponents
import EmptyCart from "./components/EmptyCart";
import CartItem from "./components/CartItem";
import CheckoutModal from "./components/CheckoutModal";
import AddressSelectModal from "./components/AddressSelectModal";
import AddAddressModal from "./components/AddAddressModal";

import "./Cart.less";

const { Title } = Typography;
const formatPrice = (p: number) => Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(p);

const Cart = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const location = useLocation();
  const buyNowVariantId: number | undefined = (location.state as { buyNowVariantId?: number })?.buyNowVariantId;
  const userStr = localStorage.getItem("user");
  const userObj = userStr ? JSON.parse(userStr) : null;
  const userId = userObj?.id;

  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [selectedItemIds, setSelectedItemIds] = useState<number[]>([]);

  // Địa chỉ giao hàng
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);
  const [isAddressSelectModalOpen, setIsAddressSelectModalOpen] = useState(false);
  const [isAddNewAddressOpen, setIsAddNewAddressOpen] = useState(false);

  const { data: addressesData } = useQuery({
    queryKey: ["addresses", userId],
    queryFn: () => getAddresses(userId!).then((res) => res.data),
    enabled: !!userId,
  });

  const addresses = addressesData?.data || [];
  const defaultOrFirst = addresses.find((addr) => addr.is_default) || addresses[0] || null;
  const selectedAddress = selectedAddressId
    ? addresses.find((addr) => addr.id === selectedAddressId) || defaultOrFirst
    : defaultOrFirst;

  const addNewAddressMutation = useMutation({
    mutationFn: createAddress,
    onSuccess: (res: { data: { data: IAddress } }) => {
      message.success("Thêm địa chỉ thành công!");
      queryClient.invalidateQueries({ queryKey: ["addresses", userId] });
      setSelectedAddressId(res.data.data.id);
      setIsAddNewAddressOpen(false);
    },
    onError: () => {
      message.error("Lưu địa chỉ thất bại.");
    },
  });

  const { data, isLoading } = useQuery({
    queryKey: ["cart", userId],
    queryFn: () => getCart(userId!).then((res) => res.data),
    retry: false,
    enabled: !!userId,
  });

  const cartItems: CartType.ICartItem[] = data?.data || [];
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["cart", userId] });

  // Khi cartItems load xong: nếu buyNow thì chỉ chọn item đó, ngược lại không chọn mặc định
  useEffect(() => {
    if (!cartItems.length) return;
    if (buyNowVariantId) {
      const matchItem = cartItems.find((i) => i.variantId === buyNowVariantId);
      if (matchItem) {
        setSelectedItemIds([matchItem.cartItemId]);
        return;
      }
    }
    setSelectedItemIds([]);
  }, [cartItems.length, buyNowVariantId]);

  const updateQty = useMutation({
    mutationFn: (args: { id: number; qty: number }) => updateCartItemApi(args.id, args.qty),
    onSuccess: invalidate,
  });

  const removeIdx = useMutation({
    mutationFn: removeCartItemApi,
    onSuccess: () => {
      message.success("Đã xóa khỏi giỏ");
      invalidate();
    },
  });

  const createOrderMutation = useMutation({
    mutationFn: (data: ICreateOrderRequest) => createOrder(data),
    onSuccess: () => {
      message.success("Đặt hàng thành công!");
      queryClient.invalidateQueries({ queryKey: ["cart", userId] });
      setIsCheckoutModalOpen(false);
      navigate("/orders");
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { message?: string } } };
      message.error(err.response?.data?.message || "Đặt hàng không thành công. Vui lòng thử lại.");
    },
  });

  const handleCheckoutSubmit = (values: { paymentMethod: string; voucherCode?: string }) => {
    if (selectedItemIds.length === 0) {
      message.warning("Vui lòng chọn ít nhất một sản phẩm để mua!");
      return;
    }
    if (!selectedAddress) {
      message.error("Vui lòng chọn hoặc thêm địa chỉ nhận hàng!");
      return;
    }
    createOrderMutation.mutate({
      userId: userId!,
      shippingAddress: {
        fullName: selectedAddress.recipient_name,
        phone: selectedAddress.phone,
        address: `${selectedAddress.address_line}, ${selectedAddress.city}`,
      },
      paymentMethod: values.paymentMethod,
      voucherCode: values.voucherCode,
      cartItemIds: selectedItemIds,
    });
  };

  if (!userId) {
    return <Navigate to="/login" replace />;
  }

  if (isLoading)
    return (
      <div className="cart-page-loading">
        <Spin size="large" />
      </div>
    );
  if (!cartItems.length) return <EmptyCart />;

  const selectedItems = cartItems.filter((i) => selectedItemIds.includes(i.cartItemId));
  const totalPrice = selectedItems.reduce((s: number, i: CartType.ICartItem) => {
    return s + i.price * i.quantity;
  }, 0);

  const toggleItem = (cartItemId: number) => {
    setSelectedItemIds((prev) =>
      prev.includes(cartItemId) ? prev.filter((id) => id !== cartItemId) : [...prev, cartItemId],
    );
  };

  const isAllSelected = cartItems.length > 0 && selectedItemIds.length === cartItems.length;
  const toggleAll = () => {
    setSelectedItemIds(isAllSelected ? [] : cartItems.map((i) => i.cartItemId));
  };

  // Group items by productId while preserving their order in cartItems
  const groupedProducts = cartItems.reduce<{
    productId: number;
    productName: string;
    items: CartType.ICartItem[];
  }[]>((acc, item) => {
    let group = acc.find((g) => g.productId === item.productId);
    if (!group) {
      group = {
        productId: item.productId,
        productName: item.productName,
        items: [],
      };
      acc.push(group);
    }
    group.items.push(item);
    return acc;
  }, []);

  const isGroupSelected = (groupItems: CartType.ICartItem[]) => {
    return groupItems.every((item) => selectedItemIds.includes(item.cartItemId));
  };

  const toggleGroup = (groupItems: CartType.ICartItem[]) => {
    const itemIds = groupItems.map((item) => item.cartItemId);
    const allSelected = isGroupSelected(groupItems);
    if (allSelected) {
      setSelectedItemIds((prev) => prev.filter((id) => !itemIds.includes(id)));
    } else {
      setSelectedItemIds((prev) => {
        const filtered = prev.filter((id) => !itemIds.includes(id));
        return [...filtered, ...itemIds];
      });
    }
  };

  return (
    <div className="cart-page">
      <div className="cart-container">
        <Title level={3} className="cart-title">
          <ShoppingCartOutlined /> Giỏ Hàng
        </Title>
        <div className="cart-header-table">
          <div className="header-check">
            <input
              type="checkbox"
              checked={isAllSelected}
              onChange={toggleAll}
              id="select-all"
              className="cart-checkbox"
            />
            <label htmlFor="select-all">Tất cả</label>
          </div>
          <div style={{ textAlign: "center" }}>Sản phẩm</div>
          <div style={{ textAlign: "center" }}>Đơn giá</div>
          <div style={{ textAlign: "center" }}>Số lượng</div>
          <div style={{ textAlign: "center" }}>Số tiền</div>
          <div style={{ textAlign: "center" }}>Thao tác</div>
        </div>
        <div className="cart-groups-list">
          {groupedProducts.map((group) => {
            const groupSelected = isGroupSelected(group.items);
            return (
              <div key={group.productId} className="cart-product-group">
                <div className="group-header">
                  <input
                    type="checkbox"
                    checked={groupSelected}
                    onChange={() => toggleGroup(group.items)}
                    className="cart-checkbox"
                  />
                  <ShopOutlined style={{ color: "#af101a", fontSize: "16px", marginLeft: "4px" }} />
                  <Link to={`/products/${group.productId}`} className="group-product-link">
                    {group.productName}
                  </Link>
                </div>
                <div className="group-items">
                  {group.items.map((item) => (
                    <CartItem
                      key={item.cartItemId}
                      item={item}
                      onUpdate={(qty: number) => updateQty.mutate({ id: item.cartItemId, qty })}
                      onRemove={() => removeIdx.mutate(item.cartItemId)}
                      loading={updateQty.isPending || removeIdx.isPending}
                      checked={selectedItemIds.includes(item.cartItemId)}
                      onToggle={() => toggleItem(item.cartItemId)}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
        <div className="cart-summary-bar">
          <div className="total-label">Tổng thanh toán ({selectedItems.length} sản phẩm được chọn):</div>
          <div className="total-amount">{formatPrice(totalPrice)}</div>
          <Button
            type="primary"
            className="checkout-btn"
            onClick={() => {
              if (selectedItemIds.length === 0) {
                message.warning("Vui lòng chọn ít nhất một sản phẩm để mua!");
                return;
              }
              setIsCheckoutModalOpen(true);
            }}
          >
            Mua Hàng ({selectedItems.length})
          </Button>
        </div>
      </div>

      <CheckoutModal
        open={isCheckoutModalOpen}
        onCancel={() => setIsCheckoutModalOpen(false)}
        selectedAddress={selectedAddress}
        onOpenAddressSelect={() => setIsAddressSelectModalOpen(true)}
        onOpenAddAddress={() => setIsAddNewAddressOpen(true)}
        selectedItemsCount={selectedItems.length}
        totalPrice={totalPrice}
        loading={createOrderMutation.isPending}
        onSubmit={handleCheckoutSubmit}
      />

      <AddressSelectModal
        open={isAddressSelectModalOpen}
        onCancel={() => setIsAddressSelectModalOpen(false)}
        addresses={addresses}
        selectedAddress={selectedAddress}
        onSelect={(addr) => setSelectedAddressId(addr.id)}
        onOpenAddAddress={() => setIsAddNewAddressOpen(true)}
      />

      <AddAddressModal
        open={isAddNewAddressOpen}
        onCancel={() => setIsAddNewAddressOpen(false)}
        loading={addNewAddressMutation.isPending}
        onSubmit={(values) => {
          addNewAddressMutation.mutate({
            userId: userId!,
            recipient_name: values.recipient_name,
            phone: values.phone,
            address_line: values.address_line,
            city: values.city,
            is_default: !!values.is_default,
          });
        }}
      />
    </div>
  );
};

export default Cart;
