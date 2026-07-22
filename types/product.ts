export type Product = {
  id: number;
  name: string;
  category: string;
  description: string;
  price: number;
  oldPrice?: number;
  image: string;
  featured?: boolean;
};

export type CartItem = {
  product: Product;
  quantity: number;
};