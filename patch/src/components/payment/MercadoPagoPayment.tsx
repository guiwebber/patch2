import {
  useMemo,
  useState,
} from "react";
import {
  CardPayment,
  initMercadoPago,
} from "@mercadopago/sdk-react";
import {
  CheckCircle2,
  Clipboard,
  LoaderCircle,
  QrCode,
} from "lucide-react";
import {
  useNavigate,
} from "react-router-dom";

import type {
  CartItem,
} from "../../../types/product";

import "./mercadoPagoPayment.css";

const API_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:3001";

const publicKey =
  import.meta.env
    .VITE_MERCADO_PAGO_PUBLIC_KEY;

if (publicKey) {
  initMercadoPago(publicKey);
}

export type MetodoPagamento =
  | "pix"
  | "credit_card"
  | "debit_card";

type MercadoPagoPaymentProps = {
  metodo: MetodoPagamento;
  token: string;
  enderecoId: number;
  cart: CartItem[];
  valorBase: number;
  totalCartao: number;
  onPaymentCreated?: (
    paymentId: string,
    status: string,
  ) => void;
};

type PixResponse = {
  pedidoId: number;
  numeroPedido?: string;
  paymentId: string;
  status: string;
  qrCode?: string;
  qrCodeBase64?: string;
  expiracao?: string | null;
};

type CardResponse = {
  pedidoId: number;
  numeroPedido?: string;
  paymentId: string;
  status: string;
  statusDetail?: string;
};

type CardFormData = {
  token?: string;
  issuer_id?: string | number;
  payment_method_id?: string;
  transaction_amount?: number;
  installments?: number;
  payer?: {
    email?: string;
    identification?: {
      type?: string;
      number?: string;
    };
  };
};

function itensDoCarrinho(
  cart: CartItem[],
) {
  return cart.map(
    (item: CartItem) => ({
      produtoId: item.product.id,
      quantidade: item.quantity,
    }),
  );
}

