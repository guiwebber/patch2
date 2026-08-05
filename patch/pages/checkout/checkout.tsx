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
  Truck,
  Save,
  ShoppingBag,
  WalletCards,
  X,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "../../src/context/AuthContext";
import { useCart } from "../../src/context/CartContext";
import MercadoPagoPayment from "../../src/components/payment/MercadoPagoPayment";
import {
  ESTADOS_BRASIL,
  formatarCep,
  somenteLetras,
  somenteNumeros,
} from "../../src/utils/inputFormatters";

import "./checkout.css";

const API_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:3001";

const FRETE_DESABILITADO =
  import.meta.env
    .VITE_DESABILITAR_FRETE ===
  "true";

type Step =
  | "endereco"
  | "revisao"
  | "pagamento";

type PaymentMethod =
  | "pix"
  | "credit_card"
  | "debit_card";

type OpcaoFrete = {
  id: string;
  servico: string;
  transportadora: string;
  valor: number;
  prazoDias: number;
};

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

  const [opcoesFrete, setOpcoesFrete] =
    useState<OpcaoFrete[]>([]);

  const [
    freteSelecionadoId,
    setFreteSelecionadoId,
  ] = useState<string | null>(null);

  const [
    calculandoFrete,
    setCalculandoFrete,
  ] = useState(false);

  const enderecoSelecionado = useMemo(
    () =>
      enderecos.find(
        (endereco: Endereco) =>
          endereco.id === enderecoSelecionadoId,
      ) || null,
    [enderecos, enderecoSelecionadoId],
  );

  const freteSelecionado =
    useMemo(
      () =>
        opcoesFrete.find(
          (opcao) =>
            opcao.id ===
            freteSelecionadoId,
        ) || null,
      [
        opcoesFrete,
        freteSelecionadoId,
      ],
    );

  const valorFrete =
    FRETE_DESABILITADO
      ? 0
      : freteSelecionado?.valor || 0;
  const valorBase = Number(
    (cartTotal + valorFrete).toFixed(2),
  );
  const acrescimoCartao = Number(
    (valorBase * 0.05).toFixed(2),
  );
  const totalCartao = Number(
    (valorBase + acrescimoCartao).toFixed(2),
  );

  const totalSelecionado =
    paymentMethod === "credit_card" ||
    paymentMethod === "debit_card"
      ? totalCartao
      : valorBase;

  useEffect(() => {
    setOpcoesFrete([]);
    setFreteSelecionadoId(null);
  }, [enderecoSelecionadoId]);

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
          body: JSON.stringify({
            ...enderecoForm,
            cep: enderecoForm.cep.replace(
              /\D/g,
              "",
            ),
          }),
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

  async function calcularFrete() {
    if (!enderecoSelecionado) {
      setErro(
        "Selecione um endereço para calcular o frete.",
      );
      return;
    }

    try {
      setCalculandoFrete(true);
      setErro("");
      setFreteSelecionadoId(null);

      const response = await fetch(
        `${API_URL}/fretes/cotacao`,
        {
          method: "POST",
          headers: authHeaders(),
          body: JSON.stringify({
            cepDestino:
              enderecoSelecionado.cep,
            itens: cart.map(
              (item) => ({
                produtoId:
                  item.product.id,
                variacaoId:
                  item.variation?.id,
                quantidade:
                  item.quantity,
              }),
            ),
          }),
        },
      );

      if (
        await tratarNaoAutorizado(
          response,
        )
      ) {
        return;
      }

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.erro ||
            "Não foi possível calcular o frete.",
        );
      }

      const opcoes =
        (data.opcoes ||
          []) as OpcaoFrete[];

      setOpcoesFrete(opcoes);

      if (opcoes.length > 0) {
        setFreteSelecionadoId(
          opcoes[0].id,
        );
      }
    } catch (error) {
      console.error(error);

      setErro(
        error instanceof Error
          ? error.message
          : "Não foi possível calcular o frete.",
      );
    } finally {
      setCalculandoFrete(false);
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

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  function continuarParaPagamento() {
    if (
      !FRETE_DESABILITADO &&
      !freteSelecionado
    ) {
      setErro(
        "Calcule e selecione uma opção de frete.",
      );

      return;
    }

    setErro("");
    setStep("pagamento");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  function irParaEtapa(target: Step) {
    if (
      (target === "revisao" ||
        target === "pagamento") &&
      !enderecoSelecionadoId
    ) {
      setErro(
        "Selecione ou cadastre um endereço antes de avançar.",
      );
      setStep("endereco");
      return;
    }

    setErro("");
    setStep(target);
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  function voltarEtapa() {
    if (step === "pagamento") {
      irParaEtapa("revisao");
      return;
    }

    if (step === "revisao") {
      irParaEtapa("endereco");
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
        <span>Finalizar compra</span>
        <h1>Checkout</h1>

        <div className="checkout-progress">
          <button
            type="button"
            className={stepClass("endereco")}
            onClick={() => irParaEtapa("endereco")}
          >
            <span>
              {step !== "endereco" ? (
                <Check size={17} />
              ) : (
                "1"
              )}
            </span>
            Endereço
          </button>

          <div className="progress-line" />

          <button
            type="button"
            className={stepClass("revisao")}
            onClick={() => irParaEtapa("revisao")}
            disabled={!enderecoSelecionadoId}
          >
            <span>
              {step === "pagamento" ? (
                <Check size={17} />
              ) : (
                "2"
              )}
            </span>
            Revisão
          </button>

          <div className="progress-line" />

          <button
            type="button"
            className={stepClass("pagamento")}
            onClick={() => irParaEtapa("pagamento")}
            disabled={!enderecoSelecionadoId}
          >
            <span>3</span>
            Pagamento
          </button>
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
                              CEP {formatarCep(endereco.cep)}
                            </small>
                          </div>
                        </button>
                      );
                    },
                  )}
                </div>
              )}

              <div className="checkout-navigation">
                <button
                  type="button"
                  className="checkout-back-button"
                  onClick={voltarEtapa}
                >
                  <ChevronLeft size={19} />
                  Voltar às compras
                </button>

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
              </div>
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
                    CEP {formatarCep(enderecoSelecionado.cep)}
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

              {!FRETE_DESABILITADO && (
                <div className="review-shipping">
                <div className="review-block-title">
                  <Truck size={20} />
                  <strong>
                    Opções de frete
                  </strong>
                </div>

                <button
                  type="button"
                  className="shipping-calculate-button"
                  onClick={() =>
                    void calcularFrete()
                  }
                  disabled={
                    calculandoFrete ||
                    !enderecoSelecionado
                  }
                >
                  {calculandoFrete
                    ? "Calculando..."
                    : opcoesFrete.length > 0
                      ? "Calcular novamente"
                      : "Calcular frete"}
                </button>

                {opcoesFrete.length > 0 && (
                  <div className="shipping-options">
                    {opcoesFrete.map(
                      (opcao) => {
                        const selecionada =
                          freteSelecionadoId ===
                          opcao.id;

                        return (
                          <button
                            type="button"
                            key={opcao.id}
                            className={
                              selecionada
                                ? "shipping-option selected"
                                : "shipping-option"
                            }
                            onClick={() =>
                              setFreteSelecionadoId(
                                opcao.id,
                              )
                            }
                          >
                            <span className="shipping-radio">
                              {selecionada && (
                                <Check size={15} />
                              )}
                            </span>

                            <div>
                              <strong>
                                {opcao.servico}
                              </strong>
                              <small>
                                {opcao.transportadora}
                                {" · "}
                                aproximadamente{" "}
                                {opcao.prazoDias} dias úteis
                              </small>
                            </div>

                            <strong>
                              {formatPrice(
                                opcao.valor,
                              )}
                            </strong>
                          </button>
                        );
                      },
                    )}
                  </div>
                )}
                </div>
              )}

              {FRETE_DESABILITADO && (
                <div className="review-block">
                  <div className="review-block-title">
                    <Truck size={20} />

                    <strong>
                      Frete temporariamente desabilitado
                    </strong>
                  </div>

                  <p>
                    O pedido será criado com frete de R$ 0,00
                    somente durante os testes do Mercado Pago.
                  </p>
                </div>
              )}

              <div className="review-total">
                <div>
                  <span>Subtotal</span>
                  <strong>
                    {formatPrice(cartTotal)}
                  </strong>
                </div>

                <div>
                  <span>Frete</span>
                  <strong>
                    {freteSelecionado
                      ? formatPrice(
                          freteSelecionado.valor,
                        )
                      : "A calcular"}
                  </strong>
                </div>

                <div>
                  <span>Total parcial</span>
                  <strong>
                    {formatPrice(valorBase)}
                  </strong>
                </div>
              </div>

              <div className="checkout-navigation">
                <button
                  type="button"
                  className="checkout-back-button"
                  onClick={() => irParaEtapa("endereco")}
                >
                  <ChevronLeft size={19} />
                  Voltar para endereço
                </button>

                <button
                  type="button"
                  className="checkout-primary-button"
                  onClick={continuarParaPagamento}
                  disabled={
                    !FRETE_DESABILITADO &&
                    !freteSelecionado
                  }
                >
                  Continuar para pagamento
                </button>
              </div>
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

              {paymentMethod &&
                enderecoSelecionadoId && (
                  <MercadoPagoPayment
                    key={paymentMethod}
                    metodo={paymentMethod}
                    token={token || ""}
                    enderecoId={
                      enderecoSelecionadoId
                    }
                    cart={cart}
                    valorBase={valorBase}
                    totalCartao={totalCartao}
                    freteId={
                      FRETE_DESABILITADO
                        ? "teste"
                        : freteSelecionado?.id ||
                          ""
                    }
                    onPaymentCreated={(
                      paymentId,
                      status,
                    ) => {
                      console.log(
                        "Pagamento criado:",
                        paymentId,
                        status,
                      );
                    }}
                  />
                )}

              <div className="checkout-navigation">
                <button
                  type="button"
                  className="checkout-back-button"
                  onClick={() => irParaEtapa("revisao")}
                >
                  <ChevronLeft size={19} />
                  Voltar para revisão
                </button>

                <div className="checkout-payment-hint">
                  Selecione uma forma acima para abrir o
                  pagamento seguro do Mercado Pago.
                </div>
              </div>
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
              <strong>
                {FRETE_DESABILITADO
                  ? formatPrice(0)
                  : freteSelecionado
                    ? formatPrice(valorFrete)
                    : "A calcular"}
              </strong>
            </div>

            {(paymentMethod === "credit_card" ||
              paymentMethod === "debit_card") && (
              <div className="summary-card-fee">
                <span>
                  Acréscimo do cartão (5%)
                </span>

                <strong>
                  {formatPrice(acrescimoCartao)}
                </strong>
              </div>
            )}

            <div className="summary-total">
              <span>
                {paymentMethod
                  ? "Total"
                  : "Total parcial"}
              </span>

              <strong>
                {formatPrice(totalSelecionado)}
              </strong>
            </div>
          </div>

          <p className="summary-note">
            {FRETE_DESABILITADO
              ? "Frete temporariamente zerado para testes do pagamento."
              : freteSelecionado
                ? `${freteSelecionado.servico} · aproximadamente ${freteSelecionado.prazoDias} dias úteis após a postagem.`
                : "Calcule e selecione o frete na etapa de revisão."}
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
                          somenteLetras(
                            event.target.value,
                          ),
                      }),
                    )
                  }
                />
              </label>

              <label>
                <span>CEP</span>

                <input
                  inputMode="numeric"
                  maxLength={9}
                  placeholder="00000-000"
                  value={enderecoForm.cep}
                  onChange={(event) =>
                    setEnderecoForm(
                      (current) => ({
                        ...current,
                        cep: formatarCep(
                          event.target.value,
                        ),
                      }),
                    )
                  }
                />
              </label>

              <label>
                <span>Estado</span>

                <select
                  value={enderecoForm.estado}
                  onChange={(event) =>
                    setEnderecoForm(
                      (current) => ({
                        ...current,
                        estado: event.target.value,
                      }),
                    )
                  }
                >
                  <option value="">
                    Selecione
                  </option>

                  {ESTADOS_BRASIL.map((estado) => (
                    <option
                      key={estado.sigla}
                      value={estado.sigla}
                    >
                      {estado.sigla} — {estado.nome}
                    </option>
                  ))}
                </select>
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
                  inputMode="numeric"
                  value={enderecoForm.numero}
                  onChange={(event) =>
                    setEnderecoForm(
                      (current) => ({
                        ...current,
                        numero: somenteNumeros(
                          event.target.value,
                          8,
                        ),
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
                        cidade: somenteLetras(
                          event.target.value,
                        ),
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
