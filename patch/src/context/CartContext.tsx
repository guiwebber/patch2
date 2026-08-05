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
  ) => void;
  increaseCartQuantity: (productId: number, variationId?: number) => void;
  decreaseCartQuantity: (productId: number, variationId?: number) => void;
  removeFromCart: (productId: number, variationId?: number) => void;
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
  ) {
    if (quantity < 1) {
      return;
    }

    setCart((currentCart: CartItem[]) => {
      const existingItem = currentCart.find(
        (item: CartItem) =>
          item.product.id === product.id,
      );

      if (existingItem) {
        return currentCart.map(
          (item: CartItem) =>
            item.product.id === product.id
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
        },
      ];
    });
  }

  function increaseCartQuantity(productId: number, variationId?: number) {
    setCart((currentCart: CartItem[]) =>
      currentCart.map((item: CartItem) =>
        item.product.id === productId
          ? {
              ...item,
              quantity: item.quantity + 1,
            }
          : item,
      ),
    );
  }

  function decreaseCartQuantity(productId: number, variationId?: number) {
    setCart((currentCart: CartItem[]) =>
      currentCart
        .map((item: CartItem) =>
          item.product.id === productId
            ? {
                ...item,
                quantity: item.quantity - 1,
              }
            : item,
        )
        .filter(
          (item: CartItem) =>
            item.quantity > 0,
        ),
    );
  }

  function removeFromCart(productId: number, variationId?: number) {
    setCart((currentCart: CartItem[]) =>
      currentCart.filter(
        (item: CartItem) =>
          item.product.id !== productId,
      ),
    );
  }

  function clearCart() {
    setCart([]);
  }

  const cartQuantity = useMemo(
    () =>
      cart.reduce(
        (total: number, item: CartItem) =>
          total + item.quantity,
        0,
      ),
    [cart],
  );

  const cartTotal = useMemo(
    () =>
      cart.reduce(
        (total: number, item: CartItem) =>
          total +
          item.product.price * item.quantity,
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
              (item: CartItem) =>
                item.product.producaoMinDias,
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
              (item: CartItem) =>
                item.product.producaoMaxDias,
            ),
          ),
    [cart],
  );

  const pesoTotal = useMemo(
    () =>
      cart.reduce(
        (total: number, item: CartItem) =>
          total +
          item.product.peso * item.quantity,
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
              (item: CartItem) =>
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
              (item: CartItem) =>
                item.product.largura,
            ),
          ),
    [cart],
  );

  const maiorComprimento = useMemo(
    () =>
      cart.length === 0
        ? 0
        : Math.max(
            ...cart.map(
              (item: CartItem) =>
                item.product.comprimento,
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
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(
      "useCart precisa ser utilizado dentro de CartProvider.",
    );
  }

  return context;
}
