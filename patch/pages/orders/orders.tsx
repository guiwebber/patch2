import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  Check,
  ChevronDown,
  ChevronUp,
  CircleDollarSign,
  Clipboard,
  Clock3,
  ExternalLink,
  LoaderCircle,
  MapPin,
  Package,
  PackageCheck,
  RefreshCw,
  ShoppingBag,
  Truck,
} from "lucide-react";
import {
  useLocation,
  useNavigate,
  useSearchParams,
} from "react-router-dom";

import { useAuth } from "../../src/context/AuthContext";

import "./orders.css";

const API_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:3001";

type Periodo =
  | "3m"
  | "6m"
  | "1a"
  | "todos";

type EnderecoEntrega = {
  nome_destinatario?: string;
  cep?: string;
  rua?: string;
  numero?: string;
  complemento?: string | null;
  bairro?: string;
  cidade?: string;
  estado?: string;
};

type ItemPedido = {
  produto_id: number;
  nome_produto: string;
  categoria?: string | null;
  imagem?: string | null;
  quantidade: number;
  preco_unitario: number | string;
  subtotal: number | string;
};

type Pedido = {
  id: number;
  numero_pedido: string;
  status: string;
  status_pagamento: string;
  subtotal: number | string;
  valor_frete: number | string;
  desconto: number | string;
  acrescimo_pagamento: number | string;
  percentual_acrescimo: number | string;
  total: number | string;
  metodo_pagamento: string;
  parcelas: number | null;
  valor_parcela: number | string | null;
  servico_frete: string | null;
  transportadora: string | null;
  prazo_entrega_dias: number | null;
  codigo_rastreio: string | null;
  url_rastreio: string | null;
  endereco_entrega: EnderecoEntrega | null;
  mercado_pago_status: string | null;
  mercado_pago_status_detail: string | null;
  pix_qr_code: string | null;
  pix_qr_code_base64: string | null;
  pix_expiracao: string | null;
  pago_em: string | null;
  enviado_em: string | null;
  entregue_em: string | null;
  cancelado_em: string | null;
  criado_em: string;
  atualizado_em: string;
  itens: ItemPedido[];
};

function dinheiro(
  valor: number | string | null | undefined,
) {
  return Number(valor || 0).toLocaleString(
    "pt-BR",
    {
      style: "currency",
      currency: "BRL",
    },
  );
}

function dataHora(valor: string | null) {
  if (!valor) return "—";

  return new Date(valor).toLocaleString(
    "pt-BR",
    {
      dateStyle: "short",
      timeStyle: "short",
    },
  );
}

function formatarCep(cep?: string) {
  const numeros = (cep || "").replace(
    /\D/g,
    "",
  );

  if (numeros.length !== 8) {
    return cep || "";
  }

  return `${numeros.slice(
    0,
    5,
  )}-${numeros.slice(5)}`;
}

function statusPagamentoTexto(
  status: string,
) {
  const textos: Record<string, string> = {
    pendente: "Aguardando pagamento",
    aprovado: "Pagamento aprovado",
    rejeitado: "Pagamento recusado",
    cancelado: "Pagamento cancelado",
  };

  return textos[status] || status;
}

function statusPedidoTexto(status: string) {
  const textos: Record<string, string> = {
    aguardando_pagamento:
      "Aguardando pagamento",
    pagamento_aprovado:
      "Pagamento aprovado",
    em_producao: "Em produção",
    pronto_para_envio:
      "Pronto para envio",
    enviado: "Enviado",
    entregue: "Entregue",
    cancelado: "Cancelado",
  };

  return textos[status] || status;
}

function metodoTexto(
  metodo: string,
  parcelas: number | null,
) {
  if (metodo === "pix") {
    return "Pix";
  }

  if (metodo === "cartao") {
    return parcelas && parcelas > 1
      ? `Cartão em ${parcelas}x`
      : "Cartão";
  }

  return metodo || "—";
}

