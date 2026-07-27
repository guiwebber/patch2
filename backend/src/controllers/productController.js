import pool from "../config/db.js";
import { mapearProdutoBanco } from "../services/productService.js";

export async function listarProdutos(req, res) {
  try {
    const result = await pool.query(`
      SELECT *
      FROM produtos
      WHERE ativo = TRUE
      ORDER BY destaque DESC, criado_em DESC, id DESC
    `);

    return res.json({
      produtos: result.rows.map(mapearProdutoBanco),
    });
  } catch (error) {
    console.error("Erro ao listar produtos:", error);
    return res.status(500).json({
      erro: "Erro interno ao listar os produtos.",
    });
  }
}

export async function buscarProdutoPorId(req, res) {
  const produtoId = Number(req.params.id);

  if (!Number.isInteger(produtoId)) {
    return res.status(400).json({ erro: "ID do produto inválido." });
  }

  try {
    const result = await pool.query(
      `SELECT * FROM produtos WHERE id = $1 AND ativo = TRUE LIMIT 1`,
      [produtoId],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ erro: "Produto não encontrado." });
    }

    return res.json({ produto: mapearProdutoBanco(result.rows[0]) });
  } catch (error) {
    console.error("Erro ao buscar produto:", error);
    return res.status(500).json({ erro: "Erro interno ao buscar o produto." });
  }
}
