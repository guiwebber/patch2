import {
  InvalidWebhookSignatureError,
  WebhookSignatureValidator,
} from "mercadopago";

import pool from "../config/db.js";
import {
  consultarPagamentoMercadoPago,
} from "../services/mercadoPagoService.js";

function statusPagamentoLocal(status) {
  if (status === "approved") {
    return "aprovado";
  }

  if (
    status === "cancelled" ||
    status === "refunded" ||
    status === "charged_back"
  ) {
    return "cancelado";
  }

  if (status === "rejected") {
    return "rejeitado";
  }

  return "pendente";
}

export async function mercadoPagoWebhook(
  req,
  res,
) {
  try {
    const secret =
      process.env.MERCADO_PAGO_WEBHOOK_SECRET;

    const dataId =
      req.query["data.id"] ||
      req.body?.data?.id;

    if (!dataId) {
      return res.sendStatus(200);
    }

    if (secret) {
      WebhookSignatureValidator.validate({
        xSignature:
          req.headers["x-signature"],
        xRequestId:
          req.headers["x-request-id"],
        dataId: String(dataId),
        secret,
      });
    } else {
      console.warn(
        "MERCADO_PAGO_WEBHOOK_SECRET não configurado; webhook não validado.",
      );
    }

    const pagamento =
      await consultarPagamentoMercadoPago(
        dataId,
      );

    const pedidoId = Number(
      pagamento.external_reference,
    );

    if (!Number.isInteger(pedidoId)) {
      console.warn(
        "Pagamento sem external_reference válido:",
        pagamento.id,
      );

      return res.sendStatus(200);
    }

    const aprovado =
      pagamento.status === "approved";

    const cancelado = [
      "cancelled",
      "refunded",
      "charged_back",
    ].includes(pagamento.status);

    await pool.query(
      `
      UPDATE pedidos
      SET
        mercado_pago_payment_id = $1,
        mercado_pago_payment_type_id = $2,
        mercado_pago_payment_method_id = $3,
        mercado_pago_status = $4,
        mercado_pago_status_detail = $5,
        status_pagamento = $6,
        status = CASE
          WHEN $7 THEN 'pagamento_aprovado'
          WHEN $8 THEN 'cancelado'
          ELSE status
        END,
        pago_em = CASE
          WHEN $7 THEN
            COALESCE(pago_em, NOW())
          ELSE pago_em
        END,
        cancelado_em = CASE
          WHEN $8 THEN
            COALESCE(cancelado_em, NOW())
          ELSE cancelado_em
        END,
        atualizado_em = NOW()
      WHERE id = $9
      `,
      [
        String(pagamento.id),
        pagamento.payment_type_id ||
          null,
        pagamento.payment_method_id ||
          null,
        pagamento.status || null,
        pagamento.status_detail || null,
        statusPagamentoLocal(
          pagamento.status,
        ),
        aprovado,
        cancelado,
        pedidoId,
      ],
    );

    return res.sendStatus(200);
  } catch (error) {
    if (
      error instanceof
      InvalidWebhookSignatureError
    ) {
      return res.sendStatus(401);
    }

    console.error(
      "Erro no webhook Mercado Pago:",
      error,
    );

    return res.sendStatus(500);
  }
}
