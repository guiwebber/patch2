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

function normalizarImagens(imagemPrincipal, imagens) {
  const lista = Array.isArray(imagens)
    ? imagens.map(texto).filter(Boolean)
    : [];

  return [...new Set([imagemPrincipal, ...lista].filter(Boolean))];
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

  return { produto };
}

export async function listarProdutosAdmin(req, res) {
  try {
    const result = await pool.query(`
      SELECT * FROM produtos
      ORDER BY ativo DESC, atualizado_em DESC, id DESC
    `);

    return res.json({ produtos: result.rows.map(mapearProdutoBanco) });
  } catch (error) {
    console.error("Erro ao listar produtos no admin:", error);
    return res.status(500).json({ erro: "Erro interno ao listar produtos." });
  }
}

export async function criarProdutoAdmin(req, res) {
  const validacao = validarProduto(req.body);
  if (validacao.erro) return res.status(400).json({ erro: validacao.erro });

  const p = validacao.produto;

  try {
    const result = await pool.query(
      `
        INSERT INTO produtos (
          nome, categoria, descricao, preco, preco_antigo,
          imagem, imagens, destaque, ativo,
          peso, altura, largura, comprimento,
          producao_min_dias, producao_max_dias
        ) VALUES (
          $1, $2, $3, $4, $5,
          $6, $7::jsonb, $8, $9,
          $10, $11, $12, $13,
          $14, $15
        )
        RETURNING *
      `,
      [
        p.nome, p.categoria, p.descricao, p.preco, p.precoAntigo,
        p.imagem, JSON.stringify(p.imagens), p.destaque, p.ativo,
        p.peso, p.altura, p.largura, p.comprimento,
        p.producaoMinDias, p.producaoMaxDias,
      ],
    );

    return res.status(201).json({
      mensagem: "Produto cadastrado com sucesso.",
      produto: mapearProdutoBanco(result.rows[0]),
    });
  } catch (error) {
    console.error("Erro ao cadastrar produto:", error);
    return res.status(500).json({ erro: "Erro interno ao cadastrar produto." });
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

  try {
    const result = await pool.query(
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
          peso = $10,
          altura = $11,
          largura = $12,
          comprimento = $13,
          producao_min_dias = $14,
          producao_max_dias = $15,
          atualizado_em = NOW()
        WHERE id = $16
        RETURNING *
      `,
      [
        p.nome, p.categoria, p.descricao, p.preco, p.precoAntigo,
        p.imagem, JSON.stringify(p.imagens), p.destaque, p.ativo,
        p.peso, p.altura, p.largura, p.comprimento,
        p.producaoMinDias, p.producaoMaxDias, produtoId,
      ],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ erro: "Produto não encontrado." });
    }

    return res.json({
      mensagem: "Produto atualizado com sucesso.",
      produto: mapearProdutoBanco(result.rows[0]),
    });
  } catch (error) {
    console.error("Erro ao atualizar produto:", error);
    return res.status(500).json({ erro: "Erro interno ao atualizar produto." });
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
      `UPDATE produtos SET ativo = $1, atualizado_em = NOW() WHERE id = $2 RETURNING *`,
      [ativo, produtoId],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ erro: "Produto não encontrado." });
    }

    return res.json({
      mensagem: ativo ? "Produto ativado." : "Produto ocultado da loja.",
      produto: mapearProdutoBanco(result.rows[0]),
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
    // Exclusão lógica: preserva os produtos dos pedidos antigos.
    const result = await pool.query(
      `UPDATE produtos SET ativo = FALSE, atualizado_em = NOW() WHERE id = $1 RETURNING id`,
      [produtoId],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ erro: "Produto não encontrado." });
    }

    return res.json({ mensagem: "Produto removido da loja com sucesso." });
  } catch (error) {
    console.error("Erro ao excluir produto:", error);
    return res.status(500).json({ erro: "Erro interno ao excluir produto." });
  }
}


export async function uploadImagensProdutoAdmin(
  req,
  res,
) {
  const arquivos = Array.isArray(req.files)
    ? req.files
    : [];

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
      urls: imagens.map(
        (imagem) => imagem.url,
      ),
    });
  } catch (error) {
    console.error(
      "Erro ao enviar imagens do produto:",
      error,
    );

    return res.status(500).json({
      erro:
        error?.message ||
        "Erro interno ao enviar as imagens.",
    });
  }
}
