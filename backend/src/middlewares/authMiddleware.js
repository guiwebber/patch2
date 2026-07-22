import jwt from "jsonwebtoken";

export function autenticarUsuario(req, res, next) {
  const authorization = req.headers.authorization;

  if (!authorization) {
    return res.status(401).json({
      erro: "Token não informado.",
    });
  }

  const [tipo, token] = authorization.split(" ");

  if (tipo !== "Bearer" || !token) {
    return res.status(401).json({
      erro: "Token inválido.",
    });
  }

  if (!process.env.JWT_SECRET) {
    console.error("JWT_SECRET não configurado.");

    return res.status(500).json({
      erro: "Erro na configuração do servidor.",
    });
  }

  try {
    const payload = jwt.verify(
      token,
      process.env.JWT_SECRET,
    );

    req.usuario = {
      id: payload.id,
      email: payload.email,
      provedor: payload.provedor,
    };

    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        erro: "Sua sessão expirou. Faça login novamente.",
      });
    }

    return res.status(401).json({
      erro: "Token inválido.",
    });
  }
}