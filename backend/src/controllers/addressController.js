import pool from "../config/db.js";

const TEXTO_ALFABETICO_REGEX =
  /^[\p{L}\s'-]+$/u;

const ESTADOS_VALIDOS = new Set([
  "AC",
  "AL",
  "AP",
  "AM",
  "BA",
  "CE",
  "DF",
  "ES",
  "GO",
  "MA",
  "MT",
  "MS",
  "MG",
  "PA",
  "PB",
  "PR",
  "PE",
  "PI",
  "RJ",
  "RN",
  "RS",
  "RO",
  "RR",
  "SC",
  "SP",
  "SE",
  "TO",
]);

function normalizarCep(value) {
  return String(value ?? "")
    .replace(/\D/g, "")
    .slice(0, 8);
}

function limparTexto(value) {
  return typeof value === "string"
    ? value
        .trim()
        .replace(/\s+/g, " ")
    : "";
}

function obterClienteId(req, res) {
  const clienteId = Number(
    req.usuario?.id,
  );

  if (!Number.isInteger(clienteId)) {
    res.status(401).json({
      erro: "Usuário não autenticado.",
    });

    return null;
  }

  return clienteId;
}

function validarEndereco(body) {
  if (
    !body ||
    typeof body !== "object"
  ) {
    return {
      valido: false,
      erro:
        "Dados do endereço não informados.",
    };
  }

  const nomeDestinatario =
    limparTexto(
      body.nomeDestinatario,
    );

  const cep =
    normalizarCep(body.cep);

  const rua =
    limparTexto(body.rua);

  const numero =
    limparTexto(body.numero);

  const bairro =
    limparTexto(body.bairro);

  const cidade =
    limparTexto(body.cidade);

  const estado =
    limparTexto(
      body.estado,
    ).toUpperCase();

  if (
    !nomeDestinatario ||
    !cep ||
    !rua ||
    !numero ||
    !bairro ||
    !cidade ||
    !estado
  ) {
    return {
      valido: false,
      erro:
        "Preencha todos os campos obrigatórios.",
    };
  }

  if (
    !TEXTO_ALFABETICO_REGEX.test(
      nomeDestinatario,
    )
  ) {
    return {
      valido: false,
      erro:
        "O nome do destinatário deve conter apenas letras.",
    };
  }

  if (
    !TEXTO_ALFABETICO_REGEX.test(
      cidade,
    )
  ) {
    return {
      valido: false,
      erro:
        "A cidade deve conter apenas letras.",
    };
  }

  if (cep.length !== 8) {
    return {
      valido: false,
      erro:
        "Informe um CEP válido com 8 números.",
    };
  }

  if (!/^\d+$/.test(numero)) {
    return {
      valido: false,
      erro:
        "O número do endereço deve conter apenas números.",
    };
  }

  if (
    !ESTADOS_VALIDOS.has(
      estado,
    )
  ) {
    return {
      valido: false,
      erro:
        "Selecione um estado válido.",
    };
  }

  return {
    valido: true,

    dados: {
      nomeDestinatario,
      cep,
      rua,
      numero,

      complemento:
        limparTexto(
          body.complemento,
        ) || null,

      bairro,
      cidade,
      estado,

      principal:
        Boolean(
          body.principal,
        ),
    },
  };
}

function responderErroBanco(
  res,
  error,
  mensagemPadrao,
) {
  console.error(
    mensagemPadrao,
    {
      name: error?.name,
      message: error?.message,
      code: error?.code,
      detail: error?.detail,
      constraint:
        error?.constraint,
      stack: error?.stack,
    },
  );

  return res.status(500).json({
    erro: mensagemPadrao,

    detalhes:
      process.env.NODE_ENV ===
      "development"
        ? error?.message
        : undefined,
  });
}

export async function listarEnderecos(
  req,
  res,
) {
  const clienteId =
    obterClienteId(req, res);

  if (!clienteId) {
    return;
  }

  try {
    const result =
      await pool.query(
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
          estado,
          principal,
          criado_em,
          atualizado_em
        FROM enderecos
        WHERE cliente_id = $1
        ORDER BY
          principal DESC,
          criado_em DESC
        `,
        [clienteId],
      );

    return res.json({
      enderecos:
        result.rows,
    });
  } catch (error) {
    return responderErroBanco(
      res,
      error,
      "Erro interno ao listar endereços.",
    );
  }
}

export async function criarEndereco(
  req,
  res,
) {
  const clienteId =
    obterClienteId(req, res);

  if (!clienteId) {
    return;
  }

  const validacao =
    validarEndereco(req.body);

  if (!validacao.valido) {
    return res
      .status(400)
      .json({
        erro:
          validacao.erro,
      });
  }

  const dados =
    validacao.dados;

  let client;

  let transacaoIniciada =
    false;

  try {
    client =
      await pool.connect();

    await client.query(
      "BEGIN",
    );

    transacaoIniciada =
      true;

    const quantidadeResult =
      await client.query(
        `
        SELECT
          COUNT(*)::INTEGER
            AS total
        FROM enderecos
        WHERE cliente_id = $1
        `,
        [clienteId],
      );

    const primeiroEndereco =
      quantidadeResult
        .rows[0]
        .total === 0;

    const principal =
      primeiroEndereco ||
      dados.principal;

    if (principal) {
      await client.query(
        `
        UPDATE enderecos
        SET
          principal = FALSE,
          atualizado_em = NOW()
        WHERE cliente_id = $1
        `,
        [clienteId],
      );
    }

    const result =
      await client.query(
        `
        INSERT INTO enderecos (
          cliente_id,
          nome_destinatario,
          cep,
          rua,
          numero,
          complemento,
          bairro,
          cidade,
          estado,
          principal
        )
        VALUES (
          $1,
          $2,
          $3,
          $4,
          $5,
          $6,
          $7,
          $8,
          $9,
          $10
        )
        RETURNING
          id,
          nome_destinatario,
          cep,
          rua,
          numero,
          complemento,
          bairro,
          cidade,
          estado,
          principal,
          criado_em,
          atualizado_em
        `,
        [
          clienteId,
          dados
            .nomeDestinatario,
          dados.cep,
          dados.rua,
          dados.numero,
          dados.complemento,
          dados.bairro,
          dados.cidade,
          dados.estado,
          principal,
        ],
      );

    await client.query(
      "COMMIT",
    );

    transacaoIniciada =
      false;

    return res
      .status(201)
      .json({
        mensagem:
          "Endereço cadastrado com sucesso.",

        endereco:
          result.rows[0],
      });
  } catch (error) {
    if (
      client &&
      transacaoIniciada
    ) {
      await client
        .query("ROLLBACK")
        .catch(
          (
            rollbackError,
          ) => {
            console.error(
              "Erro no rollback:",
              rollbackError,
            );
          },
        );
    }

    return responderErroBanco(
      res,
      error,
      "Erro interno ao cadastrar endereço.",
    );
  } finally {
    client?.release();
  }
}

export async function atualizarEndereco(
  req,
  res,
) {
  const clienteId =
    obterClienteId(req, res);

  if (!clienteId) {
    return;
  }

  const enderecoId =
    Number(req.params.id);

  if (
    !Number.isInteger(
      enderecoId,
    )
  ) {
    return res
      .status(400)
      .json({
        erro:
          "ID do endereço inválido.",
      });
  }

  const validacao =
    validarEndereco(req.body);

  if (!validacao.valido) {
    return res
      .status(400)
      .json({
        erro:
          validacao.erro,
      });
  }

  const dados =
    validacao.dados;

  let client;

  let transacaoIniciada =
    false;

  try {
    client =
      await pool.connect();

    await client.query(
      "BEGIN",
    );

    transacaoIniciada =
      true;

    if (dados.principal) {
      await client.query(
        `
        UPDATE enderecos
        SET
          principal = FALSE,
          atualizado_em = NOW()
        WHERE cliente_id = $1
        `,
        [clienteId],
      );
    }

    const result =
      await client.query(
        `
        UPDATE enderecos
        SET
          nome_destinatario = $1,
          cep = $2,
          rua = $3,
          numero = $4,
          complemento = $5,
          bairro = $6,
          cidade = $7,
          estado = $8,
          principal = $9,
          atualizado_em = NOW()
        WHERE
          id = $10
          AND cliente_id = $11
        RETURNING
          id,
          nome_destinatario,
          cep,
          rua,
          numero,
          complemento,
          bairro,
          cidade,
          estado,
          principal,
          criado_em,
          atualizado_em
        `,
        [
          dados
            .nomeDestinatario,

          dados.cep,
          dados.rua,
          dados.numero,
          dados.complemento,
          dados.bairro,
          dados.cidade,
          dados.estado,
          dados.principal,

          enderecoId,
          clienteId,
        ],
      );

    if (
      result.rows.length ===
      0
    ) {
      await client.query(
        "ROLLBACK",
      );

      transacaoIniciada =
        false;

      return res
        .status(404)
        .json({
          erro:
            "Endereço não encontrado.",
        });
    }

    await client.query(
      "COMMIT",
    );

    transacaoIniciada =
      false;

    return res.json({
      mensagem:
        "Endereço atualizado com sucesso.",

      endereco:
        result.rows[0],
    });
  } catch (error) {
    if (
      client &&
      transacaoIniciada
    ) {
      await client
        .query("ROLLBACK")
        .catch(
          (
            rollbackError,
          ) => {
            console.error(
              "Erro no rollback:",
              rollbackError,
            );
          },
        );
    }

    return responderErroBanco(
      res,
      error,
      "Erro interno ao atualizar endereço.",
    );
  } finally {
    client?.release();
  }
}

export async function excluirEndereco(
  req,
  res,
) {
  const clienteId =
    obterClienteId(req, res);

  if (!clienteId) {
    return;
  }

  const enderecoId =
    Number(req.params.id);

  if (
    !Number.isInteger(
      enderecoId,
    )
  ) {
    return res
      .status(400)
      .json({
        erro:
          "ID do endereço inválido.",
      });
  }

  let client;

  let transacaoIniciada =
    false;

  try {
    client =
      await pool.connect();

    await client.query(
      "BEGIN",
    );

    transacaoIniciada =
      true;

    const result =
      await client.query(
        `
        DELETE FROM enderecos
        WHERE
          id = $1
          AND cliente_id = $2
        RETURNING
          id,
          principal
        `,
        [
          enderecoId,
          clienteId,
        ],
      );

    if (
      result.rows.length ===
      0
    ) {
      await client.query(
        "ROLLBACK",
      );

      transacaoIniciada =
        false;

      return res
        .status(404)
        .json({
          erro:
            "Endereço não encontrado.",
        });
    }

    if (
      result.rows[0]
        .principal
    ) {
      await client.query(
        `
        UPDATE enderecos
        SET
          principal = TRUE,
          atualizado_em = NOW()
        WHERE id = (
          SELECT id
          FROM enderecos
          WHERE cliente_id = $1
          ORDER BY
            criado_em DESC
          LIMIT 1
        )
        `,
        [clienteId],
      );
    }

    await client.query(
      "COMMIT",
    );

    transacaoIniciada =
      false;

    return res.json({
      mensagem:
        "Endereço excluído com sucesso.",
    });
  } catch (error) {
    if (
      client &&
      transacaoIniciada
    ) {
      await client
        .query("ROLLBACK")
        .catch(
          (
            rollbackError,
          ) => {
            console.error(
              "Erro no rollback:",
              rollbackError,
            );
          },
        );
    }

    return responderErroBanco(
      res,
      error,
      "Erro interno ao excluir endereço.",
    );
  } finally {
    client?.release();
  }
}