import dotenv from "dotenv";
import cors from "cors";
import express from "express";
import { timingSafeEqual } from "node:crypto";
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

const readCmsKey = (request) => {
  const authorization = String(request.headers.authorization ?? "");
  return authorization.startsWith("Bearer ") ? authorization.slice(7).trim() : "";
};

const requireCmsAdmin = (request, response, next) => {
  const configuredKey = String(process.env.CMS_ADMIN_KEY ?? "");
  const suppliedKey = readCmsKey(request);

  if (!configuredKey) {
    response.status(503).json({ ok: false, message: "CMS_ADMIN_KEY is not configured." });
    return;
  }

  const configuredBuffer = Buffer.from(configuredKey);
  const suppliedBuffer = Buffer.from(suppliedKey);
  const authorized =
    configuredBuffer.length === suppliedBuffer.length &&
    timingSafeEqual(configuredBuffer, suppliedBuffer);

  if (!authorized) {
    response.status(401).json({ ok: false, message: "Invalid CMS admin key." });
    return;
  }

  next();
};

const mapStoryRow = (row) => ({
  slug: row.slug,
  title: row.title,
  role: row.role,
  summary: row.summary,
  outcome: row.outcome,
  tags: row.tags ?? [],
  thumbnailUrl: row.thumbnail_url ?? undefined,
  documentUrl: row.document_url ?? undefined,
  redesignDocumentUrl: row.redesign_document_url ?? undefined,
  figmaUrl: row.figma_url ?? undefined,
  pageImages: row.page_images ?? [],
  sections: row.sections ?? [],
  status: row.status,
  published: row.published,
  sortOrder: row.sort_order,
  updatedAt: row.updated_at,
});

const mapAppRow = (row) => ({
  slug: row.slug,
  title: row.title,
  tagline: row.tagline,
  description: row.description,
  url: row.url,
  iconUrl: row.icon_url,
  category: row.category,
  platform: row.platform,
  published: row.published,
  sortOrder: row.sort_order,
  updatedAt: row.updated_at,
});

const optionalText = (value) => {
  const text = String(value ?? "").trim();
  return text || null;
};

const isHttpUrl = (value) => {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "https:" || parsed.protocol === "http:";
  } catch {
    return false;
  }
};

const normalizeStorySections = (value) => {
  if (!Array.isArray(value)) return [];

  return value.slice(0, 40).map((section) => ({
    eyebrow: String(section?.eyebrow ?? "").trim().slice(0, 120),
    title: String(section?.title ?? "Untitled section").trim().slice(0, 200) || "Untitled section",
    body: String(section?.body ?? "").trim().slice(0, 20000),
    imageUrl: String(section?.imageUrl ?? "").trim().slice(0, 2000),
    imageAlt: String(section?.imageAlt ?? "").trim().slice(0, 300),
  }));
};

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

app.get("/api/design-stories", async (_request, response) => {
  response.set("Cache-Control", "no-store");

  if (!process.env.DATABASE_URL) {
    response.json({ ok: true, stories: [] });
    return;
  }

  try {
    const result = await pool.query(
      "select * from design_stories order by sort_order asc, updated_at desc",
    );
    response.json({
      ok: true,
      stories: result.rows.filter((row) => row.published).map(mapStoryRow),
      hiddenSlugs: result.rows.filter((row) => !row.published).map((row) => row.slug),
    });
  } catch (error) {
    response.status(500).json({
      ok: false,
      message: error instanceof Error ? error.message : "Could not load design stories.",
    });
  }
});

app.get("/api/admin/design-stories", requireCmsAdmin, async (_request, response) => {
  response.set("Cache-Control", "no-store");

  try {
    const result = await pool.query(
      "select * from design_stories order by sort_order asc, updated_at desc",
    );
    response.json({ ok: true, stories: result.rows.map(mapStoryRow) });
  } catch (error) {
    response.status(500).json({
      ok: false,
      message: error instanceof Error ? error.message : "Could not load CMS stories.",
    });
  }
});

