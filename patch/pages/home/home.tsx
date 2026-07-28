import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ChevronLeft,
  ChevronRight,
  Clock3,
  Heart,
  Minus,
  Plus,
  Search,
  ShoppingBag,
  ShoppingCart,
  Trash2,
  X,
} from "lucide-react";

import { useAuth } from "../../src/context/AuthContext";
import { useCart } from "../../src/context/CartContext";
import { useStore } from "../../src/context/StoreContext";
import { categories } from "../../data/products";
import type { Product } from "../../types/product";

import "./home.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

const PENDING_ACTION_KEY = "patchwork:pending-action";

type PendingAction =
  | { type: "favorite"; product: Product }
  | { type: "cart"; product: Product; quantity: number };

const heroSlides = [
  {
    image:
      "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1600&q=80",
    label: "Feito à mão",
    title: "Peças exclusivas",
    description: "Produção artesanal e acabamento delicado.",
  },
  {
    image:
      "https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?auto=format&fit=crop&w=1400&q=85",
    label: "Detalhes que encantam",
    title: "Cuidado em cada ponto",
    description: "Tecidos escolhidos com carinho para transformar ambientes.",
  },
  {
    image:
      "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1400&q=85",
    label: "Arte em tecidos",
    title: "Sua casa mais acolhedora",
    description: "Peças feitas sob encomenda para combinar com o seu estilo.",
  },
];

