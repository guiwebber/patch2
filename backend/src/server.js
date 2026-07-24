import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

import pool from "./config/db.js";
import adminRoutes from "./routes/adminRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import profileRoutes from "./routes/profileRoutes.js";
import webhookRoutes from "./routes/webhookRoutes.js";

const app = express();

const PORT =
  process.env.PORT || 3001;

const origensPermitidas = [
  "http://localhost:5173",
  "https://patch2-lilac.vercel.app",
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      if (
        !origin ||
        origensPermitidas.includes(
          origin,
        )
      ) {
        callback(null, true);
        return;
      }

      console.error(
        `CORS bloqueou a origem: ${origin}`,
      );

      callback(
        new Error(
          "Origem não permitida.",
        ),
      );
    },

    methods: [
      "GET",
      "POST",
      "PUT",
      "PATCH",
      "DELETE",
      "OPTIONS",
    ],

    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-Requested-With",
    ],
  }),
);

app.use(express.json());

app.use((req, res, next) => {
  console.log(
    `[REQUISIÇÃO] ${req.method} ${req.originalUrl}`,
  );

  next();
});

app.get("/", (req, res) => {
  return res.json({
    mensagem:
      "API PatchWork funcionando.",
  });
});

app.get(
  "/teste-banco",
  async (req, res) => {
    try {
      const result =
        await pool.query(
          "SELECT NOW()",
        );

      return res.json({
        ok: true,
        horario:
          result.rows[0].now,
      });
    } catch (error) {
      console.error(
        "Erro ao testar banco:",
        error,
      );

      return res.status(500).json({
        ok: false,
        erro:
          error instanceof Error
            ? error.message
            : "Erro desconhecido.",
      });
    }
  },
);

/*
 * O webhook não usa o JWT do cliente.
 */
app.use(webhookRoutes);

app.use(authRoutes);
app.use(profileRoutes);
app.use(paymentRoutes);
app.use(orderRoutes);
app.use(adminRoutes);

app.use((req, res) => {
  return res.status(404).json({
    erro:
      "Rota não encontrada.",
  });
});

app.listen(
  PORT,
  "0.0.0.0",
  () => {
    console.log(
      `Servidor rodando na porta ${PORT}`,
    );
  },
);
