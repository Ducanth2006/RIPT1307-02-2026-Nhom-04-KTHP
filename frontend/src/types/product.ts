export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  originalPrice?: number;
  images: string[];
  description: string;
  rating: number;
  sold: number;
  isNew?: boolean;
  isBestSeller?: boolean;
}
