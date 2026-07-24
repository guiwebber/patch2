import {
  Router,
} from "express";

import {
  criarPagamentoCartao,
  criarPix,
} from "../controllers/paymentController.js";
import {
  autenticarUsuario,
} from "../middlewares/authMiddleware.js";

const paymentRoutes =
  Router();

paymentRoutes.use(
  autenticarUsuario,
);

paymentRoutes.post(
  "/pagamentos/pix",
  criarPix,
);

paymentRoutes.post(
  "/pagamentos/cartao",
  criarPagamentoCartao,
);

export default paymentRoutes;
