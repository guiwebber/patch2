export type ProductVariation = {
  id: number;
  productId: number;
  name: string;
  image: string;
  colorHex?: string;
  order: number;
  active: boolean;
};

export type Product = {
  id: number;
  name: string;
  category: string;
  description: string;
  price: number;
  oldPrice?: number;
  image: string;
  images?: string[];
  featured?: boolean;
  active?: boolean;
  hasVariations?: boolean;
  variations?: ProductVariation[];
  peso: number;
  altura: number;
  largura: number;
  comprimento: number;
  producaoMinDias: number;
  producaoMaxDias: number;
};

export type CartItem = {
  product: Product;
  quantity: number;
  variation?: ProductVariation;
};
