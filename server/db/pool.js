import dotenv from "dotenv";
import pg from "pg";

dotenv.config({ path: ".env.local" });
dotenv.config();

const { Pool } = pg;

const connectionString = process.env.DATABASE_URL;

export const pool = new Pool({
  connectionString,
  ssl: process.env.DATABASE_SSL === "true" ? { rejectUnauthorized: false } : false,
});

export async function checkDatabase() {
  if (!connectionString) {
    return {
      ok: false,
      configured: false,
      message: "DATABASE_URL is not configured yet.",
    };
  }

  const result = await pool.query("select now() as checked_at");

  return {
    ok: true,
    configured: true,
    checkedAt: result.rows[0]?.checked_at,
  };
}
