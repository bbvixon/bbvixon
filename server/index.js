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
const getAiEndpoint = () => {
  const rawEndpoint = process.env.LOCAL_AI_BASE_URL || process.env.HOSTED_AI_ENDPOINT || "";
  const trimmedEndpoint = rawEndpoint.trim().replace(/\/$/, "");

  if (!trimmedEndpoint) {
    return "";
  }

  if (trimmedEndpoint.endsWith("/chat/completions") || trimmedEndpoint.endsWith("/api/chat")) {
    return trimmedEndpoint;
  }

  if (trimmedEndpoint.endsWith("/v1")) {
    return `${trimmedEndpoint}/chat/completions`;
  }

  return `${trimmedEndpoint}/v1/chat/completions`;
};

const getAiReply = (data) =>
  data?.choices?.[0]?.message?.content ||
  data?.choices?.[0]?.text ||
  data?.message?.content ||
  data?.response ||
  "";

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


app.post("/api/ai", async (request, response) => {
  const question = String(request.body?.question ?? "").trim();
  const messages = Array.isArray(request.body?.messages) ? request.body.messages : [];
  const systemPrompt = String(request.body?.systemPrompt ?? "").trim();
  const model = process.env.LOCAL_AI_MODEL || process.env.HOSTED_AI_MODEL || process.env.VITE_LOCAL_AI_MODEL || "qwen2.5-coder-3b-instruct";
  const endpoint = getAiEndpoint();

  if (!question) {
    response.status(400).json({ ok: false, message: "Question is required." });
    return;
  }

  if (!endpoint) {
    response.status(503).json({ ok: false, message: "AI endpoint is not configured." });
    return;
  }

  const payloadMessages = [
    ...(systemPrompt ? [{ role: "system", content: systemPrompt }] : []),
    ...messages
      .slice(-6)
      .filter((message) => message && typeof message.text === "string")
      .map((message) => ({
        role: message.role === "assistant" ? "assistant" : "user",
        content: message.text,
      })),
    { role: "user", content: question },
  ];

  try {
    const aiResponse = await fetch(endpoint, {
      body: JSON.stringify({
        model,
        stream: false,
        messages: payloadMessages,
      }),
      headers: {
        "Content-Type": "application/json",
        ...(process.env.HOSTED_AI_API_KEY ? { Authorization: `Bearer ${process.env.HOSTED_AI_API_KEY}` } : {}),
      },
      method: "POST",
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      throw new Error(errorText || `AI endpoint returned ${aiResponse.status}`);
    }

    const data = await aiResponse.json();
    const answer = getAiReply(data).trim();

    if (!answer) {
      throw new Error("AI endpoint returned an empty answer.");
    }

    if (process.env.DATABASE_URL) {
      void pool.query(
        `insert into assistant_logs (question, answer, model, source)
         values ($1, $2, $3, $4)`,
        [question, answer, model, "portfolio-ai"],
      ).catch((error) => {
        console.error("Could not save assistant log:", error);
      });
    }

    response.json({ ok: true, answer, model });
  } catch (error) {
    response.status(502).json({
      ok: false,
      message: error instanceof Error ? error.message : "AI endpoint failed.",
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

