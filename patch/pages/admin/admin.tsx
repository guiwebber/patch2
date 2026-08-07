import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  CircleDollarSign,
  LoaderCircle,
  Package,
  Plus,
  RefreshCw,
  Search,
  Send,
  Truck,
  XCircle,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "../../src/context/AuthContext";

import "./admin.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

type FiltroStatus =
  | "todos"
  | "aguardando_pagamento"
  | "em_producao"
  | "enviado"
  | "entregue"
  | "cancelado";

type ItemPedido = {
  produto_id: number;
  nome_produto: string;
  imagem?: string | null;
  quantidade: number;
  preco_unitario: number | string;
  subtotal: number | string;
};

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

type PedidoAdmin = {
  id: number;
  numero_pedido: string;
  status: string;
  status_pagamento: string;
  total: number | string;
  metodo_pagamento: string;
  parcelas: number | null;
  codigo_rastreio: string | null;
  url_rastreio: string | null;
  endereco_entrega: EnderecoEntrega | null;
  criado_em: string;
  pago_em: string | null;
  enviado_em: string | null;
  entregue_em: string | null;
  cliente_id: number;
  cliente_nome: string;
  cliente_email: string;
  cliente_telefone: string | null;
  itens: ItemPedido[];
};

type Resumo = {
  aguardando_pagamento: number;
  em_producao: number;
  enviados: number;
  entregues: number;
  cancelados: number;
  faturamento_mes: number | string;
};

