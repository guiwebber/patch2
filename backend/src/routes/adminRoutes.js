import {
  Router,
} from "express";

import {
  atualizarStatusPedidoAdmin,
  buscarResumoAdmin,
  listarPedidosAdmin,
} from "../controllers/adminController.js";
import {
  autorizarAdministrador,
} from "../middlewares/adminMiddleware.js";
import {
  autenticarUsuario,
} from "../middlewares/authMiddleware.js";

const adminRoutes = Router();

adminRoutes.use(
  autenticarUsuario,
  autorizarAdministrador,
);

adminRoutes.get(
  "/admin/resumo",
  buscarResumoAdmin,
);

adminRoutes.get(
  "/admin/pedidos",
  listarPedidosAdmin,
);

adminRoutes.patch(
  "/admin/pedidos/:id/status",
  atualizarStatusPedidoAdmin,
);

export default adminRoutes;
