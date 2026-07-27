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

function formatarDinheiro(valor) {
  return Number(valor || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function escaparHtml(valor) {
  return String(valor ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function nomeMetodoPagamento(metodo) {
  if (metodo === "pix") return "Pix";
  if (metodo === "cartao") return "Cartão";
  return metodo ? String(metodo) : "Não informado";
}

function normalizarEndereco(endereco) {
  if (!endereco) return null;
  if (typeof endereco === "object") return endereco;

  try {
    return JSON.parse(endereco);
  } catch {
    return null;
  }
}

function formatarEnderecoTexto(enderecoRecebido) {
  const endereco = normalizarEndereco(enderecoRecebido);

  if (!endereco) return "Endereço não informado";

  const linha1 = [endereco.rua, endereco.numero]
    .filter(Boolean)
    .join(", ");

  const linha2 = [endereco.complemento, endereco.bairro]
    .filter(Boolean)
    .join(" - ");

  const linha3 = [endereco.cidade, endereco.estado]
    .filter(Boolean)
    .join(" - ");

  return [
    endereco.nome_destinatario || endereco.nomeDestinatario,
    linha1,
    linha2,
    linha3,
    endereco.cep ? `CEP ${endereco.cep}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

function criarTemplateAdminNovoPedido(pedido) {
  const itens = Array.isArray(pedido.itens) ? pedido.itens : [];

  const itensHtml = itens.length
    ? itens
        .map(
          (item) => `
            <tr>
              <td style="padding:12px 0;border-bottom:1px solid #ead7c5;">
                <strong>${escaparHtml(item.nome_produto)}</strong>
                <div style="margin-top:4px;color:#806e72;font-size:13px;">
                  ${escaparHtml(item.quantidade)} unidade(s) ×
                  ${formatarDinheiro(item.preco_unitario)}
                </div>
              </td>
              <td style="padding:12px 0;border-bottom:1px solid #ead7c5;text-align:right;white-space:nowrap;">
                <strong>${formatarDinheiro(item.subtotal)}</strong>
              </td>
            </tr>
          `,
        )
        .join("")
    : `<tr><td colspan="2" style="padding:16px 0;color:#806e72;">Nenhum item encontrado.</td></tr>`;

  const numeroPedido = pedido.numero_pedido || pedido.pedido_id;
  const enderecoTexto = formatarEnderecoTexto(pedido.endereco_entrega);
  const frontendUrl = String(process.env.FRONTEND_URL || "").replace(/\/$/, "");
  const painelUrl = frontendUrl ? `${frontendUrl}/admin` : "";

  const assunto = `Novo pedido pago #${numeroPedido}`;

  const texto = `
Novo pedido pago!

Pedido: ${numeroPedido}
Cliente: ${pedido.cliente_nome}
E-mail: ${pedido.cliente_email}
Telefone: ${pedido.cliente_telefone || "Não informado"}
Pagamento: ${nomeMetodoPagamento(pedido.metodo_pagamento)}

Itens:
${itens
  .map(
    (item) =>
      `${item.quantidade}x ${item.nome_produto} - ${formatarDinheiro(item.subtotal)}`,
  )
  .join("\n")}

Valor dos produtos: ${formatarDinheiro(pedido.subtotal)}
Frete: ${formatarDinheiro(pedido.valor_frete)}
Desconto: ${formatarDinheiro(pedido.desconto)}
Acréscimo do pagamento: ${formatarDinheiro(pedido.acrescimo_pagamento)}
Valor total: ${formatarDinheiro(pedido.total)}

Endereço:
${enderecoTexto}

${painelUrl ? `Painel administrativo:\n${painelUrl}` : ""}
  `.trim();

  const html = `
    <div style="margin:0;padding:30px 14px;background:#fffaf6;font-family:Arial,Helvetica,sans-serif;color:#342426;">
      <div style="max-width:680px;margin:auto;overflow:hidden;background:#fff;border:1px solid #e5d0bf;border-radius:18px;box-shadow:0 16px 42px rgba(75,16,27,.08);">
        <div style="padding:28px;color:#fff;background:#762031;">
          <div style="color:#e8c995;font-size:13px;font-weight:800;letter-spacing:1px;text-transform:uppercase;">
            Sonia Ferraz · Arte em Tecidos
          </div>
          <h1 style="margin:9px 0 0;font-size:28px;">Novo pedido pago</h1>
          <p style="margin:9px 0 0;color:rgba(255,255,255,.86);">
            O pagamento foi aprovado e o pedido já pode entrar em produção.
          </p>
        </div>

        <div style="padding:28px;">
          <div style="padding:18px;background:#fbf3ec;border:1px solid #ead7c5;border-radius:12px;">
            <p style="margin:0 0 9px;"><strong>Pedido:</strong> #${escaparHtml(numeroPedido)}</p>
            <p style="margin:0 0 9px;"><strong>Cliente:</strong> ${escaparHtml(pedido.cliente_nome)}</p>
            <p style="margin:0 0 9px;"><strong>E-mail:</strong> ${escaparHtml(pedido.cliente_email)}</p>
            <p style="margin:0 0 9px;"><strong>Telefone:</strong> ${escaparHtml(pedido.cliente_telefone || "Não informado")}</p>
            <p style="margin:0;"><strong>Pagamento:</strong> ${escaparHtml(nomeMetodoPagamento(pedido.metodo_pagamento))}</p>
          </div>

          <h2 style="margin:27px 0 8px;color:#611624;font-size:21px;">Itens do pedido</h2>
          <table style="width:100%;border-collapse:collapse;">${itensHtml}</table>

          <div style="margin-top:24px;padding:18px;border:1px solid #e5d0bf;border-radius:12px;">
            <table style="width:100%;border-collapse:collapse;">
              <tr><td style="padding:6px 0;">Valor dos produtos</td><td style="padding:6px 0;text-align:right;font-weight:700;">${formatarDinheiro(pedido.subtotal)}</td></tr>
              <tr><td style="padding:6px 0;">Frete</td><td style="padding:6px 0;text-align:right;font-weight:700;">${formatarDinheiro(pedido.valor_frete)}</td></tr>
              <tr><td style="padding:6px 0;">Desconto</td><td style="padding:6px 0;text-align:right;font-weight:700;">- ${formatarDinheiro(pedido.desconto)}</td></tr>
              <tr><td style="padding:6px 0;">Acréscimo do pagamento</td><td style="padding:6px 0;text-align:right;font-weight:700;">${formatarDinheiro(pedido.acrescimo_pagamento)}</td></tr>
              <tr>
                <td style="padding:15px 0 0;border-top:1px solid #ead7c5;color:#762031;font-size:18px;font-weight:800;">Valor total</td>
                <td style="padding:15px 0 0;border-top:1px solid #ead7c5;color:#762031;text-align:right;font-size:20px;font-weight:800;">${formatarDinheiro(pedido.total)}</td>
              </tr>
            </table>
          </div>

          <div style="margin-top:24px;padding:18px;background:#fbf3ec;border:1px solid #ead7c5;border-radius:12px;">
            <h2 style="margin:0 0 10px;color:#611624;font-size:18px;">Endereço de entrega</h2>
            <p style="margin:0;color:#5e4b4f;line-height:1.65;white-space:pre-line;">${escaparHtml(enderecoTexto)}</p>
          </div>

          ${
            painelUrl
              ? `<a href="${escaparHtml(painelUrl)}" style="display:inline-block;margin-top:24px;padding:14px 20px;color:#fff;background:#762031;border-radius:10px;text-decoration:none;font-weight:800;">Abrir painel administrativo</a>`
              : ""
          }
        </div>
      </div>
    </div>
  `;

  return { assunto, html, texto };
}

async function reservarEmailCliente(pedidoId, evento) {
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

async function liberarReservaCliente(pedidoId, evento) {
  const { coluna } = configuracaoEvento(evento);

  await pool.query(
    `UPDATE pedidos SET ${coluna} = NULL WHERE id = $1`,
    [pedidoId],
  );
}

async function reservarEmailAdmin(pedidoId) {
  const result = await pool.query(
    `
    UPDATE pedidos p
    SET admin_novo_pedido_email_enviado_em = NOW()
    FROM clientes c
    WHERE
      p.id = $1
      AND p.cliente_id = c.id
      AND p.status_pagamento = 'aprovado'
      AND p.admin_novo_pedido_email_enviado_em IS NULL
    RETURNING
      p.id AS pedido_id,
      p.numero_pedido,
      p.subtotal,
      p.valor_frete,
      p.desconto,
      p.acrescimo_pagamento,
      p.total,
      p.metodo_pagamento,
      p.endereco_entrega,
      c.nome AS cliente_nome,
      c.email AS cliente_email,
      c.telefone AS cliente_telefone
    `,
    [pedidoId],
  );

  return result.rows[0] || null;
}

async function liberarReservaAdmin(pedidoId) {
  await pool.query(
    `UPDATE pedidos SET admin_novo_pedido_email_enviado_em = NULL WHERE id = $1`,
    [pedidoId],
  );
}

async function buscarItensPedido(pedidoId) {
  const result = await pool.query(
    `
    SELECT
      produto_id,
      nome_produto,
      categoria,
      imagem,
      quantidade,
      preco_unitario,
      subtotal
    FROM itens_pedido
    WHERE pedido_id = $1
    ORDER BY nome_produto
    `,
    [pedidoId],
  );

  return result.rows;
}

async function enviarEmailAdminNovoPedido(pedidoId) {
  const emailAdmin = process.env.EMAIL_ADMIN || "sonia.ferraz28@gmail.com";
  const pedido = await reservarEmailAdmin(pedidoId);

  if (!pedido) {
    return {
      enviado: false,
      motivo: "ja_enviado_ou_status_invalido",
    };
  }

  try {
    pedido.itens = await buscarItensPedido(pedidoId);
    const template = criarTemplateAdminNovoPedido(pedido);

    const resultado = await enviarEmail({
      para: emailAdmin,
      assunto: template.assunto,
      html: template.html,
      texto: template.texto,
      idempotencyKey: `admin/pagamento-aprovado/pedido-${pedidoId}`,
    });

    return {
      enviado: true,
      emailId: resultado?.id || null,
    };
  } catch (error) {
    await liberarReservaAdmin(pedidoId);
    throw error;
  }
}

export async function enviarEmailDoPedido({ pedidoId, evento }) {
  const configuracao = configuracaoEvento(evento);
  const pedido = await reservarEmailCliente(pedidoId, evento);

  if (!pedido) {
    if (evento === "pagamento_aprovado") {
      const admin = await enviarEmailAdminNovoPedido(pedidoId);

      return {
        enviado: false,
        motivo: "ja_enviado_ou_status_invalido",
        admin,
      };
    }

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
    const resultadoCliente = await enviarEmail({
      para: pedido.cliente_email,
      assunto: template.assunto,
      html: template.html,
      texto: template.texto,
      idempotencyKey: `${evento}/pedido-${pedido.pedido_id}`,
    });

    let resultadoAdmin = null;

    if (evento === "pagamento_aprovado") {
      resultadoAdmin = await enviarEmailAdminNovoPedido(pedidoId);
    }

    return {
      enviado: true,
      emailId: resultadoCliente?.id || null,
      admin: resultadoAdmin,
    };
  } catch (error) {
    await liberarReservaCliente(pedidoId, evento);
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
