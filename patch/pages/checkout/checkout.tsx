import {
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  Banknote,
  Check,
  ChevronLeft,
  Clock3,
  CreditCard,
  MapPin,
  PackageCheck,
  Plus,
  Save,
  ShoppingBag,
  WalletCards,
  X,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "../../src/context/AuthContext";
import { useCart } from "../../src/context/CartContext";

import "./checkout.css";

const API_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:3001";

type Step =
  | "endereco"
  | "revisao"
  | "pagamento";

type PaymentMethod =
  | "pix"
  | "credit_card"
  | "debit_card";

type Endereco = {
  id: number;
  nome_destinatario: string;
  cep: string;
  rua: string;
  numero: string;
  complemento: string | null;
  bairro: string;
  cidade: string;
  estado: string;
  principal: boolean;
};

type EnderecoForm = {
  nomeDestinatario: string;
  cep: string;
  rua: string;
  numero: string;
  complemento: string;
  bairro: string;
  cidade: string;
  estado: string;
  principal: boolean;
};

const enderecoInicial: EnderecoForm = {
  nomeDestinatario: "",
  cep: "",
  rua: "",
  numero: "",
  complemento: "",
  bairro: "",
  cidade: "",
  estado: "",
  principal: false,
};

export default function Checkout() {
  const navigate = useNavigate();
  const { token, sair } = useAuth();

  const {
    cart,
    cartQuantity,
    cartTotal,
    producaoMinDias,
    producaoMaxDias,
    pesoTotal,
    maiorAltura,
    maiorLargura,
    maiorComprimento,
  } = useCart();

  const [step, setStep] =
    useState<Step>("endereco");

  const [enderecos, setEnderecos] = useState<
    Endereco[]
  >([]);

  const [
    enderecoSelecionadoId,
    setEnderecoSelecionadoId,
  ] = useState<number | null>(null);

  const [paymentMethod, setPaymentMethod] =
    useState<PaymentMethod | null>(null);

  const [
    mostrarFormulario,
    setMostrarFormulario,
  ] = useState(false);

  const [enderecoForm, setEnderecoForm] =
    useState<EnderecoForm>(enderecoInicial);

  const [carregando, setCarregando] =
    useState(true);

  const [
    salvandoEndereco,
    setSalvandoEndereco,
  ] = useState(false);

  const [erro, setErro] = useState("");

  const enderecoSelecionado = useMemo(
    () =>
      enderecos.find(
        (endereco: Endereco) =>
          endereco.id === enderecoSelecionadoId,
      ) || null,
    [enderecos, enderecoSelecionadoId],
  );

  useEffect(() => {
    if (cart.length === 0) {
      navigate("/", {
        replace: true,
      });
      return;
    }

    void carregarEnderecos();
  }, []);

  function authHeaders() {
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };
  }

  async function tratarNaoAutorizado(
    response: Response,
  ) {
    if (response.status !== 401) {
      return false;
    }

    sair();

    navigate("/login", {
      replace: true,
      state: {
        redirectTo: "/checkout",
      },
    });

    return true;
  }

  async function carregarEnderecos() {
    try {
      setCarregando(true);
      setErro("");

      const response = await fetch(
        `${API_URL}/enderecos`,
        {
          headers: authHeaders(),
        },
      );

      if (await tratarNaoAutorizado(response)) {
        return;
      }

      const data = await response.json();

      if (!response.ok) {
        setErro(
          data.erro ||
            "Não foi possível carregar os endereços.",
        );
        return;
      }

      const lista: Endereco[] =
        data.enderecos || [];

      setEnderecos(lista);

      const principal = lista.find(
        (endereco: Endereco) =>
          endereco.principal,
      );

      if (principal) {
        setEnderecoSelecionadoId(principal.id);
      } else if (lista.length > 0) {
        setEnderecoSelecionadoId(lista[0].id);
      }
    } catch (error) {
      console.error(error);
      setErro(
        "Não foi possível conectar ao servidor.",
      );
    } finally {
      setCarregando(false);
    }
  }

  function abrirNovoEndereco() {
    setEnderecoForm(enderecoInicial);
    setMostrarFormulario(true);
    setErro("");
  }

  function fecharNovoEndereco() {
    setMostrarFormulario(false);
    setEnderecoForm(enderecoInicial);
  }

  async function salvarEndereco(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();
    setErro("");

    const obrigatorios = [
      enderecoForm.nomeDestinatario,
      enderecoForm.cep,
      enderecoForm.rua,
      enderecoForm.numero,
      enderecoForm.bairro,
      enderecoForm.cidade,
      enderecoForm.estado,
    ];

    if (
      obrigatorios.some(
        (campo: string) => !campo.trim(),
      )
    ) {
      setErro(
        "Preencha todos os campos obrigatórios.",
      );
      return;
    }

    try {
      setSalvandoEndereco(true);

      const response = await fetch(
        `${API_URL}/enderecos`,
        {
          method: "POST",
          headers: authHeaders(),
          body: JSON.stringify(enderecoForm),
        },
      );

      if (await tratarNaoAutorizado(response)) {
        return;
      }

      const data = await response.json();

      if (!response.ok) {
        setErro(
          data.erro ||
            "Não foi possível salvar o endereço.",
        );
        return;
      }

      fecharNovoEndereco();
      await carregarEnderecos();

      if (data.endereco?.id) {
        setEnderecoSelecionadoId(
          data.endereco.id,
        );
      }
    } catch (error) {
      console.error(error);
      setErro(
        "Não foi possível conectar ao servidor.",
      );
    } finally {
      setSalvandoEndereco(false);
    }
  }

  function continuarParaRevisao() {
    if (!enderecoSelecionadoId) {
      setErro(
        "Selecione ou cadastre um endereço.",
      );
      return;
    }

    setErro("");
    setStep("revisao");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function continuarParaPagamento() {
    setErro("");
    setStep("pagamento");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function finalizarPagamento() {
    if (!paymentMethod) {
      setErro(
        "Selecione uma forma de pagamento.",
      );
      return;
    }

    setErro("");

    window.alert(
      "Pedido revisado. A integração com o Mercado Pago será conectada na próxima etapa.",
    );
  }

  function voltarEtapa() {
    if (step === "pagamento") {
      setStep("revisao");
      return;
    }

    if (step === "revisao") {
      setStep("endereco");
      return;
    }

    navigate("/");
  }

  function formatPrice(value: number) {
    return value.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  }

  function stepClass(target: Step) {
    const ordem: Step[] = [
      "endereco",
      "revisao",
      "pagamento",
    ];

    const atual = ordem.indexOf(step);
    const alvo = ordem.indexOf(target);

    if (alvo < atual) {
      return "progress-item done";
    }

    if (alvo === atual) {
      return "progress-item active";
    }

    return "progress-item";
  }

  return (
    <main className="checkout-page">
      <section className="checkout-heading">
        <button
          type="button"
          onClick={voltarEtapa}
        >
          <ChevronLeft size={20} />
          Voltar
        </button>

        <span>Finalizar compra</span>
        <h1>Checkout</h1>

        <div className="checkout-progress">
          <div className={stepClass("endereco")}>
            <span>
              {step !== "endereco" ? (
                <Check size={17} />
              ) : (
                "1"
              )}
            </span>
            Endereço
          </div>

          <div className="progress-line" />

          <div className={stepClass("revisao")}>
            <span>
              {step === "pagamento" ? (
                <Check size={17} />
              ) : (
                "2"
              )}
            </span>
            Revisão
          </div>

          <div className="progress-line" />

          <div className={stepClass("pagamento")}>
            <span>3</span>
            Pagamento
          </div>
        </div>
      </section>

      <section className="checkout-layout">
        <div className="checkout-main">
          {erro && (
            <div className="checkout-error">
              {erro}
            </div>
          )}

          {step === "endereco" && (
            <section className="checkout-card">
              <div className="checkout-card-heading">
                <div>
                  <MapPin size={24} />

                  <div>
                    <h2>Endereço de entrega</h2>
                    <p>
                      Escolha onde deseja receber seu
                      pedido.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={abrirNovoEndereco}
                >
                  <Plus size={18} />
                  Novo endereço
                </button>
              </div>

              {carregando ? (
                <div className="checkout-loading">
                  Carregando endereços...
                </div>
              ) : enderecos.length === 0 ? (
                <div className="checkout-empty">
                  <MapPin size={52} />
                  <h3>
                    Nenhum endereço cadastrado
                  </h3>
                  <p>
                    Cadastre um endereço para continuar
                    sua compra.
                  </p>
                  <button
                    type="button"
                    onClick={abrirNovoEndereco}
                  >
                    Cadastrar endereço
                  </button>
                </div>
              ) : (
                <div className="checkout-address-list">
                  {enderecos.map(
                    (endereco: Endereco) => {
                      const selecionado =
                        enderecoSelecionadoId ===
                        endereco.id;

                      return (
                        <button
                          type="button"
                          key={endereco.id}
                          className={
                            selecionado
                              ? "checkout-address selected"
                              : "checkout-address"
                          }
                          onClick={() =>
                            setEnderecoSelecionadoId(
                              endereco.id,
                            )
                          }
                        >
                          <span className="address-radio">
                            {selecionado && (
                              <Check size={16} />
                            )}
                          </span>

                          <div>
                            <div className="address-title">
                              <strong>
                                {
                                  endereco.nome_destinatario
                                }
                              </strong>

                              {endereco.principal && (
                                <span>Principal</span>
                              )}
                            </div>

                            <p>
                              {endereco.rua},{" "}
                              {endereco.numero}
                            </p>

                            {endereco.complemento && (
                              <p>
                                {endereco.complemento}
                              </p>
                            )}

                            <p>
                              {endereco.bairro} —{" "}
                              {endereco.cidade}/
                              {endereco.estado}
                            </p>

                            <small>
                              CEP {endereco.cep}
                            </small>
                          </div>
                        </button>
                      );
                    },
                  )}
                </div>
              )}

              <button
                type="button"
                className="checkout-primary-button"
                onClick={continuarParaRevisao}
                disabled={
                  carregando ||
                  !enderecoSelecionadoId
                }
              >
                Continuar para revisão
              </button>
            </section>
          )}

          {step === "revisao" && (
            <section className="checkout-card">
              <div className="checkout-card-heading">
                <div>
                  <PackageCheck size={24} />

                  <div>
                    <h2>Revise seu pedido</h2>
                    <p>
                      Confira produtos, endereço e prazo
                      de produção antes do pagamento.
                    </p>
                  </div>
                </div>
              </div>

              <div className="review-products">
                {cart.map((item) => (
                  <article
                    className="review-product"
                    key={item.product.id}
                  >
                    <img
                      src={item.product.image}
                      alt={item.product.name}
                    />

                    <div>
                      <span>
                        {item.product.category}
                      </span>

                      <h3>
                        {item.product.name}
                      </h3>

                      <p>
                        Quantidade: {item.quantity}
                      </p>

                      <small>
                        Produção individual:{" "}
                        {
                          item.product
                            .producaoMinDias
                        }{" "}
                        a{" "}
                        {
                          item.product
                            .producaoMaxDias
                        }{" "}
                        dias úteis
                      </small>
                    </div>

                    <strong>
                      {formatPrice(
                        item.product.price *
                          item.quantity,
                      )}
                    </strong>
                  </article>
                ))}
              </div>

              {enderecoSelecionado && (
                <div className="review-block">
                  <div className="review-block-title">
                    <MapPin size={20} />
                    <strong>
                      Endereço de entrega
                    </strong>
                  </div>

                  <p>
                    {
                      enderecoSelecionado.nome_destinatario
                    }
                  </p>

                  <p>
                    {enderecoSelecionado.rua},{" "}
                    {enderecoSelecionado.numero}
                    {enderecoSelecionado.complemento
                      ? `, ${enderecoSelecionado.complemento}`
                      : ""}
                  </p>

                  <p>
                    {enderecoSelecionado.bairro} —{" "}
                    {enderecoSelecionado.cidade}/
                    {enderecoSelecionado.estado}
                  </p>

                  <p>
                    CEP {enderecoSelecionado.cep}
                  </p>

                  <button
                    type="button"
                    onClick={() =>
                      setStep("endereco")
                    }
                  >
                    Alterar endereço
                  </button>
                </div>
              )}

              <div className="review-block">
                <div className="review-block-title">
                  <Clock3 size={20} />
                  <strong>
                    Prazo de produção
                  </strong>
                </div>

                <p>
                  Como as peças são feitas sob
                  encomenda, o pedido ficará pronto em
                  aproximadamente{" "}
                  <strong>
                    {producaoMinDias} a{" "}
                    {producaoMaxDias} dias úteis
                  </strong>{" "}
                  após a confirmação do pagamento.
                </p>

                <small>
                  O prazo de transporte será somado ao
                  prazo de produção depois que o frete
                  da SuperFrete for selecionado.
                </small>
              </div>

              <div className="review-package">
                <span>Dados usados no frete</span>

                <div>
                  <p>
                    Peso total:{" "}
                    <strong>
                      {pesoTotal.toFixed(2)} kg
                    </strong>
                  </p>

                  <p>
                    Embalagem estimada:{" "}
                    <strong>
                      {maiorComprimento} ×{" "}
                      {maiorLargura} ×{" "}
                      {maiorAltura} cm
                    </strong>
                  </p>
                </div>
              </div>

              <div className="review-total">
                <div>
                  <span>Subtotal</span>
                  <strong>
                    {formatPrice(cartTotal)}
                  </strong>
                </div>

                <div>
                  <span>Frete</span>
                  <strong>A calcular</strong>
                </div>

                <div>
                  <span>Total parcial</span>
                  <strong>
                    {formatPrice(cartTotal)}
                  </strong>
                </div>
              </div>

              <button
                type="button"
                className="checkout-primary-button"
                onClick={continuarParaPagamento}
              >
                Continuar para pagamento
              </button>
            </section>
          )}

          {step === "pagamento" && (
            <section className="checkout-card">
              <div className="checkout-card-heading">
                <div>
                  <WalletCards size={24} />

                  <div>
                    <h2>Forma de pagamento</h2>
                    <p>
                      Escolha como deseja pagar.
                    </p>
                  </div>
                </div>
              </div>

              <div className="payment-methods">
                <button
                  type="button"
                  className={
                    paymentMethod === "pix"
                      ? "payment-method selected"
                      : "payment-method"
                  }
                  onClick={() =>
                    setPaymentMethod("pix")
                  }
                >
                  <Banknote size={27} />

                  <div>
                    <strong>Pix</strong>
                    <span>
                      Aprovação rápida após o pagamento.
                    </span>
                  </div>

                  <span className="payment-radio">
                    {paymentMethod === "pix" && (
                      <Check size={16} />
                    )}
                  </span>
                </button>

                <button
                  type="button"
                  className={
                    paymentMethod ===
                    "credit_card"
                      ? "payment-method selected"
                      : "payment-method"
                  }
                  onClick={() =>
                    setPaymentMethod(
                      "credit_card",
                    )
                  }
                >
                  <CreditCard size={27} />

                  <div>
                    <strong>
                      Cartão de crédito
                    </strong>

                    <span>
                      Parcelamento disponível pelo
                      Mercado Pago.
                    </span>
                  </div>

                  <span className="payment-radio">
                    {paymentMethod ===
                      "credit_card" && (
                      <Check size={16} />
                    )}
                  </span>
                </button>

                <button
                  type="button"
                  className={
                    paymentMethod ===
                    "debit_card"
                      ? "payment-method selected"
                      : "payment-method"
                  }
                  onClick={() =>
                    setPaymentMethod(
                      "debit_card",
                    )
                  }
                >
                  <WalletCards size={27} />

                  <div>
                    <strong>
                      Cartão de débito
                    </strong>

                    <span>
                      Disponibilidade depende do cartão.
                    </span>
                  </div>

                  <span className="payment-radio">
                    {paymentMethod ===
                      "debit_card" && (
                      <Check size={16} />
                    )}
                  </span>
                </button>
              </div>

              <div className="payment-security-note">
                <PackageCheck size={22} />

                Os dados do cartão serão coletados pelo
                Payment Brick do Mercado Pago. Seu
                servidor não armazenará o número do
                cartão nem o código de segurança.
              </div>

              <button
                type="button"
                className="checkout-primary-button"
                onClick={finalizarPagamento}
                disabled={!paymentMethod}
              >
                Ir para pagamento seguro
              </button>
            </section>
          )}
        </div>

        <aside className="checkout-summary">
          <div className="summary-heading">
            <ShoppingBag size={22} />

            <div>
              <h2>Resumo do pedido</h2>

              <p>
                {cartQuantity}{" "}
                {cartQuantity === 1
                  ? "item"
                  : "itens"}
              </p>
            </div>
          </div>

          <div className="summary-products">
            {cart.map((item) => (
              <article
                className="summary-product"
                key={item.product.id}
              >
                <div className="summary-image">
                  <img
                    src={item.product.image}
                    alt={item.product.name}
                  />

                  <span>{item.quantity}</span>
                </div>

                <div>
                  <strong>
                    {item.product.name}
                  </strong>

                  <small>
                    {item.product.category}
                  </small>
                </div>

                <strong>
                  {formatPrice(
                    item.product.price *
                      item.quantity,
                  )}
                </strong>
              </article>
            ))}
          </div>

          {enderecoSelecionado && (
            <div className="summary-address">
              <span>Entrega</span>

              <strong>
                {enderecoSelecionado.rua},{" "}
                {enderecoSelecionado.numero}
              </strong>

              <small>
                {enderecoSelecionado.cidade}/
                {enderecoSelecionado.estado}
              </small>
            </div>
          )}

          <div className="summary-production">
            <Clock3 size={18} />

            <div>
              <span>Produção sob encomenda</span>

              <strong>
                {producaoMinDias} a{" "}
                {producaoMaxDias} dias úteis
              </strong>
            </div>
          </div>

          <div className="summary-values">
            <div>
              <span>Subtotal</span>

              <strong>
                {formatPrice(cartTotal)}
              </strong>
            </div>

            <div>
              <span>Frete</span>
              <strong>A calcular</strong>
            </div>

            <div className="summary-total">
              <span>Total parcial</span>

              <strong>
                {formatPrice(cartTotal)}
              </strong>
            </div>
          </div>

          <p className="summary-note">
            O frete da SuperFrete e o prazo de
            transporte serão conectados na próxima
            etapa.
          </p>
        </aside>
      </section>

      {mostrarFormulario && (
        <div
          className="checkout-modal-overlay"
          onMouseDown={fecharNovoEndereco}
        >
          <form
            className="checkout-address-modal"
            onSubmit={salvarEndereco}
            onMouseDown={(event) =>
              event.stopPropagation()
            }
          >
            <button
              type="button"
              className="checkout-modal-close"
              onClick={fecharNovoEndereco}
            >
              <X size={22} />
            </button>

            <div className="checkout-card-heading">
              <div>
                <MapPin size={24} />

                <div>
                  <h2>Novo endereço</h2>
                  <p>
                    Preencha os dados para entrega.
                  </p>
                </div>
              </div>
            </div>

            <div className="checkout-address-form">
              <label className="full">
                <span>Nome do destinatário</span>

                <input
                  value={
                    enderecoForm.nomeDestinatario
                  }
                  onChange={(event) =>
                    setEnderecoForm(
                      (current) => ({
                        ...current,
                        nomeDestinatario:
                          event.target.value,
                      }),
                    )
                  }
                />
              </label>

              <label>
                <span>CEP</span>

                <input
                  value={enderecoForm.cep}
                  onChange={(event) =>
                    setEnderecoForm(
                      (current) => ({
                        ...current,
                        cep: event.target.value,
                      }),
                    )
                  }
                />
              </label>

              <label>
                <span>Estado</span>

                <input
                  maxLength={2}
                  value={enderecoForm.estado}
                  onChange={(event) =>
                    setEnderecoForm(
                      (current) => ({
                        ...current,
                        estado:
                          event.target.value.toUpperCase(),
                      }),
                    )
                  }
                />
              </label>

              <label className="full">
                <span>Rua</span>

                <input
                  value={enderecoForm.rua}
                  onChange={(event) =>
                    setEnderecoForm(
                      (current) => ({
                        ...current,
                        rua: event.target.value,
                      }),
                    )
                  }
                />
              </label>

              <label>
                <span>Número</span>

                <input
                  value={enderecoForm.numero}
                  onChange={(event) =>
                    setEnderecoForm(
                      (current) => ({
                        ...current,
                        numero:
                          event.target.value,
                      }),
                    )
                  }
                />
              </label>

              <label>
                <span>Complemento</span>

                <input
                  value={enderecoForm.complemento}
                  onChange={(event) =>
                    setEnderecoForm(
                      (current) => ({
                        ...current,
                        complemento:
                          event.target.value,
                      }),
                    )
                  }
                />
              </label>

              <label>
                <span>Bairro</span>

                <input
                  value={enderecoForm.bairro}
                  onChange={(event) =>
                    setEnderecoForm(
                      (current) => ({
                        ...current,
                        bairro:
                          event.target.value,
                      }),
                    )
                  }
                />
              </label>

              <label>
                <span>Cidade</span>

                <input
                  value={enderecoForm.cidade}
                  onChange={(event) =>
                    setEnderecoForm(
                      (current) => ({
                        ...current,
                        cidade:
                          event.target.value,
                      }),
                    )
                  }
                />
              </label>

              <label className="checkout-checkbox full">
                <input
                  type="checkbox"
                  checked={enderecoForm.principal}
                  onChange={(event) =>
                    setEnderecoForm(
                      (current) => ({
                        ...current,
                        principal:
                          event.target.checked,
                      }),
                    )
                  }
                />

                <span>
                  Usar como endereço principal
                </span>
              </label>
            </div>

            <button
              type="submit"
              className="checkout-primary-button"
              disabled={salvandoEndereco}
            >
              <Save size={18} />

              {salvandoEndereco
                ? "Salvando..."
                : "Salvar endereço"}
            </button>
          </form>
        </div>
      )}
    </main>
  );
}