function etapaConcluida(
  pedido: Pedido,
  etapa:
    | "pagamento"
    | "producao"
    | "envio"
    | "entrega",
) {
  if (pedido.status === "cancelado") {
    return false;
  }

  const ordem: Record<string, number> = {
    aguardando_pagamento: 0,
    pagamento_aprovado: 1,
    em_producao: 2,
    pronto_para_envio: 2,
    enviado: 3,
    entregue: 4,
  };

  const valorAtual =
    ordem[pedido.status] || 0;

  const minimo = {
    pagamento: 1,
    producao: 2,
    envio: 3,
    entrega: 4,
  }[etapa];

  return valorAtual >= minimo;
}

export default function Orders() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const {
    token,
    estaLogado,
    sair,
  } = useAuth();

  const pedidoDestacadoId = Number(
    searchParams.get("pedido"),
  );

  const [periodo, setPeriodo] =
    useState<Periodo>("3m");
  const [pedidos, setPedidos] =
    useState<Pedido[]>([]);
  const [abertos, setAbertos] =
    useState<number[]>([]);
  const [carregando, setCarregando] =
    useState(true);
  const [atualizando, setAtualizando] =
    useState(false);
  const [erro, setErro] = useState("");
  const [copiado, setCopiado] =
    useState<number | null>(null);

  const novoPedido = Boolean(
    (
      location.state as {
        novoPedido?: boolean;
      } | null
    )?.novoPedido,
  );

  const carregarPedidos = useCallback(
    async (silencioso = false) => {
      if (!token) return;

      silencioso
        ? setAtualizando(true)
        : setCarregando(true);

      try {
        const response = await fetch(
          `${API_URL}/pedidos?periodo=${periodo}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

        if (response.status === 401) {
          sair();
          navigate("/login");
          return;
        }

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.erro ||
              "Não foi possível carregar os pedidos.",
          );
        }

        const pedidosRecebidos =
          (data.pedidos || []) as Pedido[];

        setPedidos(pedidosRecebidos);
        setErro("");

        if (
          Number.isInteger(
            pedidoDestacadoId,
          ) &&
          pedidoDestacadoId > 0
        ) {
          setAbertos((atuais) =>
            atuais.includes(
              pedidoDestacadoId,
            )
              ? atuais
              : [
                  ...atuais,
                  pedidoDestacadoId,
                ],
          );
        }
      } catch (error) {
        console.error(error);

        setErro(
          error instanceof Error
            ? error.message
            : "Não foi possível carregar os pedidos.",
        );
      } finally {
        setCarregando(false);
        setAtualizando(false);
      }
    },
    [
      token,
      periodo,
      pedidoDestacadoId,
      navigate,
      sair,
    ],
  );

  useEffect(() => {
    if (!estaLogado || !token) {
      navigate("/login");
      return;
    }

    void carregarPedidos();
  }, [
    estaLogado,
    token,
    carregarPedidos,
    navigate,
  ]);

  const existePagamentoPendente =
    useMemo(
      () =>
        pedidos.some(
          (pedido) =>
            pedido.status_pagamento ===
            "pendente",
        ),
      [pedidos],
    );

  useEffect(() => {
    if (!existePagamentoPendente) {
      return;
    }

    const intervalo = window.setInterval(
      () => {
        void carregarPedidos(true);
      },
      8000,
    );

    return () => {
      window.clearInterval(intervalo);
    };
  }, [
    existePagamentoPendente,
    carregarPedidos,
  ]);

  function alternarPedido(id: number) {
    setAbertos((atuais) =>
      atuais.includes(id)
        ? atuais.filter(
            (pedidoId) =>
              pedidoId !== id,
          )
        : [...atuais, id],
    );
  }

  async function copiarPix(
    pedido: Pedido,
  ) {
    if (!pedido.pix_qr_code) return;

    try {
      await navigator.clipboard.writeText(
        pedido.pix_qr_code,
      );

      setCopiado(pedido.id);

      window.setTimeout(() => {
        setCopiado(null);
      }, 2200);
    } catch {
      setErro(
        "Não foi possível copiar automaticamente o código Pix.",
      );
    }
  }

  if (carregando) {
    return (
      <main className="orders-loading">
        <LoaderCircle
          className="orders-spin"
          size={30}
        />
        Carregando seus pedidos...
      </main>
    );
  }

  return (
    <main className="orders-page">
      <section className="orders-shell">
        <header className="orders-header">
          <div>
            <span>Minha conta</span>
            <h1>Meus pedidos</h1>
            <p>
              Acompanhe pagamentos, produção,
              envio e entrega das suas
              encomendas.
            </p>
          </div>

          <button
            type="button"
            className="orders-refresh"
            onClick={() =>
              void carregarPedidos(true)
            }
            disabled={atualizando}
          >
            <RefreshCw
              size={18}
              className={
                atualizando
                  ? "orders-spin"
                  : ""
              }
            />
            Atualizar
          </button>
        </header>

        {novoPedido && (
          <div className="orders-success">
            <PackageCheck size={22} />
            Pedido criado com sucesso. A
            situação do pagamento será
            atualizada automaticamente.
          </div>
        )}

        {erro && (
          <div className="orders-error">
            {erro}
          </div>
        )}

        <div className="orders-toolbar">
          <div>
            <strong>
              Histórico de pedidos
            </strong>
            <span>
              {pedidos.length} pedido
              {pedidos.length === 1
                ? ""
                : "s"}
            </span>
          </div>

          <label>
            <span>Período</span>
            <select
              value={periodo}
              onChange={(event) =>
                setPeriodo(
                  event.target
                    .value as Periodo,
                )
              }
            >
              <option value="3m">
                Últimos 3 meses
              </option>
              <option value="6m">
                Últimos 6 meses
              </option>
              <option value="1a">
                Último ano
              </option>
              <option value="todos">
                Todos
              </option>
            </select>
          </label>
        </div>

        {pedidos.length === 0 ? (
          <div className="orders-empty">
            <ShoppingBag size={60} />
            <h2>
              Você ainda não possui pedidos
            </h2>
            <p>
              Quando finalizar uma compra, ela
              aparecerá aqui com todas as
              informações.
            </p>
            <button
              type="button"
              onClick={() => navigate("/")}
            >
              Ver produtos
            </button>
          </div>
        ) : (
          <div className="orders-list">
            {pedidos.map((pedido) => {
              const aberto =
                abertos.includes(pedido.id);

              const destacado =
                pedido.id ===
                pedidoDestacadoId;

              return (
                <article
                  key={pedido.id}
                  className={`order-card ${
                    destacado
                      ? "highlighted"
                      : ""
                  }`}
                >
                  <button
                    type="button"
                    className="order-summary"
                    onClick={() =>
                      alternarPedido(
                        pedido.id,
                      )
                    }
                  >
                    <div className="order-number">
                      <Package size={23} />
                      <div>
                        <strong>
                          {pedido.numero_pedido}
                        </strong>
                        <span>
                          Criado em{" "}
                          {dataHora(
                            pedido.criado_em,
                          )}
                        </span>
                      </div>
                    </div>

                    <div className="order-summary-info">
                      <div>
                        <span>Pagamento</span>
                        <strong
                          className={`status-payment ${pedido.status_pagamento}`}
                        >
                          {statusPagamentoTexto(
                            pedido.status_pagamento,
                          )}
                        </strong>
                      </div>

                      <div>
                        <span>Pedido</span>
                        <strong>
                          {statusPedidoTexto(
                            pedido.status,
                          )}
                        </strong>
                      </div>

                      <div>
                        <span>Total</span>
                        <strong>
                          {dinheiro(
                            pedido.total,
                          )}
                        </strong>
                      </div>

                      {aberto ? (
                        <ChevronUp size={22} />
                      ) : (
                        <ChevronDown
                          size={22}
                        />
                      )}
                    </div>
                  </button>

                  {aberto && (
                    <div className="order-details">
                      <section className="order-timeline">
                        <div
                          className={
                            etapaConcluida(
                              pedido,
                              "pagamento",
                            )
                              ? "done"
                              : "current"
                          }
                        >
                          <span>
                            <CircleDollarSign
                              size={20}
                            />
                          </span>
                          <strong>
                            Pagamento
                          </strong>
                          <small>
                            {statusPagamentoTexto(
                              pedido.status_pagamento,
                            )}
                          </small>
                        </div>

                        <div
                          className={
                            etapaConcluida(
                              pedido,
                              "producao",
                            )
                              ? "done"
                              : ""
                          }
                        >
                          <span>
                            <Clock3 size={20} />
                          </span>
                          <strong>
                            Produção
                          </strong>
                          <small>
                            Produção artesanal
                          </small>
                        </div>

                        <div
                          className={
                            etapaConcluida(
                              pedido,
                              "envio",
                            )
                              ? "done"
                              : ""
                          }
                        >
                          <span>
                            <Truck size={20} />
                          </span>
                          <strong>
                            Envio
                          </strong>
                          <small>
                            {pedido.enviado_em
                              ? dataHora(
                                  pedido.enviado_em,
                                )
                              : "Aguardando"}
                          </small>
                        </div>

                        <div
                          className={
                            etapaConcluida(
                              pedido,
                              "entrega",
                            )
                              ? "done"
                              : ""
                          }
                        >
                          <span>
                            <PackageCheck
                              size={20}
                            />
                          </span>
                          <strong>
                            Entrega
                          </strong>
                          <small>
                            {pedido.entregue_em
                              ? dataHora(
                                  pedido.entregue_em,
                                )
                              : "Aguardando"}
                          </small>
                        </div>
                      </section>

                      {pedido.metodo_pagamento ===
                        "pix" &&
                        pedido.status_pagamento ===
                          "pendente" &&
                        (pedido.pix_qr_code ||
                          pedido.pix_qr_code_base64) && (
                          <section className="order-pix">
                            <div>
                              <h3>
                                Pague seu pedido
                                por Pix
                              </h3>
                              <p>
                                A página atualiza
                                automaticamente
                                quando o Mercado
                                Pago confirmar o
                                pagamento.
                              </p>
                            </div>

                            <div className="order-pix-content">
                              {pedido.pix_qr_code_base64 && (
                                <img
                                  src={`data:image/png;base64,${pedido.pix_qr_code_base64}`}
                                  alt="QR Code Pix do pedido"
                                />
                              )}

                              {pedido.pix_qr_code && (
                                <div>
                                  <label>
                                    Pix Copia e
                                    Cola
                                    <textarea
                                      value={
                                        pedido.pix_qr_code
                                      }
                                      readOnly
                                    />
                                  </label>

                                  <button
                                    type="button"
                                    onClick={() =>
                                      copiarPix(
                                        pedido,
                                      )
                                    }
                                  >
                                    {copiado ===
                                    pedido.id ? (
                                      <Check
                                        size={18}
                                      />
                                    ) : (
                                      <Clipboard
                                        size={18}
                                      />
                                    )}

                                    {copiado ===
                                    pedido.id
                                      ? "Código copiado"
                                      : "Copiar código"}
                                  </button>
                                </div>
                              )}
                            </div>

                            {pedido.pix_expiracao && (
                              <small>
                                Pix válido até{" "}
                                {dataHora(
                                  pedido.pix_expiracao,
                                )}
                              </small>
                            )}
                          </section>
                        )}

                      <div className="order-detail-grid">
                        <section className="order-section">
                          <h3>
                            Produtos
                          </h3>

                          <div className="order-items">
                            {pedido.itens.map(
                              (item) => (
                                <div
                                  className="order-item"
                                  key={`${pedido.id}-${item.produto_id}`}
                                >
                                  {item.imagem ? (
                                    <img
                                      src={
                                        item.imagem
                                      }
                                      alt={
                                        item.nome_produto
                                      }
                                    />
                                  ) : (
                                    <span className="order-item-placeholder">
                                      <Package
                                        size={24}
                                      />
                                    </span>
                                  )}

                                  <div>
                                    <strong>
                                      {
                                        item.nome_produto
                                      }
                                    </strong>
                                    <small>
                                      Quantidade:{" "}
                                      {
                                        item.quantidade
                                      }
                                    </small>
                                  </div>

                                  <strong>
                                    {dinheiro(
                                      item.subtotal,
                                    )}
                                  </strong>
                                </div>
                              ),
                            )}
                          </div>
                        </section>

                        <div className="order-side">
                          <section className="order-section">
                            <h3>
                              Pagamento
                            </h3>

                            <dl>
                              <div>
                                <dt>
                                  Método
                                </dt>
                                <dd>
                                  {metodoTexto(
                                    pedido.metodo_pagamento,
                                    pedido.parcelas,
                                  )}
                                </dd>
                              </div>
                              <div>
                                <dt>
                                  Subtotal
                                </dt>
                                <dd>
                                  {dinheiro(
                                    pedido.subtotal,
                                  )}
                                </dd>
                              </div>
                              <div>
                                <dt>
                                  Frete
                                </dt>
                                <dd>
                                  {dinheiro(
                                    pedido.valor_frete,
                                  )}
                                </dd>
                              </div>

                              {Number(
                                pedido.acrescimo_pagamento,
                              ) > 0 && (
                                <div>
                                  <dt>
                                    Acréscimo
                                  </dt>
                                  <dd>
                                    {dinheiro(
                                      pedido.acrescimo_pagamento,
                                    )}
                                  </dd>
                                </div>
                              )}

                              <div className="order-total">
                                <dt>Total</dt>
                                <dd>
                                  {dinheiro(
                                    pedido.total,
                                  )}
                                </dd>
                              </div>
                            </dl>
                          </section>

                          <section className="order-section">
                            <h3>
                              <MapPin
                                size={19}
                              />
                              Endereço de
                              entrega
                            </h3>

                            {pedido.endereco_entrega ? (
                              <address>
                                <strong>
                                  {
                                    pedido
                                      .endereco_entrega
                                      .nome_destinatario
                                  }
                                </strong>
                                <span>
                                  {
                                    pedido
                                      .endereco_entrega
                                      .rua
                                  }
                                  ,{" "}
                                  {
                                    pedido
                                      .endereco_entrega
                                      .numero
                                  }
                                </span>

                                {pedido
                                  .endereco_entrega
                                  .complemento && (
                                  <span>
                                    {
                                      pedido
                                        .endereco_entrega
                                        .complemento
                                    }
                                  </span>
                                )}

                                <span>
                                  {
                                    pedido
                                      .endereco_entrega
                                      .bairro
                                  }{" "}
                                  —{" "}
                                  {
                                    pedido
                                      .endereco_entrega
                                      .cidade
                                  }
                                  /
                                  {
                                    pedido
                                      .endereco_entrega
                                      .estado
                                  }
                                </span>

                                <span>
                                  CEP{" "}
                                  {formatarCep(
                                    pedido
                                      .endereco_entrega
                                      .cep,
                                  )}
                                </span>
                              </address>
                            ) : (
                              <p>
                                Endereço não
                                disponível.
                              </p>
                            )}
                          </section>

                          {(pedido.codigo_rastreio ||
                            pedido.url_rastreio) && (
                            <section className="order-section">
                              <h3>
                                <Truck
                                  size={19}
                                />
                                Rastreamento
                              </h3>

                              {pedido.codigo_rastreio && (
                                <p>
                                  Código:{" "}
                                  <strong>
                                    {
                                      pedido.codigo_rastreio
                                    }
                                  </strong>
                                </p>
                              )}

                              {pedido.url_rastreio && (
                                <a
                                  href={
                                    pedido.url_rastreio
                                  }
                                  target="_blank"
                                  rel="noreferrer"
                                >
                                  Acompanhar
                                  entrega
                                  <ExternalLink
                                    size={16}
                                  />
                                </a>
                              )}
                            </section>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
