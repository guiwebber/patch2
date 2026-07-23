import bcrypt from "bcryptjs";

import pool from "../config/db.js";

const NOME_REGEX = /^[\p{L}\s'-]+$/u;

function normalizarNome(value) {
  return typeof value === "string"
    ? value.trim().replace(/\s+/g, " ")
    : "";
}

function normalizarTelefone(value) {
  return String(value ?? "")
    .replace(/\D/g, "")
    .slice(0, 11);
}

export async function buscarPerfil(req, res) {
  try {
    const result = await pool.query(
      `
      SELECT
        id,
        nome,
        telefone,
        email,
        foto,
        provedor,
        criado_em
      FROM clientes
      WHERE id = $1
      LIMIT 1
      `,
      [req.usuario.id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        erro: "Usuário não encontrado.",
      });
    }

    return res.json({
      cliente: result.rows[0],
    });
  } catch (error) {
    console.error("Erro ao buscar perfil:", error);

    return res.status(500).json({
      erro: "Erro interno ao buscar perfil.",
    });
  }
}

export async function atualizarPerfil(req, res) {
  const nome = normalizarNome(req.body.nome);
  const telefone =
    normalizarTelefone(req.body.telefone);

  if (!nome) {
    return res.status(400).json({
      erro: "O nome é obrigatório.",
    });
  }

  if (nome.length < 3) {
    return res.status(400).json({
      erro:
        "Informe um nome com pelo menos 3 caracteres.",
    });
  }

  if (!NOME_REGEX.test(nome)) {
    return res.status(400).json({
      erro:
        "O nome deve conter apenas letras.",
    });
  }

  if (
    telefone &&
    ![10, 11].includes(telefone.length)
  ) {
    return res.status(400).json({
      erro:
        "Informe um telefone válido com DDD.",
    });
  }

  try {
    const result = await pool.query(
      `
      UPDATE clientes
      SET
        nome = $1,
        telefone = $2,
        atualizado_em = NOW()
      WHERE id = $3
      RETURNING
        id,
        nome,
        telefone,
        email,
        foto,
        provedor
      `,
      [
        nome,
        telefone || null,
        req.usuario.id,
      ],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        erro: "Usuário não encontrado.",
      });
    }

    return res.json({
      mensagem:
        "Perfil atualizado com sucesso.",
      cliente: result.rows[0],
    });
  } catch (error) {
    console.error(
      "Erro ao atualizar perfil:",
      error,
    );

    return res.status(500).json({
      erro:
        "Erro interno ao atualizar perfil.",
    });
  }
}

export async function alterarSenha(req, res) {
  const {
    senhaAtual,
    novaSenha,
    confirmarNovaSenha,
  } = req.body;

  if (
    !senhaAtual ||
    !novaSenha ||
    !confirmarNovaSenha
  ) {
    return res.status(400).json({
      erro:
        "Preencha todos os campos de senha.",
    });
  }

  if (novaSenha.length < 6) {
    return res.status(400).json({
      erro:
        "A nova senha precisa ter pelo menos 6 caracteres.",
    });
  }

  if (novaSenha !== confirmarNovaSenha) {
    return res.status(400).json({
      erro:
        "As novas senhas não coincidem.",
    });
  }

  try {
    const result = await pool.query(
      `
      SELECT senha, provedor
      FROM clientes
      WHERE id = $1
      LIMIT 1
      `,
      [req.usuario.id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        erro: "Usuário não encontrado.",
      });
    }

    const cliente = result.rows[0];

    if (
      !cliente.senha ||
      cliente.provedor === "google"
    ) {
      return res.status(400).json({
        erro:
          "Contas Google não possuem senha local para alterar.",
      });
    }

    const senhaCorreta = await bcrypt.compare(
      senhaAtual,
      cliente.senha,
    );

    if (!senhaCorreta) {
      return res.status(401).json({
        erro:
          "A senha atual está incorreta.",
      });
    }

    const novaSenhaHash = await bcrypt.hash(
      novaSenha,
      10,
    );

    await pool.query(
      `
      UPDATE clientes
      SET
        senha = $1,
        atualizado_em = NOW()
      WHERE id = $2
      `,
      [novaSenhaHash, req.usuario.id],
    );

    return res.json({
      mensagem:
        "Senha alterada com sucesso.",
    });
  } catch (error) {
    console.error(
      "Erro ao alterar senha:",
      error,
    );

    return res.status(500).json({
      erro:
        "Erro interno ao alterar senha.",
    });
  }
}
