import { Router } from "express";

import {
  mercadoPagoWebhook,
} from "../controllers/webhookController.js";

const webhookRoutes = Router();

webhookRoutes.post(
  "/webhooks/mercado-pago",
  mercadoPagoWebhook,
);

export default webhookRoutes;
