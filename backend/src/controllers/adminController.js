import pool from "../config/db.js";

const STATUS_PERMITIDOS = [
  "aguardando_pagamento",
  "pago",
  "em_producao",
  "enviado",
  "entregue",
  "cancelado",
];

function normalizarStatus(status) {
  return STATUS_PERMITIDOS.includes(
    status,
  )
    ? status
    : null;
}

export async function listarPedidosAdmin(
  req,
  res,
) {
  const status =
    req.query.status === "todos"
      ? null
      : normalizarStatus(
          req.query.status,
        );

  const busca =
    String(
      req.query.busca || "",
    ).trim();

  const parametros = [];
  const filtros = [];

  if (status) {
    parametros.push(status);
    filtros.push(
      `p.status = $${parametros.length}`,
    );
  }

  if (busca) {
    parametros.push(
      `%${busca.toLowerCase()}%`,
    );

    filtros.push(`
      (
        LOWER(
          COALESCE(
            p.numero_pedido::text,
            ''
          )
        ) LIKE $${parametros.length}
        OR LOWER(c.nome)
          LIKE $${parametros.length}
        OR LOWER(c.email)
          LIKE $${parametros.length}
      )
    `);
  }

  const where =
    filtros.length > 0
      ? `WHERE ${filtros.join(
          " AND ",
        )}`
      : "";

  try {
    const result =
      await pool.query(
        `
        SELECT
          p.id,
          p.numero_pedido,
          p.status,
          p.status_pagamento,
          p.subtotal,
          p.valor_frete,
          p.desconto,
          p.acrescimo_pagamento,
          p.percentual_acrescimo,
          p.total,
          p.metodo_pagamento,
          p.parcelas,
          p.valor_parcela,
          p.codigo_rastreio,
          p.url_rastreio,
          p.endereco_entrega,
          p.mercado_pago_status,
          p.mercado_pago_status_detail,
          p.pago_em,
          p.enviado_em,
          p.entregue_em,
          p.cancelado_em,
          p.criado_em,
          p.atualizado_em,

          c.id AS cliente_id,
          c.nome AS cliente_nome,
          c.email AS cliente_email,
          c.telefone AS cliente_telefone,

          COALESCE(
            JSON_AGG(
              JSON_BUILD_OBJECT(
                'produto_id',
                  ip.produto_id,
                'nome_produto',
                  ip.nome_produto,
                'categoria',
                  ip.categoria,
                'imagem',
                  ip.imagem,
                'quantidade',
                  ip.quantidade,
                'preco_unitario',
                  ip.preco_unitario,
                'subtotal',
                  ip.subtotal
              )
              ORDER BY ip.nome_produto
            ) FILTER (
              WHERE
                ip.pedido_id
                IS NOT NULL
            ),
            '[]'::json
          ) AS itens

        FROM pedidos p

        INNER JOIN clientes c
          ON c.id = p.cliente_id

        LEFT JOIN itens_pedido ip
          ON ip.pedido_id = p.id

        ${where}

        GROUP BY
          p.id,
          c.id

        ORDER BY
          p.criado_em DESC
        `,
        parametros,
      );

    return res.json({
      pedidos: result.rows,
    });
  } catch (error) {
    console.error(
      "Erro ao listar pedidos do admin:",
      error,
    );

    return res.status(500).json({
      erro:
        "Erro interno ao listar os pedidos.",
    });
  }
}

