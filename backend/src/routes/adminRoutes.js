import {
  Router,
} from "express";

import {
  atualizarStatusPedidoAdmin,
  buscarResumoAdmin,
  listarPedidosAdmin,
} from "../controllers/adminController.js";
import {
  alterarAtivoProdutoAdmin,
  atualizarProdutoAdmin,
  criarProdutoAdmin,
  excluirProdutoAdmin,
  listarProdutosAdmin,
  uploadImagensProdutoAdmin,
} from "../controllers/adminProductController.js";
import {
  autorizarAdministrador,
} from "../middlewares/adminMiddleware.js";
import {
  autenticarUsuario,
} from "../middlewares/authMiddleware.js";
import {
  receberImagensProduto,
} from "../middlewares/productImageUploadMiddleware.js";

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

adminRoutes.post(
  "/admin/produtos/imagens",
  receberImagensProduto,
  uploadImagensProdutoAdmin,
);

adminRoutes.get("/admin/produtos", listarProdutosAdmin);
adminRoutes.post("/admin/produtos", criarProdutoAdmin);
adminRoutes.put("/admin/produtos/:id", atualizarProdutoAdmin);
adminRoutes.patch("/admin/produtos/:id/ativo", alterarAtivoProdutoAdmin);
adminRoutes.delete("/admin/produtos/:id", excluirProdutoAdmin);

export default adminRoutes;
