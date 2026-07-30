<div align="center">
  <h1>🔮 Arcana AI</h1>
  <p><strong>AI-Powered Professional Tarot Reading Platform</strong></p>
  <p>专业塔罗解读 SaaS 平台 · AI 流式生成 · 13 种牌阵</p>
  <a href="https://tarot-assistant-z8gs.onrender.com/">
    <img src="https://img.shields.io/badge/Live%20Demo-Online-brightgreen?style=for-the-badge" />
  </a>
  <br/><br/>
  <img src="https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react" />
  <img src="https://img.shields.io/badge/Node.js-24-339933?style=flat-square&logo=node.js" />
  <img src="https://img.shields.io/badge/Vite-5-646CFF?style=flat-square&logo=vite" />
  <img src="https://img.shields.io/badge/License-AGPL%20v3-blue?style=flat-square" />
</div>

---

## ✨ Features · 功能亮点

| Feature | 说明 |
|---------|------|
| 🃏 **13 Spread Types** | 13 种牌阵（凯尔特十字、双选项抉择、质点牌阵等），每种牌阵有独立的 CSS Grid 精确布局 |
| ⚡ **SSE Streaming** | 基于 Server-Sent Events 的 AI 实时流式输出，每张牌解读不低于 300 字 |
| 🎴 **Virtual Card Draw** | 虚拟抽牌动画系统：牌堆飞牌 + 逐张翻转，78 张 WebP 塔罗牌图 |
| 🏗️ **Dual-Mode SaaS** | 访客端（公开）与管理端（鉴权隔离）双模式架构，支持多客户数据管理 |
| 🔒 **HMAC Auth** | 管理端采用 HMAC token 鉴权，访客端仅用 localStorage |
| 📤 **Data Export / Import** | 客户数据 JSON 导出 / 导入，Bearer token 鉴权 API |
| 🚫 **Symbol Filtering** | SSE 输出层实时过滤 Markdown 符号（`*` `#` `=` `——`），保证纯文本解读风格 |

---

## 🛠️ Tech Stack · 技术栈

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite 5, CSS Variables, CSS Grid |
| Backend | Node.js 24, Express.js |
| AI | Claude-compatible API, SSE streaming |
| Auth | HMAC token (admin), localStorage (visitor) |
| Deploy | Render — auto-deploy from GitHub main |

---

## 🏛️ Architecture · 架构说明

```
Browser
  ├── / (Visitor Mode)       Public tarot reading interface
  │     ├── Virtual Draw     Animation system, 78-card WebP deck
  │     ├── Spread Layout    CSS Grid positioning per spread type
  │     └── AI Stream        SSE consumer with real-time symbol filter
  │
  └── /admin (Admin Mode)    HMAC-authenticated management dashboard
        ├── Client CRUD      Inline category & note editing
        ├── Session History  Reading records per client
        └── Data Backup      JSON export / import with Bearer auth

Server (Express.js)
  ├── POST /api/tarot         Proxy to Claude API → SSE stream to browser
  ├── GET  /api/admin/*       Data APIs (HMAC protected)
  └── Static                 Serves Vite build output
```

**Key decisions · 设计亮点**

- **Single-file React (~1600 lines)**: all logic co-located, easy to audit end-to-end without jumping between files.
- **SSE over WebSocket**: AI output is unidirectional — no bidirectional overhead needed.
- **Data-driven spread system**: each spread defines `gridItems` as `[row, col, cardIndex]` tuples — adding a new spread type requires zero new component logic.
- **Stream-layer symbol filter**: Markdown artifacts (`*`, `#`, `=`, `——`) are stripped in the SSE proxy before reaching the client.

---

## 🚀 Getting Started · 本地运行

### Prerequisites · 环境要求
- Node.js 24+
- A Claude-compatible API key

### Setup

```bash
git clone https://github.com/Bentancur6/arcana-ai.git
cd arcana-ai
npm install
```

### Environment Variables · 环境变量

Create `server/.env` (template in `server/.env.example`):

```env
API_KEY=your_claude_api_key
API_BASE_URL=https://api.anthropic.com
ADMIN_PASSWORD=your_chosen_admin_password
PORT=3000
```

### Run · 启动

```bash
npm run dev           # starts Express + Vite concurrently (dev)
npm run build         # build frontend
npm start             # production (Express serves dist/)
```

Open `http://localhost:5173`

---

## 📁 Project Structure · 项目结构

```
arcana-ai/
├── src/
│   ├── App.jsx          # Full React app — routing, spreads, animation, admin (~1600 lines)
│   └── tarotPrompt.js   # AI system prompt & density rules (300 words/card minimum)
├── server/
│   ├── index.js         # Express: SSE proxy, HMAC auth middleware, client data APIs
│   ├── data.json        # Runtime data (gitignored — empty structure provided)
│   └── .env.example     # Environment variable template
├── public/
│   └── cards/           # 78 tarot card WebP images (~81 KB each)
├── index.html
├── package.json
└── vite.config.js
```

---

## 🌐 Live Demo · 在线演示

**→ [tarot-assistant-z8gs.onrender.com](https://tarot-assistant-z8gs.onrender.com/)**

> Free tier on Render — allow ~30s cold start on first visit.  
> Render 免费层，首次访问约等待 30 秒冷启动。

---

## 📄 License · 许可证

Licensed under **GNU Affero General Public License v3.0 (AGPL-3.0)**.

Source code is open for learning and portfolio review.  
Commercial use or SaaS deployment requires written permission from the author.

---

<div align="center">Built with ☕ and React &nbsp;·&nbsp; 用 React 和咖啡构建</div>
