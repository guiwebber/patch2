import pool from "../config/db.js";
import { mapearProdutoBanco } from "../services/productService.js";
import { enviarImagemProduto } from "../services/supabaseStorageService.js";

function texto(valor) {
  return String(valor ?? "").trim();
}

function numero(valor) {
  if (valor === "" || valor === null || valor === undefined) return null;
  const convertido = Number(valor);
  return Number.isFinite(convertido) ? convertido : null;
}

function booleano(valor, padrao = false) {
  if (typeof valor === "boolean") return valor;
  if (valor === "true") return true;
  if (valor === "false") return false;
  return padrao;
}


function mensagemErroBanco(error) {
  if (error?.code === "42P01") {
    return "A tabela produto_variacoes não existe. Execute novamente o arquivo database/variacoes.sql no Supabase.";
  }

  if (error?.code === "42703") {
    return "A coluna possui_variacoes ou alguma coluna das opções não existe. Execute novamente database/variacoes.sql.";
  }

  if (error?.code === "23503") {
    return "Não foi possível relacionar a opção ao produto.";
  }

  if (error?.code === "23502") {
    return "Uma informação obrigatória da opção ficou vazia.";
  }

  return process.env.NODE_ENV === "development"
    ? error?.message
    : undefined;
}

function normalizarImagens(imagemPrincipal, imagens) {
  const lista = Array.isArray(imagens)
    ? imagens.map(texto).filter(Boolean)
    : [];

  return [...new Set([imagemPrincipal, ...lista].filter(Boolean))];
}

function normalizarVariacoes(valor) {
  if (!Array.isArray(valor)) return [];

  return valor
    .map((variacao, indice) => ({
      nome: texto(variacao.nome ?? variacao.name),
      imagem: texto(variacao.imagem ?? variacao.image),
      corHex: texto(variacao.corHex ?? variacao.colorHex) || null,
      ordem: Number.isInteger(Number(variacao.ordem ?? variacao.order))
        ? Number(variacao.ordem ?? variacao.order)
        : indice,
      ativo: booleano(variacao.ativo ?? variacao.active, true),
    }))
    .filter((variacao) => variacao.nome || variacao.imagem);
}

function validarProduto(body) {
  const produto = {
    nome: texto(body.nome ?? body.name),
    categoria: texto(body.categoria ?? body.category),
    descricao: texto(body.descricao ?? body.description),
    preco: numero(body.preco ?? body.price),
    precoAntigo: numero(body.precoAntigo ?? body.oldPrice),
    imagem: texto(body.imagem ?? body.image),
    destaque: booleano(body.destaque ?? body.featured),
    ativo: booleano(body.ativo ?? body.active, true),
    possuiVariacoes: booleano(
      body.possuiVariacoes ?? body.hasVariations,
      false,
    ),
    peso: numero(body.peso),
    altura: numero(body.altura),
    largura: numero(body.largura),
    comprimento: numero(body.comprimento),
    producaoMinDias: numero(body.producaoMinDias),
    producaoMaxDias: numero(body.producaoMaxDias),
  };

  produto.imagens = normalizarImagens(
    produto.imagem,
    body.imagens ?? body.images,
  );

  produto.variacoes = normalizarVariacoes(
    body.variacoes ?? body.variations,
  );

  if (!produto.nome || !produto.categoria || !produto.descricao || !produto.imagem) {
    return { erro: "Preencha nome, categoria, descrição e imagem principal." };
  }

  const positivos = ["preco", "peso", "altura", "largura", "comprimento"];
  for (const campo of positivos) {
    if (produto[campo] === null || produto[campo] <= 0) {
      return { erro: `O campo ${campo} precisa ser maior que zero.` };
    }
  }

  if (produto.precoAntigo !== null && produto.precoAntigo <= 0) {
    return { erro: "O preço antigo precisa ser maior que zero ou ficar vazio." };
  }

  if (
    !Number.isInteger(produto.producaoMinDias) ||
    !Number.isInteger(produto.producaoMaxDias) ||
    produto.producaoMinDias < 0 ||
    produto.producaoMaxDias < produto.producaoMinDias
  ) {
    return { erro: "Informe um prazo de produção válido." };
  }

  if (produto.possuiVariacoes) {
    if (produto.variacoes.length === 0) {
      return { erro: "Cadastre pelo menos uma variação para o produto." };
    }

    const invalida = produto.variacoes.find(
      (variacao) => !variacao.nome || !variacao.imagem,
    );

    if (invalida) {
      return { erro: "Todas as variações precisam de nome e imagem." };
    }
  } else {
    produto.variacoes = [];
  }

  return { produto };
}

