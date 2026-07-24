import pool from "../config/db.js";
import { enviarEmail } from "./emailService.js";
import {
  emailPagamentoAprovado,
  emailPedidoCancelado,
  emailPedidoEntregue,
  emailPedidoEnviado,
} from "../templates/emailTemplates.js";

const CONFIGURACOES = {
  pagamento_aprovado: {
    coluna: "pagamento_email_enviado_em",
    condicao: "p.status_pagamento = 'aprovado'",
    template: emailPagamentoAprovado,
  },
  enviado: {
    coluna: "enviado_email_enviado_em",
    condicao: "p.status = 'enviado'",
    template: emailPedidoEnviado,
  },
  cancelado: {
    coluna: "cancelado_email_enviado_em",
    condicao: "p.status = 'cancelado'",
    template: emailPedidoCancelado,
  },
  entregue: {
    coluna: "entregue_email_enviado_em",
    condicao: "p.status = 'entregue'",
    template: emailPedidoEntregue,
  },
};

function configuracaoEvento(evento) {
  const configuracao = CONFIGURACOES[evento];

  if (!configuracao) {
    throw new Error(`Evento de e-mail inválido: ${evento}`);
  }

  return configuracao;
}

async function reservarEmail(pedidoId, evento) {
  const { coluna, condicao } = configuracaoEvento(evento);

  const result = await pool.query(
    `
    UPDATE pedidos p
    SET ${coluna} = NOW()
    FROM clientes c
    WHERE
      p.id = $1
      AND p.cliente_id = c.id
      AND p.${coluna} IS NULL
      AND ${condicao}
    RETURNING
      p.id AS pedido_id,
      p.numero_pedido,
      p.total,
      p.metodo_pagamento,
      p.codigo_rastreio,
      p.url_rastreio,
      c.nome AS cliente_nome,
      c.email AS cliente_email
    `,
    [pedidoId],
  );

  return result.rows[0] || null;
}

async function liberarReserva(pedidoId, evento) {
  const { coluna } = configuracaoEvento(evento);

  await pool.query(
    `
    UPDATE pedidos
    SET ${coluna} = NULL
    WHERE id = $1
    `,
    [pedidoId],
  );
}

export async function enviarEmailDoPedido({ pedidoId, evento }) {
  const configuracao = configuracaoEvento(evento);
  const pedido = await reservarEmail(pedidoId, evento);

  if (!pedido) {
    return {
      enviado: false,
      motivo: "ja_enviado_ou_status_invalido",
    };
  }

  const template = configuracao.template({
    pedidoId: pedido.pedido_id,
    numeroPedido: pedido.numero_pedido,
    nomeCliente: pedido.cliente_nome,
    total: pedido.total,
    metodoPagamento: pedido.metodo_pagamento,
    codigoRastreio: pedido.codigo_rastreio,
    urlRastreio: pedido.url_rastreio,
  });

  try {
    const resultado = await enviarEmail({
      para: pedido.cliente_email,
      assunto: template.assunto,
      html: template.html,
      texto: template.texto,
      idempotencyKey: `${evento}/pedido-${pedido.pedido_id}`,
    });

    return {
      enviado: true,
      emailId: resultado?.id || null,
    };
  } catch (error) {
    await liberarReserva(pedidoId, evento);
    throw error;
  }
}

export async function tentarEnviarEmailDoPedido({ pedidoId, evento }) {
  try {
    return await enviarEmailDoPedido({ pedidoId, evento });
  } catch (error) {
    console.error("Não foi possível enviar o e-mail do pedido:", {
      pedidoId,
      evento,
      name: error?.name,
      message: error?.message,
      resendError: error?.resendError,
      stack: error?.stack,
    });

    return {
      enviado: false,
      motivo: "erro_no_envio",
      erro: error?.message,
    };
  }
}