function dinheiro(valor: number | string | null | undefined) {
  return Number(valor || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function dataHora(valor: string | null) {
  if (!valor) {
    return "—";
  }

  return new Date(valor).toLocaleString("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

function statusTexto(status: string) {
  const textos: Record<string, string> = {
    aguardando_pagamento: "Aguardando pagamento",
    pago: "Pago",
    em_producao: "Em produção",
    enviado: "Enviado",
    entregue: "Entregue",
    cancelado: "Cancelado",
  };

  return textos[status] || status;
}

export default function Admin() {
  const navigate = useNavigate();

  const { token, sair } = useAuth();
  useEffect(() => {
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: "instant",
    });
  }, []);

  const [pedidos, setPedidos] = useState<PedidoAdmin[]>([]);

  const [resumo, setResumo] = useState<Resumo | null>(null);

  const [filtro, setFiltro] = useState<FiltroStatus>("todos");

  const [busca, setBusca] = useState("");

  const [buscaAplicada, setBuscaAplicada] = useState("");

  const [abertos, setAbertos] = useState<number[]>([]);

  const [rastreios, setRastreios] = useState<
    Record<
      number,
      {
        codigo: string;
        url: string;
      }
    >
  >({});

  const [carregando, setCarregando] = useState(true);

  const [salvandoId, setSalvandoId] = useState<number | null>(null);

  const [erro, setErro] = useState("");

  const [mensagem, setMensagem] = useState("");

  const headers = useMemo(
    () => ({
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    }),
    [token],
  );

  const tratarSemPermissao = useCallback(
    (response: Response) => {
      if (response.status === 401) {
        sair();
        navigate("/login");
        return true;
      }

      if (response.status === 403) {
        navigate("/");
        return true;
      }

      return false;
    },
    [navigate, sair],
  );

  const carregarResumo = useCallback(async () => {
    if (!token) {
      return;
    }

    const response = await fetch(`${API_URL}/admin/resumo`, {
      headers,
    });

    if (tratarSemPermissao(response)) {
      return;
    }

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.erro || "Não foi possível carregar o resumo.");
    }

    setResumo(data.resumo);
  }, [headers, token, tratarSemPermissao]);

  const carregarPedidos = useCallback(async () => {
    if (!token) {
      return;
    }

    const params = new URLSearchParams({
      status: filtro,
    });

    if (buscaAplicada) {
      params.set("busca", buscaAplicada);
    }

    const response = await fetch(
      `${API_URL}/admin/pedidos?${params.toString()}`,
      {
        headers,
      },
    );

    if (tratarSemPermissao(response)) {
      return;
    }

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.erro || "Não foi possível carregar os pedidos.");
    }

    const recebidos = (data.pedidos || []) as PedidoAdmin[];

    setPedidos(recebidos);

    setRastreios(
      Object.fromEntries(
        recebidos.map((pedido) => [
          pedido.id,
          {
            codigo: pedido.codigo_rastreio || "",
            url: pedido.url_rastreio || "",
          },
        ]),
      ),
    );
  }, [buscaAplicada, filtro, headers, token, tratarSemPermissao]);

  const carregarTudo = useCallback(async () => {
    try {
      setCarregando(true);
      setErro("");

      await Promise.all([carregarResumo(), carregarPedidos()]);
    } catch (error) {
      console.error(error);

      setErro(
        error instanceof Error
          ? error.message
          : "Não foi possível carregar o painel.",
      );
    } finally {
      setCarregando(false);
    }
  }, [carregarPedidos, carregarResumo]);

  useEffect(() => {
    void carregarTudo();
  }, [carregarTudo]);

  function alternarPedido(pedidoId: number) {
    setAbertos((atuais) =>
      atuais.includes(pedidoId)
        ? atuais.filter((id) => id !== pedidoId)
        : [...atuais, pedidoId],
    );
  }

  async function atualizarStatus(pedidoId: number, status: string) {
    const rastreio = rastreios[pedidoId] || {
      codigo: "",
      url: "",
    };

    try {
      setSalvandoId(pedidoId);

      setErro("");
      setMensagem("");

      const response = await fetch(
        `${API_URL}/admin/pedidos/${pedidoId}/status`,
        {
          method: "PATCH",
          headers,
          body: JSON.stringify({
            status,
            codigoRastreio: rastreio.codigo,
            urlRastreio: rastreio.url,
          }),
        },
      );

      if (tratarSemPermissao(response)) {
        return;
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.erro || "Não foi possível atualizar o pedido.");
      }

      setMensagem(data.mensagem);

      await Promise.all([carregarResumo(), carregarPedidos()]);
    } catch (error) {
      console.error(error);

      setErro(
        error instanceof Error
          ? error.message
          : "Não foi possível atualizar o pedido.",
      );
    } finally {
      setSalvandoId(null);
    }
  }

  function aplicarBusca(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setBuscaAplicada(busca.trim());
  }

  if (carregando) {
    return (
      <main className="admin-loading">
        <LoaderCircle className="admin-spin" size={30} />
        Carregando painel...
      </main>
    );
  }

  return (
    <main className="admin-page">
      <section className="admin-shell">
        <header className="admin-header">
          <div>
            <span>Administração</span>

            <h1>Pedidos da loja</h1>

            <p>Acompanhe a produção e atualize o envio das encomendas.</p>
          </div>

          <div className="admin-header-actions">
            <button
              type="button"
              className="admin-refresh"
              onClick={() => navigate("/admin/produtos")}
            >
              <Plus size={18} />
              Gerenciar produtos
            </button>

            <button
              type="button"
              className="admin-refresh"
              onClick={() => void carregarTudo()}
            >
              <RefreshCw size={18} />
              Atualizar
            </button>
          </div>
        </header>

        {erro && <div className="admin-alert error">{erro}</div>}

        {mensagem && <div className="admin-alert success">{mensagem}</div>}

        {resumo && (
          <section className="admin-summary">
            <article>
              <Package size={22} />
              <span>Em produção</span>
              <strong>{resumo.em_producao}</strong>
            </article>

            <article>
              <Truck size={22} />
              <span>Enviados</span>
              <strong>{resumo.enviados}</strong>
            </article>

            <article>
              <CheckCircle2 size={22} />
              <span>Entregues</span>
              <strong>{resumo.entregues}</strong>
            </article>

            <article>
              <CircleDollarSign size={22} />
              <span>Faturamento no mês</span>
              <strong>{dinheiro(resumo.faturamento_mes)}</strong>
            </article>
          </section>
        )}

        <section className="admin-toolbar">
          <div className="admin-filters">
            {(
              [
                ["todos", "Todos"],
                ["aguardando_pagamento", "Aguardando"],
                ["em_producao", "Produção"],
                ["enviado", "Enviados"],
                ["entregue", "Entregues"],
                ["cancelado", "Cancelados"],
              ] as Array<[FiltroStatus, string]>
            ).map(([valor, texto]) => (
              <button
                key={valor}
                type="button"
                className={filtro === valor ? "active" : ""}
                onClick={() => setFiltro(valor)}
              >
                {texto}
              </button>
            ))}
          </div>

          <form className="admin-search" onSubmit={aplicarBusca}>
            <Search size={18} />

            <input
              value={busca}
              onChange={(event) => setBusca(event.target.value)}
              placeholder="Pedido, cliente ou e-mail"
            />

            <button type="submit">Buscar</button>
          </form>
        </section>

        {pedidos.length === 0 ? (
          <div className="admin-empty">
            <Package size={54} />
            <h2>Nenhum pedido encontrado</h2>
          </div>
        ) : (
          <section className="admin-orders">
            {pedidos.map((pedido) => {
              const aberto = abertos.includes(pedido.id);

              const rastreio = rastreios[pedido.id] || {
                codigo: "",
                url: "",
              };

              return (
                <article className="admin-order-card" key={pedido.id}>
                  <button
                    type="button"
                    className="admin-order-summary"
                    onClick={() => alternarPedido(pedido.id)}
                  >
                    <div>
                      <strong>{pedido.numero_pedido}</strong>
                      <span>
                        {pedido.cliente_nome} · {pedido.cliente_email}
                      </span>
                    </div>

                    <div>
                      <span>Pedido</span>
                      <strong className={`admin-status ${pedido.status}`}>
                        {statusTexto(pedido.status)}
                      </strong>
                    </div>

                    <div>
                      <span>Pagamento</span>
                      <strong>{pedido.status_pagamento}</strong>
                    </div>

                    <div>
                      <span>Total</span>
                      <strong>{dinheiro(pedido.total)}</strong>
                    </div>

                    {aberto ? (
                      <ChevronUp size={22} />
                    ) : (
                      <ChevronDown size={22} />
                    )}
                  </button>

                  {aberto && (
                    <div className="admin-order-details">
                      <div className="admin-order-grid">
                        <section>
                          <h3>Produtos</h3>

                          <div className="admin-items">
                            {pedido.itens.map((item) => (
                              <div key={`${pedido.id}-${item.produto_id}`}>
                                {item.imagem ? (
                                  <img
                                    src={item.imagem}
                                    alt={item.nome_produto}
                                  />
                                ) : (
                                  <span className="admin-item-placeholder">
                                    <Package size={22} />
                                  </span>
                                )}

                                <div>
                                  <strong>{item.nome_produto}</strong>

                                  <small>{item.quantidade} unidade(s)</small>
                                </div>

                                <strong>{dinheiro(item.subtotal)}</strong>
                              </div>
                            ))}
                          </div>
                        </section>

                        <section>
                          <h3>Cliente e entrega</h3>

                          <div className="admin-info-list">
                            <p>
                              <strong>Cliente:</strong> {pedido.cliente_nome}
                            </p>

                            <p>
                              <strong>E-mail:</strong> {pedido.cliente_email}
                            </p>

                            <p>
                              <strong>Telefone:</strong>{" "}
                              {pedido.cliente_telefone || "Não informado"}
                            </p>

                            <p>
                              <strong>Criado:</strong>{" "}
                              {dataHora(pedido.criado_em)}
                            </p>

                            {pedido.endereco_entrega && (
                              <p>
                                <strong>Endereço:</strong>{" "}
                                {pedido.endereco_entrega.rua},{" "}
                                {pedido.endereco_entrega.numero} —{" "}
                                {pedido.endereco_entrega.cidade}/
                                {pedido.endereco_entrega.estado}
                              </p>
                            )}
                          </div>
                        </section>
                      </div>

                      <section className="admin-order-actions">
                        {pedido.status === "em_producao" && (
                          <>
                            <label>
                              Código de rastreio
                              <input
                                value={rastreio.codigo}
                                onChange={(event) =>
                                  setRastreios((atuais) => ({
                                    ...atuais,
                                    [pedido.id]: {
                                      ...rastreio,
                                      codigo: event.target.value,
                                    },
                                  }))
                                }
                              />
                            </label>

                            <label>
                              Link de rastreio
                              <input
                                value={rastreio.url}
                                onChange={(event) =>
                                  setRastreios((atuais) => ({
                                    ...atuais,
                                    [pedido.id]: {
                                      ...rastreio,
                                      url: event.target.value,
                                    },
                                  }))
                                }
                                placeholder="https://..."
                              />
                            </label>

                            <button
                              type="button"
                              className="send"
                              disabled={salvandoId === pedido.id}
                              onClick={() =>
                                void atualizarStatus(pedido.id, "enviado")
                              }
                            >
                              <Send size={18} />
                              Marcar como enviado
                            </button>
                          </>
                        )}

                        {pedido.status === "enviado" && (
                          <button
                            type="button"
                            className="deliver"
                            disabled={salvandoId === pedido.id}
                            onClick={() =>
                              void atualizarStatus(pedido.id, "entregue")
                            }
                          >
                            <CheckCircle2 size={18} />
                            Marcar como entregue
                          </button>
                        )}

                        {!["entregue", "cancelado"].includes(pedido.status) && (
                          <button
                            type="button"
                            className="cancel"
                            disabled={salvandoId === pedido.id}
                            onClick={() => {
                              const confirmar = window.confirm(
                                "Deseja cancelar este pedido?",
                              );

                              if (confirmar) {
                                void atualizarStatus(pedido.id, "cancelado");
                              }
                            }}
                          >
                            <XCircle size={18} />
                            Cancelar pedido
                          </button>
                        )}
                      </section>
                    </div>
                  )}
                </article>
              );
            })}
          </section>
        )}
      </section>
    </main>
  );
}
