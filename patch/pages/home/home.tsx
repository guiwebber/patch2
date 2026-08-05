import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
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
import type {
  Product,
  ProductVariation,
} from "../../types/product";
import { supabase } from "../../src/lib/supabase";

import "./home.css";


const PENDING_ACTION_KEY = "patchwork:pending-action";
const PRODUCTS_CACHE_KEY = "sonia-ferraz:products-cache-v2";
const PRODUCTS_CACHE_TIME = 10 * 60 * 1000;

type ProductsCache = {
  products: Product[];
  savedAt: number;
};

function createProductSlug(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

type PendingAction =
  | { type: "favorite"; product: Product }
  | {
      type: "cart";
      product: Product;
      quantity: number;
      variation?: ProductVariation;
    };

const heroSlides = [
  {
    image:
      "/home2.jpeg",
    label: "Feito à mão",
    title: "Peças exclusivas",
    description: "Produção artesanal e acabamento delicado.",
  },
  {
    image:
      "/home3.jpeg",
    label: "Detalhes que encantam",
    title: "Cuidado em cada ponto",
    description: "Tecidos escolhidos com carinho para transformar ambientes.",
  },
  {
    image:
      "/home1.jpeg",
    label: "Arte em tecidos",
    title: "Sua casa mais acolhedora",
    description: "Peças feitas sob encomenda para combinar com o seu estilo.",
  },
];

export default function Home() {
  const navigate = useNavigate();
  const location = useLocation();
  const { productId } = useParams<{ productId?: string }>();
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
  const [selectedVariation, setSelectedVariation] =
    useState<ProductVariation | null>(null);
  const [variationError, setVariationError] = useState("");

  const [modalImageIndex, setModalImageIndex] = useState(0);

  const [heroIndex, setHeroIndex] = useState(0);

  const [cartOpen, setCartOpen] = useState(false);

  useEffect(() => {
    let ativo = true;

    async function carregarProdutos() {
      const cachedValue = sessionStorage.getItem(PRODUCTS_CACHE_KEY);

      if (cachedValue) {
        try {
          const cache = JSON.parse(cachedValue) as ProductsCache;
          const cacheAindaValido =
            Date.now() - cache.savedAt < PRODUCTS_CACHE_TIME;

          if (cacheAindaValido && Array.isArray(cache.products)) {
            setProducts(cache.products);
            setProductsLoading(false);
            setProductsError("");
            return;
          }
        } catch {
          sessionStorage.removeItem(PRODUCTS_CACHE_KEY);
        }
      }

      try {
        setProductsLoading(true);

        const { data, error } = await supabase
          .from("produtos")
          .select(
            "id,nome,categoria,descricao,preco,preco_antigo,imagem,imagens,destaque,ativo,possui_variacoes,peso,altura,largura,comprimento,producao_min_dias,producao_max_dias,produto_variacoes(id,produto_id,nome,imagem,cor_hex,ordem,ativo)",
          )
          .eq("ativo", true)
          .order("id", { ascending: true });

        if (error) {
          throw new Error(error.message || "Não foi possível carregar os produtos.");
        }

        const loadedProducts: Product[] = (data ?? []).map((produto) => ({
          id: Number(produto.id),
          name: produto.nome ?? "Produto",
          category: produto.categoria ?? "Sem categoria",
          description: produto.descricao ?? "",
          price: Number(produto.preco ?? 0),
          oldPrice:
            produto.preco_antigo == null
              ? undefined
              : Number(produto.preco_antigo),
          image: produto.imagem ?? "",
          images: Array.isArray(produto.imagens)
            ? produto.imagens.filter(
                (imagem): imagem is string => typeof imagem === "string",
              )
            : [],
          featured: Boolean(produto.destaque),
          active: Boolean(produto.ativo),
          hasVariations: Boolean(produto.possui_variacoes),
          variations: Array.isArray(produto.produto_variacoes)
            ? produto.produto_variacoes
                .filter((variacao) => variacao.ativo !== false)
                .sort((a, b) => Number(a.ordem ?? 0) - Number(b.ordem ?? 0))
                .map((variacao) => ({
                  id: Number(variacao.id),
                  productId: Number(variacao.produto_id),
                  name: variacao.nome ?? "Variação",
                  image: variacao.imagem ?? "",
                  colorHex: variacao.cor_hex || undefined,
                  order: Number(variacao.ordem ?? 0),
                  active: Boolean(variacao.ativo),
                }))
            : [],
          peso: Number(produto.peso ?? 0),
          altura: Number(produto.altura ?? 0),
          largura: Number(produto.largura ?? 0),
          comprimento: Number(produto.comprimento ?? 0),
          producaoMinDias: Number(produto.producao_min_dias ?? 0),
          producaoMaxDias: Number(produto.producao_max_dias ?? 0),
        }));

        if (ativo) {
          setProducts(loadedProducts);
          setProductsError("");

          sessionStorage.setItem(
            PRODUCTS_CACHE_KEY,
            JSON.stringify({
              products: loadedProducts,
              savedAt: Date.now(),
            }),
          );
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
    if (productsLoading || productsError) {
      return;
    }

    if (!productId) {
      setSelectedProduct(null);
      setModalQuantity(1);
      setModalImageIndex(0);
      return;
    }

    const productFromUrl = products.find(
      (product) => String(product.id) === productId,
    );

    if (!productFromUrl) {
      navigate("/", { replace: true });
      return;
    }

    setSelectedProduct((currentProduct) => {
      if (currentProduct?.id === productFromUrl.id) {
        return currentProduct;
      }

      return productFromUrl;
    });

    setModalQuantity(1);
    setModalImageIndex(0);
    setSelectedVariation(
      productFromUrl.hasVariations
        ? productFromUrl.variations?.[0] || null
        : null,
    );
    setVariationError("");
  }, [navigate, productId, products, productsError, productsLoading]);

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
        addToCart(pending.product, pending.quantity, pending.variation);
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

  function resetProductModal() {
    setSelectedProduct(null);
    setModalQuantity(1);
    setModalImageIndex(0);
    setSelectedVariation(null);
    setVariationError("");
  }

  function openProduct(product: Product) {
    setSelectedProduct(product);
    setModalQuantity(1);
    setModalImageIndex(0);
    setSelectedVariation(
      product.hasVariations
        ? product.variations?.[0] || null
        : null,
    );
    setVariationError("");

    const slug = createProductSlug(product.name);

    navigate(`/produtos/${product.id}/${slug}`, {
      state: {
        productModal: true,
        backgroundPath: location.pathname,
      },
    });
  }

  function closeProduct() {
    resetProductModal();

    const navigationState = location.state as
      | { productModal?: boolean; backgroundPath?: string }
      | null;

    if (navigationState?.productModal) {
      navigate(-1);
      return;
    }

    navigate("/", { replace: true });
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

    resetProductModal();
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

  function handleAddToCart(
    product: Product,
    quantity = 1,
    variation?: ProductVariation | null,
  ) {
    if (product.hasVariations && !variation) {
      setVariationError("Escolha uma opção antes de adicionar ao carrinho.");
      if (!selectedProduct) {
        openProduct(product);
      }
      return;
    }

    if (!estaLogado) {
      irParaLoginComAcao({
        type: "cart",
        product,
        quantity,
        variation: variation || undefined,
      });
      return;
    }

    addToCart(product, quantity, variation || undefined);
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
            Conheça nossa coleção de peças artesanais em patchwork e bordado, feitos
            com todo amor e cuidado em cada detalhe.
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
                          if (product.hasVariations) {
                            openProduct(product);
                            return;
                          }

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
                    selectedVariation?.image ||
                    selectedProduct.images?.[modalImageIndex] ||
                    selectedProduct.image
                  }
                  alt={`${selectedProduct.name} - foto ${modalImageIndex + 1}`}
                />

                {!selectedVariation && (selectedProduct.images?.length || 1) > 1 && (
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
                {(selectedVariation
                  ? [selectedVariation.image]
                  : selectedProduct.images?.length
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

              <div className="modal-unit-price-notice">
                <ShoppingBag size={18} />
                <div>
                  <strong>Preço por unidade</strong>
                  <span>
                    Fotos com vários itens são ilustrativas. O valor informado
                    corresponde a uma unidade.
                  </span>
                </div>
              </div>

              {selectedProduct.hasVariations &&
                (selectedProduct.variations?.length || 0) > 0 && (
                  <div className="product-variations">
                    <div className="product-variations-heading">
                      <strong>Escolha uma opção</strong>
                      {selectedVariation && (
                        <span>{selectedVariation.name}</span>
                      )}
                    </div>

                    <div className="product-variation-options">
                      {selectedProduct.variations?.map((variation) => (
                        <button
                          key={variation.id}
                          type="button"
                          className={
                            selectedVariation?.id === variation.id
                              ? "product-variation-option active"
                              : "product-variation-option"
                          }
                          onClick={() => {
                            setSelectedVariation(variation);
                            setVariationError("");
                            setModalImageIndex(0);
                          }}
                        >
                          <img src={variation.image} alt={variation.name} />
                          <span>{variation.name}</span>
                        </button>
                      ))}
                    </div>

                    {variationError && (
                      <small className="product-variation-error">
                        {variationError}
                      </small>
                    )}
                  </div>
                )}

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
                onClick={() =>
                  handleAddToCart(
                    selectedProduct,
                    modalQuantity,
                    selectedVariation,
                  )
                }
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
                    <article
                      className="cart-item"
                      key={`${item.product.id}-${item.variation?.id ?? "padrao"}`}
                    >
                      <img
                        src={item.variation?.image || item.product.image}
                        alt={
                          item.variation
                            ? `${item.product.name} - ${item.variation.name}`
                            : item.product.name
                        }
                      />

                      <div className="cart-item-content">
                        <div className="cart-item-header">
                          <div>
                            <span>{item.product.category}</span>

                            <h3>{item.product.name}</h3>

                            {item.variation && (
                              <small className="cart-variation-name">
                                Opção: {item.variation.name}
                              </small>
                            )}

                            <small className="cart-production-time">
                              Produção: {item.product.producaoMinDias} a{" "}
                              {item.product.producaoMaxDias} dias úteis
                            </small>
                          </div>

                          <button
                            type="button"
                            className="remove-button"
                            onClick={() => removeFromCart(item.product.id, item.variation?.id)}
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
                                decreaseCartQuantity(item.product.id, item.variation?.id)
                              }
                            >
                              <Minus size={16} />
                            </button>

                            <strong>{item.quantity}</strong>

                            <button
                              type="button"
                              onClick={() =>
                                increaseCartQuantity(item.product.id, item.variation?.id)
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
