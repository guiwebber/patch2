import pool from "../config/db.js";

function mapearVariacoes(valor) {
  if (!Array.isArray(valor)) return [];
  return valor.map((v) => ({
    id: Number(v.id),
    productId: Number(v.produto_id),
    name: v.nome,
    image: v.imagem,
    colorHex: v.cor_hex || undefined,
    order: Number(v.ordem || 0),
    active: Boolean(v.ativo),
  }));
}

export function mapearProdutoBanco(produto) {
  return {
    id: Number(produto.id),
    name: produto.nome,
    category: produto.categoria,
    description: produto.descricao,
    price: Number(produto.preco),
    oldPrice: produto.preco_antigo === null ? undefined : Number(produto.preco_antigo),
    image: produto.imagem,
    images: Array.isArray(produto.imagens) ? produto.imagens : [],
    featured: Boolean(produto.destaque),
    active: Boolean(produto.ativo),
    hasVariations: Boolean(produto.possui_variacoes),
    variations: mapearVariacoes(produto.variacoes),
    peso: Number(produto.peso),
    altura: Number(produto.altura),
    largura: Number(produto.largura),
    comprimento: Number(produto.comprimento),
    producaoMinDias: Number(produto.producao_min_dias),
    producaoMaxDias: Number(produto.producao_max_dias),
    criadoEm: produto.criado_em,
    atualizadoEm: produto.atualizado_em,
  };
}

export function mapearProdutoPedido(produto) {
  return {
    id: Number(produto.id),
    nome: produto.nome,
    categoria: produto.categoria,
    preco: Number(produto.preco),
    imagem: produto.imagem,
    possuiVariacoes: Boolean(produto.possui_variacoes),
    peso: Number(produto.peso),
    altura: Number(produto.altura),
    largura: Number(produto.largura),
    comprimento: Number(produto.comprimento),
  };
}

export async function buscarProdutosPorIds(ids, { somenteAtivos = true } = {}) {
  const idsNormalizados = [...new Set(ids.map(Number).filter(Number.isInteger))];
  if (idsNormalizados.length === 0) return [];

  const result = await pool.query(
    `SELECT * FROM produtos
     WHERE id = ANY($1::bigint[])
     ${somenteAtivos ? "AND ativo = TRUE" : ""}`,
    [idsNormalizados],
  );

  return result.rows.map(mapearProdutoPedido);
}
