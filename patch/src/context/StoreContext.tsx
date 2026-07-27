import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import type {
  Product,
} from "../../types/product";

import {
  useAuth,
} from "./AuthContext";

type StoreContextData = {
  favorites: Product[];
  favoritesOpen: boolean;
  selectedCategory: string;

  setFavoritesOpen: (
    open: boolean,
  ) => void;

  setSelectedCategory: (
    category: string,
  ) => void;

  toggleFavorite: (
    product: Product,
  ) => void;

  removeFavorite: (
    productId: number,
  ) => void;

  clearFavorites: () => void;

  isFavorite: (
    productId: number,
  ) => boolean;
};

const StoreContext =
  createContext<
    StoreContextData | undefined
  >(undefined);

type StoreProviderProps = {
  children: ReactNode;
};

function criarChaveFavoritos(
  usuarioId?: number,
) {
  if (
    Number.isInteger(usuarioId)
  ) {
    return `patchwork:favorites:usuario:${usuarioId}`;
  }

  return "patchwork:favorites:visitante";
}

function lerFavoritosSalvos(
  chave: string,
): Product[] {
  try {
    const favoritosSalvos =
      localStorage.getItem(
        chave,
      );

    if (!favoritosSalvos) {
      return [];
    }

    const favoritosConvertidos =
      JSON.parse(
        favoritosSalvos,
      );

    return Array.isArray(
      favoritosConvertidos,
    )
      ? favoritosConvertidos
      : [];
  } catch {
    return [];
  }
}

export function StoreProvider({
  children,
}: StoreProviderProps) {
  const {
    usuario,
    carregandoAutenticacao,
  } = useAuth();

  const chaveFavoritos =
    criarChaveFavoritos(
      usuario?.id,
    );

  const [
    favorites,
    setFavorites,
  ] = useState<Product[]>([]);

  const [
    favoritesOpen,
    setFavoritesOpen,
  ] = useState(false);

  const [
    selectedCategory,
    setSelectedCategory,
  ] = useState("Todos");

  /*
   * Evita salvar os favoritos da conta
   * anterior na chave da nova conta
   * durante a troca de usuário.
   */
  const ignorarProximoSalvamento =
    useRef(true);

  useEffect(() => {
    if (
      carregandoAutenticacao
    ) {
      return;
    }

    const favoritosDaConta =
      lerFavoritosSalvos(
        chaveFavoritos,
      );

    ignorarProximoSalvamento.current =
      true;

    setFavorites(
      favoritosDaConta,
    );

    setFavoritesOpen(false);
  }, [
    carregandoAutenticacao,
    chaveFavoritos,
  ]);

  useEffect(() => {
    if (
      carregandoAutenticacao
    ) {
      return;
    }

    if (
      ignorarProximoSalvamento.current
    ) {
      ignorarProximoSalvamento.current =
        false;

      return;
    }

    if (
      favorites.length === 0
    ) {
      localStorage.removeItem(
        chaveFavoritos,
      );

      return;
    }

    localStorage.setItem(
      chaveFavoritos,
      JSON.stringify(
        favorites,
      ),
    );
  }, [
    favorites,
    chaveFavoritos,
    carregandoAutenticacao,
  ]);

  function toggleFavorite(
    product: Product,
  ) {
    setFavorites(
      (
        currentFavorites,
      ) => {
        const alreadyFavorite =
          currentFavorites.some(
            (favorite) =>
              favorite.id ===
              product.id,
          );

        if (alreadyFavorite) {
          return currentFavorites.filter(
            (favorite) =>
              favorite.id !==
              product.id,
          );
        }

        return [
          ...currentFavorites,
          product,
        ];
      },
    );
  }

  function removeFavorite(
    productId: number,
  ) {
    setFavorites(
      (
        currentFavorites,
      ) =>
        currentFavorites.filter(
          (favorite) =>
            favorite.id !==
            productId,
        ),
    );
  }

  function clearFavorites() {
    setFavorites([]);
    setFavoritesOpen(false);

    localStorage.removeItem(
      chaveFavoritos,
    );
  }

  function isFavorite(
    productId: number,
  ) {
    return favorites.some(
      (favorite) =>
        favorite.id ===
        productId,
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
    [
      favorites,
      favoritesOpen,
      selectedCategory,
    ],
  );

  return (
    <StoreContext.Provider
      value={value}
    >
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const context =
    useContext(StoreContext);

  if (!context) {
    throw new Error(
      "useStore precisa ser utilizado dentro de StoreProvider.",
    );
  }

  return context;
}