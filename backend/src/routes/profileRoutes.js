import {
  Router,
} from "express";

import {
  atualizarEndereco,
  criarEndereco,
  excluirEndereco,
  listarEnderecos,
} from "../controllers/addressController.js";

import {
  buscarPerfil,
  atualizarPerfil,
  alterarSenha,
} from "../controllers/profileController.js";

import {
  autenticarUsuario,
} from "../middlewares/authMiddleware.js";

const profileRoutes =
  Router();

/*
 * Todas as rotas abaixo precisam
 * de um usuário autenticado.
 */
profileRoutes.use(
  autenticarUsuario,
);

/*
 * Perfil
 */
profileRoutes.get(
  "/perfil",
  buscarPerfil,
);

profileRoutes.put(
  "/perfil",
  atualizarPerfil,
);

profileRoutes.put(
  "/perfil/senha",
  alterarSenha,
);

/*
 * Endereços
 */
profileRoutes.get(
  "/enderecos",
  listarEnderecos,
);

profileRoutes.post(
  "/enderecos",
  criarEndereco,
);

profileRoutes.put(
  "/enderecos/:id",
  atualizarEndereco,
);

profileRoutes.delete(
  "/enderecos/:id",
  excluirEndereco,
);

export default profileRoutes;