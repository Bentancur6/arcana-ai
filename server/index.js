import express from "express";
import cors from "cors";
import crypto from "crypto";
import { readFileSync, writeFileSync, existsSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import mongoose from "mongoose";
import "dotenv/config";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_FILE = join(__dirname, "data.json");
const DIST_DIR = join(__dirname, "../dist");

// ── MongoDB 数据层（有MONGODB_URI时使用，否则降级到本地文件）───────────────
const useMongo = !!process.env.MONGODB_URI;

let ClientModel = null;
if (useMongo) {
  mongoose.connect(process.env.MONGODB_URI, { dbName: "tarot" })
    .then(() => console.log("✅ MongoDB 已连接"))
    .catch(e => console.error("❌ MongoDB 连接失败：", e.message));

  const clientSchema = new mongoose.Schema({
    id: String, name: String, note: String,
    sessions: { type: mongoose.Schema.Types.Mixed, default: [] }
  }, { strict: false });
  ClientModel = mongoose.model("Client", clientSchema);
}

async function readClients() {
  if (useMongo) {
    const docs = await ClientModel.find({}, { _id: 0, __v: 0 }).lean();
    return docs;
  }
  if (!existsSync(DATA_FILE)) return [];
  try { return JSON.parse(readFileSync(DATA_FILE, "utf-8")); } catch { return []; }
}

async function writeClients(data) {
  if (useMongo) {
    await ClientModel.deleteMany({});
    if (data.length > 0) await ClientModel.insertMany(data);
    return;
  }
  writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), "utf-8");
}


const app = express();
app.use(cors());
app.use(express.json({ limit: "10mb" }));

// ── Auth ────────────────────────────────────────────────────────────────────
// 如果环境变量没有设置 ADMIN_PASSWORD，则不启用鉴权（本地开发照常用）
// 部署时在 Zeabur/Render 的环境变量里加 ADMIN_PASSWORD 即可开启

function getSessionToken() {
  const pass = process.env.ADMIN_PASSWORD;
  if (!pass) return null;
  return crypto.createHmac("sha256", pass).update("tarot-session-v1").digest("hex");
}

function requireAuth(req, res, next) {
  const token = getSessionToken();
  if (!token) return next(); // 未配置密码，跳过鉴权
  const auth = req.headers.authorization || "";
  const provided = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  if (provided !== token) {
    return res.status(401).json({ error: "未授权，请先登录" });
  }
  next();
}

app.post("/api/login", (req, res) => {
  const { password } = req.body;
  const token = getSessionToken();
  if (!token) return res.json({ ok: true, token: "no-auth" }); // 无需鉴权
  if (password !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ error: "密码错误" });
  }
  res.json({ ok: true, token });
});

app.get("/api/test", async (_req, res) => {
  try {
    const r = await fetch("https://huskyapi.com");
    res.json({ ok: r.ok, status: r.status });
  } catch (e) {
    res.json({ error: e.message });
  }
});

app.get("/api/clients", requireAuth, async (_req, res) => {
  res.json(await readClients());
});

app.post("/api/clients", requireAuth, async (req, res) => {
  await writeClients(req.body);
  res.json({ ok: true });
});

// 导出备份
app.get("/api/export", requireAuth, async (_req, res) => {
  const data = await readClients();
  res.setHeader("Content-Disposition", "attachment; filename=tarot-backup.json");
  res.setHeader("Content-Type", "application/json");
  res.json(data);
});

