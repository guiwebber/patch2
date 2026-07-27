import crypto from "node:crypto";

import pool from "../config/db.js";
import { buscarProdutosPorIds } from "../services/productService.js";
import {
  criarPagamentoMercadoPago,
} from "../services/mercadoPagoService.js";
import {
  validarOpcaoFrete,
} from "../services/superFreteService.js";

const PERCENTUAL_CARTAO = 5;

function moeda(valor) {
  return Number(Number(valor).toFixed(2));
}

function validarItens(itens) {
  return (
    Array.isArray(itens) &&
    itens.length > 0 &&
    itens.every(
      (item) =>
        Number.isInteger(Number(item.produtoId)) &&
        Number.isInteger(Number(item.quantidade)) &&
        Number(item.quantidade) > 0 &&
        Number(item.quantidade) <= 50,
    )
  );
}

async function montarItensConfiaveis(itensRecebidos) {
  if (!validarItens(itensRecebidos)) {
    throw new Error("Os itens do pedido são inválidos.");
  }

  const produtos = await buscarProdutosPorIds(
    itensRecebidos.map((item) => item.produtoId),
  );

  const mapa = new Map(produtos.map((produto) => [produto.id, produto]));

  return itensRecebidos.map((item) => {
    const produto = mapa.get(Number(item.produtoId));

    if (!produto) {
      throw new Error(`Produto ${item.produtoId} não encontrado ou inativo.`);
    }

    const quantidade = Number(item.quantidade);
    const subtotal = moeda(produto.preco * quantidade);

    return { ...produto, quantidade, subtotal };
  });
}

function calcularValores({
  itens,
  valorFrete,
  comAcrescimoCartao,
}) {
  const subtotal = moeda(
    itens.reduce(
      (total, item) =>
        total + item.subtotal,
      0,
    ),
  );

  const frete = moeda(
    Math.max(0, Number(valorFrete) || 0),
  );

  const valorBase = moeda(subtotal + frete);

  const percentualAcrescimo =
    comAcrescimoCartao
      ? PERCENTUAL_CARTAO
      : 0;

  const acrescimoPagamento = moeda(
    valorBase *
      (percentualAcrescimo / 100),
  );

  const total = moeda(
    valorBase + acrescimoPagamento,
  );

  return {
    subtotal,
    frete,
    percentualAcrescimo,
    acrescimoPagamento,
    total,
  };
}

async function buscarClienteEEndereco({
  clienteId,
  enderecoId,
}) {
  const [clienteResult, enderecoResult] =
    await Promise.all([
      pool.query(
        `
        SELECT id, nome, email, telefone
        FROM clientes
        WHERE id = $1
        LIMIT 1
        `,
        [clienteId],
      ),
      pool.query(
        `
        SELECT
          id,
          nome_destinatario,
          cep,
          rua,
          numero,
          complemento,
          bairro,
          cidade,
          estado
        FROM enderecos
        WHERE id = $1
          AND cliente_id = $2
        LIMIT 1
        `,
        [enderecoId, clienteId],
      ),
    ]);

  if (clienteResult.rows.length === 0) {
    throw new Error(
      "Cliente não encontrado.",
    );
  }

  if (enderecoResult.rows.length === 0) {
    throw new Error(
      "Endereço não encontrado.",
    );
  }

  return {
    cliente: clienteResult.rows[0],
    endereco: enderecoResult.rows[0],
  };
}

