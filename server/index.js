import dotenv from "dotenv";
import cors from "cors";
import express from "express";
import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { checkDatabase, pool } from "./db/pool.js";

dotenv.config({ path: ".env.local" });
dotenv.config();

const app = express();
const port = Number(process.env.PORT || 4000);
const allowedOrigin = process.env.CLIENT_ORIGIN || "http://127.0.0.1:5173";
const currentDir = dirname(fileURLToPath(import.meta.url));
const distPath = resolve(currentDir, "../dist");
const indexPath = resolve(distPath, "index.html");

app.use(cors({ origin: allowedOrigin }));
app.use(express.json({ limit: "1mb" }));

app.get("/api/health", async (_request, response) => {
  try {
    const database = await checkDatabase();

    response.json({
      ok: true,
      service: "bbvixon-api",
      database,
    });
  } catch (error) {
    response.status(500).json({
      ok: false,
      service: "bbvixon-api",
      database: {
        ok: false,
        configured: true,
        message: error instanceof Error ? error.message : "Database check failed.",
      },
    });
  }
});

app.post("/api/contact", async (request, response) => {
  const name = String(request.body?.name ?? "").trim();
  const email = String(request.body?.email ?? "").trim();
  const subject = String(request.body?.subject ?? "").trim();
  const message = String(request.body?.message ?? "").trim();

  if (!name || !email || !message) {
    response.status(400).json({ ok: false, message: "Name, email, and message are required." });
    return;
  }

  if (!/^\S+@\S+\.\S+$/.test(email)) {
    response.status(400).json({ ok: false, message: "Please enter a valid email address." });
    return;
  }

  if (!process.env.DATABASE_URL) {
    response.status(503).json({ ok: false, message: "Database is not configured yet." });
    return;
  }

  try {
    await pool.query(
      `insert into contact_messages (name, email, subject, message, source)
       values ($1, $2, $3, $4, $5)`,
      [name, email, subject || null, message, "portfolio"],
    );

    response.status(201).json({ ok: true, message: "Message saved. Basil can follow up from the database." });
  } catch (error) {
    response.status(500).json({
      ok: false,
      message: error instanceof Error ? error.message : "Could not save contact message.",
    });
  }
});

app.use("/api", (_request, response) => {
  response.status(404).json({ ok: false, message: "API route not found." });
});

if (existsSync(indexPath)) {
  app.use(express.static(distPath));
  app.get(/.*/, (_request, response) => {
    response.sendFile(indexPath);
  });
}

app.listen(port, () => {
  console.log(`BB VIXON API running on http://localhost:${port}`);
});
