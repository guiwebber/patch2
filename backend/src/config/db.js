import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

pool.connect()
  .then(() => console.log("✅ Banco conectado"))
  .catch((err) => console.error("❌ Erro ao conectar:", err));

export default pool;