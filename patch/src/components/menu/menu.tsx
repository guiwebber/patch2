import { useState } from "react";
import {
  ChevronDown,
  Heart,
  LogOut,
  Menu,
  Trash2,
  User,
  X,
} from "lucide-react";
import {
  Link,
  useLocation,
  useNavigate,
} from "react-router-dom";

import { categories } from "../../../data/products";
import { useAuth } from "../../context/AuthContext";
import { useStore } from "../../context/StoreContext";

import "./menu.css";

export default function MenuBar() {
  const navigate = useNavigate();
  const location = useLocation();

  const { usuario, estaLogado, sair } = useAuth();
  const {
    favorites,
    favoritesOpen,
    selectedCategory,
    setFavoritesOpen,
    setSelectedCategory,
    removeFavorite,
    clearFavorites,
  } = useStore();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [categoriesOpen, setCategoriesOpen] =
    useState(false);

  function closeMenus() {
    setMobileOpen(false);
    setCategoriesOpen(false);
  }

  function scrollToSection(sectionId: string) {
    window.setTimeout(() => {
      document.getElementById(sectionId)?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 100);
  }

  function goHome() {
    closeMenus();

    if (location.pathname === "/") {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    navigate("/");
    window.setTimeout(() => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }, 100);
  }

  function goToProducts() {
    closeMenus();

    if (location.pathname !== "/") {
      navigate("/");
    }

    scrollToSection("produtos");
  }

  function chooseCategory(category: string) {
    setSelectedCategory(category);
    closeMenus();

    if (location.pathname !== "/") {
      navigate("/");
    }

    scrollToSection("produtos");
  }

  function goToContact() {
    closeMenus();
    scrollToSection("contato");
  }

  function handleLogout() {
    sair();
    closeMenus();
    navigate("/");
  }

  function viewFavoriteProduct(category: string) {
    setSelectedCategory(category);
    setFavoritesOpen(false);

    if (location.pathname !== "/") {
      navigate("/");
    }

    scrollToSection("produtos");
  }

  const firstName =
    usuario?.nome?.trim().split(" ")[0] || "Cliente";

  const userInitial =
    usuario?.nome?.trim().charAt(0).toUpperCase() || "U";

  return (
    <>
      <header className="site-header">
        <div className="menu-container">
          <button
            type="button"
            className="menu-logo"
            onClick={goHome}
          >
            PatchWork
          </button>

          <div className="menu-desktop">
            <nav className="desktop-nav">
              <button type="button" onClick={goHome}>
                Home
              </button>

              <button type="button" onClick={goToProducts}>
                Produtos
              </button>

              <div className="categories-dropdown">
                <button
                  type="button"
                  className="categories-trigger"
                  onClick={() =>
                    setCategoriesOpen(
                      (current) => !current,
                    )
                  }
                >
                  Categorias
                  <ChevronDown
                    size={17}
                    className={
                      categoriesOpen
                        ? "dropdown-chevron open"
                        : "dropdown-chevron"
                    }
                  />
                </button>

                {categoriesOpen && (
                  <div className="categories-dropdown-menu">
                    {categories.map((category) => (
                      <button
                        key={category}
                        type="button"
                        className={
                          selectedCategory === category
                            ? "active"
                            : ""
                        }
                        onClick={() =>
                          chooseCategory(category)
                        }
                      >
                        {category}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <button type="button" onClick={goToProducts}>
                Novidades
              </button>

              <Link to="/sobre" onClick={closeMenus}>
                Sobre Nós
              </Link>

              <button type="button" onClick={goToContact}>
                Contato
              </button>
            </nav>

            <div className="menu-actions">
              <button
                type="button"
                className="menu-icon-button favorites-menu-button"
                onClick={() => setFavoritesOpen(true)}
              >
                <Heart size={23} />

                {favorites.length > 0 && (
                  <span className="favorites-count">
                    {favorites.length}
                  </span>
                )}
              </button>

              {estaLogado && usuario ? (
                <div className="logged-user">
                  <button
                    type="button"
                    className="logged-user-profile"
                    onClick={() =>
                      navigate("/minha-conta")
                    }
                    title="Abrir minha conta"
                  >
                    {usuario.foto ? (
                      <img
                        src={usuario.foto}
                        alt={usuario.nome}
                        className="logged-user-photo"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <span className="logged-user-avatar">
                        {userInitial}
                      </span>
                    )}

                    <span className="logged-user-name">
                      {firstName}
                    </span>
                  </button>

                  <button
                    type="button"
                    className="logout-button"
                    onClick={handleLogout}
                  >
                    <LogOut size={19} />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  className="menu-icon-button"
                  onClick={() => navigate("/login")}
                >
                  <User size={23} />
                </button>
              )}
            </div>
          </div>

          <button
            type="button"
            className="mobile-menu-button"
            onClick={() =>
              setMobileOpen((current) => !current)
            }
          >
            {mobileOpen ? (
              <X size={29} />
            ) : (
              <Menu size={29} />
            )}
          </button>
        </div>

        {mobileOpen && (
          <div className="mobile-menu">
            {estaLogado && usuario && (
              <button
                type="button"
                onClick={() => {
                  closeMenus();
                  navigate("/minha-conta");
                }}
              >
                <User size={19} />
                Minha conta
              </button>
            )}

            <button type="button" onClick={goHome}>
              Home
            </button>

            <button type="button" onClick={goToProducts}>
              Produtos
            </button>

            <button
              type="button"
              className="mobile-categories-trigger"
              onClick={() =>
                setCategoriesOpen(
                  (current) => !current,
                )
              }
            >
              Categorias
              <ChevronDown size={17} />
            </button>

            {categoriesOpen && (
              <div className="mobile-categories">
                {categories.map((category) => (
                  <button
                    key={category}
                    type="button"
                    onClick={() =>
                      chooseCategory(category)
                    }
                  >
                    {category}
                  </button>
                ))}
              </div>
            )}

            <Link to="/sobre" onClick={closeMenus}>
              Sobre Nós
            </Link>

            <button type="button" onClick={goToContact}>
              Contato
            </button>

            <button
              type="button"
              onClick={() => {
                setFavoritesOpen(true);
                closeMenus();
              }}
            >
              <Heart size={19} />
              Favoritos ({favorites.length})
            </button>

            {!estaLogado ? (
              <button
                type="button"
                onClick={() => navigate("/login")}
              >
                <User size={19} />
                Entrar
              </button>
            ) : (
              <button
                type="button"
                className="mobile-logout-button"
                onClick={handleLogout}
              >
                <LogOut size={19} />
                Sair
              </button>
            )}
          </div>
        )}
      </header>

      {favoritesOpen && (
        <>
          <button
            type="button"
            className="favorites-overlay"
            onClick={() => setFavoritesOpen(false)}
          />

          <aside className="favorites-drawer">
            <div className="favorites-header">
              <div>
                <span>Minha seleção</span>
                <h2>Favoritos</h2>
                <p>
                  {favorites.length}{" "}
                  {favorites.length === 1
                    ? "produto salvo"
                    : "produtos salvos"}
                </p>
              </div>

              <button
                type="button"
                className="favorites-close"
                onClick={() => setFavoritesOpen(false)}
              >
                <X size={24} />
              </button>
            </div>

            {favorites.length === 0 ? (
              <div className="empty-favorites">
                <Heart size={58} />
                <h3>Nenhum favorito ainda</h3>
                <p>
                  Toque no coração de um produto para
                  guardá-lo aqui.
                </p>
              </div>
            ) : (
              <>
                <div className="favorites-list">
                  {favorites.map((product) => (
                    <article
                      className="favorite-item"
                      key={product.id}
                    >
                      <img
                        src={product.image}
                        alt={product.name}
                      />

                      <div className="favorite-item-content">
                        <span>{product.category}</span>
                        <h3>{product.name}</h3>

                        <button
                          type="button"
                          className="view-favorite-button"
                          onClick={() =>
                            viewFavoriteProduct(
                              product.category,
                            )
                          }
                        >
                          Ver produto
                        </button>
                      </div>

                      <button
                        type="button"
                        className="remove-favorite-button"
                        onClick={() =>
                          removeFavorite(product.id)
                        }
                      >
                        <Trash2 size={18} />
                      </button>
                    </article>
                  ))}
                </div>

                <div className="favorites-footer">
                  <button
                    type="button"
                    onClick={clearFavorites}
                  >
                    Limpar favoritos
                  </button>
                </div>
              </>
            )}
          </aside>
        </>
      )}
    </>
  );
}
