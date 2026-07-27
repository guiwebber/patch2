import { Router } from "express";
import {
  buscarProdutoPorId,
  listarProdutos,
} from "../controllers/productController.js";

const productRoutes = Router();

productRoutes.get("/produtos", listarProdutos);
productRoutes.get("/produtos/:id", buscarProdutoPorId);

export default productRoutes;
