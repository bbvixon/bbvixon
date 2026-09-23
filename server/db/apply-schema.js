import dotenv from "dotenv";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { pool } from "./pool.js";

dotenv.config({ path: ".env.local" });
dotenv.config();

const currentDir = dirname(fileURLToPath(import.meta.url));
const schemaPath = resolve(currentDir, "../schema.sql");

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is not configured. Add it to .env.local or your deployment environment first.");
  process.exit(1);
}

try {
  const schema = await readFile(schemaPath, "utf8");
  await pool.query(schema);
  console.log("Database schema applied successfully.");
} catch (error) {
  console.error(error instanceof Error ? error.message : "Could not apply database schema.");
  process.exitCode = 1;
} finally {
  await pool.end();
}