app.put("/api/admin/design-stories/:slug", requireCmsAdmin, async (request, response) => {
  const slug = String(request.params.slug ?? "").trim().toLowerCase();
  const body = request.body ?? {};

  if (!/^[a-z0-9]+(?:[.-][a-z0-9]+)*$/.test(slug)) {
    response.status(400).json({ ok: false, message: "Use a lowercase URL slug." });
    return;
  }

  const title = String(body.title ?? "").trim();
  const role = String(body.role ?? "").trim();
  const summary = String(body.summary ?? "").trim();
  const outcome = String(body.outcome ?? "").trim();
  const tags = Array.isArray(body.tags) ? body.tags.map(String).map((item) => item.trim()).filter(Boolean).slice(0, 12) : [];
  const pageImages = Array.isArray(body.pageImages) ? body.pageImages.map(String).map((item) => item.trim()).filter(Boolean).slice(0, 60) : [];
  const sections = normalizeStorySections(body.sections);
  const status = body.status === "placeholder" ? "placeholder" : "ready";
  const published = body.published !== false;
  const sortOrder = Number.isFinite(Number(body.sortOrder)) ? Math.trunc(Number(body.sortOrder)) : 0;

  if (!title || !summary) {
    response.status(400).json({ ok: false, message: "Title and summary are required." });
    return;
  }

  try {
    const result = await pool.query(
      `insert into design_stories (
         slug, title, role, summary, outcome, tags, thumbnail_url, document_url,
         redesign_document_url, figma_url, page_images, sections, status, published,
         sort_order, updated_at
       ) values ($1, $2, $3, $4, $5, $6::jsonb, $7, $8, $9, $10, $11::jsonb,
         $12::jsonb, $13, $14, $15, now())
       on conflict (slug) do update set
         title = excluded.title,
         role = excluded.role,
         summary = excluded.summary,
         outcome = excluded.outcome,
         tags = excluded.tags,
         thumbnail_url = excluded.thumbnail_url,
         document_url = excluded.document_url,
         redesign_document_url = excluded.redesign_document_url,
         figma_url = excluded.figma_url,
         page_images = excluded.page_images,
         sections = excluded.sections,
         status = excluded.status,
         published = excluded.published,
         sort_order = excluded.sort_order,
         updated_at = now()
       returning *`,
      [
        slug, title, role, summary, outcome, JSON.stringify(tags),
        optionalText(body.thumbnailUrl), optionalText(body.documentUrl),
        optionalText(body.redesignDocumentUrl), optionalText(body.figmaUrl),
        JSON.stringify(pageImages), JSON.stringify(sections), status, published, sortOrder,
      ],
    );
    response.json({ ok: true, story: mapStoryRow(result.rows[0]) });
  } catch (error) {
    response.status(500).json({
      ok: false,
      message: error instanceof Error ? error.message : "Could not save design story.",
    });
  }
});

app.get("/api/apps", async (_request, response) => {
  response.set("Cache-Control", "no-store");

  if (!process.env.DATABASE_URL) {
    response.json({ ok: true, apps: [] });
    return;
  }

  try {
    const result = await pool.query(
      "select * from portfolio_apps order by sort_order asc, updated_at desc",
    );
    response.json({
      ok: true,
      apps: result.rows.filter((row) => row.published).map(mapAppRow),
      hiddenSlugs: result.rows.filter((row) => !row.published).map((row) => row.slug),
    });
  } catch (error) {
    response.status(500).json({
      ok: false,
      message: error instanceof Error ? error.message : "Could not load apps.",
    });
  }
});

app.get("/api/admin/apps", requireCmsAdmin, async (_request, response) => {
  response.set("Cache-Control", "no-store");

  try {
    const result = await pool.query(
      "select * from portfolio_apps order by sort_order asc, updated_at desc",
    );
    response.json({ ok: true, apps: result.rows.map(mapAppRow) });
  } catch (error) {
    response.status(500).json({
      ok: false,
      message: error instanceof Error ? error.message : "Could not load CMS apps.",
    });
  }
});

app.put("/api/admin/apps/:slug", requireCmsAdmin, async (request, response) => {
  const slug = String(request.params.slug ?? "").trim().toLowerCase();
  const body = request.body ?? {};

  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    response.status(400).json({ ok: false, message: "Use a lowercase URL slug." });
    return;
  }

  const title = String(body.title ?? "").trim().slice(0, 160);
  const tagline = String(body.tagline ?? "").trim().slice(0, 240);
  const description = String(body.description ?? "").trim().slice(0, 2000);
  const url = String(body.url ?? "").trim().slice(0, 2000);
  const iconUrl = String(body.iconUrl ?? "").trim().slice(0, 2000);
  const category = String(body.category ?? "").trim().slice(0, 120);
  const platform = String(body.platform ?? "").trim().slice(0, 120);
  const published = body.published !== false;
  const sortOrder = Number.isFinite(Number(body.sortOrder)) ? Math.trunc(Number(body.sortOrder)) : 0;

  if (!title || !tagline || !description || !url) {
    response.status(400).json({ ok: false, message: "Title, tagline, description, and app URL are required." });
    return;
  }

  if (!isHttpUrl(url) || (iconUrl && !iconUrl.startsWith("/") && !isHttpUrl(iconUrl))) {
    response.status(400).json({ ok: false, message: "Use a valid HTTP(S) app URL and icon URL." });
    return;
  }

  try {
    const result = await pool.query(
      `insert into portfolio_apps (
         slug, title, tagline, description, url, icon_url, category, platform,
         published, sort_order, updated_at
       ) values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, now())
       on conflict (slug) do update set
         title = excluded.title,
         tagline = excluded.tagline,
         description = excluded.description,
         url = excluded.url,
         icon_url = excluded.icon_url,
         category = excluded.category,
         platform = excluded.platform,
         published = excluded.published,
         sort_order = excluded.sort_order,
         updated_at = now()
       returning *`,
      [slug, title, tagline, description, url, iconUrl, category, platform, published, sortOrder],
    );
    response.json({ ok: true, app: mapAppRow(result.rows[0]) });
  } catch (error) {
    response.status(500).json({
      ok: false,
      message: error instanceof Error ? error.message : "Could not save app.",
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

