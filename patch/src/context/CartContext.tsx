import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import type { CartItem, Product } from "../../types/product";
import { useAuth } from "./AuthContext";

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
  addToCart: (product: Product, quantity?: number) => void;
  increaseCartQuantity: (productId: number) => void;
  decreaseCartQuantity: (productId: number) => void;
  removeFromCart: (productId: number) => void;
  clearCart: () => void;
};

type CartProviderProps = {
  children: ReactNode;
};

const CartContext = createContext<CartContextData | undefined>(undefined);

function criarChaveCarrinho(usuarioId: number) {
  return `patchwork:cart:usuario:${usuarioId}`;
}

function lerCarrinhoSalvo(chave: string): CartItem[] {
  try {
    const valor = localStorage.getItem(chave);

    if (!valor) {
      return [];
    }

    const convertido: unknown = JSON.parse(valor);
    return Array.isArray(convertido) ? (convertido as CartItem[]) : [];
  } catch {
    return [];
  }
}

export function CartProvider({ children }: CartProviderProps) {
  const { usuario, carregandoAutenticacao } = useAuth();

  const [cart, setCart] = useState<CartItem[]>([]);
  const chaveCarregadaRef = useRef<string | null>(null);

  const chaveCarrinho = usuario
    ? criarChaveCarrinho(usuario.id)
    : null;

  useEffect(() => {
    if (carregandoAutenticacao) {
      return;
    }

    if (!chaveCarrinho) {
      chaveCarregadaRef.current = null;
      setCart([]);
      return;
    }

    chaveCarregadaRef.current = chaveCarrinho;
    setCart(lerCarrinhoSalvo(chaveCarrinho));
  }, [carregandoAutenticacao, chaveCarrinho]);

  useEffect(() => {
    if (!chaveCarrinho || chaveCarregadaRef.current !== chaveCarrinho) {
      return;
    }

    if (cart.length === 0) {
      localStorage.removeItem(chaveCarrinho);
      return;
    }

    localStorage.setItem(chaveCarrinho, JSON.stringify(cart));
  }, [cart, chaveCarrinho]);

  function addToCart(product: Product, quantity = 1) {
    if (!usuario || quantity < 1) {
      return;
    }

    setCart((atual) => {
      const existente = atual.find(
        (item) => item.product.id === product.id,
      );

      if (existente) {
        return atual.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item,
        );
      }

      return [...atual, { product, quantity }];
    });
  }

  function increaseCartQuantity(productId: number) {
    setCart((atual) =>
      atual.map((item) =>
        item.product.id === productId
          ? { ...item, quantity: item.quantity + 1 }
          : item,
      ),
    );
  }

  function decreaseCartQuantity(productId: number) {
    setCart((atual) =>
      atual
        .map((item) =>
          item.product.id === productId
            ? { ...item, quantity: item.quantity - 1 }
            : item,
        )
        .filter((item) => item.quantity > 0),
    );
  }

  function removeFromCart(productId: number) {
    setCart((atual) =>
      atual.filter((item) => item.product.id !== productId),
    );
  }

  function clearCart() {
    setCart([]);

    if (chaveCarrinho) {
      localStorage.removeItem(chaveCarrinho);
    }
  }

  const cartQuantity = useMemo(
    () => cart.reduce((total, item) => total + item.quantity, 0),
    [cart],
  );

  const cartTotal = useMemo(
    () =>
      cart.reduce(
        (total, item) => total + item.product.price * item.quantity,
        0,
      ),
    [cart],
  );

  const producaoMinDias = useMemo(
    () =>
      cart.length === 0
        ? 0
        : Math.max(...cart.map((item) => item.product.producaoMinDias)),
    [cart],
  );

  const producaoMaxDias = useMemo(
    () =>
      cart.length === 0
        ? 0
        : Math.max(...cart.map((item) => item.product.producaoMaxDias)),
    [cart],
  );

  const pesoTotal = useMemo(
    () =>
      cart.reduce(
        (total, item) => total + item.product.peso * item.quantity,
        0,
      ),
    [cart],
  );

  const maiorAltura = useMemo(
    () =>
      cart.length === 0
        ? 0
        : Math.max(...cart.map((item) => item.product.altura)),
    [cart],
  );

  const maiorLargura = useMemo(
    () =>
      cart.length === 0
        ? 0
        : Math.max(...cart.map((item) => item.product.largura)),
    [cart],
  );

  const maiorComprimento = useMemo(
    () =>
      cart.length === 0
        ? 0
        : Math.max(...cart.map((item) => item.product.comprimento)),
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
