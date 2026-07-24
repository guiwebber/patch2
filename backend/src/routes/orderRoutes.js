import { Router } from "express";

import {
  buscarPedido,
  listarPedidos,
} from "../controllers/orderController.js";
import {
  autenticarUsuario,
} from "../middlewares/authMiddleware.js";

const orderRoutes = Router();

orderRoutes.use(autenticarUsuario);

orderRoutes.get(
  "/pedidos",
  listarPedidos,
);

orderRoutes.get(
  "/pedidos/:id",
  buscarPedido,
);

export default orderRoutes;
