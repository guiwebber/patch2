import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import type {
  CartItem,
  Product,
  ProductVariation,
} from "../../types/product";

type CartContextData = {
  cart: CartItem[];
  cartQuantity: number;
  cartTotal: number;
  producaoMinDias: number;
  producaoMaxDias: number;
  pesoTotal: number;
  maiorAltura: number;
  maiorLargura: number;
  maiorComprimento: number;

  addToCart: (
    product: Product,
    quantity?: number,
    variation?: ProductVariation,
  ) => void;

  increaseCartQuantity: (
    productId: number,
    variationId?: number,
  ) => void;

  decreaseCartQuantity: (
    productId: number,
    variationId?: number,
  ) => void;

  removeFromCart: (
    productId: number,
    variationId?: number,
  ) => void;

  clearCart: () => void;
};

type CartProviderProps = {
  children: ReactNode;
};

const CART_KEY = "patchwork:cart";

const CartContext = createContext<
  CartContextData | undefined
>(undefined);

function readSavedCart(): CartItem[] {
  try {
    const savedCart = localStorage.getItem(CART_KEY);

    if (!savedCart) {
      return [];
    }

    const parsedCart: unknown = JSON.parse(savedCart);

    return Array.isArray(parsedCart)
      ? (parsedCart as CartItem[])
      : [];
  } catch {
    return [];
  }
}

export function CartProvider({
  children,
}: CartProviderProps) {
  const [cart, setCart] =
    useState<CartItem[]>(readSavedCart);

  useEffect(() => {
    localStorage.setItem(
      CART_KEY,
      JSON.stringify(cart),
    );
  }, [cart]);

  function addToCart(
    product: Product,
    quantity = 1,
    variation?: ProductVariation,
  ) {
    if (quantity < 1) {
      return;
    }

    setCart((currentCart) => {
      const existingItem = currentCart.find(
        (item) =>
          item.product.id === product.id &&
          item.variation?.id === variation?.id,
      );

      if (existingItem) {
        return currentCart.map((item) =>
          item.product.id === product.id &&
          item.variation?.id === variation?.id
            ? {
                ...item,
                quantity:
                  item.quantity + quantity,
              }
            : item,
        );
      }

      return [
        ...currentCart,
        {
          product,
          quantity,
          variation,
        },
      ];
    });
  }

  function increaseCartQuantity(
    productId: number,
    variationId?: number,
  ) {
    setCart((currentCart) =>
      currentCart.map((item) =>
        item.product.id === productId &&
        item.variation?.id === variationId
          ? {
              ...item,
              quantity: item.quantity + 1,
            }
          : item,
      ),
    );
  }

  function decreaseCartQuantity(
    productId: number,
    variationId?: number,
  ) {
    setCart((currentCart) =>
      currentCart
        .map((item) =>
          item.product.id === productId &&
          item.variation?.id === variationId
            ? {
                ...item,
                quantity:
                  item.quantity - 1,
              }
            : item,
        )
        .filter(
          (item) => item.quantity > 0,
        ),
    );
  }

  function removeFromCart(
    productId: number,
    variationId?: number,
  ) {
    setCart((currentCart) =>
      currentCart.filter(
        (item) =>
          !(
            item.product.id ===
              productId &&
            item.variation?.id ===
              variationId
          ),
      ),
    );
  }

  function clearCart() {
    setCart([]);
  }

  const cartQuantity = useMemo(
    () =>
      cart.reduce(
        (total, item) =>
          total + item.quantity,
        0,
      ),
    [cart],
  );

  const cartTotal = useMemo(
    () =>
      cart.reduce(
        (total, item) =>
          total +
          item.product.price *
            item.quantity,
        0,
      ),
    [cart],
  );

  const producaoMinDias = useMemo(
    () =>
      cart.length === 0
        ? 0
        : Math.max(
            ...cart.map(
              (item) =>
                item.product
                  .producaoMinDias,
            ),
          ),
    [cart],
  );

  const producaoMaxDias = useMemo(
    () =>
      cart.length === 0
        ? 0
        : Math.max(
            ...cart.map(
              (item) =>
                item.product
                  .producaoMaxDias,
            ),
          ),
    [cart],
  );

  const pesoTotal = useMemo(
    () =>
      cart.reduce(
        (total, item) =>
          total +
          item.product.peso *
            item.quantity,
        0,
      ),
    [cart],
  );

  const maiorAltura = useMemo(
    () =>
      cart.length === 0
        ? 0
        : Math.max(
            ...cart.map(
              (item) =>
                item.product.altura,
            ),
          ),
    [cart],
  );

  const maiorLargura = useMemo(
    () =>
      cart.length === 0
        ? 0
        : Math.max(
            ...cart.map(
              (item) =>
                item.product.largura,
            ),
          ),
    [cart],
  );

  const maiorComprimento =
    useMemo(
      () =>
        cart.length === 0
          ? 0
          : Math.max(
              ...cart.map(
                (item) =>
                  item.product
                    .comprimento,
              ),
            ),
      [cart],
    );

  const value = useMemo(
    () => ({
      cart,
      cartQuantity,
      cartTotal,
      producaoMinDias,
      producaoMaxDias,
      pesoTotal,
      maiorAltura,
      maiorLargura,
      maiorComprimento,
      addToCart,
      increaseCartQuantity,
      decreaseCartQuantity,
      removeFromCart,
      clearCart,
    }),
    [
      cart,
      cartQuantity,
      cartTotal,
      producaoMinDias,
      producaoMaxDias,
      pesoTotal,
      maiorAltura,
      maiorLargura,
      maiorComprimento,
    ],
  );

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context =
    useContext(CartContext);

  if (!context) {
    throw new Error(
      "useCart precisa ser utilizado dentro de CartProvider.",
    );
  }

  return context;
}