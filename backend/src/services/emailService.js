import { Resend } from "resend";

let clienteResend = null;

function obterResend() {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    throw new Error("RESEND_API_KEY não configurada.");
  }

  if (!clienteResend) {
    clienteResend = new Resend(apiKey);
  }

  return clienteResend;
}

function obterRemetente() {
  return (
    process.env.EMAIL_FROM ||
    "PatchWork <onboarding@resend.dev>"
  );
}

export async function enviarEmail({
  para,
  assunto,
  html,
  texto,
  idempotencyKey,
}) {
  if (!para) {
    throw new Error("Destinatário do e-mail não informado.");
  }

  const resend = obterResend();

  const { data, error } = await resend.emails.send(
    {
      from: obterRemetente(),
      to: [para],
      subject: assunto,
      html,
      text: texto,
    },
    {
      idempotencyKey,
    },
  );

  if (error) {
    const erro = new Error(
      error.message || "O Resend recusou o envio do e-mail.",
    );

    erro.name = "ResendEmailError";
    erro.resendError = error;

    throw erro;
  }

  console.log("E-mail enviado pelo Resend:", {
    para,
    assunto,
    emailId: data?.id,
    idempotencyKey,
  });

  return data;
}
