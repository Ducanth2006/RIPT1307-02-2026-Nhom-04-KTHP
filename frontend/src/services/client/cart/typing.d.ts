export namespace Cart {
  export interface ICartItem {
    cartItemId: number;
    quantity: number;
    variantId: number;
    sku: string;
    size: string;
    color: string;
    price: number;
    stockQuantity: number;
    productId: number;
    productName: string;
    imageUrl?: string;
  }

  export interface ICartState {
    items: ICartItem[];
    totalItems: number;
    totalPrice: number;
  }

  export interface IGetCartResponse {
    message: string;
    data: ICartItem[];
  }

  export interface IAddToCartRequest {
    userId: number;
    variantId: number;
    quantity: number;
  }

  export interface ICommonResponse {
    message: string;
  }
}
