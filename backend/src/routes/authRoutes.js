import { Router } from "express";

import {
  buscarUsuarioLogado,
  cadastrarCliente,
  loginCliente,
  loginGoogle,
} from "../controllers/authController.js";

import { autenticarUsuario } from "../middlewares/authMiddleware.js";

const authRoutes = Router();

authRoutes.post("/clientes", cadastrarCliente);
authRoutes.post("/login", loginCliente);
authRoutes.post("/login/google", loginGoogle);

authRoutes.get(
  "/usuario/me",
  autenticarUsuario,
  buscarUsuarioLogado,
);

export default authRoutes;