import googleClient from "../config/google.js";

export async function validarTokenGoogle(credential) {
  if (!credential) {
    throw new Error("Credencial do Google não informada.");
  }

  const ticket = await googleClient.verifyIdToken({
    idToken: credential,
    audience: process.env.GOOGLE_CLIENT_ID,
  });

  const payload = ticket.getPayload();

  if (
    !payload ||
    !payload.sub ||
    !payload.email ||
    payload.email_verified !== true
  ) {
    throw new Error("Conta Google inválida ou não verificada.");
  }

  return {
    googleId: payload.sub,
    nome: payload.name?.trim() || "Cliente",
    email: payload.email.trim().toLowerCase(),
    foto: payload.picture || null,
  };
}