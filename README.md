<div align="center">
  <h1>Arcana AI</h1>
  <p><strong>AI-Powered Professional Tarot Reading Platform</strong></p>
  <p>面向塔罗咨询场景的 AI 产品实践 · C 端自助解读 · B 端咨询工作流 · RAG 知识增强</p>
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

## 项目简介

Arcana AI 是一个从真实塔罗咨询场景出发构建的 AI 产品实践项目。产品以 **C 端专业自助解读** 为核心，先让访客完成一次完整、私密、围绕自身问题的解读，再将已验证的生成能力延展到 **B 端咨询师工作流**，支持客户建档、背景补充、历史归档和记录管理。

项目同时建设了内部质量运营能力：规则检查、异步模型评审、固定案例回归、Prompt 版本管理和人工审核后的知识库沉淀。质量体系服务于 C 端“获得专业解读”这一核心体验，不在访客端展示内部评分或运营后台信息。

- **上线时间**：2026 年 7 月
- **项目角色**：独立产品经理 + 全栈开发
- **真实场景基础**：2 年塔罗研习经验、300+ 次真实咨询记录、90 次付费咨询
- **版本迭代**：从 v1.6.0 至 v1.22.5，累计 50+ 个版本/子版本
- **知识资产**：完成两类领域资料的清洗、结构化和检索接入，累计形成 2100+ 条可检索知识片段

## 在线演示

**→ [tarot-assistant-z8gs.onrender.com](https://tarot-assistant-z8gs.onrender.com/)**

> Render 免费层可能存在冷启动等待，首次访问请稍等。

## 功能亮点

| 模块 | 产品价值与实现 |
|---|---|
| **C 端自助解读** | 访客无需注册即可完成提问、事件分类、牌阵选择、虚拟/实体抽牌、解读生成、反馈修正和本地历史保存。 |
| **B 端咨询工作台** | 咨询师可以创建客户档案、补充背景信息、复用生成能力，并按客户查看和管理历史咨询记录。 |
| **牌阵与抽牌系统** | 支持 13 类牌阵、牌位关系、虚拟抽牌动画、实体牌录入和正逆位设置。牌阵配置与布局数据驱动，便于维护和扩展。 |
| **流式生成** | 使用 Server-Sent Events（SSE）持续返回长文本，降低等待感；生成失败时保留上下文并支持重试。 |
| **质量运营闭环** | 生成后并行记录规则检查和异步模型评审；管理端通过质量记录、固定测试案例和版本对比定位共性问题。 |
| **RAG 知识增强** | 领域资料经过清洗、结构化和人工审核后参与向量检索；检索失败时保留关键词检索兜底，不阻塞主流程。 |
| **部署与恢复** | Render 部署、环境变量隔离、MongoDB Atlas 持久化和本地降级路径共同保障线上运行与恢复能力。 |

## 产品逻辑

```text
C 端核心旅程
提问 → 事件分类 → 选择牌阵 → 虚拟/实体抽牌 → 生成解读 → 反馈修正 → 保存历史

B 端咨询延展
客户建档 → 补充背景 → 复用解读能力 → 归档结果 → 按客户检索历史

内部质量运营
已有知识召回 → 在线生成 → 自动规则检查与异步评审
        ↓
聚合记录定位共性问题 → Prompt 版本回归 → 人工审核有效经验 → 知识库反哺
```

## 技术栈

| 层级 | 技术与职责 |
|---|---|
| 前端 | React 18、Vite、CSS、数据驱动牌阵布局、SSE 客户端 |
| 后端 | Node.js、Express、生成代理、鉴权、质量记录和管理端 API |
| 数据 | MongoDB Atlas、Mongoose；本地文件作为受控降级路径 |
| RAG | Python 语料清洗与切分、BGE-M3 向量化、Cloudflare Workers AI 查询向量、Atlas Vector Search、关键词兜底 |
| 质量 | 本地规则检查、异步模型评审、固定案例批量评测、Prompt 版本管理、人工审核 |
| 部署 | Render、环境变量隔离、Git 版本管理与构建验证 |

## 公开作品集材料

完整的产品审计、流程图、设计源文件和项目说明位于 [`docs/portfolio/`](docs/portfolio/)，入口索引为 [`docs/portfolio/00-INDEX.md`](docs/portfolio/00-INDEX.md)。

| 材料 | 用途 |
|---|---|
| [项目说明（在线阅读）](docs/portfolio/project-brief/project-brief.md) | 快速了解产品定位、用户场景、产品迭代、技术实现与交付结果 |
| [项目说明（下载/打印版 PDF）](docs/portfolio/project-brief/%E7%86%8A%E5%A6%8D-AI%E4%BA%A7%E5%93%81%E7%BB%8F%E7%90%86%E9%A1%B9%E7%9B%AE%E8%AF%B4%E6%98%8E.pdf) | 同一份项目说明的排版版本，便于下载或打印 |
| [产品审计公开版](docs/portfolio/audit/tarot-assistant-audit-v0.3-public.md) | 查看用户流程、问题审计、需求优先级、质量评测和验收思路 |
| [迭代记录公开版](docs/portfolio/changelog/CHANGELOG-public.md) | 查看版本演进、产品动机、技术路线、验证方式和工程教训 |
| [双端功能逻辑流程图](docs/portfolio/flowcharts/v0.4-dual-mode-product-flow.png) | 查看 C 端访客流程与 B 端管理流程的整体关系 |
| [墨刀低保真原型](docs/portfolio/design/low-fidelity-prototype-modao.zip) | 查看页面结构和早期交互方案 |
| [Figma 高保真设计包](docs/portfolio/design/high-fidelity-figma.rar) | 查看高保真页面、视觉方案和设计素材 |

## 本地运行

### 环境要求

- Node.js 24+
- 一个兼容 OpenAI 或 Anthropic 请求格式的模型 API
- MongoDB Atlas 可选；未配置时使用项目提供的受控降级路径

### 安装与启动

```bash
git clone https://github.com/Bentancur6/arcana-ai.git
cd arcana-ai
npm install
npm run dev
```

生产构建：

```bash
npm run build
npm start
```

### 环境变量

请参考 `server/.env.example` 配置本地环境变量。真实凭证只应放在本地环境或部署平台的 Secret 配置中，不要提交到 Git。

## 项目结构

```text
arcana-ai/
├── src/
│   ├── App.jsx          # C/B 端页面、路由、牌阵交互与管理端视图
│   └── tarotPrompt.js   # 生成规则模块，不在公开文档展开完整 Prompt
├── server/
│   ├── index.js         # Express 服务、生成代理、数据和质量 API
│   ├── ruleChecks.js    # 规则检查逻辑
│   └── .env.example     # 环境变量模板
├── public/              # 对外运行所需的 UI 与牌面素材
├── docs/portfolio/      # 脱敏后的公开作品集材料
├── index.html
├── package.json
└── vite.config.js
```

## 隐私与脱敏说明

本仓库公开材料经过专门整理。以下内容不会随公开仓库发布：

- 客户姓名、真实聊天记录、可识别的咨询内容和内部测试样例；
- Prompt 完整模板、模块权重、内部标记和逐条提示词；
- API 凭证、数据库连接信息、环境变量值和本地绝对路径；
- 内部模型评审成本、调用参数和未对外承诺的运营数据；
- 原始工作目录中的对话记录、备份、私密知识库和中间产物。

## License

Licensed under **GNU Affero General Public License v3.0 (AGPL-3.0)**.

Source code is open for learning and portfolio review. Commercial use or SaaS deployment requires written permission from the author.

---

<div align="center">Built with React · 用真实咨询场景验证 AI 产品设计</div>
