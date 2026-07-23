import pool from "../config/db.js";

function validarEndereco(body) {
  if (!body || typeof body !== "object") {
    return false;
  }

  const camposObrigatorios = [
    body.nomeDestinatario,
    body.cep,
    body.rua,
    body.numero,
    body.bairro,
    body.cidade,
    body.estado,
  ];

  return camposObrigatorios.every(
    (value) =>
      typeof value === "string" &&
      value.trim().length > 0,
  );
}

function formatarErroBanco(error) {
  if (!(error instanceof Error)) {
    return {
      message: String(error),
    };
  }

  return {
    name: error.name,
    message: error.message,
    stack: error.stack,

    code: error.code,
    detail: error.detail,
    hint: error.hint,
    position: error.position,
    internalPosition: error.internalPosition,
    internalQuery: error.internalQuery,
    where: error.where,
    schema: error.schema,
    table: error.table,
    column: error.column,
    dataType: error.dataType,
    constraint: error.constraint,
    file: error.file,
    line: error.line,
    routine: error.routine,
  };
}

function responderErroBanco(
  res,
  error,
  mensagemPadrao,
) {
  const erroFormatado = formatarErroBanco(error);

  console.error(
    "========== ERRO NO BANCO ==========",
  );
  console.error(
    JSON.stringify(
      erroFormatado,
      null,
      2,
    ),
  );
  console.error(
    "===================================",
  );

  return res.status(500).json({
    erro: mensagemPadrao,

    // Temporário para descobrir o problema.
    // Remova estas propriedades depois que corrigir.
    detalhes:
      erroFormatado.message ||
      "Erro desconhecido.",
    codigo: erroFormatado.code || null,
  });
}

export async function listarEnderecos(req, res) {
  try {
    const result = await pool.query(
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
      [req.usuario.id],
    );

    return res.json({
      enderecos: result.rows,
    });
  } catch (error) {
    return responderErroBanco(
      res,
      error,
      "Erro interno ao listar endereços.",
    );
  }
}

export async function criarEndereco(req, res) {
  if (!validarEndereco(req.body)) {
    return res.status(400).json({
      erro: "Preencha todos os campos obrigatórios.",
    });
  }

  const {
    nomeDestinatario,
    cep,
    rua,
    numero,
    complemento,
    bairro,
    cidade,
    estado,
    principal,
  } = req.body;

  let client;
  let transacaoIniciada = false;

  try {
    client = await pool.connect();

    await client.query("BEGIN");
    transacaoIniciada = true;

    if (principal) {
      await client.query(
        `
        UPDATE enderecos
        SET
          principal = FALSE,
          atualizado_em = NOW()
        WHERE cliente_id = $1
        `,
        [req.usuario.id],
      );
    }

    const result = await client.query(
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
        cliente_id,
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
        req.usuario.id,
        nomeDestinatario.trim(),
        cep.trim(),
        rua.trim(),
        numero.trim(),
        complemento?.trim() || null,
        bairro.trim(),
        cidade.trim(),
        estado.trim().toUpperCase(),
        Boolean(principal),
      ],
    );

    await client.query("COMMIT");
    transacaoIniciada = false;

    return res.status(201).json({
      mensagem:
        "Endereço cadastrado com sucesso.",
      endereco: result.rows[0],
    });
  } catch (error) {
    if (client && transacaoIniciada) {
      try {
        await client.query("ROLLBACK");
      } catch (rollbackError) {
        console.error(
          "Erro ao desfazer transação:",
          rollbackError,
        );
      }
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

export async function atualizarEndereco(req, res) {
  const { id } = req.params;

  if (!validarEndereco(req.body)) {
    return res.status(400).json({
      erro: "Preencha todos os campos obrigatórios.",
    });
  }

  const {
    nomeDestinatario,
    cep,
    rua,
    numero,
    complemento,
    bairro,
    cidade,
    estado,
    principal,
  } = req.body;

  let client;
  let transacaoIniciada = false;

  try {
    client = await pool.connect();

    await client.query("BEGIN");
    transacaoIniciada = true;

    if (principal) {
      await client.query(
        `
        UPDATE enderecos
        SET
          principal = FALSE,
          atualizado_em = NOW()
        WHERE cliente_id = $1
        `,
        [req.usuario.id],
      );
    }

    const result = await client.query(
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
        cliente_id,
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
        nomeDestinatario.trim(),
        cep.trim(),
        rua.trim(),
        numero.trim(),
        complemento?.trim() || null,
        bairro.trim(),
        cidade.trim(),
        estado.trim().toUpperCase(),
        Boolean(principal),
        id,
        req.usuario.id,
      ],
    );

    if (result.rows.length === 0) {
      await client.query("ROLLBACK");
      transacaoIniciada = false;

      return res.status(404).json({
        erro: "Endereço não encontrado.",
      });
    }

    await client.query("COMMIT");
    transacaoIniciada = false;

    return res.json({
      mensagem:
        "Endereço atualizado com sucesso.",
      endereco: result.rows[0],
    });
  } catch (error) {
    if (client && transacaoIniciada) {
      try {
        await client.query("ROLLBACK");
      } catch (rollbackError) {
        console.error(
          "Erro ao desfazer transação:",
          rollbackError,
        );
      }
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

export async function excluirEndereco(req, res) {
  const { id } = req.params;

  try {
    const result = await pool.query(
      `
      DELETE FROM enderecos
      WHERE
        id = $1
        AND cliente_id = $2
      RETURNING id
      `,
      [id, req.usuario.id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        erro: "Endereço não encontrado.",
      });
    }

    return res.json({
      mensagem:
        "Endereço excluído com sucesso.",
    });
  } catch (error) {
    return responderErroBanco(
      res,
      error,
      "Erro interno ao excluir endereço.",
    );
  }
}