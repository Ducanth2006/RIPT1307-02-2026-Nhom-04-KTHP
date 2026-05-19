export namespace Products {
  export interface IVariant {
    id: number;
    sku: string;
    size: string;
    color: string;
    price: number;
    stock_quantity: number;
  }

  export interface IRecord {
    id: number;
    name: string;
    description: string;
    base_price: number;
    status: string;
    brand: string;
    created_at: string;
    categories: {
      id: number;
      name: string;
      slug: string;
    };
    product_images: {
      id: number;
      is_main: boolean;
      image_url: string;
    }[];
    product_variants?: IVariant[];
  }

  export interface IResponse {
    message: string;
    data: IRecord[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  }

  export interface IDetailResponse {
    message: string;
    data: IRecord;
  }
}
