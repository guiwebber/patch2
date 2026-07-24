import {
  Router,
} from "express";

import {
  cotarFrete,
} from "../controllers/shippingController.js";
import {
  autenticarUsuario,
} from "../middlewares/authMiddleware.js";

const shippingRoutes = Router();

shippingRoutes.use(
  autenticarUsuario,
);

shippingRoutes.post(
  "/fretes/cotacao",
  cotarFrete,
);

export default shippingRoutes;
