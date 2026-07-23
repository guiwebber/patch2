export type Product = {
  id: number;
  name: string;
  category: string;
  description: string;
  price: number;
  oldPrice?: number;
  image: string;
  featured?: boolean;

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
};