const SELECT_ADMIN = `
  SELECT
    p.*,
    COALESCE(
      JSON_AGG(
        JSON_BUILD_OBJECT(
          'id', v.id,
          'produto_id', v.produto_id,
          'nome', v.nome,
          'imagem', v.imagem,
          'cor_hex', v.cor_hex,
          'ordem', v.ordem,
          'ativo', v.ativo
        )
        ORDER BY v.ordem, v.id
      ) FILTER (WHERE v.id IS NOT NULL),
      '[]'::json
    ) AS variacoes
  FROM produtos p
  LEFT JOIN produto_variacoes v ON v.produto_id = p.id
`;

async function substituirVariacoes(client, produtoId, variacoes) {
  await client.query(
    "DELETE FROM produto_variacoes WHERE produto_id = $1",
    [produtoId],
  );

  for (const variacao of variacoes) {
    await client.query(
      `
        INSERT INTO produto_variacoes (
          produto_id, nome, imagem, cor_hex, ordem, ativo
        )
        VALUES ($1, $2, $3, $4, $5, $6)
      `,
      [
        produtoId,
        variacao.nome,
        variacao.imagem,
        variacao.corHex,
        variacao.ordem,
        variacao.ativo,
      ],
    );
  }
}

async function buscarProdutoCompleto(client, produtoId) {
  const result = await client.query(
    `
      ${SELECT_ADMIN}
      WHERE p.id = $1
      GROUP BY p.id
      LIMIT 1
    `,
    [produtoId],
  );

  return result.rows[0] || null;
}

export async function listarProdutosAdmin(req, res) {
  try {
    const result = await pool.query(`
      ${SELECT_ADMIN}
      GROUP BY p.id
      ORDER BY p.ativo DESC, p.atualizado_em DESC, p.id DESC
    `);

    return res.json({
      produtos: result.rows.map(mapearProdutoBanco),
    });
  } catch (error) {
    console.error("Erro ao listar produtos no admin:", error);
    return res.status(500).json({
      erro: "Erro interno ao listar produtos.",
      detalhes: mensagemErroBanco(error),
    });
  }
}

