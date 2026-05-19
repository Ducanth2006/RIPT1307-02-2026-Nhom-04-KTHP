import { Products } from "../Product/typing";

export namespace Cart {
  export interface ICartItem extends Products.IRecord {
    selectedVariantId: number;
    quantity: number;
  }

  export interface ICartState {
    items: ICartItem[];
    totalItems: number;
    totalPrice: number;
  }
}
