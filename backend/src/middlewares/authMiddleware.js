import jwt from "jsonwebtoken";

import pool from "../config/db.js";

export async function autenticarUsuario(
  req,
  res,
  next,
) {
  const authorization =
    req.headers.authorization;

  if (!authorization) {
    return res
      .status(401)
      .json({
        erro:
          "Token não informado.",
      });
  }

  const [
    tipo,
    token,
  ] =
    authorization.split(" ");

  if (
    tipo !== "Bearer" ||
    !token
  ) {
    return res
      .status(401)
      .json({
        erro:
          "Token inválido.",
      });
  }

  if (
    !process.env.JWT_SECRET
  ) {
    console.error(
      "JWT_SECRET não configurado.",
    );

    return res
      .status(500)
      .json({
        erro:
          "Erro na configuração do servidor.",
      });
  }

  try {
    const payload =
      jwt.verify(
        token,
        process.env
          .JWT_SECRET,
      );

    const clienteId =
      Number(payload?.id);

    if (
      !Number.isInteger(
        clienteId,
      )
    ) {
      return res
        .status(401)
        .json({
          erro:
            "Token inválido.",
        });
    }

    const usuarioResult =
      await pool.query(
        `
        SELECT
          id,
          email,
          provedor,
          administrador
        FROM clientes
        WHERE id = $1
        LIMIT 1
        `,
        [clienteId],
      );

    if (
      usuarioResult
        .rows.length === 0
    ) {
      return res
        .status(401)
        .json({
          erro:
            "Usuário do token não encontrado.",
        });
    }

    const usuario =
      usuarioResult.rows[0];

    req.usuario = {
      id:
        Number(usuario.id),

      email:
        usuario.email,

      provedor:
        usuario.provedor,

      administrador:
        Boolean(
          usuario
            .administrador,
        ),
    };

    return next();
  } catch (error) {
    if (
      error?.name ===
      "TokenExpiredError"
    ) {
      return res
        .status(401)
        .json({
          erro:
            "Sua sessão expirou. Faça login novamente.",
        });
    }

    console.error(
      "Erro ao autenticar usuário:",
      {
        name:
          error?.name,

        message:
          error?.message,
      },
    );

    return res
      .status(401)
      .json({
        erro:
          "Token inválido.",
      });
  }
}