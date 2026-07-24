function escaparHtml(valor) {
  return String(valor ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatarDinheiro(valor) {
  return Number(valor || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function urlMeusPedidos(pedidoId) {
  const frontendUrl = (
    process.env.FRONTEND_URL ||
    "https://patch2-lilac.vercel.app"
  ).replace(/\/+$/, "");

  return `${frontendUrl}/meus-pedidos?pedido=${pedidoId}`;
}

function layoutEmail({
  titulo,
  preCabecalho,
  conteudo,
  textoBotao,
  urlBotao,
}) {
  const botao =
    textoBotao && urlBotao
      ? `
        <tr>
          <td style="padding: 8px 32px 32px;">
            <a
              href="${escaparHtml(urlBotao)}"
              style="display:inline-block;padding:14px 22px;color:#fff;background:#d97706;border-radius:9px;font-family:Arial,sans-serif;font-size:15px;font-weight:700;text-decoration:none;"
            >
              ${escaparHtml(textoBotao)}
            </a>
          </td>
        </tr>
      `
      : "";

  return `
    <!doctype html>
    <html lang="pt-BR">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>${escaparHtml(titulo)}</title>
      </head>
      <body style="margin:0;padding:0;background:#fff7ef;">
        <div style="display:none;max-height:0;overflow:hidden;opacity:0;">
          ${escaparHtml(preCabecalho || titulo)}
        </div>
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#fff7ef;">
          <tr>
            <td align="center" style="padding:32px 14px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="width:100%;max-width:620px;overflow:hidden;background:#fff;border:1px solid #eadfd4;border-radius:18px;box-shadow:0 12px 35px rgba(70,45,28,.08);">
                <tr>
                  <td style="padding:25px 32px;color:#fff;background:#d97706;font-family:Arial,sans-serif;">
                    <div style="font-size:12px;font-weight:700;letter-spacing:2px;text-transform:uppercase;">PatchWork</div>
                    <h1 style="margin:9px 0 0;font-size:27px;line-height:1.2;">${escaparHtml(titulo)}</h1>
                  </td>
                </tr>
                <tr>
                  <td style="padding:30px 32px 20px;color:#4a3a31;font-family:Arial,sans-serif;font-size:15px;line-height:1.65;">
                    ${conteudo}
                  </td>
                </tr>
                ${botao}
                <tr>
                  <td style="padding:20px 32px 26px;color:#8a796e;background:#fffaf5;border-top:1px solid #eee2d8;font-family:Arial,sans-serif;font-size:12px;line-height:1.5;">
                    Este é um e-mail automático sobre uma compra realizada na PatchWork.
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;
}

export function emailPagamentoAprovado({
  pedidoId,
  numeroPedido,
  nomeCliente,
  total,
  metodoPagamento,
}) {
  const html = layoutEmail({
    titulo: "Pagamento confirmado",
    preCabecalho: `O pagamento do pedido ${numeroPedido} foi aprovado.`,
    textoBotao: "Acompanhar pedido",
    urlBotao: urlMeusPedidos(pedidoId),
    conteudo: `
      <p style="margin:0 0 16px;">Olá, <strong>${escaparHtml(nomeCliente || "cliente")}</strong>!</p>
      <p style="margin:0 0 20px;">Recebemos a confirmação do seu pagamento. Seu pedido já entrou em produção.</p>
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#fff8ef;border:1px solid #edd8bd;border-radius:11px;">
        <tr><td style="padding:13px 16px;"><strong>Pedido</strong></td><td align="right" style="padding:13px 16px;">${escaparHtml(numeroPedido)}</td></tr>
        <tr><td style="padding:13px 16px;border-top:1px solid #edd8bd;"><strong>Pagamento</strong></td><td align="right" style="padding:13px 16px;border-top:1px solid #edd8bd;">${escaparHtml(metodoPagamento || "Não informado")}</td></tr>
        <tr><td style="padding:13px 16px;border-top:1px solid #edd8bd;"><strong>Total</strong></td><td align="right" style="padding:13px 16px;border-top:1px solid #edd8bd;">${escaparHtml(formatarDinheiro(total))}</td></tr>
      </table>
    `,
  });

  return {
    assunto: `Pagamento confirmado — pedido ${numeroPedido}`,
    html,
    texto: [
      `Olá, ${nomeCliente || "cliente"}!`,
      "",
      `O pagamento do pedido ${numeroPedido} foi confirmado.`,
      "Seu pedido já entrou em produção.",
      `Total: ${formatarDinheiro(total)}`,
      `Acompanhe: ${urlMeusPedidos(pedidoId)}`,
    ].join("\n"),
  };
}

export function emailPedidoEnviado({
  pedidoId,
  numeroPedido,
  nomeCliente,
  codigoRastreio,
  urlRastreio,
}) {
  const link = urlRastreio || urlMeusPedidos(pedidoId);

  const html = layoutEmail({
    titulo: "Seu pedido foi enviado",
    preCabecalho: `O pedido ${numeroPedido} já está a caminho.`,
    textoBotao: urlRastreio ? "Rastrear pedido" : "Acompanhar pedido",
    urlBotao: link,
    conteudo: `
      <p style="margin:0 0 16px;">Olá, <strong>${escaparHtml(nomeCliente || "cliente")}</strong>!</p>
      <p style="margin:0 0 20px;">O pedido <strong>${escaparHtml(numeroPedido)}</strong> foi enviado e já pode ser acompanhado.</p>
      <div style="padding:17px;background:#eef7fc;border:1px solid #c9dfec;border-radius:11px;">
        <div style="margin-bottom:5px;color:#607681;font-size:12px;font-weight:700;text-transform:uppercase;">Código de rastreio</div>
        <div style="color:#264f67;font-size:21px;font-weight:800;letter-spacing:1px;">${escaparHtml(codigoRastreio)}</div>
      </div>
    `,
  });

  return {
    assunto: `Pedido enviado — ${numeroPedido}`,
    html,
    texto: [
      `Olá, ${nomeCliente || "cliente"}!`,
      "",
      `Seu pedido ${numeroPedido} foi enviado.`,
      `Código de rastreio: ${codigoRastreio}`,
      `Acompanhe: ${link}`,
    ].join("\n"),
  };
}

export function emailPedidoCancelado({
  pedidoId,
  numeroPedido,
  nomeCliente,
}) {
  const html = layoutEmail({
    titulo: "Pedido cancelado",
    preCabecalho: `O pedido ${numeroPedido} foi cancelado.`,
    textoBotao: "Ver meus pedidos",
    urlBotao: urlMeusPedidos(pedidoId),
    conteudo: `
      <p style="margin:0 0 16px;">Olá, <strong>${escaparHtml(nomeCliente || "cliente")}</strong>.</p>
      <p style="margin:0;">O pedido <strong>${escaparHtml(numeroPedido)}</strong> foi marcado como cancelado. Caso tenha alguma dúvida, entre em contato com a loja.</p>
    `,
  });

  return {
    assunto: `Pedido cancelado — ${numeroPedido}`,
    html,
    texto: `O pedido ${numeroPedido} foi cancelado. Consulte: ${urlMeusPedidos(pedidoId)}`,
  };
}

export function emailPedidoEntregue({
  pedidoId,
  numeroPedido,
  nomeCliente,
}) {
  const html = layoutEmail({
    titulo: "Pedido entregue",
    preCabecalho: `O pedido ${numeroPedido} foi marcado como entregue.`,
    textoBotao: "Ver pedido",
    urlBotao: urlMeusPedidos(pedidoId),
    conteudo: `
      <p style="margin:0 0 16px;">Olá, <strong>${escaparHtml(nomeCliente || "cliente")}</strong>!</p>
      <p style="margin:0;">O pedido <strong>${escaparHtml(numeroPedido)}</strong> foi entregue. Esperamos que você goste da sua encomenda. Obrigado por comprar com a PatchWork!</p>
    `,
  });

  return {
    assunto: `Pedido entregue — ${numeroPedido}`,
    html,
    texto: `O pedido ${numeroPedido} foi entregue. Ver pedido: ${urlMeusPedidos(pedidoId)}`,
  };
}
