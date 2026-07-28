import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import type { Product } from "../../types/product";
import { useAuth } from "./AuthContext";

type StoreContextData = {
  favorites: Product[];
  favoritesOpen: boolean;
  selectedCategory: string;
  setFavoritesOpen: (open: boolean) => void;
  setSelectedCategory: (category: string) => void;
  addFavorite: (product: Product) => void;
  toggleFavorite: (product: Product) => void;
  removeFavorite: (productId: number) => void;
  clearFavorites: () => void;
  isFavorite: (productId: number) => boolean;
};

const StoreContext = createContext<StoreContextData | undefined>(undefined);

type StoreProviderProps = {
  children: ReactNode;
};

function criarChaveFavoritos(usuarioId: number) {
  return `patchwork:favorites:usuario:${usuarioId}`;
}

function lerFavoritosSalvos(chave: string): Product[] {
  try {
    const valor = localStorage.getItem(chave);

    if (!valor) {
      return [];
    }

    const convertido: unknown = JSON.parse(valor);
    return Array.isArray(convertido) ? (convertido as Product[]) : [];
  } catch {
    return [];
  }
}

export function StoreProvider({ children }: StoreProviderProps) {
  const { usuario, carregandoAutenticacao } = useAuth();

  const [favorites, setFavorites] = useState<Product[]>([]);
  const [favoritesOpen, setFavoritesOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("Todos");

  const chaveCarregadaRef = useRef<string | null>(null);

  const chaveFavoritos = usuario
    ? criarChaveFavoritos(usuario.id)
    : null;

  useEffect(() => {
    if (carregandoAutenticacao) {
      return;
    }

    setFavoritesOpen(false);

    if (!chaveFavoritos) {
      chaveCarregadaRef.current = null;
      setFavorites([]);
      return;
    }

    chaveCarregadaRef.current = chaveFavoritos;
    setFavorites(lerFavoritosSalvos(chaveFavoritos));
  }, [carregandoAutenticacao, chaveFavoritos]);

  useEffect(() => {
    if (!chaveFavoritos || chaveCarregadaRef.current !== chaveFavoritos) {
      return;
    }

    if (favorites.length === 0) {
      localStorage.removeItem(chaveFavoritos);
      return;
    }

    localStorage.setItem(chaveFavoritos, JSON.stringify(favorites));
  }, [favorites, chaveFavoritos]);

  function addFavorite(product: Product) {
    if (!usuario) {
      return;
    }

    setFavorites((atuais) => {
      const jaExiste = atuais.some((item) => item.id === product.id);
      return jaExiste ? atuais : [...atuais, product];
    });
  }

  function toggleFavorite(product: Product) {
    if (!usuario) {
      return;
    }

    setFavorites((atuais) => {
      const jaExiste = atuais.some((item) => item.id === product.id);

      if (jaExiste) {
        return atuais.filter((item) => item.id !== product.id);
      }

      return [...atuais, product];
    });
  }

  function removeFavorite(productId: number) {
    if (!usuario) {
      return;
    }

    setFavorites((atuais) =>
      atuais.filter((item) => item.id !== productId),
    );
  }

  function clearFavorites() {
    setFavorites([]);
    setFavoritesOpen(false);

    if (chaveFavoritos) {
      localStorage.removeItem(chaveFavoritos);
    }
  }

  function isFavorite(productId: number) {
    return favorites.some((item) => item.id === productId);
  }

  const value = useMemo(
    () => ({
      favorites,
      favoritesOpen,
      selectedCategory,
      setFavoritesOpen,
      setSelectedCategory,
      addFavorite,
      toggleFavorite,
      removeFavorite,
      clearFavorites,
      isFavorite,
    }),
    [favorites, favoritesOpen, selectedCategory],
  );

  return (
    <StoreContext.Provider value={value}>
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const context = useContext(StoreContext);

  if (!context) {
    throw new Error(
      "useStore precisa ser utilizado dentro de StoreProvider.",
    );
  }

  return context;
}
