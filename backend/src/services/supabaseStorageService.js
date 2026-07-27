import crypto from "node:crypto";

function obterConfiguracao() {
  const supabaseUrl = String(
    process.env.SUPABASE_URL || "",
  ).replace(/\/+$/, "");

  const serviceRoleKey = String(
    process.env.SUPABASE_SERVICE_ROLE_KEY || "",
  ).trim();

  const bucket = String(
    process.env.SUPABASE_PRODUCT_BUCKET || "produtos",
  ).trim();

  if (!supabaseUrl) {
    throw new Error("SUPABASE_URL não configurada.");
  }

  if (!serviceRoleKey) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY não configurada.",
    );
  }

  if (!bucket) {
    throw new Error(
      "SUPABASE_PRODUCT_BUCKET não configurado.",
    );
  }

  return {
    supabaseUrl,
    serviceRoleKey,
    bucket,
  };
}

function nomeSeguro(nomeOriginal) {
  const nome = String(nomeOriginal || "imagem")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  return nome || "imagem";
}

export async function enviarImagemProduto(
  arquivo,
) {
  const {
    supabaseUrl,
    serviceRoleKey,
    bucket,
  } = obterConfiguracao();

  const caminho = [
    "produtos",
    new Date().toISOString().slice(0, 10),
    `${Date.now()}-${crypto.randomUUID()}-${nomeSeguro(
      arquivo.originalname,
    )}`,
  ].join("/");

  const response = await fetch(
    `${supabaseUrl}/storage/v1/object/${bucket}/${caminho}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${serviceRoleKey}`,
        apikey: serviceRoleKey,
        "Content-Type": arquivo.mimetype,
        "x-upsert": "false",
      },
      body: arquivo.buffer,
    },
  );

  if (!response.ok) {
    const data = await response
      .json()
      .catch(() => null);

    throw new Error(
      data?.message ||
        data?.error ||
        "Não foi possível enviar a imagem ao Supabase Storage.",
    );
  }

  const caminhoPublico = caminho
    .split("/")
    .map(encodeURIComponent)
    .join("/");

  return {
    caminho,
    url:
      `${supabaseUrl}/storage/v1/object/public/` +
      `${encodeURIComponent(bucket)}/${caminhoPublico}`,
  };
}