// 导入数据（覆盖现有数据）
app.post("/api/import", requireAuth, async (req, res) => {
  try {
    const data = req.body;
    if (!Array.isArray(data)) return res.status(400).json({ error: "格式错误，需要JSON数组" });
    await writeClients(data);
    res.json({ ok: true, count: data.length });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// 访客公开端点（不需要登录）
app.post("/api/generate-public", async (req, res) => {
  return generateHandler(req, res);
});

app.post("/api/generate", requireAuth, async (req, res) => {
  return generateHandler(req, res);
});

async function generateHandler(req, res) {
  const { prompt, systemPrompt, userPrompt } = req.body;
  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(500).json({ error: "未配置 ANTHROPIC_API_KEY，请在 .env 文件中填写" });
  }

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  try {
    console.log("📡 正在请求 huskyapi...");
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 120000);

    // 构建请求体：优先使用新格式（systemPrompt + userPrompt），兼容旧格式（prompt）
    const requestBody = {
      model: "claude-haiku-4-5-20251001",
      max_tokens: 8000,
      stream: true,
    };

    if (systemPrompt && userPrompt) {
      // 新格式：拆分提示词
      requestBody.system = [{
        type: "text",
        text: systemPrompt,
        cache_control: { type: "ephemeral" }
      }];
      requestBody.messages = [{ role: "user", content: userPrompt }];
      console.log("✨ 使用拆分提示词模式，系统提示词长度：", systemPrompt.length);
    } else if (prompt) {
      // 旧格式：兼容
      requestBody.messages = [{ role: "user", content: prompt }];
      console.log("⚠️ 使用旧版单一提示词模式");
    } else {
      return res.status(400).json({ error: "缺少提示词参数" });
    }

    const apiBase = process.env.API_BASE_URL || "https://huskyapi.com";
    const upstream = await fetch(`${apiBase}/v1/messages`, {
      signal: controller.signal,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.ANTHROPIC_API_KEY}`,
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "anthropic-beta": "prompt-caching-2024-07-31",
      },
      body: JSON.stringify(requestBody),
    });
    clearTimeout(timer);
    console.log("✅ 收到响应，状态码：", upstream.status);

    if (!upstream.ok) {
      const err = await upstream.text();
      console.error("❌ API 返回错误：", upstream.status, err);
      res.write(`data: ${JSON.stringify({ error: err })}\n\n`);
      return res.end();
    }

    const reader = upstream.body.getReader();
    const decoder = new TextDecoder();
    let sseBuffer = "";
    let chunkCount = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) { console.log(`📬 流结束，共 ${chunkCount} 个数据块`); break; }
      chunkCount++;
      sseBuffer += decoder.decode(value, { stream: true });
      const lines = sseBuffer.split("\n");
      sseBuffer = lines.pop(); // 保留未结束的行

      for (const line of lines) {
        // 非 data 行（空行、event:行）原样转发，保持 SSE 结构
        if (!line.startsWith("data: ")) {
          res.write(line + "\n");
          continue;
        }
        const raw = line.slice(6).trim();
        if (raw === "[DONE]") { res.write(line + "\n"); continue; }
        try {
          const j = JSON.parse(raw);
          // 过滤掉 thinking_delta，不转发给前端
          if (j.type === "content_block_delta" && j.delta?.type === "thinking_delta") {
            continue;
          }
          // 过滤掉 thinking 类型的 content_block_start/stop
          if (
            (j.type === "content_block_start" && j.content_block?.type === "thinking") ||
            (j.type === "content_block_stop" && j.content_block?.type === "thinking")
          ) {
            continue;
          }
          if (chunkCount <= 2) console.log(`📦 第${chunkCount}行：`, raw.slice(0, 200));
          // 硬性过滤：清除AI输出中的破折号、星号等不符合口语习惯的符号
          let filtered = raw;
          try {
            const obj = JSON.parse(raw);
            if (obj.type === "content_block_delta" && obj.delta?.type === "text_delta" && obj.delta?.text) {
              let t = obj.delta.text;
              t = t.replace(/——|──|—/g, "，");   // 破折号 → 逗号
              t = t.replace(/\*/g, "");            // 所有星号
              t = t.replace(/=/g, "");             // 等号
              t = t.replace(/#/g, "");             // 所有井号
              t = t.replace(/^-{2,}\s*$/gm, "");  // --- 分割线
              t = t.replace(/^={2,}\s*$/gm, "");  // === 分割线
              t = t.replace(/[═─│｜◆★☆▶▷]{2,}/g, ""); // 装饰符号
              obj.delta.text = t;
              filtered = JSON.stringify(obj);
            }
          } catch {}
          res.write(`data: ${filtered}\n`);
        } catch {
          // JSON 解析失败则原样转发（防止意外丢数据）
          res.write(line + "\n");
        }
      }
    }
  } catch (e) {
    console.error("❌ 请求异常：", e.message);
    res.write(`data: ${JSON.stringify({ error: e.message })}\n\n`);
  }
  res.end();
}

// Serve built frontend in production
if (existsSync(DIST_DIR)) {
  app.use(express.static(DIST_DIR));
  app.get("*", (_req, res) => res.sendFile(join(DIST_DIR, "index.html")));
}

const PORT = process.env.PORT || 3001;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`塔罗工作台运行中：http://localhost:${PORT}`);
  console.log(`局域网访问（手机端）：查看你的电脑 IP，用 http://[电脑IP]:${PORT} 访问`);
});