export default function MercadoPagoPayment({
  metodo,
  token,
  enderecoId,
  cart,
  valorBase,
  totalCartao,
  onPaymentCreated,
}: MercadoPagoPaymentProps) {
  const navigate = useNavigate();

  const [pix, setPix] =
    useState<PixResponse | null>(null);

  const [copiado, setCopiado] =
    useState(false);

  const [erro, setErro] =
    useState("");

  const [
    carregandoPix,
    setCarregandoPix,
  ] = useState(false);

  const valorDoBrick = useMemo(
    () =>
      Number(
        (
          metodo === "pix"
            ? valorBase
            : totalCartao
        ).toFixed(2),
      ),
    [
      metodo,
      valorBase,
      totalCartao,
    ],
  );

  function abrirPedido(
    pedidoId: number,
    paymentId: string,
    status: string,
  ) {
    onPaymentCreated?.(
      paymentId,
      status,
    );

    navigate(
      `/meus-pedidos?pedido=${pedidoId}`,
      {
        replace: true,
        state: {
          novoPedido: true,
        },
      },
    );
  }

  async function gerarPix() {
    setErro("");
    setCarregandoPix(true);

    try {
      const response = await fetch(
        `${API_URL}/pagamentos/pix`,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",

            Authorization:
              `Bearer ${token}`,
          },

          body: JSON.stringify({
            enderecoId,

            itens:
              itensDoCarrinho(cart),

            valorFrete: 0,
          }),
        },
      );

      const textoResposta =
        await response.text();

      let data:
        | (Partial<PixResponse> & {
            erro?: string;
            detalhes?: string;
          })
        | null = null;

      try {
        data = textoResposta
          ? JSON.parse(textoResposta)
          : {};
      } catch {
        throw new Error(
          textoResposta ||
            `Erro HTTP ${response.status}`,
        );
      }

      if (!response.ok) {
        throw new Error(
          data?.detalhes ||
            data?.erro ||
            `Erro HTTP ${response.status}`,
        );
      }

      if (
        !data?.pedidoId ||
        !data.paymentId ||
        !data.status
      ) {
        throw new Error(
          "O servidor não retornou os dados completos do pedido.",
        );
      }

      const pixCriado =
        data as PixResponse;

      setPix(pixCriado);

      onPaymentCreated?.(
        pixCriado.paymentId,
        pixCriado.status,
      );
    } catch (error) {
      console.error(
        "Erro ao gerar Pix:",
        error,
      );

      setErro(
        error instanceof Error
          ? error.message
          : "Não foi possível gerar o Pix.",
      );
    } finally {
      setCarregandoPix(false);
    }
  }

  async function copiarPix() {
    if (!pix?.qrCode) {
      return;
    }

    try {
      await navigator.clipboard.writeText(
        pix.qrCode,
      );

      setCopiado(true);

      window.setTimeout(() => {
        setCopiado(false);
      }, 2500);
    } catch {
      setErro(
        "Não foi possível copiar automaticamente. Selecione o código e copie manualmente.",
      );
    }
  }

  async function enviarPagamentoCartao(
    formData: CardFormData,
  ) {
    setErro("");

    try {
      const response = await fetch(
        `${API_URL}/pagamentos/cartao`,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",

            Authorization:
              `Bearer ${token}`,
          },

          body: JSON.stringify({
            enderecoId,

            itens:
              itensDoCarrinho(cart),

            valorFrete: 0,

            metodoSelecionado:
              metodo,

            dadosPagamento:
              formData,
          }),
        },
      );

      const textoResposta =
        await response.text();

      let data:
        | (Partial<CardResponse> & {
            erro?: string;
            detalhes?: string;
          })
        | null = null;

      try {
        data = textoResposta
          ? JSON.parse(textoResposta)
          : {};
      } catch {
        throw new Error(
          textoResposta ||
            `Erro HTTP ${response.status}`,
        );
      }

      if (!response.ok) {
        throw new Error(
          data?.detalhes ||
            data?.erro ||
            "Não foi possível processar o cartão.",
        );
      }

      if (
        !data?.pedidoId ||
        !data.paymentId ||
        !data.status
      ) {
        throw new Error(
          "O servidor não retornou os dados completos do pedido.",
        );
      }

      abrirPedido(
        data.pedidoId,
        data.paymentId,
        data.status,
      );

      return data;
    } catch (error) {
      console.error(
        "Erro ao processar cartão:",
        error,
      );

      const mensagem =
        error instanceof Error
          ? error.message
          : "Não foi possível processar o cartão.";

      setErro(mensagem);

      throw error;
    }
  }

  if (!publicKey) {
    return (
      <div className="mp-payment-error">
        A variável{" "}
        <strong>
          VITE_MERCADO_PAGO_PUBLIC_KEY
        </strong>{" "}
        não foi configurada.
      </div>
    );
  }

  if (metodo === "pix") {
    return (
      <div className="mp-payment-box">
        {erro && (
          <div className="mp-payment-error">
            {erro}
          </div>
        )}

        {!pix ? (
          <>
            <div className="mp-pix-intro">
              <QrCode size={28} />

              <div>
                <strong>
                  Pagamento por Pix
                </strong>

                <p>
                  Gere o QR Code, realize o
                  pagamento e depois acompanhe
                  a situação do pedido.
                </p>
              </div>
            </div>

            <button
              type="button"
              className="mp-primary-button"
              onClick={gerarPix}
              disabled={carregandoPix}
            >
              {carregandoPix ? (
                <>
                  <LoaderCircle
                    className="mp-spin"
                    size={20}
                  />

                  Gerando Pix...
                </>
              ) : (
                <>
                  <QrCode size={20} />

                  Gerar Pix
                </>
              )}
            </button>
          </>
        ) : (
          <div className="mp-pix-result">
            <div className="mp-payment-status">
              <CheckCircle2 size={22} />

              <div>
                <strong>
                  Pix gerado com sucesso
                </strong>

                <span>
                  Status: {pix.status}
                </span>

                {pix.numeroPedido && (
                  <span>
                    Pedido:{" "}
                    {pix.numeroPedido}
                  </span>
                )}
              </div>
            </div>

            {pix.qrCodeBase64 && (
              <img
                className="mp-pix-image"
                src={`data:image/png;base64,${pix.qrCodeBase64}`}
                alt="QR Code Pix"
              />
            )}

            {pix.qrCode && (
              <>
                <label className="mp-copy-field">
                  <span>
                    Pix Copia e Cola
                  </span>

                  <textarea
                    value={pix.qrCode}
                    readOnly
                  />
                </label>

                <button
                  type="button"
                  className="mp-secondary-button"
                  onClick={copiarPix}
                >
                  <Clipboard size={18} />

                  {copiado
                    ? "Código copiado"
                    : "Copiar código Pix"}
                </button>
              </>
            )}

            {pix.expiracao && (
              <small className="mp-expiration">
                Validade:{" "}
                {new Date(
                  pix.expiracao,
                ).toLocaleString(
                  "pt-BR",
                )}
              </small>
            )}

            <button
              type="button"
              className="mp-primary-button"
              onClick={() =>
                navigate(
                  `/meus-pedidos?pedido=${pix.pedidoId}`,
                  {
                    state: {
                      novoPedido: true,
                    },
                  },
                )
              }
            >
              Acompanhar pedido
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="mp-payment-box">
      <div className="mp-card-fee">
        <strong>
          Acréscimo de 5% no cartão
        </strong>

        <span>
          Valor final do cartão:{" "}
          {totalCartao.toLocaleString(
            "pt-BR",
            {
              style: "currency",
              currency: "BRL",
            },
          )}
        </span>
      </div>

      {erro && (
        <div className="mp-payment-error">
          {erro}
        </div>
      )}

      <CardPayment
        initialization={{
          amount: valorDoBrick,
        }}
        customization={{
          paymentMethods: {
            maxInstallments: 12,
          },

          visual: {
            style: {
              theme: "default",
            },
          },
        }}
        onSubmit={async (
          formData: CardFormData,
        ) => {
          await enviarPagamentoCartao(
            formData,
          );
        }}
        onError={(
          error: unknown,
        ) => {
          console.error(
            "Erro no Brick:",
            error,
          );

          setErro(
            "Confira os dados do cartão e tente novamente.",
          );
        }}
      />
    </div>
  );
}