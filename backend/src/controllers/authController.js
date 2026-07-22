import bcrypt from "bcryptjs";

import pool from "../config/db.js";
import { validarTokenGoogle } from "../services/googleAuthService.js";
import { gerarToken } from "../services/tokenService.js";

function formatarCliente(cliente) {
  return {
    id: cliente.id,
    nome: cliente.nome,
    telefone: cliente.telefone,
    email: cliente.email,
    foto: cliente.foto,
    provedor: cliente.provedor,
  };
}

export async function cadastrarCliente(req, res) {
  const { nome, telefone, email, senha } = req.body;

  if (!nome?.trim() || !email?.trim() || !senha) {
    return res.status(400).json({
      erro: "Nome, e-mail e senha são obrigatórios.",
    });
  }

  if (senha.length < 6) {
    return res.status(400).json({
      erro: "A senha precisa ter pelo menos 6 caracteres.",
    });
  }

  const emailNormalizado = email.trim().toLowerCase();

  try {
    const clienteExistente = await pool.query(
      `
      SELECT id
      FROM clientes
      WHERE email = $1
      LIMIT 1
      `,
      [emailNormalizado],
    );

    if (clienteExistente.rows.length > 0) {
      return res.status(409).json({
        erro: "Já existe uma conta com esse e-mail.",
      });
    }

    const senhaCriptografada = await bcrypt.hash(senha, 10);

    const result = await pool.query(
      `
      INSERT INTO clientes (
        nome,
        telefone,
        email,
        senha,
        provedor
      )
      VALUES ($1, $2, $3, $4, 'email')
      RETURNING
        id,
        nome,
        telefone,
        email,
        foto,
        provedor
      `,
      [
        nome.trim(),
        telefone?.trim() || null,
        emailNormalizado,
        senhaCriptografada,
      ],
    );

    const cliente = result.rows[0];
    const token = gerarToken(cliente);

    return res.status(201).json({
      mensagem: "Cliente cadastrado com sucesso.",
      cliente: formatarCliente(cliente),
      token,
    });
  } catch (error) {
    console.error("Erro ao cadastrar cliente:", error);

    if (error?.code === "23505") {
      return res.status(409).json({
        erro: "Já existe uma conta com esse e-mail.",
      });
    }

    return res.status(500).json({
      erro: "Erro interno ao cadastrar cliente.",
    });
  }
}

export async function loginCliente(req, res) {
  const { email, senha } = req.body;

  if (!email?.trim() || !senha) {
    return res.status(400).json({
      erro: "E-mail e senha são obrigatórios.",
    });
  }

  try {
    const result = await pool.query(
      `
      SELECT
        id,
        nome,
        telefone,
        email,
        senha,
        foto,
        provedor
      FROM clientes
      WHERE email = $1
      LIMIT 1
      `,
      [email.trim().toLowerCase()],
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        erro: "E-mail ou senha incorretos.",
      });
    }

    const cliente = result.rows[0];

    if (!cliente.senha) {
      return res.status(400).json({
        erro: "Essa conta utiliza login com Google.",
      });
    }

    const senhaCorreta = await bcrypt.compare(
      senha,
      cliente.senha,
    );

    if (!senhaCorreta) {
      return res.status(401).json({
        erro: "E-mail ou senha incorretos.",
      });
    }

    const token = gerarToken(cliente);

    return res.json({
      mensagem: "Login realizado com sucesso.",
      cliente: formatarCliente(cliente),
      token,
    });
  } catch (error) {
    console.error("Erro no login:", error);

    return res.status(500).json({
      erro: "Erro interno ao realizar login.",
    });
  }
}

export async function loginGoogle(req, res) {
  const { credential } = req.body;

  if (!credential) {
    return res.status(400).json({
      erro: "Credencial do Google não informada.",
    });
  }

  try {
    const dadosGoogle =
      await validarTokenGoogle(credential);

    const { googleId, nome, email, foto } =
      dadosGoogle;

    let result = await pool.query(
      `
      SELECT
        id,
        nome,
        telefone,
        email,
        google_id,
        foto,
        provedor
      FROM clientes
      WHERE google_id = $1 OR email = $2
      LIMIT 1
      `,
      [googleId, email],
    );

    let cliente;
    let contaCriada = false;

    if (result.rows.length === 0) {
      result = await pool.query(
        `
        INSERT INTO clientes (
          nome,
          telefone,
          email,
          senha,
          google_id,
          foto,
          provedor
        )
        VALUES ($1, NULL, $2, NULL, $3, $4, 'google')
        RETURNING
          id,
          nome,
          telefone,
          email,
          google_id,
          foto,
          provedor
        `,
        [nome, email, googleId, foto],
      );

      cliente = result.rows[0];
      contaCriada = true;
    } else {
      const clienteExistente = result.rows[0];

      if (
        clienteExistente.google_id &&
        clienteExistente.google_id !== googleId
      ) {
        return res.status(409).json({
          erro: "Esse e-mail já está vinculado a outra conta Google.",
        });
      }

      result = await pool.query(
        `
        UPDATE clientes
        SET
          google_id = COALESCE(google_id, $1),
          foto = COALESCE($2, foto),
          atualizado_em = NOW()
        WHERE id = $3
        RETURNING
          id,
          nome,
          telefone,
          email,
          google_id,
          foto,
          provedor
        `,
        [
          googleId,
          foto,
          clienteExistente.id,
        ],
      );

      cliente = result.rows[0];
    }

    const token = gerarToken(cliente);

    return res.status(contaCriada ? 201 : 200).json({
      mensagem: contaCriada
        ? "Conta criada com Google."
        : "Login com Google realizado com sucesso.",
      cliente: formatarCliente(cliente),
      token,
    });
  } catch (error) {
    console.error("Erro no login Google:", error);

    return res.status(401).json({
      erro:
        error instanceof Error
          ? error.message
          : "Não foi possível validar o login com Google.",
    });
  }
}
export async function buscarUsuarioLogado(req, res) {
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
    console.error("Erro ao buscar usuário:", error);

    return res.status(500).json({
      erro: "Erro interno ao buscar usuário.",
    });
  }
}