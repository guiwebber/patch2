import {
  MercadoPagoConfig,
  Payment,
} from "mercadopago";

function obterAccessToken() {
  const accessToken =
    process.env.MERCADO_PAGO_ACCESS_TOKEN;

  if (!accessToken) {
    throw new Error(
      "MERCADO_PAGO_ACCESS_TOKEN não configurado.",
    );
  }

  return accessToken;
}

function criarCliente() {
  return new MercadoPagoConfig({
    accessToken: obterAccessToken(),
    options: {
      timeout: 10000,
    },
  });
}

export function paymentClient() {
  return new Payment(criarCliente());
}

export async function criarPagamentoMercadoPago({
  body,
  idempotencyKey,
}) {
  const payment = paymentClient();

  return payment.create({
    body,
    requestOptions: {
      idempotencyKey,
    },
  });
}

export async function consultarPagamentoMercadoPago(
  paymentId,
) {
  const payment = paymentClient();

  return payment.get({
    id: String(paymentId),
  });
}
