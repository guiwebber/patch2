import pool from "../config/db.js";

function intervaloPeriodo(periodo) {
  switch (periodo) {
    case "6m":
      return "6 months";

    case "1a":
      return "1 year";

    case "todos":
      return null;

    case "3m":
    default:
      return "3 months";
  }
}

export async function listarPedidos(
  req,
  res,
) {
  const intervalo = intervaloPeriodo(
    req.query.periodo,
  );

  try {
    const parametros = [
      req.usuario.id,
    ];

    let filtroData = "";

    if (intervalo) {
      parametros.push(intervalo);

      filtroData = `
        AND p.criado_em >=
          NOW() - $2::interval
      `;
    }

    const result = await pool.query(
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
        p.servico_frete,
        p.transportadora,
        p.prazo_entrega_dias,
        p.codigo_rastreio,
        p.url_rastreio,
        p.endereco_entrega,
        p.mercado_pago_status,
        p.mercado_pago_status_detail,
        p.pix_qr_code,
        p.pix_qr_code_base64,
        p.pix_expiracao,
        p.pago_em,
        p.enviado_em,
        p.entregue_em,
        p.cancelado_em,
        p.criado_em,
        p.atualizado_em,

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
              ip.pedido_id IS NOT NULL
          ),
          '[]'::json
        ) AS itens

      FROM pedidos p

      LEFT JOIN itens_pedido ip
        ON ip.pedido_id = p.id

      WHERE
        p.cliente_id = $1
        ${filtroData}

      GROUP BY p.id

      ORDER BY p.criado_em DESC
      `,
      parametros,
    );

    return res.json({
      pedidos: result.rows,
    });
  } catch (error) {
    console.error(
      "Erro ao listar pedidos:",
      error,
    );

    return res.status(500).json({
      erro:
        "Erro interno ao listar pedidos.",
      detalhes:
        process.env.NODE_ENV ===
        "development"
          ? error?.message
          : undefined,
    });
  }
}

export async function buscarPedido(
  req,
  res,
) {
  const pedidoId = Number(
    req.params.id,
  );

  if (!Number.isInteger(pedidoId)) {
    return res.status(400).json({
      erro: "ID do pedido inválido.",
    });
  }

  try {
    const result = await pool.query(
      `
      SELECT
        p.*,

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
              ip.pedido_id IS NOT NULL
          ),
          '[]'::json
        ) AS itens

      FROM pedidos p

      LEFT JOIN itens_pedido ip
        ON ip.pedido_id = p.id

      WHERE
        p.id = $1
        AND p.cliente_id = $2

      GROUP BY p.id

      LIMIT 1
      `,
      [
        pedidoId,
        req.usuario.id,
      ],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        erro: "Pedido não encontrado.",
      });
    }

    return res.json({
      pedido: result.rows[0],
    });
  } catch (error) {
    console.error(
      "Erro ao buscar pedido:",
      error,
    );

    return res.status(500).json({
      erro:
        "Erro interno ao buscar pedido.",
    });
  }
}
