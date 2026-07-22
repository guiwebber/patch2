import jwt from "jsonwebtoken";

export function gerarToken(cliente) {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET não configurado.");
  }

  return jwt.sign(
    {
      id: cliente.id,
      email: cliente.email,
      provedor: cliente.provedor,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES_IN || "7d",
    },
  );
}