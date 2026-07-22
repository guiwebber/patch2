import { useMemo, useState } from "react";
import {
  Heart,
  Minus,
  Plus,
  Search,
  ShoppingBag,
  ShoppingCart,
  Trash2,
  X,
} from "lucide-react";

import "./home.css";

import { categories, products } from "../../data/products";
import type { CartItem, Product } from "../../types/product";

export default function Home() {
  const [selectedCategory, setSelectedCategory] = useState("Todos");
  const [search, setSearch] = useState("");

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const [modalQuantity, setModalQuantity] = useState(1);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesCategory =
        selectedCategory === "Todos" || product.category === selectedCategory;

      const matchesSearch = product.name
        .toLowerCase()
        .includes(search.trim().toLowerCase());

      return matchesCategory && matchesSearch;
    });
  }, [search, selectedCategory]);

  const cartQuantity = cart.reduce((total, item) => total + item.quantity, 0);

  const cartTotal = cart.reduce(
    (total, item) => total + item.product.price * item.quantity,
    0,
  );

  function openProduct(product: Product) {
    setSelectedProduct(product);
    setModalQuantity(1);
  }

  function closeProduct() {
    setSelectedProduct(null);
    setModalQuantity(1);
  }

  function addToCart(product: Product, quantity = 1) {
    setCart((currentCart) => {
      const existingItem = currentCart.find(
        (item) => item.product.id === product.id,
      );

      if (existingItem) {
        return currentCart.map((item) =>
          item.product.id === product.id
            ? {
                ...item,
                quantity: item.quantity + quantity,
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

    closeProduct();
    setCartOpen(true);
  }

  function increaseCartQuantity(productId: number) {
    setCart((currentCart) =>
      currentCart.map((item) =>
        item.product.id === productId
          ? {
              ...item,
              quantity: item.quantity + 1,
            }
          : item,
      ),
    );
  }

  function decreaseCartQuantity(productId: number) {
    setCart((currentCart) =>
      currentCart
        .map((item) =>
          item.product.id === productId
            ? {
                ...item,
                quantity: item.quantity - 1,
              }
            : item,
        )
        .filter((item) => item.quantity > 0),
    );
  }

  function removeFromCart(productId: number) {
    setCart((currentCart) =>
      currentCart.filter((item) => item.product.id !== productId),
    );
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

          <a className="hero-button" href="#produtos">
            Ver produtos
            <ShoppingBag size={20} />
          </a>
        </div>

        <div className="hero-art">
          <div className="hero-art-card">
            <span>Feito à mão</span>
            <strong>Peças exclusivas</strong>
            <p>Produção artesanal e acabamento delicado.</p>
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

        {filteredProducts.length === 0 ? (
          <div className="no-products">
            <Search size={42} />

            <h3>Nenhum produto encontrado</h3>

            <p>Tente buscar outro nome ou selecionar outra categoria.</p>
          </div>
        ) : (
          <div className="products-grid">
            {filteredProducts.map((product) => (
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
                    className="favorite-button"
                    aria-label="Adicionar aos favoritos"
                    onClick={(event) => {
                      event.stopPropagation();
                    }}
                  >
                    <Heart size={20} />
                  </button>
                </div>

                <div className="product-content">
                  <span className="product-category">{product.category}</span>

                  <h3>{product.name}</h3>

                  <p>{product.description}</p>

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
                      style={{
                        gridColumn: "1 / -1",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 8,
                      }}
                      onClick={(event) => {
                        event.stopPropagation();
                        addToCart(product);
                      }}
                    >
                      <ShoppingCart size={19} />
                      Adicionar ao carrinho
                    </button>
                  </div>
                </div>
              </article>
            ))}
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
            >
              <X size={24} />
            </button>

            <div className="modal-image">
              <img src={selectedProduct.image} alt={selectedProduct.name} />
            </div>

            <div className="modal-content">
              <span className="product-category">
                {selectedProduct.category}
              </span>

              <h2>{selectedProduct.name}</h2>

              <p>{selectedProduct.description}</p>

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
                onClick={() => addToCart(selectedProduct, modalQuantity)}
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

              <button type="button" onClick={() => setCartOpen(false)}>
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
                          </div>

                          <button
                            type="button"
                            className="remove-button"
                            onClick={() => removeFromCart(item.product.id)}
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

                  <button type="button" className="checkout-button">
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