import pool from "../config/db.js";
import { mapearProdutoBanco } from "../services/productService.js";

const SELECT_BASE = `
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
      ) FILTER (WHERE v.id IS NOT NULL AND v.ativo = TRUE),
      '[]'::json
    ) AS variacoes
  FROM produtos p
  LEFT JOIN produto_variacoes v ON v.produto_id = p.id
`;

export async function listarProdutos(req, res) {
  try {
    const result = await pool.query(`
      ${SELECT_BASE}
      WHERE p.ativo = TRUE
      GROUP BY p.id
      ORDER BY p.destaque DESC, p.criado_em DESC, p.id DESC
    `);
    return res.json({ produtos: result.rows.map(mapearProdutoBanco) });
  } catch (error) {
    console.error("Erro ao listar produtos:", error);
    return res.status(500).json({ erro: "Erro interno ao listar os produtos." });
  }
}

export async function buscarProdutoPorId(req, res) {
  const produtoId = Number(req.params.id);
  if (!Number.isInteger(produtoId)) {
    return res.status(400).json({ erro: "ID do produto inválido." });
  }

  try {
    const result = await pool.query(
      `${SELECT_BASE}
       WHERE p.id = $1 AND p.ativo = TRUE
       GROUP BY p.id
       LIMIT 1`,
      [produtoId],
    );

    if (!result.rows.length) {
      return res.status(404).json({ erro: "Produto não encontrado." });
    }

    return res.json({ produto: mapearProdutoBanco(result.rows[0]) });
  } catch (error) {
    console.error("Erro ao buscar produto:", error);
    return res.status(500).json({ erro: "Erro interno ao buscar o produto." });
  }
}
