import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import type { Product } from "../../types/product";

type StoreContextData = {
  favorites: Product[];
  favoritesOpen: boolean;
  selectedCategory: string;
  setFavoritesOpen: (open: boolean) => void;
  setSelectedCategory: (category: string) => void;
  toggleFavorite: (product: Product) => void;
  removeFavorite: (productId: number) => void;
  clearFavorites: () => void;
  isFavorite: (productId: number) => boolean;
};

const FAVORITES_KEY = "patchwork:favorites";

const StoreContext = createContext<StoreContextData | undefined>(
  undefined,
);

type StoreProviderProps = {
  children: ReactNode;
};

function readSavedFavorites(): Product[] {
  try {
    const savedFavorites = localStorage.getItem(FAVORITES_KEY);

    if (!savedFavorites) {
      return [];
    }

    const parsedFavorites = JSON.parse(savedFavorites);

    return Array.isArray(parsedFavorites) ? parsedFavorites : [];
  } catch {
    return [];
  }
}

export function StoreProvider({ children }: StoreProviderProps) {
  const [favorites, setFavorites] = useState<Product[]>(
    readSavedFavorites,
  );
  const [favoritesOpen, setFavoritesOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] =
    useState("Todos");

  useEffect(() => {
    localStorage.setItem(
      FAVORITES_KEY,
      JSON.stringify(favorites),
    );
  }, [favorites]);

  function toggleFavorite(product: Product) {
    setFavorites((currentFavorites) => {
      const alreadyFavorite = currentFavorites.some(
        (favorite) => favorite.id === product.id,
      );

      if (alreadyFavorite) {
        return currentFavorites.filter(
          (favorite) => favorite.id !== product.id,
        );
      }

      return [...currentFavorites, product];
    });
  }

  function removeFavorite(productId: number) {
    setFavorites((currentFavorites) =>
      currentFavorites.filter(
        (favorite) => favorite.id !== productId,
      ),
    );
  }

  function clearFavorites() {
    setFavorites([]);
  }

  function isFavorite(productId: number) {
    return favorites.some(
      (favorite) => favorite.id === productId,
    );
  }

  const value = useMemo(
    () => ({
      favorites,
      favoritesOpen,
      selectedCategory,
      setFavoritesOpen,
      setSelectedCategory,
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
