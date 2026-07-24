import {
  buscarProduto,
} from "../data/products.js";

const SUPERFRETE_PRODUCAO_URL =
  "https://api.superfrete.com/api/v0";

function somenteNumeros(valor) {
  return String(valor || "").replace(
    /\D/g,
    "",
  );
}

function obterToken() {
  const token =
    process.env.SUPERFRETE_TOKEN;

  if (!token) {
    throw new Error(
      "SUPERFRETE_TOKEN não configurado.",
    );
  }

  return token;
}

function obterCepOrigem() {
  const cep =
    somenteNumeros(
      process.env
        .SUPERFRETE_CEP_ORIGEM,
    );

  if (cep.length !== 8) {
    throw new Error(
      "SUPERFRETE_CEP_ORIGEM inválido.",
    );
  }

  return cep;
}

function obterUserAgent() {
  return (
    process.env
      .SUPERFRETE_USER_AGENT ||
    "PatchWork/1.0 (guiz1n.webber@gmail.com)"
  );
}

function obterApiUrl() {
  return (
    process.env
      .SUPERFRETE_API_URL ||
    SUPERFRETE_PRODUCAO_URL
  ).replace(/\/+$/, "");
}

export function montarProdutosFrete(
  itensRecebidos,
) {
  if (
    !Array.isArray(itensRecebidos) ||
    itensRecebidos.length === 0
  ) {
    throw new Error(
      "Informe os itens para calcular o frete.",
    );
  }

  return itensRecebidos.map(
    (item) => {
      const produto =
        buscarProduto(
          item.produtoId,
        );

      const quantidade =
        Number(item.quantidade);

      if (
        !produto ||
        !Number.isInteger(
          quantidade,
        ) ||
        quantidade <= 0 ||
        quantidade > 50
      ) {
        throw new Error(
          "Os itens do frete são inválidos.",
        );
      }

      return {
        quantity: quantidade,
        weight:
          Number(produto.peso),
        height:
          Number(produto.altura),
        width:
          Number(produto.largura),
        length:
          Number(
            produto.comprimento,
          ),
      };
    },
  );
}

function normalizarCotacao(
  item,
) {
  if (
    item?.error ||
    item?.price === undefined ||
    item?.price === null
  ) {
    return null;
  }

  const valor = Number(
    item.custom_price ??
      item.price,
  );

  const prazo = Number(
    item.custom_delivery_time ??
      item.delivery_time ??
      0,
  );

  if (
    !Number.isFinite(valor) ||
    valor < 0
  ) {
    return null;
  }

  return {
    id: String(item.id),
    servico:
      item.name ||
      `Serviço ${item.id}`,
    transportadora:
      item.company?.name ||
      "Correios",
    valor:
      Number(valor.toFixed(2)),
    prazoDias:
      Number.isFinite(prazo)
        ? prazo
        : 0,
    pacote:
      item.packages?.[0] ||
      null,
  };
}

export async function cotarFreteSuperFrete({
  cepDestino,
  itens,
}) {
  const destino =
    somenteNumeros(
      cepDestino,
    );

  if (destino.length !== 8) {
    throw new Error(
      "CEP de destino inválido.",
    );
  }

  const response = await fetch(
    `${obterApiUrl()}/calculator`,
    {
      method: "POST",
      headers: {
        Authorization:
          `Bearer ${obterToken()}`,
        "User-Agent":
          obterUserAgent(),
        Accept:
          "application/json",
        "Content-Type":
          "application/json",
      },
      body: JSON.stringify({
        from: {
          postal_code:
            obterCepOrigem(),
        },
        to: {
          postal_code:
            destino,
        },
        services: "1,2,17",
        options: {
          own_hand: false,
          receipt: false,
          insurance_value: 0,
          use_insurance_value:
            false,
        },
        products:
          montarProdutosFrete(
            itens,
          ),
      }),
    },
  );

  const texto =
    await response.text();

  let data;

  try {
    data = texto
      ? JSON.parse(texto)
      : [];
  } catch {
    throw new Error(
      texto ||
        "Resposta inválida da SuperFrete.",
    );
  }

  if (!response.ok) {
    const mensagem =
      data?.message ||
      data?.error ||
      data?.errors?.[0]?.message ||
      `Erro HTTP ${response.status}`;

    throw new Error(
      `SuperFrete: ${mensagem}`,
    );
  }

  const lista =
    Array.isArray(data)
      ? data
      : Array.isArray(
            data?.data,
          )
        ? data.data
        : [];

  return lista
    .map(normalizarCotacao)
    .filter(Boolean);
}

export async function validarOpcaoFrete({
  cepDestino,
  itens,
  freteId,
}) {
  if (!freteId) {
    throw new Error(
      "Selecione uma opção de frete.",
    );
  }

  const opcoes =
    await cotarFreteSuperFrete({
      cepDestino,
      itens,
    });

  const opcao =
    opcoes.find(
      (item) =>
        String(item.id) ===
        String(freteId),
    );

  if (!opcao) {
    throw new Error(
      "A opção de frete selecionada não está mais disponível. Calcule novamente.",
    );
  }

  return opcao;
}