export async function buscarResumoAdmin(
  req,
  res,
) {
  try {
    const result =
      await pool.query(
        `
        SELECT
          COUNT(*) FILTER (
            WHERE
              status =
              'aguardando_pagamento'
          )::integer
            AS aguardando_pagamento,

          COUNT(*) FILTER (
            WHERE
              status =
              'em_producao'
          )::integer
            AS em_producao,

          COUNT(*) FILTER (
            WHERE
              status =
              'enviado'
          )::integer
            AS enviados,

          COUNT(*) FILTER (
            WHERE
              status =
              'entregue'
          )::integer
            AS entregues,

          COUNT(*) FILTER (
            WHERE
              status =
              'cancelado'
          )::integer
            AS cancelados,

          COALESCE(
            SUM(total) FILTER (
              WHERE
                status_pagamento =
                'aprovado'
                AND criado_em >=
                  DATE_TRUNC(
                    'month',
                    NOW()
                  )
            ),
            0
          ) AS faturamento_mes

        FROM pedidos
        `,
      );

    return res.json({
      resumo: result.rows[0],
    });
  } catch (error) {
    console.error(
      "Erro ao carregar resumo admin:",
      error,
    );

    return res.status(500).json({
      erro:
        "Erro interno ao carregar o resumo.",
    });
  }
}

export async function atualizarStatusPedidoAdmin(
  req,
  res,
) {
  const pedidoId = Number(
    req.params.id,
  );

  const {
    status,
    codigoRastreio,
    urlRastreio,
  } = req.body;

  if (!Number.isInteger(pedidoId)) {
    return res.status(400).json({
      erro: "ID do pedido inválido.",
    });
  }

  const statusNormalizado =
    normalizarStatus(status);

  if (!statusNormalizado) {
    return res.status(400).json({
      erro: "Status do pedido inválido.",
    });
  }

  const codigoRastreioNormalizado =
    String(codigoRastreio || "").trim();

  const urlRastreioNormalizada =
    String(urlRastreio || "").trim();

  if (
    statusNormalizado === "enviado" &&
    !codigoRastreioNormalizado
  ) {
    return res.status(400).json({
      erro:
        "Informe o código de rastreio para marcar o pedido como enviado.",
    });
  }

  if (
    urlRastreioNormalizada &&
    !/^https?:\/\//i.test(
      urlRastreioNormalizada,
    )
  ) {
    return res.status(400).json({
      erro:
        "O link de rastreio precisa começar com http:// ou https://.",
    });
  }

  try {
    const result = await pool.query(
      `
      UPDATE pedidos
      SET
        status = $1::varchar,

        codigo_rastreio = CASE
          WHEN $1::varchar = 'enviado'
            THEN $2::varchar
          ELSE codigo_rastreio
        END,

        url_rastreio = CASE
          WHEN $1::varchar = 'enviado'
            THEN $3::text
          ELSE url_rastreio
        END,

        enviado_em = CASE
          WHEN $1::varchar = 'enviado'
            THEN COALESCE(
              enviado_em,
              NOW()
            )
          ELSE enviado_em
        END,

        entregue_em = CASE
          WHEN $1::varchar = 'entregue'
            THEN COALESCE(
              entregue_em,
              NOW()
            )
          ELSE entregue_em
        END,

        cancelado_em = CASE
          WHEN $1::varchar = 'cancelado'
            THEN COALESCE(
              cancelado_em,
              NOW()
            )
          ELSE cancelado_em
        END,

        atualizado_em = NOW()

      WHERE id = $4::integer

      RETURNING
        id,
        numero_pedido,
        status,
        status_pagamento,
        codigo_rastreio,
        url_rastreio,
        enviado_em,
        entregue_em,
        cancelado_em,
        atualizado_em
      `,
      [
        statusNormalizado,
        codigoRastreioNormalizado || null,
        urlRastreioNormalizada || null,
        pedidoId,
      ],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        erro: "Pedido não encontrado.",
      });
    }

    return res.json({
      mensagem:
        "Status do pedido atualizado com sucesso.",
      pedido: result.rows[0],
    });
  } catch (error) {
    console.error(
      "Erro ao atualizar pedido pelo admin:",
      {
        name: error?.name,
        message: error?.message,
        code: error?.code,
        detail: error?.detail,
        position: error?.position,
        stack: error?.stack,
      },
    );

    return res.status(500).json({
      erro:
        "Erro interno ao atualizar o pedido.",
      detalhes:
        process.env.NODE_ENV ===
        "development"
          ? error?.message
          : undefined,
    });
  }
}