async function criarPedidoNoBanco({
  clienteId,
  endereco,
  itens,
  valores,
  metodoPagamento,
  parcelas,
  idempotencyKey,
  frete,
}) {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const pedidoResult = await client.query(
      `
      INSERT INTO pedidos (
        cliente_id,
        status,
        status_pagamento,
        subtotal,
        valor_frete,
        desconto,
        acrescimo_pagamento,
        percentual_acrescimo,
        total,
        metodo_pagamento,
        parcelas,
        servico_frete,
        transportadora,
        prazo_entrega_dias,
        endereco_entrega,
        idempotency_key
      )
      VALUES (
        $1,
        'aguardando_pagamento',
        'pendente',
        $2,
        $3,
        0,
        $4,
        $5,
        $6,
        $7,
        $8,
        $9,
        $10,
        $11,
        $12::jsonb,
        $13
      )
      RETURNING
        id,
        numero_pedido
      `,
      [
        clienteId,
        valores.subtotal,
        valores.frete,
        valores.acrescimoPagamento,
        valores.percentualAcrescimo,
        valores.total,
        metodoPagamento,
        parcelas || 1,
        frete.servico,
        frete.transportadora,
        frete.prazoDias,
        JSON.stringify(endereco),
        idempotencyKey,
      ],
    );

    const pedido = pedidoResult.rows[0];

    for (const item of itens) {
      await client.query(
        `
        INSERT INTO itens_pedido (
          pedido_id,
          produto_id,
          nome_produto,
          categoria,
          imagem,
          quantidade,
          preco_unitario,
          subtotal,
          peso,
          altura,
          largura,
          comprimento
        )
        VALUES (
          $1, $2, $3, $4, $5, $6,
          $7, $8, $9, $10, $11, $12
        )
        `,
        [
          pedido.id,
          item.id,
          item.nome,
          item.categoria,
          item.imagem,
          item.quantidade,
          item.preco,
          item.subtotal,
          item.peso,
          item.altura,
          item.largura,
          item.comprimento,
        ],
      );
    }

    await client.query("COMMIT");

    return pedido;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

function notificationUrl() {
  const backendUrl =
    process.env.BACKEND_URL?.replace(
      /\/$/,
      "",
    );

  return backendUrl
    ? `${backendUrl}/webhooks/mercado-pago`
    : undefined;
}

function converterStatusPagamento(statusMercadoPago) {
  switch (statusMercadoPago) {
    case "approved":
      return "aprovado";

    case "rejected":
      return "rejeitado";

    case "cancelled":
    case "refunded":
    case "charged_back":
      return "cancelado";

    case "pending":
    case "in_process":
    case "in_mediation":
    case "authorized":
    default:
      return "pendente";
  }
}

async function atualizarPedidoComPagamento({
  pedidoId,
  pagamento,
}) {
  const statusMercadoPago =
    pagamento.status || "pending";

  const statusPagamento =
    converterStatusPagamento(
      statusMercadoPago,
    );

  const aprovado =
    statusPagamento === "aprovado";

  const cancelado =
    statusPagamento === "cancelado";

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

      parcelas = COALESCE($9, parcelas),

      valor_parcela = CASE
        WHEN COALESCE($9, 1) > 0
          THEN ROUND(
            total / COALESCE($9, 1),
            2
          )
        ELSE NULL
      END,

      pix_qr_code = $10,
      pix_qr_code_base64 = $11,
      pix_expiracao = $12,

      pago_em = CASE
        WHEN $7 THEN COALESCE(pago_em, NOW())
        ELSE pago_em
      END,

      cancelado_em = CASE
        WHEN $8 THEN COALESCE(cancelado_em, NOW())
        ELSE cancelado_em
      END,

      atualizado_em = NOW()

    WHERE id = $13
    `,
    [
      String(pagamento.id),

      pagamento.payment_type_id ||
        null,

      pagamento.payment_method_id ||
        null,

      statusMercadoPago,

      pagamento.status_detail ||
        null,

      statusPagamento,

      aprovado,

      cancelado,

      pagamento.installments || 1,

      pagamento.point_of_interaction
        ?.transaction_data
        ?.qr_code || null,

      pagamento.point_of_interaction
        ?.transaction_data
        ?.qr_code_base64 || null,

      pagamento.date_of_expiration ||
        null,

      pedidoId,
    ],
  );
}

export async function criarPix(req, res) {
  try {
    const {
      enderecoId,
      itens: itensRecebidos,
      freteId,
    } = req.body;

    const itens =
      await montarItensConfiaveis(itensRecebidos);

    const { cliente, endereco } =
      await buscarClienteEEndereco({
        clienteId: req.usuario.id,
        enderecoId,
      });

    let frete;
    if (
      process.env
        .DESABILITAR_FRETE ===
      "true"
    ) {
      frete = {
        id: "teste",
        servico: "Sem frete",
        transportadora: "",
        valor: 0,
        prazoDias: 0,
      };
    } else {
      frete =
        await validarOpcaoFrete({
          cepDestino:
            endereco.cep,
          itens:
            itensRecebidos,
          freteId,
        });
    }

    const valores = calcularValores({
      itens,
      valorFrete: frete.valor,
      comAcrescimoCartao: false,
    });

    const idempotencyKey =
      crypto.randomUUID();

    const pedido = await criarPedidoNoBanco({
      clienteId: req.usuario.id,
      endereco,
      itens,
      valores,
      metodoPagamento: "pix",
      parcelas: 1,
      idempotencyKey,
      frete,
    });

    const body = {
      transaction_amount: valores.total,
      description: `Pedido PatchWork #${pedido.numero_pedido || pedido.id}`,
      payment_method_id: "pix",
      external_reference: String(pedido.id),
      payer: {
        email: cliente.email,
        first_name: cliente.nome,
      },
      notification_url: notificationUrl(),
    };

    const pagamento =
      await criarPagamentoMercadoPago({
        body,
        idempotencyKey,
      });

    await atualizarPedidoComPagamento({
      pedidoId: pedido.id,
      pagamento,
    });

    return res.status(201).json({
      pedidoId: pedido.id,
      numeroPedido: pedido.numero_pedido,
      paymentId: String(pagamento.id),
      status: pagamento.status,
      qrCode:
        pagamento.point_of_interaction
          ?.transaction_data?.qr_code ||
        null,
      qrCodeBase64:
        pagamento.point_of_interaction
          ?.transaction_data
          ?.qr_code_base64 || null,
      expiracao:
        pagamento.date_of_expiration ||
        null,
      total: valores.total,
      frete,
    });
  } catch (error) {
    console.error(
      "========== ERRO AO CRIAR PIX ==========",
    );

    console.error(error);

    console.error(
      JSON.stringify(
        {
          message: error?.message,
          status: error?.status,
          cause: error?.cause,
          apiError: error?.apiError,
        },
        null,
        2,
      ),
    );

    console.error(
      "========================================",
    );

    const causaMercadoPago =
      error?.cause?.[0]?.description ||
      error?.cause?.[0]?.code ||
      error?.apiError?.message ||
      error?.message;

    return res.status(
      Number(error?.status) || 400,
    ).json({
      erro: "Não foi possível gerar o Pix.",
      detalhes:
        causaMercadoPago ||
        "Erro desconhecido ao criar pagamento.",
    });
  }
}