export default function Home() {
  const navigate = useNavigate();
  const { estaLogado } = useAuth();
  const {
    cart,
    cartQuantity,
    cartTotal,
    addToCart,
    increaseCartQuantity,
    decreaseCartQuantity,
    removeFromCart,
  } = useCart();

  const {
    selectedCategory,
    setSelectedCategory,
    addFavorite,
    toggleFavorite,
    isFavorite,
  } = useStore();

  const [products, setProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [productsError, setProductsError] = useState("");

  const [search, setSearch] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [modalQuantity, setModalQuantity] = useState(1);

  const [modalImageIndex, setModalImageIndex] = useState(0);

  const [heroIndex, setHeroIndex] = useState(0);

  const [cartOpen, setCartOpen] = useState(false);

  useEffect(() => {
    let ativo = true;

    async function carregarProdutos() {
      try {
        setProductsLoading(true);
        const response = await fetch(`${API_URL}/produtos`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.erro || "Não foi possível carregar os produtos.",
          );
        }

        if (ativo) {
          setProducts(Array.isArray(data.produtos) ? data.produtos : []);
          setProductsError("");
        }
      } catch (error) {
        if (ativo) {
          setProductsError(
            error instanceof Error
              ? error.message
              : "Erro ao carregar produtos.",
          );
        }
      } finally {
        if (ativo) setProductsLoading(false);
      }
    }

    void carregarProdutos();
    return () => {
      ativo = false;
    };
  }, []);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setHeroIndex((current) => (current + 1) % heroSlides.length);
    }, 5000);

    return () => {
      window.clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    document.body.style.overflow = selectedProduct ? "hidden" : "";

    return () => {
      document.body.style.overflow = "";
    };
  }, [selectedProduct]);

  useEffect(() => {
    if (!estaLogado) {
      return;
    }

    const pendingValue = sessionStorage.getItem(PENDING_ACTION_KEY);

    if (!pendingValue) {
      return;
    }

    sessionStorage.removeItem(PENDING_ACTION_KEY);

    try {
      const pending = JSON.parse(pendingValue) as PendingAction;

      if (pending.type === "favorite") {
        addFavorite(pending.product);
        return;
      }

      if (pending.type === "cart") {
        addToCart(pending.product, pending.quantity);
        setCartOpen(true);
      }
    } catch (error) {
      console.error("Não foi possível concluir a ação após o login:", error);
    }
  }, [estaLogado, addFavorite, addToCart]);

  const filteredProducts = useMemo(() => {
    const searchNormalized = search.trim().toLowerCase();

    return products.filter((product) => {
      const matchesCategory =
        selectedCategory === "Todos" || product.category === selectedCategory;

      const matchesSearch =
        product.name.toLowerCase().includes(searchNormalized) ||
        product.description.toLowerCase().includes(searchNormalized);

      return matchesCategory && matchesSearch;
    });
  }, [products, search, selectedCategory]);

  function openProduct(product: Product) {
    setSelectedProduct(product);
    setModalQuantity(1);
    setModalImageIndex(0);
  }

  function closeProduct() {
    setSelectedProduct(null);
    setModalQuantity(1);
    setModalImageIndex(0);
  }

  function changeHero(direction: "previous" | "next") {
    setHeroIndex((current) => {
      if (direction === "previous") {
        return current === 0 ? heroSlides.length - 1 : current - 1;
      }

      return (current + 1) % heroSlides.length;
    });
  }

  function changeModalImage(direction: "previous" | "next") {
    if (!selectedProduct) {
      return;
    }

    const images = selectedProduct.images?.length
      ? selectedProduct.images
      : [selectedProduct.image];

    setModalImageIndex((current) => {
      if (direction === "previous") {
        return current === 0 ? images.length - 1 : current - 1;
      }

      return (current + 1) % images.length;
    });
  }

  function irParaLoginComAcao(acao: PendingAction) {
    sessionStorage.setItem(PENDING_ACTION_KEY, JSON.stringify(acao));

    closeProduct();
    setCartOpen(false);

    navigate("/login", {
      state: {
        redirectTo: "/",
      },
    });
  }

  function handleToggleFavorite(product: Product) {
    if (!estaLogado) {
      irParaLoginComAcao({
        type: "favorite",
        product,
      });
      return;
    }

    toggleFavorite(product);
  }

  function handleAddToCart(product: Product, quantity = 1) {
    if (!estaLogado) {
      irParaLoginComAcao({
        type: "cart",
        product,
        quantity,
      });
      return;
    }

    addToCart(product, quantity);
    closeProduct();
    setCartOpen(true);
  }

  function finalizarCompra() {
    setCartOpen(false);

    if (!estaLogado) {
      navigate("/login", {
        state: {
          redirectTo: "/checkout",
        },
      });
      return;
    }

    navigate("/checkout");
  }

  function formatPrice(value: number) {
    return value.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  }

  return (
    <main className="home">
      <section className="hero">
        <div className="hero-content">
          <span className="hero-tag">Artesanato feito com carinho</span>

          <h1>Peças únicas para deixar sua casa ainda mais bonita</h1>

          <p>
            Conheça nossa coleção de produtos artesanais em patchwork, feitos
            com cuidado em cada detalhe.
          </p>

          <div className="made-to-order-notice">
            <Clock3 size={21} />
            <div>
              <strong>Produtos feitos sob encomenda</strong>
              <span>
                A produção começa após a confirmação do pagamento. O prazo varia
                conforme cada peça.
              </span>
            </div>
          </div>

          <a className="hero-button" href="#produtos">
            Ver produtos
            <ShoppingBag size={20} />
          </a>
        </div>

        <div className="hero-art">
          {heroSlides.map((slide, index) => (
            <img
              key={slide.image}
              src={slide.image}
              alt={slide.title}
              className={
                index === heroIndex ? "hero-slide active" : "hero-slide"
              }
            />
          ))}

          <div className="hero-art-overlay" />

          <button
            type="button"
            className="hero-arrow hero-arrow-left"
            onClick={() => changeHero("previous")}
            aria-label="Imagem anterior"
          >
            <ChevronLeft size={25} />
          </button>

          <button
            type="button"
            className="hero-arrow hero-arrow-right"
            onClick={() => changeHero("next")}
            aria-label="Próxima imagem"
          >
            <ChevronRight size={25} />
          </button>

          <div className="hero-art-card">
            <span>{heroSlides[heroIndex].label}</span>
            <strong>{heroSlides[heroIndex].title}</strong>
            <p>{heroSlides[heroIndex].description}</p>
          </div>

          <div className="hero-dots">
            {heroSlides.map((slide, index) => (
              <button
                type="button"
                key={slide.image}
                className={index === heroIndex ? "hero-dot active" : "hero-dot"}
                onClick={() => setHeroIndex(index)}
                aria-label={`Abrir imagem ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </section>

      <section className="benefits">
        <article>
          <strong>Produção artesanal</strong>
          <span>Cada peça é feita com atenção aos detalhes.</span>
        </article>

        <article>
          <strong>Envio para todo Brasil</strong>
          <span>Receba seus produtos com segurança.</span>
        </article>

        <article>
          <strong>Compra segura</strong>
          <span>Atendimento durante todo o pedido.</span>
        </article>
      </section>

      <section className="products-section" id="produtos">
        <div className="section-header">
          <div>
            <span className="section-label">Nossa coleção</span>

            <h2>Produtos em destaque</h2>

            <p>Escolha a peça que combina com sua casa.</p>
          </div>

          {selectedCategory !== "Todos" && (
            <button
              type="button"
              className="clear-category-button"
              onClick={() => setSelectedCategory("Todos")}
            >
              Limpar filtro
            </button>
          )}
        </div>

        <div className="product-tools">
          <div className="search-box">
            <Search size={20} />

            <input
              type="text"
              placeholder="Buscar produtos..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>

          <div className="categories">
            {categories.map((category) => (
              <button
                key={category}
                type="button"
                className={
                  selectedCategory === category
                    ? "category-button active"
                    : "category-button"
                }
                onClick={() => setSelectedCategory(category)}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {productsLoading ? (
          <div className="no-products">
            <h3>Carregando produtos...</h3>
          </div>
        ) : productsError ? (
          <div className="no-products">
            <h3>Não foi possível carregar</h3>
            <p>{productsError}</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="no-products">
            <Search size={42} />

            <h3>Nenhum produto encontrado</h3>

            <p>Tente buscar outro nome ou selecionar outra categoria.</p>
          </div>
        ) : (
          <div className="products-grid">
            {filteredProducts.map((product) => {
              const favorite = isFavorite(product.id);

              return (
                <article
                  className="product-card"
                  key={product.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => openProduct(product)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      openProduct(product);
                    }
                  }}
                >
                  <div className="product-image-wrapper">
                    <img
                      src={product.image}
                      alt={product.name}
                      className="product-image"
                    />

                    {product.featured && (
                      <span className="featured-badge">Destaque</span>
                    )}

                    {product.oldPrice && (
                      <span className="discount-badge">Oferta</span>
                    )}

                    <button
                      type="button"
                      className={
                        favorite ? "favorite-button active" : "favorite-button"
                      }
                      aria-label={
                        favorite
                          ? "Remover dos favoritos"
                          : "Adicionar aos favoritos"
                      }
                      title={
                        favorite
                          ? "Remover dos favoritos"
                          : "Adicionar aos favoritos"
                      }
                      onClick={(event) => {
                        event.stopPropagation();
                        handleToggleFavorite(product);
                      }}
                    >
                      <Heart
                        size={20}
                        fill={favorite ? "currentColor" : "none"}
                      />
                    </button>
                  </div>

                  <div className="product-content">
                    <span className="product-category">{product.category}</span>

                    <h3>{product.name}</h3>

                    <p>{product.description}</p>

                    <div className="production-time">
                      <Clock3 size={16} />
                      Produção em {product.producaoMinDias} a{" "}
                      {product.producaoMaxDias} dias úteis
                    </div>

                    <div className="product-price">
                      {product.oldPrice && (
                        <span>{formatPrice(product.oldPrice)}</span>
                      )}

                      <strong>{formatPrice(product.price)}</strong>
                    </div>

                    <div className="product-actions">
                      <button
                        type="button"
                        className="details-button"
                        onClick={(event) => {
                          event.stopPropagation();
                          handleAddToCart(product);
                        }}
                      >
                        <ShoppingCart size={19} />
                        Adicionar ao carrinho
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {cartQuantity > 0 && (
        <button
          type="button"
          className="floating-cart"
          onClick={() => setCartOpen(true)}
          aria-label="Abrir carrinho"
        >
          <ShoppingCart size={27} />
          <span className="floating-cart-count">{cartQuantity}</span>
        </button>
      )}

      {selectedProduct && (
        <div className="modal-overlay" onMouseDown={closeProduct}>
          <div
            className="product-modal"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              className="modal-close"
              onClick={closeProduct}
              aria-label="Fechar produto"
            >
              <X size={24} />
            </button>

            <div className="modal-gallery">
              <div className="modal-main-image">
                <img
                  key={modalImageIndex}
                  src={
                    selectedProduct.images?.[modalImageIndex] ||
                    selectedProduct.image
                  }
                  alt={`${selectedProduct.name} - foto ${modalImageIndex + 1}`}
                />

                {(selectedProduct.images?.length || 1) > 1 && (
                  <>
                    <button
                      type="button"
                      className="gallery-arrow gallery-arrow-left"
                      onClick={() => changeModalImage("previous")}
                      aria-label="Foto anterior"
                    >
                      <ChevronLeft size={24} />
                    </button>

                    <button
                      type="button"
                      className="gallery-arrow gallery-arrow-right"
                      onClick={() => changeModalImage("next")}
                      aria-label="Próxima foto"
                    >
                      <ChevronRight size={24} />
                    </button>

                    <span className="gallery-counter">
                      {modalImageIndex + 1}/{selectedProduct.images?.length}
                    </span>
                  </>
                )}
              </div>

              <div className="modal-thumbnails">
                {(selectedProduct.images?.length
                  ? selectedProduct.images
                  : [selectedProduct.image]
                ).map((image, index) => (
                  <button
                    type="button"
                    key={`${image}-${index}`}
                    className={
                      index === modalImageIndex
                        ? "modal-thumbnail active"
                        : "modal-thumbnail"
                    }
                    onClick={() => setModalImageIndex(index)}
                    aria-label={`Selecionar foto ${index + 1}`}
                  >
                    <img src={image} alt="" />
                  </button>
                ))}
              </div>
            </div>

            <div className="modal-content">
              <span className="product-category">
                {selectedProduct.category}
              </span>

              <div className="modal-title-row">
                <h2>{selectedProduct.name}</h2>

                <button
                  type="button"
                  className={
                    isFavorite(selectedProduct.id)
                      ? "modal-favorite-button active"
                      : "modal-favorite-button"
                  }
                  onClick={() => handleToggleFavorite(selectedProduct)}
                  aria-label="Alternar favorito"
                >
                  <Heart
                    size={22}
                    fill={
                      isFavorite(selectedProduct.id) ? "currentColor" : "none"
                    }
                  />
                </button>
              </div>

              <p>{selectedProduct.description}</p>

              <div className="modal-production-time">
                <Clock3 size={19} />
                <div>
                  <strong>Produção sob encomenda</strong>
                  <span>
                    Prazo estimado de {selectedProduct.producaoMinDias} a{" "}
                    {selectedProduct.producaoMaxDias} dias úteis após a
                    confirmação do pagamento.
                  </span>
                </div>
              </div>

              <div className="modal-price">
                {selectedProduct.oldPrice && (
                  <span>{formatPrice(selectedProduct.oldPrice)}</span>
                )}

                <strong>{formatPrice(selectedProduct.price)}</strong>
              </div>

              <div className="quantity-area">
                <span>Quantidade</span>

                <div className="quantity-control">
                  <button
                    type="button"
                    onClick={() =>
                      setModalQuantity((quantity) => Math.max(1, quantity - 1))
                    }
                  >
                    <Minus size={18} />
                  </button>

                  <strong>{modalQuantity}</strong>

                  <button
                    type="button"
                    onClick={() => setModalQuantity((quantity) => quantity + 1)}
                  >
                    <Plus size={18} />
                  </button>
                </div>
              </div>

              <button
                type="button"
                className="modal-cart-button"
                onClick={() => handleAddToCart(selectedProduct, modalQuantity)}
              >
                <ShoppingCart size={21} />

                <span>Adicionar ao carrinho</span>

                <strong>
                  {formatPrice(selectedProduct.price * modalQuantity)}
                </strong>
              </button>
            </div>
          </div>
        </div>
      )}

      {cartOpen && (
        <>
          <div className="cart-overlay" onClick={() => setCartOpen(false)} />

          <aside className="cart-drawer">
            <div className="cart-header">
              <div>
                <h2>Seu carrinho</h2>

                <p>
                  {cartQuantity}{" "}
                  {cartQuantity === 1 ? "item adicionado" : "itens adicionados"}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setCartOpen(false)}
                aria-label="Fechar carrinho"
              >
                <X size={25} />
              </button>
            </div>

            {cart.length === 0 ? (
              <div className="empty-cart">
                <ShoppingCart size={58} />

                <h3>Seu carrinho está vazio</h3>

                <p>Adicione produtos para começar sua compra.</p>

                <button type="button" onClick={() => setCartOpen(false)}>
                  Ver produtos
                </button>
              </div>
            ) : (
              <>
                <div className="cart-items">
                  {cart.map((item) => (
                    <article className="cart-item" key={item.product.id}>
                      <img src={item.product.image} alt={item.product.name} />

                      <div className="cart-item-content">
                        <div className="cart-item-header">
                          <div>
                            <span>{item.product.category}</span>

                            <h3>{item.product.name}</h3>

                            <small className="cart-production-time">
                              Produção: {item.product.producaoMinDias} a{" "}
                              {item.product.producaoMaxDias} dias úteis
                            </small>
                          </div>

                          <button
                            type="button"
                            className="remove-button"
                            onClick={() => removeFromCart(item.product.id)}
                            aria-label={`Remover ${item.product.name}`}
                          >
                            <Trash2 size={19} />
                          </button>
                        </div>

                        <div className="cart-item-bottom">
                          <div className="cart-quantity">
                            <button
                              type="button"
                              onClick={() =>
                                decreaseCartQuantity(item.product.id)
                              }
                            >
                              <Minus size={16} />
                            </button>

                            <strong>{item.quantity}</strong>

                            <button
                              type="button"
                              onClick={() =>
                                increaseCartQuantity(item.product.id)
                              }
                            >
                              <Plus size={16} />
                            </button>
                          </div>

                          <strong className="cart-item-price">
                            {formatPrice(item.product.price * item.quantity)}
                          </strong>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>

                <div className="cart-footer">
                  <div className="cart-subtotal">
                    <span>Subtotal</span>

                    <strong>{formatPrice(cartTotal)}</strong>
                  </div>

                  <p>Frete e descontos serão calculados na finalização.</p>

                  <button
                    type="button"
                    className="checkout-button"
                    onClick={finalizarCompra}
                  >
                    Finalizar compra
                  </button>
                </div>
              </>
            )}
          </aside>
        </>
      )}
    </main>
  );
}