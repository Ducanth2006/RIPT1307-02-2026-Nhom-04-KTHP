import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { Cart } from "../../services/client/cart/typing";

const initialState: Cart.ICartState = {
  items: JSON.parse(localStorage.getItem("cart_items") || "[]"),
  totalItems: 0,
  totalPrice: 0,
};

// Hàm tính toán tổng tiền và số lượng
const calculateTotals = (state: Cart.ICartState) => {
  state.totalItems = state.items.reduce((sum, item) => sum + item.quantity, 0);
  state.totalPrice = state.items.reduce((sum, item) => {
    return sum + (item.price || 0) * item.quantity;
  }, 0);
  localStorage.setItem("cart_items", JSON.stringify(state.items));
};

// Khởi tạo giá trị ban đầu nếu có dữ liệu từ localStorage
calculateTotals(initialState);

export const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {
    addToCart: (state, action: PayloadAction<Cart.ICartItem>) => {
      const existingItem = state.items.find((item) => item.variantId === action.payload.variantId);
      if (existingItem) {
        existingItem.quantity += action.payload.quantity;
      } else {
        state.items.push(action.payload);
      }
      calculateTotals(state);
    },
    updateQuantity: (state, action: PayloadAction<{ variantId: number; quantity: number }>) => {
      const item = state.items.find((i) => i.variantId === action.payload.variantId);
      if (item) {
        item.quantity = action.payload.quantity;
      }
      calculateTotals(state);
    },
    removeFromCart: (state, action: PayloadAction<number>) => {
      state.items = state.items.filter((item) => item.variantId !== action.payload);
      calculateTotals(state);
    },
    clearCart: (state) => {
      state.items = [];
      calculateTotals(state);
    },
  },
});

export const { addToCart, updateQuantity, removeFromCart, clearCart } = cartSlice.actions;
export default cartSlice.reducer;
