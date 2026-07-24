import {
  cotarFreteSuperFrete,
} from "../services/superFreteService.js";

export async function cotarFrete(
  req,
  res,
) {
  try {
    const {
      cepDestino,
      itens,
    } = req.body;

    const opcoes =
      await cotarFreteSuperFrete({
        cepDestino,
        itens,
      });

    if (opcoes.length === 0) {
      return res.status(404).json({
        erro:
          "Nenhuma opção de frete foi encontrada para esse endereço.",
      });
    }

    return res.json({
      opcoes,
    });
  } catch (error) {
    console.error(
      "Erro ao calcular frete:",
      error,
    );

    return res.status(400).json({
      erro:
        error instanceof Error
          ? error.message
          : "Não foi possível calcular o frete.",
    });
  }
}