export async function criarPagamentoCartao(
  req,
  res,
) {
  try {
    const {
      enderecoId,
      itens: itensRecebidos,
      freteId,
      dadosPagamento,
    } = req.body;

    if (
      !dadosPagamento?.token ||
      !dadosPagamento?.payment_method_id
    ) {
      return res.status(400).json({
        erro:
          "Os dados tokenizados do cartão estão incompletos.",
      });
    }

    const itens =
      await montarItensConfiaveis(itensRecebidos);

    const { cliente, endereco } =
      await buscarClienteEEndereco({
        clienteId: req.usuario.id,
        enderecoId,
      });

    let frete;
    if (
      process.env
        .DESABILITAR_FRETE ===
      "true"
    ) {
      frete = {
        id: "teste",
        servico: "Sem frete",
        transportadora: "",
        valor: 0,
        prazoDias: 0,
      };
    } else {
      frete =
        await validarOpcaoFrete({
          cepDestino:
            endereco.cep,
          itens:
            itensRecebidos,
          freteId,
        });
    }

    const valores = calcularValores({
      itens,
      valorFrete: frete.valor,
      comAcrescimoCartao: true,
    });

    const parcelas = Math.max(
      1,
      Number(
        dadosPagamento.installments,
      ) || 1,
    );

    const idempotencyKey =
      crypto.randomUUID();

    const pedido = await criarPedidoNoBanco({
      clienteId: req.usuario.id,
      endereco,
      itens,
      valores,
      metodoPagamento: "cartao",
      parcelas,
      idempotencyKey,
      frete,
    });

    const body = {
      transaction_amount: valores.total,
      token: dadosPagamento.token,
      description: `Pedido PatchWork #${pedido.numero_pedido || pedido.id}`,
      installments: parcelas,
      payment_method_id:
        dadosPagamento.payment_method_id,
      issuer_id:
        dadosPagamento.issuer_id || undefined,
      external_reference: String(pedido.id),
      notification_url: notificationUrl(),
      payer: {
        email:
          dadosPagamento.payer?.email ||
          cliente.email,
        identification:
          dadosPagamento.payer
            ?.identification || undefined,
      },
    };

    const pagamento =
      await criarPagamentoMercadoPago({
        body,
        idempotencyKey,
      });

    await atualizarPedidoComPagamento({
      pedidoId: pedido.id,
      pagamento,
    });

    return res.status(201).json({
      pedidoId: pedido.id,
      numeroPedido: pedido.numero_pedido,
      paymentId: String(pagamento.id),
      status: pagamento.status,
      statusDetail:
        pagamento.status_detail,
      total: valores.total,
      acrescimoPagamento:
        valores.acrescimoPagamento,
      percentualAcrescimo:
        valores.percentualAcrescimo,
      frete,
    });
  } catch (error) {
    console.error(
      "Erro ao processar cartão:",
      error,
    );

    const causa =
      error?.cause?.[0]?.description ||
      error?.message;

    return res.status(400).json({
      erro:
        causa ||
        "Não foi possível processar o cartão.",
    });
  }
}
