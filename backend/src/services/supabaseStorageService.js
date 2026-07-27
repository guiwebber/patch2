import crypto from "node:crypto";

function obterConfiguracao() {
  const supabaseUrl = String(
    process.env.SUPABASE_URL || "",
  )
    .trim()
    .replace(/\/+$/, "");

  const serviceRoleKey = String(
    process.env
      .SUPABASE_SERVICE_ROLE_KEY || "",
  ).trim();

  const bucket = String(
    process.env
      .SUPABASE_PRODUCT_BUCKET ||
      "produtos",
  ).trim();

  if (!supabaseUrl) {
    throw new Error(
      "SUPABASE_URL não configurada.",
    );
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
  const nome = String(
    nomeOriginal || "imagem",
  )
    .normalize("NFD")
    .replace(
      /[\u0300-\u036f]/g,
      "",
    )
    .toLowerCase()
    .replace(
      /[^a-z0-9._-]+/g,
      "-",
    )
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  return nome || "imagem";
}

async function lerResposta(response) {
  const texto =
    await response.text();

  if (!texto) {
    return null;
  }

  try {
    return JSON.parse(texto);
  } catch {
    return {
      message: texto,
    };
  }
}

export async function enviarImagemProduto(
  arquivo,
) {
  const {
    supabaseUrl,
    serviceRoleKey,
    bucket,
  } = obterConfiguracao();

  if (!arquivo?.buffer) {
    throw new Error(
      "Arquivo de imagem inválido.",
    );
  }

  const caminho = [
    "produtos",
    new Date()
      .toISOString()
      .slice(0, 10),

    `${Date.now()}-${crypto.randomUUID()}-${nomeSeguro(
      arquivo.originalname,
    )}`,
  ].join("/");

  const caminhoCodificado = caminho
    .split("/")
    .map(encodeURIComponent)
    .join("/");

  const bucketCodificado =
    encodeURIComponent(bucket);

  /*
   * Chaves antigas começam com eyJ.
   * Chaves novas começam com sb_secret_.
   */
  const chaveLegacy =
    serviceRoleKey.startsWith("eyJ");

  const headers = {
    apikey: serviceRoleKey,

    "Content-Type":
      arquivo.mimetype,

    "x-upsert": "false",
  };

  /*
   * Authorization Bearer deve ser usado
   * somente com a chave JWT legacy.
   */
  if (chaveLegacy) {
    headers.Authorization =
      `Bearer ${serviceRoleKey}`;
  }

  const response = await fetch(
    `${supabaseUrl}/storage/v1/object/` +
      `${bucketCodificado}/${caminhoCodificado}`,
    {
      method: "POST",
      headers,
      body: arquivo.buffer,
    },
  );

  const data =
    await lerResposta(response);

  if (!response.ok) {
    console.error(
      "Supabase recusou o upload:",
      {
        status: response.status,
        data,
      },
    );

    throw new Error(
      data?.message ||
        data?.error ||
        `Erro no upload (${response.status}).`,
    );
  }

  return {
    caminho,

    url:
      `${supabaseUrl}/storage/v1/object/public/` +
      `${bucketCodificado}/${caminhoCodificado}`,
  };
}