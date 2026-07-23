import { Router } from "express";

import {
  alterarSenha,
  atualizarPerfil,
  buscarPerfil,
} from "../controllers/profileController.js";

import {
  atualizarEndereco,
  criarEndereco,
  excluirEndereco,
  listarEnderecos,
} from "../controllers/addressController.js";

import { autenticarUsuario } from "../middlewares/authMiddleware.js";

const profileRoutes = Router();

profileRoutes.use(autenticarUsuario);

profileRoutes.get("/perfil", buscarPerfil);
profileRoutes.patch("/perfil", atualizarPerfil);
profileRoutes.patch("/perfil/senha", alterarSenha);

profileRoutes.get("/enderecos", listarEnderecos);
profileRoutes.post("/enderecos", criarEndereco);
profileRoutes.put("/enderecos/:id", atualizarEndereco);
profileRoutes.delete("/enderecos/:id", excluirEndereco);

export default profileRoutes;