export async function criarProdutoAdmin(req, res) {
  const validacao = validarProduto(req.body);
  if (validacao.erro) return res.status(400).json({ erro: validacao.erro });

  const p = validacao.produto;
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const result = await client.query(
      `
        INSERT INTO produtos (
          nome, categoria, descricao, preco, preco_antigo,
          imagem, imagens, destaque, ativo, possui_variacoes,
          peso, altura, largura, comprimento,
          producao_min_dias, producao_max_dias
        ) VALUES (
          $1, $2, $3, $4, $5,
          $6, $7::jsonb, $8, $9, $10,
          $11, $12, $13, $14,
          $15, $16
        )
        RETURNING id
      `,
      [
        p.nome, p.categoria, p.descricao, p.preco, p.precoAntigo,
        p.imagem, JSON.stringify(p.imagens), p.destaque, p.ativo,
        p.possuiVariacoes, p.peso, p.altura, p.largura, p.comprimento,
        p.producaoMinDias, p.producaoMaxDias,
      ],
    );

    const produtoId = Number(result.rows[0].id);
    await substituirVariacoes(client, produtoId, p.variacoes);

    const produtoCompleto = await buscarProdutoCompleto(client, produtoId);
    await client.query("COMMIT");

    return res.status(201).json({
      mensagem: "Produto cadastrado com sucesso.",
      produto: mapearProdutoBanco(produtoCompleto),
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Erro ao cadastrar produto:", error);
    return res.status(500).json({
      erro: "Erro interno ao cadastrar produto.",
      detalhes: mensagemErroBanco(error),
    });
  } finally {
    client.release();
  }
}

export async function atualizarProdutoAdmin(req, res) {
  const produtoId = Number(req.params.id);
  if (!Number.isInteger(produtoId)) {
    return res.status(400).json({ erro: "ID do produto inválido." });
  }

  const validacao = validarProduto(req.body);
  if (validacao.erro) return res.status(400).json({ erro: validacao.erro });

  const p = validacao.produto;
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const result = await client.query(
      `
        UPDATE produtos SET
          nome = $1,
          categoria = $2,
          descricao = $3,
          preco = $4,
          preco_antigo = $5,
          imagem = $6,
          imagens = $7::jsonb,
          destaque = $8,
          ativo = $9,
          possui_variacoes = $10,
          peso = $11,
          altura = $12,
          largura = $13,
          comprimento = $14,
          producao_min_dias = $15,
          producao_max_dias = $16,
          atualizado_em = NOW()
        WHERE id = $17
        RETURNING id
      `,
      [
        p.nome, p.categoria, p.descricao, p.preco, p.precoAntigo,
        p.imagem, JSON.stringify(p.imagens), p.destaque, p.ativo,
        p.possuiVariacoes, p.peso, p.altura, p.largura, p.comprimento,
        p.producaoMinDias, p.producaoMaxDias, produtoId,
      ],
    );

    if (!result.rows.length) {
      await client.query("ROLLBACK");
      return res.status(404).json({ erro: "Produto não encontrado." });
    }

    await substituirVariacoes(client, produtoId, p.variacoes);
    const produtoCompleto = await buscarProdutoCompleto(client, produtoId);
    await client.query("COMMIT");

    return res.json({
      mensagem: "Produto atualizado com sucesso.",
      produto: mapearProdutoBanco(produtoCompleto),
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Erro ao atualizar produto:", error);
    return res.status(500).json({
      erro: "Erro interno ao atualizar produto.",
      detalhes: mensagemErroBanco(error),
    });
  } finally {
    client.release();
  }
}

export async function alterarAtivoProdutoAdmin(req, res) {
  const produtoId = Number(req.params.id);
  const ativo = booleano(req.body.ativo);

  if (!Number.isInteger(produtoId)) {
    return res.status(400).json({ erro: "ID do produto inválido." });
  }

  try {
    const result = await pool.query(
      `UPDATE produtos
       SET ativo = $1, atualizado_em = NOW()
       WHERE id = $2
       RETURNING id`,
      [ativo, produtoId],
    );

    if (!result.rows.length) {
      return res.status(404).json({ erro: "Produto não encontrado." });
    }

    return res.json({
      mensagem: ativo ? "Produto ativado." : "Produto ocultado da loja.",
    });
  } catch (error) {
    console.error("Erro ao alterar produto:", error);
    return res.status(500).json({ erro: "Erro interno ao alterar produto." });
  }
}

export async function excluirProdutoAdmin(req, res) {
  const produtoId = Number(req.params.id);

  if (!Number.isInteger(produtoId)) {
    return res.status(400).json({ erro: "ID do produto inválido." });
  }

  try {
    const result = await pool.query(
      `DELETE FROM produtos WHERE id = $1 RETURNING id`,
      [produtoId],
    );

    if (!result.rows.length) {
      return res.status(404).json({ erro: "Produto não encontrado." });
    }

    return res.json({ mensagem: "Produto excluído com sucesso." });
  } catch (error) {
    console.error("Erro ao excluir produto:", error);
    return res.status(500).json({ erro: "Erro interno ao excluir produto." });
  }
}

export async function uploadImagensProdutoAdmin(req, res) {
  const arquivos = Array.isArray(req.files) ? req.files : [];

  if (arquivos.length === 0) {
    return res.status(400).json({
      erro: "Selecione pelo menos uma imagem.",
    });
  }

  try {
    const imagens = await Promise.all(
      arquivos.map(enviarImagemProduto),
    );

    return res.status(201).json({
      mensagem:
        imagens.length === 1
          ? "Imagem enviada com sucesso."
          : "Imagens enviadas com sucesso.",
      imagens,
      urls: imagens.map((imagem) => imagem.url),
    });
  } catch (error) {
    console.error("Erro ao enviar imagens do produto:", error);

    return res.status(500).json({
      erro: error?.message || "Erro interno ao enviar as imagens.",
    });
  }
}
