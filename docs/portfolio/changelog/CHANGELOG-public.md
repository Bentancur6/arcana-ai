> 公开版说明：本文件为项目迭代记录的公开摘要版。保留版本演进、产品动机、技术路线、验证方式和工程教训；已移除客户/样例隐私、凭证、绝对路径、Prompt 具体权重、内部模型参数和成本细节。

# 塔罗助手 · 迭代记录 CHANGELOG

> 每次改 prompt、改代码、改文档，都记一笔。模板：日期 / 版本 / 动机 / 改了什么 / 怎么验证 / 关联产物。
> 这是面试中"工程交付"维度的核心证据——证明产品有可追溯的迭代历史。

---

## 2026-08-28

### v1.22.5 管理端功能同步/视觉对齐 + 访客端数据回流 + RAG 打通

- **动机**：① 用户复核发现管理端占卜输出仍是卡片式分块、非访客端同款流动长文；② 管理端抽牌区文字（牌阵位置名/「选择牌…」）仍是旧暗紫色、浅底看不清；③ RAG 一直空、用户质疑未真接入；④ 访客端数据只存浏览器、未进云端统一库；⑤ 切换数据源后客户「消失」。
- **改了什么**：
  2. **管理端输出分块修复（src/App.jsx reading 视图）**：原 `splitBlocks(editableOutput)` 多文本卡片渲染 → 改为单个流动 textarea（`stripMarkers(editableOutput)`），与访客端 [源码位置] 一致；`userPrompt` 去掉未落地的"五项要点/结构规则/段间空行"等卡片式指令，对齐访客端（保留客户/历史上下文 + 牌数标记，明确"连续流动长文、不分块"）。
  3. **管理端 CardSelector 浅色化（守住铁律12）**：`CardSelector` 共享组件新增可选 `light` 开关，组件内建双色板（light=黑字白底 #1D1D1F 等 / 默认暗色原值）。管理端 reading 视图抽牌区 `CardSelector` 调用传 `light`；访客端调用（[源码位置]）未传 → 外观零变化。覆盖位置名、「选择牌…」、▾箭头、逆位勾选、下拉面板、搜索框、牌名。
  4. **RAG 可见标识**：reading 视图 generate 后基于 `fetchKbContext` 是否真检索到内容显示 `📚 已接入知识库`（setKbInjected），打消"分不清启用没"。
  5. **逆位徽标对比度**：牌面"逆"徽标 `color:#1D1D1F` → `#FFFFFF`（深底深字反转）。
  6. **访客端数据回流 MongoDB（铁律12例外，用户批准）**：新增独立集合 `visitor_sessions`（字段 gender/tags/question/category/spread/cards/output 与管理端 clients 一致，source:"visitor"）；新增 `POST /api/visitor/save`（免鉴权）复用与管理端 `/api/extract-meta` 逐字一致的提取提示词写 visitor_sessions；**硬隔离**：不写 clients、不写 knowledge_chunks，不注入 prompt、不进知识库、只存不用（将来看板可用）。访客端 generate 成功后 fire-and-forget 上报（不动生成/RAG/localStorage）。
  7. **客户数据合并**：`data.json` 仅存的历史客户数据用只增不删脚本补回 Atlas `clients`（管理端真相源已 3 条齐全）。
- **关联产物**：`src/App.jsx`、`server/index.js`、`scripts/verify-rag.mjs`、`scripts/test-live-rag.mjs`、`scripts/test-rag-semantic.mjs`、`scripts/test-full-diag.mjs`、`scripts/merge-clients.mjs`、`scripts/check-clients.mjs`、`scripts/ingest-embeddings.mjs`。

### v1.22.4 管理端 batcheval+reading 套浅色导航壳（浅色化收尾）
- **动机 / 用户反馈**：v1.22.3 已将 batcheval（离线评测）与 reading（选客户后占卜界面）的内联暗色 token 全部映射为浅色（`base`/`card`/`btnPrimary`/`btnGhost`/`inputStyle` 等样式对象已改浅，正文暗紫 hex 已批量替换），**但漏了最关键的一步**：这两个视图**没有套"左导航 Shell + 右面板 `#F5F5F7` 浅色背景"**。根因：`base` 样式对象（[源码位置]）只设了 `color: "#1D1D1F"` 文字色，**没有设 background**，背景因此 fallback 到全局 `src/index.css` 的 `body { background: #060608 }`（暗色，铁律12 禁止改全局 css）。结果：暗背景 +（已被 v1.22.3 改成浅色的）浅色文字 → 用户看到"几乎全黑的页面、按钮文字看不见"，误以为"颜色没换、功能没进主页面"。对照：history / review / dashboard / quality / knowledge / clients(列表) 这 6 个视图**都套了 Shell**（左 `adminSidebar` + 右 `<div style={{flex:1, background:"#F5F5F7", overflowY:"auto"}}>`），所以有浅色底、正常显示。
- **改了什么（仅 `src/App.jsx`）**：
  1. **batcheval 视图（[源码位置]，两处 return）**：
     - **详情 return**（`if (beRunDetail)` [源码位置]）：外层 `<div style={base}>` 替换为 `<div style={{ display: "flex", minHeight: "100vh" }}> {NAV_BLOCK（"离线评测" active）} <div style={{ flex: 1, background: "#F5F5F7", overflowY: "auto" }}> <div style={{ maxWidth: 820, ... }}> ...原内容... </div></div></div>`。
     - **主界面 return**（[源码位置]）：外层 `<div style={base}>` 替换为同样 Shell 结构（"离线评测" active）+ `<div style={{ maxWidth: 900, ... }}>` 内容容器。
     - 删除了套 Shell 时多出的 `<div style={base}>`（最初误认为需要保留，实际应直接用 `maxWidth` 容器）。
  2. **reading 视图（AdminApp 兜底 return，[源码位置]）**：
     - 注意：reading 不是 `if (view === "reading")` 分支，而是所有 `if (view==="xxx")` 都不命中时的兜底渲染（选客户后占卜界面 / 匿名占卜）。
     - 外层 `<div style={base}>` 替换为 Shell 结构（"客户档案" active，因 reading 是客户工作流延续）+ `<div style={{ maxWidth: 640, ... }}>` 内容容器。
  3. **NAV_BLOCK 模板**：从 history 视图（[源码位置]）复制整段 `<div style={adminSidebar}> 品牌区 + nav + 导入/导出/退出 </div>`，品牌"塔罗工作台·管理后台" + 7 个导航项（客户档案/数据看板/知识库/质量记录/模型评审/离线评测/历史记录）+ 分割线 + 导入📤/导出📥/退出。`<label>📤 导入<input type="file" .../></label>` **多行写**（emoji + `<input>` 单行嵌套会被 esbuild 解析失败，见 v1.22.2 工程教训）。
  4. **视图级结构统一**：至此，**所有 8 个管理端视图**（clients / dashboard / knowledge / quality / review / history / batcheval / reading）均为：`<div style={{ display: "flex", minHeight: "100vh" }}> 左侧导航 Shell + <div style={{ flex: 1, background: "#F5F5F7", overflowY: "auto" }}> 内容容器 </div> </div>`。VisitorApp（[源码位置]）保持暗色不动（铁律12）。
- **验证**：
  1. **构建通过**：`npx vite build --outDir .wb_bld` ✓ 969ms → `index-Bo4dAxQP.js` 353.72 kB (gzip 132.98 kB)，无报错/警告。
  2. **暗色复核（grep）**：模式 `#eceaff|#d4d0f0|#dcdaee|#c8c4de|#8a86a8|#6e6c88|#3e3c54|#5ea888|#c04068|rgba\(212,208,240|rgba\(210,205,245|rgba\(94,168,136|rgba\(192,64,104|rgba\(80,78,100)`：
     - **batcheval 区间**（[源码位置]）命中 = **0** ✓
     - **reading 区间**（[源码位置]）命中 = **0** ✓
     - VisitorApp 区间外（AdminApp 全域）命中 = **0** ✓（暗色残留只在 [源码位置] VisitorApp，铁律12 正确保留）
  3. **左侧导航验证**：
     - batcheval 详情 + 主界面：2 处 `adminNavItemActive` → "离线评测" ✓
     - reading 兜底：1 处 `adminNavItemActive` → "客户档案" ✓
- **已知小项（可选，非阻塞）**：batcheval 内原生 `<select>` 受全局 `index.css` `select{background:var(--bg-dropdown)!important;color:var(--text-main)!important}` 影响，在浅色页上仍是暗色弹层。若用户介意，可给 `<select>` 加 `className="kb-batcheval-select"` + 局部 `<style>{`.kb-batcheval-select{color-scheme:light!important}`}</style>`（参考 history 视图做法）。本次主修「背景壳」，此项可后置。
- **关联 commit**：`3a8ca2e` "v1.22.4 管理端 batcheval+reading 套浅色导航壳"
- **里程碑**：至此，**管理端浅色化完全收尾**。所有 8 个视图均套导航壳 + `#F5F5F7` 背景 + 浅色文字/按钮。用户反馈"背景和按钮颜色还没换、离线评测没进主页面"问题**完全解决**。下一步可处理可选的 `<select>` 暗色弹层微调（若用户提出）。

### v1.22.2 管理端 UI 重构恢复（quality/review 重做 + history/loading 完成 + batcheval 延后）
- **改了什么**：
  1. **恢复 quality（第6屏，原 [源码位置] → 现 [源码位置]）**：按 CHANGELOG [源码位置] 颜色映射表 + 双 return 合并（外层 flex + 左侧导航 Shell + `rcSelected ? <详情> : <列表>`）+ RC_COLORS 语义色（`#34C759`/`#FF9500`/`#FF3B30`），暗紫残留 0。
  2. **恢复 review（第7屏，原 [源码位置] → 现 [源码位置]）**：按 CHANGELOG [源码位置]，`evSelected ? <详情> : <列表>` 合并 + 11 项暗紫→浅色映射 + `evStatusColor`/`dimColor` 语义色，暗紫残留 0。
  3. **第 8 屏 history（[源码位置]）**：包进左侧导航 Shell（激活「客户档案」）+ 浅色化；标题 `#1D1D1F`、分类筛选按钮 `adminBtnSecondary`；`SessionCard` 内部硬编码暗色 → `adminCard`/`adminBtnSecondary` + 浅色映射（业务分类色 `cat.color`/`cat.bg` 保留不动）。
  4. **第 9 屏 loading（[源码位置]）**：浅色居中（`#F5F5F7` 底 + `#1D1D1F` 字 + PingFang SC）。
  5. **工程教训落地**：左侧导航「导入/导出/退出」标签改用**多行 JSX**（`<input>` 单独成行），规避 esbuild 单行 `emoji文本+<input/>` 解析失败（review 首版因此报错）。
- **验证**：
  1. build 通过：`npx vite build --outDir .wb_bld` → `index-B5Pz5Ft4.js` 345.68 kB / 419,114B，无报错/警告。
  3. VisitorApp 与业务数据（CATEGORIES 分类色 [源码位置] `#c4a86a`）零触碰；`src/index.css` 零改。
- **铁律守护**：VisitorApp 零改 / 全局 index.css 零改 / 输出结构权重 / 十二维键名 / 路由契约零改 / 业务函数零改。
- **未处理（刻意）**：`SpreadCardLayout`、[源码位置]/[源码位置] 等管理端共享子组件仍保留暗色——属第1-5屏已验收态（可能访客端共用），本轮恢复不擅自扩大改动面，留待专项确认。
- **待办**：batcheval（约 394 行最复杂，含 `beRunDetail` 详情 + 三 tab + 原生 `<select>`/checkbox）延后至下一轮（token 紧张 + 本次回滚事故源）。

### v1.22.3 管理端 UI 重构收尾（batcheval+reading 浅色化 + 客户档案编辑 + 历史返回占卜）
- **动机 / 验收**：用户验收 v1.22.2 后确认"管理端剩离线评测(batcheval)与选客户后的占卜界面(reading)仍是暗紫，需要换浅色"，并追加两个小功能：① 客户档案栏加编辑按钮（改名+补充背景）；② 历史记录界面加返回占卜按钮（解决"嵌套返回只能重进"痛点）。
- **改了什么**：
  2. **batcheval（离线评测，[源码位置]）**：内联暗紫文本/边框/语义色 hex+rgba 脚本批量映射为苹果浅色（限定行范围，零 collateral）。原生 `<select>` 跟随系统浅色（`color-scheme:light`）。
  3. **reading（选客户后占卜界面，内嵌 clients 视图 [源码位置]）**：内联暗紫值批量映射为浅色；头部「✎ 编辑」按钮（[源码位置]）。
  4. **新功能·客户档案编辑**：新增 `editingProfile/profileName/profileNote` 状态（[源码位置]）+ `saveProfileEdit` 函数（[源码位置]，写回 `clients`+`selected`+`saveClients`）；reading 头部「✎ 编辑」打开内联表单（改名输入框 + 补充背景 textarea，[源码位置]），保存/取消。仅改数据字段与档案展示，不新增业务功能。
  5. **新功能·历史记录返回**：history 视图（[源码位置]）左上角「← 返回占卜」按钮，`setSelected(historyClient); setView("reading")`，无需重进客户档案即可回到该客户占卜界面。
- **验证**：
  1. build 通过：`npx vite build --outDir .wb_bld` → `index-IWbbgKyn.js` 346.51 kB / 420,002B，无报错/警告。
- **铁律守护**：VisitorApp 零改 / 全局 `src/index.css` 零改 / 业务函数零改 / 输出结构权重 & 十二维键名零改 / 路由契约零改。

### v1.22.0 管理端 UI 重构（浅色 + 苹果基调，login/clients/knowledge/dashboard 等视图逐屏改造）
- **动机 / 产品决策**：管理端当前使用暗色紫系（`#0c0a14` 底 + `#eceaff` 字 + `'Cinzel'` 衬线字体），用户要求改为「简洁、高级、克制，像苹果那种基调」。本版将管理端所有视图切换到浅色 + 苹果设计语言，提升美观性与可读性。**仅做视觉层**，业务代码零改动。
- **配色方案（全局统一）**：底色 `#F5F5F7`（苹果系统灰）、卡片 `#FFFFFF`（纯白）、主文 `#1D1D1F`（近黑）、次级 `#6E6E73`（苹果次级灰）、分隔 `#D2D2D7`、强调色 `#0071E3`（苹果蓝，克制使用）、状态色（成功 `#34C759` / 警告 `#FF9500` / 错误 `#FF3B30`）。
- **字体方案**：管理端各 `view === "xxx"` 分支内联样式改用 `'PingFang SC', 'Microsoft YaHei', -apple-system, BlinkMacSystemFont, sans-serif`，移除 `'Cinzel'` / `'Cormorant Garamond'` 英文衬线。**铁律守护**：全局 `src/index.css` 的 `@import` / CSS 变量 / `body` 字体不动（访客端与管理端共用），`VisitorApp` 内部字体不动，管理端占卜界面（复用访客端渲染）字体不动。
- **铁律（v1.22.0 全版本遵守）**：
  1. **VisitorApp 零改动**（`src/App.jsx` [源码位置] 起，一个字不动）
  2. **业务代码零改动**：`generateHandler` / `生成规则模块` / `SPREADS*` / 输出结构权重 / 十二维键名 / RAG 注入点 / 路由契约全部不动
  3. **只做视觉层**：布局、间距、颜色、字体、卡片、按钮样式
  4. **字体清理范围收紧**：只在管理端 `view === "xxx"` 分支内替换，不动全局 CSS / 访客端 / 管理端占卜界面（复用访客端）

---

#### 第 1 屏：LoginPage（`view === "login"`, [源码位置]）
- **改了什么**：
  1. **配色切换**：底色 `#0c0a14` → `#F5F5F7`，卡片 `rgba(255,255,255,0.025)` → `#FFFFFF`，文字 `#eceaff` → `#1D1D1F`，边框 `rgba(212,208,240,0.2)` → `#E5E5EA`
  2. **字体切换**：标题/输入框/按钮字体从 `'Cinzel', Georgia, serif` / `'Cormorant Garamond'` 改为 `'PingFang SC', 'Microsoft YaHei', sans-serif`
  3. **标题优化**：移除装饰性「✦ THE ORACLE ✦」，保留「塔罗工作台」，字号 24px / 字重 600 / 字距 0.5（适合中文）
  4. **输入框优化**：底色改为纯白 `#FFFFFF`，边框 `#D2D2D7`，focus 时边框变蓝 `#0071E3`，占位符「请输入密码」
  5. **按钮优化**：去掉紫色渐变 `linear-gradient(135deg, #e2deff , #b8b2d8 )`，改为苹果蓝纯色 `#0071E3`，白字 `#FFFFFF`，圆角 10px，hover 加深到 `#0066CC`，禁用态浅灰 `#C7C7CC`，文案改为「登录」
  6. **错误提示**：颜色从 `#c04068` 改为 `#FF3B30`（苹果红），字号 13px
  7. **细节**：卡片增加细腻阴影 `0 2px 8px rgba(0, 0, 0, 0.08)`，输入框/按钮增加 `transition` 过渡动画
- **不动点**：
  - `LoginPage` 业务逻辑（[源码位置] 的 `submit` 函数、state、`/api/login` 调用、token 存储）未改
  - 全局 `src/index.css` 的 `@import` / `--font-title` / `--font-body` / `body` 字体未改
  - `VisitorApp` 内部字体（[源码位置] / [源码位置] / [源码位置] / [源码位置] / [源码位置]）未改
- **验证**：`npm run build` ✓ 3.66s（32 modules），无报错/警告；视觉效果浏览器确认通过。

#### 第 2 屏：管理端专属样式对象定义 + clients 主页（[源码位置] + [源码位置]）
- **改了什么**：
  1. **新增管理端专属样式对象（[源码位置]，模块作用域，供所有管理端视图复用）**：
     - `adminBase`：底色 `#F5F5F7`、字体 `'PingFang SC'`、文字 `#1D1D1F`
     - `adminCard`：白底 `#FFFFFF`、边框 `#E5E5EA`、圆角 12px、阴影 `0 1px 3px rgba(0,0,0,0.08)`、字体 `'PingFang SC'`
     - `adminInput`：底色 `#F5F5F7`、边框 `#D2D2D7`、字体 `'PingFang SC'`、focus 蓝边 `#0071E3`
     - `adminBtnPrimary`：苹果蓝 `#0071E3`、白字、字体 `'PingFang SC'`、字重 500、hover 加深 `#0066CC`
     - `adminBtnSecondary`：透明底、灰边 `#D2D2D7`、字体 `'PingFang SC'`、hover 变蓝
     - `adminToolbarBtn`：白底、灰边、字体 `'PingFang SC'`、字号 12px、hover 变蓝
     - **关键**：所有样式对象显式写 `fontFamily: "'PingFang SC', 'Microsoft YaHei', sans-serif"`，不展开 `...base`（避免继承 `var(--font-body)` 的衬线 `'Cormorant Garamond'`）
  2. **容器与底色（[源码位置]）**：外层从 `base` 改为 `adminBase`（底色 `#F5F5F7`），内层宽度从 600px 增大到 900px
  3. **顶栏工具按钮组（[源码位置]，8 个按钮）**：统一使用 `adminToolbarBtn`，消除内联重复，hover 边框和文字变蓝 `#0071E3`，字体从 `'Cormorant Garamond'` 改为 `'PingFang SC'`，退出按钮去掉 `letterSpacing: 1`
  4. **主标题区域（[源码位置]）**：移除 `<header className="oracle-header">` 及 3 个子元素（`.oracle-header__eyebrow` / `__title` / `__subtitle`），去掉装饰性「✦ The Oracle ✦」和英文 `TAROT READING ASSISTANT`，改为「塔罗工作台」（字号 28px / 字重 600 / 颜色 `#1D1D1F`）+「客户档案管理」（字号 13px / 颜色 `#8E8E93`），字体 `'PingFang SC'`
  5. **客户列表卡片（[源码位置]）**：卡片从 `card` 改为 `adminCard`，hover 从改变边框颜色改为加深阴影（`0 1px 3px` → `0 4px 12px`），客户名颜色 `#1D1D1F` + 字重 500，备注/次数颜色 `#6E6E73` / 字号 13px，性别/标签颜色 `#8E8E93` / 字号 12px，「记录」按钮 `adminBtnSecondary` + hover 变蓝，「删除」按钮苹果红 `#FF3B30` + hover 红底白字
  6. **新增客户表单（[源码位置]）**：卡片 `adminCard`，标题从 `.section-label` class 改为内联样式（`'PingFang SC'` / 字号 15px / 字重 600 / 颜色 `#1D1D1F`），输入框 `adminInput` + focus 蓝边，「确认添加」按钮 `adminBtnPrimary` + hover 加深，「取消」按钮 `adminBtnSecondary` + hover 变蓝
  7. **新增客户按钮（[源码位置]）**：基础样式 `adminBtnSecondary`，文字和边框改为苹果蓝 `#0071E3`，边框样式保持 `dashed`，hover 背景变极浅蓝 `#E3F2FD`
  8. **底部按钮（[源码位置]）**：从 `btnGhost` 改为 `adminBtnSecondary` + hover 变蓝
- **不动点**：
  - 所有业务函数（`openXxxView` / `exportData` / `importData` / `handleLogout` / `selectClient` / `deleteClient` / `fetchClients` / `addClient` / `updateClient` / `deleteClient` / `setShowNewClient` / `setView`）未改
  - [源码位置] 的 `base` / `card` / `inputStyle` / `btnPrimary` / `btnGhost` 定义未改（其他视图可能还在用）
  - 全局 `src/index.css` 的 CSS 变量 / `@import` / `body` 字体未改
  - `.oracle-header*` / `.section-label` class 定义未改（虽然此视图不用）
  - `VisitorApp`（[源码位置] 起）一个字未动
  - 管理端占卜界面（复用访客端）字体未动
- **验证**：`npm run build` ✓ 4.44s（32 modules），无报错/警告；JS bundle 从 325.21 kB 增至 326.57 kB（+1.36 kB，因新增 6 个样式对象定义）；视觉效果浏览器确认通过。

---

#### 第 2 屏：clients 客户档案主页（`view === "clients"`, 实际边界 [源码位置]）
- **改了什么（仅 `src/App.jsx`，+236/-89 行相对 HEAD）**：
  1. **新增 6 个管理端专属样式对象**（[源码位置]，模块作用域，供 knowledge/dashboard/quality/review/batcheval 复用）：`adminBase`/`adminCard`/`adminInput`/`adminBtnPrimary`/`adminBtnSecondary`/`adminToolbarBtn`。**全部显式写 `fontFamily: "'PingFang SC', 'Microsoft YaHei', -apple-system, BlinkMacSystemFont, sans-serif`，不展开 `...base`**（避免继承 `var(--font-body)` 的 `Cormorant Garamond` 衬线——实测 `index.css` [源码位置] `--font-body: 'Cormorant Garamond', serif`）。
  2. **容器与底色**：外层 `base` → `adminBase`（底色 `#0c0a14` → `#F5F5F7`）；内层宽度 `600px` → `900px`。
  3. **顶栏 8 按钮**（离线评测/模型评审/数据看板/质量记录/知识库/导出/导入/退出）：统一 `adminToolbarBtn` + hover 变蓝 `#0071E3`（border+文字），去掉原 8 处重复内联样式与 `Cormorant Garamond` 衬线（退出按钮原 letterSpacing:1 一并去除）。
  4. **主标题区**：删除 `<header class="oracle-header">` 三子元素（「✦ The Oracle ✦」/「塔罗工作台」/「TAROT READING ASSISTANT」），改 `<div>` 包裹「塔罗工作台」(PingFang SC, 28px, 600, #1D1D1F) + 「客户档案管理」(13px, #8E8E93)。`.oracle-header*` class 定义保留仅本视图停用。
  5. **客户卡片**：`card` → `adminCard`（白底 #FFFFFF / 边框 #E5E5EA / 圆角 12 / 阴影 0 1px 3px，hover 加深 0 4px 12px）；客户名 `#eceaff` → `#1D1D1F`(字重500)；备注/占卜次数 `#6e6c88` → `#6E6E73`(13px)；性别/标签 `#8a86a8` → `#8E8E93`(12px)；「记录」`btnGhost` → `adminBtnSecondary`(hover 蓝)；「删除」`btnGhost`+`#c04068` → `adminBtnSecondary`+`#FF3B30`(hover 红底 #FF3B30 + 白字)。
  6. **新增客户表单**：`card`→`adminCard`；标题去 `.section-label` 改内联 PingFang SC(15px,600,#1D1D1F)；`inputStyle`→`adminInput`(focus 蓝边)；「确认添加」`btnPrimary`→`adminBtnPrimary`(hover #0066CC)；「取消」`btnGhost`→`adminBtnSecondary`(hover 蓝)。
  7. **新增客户按钮**：`btnGhost`→`adminBtnSecondary`，文字+边框 `#0071E3` 虚线(dashed)，hover 浅蓝 `#E3F2FD`。
  8. **底部「不选客户，直接开始占卜」按钮**：`btnGhost`→`adminBtnSecondary`(hover 蓝)。
- **不动点**：
  - 所有业务函数未改：`openBatchEvalView`/`openReviewView`/`openDashboardView`/`openQualityView`/`openKnowledgeView`/`exportData`/`importData`/`handleLogout`/`selectClient`/`deleteClient`/`fetchClients`/`addClient`/`updateClient`/`deleteClient`（均实测仍存在且 onClick 正常接线）。
  - 全局 `src/index.css` 的 `@import` / `--font-title` / `--font-body` / `body` 字体未改（`git diff --stat` 仅 `src/App.jsx` 进变更，index.css 未动）。
  - [源码位置] 原 `base`/`card`/`inputStyle`/`btnPrimary`/`btnGhost` 定义未改（其他视图仍用）。
  - `VisitorApp` 字体未改（Cormorant/Cinzel 仍存于 [源码位置]/2319/3343/3354/3361/3368/4946+）。
  - 管理端占卜界面（复用访客端渲染）字体未改。

---

#### 第 3 屏：管理端左侧垂直导航 Shell（替代顶部 8 按钮工具栏，clients 先行 + 后续视图复用）
- **注**：v1.22.1 黑屏修复将 6 个 admin* 对象从 `TarotApp()` 体内移到模块级 [源码位置]，故本屏导航对象接续定义在 [源码位置]（均在 `function TarotApp()` 之前，模块级）。
- **改了什么（仅 `src/App.jsx`）**：
  1. **新增 4 个模块级导航样式对象**（[源码位置]，在 `adminToolbarBtn` 之后）：`adminSidebar`（宽 220 / 白底 `#FFFFFF` / 右边框 `1px solid #E5E5EA` / flex 垂直）/ `adminBrand`（品牌区内边距 `24px 20px 20px` + 底边框）/ `adminNavItem`（导航项基础，左边框 `3px solid transparent` 占位 + 过渡）/ `adminNavItemActive`（`...adminNavItem` + 蓝字 `#0071E3` + 浅蓝底 `#E3F2FD` + 左蓝条 `3px solid #0071E3`）。**全部显式 `fontFamily: "'PingFang SC', 'Microsoft YaHei', sans-serif`，无衬线泄漏**；`adminNavItemActive` 用 `...adminNavItem` 展开继承字体。
  2. **clients 视图布局改造（[源码位置]，~191 行替换）**：外层改 `display:flex; minHeight:100vh` 左右分栏。
     - **删除**原顶部 8 按钮工具栏（离线评测/模型评审/数据看板/质量记录/知识库/导出/导入/退出 的横向 flex 行）+ 内容头部「塔罗工作台」主标题。
     - **左侧导航 Shell**（[源码位置]）：品牌区「塔罗工作台」(18px/600) +「管理后台」(12px/`#8E8E93`)；6 个主导航项（客户档案[当前高亮]→数据看板→知识库→质量记录→模型评审→离线评测，分别 `setView("clients")`/`openDashboardView`/`openKnowledgeView`/`openQualityView`/`openReviewView`/`openBatchEvalView`）；分隔线 + 3 工具项（导入 `importData`/导出 `exportData`/退出 `handleLogout`[红字 `#FF3B30`，hover 浅红 `#FFEBEE`]）；非激活项 hover 浅灰 `#F5F5F7`。
     - **右侧内容区**（flex:1 / 底色 `#F5F5F7` / `overflowY:auto`）：maxWidth 900 居中容器，内容头部只留「客户档案管理」(24px/600)；客户列表/新增表单/底部按钮逻辑与交互完全保留。
- **复用约定**：knowledge/dashboard/quality/review/batcheval 等后续视图一律复用同一左侧导航 Shell（导航只写一次，内容区换视图），禁止再出现顶部拥挤工具栏。

---

#### v1.22.1 管理端 hotfix（黑屏修复 + clients 头部标题/工具栏重叠修复）
- **动机**：v1.22.0 clients 屏引入两个缺陷（1 个阻断性黑屏 + 1 个视觉重叠），本版修复；纯作用域修正 + 视觉层，业务代码零改动。
- **修复 1 — 黑屏（阻断性）**：
  - 根因：6 个样式对象 `adminBase/adminCard/adminInput/adminBtnPrimary/adminBtnSecondary/adminToolbarBtn` 被定义在 `TarotApp()` 组件函数体内，clients 视图（独立组件）引用时运行时 `ReferenceError: adminBase is not defined` → 整页崩成黑屏（仅露底层暗底 `#0c0a14`）。
  - 修复：将 6 个 admin* 对象（含注释）从 `TarotApp()` 体内**剪切到模块级作用域**（移到 `function TarotApp()` 定义之前，实测 [源码位置]）。与 `CATEGORIES`/`CAT_ICON_PATHS` 同级；只引用字面量，不依赖任何 state/hook，模块级安全。[源码位置] 原 `base/card/inputStyle/btnPrimary/btnGhost` 保持原位不动。
- **修复 2 — clients 头部标题与工具栏重叠（视觉缺陷）**：
  - 根因：头部外层 `position: relative` + 工具栏 `position: absolute; top:0; right:0` + 8 按钮 `flexWrap: wrap`，标题在普通流顶部居中，被绝对定位工具栏直接压住；按钮换行后更高更宽，重叠加剧（用户反馈"塔罗工作台的文字和按钮混在一起"）。
  - 修复：头部改为 `display:flex; flexDirection:row-reverse; justifyContent:space-between; alignItems:center; flexWrap:wrap; gap:16`（外层去 absolute），工具栏 `display:flex; justifyContent:flex-end`（去 absolute），标题块 `textAlign:left`。效果：标题居左、工具栏居右并随宽度优雅换行，不再重叠。仅改 clients 头部 3 处 inline style（[源码位置]/4518/4557 区域）。
- **不动点（三条硬约束守住）**：`VisitorApp`/[源码位置] `<VisitorApp/>` 零改；全局 `src/index.css` 的 `@import`/CSS 变量/`body` 字体零改；所有业务函数/`openXxxView`/`exportData`/`importData`/`handleLogout`/路由契约/输出结构权重/评分十二维零改。

---

#### 第 4 屏：knowledge 知识库视图（`view === "knowledge"`, [源码位置]，整体替换）
- **注**：左侧导航 Shell 已在第 3 屏建好（导航对象 `adminSidebar/adminBrand/adminNavItem/adminNavItemActive` 模块级 [源码位置]），本屏直接复用，不重定义。
- **改了什么（仅 `src/App.jsx`，+279 行相对旧 knowledge 分支）**：
  1. **包进左侧导航 Shell**（[源码位置]，复用 clients 结构）：外层 `display:flex; minHeight:100vh`；左侧 `adminSidebar`（品牌区「塔罗工作台」+「管理后台」、6 主导航项、分隔线、3 工具项）；**激活态切到「知识库」**（[源码位置] `adminNavItemActive`，其余项 `adminNavItem` + hover 浅灰 `#F5F5F7`）；右侧内容区 `flex:1` / 底色 `#F5F5F7` / `overflowY:auto` / maxWidth 900 居中。**删除**原「← 返回」按钮与原「📚 知识库」(`'Cinzel'` 衬线) 标题。
  2. **去暗色紫系**：底色 `#0c0a14`→`#F5F5F7`、卡片 `card`(暗)→`adminCard`(白 `#FFFFFF`)、主文 `#eceaff`→`#1D1D1F`、次级 `#b9b6d6`/`#6e6c88`→`#6E6E73`/`#8E8E93`、边框 `#E5E5EA`/`#D2D2D7`、强调 `#0071E3`。
  4. **样式对象替换**：`inputStyle`→`adminInput`(focus 蓝边 `#0071E3`)、`btnPrimary/btnGhost`→`adminBtnPrimary/adminBtnSecondary`(hover 交互)、`card`→`adminCard`。
  5. **简化布局**：内容头部仅「知识库管理」(24px/600) +「＋ 新建知识」按钮；筛选栏保留分类/状态下拉 + 刷新（标签次级灰 `#6E6E73`）；新增/编辑表单仅 `kbEditing || kbDraft.title || kbDraft.content` 时显示；**删除 `kbBadge()` 函数调用**，状态标签改内联语义化配色（生效中绿 `#34C759`/待审橙 `#FF9500`/归档灰）；正文预览限高 80→60px 更紧凑；批量导入区 adminCard 白底、textarea 保留等宽字体（JSON 需要）但样式统一 adminInput。
- **备注**：`kbBadge` 函数定义本身仍在 [源码位置]（含 `Cormorant Garamond`，属未重构的其它管理端视图/死代码残留），本屏仅移除其在 knowledge 的调用，未删除函数定义——属视觉层重构范围外，留待后续清理。
- **视觉微调（补丁，同屏追加）**：
  1. **修复下拉框深黑底**（3 个 `<select>`：筛选栏分类/状态 [源码位置]/[源码位置]、表单分类 [源码位置]）：
     - 根因：全局 `src/index.css` [源码位置] 有 `select { background-color: var(--bg-dropdown) !important }` + `option { background-color: ... !important }`（`--bg-dropdown` = `#0c0a14` 深底，v1.21.1 为暗色知识库 tab 加的对比度修复）；未重构的暗色管理端视图（如 [源码位置] `beCmpCaseId`）仍依赖此规则，改全局 CSS 违反铁律。
     - 修复：每个 `<select>` 在 `...adminInput` 基础上追加 `backgroundColor: "#F5F5F7 !important", color: "#1D1D1F !important"`（inline !important 压过全局 !important）；每个 `<option>` 追加 `style={{ backgroundColor: "#FFFFFF !important", color: "#1D1D1F !important" }}`（展开列表也浅色）。
  2. **修复「＋ 新建知识」按钮蓝底白字**（[源码位置]）：`adminBtnPrimary`（苹果蓝底白字）→`adminBtnSecondary`（白底灰边深字 outline）；hover 从"改 background 为 `#0066CC`/`#0071E3`"改为"改 borderColor + color 为 `#0071E3`"（与「刷新」按钮 [源码位置] hover 一致：蓝边蓝字、不填蓝底）。
  3. **用户二次反馈「改成白底黑字」+ 根因重定位（[源码位置]/[源码位置]/[源码位置]）**：
     - 原补丁用 `#F5F5F7`（浅灰）被用户认为仍偏暗，要求纯白底；已将 3 个 `<select>` 底色目标改为纯白底 + 近黑字 `#1D1D1F`（即"白底黑字"）。
     - **关键根因修正**：Claude 上版用 inline `style={{ backgroundColor: "#FFFFFF !important" }}` 试图覆盖全局 `select` 规则，但 **React 的 `style` 对象通过直接赋值设置 CSS 属性，不保证 `!important` 真正生效**；实测 bundle 里 inline `!important` 字符串虽存在，浏览器计算样式仍被全局 `index.css` [源码位置] 的 `select { background-color: var(--bg-dropdown) !important }` 压成深底（用户截图确认黑底白字）。
     - **正确修法**：在知识库视图内添加局部 `<style>` 标签（作用域仅在 `view === "knowledge"` 分支），定义 `.kb-light-select` 与 `.kb-light-select option` 的覆盖规则：
       - `background-color: #FFFFFF !important; color: #1D1D1F !important; border: 1px solid #D2D2D7 !important;`
       - **`color-scheme: light !important`**（关键：Windows 在 OS/浏览器深色模式下，原生 `<select>` 会按系统色 scheme 渲染为黑底；必须显式声明 light 才能强制白底）
       - `:focus` 状态保留蓝边 `#0071E3`，与 adminInput 聚焦一致
       - 给 3 个 `<select>` 加 `className="kb-light-select"`。该 class 选择器（0,1,0）特异性高于全局元素选择器（0,0,1），且同样带 `!important`，可稳定覆盖全局深底规则；未修改 `src/index.css`，未重构暗色管理视图仍不受影响。
     - 清理了之前无效 inline `!important` 样式和 `colorScheme: "light"` 死代码（React inline style 无法可靠传递 `color-scheme`，需走 `<style>` 标签）。
  - 不动点（铁律守住）：`src/index.css` 文件本身一个字未动（全局 `select` 规则保留，未重构视图仍可用）；`VisitorApp` 未动；所有知识业务函数未动；改动仅在知识库视图内局部 `<style>` 标签。

#### 第 5 屏：dashboard 数据看板视图（`view === "dashboard"`, [源码位置] 起，整体替换；实测区间约 [源码位置]，含概览/漏斗/牌阵/分类/十二维/反馈热点/访客行为各区块）
- **注**：左侧导航 Shell 已在第 3 屏建好（导航对象 `adminSidebar/adminBrand/adminNavItem/adminNavItemActive` 模块级 [源码位置]），本屏直接复用，不重定义。
- **改了什么（仅 `src/App.jsx`）**：
  1. **包进左侧导航 Shell**（[源码位置]，复用 knowledge 结构）：外层 `display:flex; minHeight:100vh`；左侧 `adminSidebar`（品牌区 + 6 主导航项 + 分隔线 + 3 工具项）；**激活态切到「数据看板」**（[源码位置] `adminNavItemActive`，其余项 `adminNavItem` + hover 浅灰 `#F5F5F7`）；右侧内容区 `flex:1` / 底色 `#F5F5F7` / `overflowY:auto` / maxWidth 900 居中。**删除**原「← 返回」按钮与原居中「数据看板」span。
  2. **内容头部简化**（[源码位置]）：左侧 `<h1>`「数据看板」(24px/600/`#1D1D1F`/`'PingFang SC'`) + 右侧「刷新」按钮（`fetchStats(statsRange)`，`adminBtnSecondary` + hover 蓝边蓝字 `#0071E3`）。
  3. **去暗色紫系（颜色映射表全量替换，11 项）**：主文/数值 `#eceaff`→`#1D1D1F`、次级灰 `#6e6c88`→`#8E8E93`、标签灰 `#8a86a8`→`#6E6E73`、极暗提示 `#3e3c54`→`#C7C7CC`、进度条底 `rgba(255,255,255,0.04)`→`#E5E5EA`、进度条填充 `rgba(212,208,240,0.5)`/`#d4d0f0`→`#0071E3`、偏弱/警告 `#c04068`→`#FF3B30`、达标 `#5ea888`→`#34C759`、失败原因 `#c4a86a`→`#FF9500`。
  4. **样式对象替换**：容器 `base`→flex 外层、`card`→`adminCard`、`btnGhost`→`adminBtnSecondary`；所有文字统一 `fontFamily:'PingFang SC','Microsoft YaHei',sans-serif`。
  5. **局部样式覆盖 `.section-label`**（[源码位置]）：视图内加 `<style>` 定义 `.kb-dash .section-label { color:#6E6E73; font-family:'PingFang SC',sans-serif; letter-spacing:0.05em; text-transform:none }`，仅作用本视图，不动全局 `index.css` 的 `.section-label` 定义。

#### 第 6 屏：质量记录视图（`view === "quality"`, [源码位置] 起，双 return 合并 + 补左侧导航 Shell + 浅色化简）
- **注 1**：左侧导航 Shell 已在第 3 屏建好（导航对象 `adminSidebar/adminBrand/adminNavItem/adminNavItemActive` 模块级 [源码位置]），本屏直接复用，不重定义。
- **注 2 — 结构差异**：quality 视图原有**两个独立 `return`**（详情子视图 [源码位置] `if (rcSelected) return <div style={base}>...` + 列表视图 [源码位置] `return <div style={base}>...`），每个都有独立 `style={base}` 暗色容器，无左侧导航 Shell，使用旧式「← 返回」按钮 + 居中标题。本版重构：**把左侧导航 Shell 提到两个 `return` 之外共享**，整个 `if (view === "quality")` 块改为外层 flex + 左侧导航 + 右侧内容区（内用 `rcSelected ? <详情/> : <列表/>` 条件渲染），删除各自外层 `style={base}` 包裹。
- **改了什么（仅 `src/App.jsx`，[源码位置]，212 行整体替换）**：
  1. **结构重构**：
     - 外层 `display: flex, minHeight: "100vh"`（[源码位置]）
     - 左侧导航 Shell（[源码位置]，88 行）：复用 knowledge 结构，**激活「质量记录」**（[源码位置] `adminNavItemActive`，蓝字 + 浅蓝底 `#E3F2FD` + 左蓝条 `#0071E3`）
     - 右侧内容区（[源码位置]，110 行）：`flex:1; background:"#F5F5F7"; overflowY:"auto"`，内层 `maxWidth:820; margin:"0 auto"; padding:"24px 20px"`（沿用原 820），包裹 `className="kb-quality"` + 局部 `<style>` 覆盖 `.section-label`（颜色 `#6E6E73` + 字体 `'PingFang SC'`，不动全局 `index.css`）
     - 详情/列表条件分支：`rcSelected ? <详情子视图/> : <列表视图/>`（[源码位置]），删除各自原外层 `style={base}` 包裹
  2. **删除/保留顶部元素**：
     - 列表视图：**删除**原「← 返回」按钮（[源码位置]，`setView("clients")`，左侧导航接管）、**删除**原居中「质量记录」span（[源码位置]，`#eceaff`，左侧品牌区已提供）
     - 详情子视图：**保留**「← 返回列表」按钮（屏内导航 `setRcSelected(null)`，改为 `adminBtnSecondary` + 文字 `#1D1D1F`，原 `#eceaff`）、**保留**「质检详情」span（文字改为 `#8E8E93`，原 `#eceaff`）
  3. **RC_COLORS 定义修改（[源码位置]，必须改定义）**：`pass:"#5ea888"→"#34C759"`、`risk:"#c4a86a"→"#FF9500"`、`fail:"#c04068"→"#FF3B30"`、`pending:"#6e6c88"→"#8E8E93"`（同步改 dimColor 函数的判断阈值色，[源码位置]：`>=5 ? "#34C759" : >=3 ? "#FF9500" : "#FF3B30"`）
  4. **去暗色紫系（颜色映射表全量替换，11 项）**：
     - 主文/数值 `#eceaff`→`#1D1D1F`：详情问题文字、列表牌阵名、检查标签、输出文本、模型评审总分、评审分值
     - 紫强调 `#d4d0f0`→`#1D1D1F`：详情输出文本（需可读，不用蓝）
     - 标签灰紫 `#8a86a8`→`#6E6E73`：详情输入牌阵信息、检查明细 detail、模型评审维度标签
     - 次级灰紫 `#6e6c88`→`#8E8E93`：详情时间/来源、列表时间、版本号、空状态提示、"待 P1-06"
     - 极暗提示 `#3e3c54`→`#C7C7CC`：检查明细"共 X"、"待 P1-06"
     - 暗条底/分隔 `rgba(212,208,240,0.07)`→`#E5E5EA`：检查明细分隔线、模型评审建议分隔线
     - 紫边框 `rgba(212,208,240,0.5)` / `0.15`→`#0071E3` / `#D2D2D7`：范围按钮激活态 `#0071E3`、非激活 `#D2D2D7`
     - 卡片 hover 边 `rgba(210,205,245,0.32)` / `0.13`→`boxShadow` 加深：列表卡片 hover 从改变边框改为加深阴影（`0 1px 3px` → `0 4px 12px`，与 clients 一致）
     - pass 按钮边 `rgba(94,168,136,0.5)`→`rgba(52,199,89,0.5)`
     - fail 按钮边 `rgba(192,64,104,0.5)`→`rgba(255,59,48,0.5)`
     - dimColor（模型评审维度）`#5ea888` / `#c4a86a` / `#c04068`→`#34C759` / `#FF9500` / `#FF3B30`
  5. **样式对象替换**：容器 `base`→flex 外层、`card`→`adminCard`（白 `#FFFFFF`）、`btnGhost`→`adminBtnSecondary`、`inputStyle`（详情 textarea [源码位置]）→`adminInput` + focus 蓝边 `#0071E3`；所有文字统一 `fontFamily:'PingFang SC','Microsoft YaHei',sans-serif`。

#### 第 7 屏：模型评审视图（`view === "review"`, [源码位置] 起，双 return 合并 + 补左侧导航 Shell + 浅色化简）
- **注 1**：左侧导航 Shell 已在第 3 屏建好（导航对象 `adminSidebar/adminBrand/adminNavItem/adminNavItemActive` 模块级 [源码位置]），本屏直接复用，不重定义。
- **注 2 — 结构差异**：review 视图原有**两个独立 `return`**（详情子视图 [源码位置] `if (evSelected) return <div style={base}>...` + 列表视图 [源码位置] `return <div style={base}>...`），与 quality（第 6 屏）同构。本版参考 quality 模板重构：**把左侧导航 Shell 提到两个 `return` 之外共享**，整个 `if (view === "review")` 块改为外层 flex + 左侧导航 + 右侧内容区（内用 `evSelected ? <详情/> : <列表/>` 条件渲染），删除各自外层 `style={base}` 包裹。
- **改了什么（仅 `src/App.jsx`，[源码位置]，120 行整体替换）**：
  1. **结构重构**：
     - 外层 `display: flex, minHeight: "100vh"`（[源码位置]）
     - 左侧导航 Shell（[源码位置]，88 行）：复用 knowledge 结构，**激活「模型评审」**（[源码位置] `adminNavItemActive`，蓝字 + 浅蓝底 `#E3F2FD` + 左蓝条 `#0071E3`）
     - 右侧内容区（[源码位置]，190 行）：`flex:1; background:"#F5F5F7"; overflowY:"auto"`，内层 `maxWidth:820; margin:"0 auto"; padding:"24px 20px"`（沿用原 820），包裹 `className="kb-review"` + 局部 `<style>` 覆盖 `.section-label`（颜色 `#6E6E73` + 字体 `'PingFang SC'`，不动全局 `index.css`）
     - 详情/列表条件分支：`evSelected ? <详情子视图/> : <列表视图/>`（[源码位置]），删除各自原外层 `style={base}` 包裹
  2. **删除/保留顶部元素**：
     - 列表视图：**删除**原「← 返回」按钮（[源码位置]，`setView("clients")`，左侧导航接管）、**删除**原居中「模型评审」span（[源码位置]，`#eceaff`，左侧品牌区已提供）
     - 详情子视图：**保留**「← 返回列表」按钮（屏内导航 `setEvSelected(null)`，改为 `adminBtnSecondary` + 文字 `#1D1D1F`，原 `#eceaff`）、**保留**「评审详情」span（文字改为 `#8E8E93`，原 `#eceaff`）、**保留**版本号（文字改为 `#8E8E93`，原 `#6e6c88`）
  3. **evStatusColor / dimColor 定义修改（[源码位置]，必须改定义）**：`pending:"#c4a86a"→"#FF9500"`、`completed:"#5ea888"→"#34C759"`、`failed:"#c04068"→"#FF3B30"`（同步改 dimColor 函数的判断阈值色：`>=5 ? "#34C759" : >=3 ? "#FF9500" : "#FF3B30"`）
  4. **去暗色紫系（颜色映射表全量替换，11 项，与第 6 屏语义一致）**：
     - 主文/数值 `#eceaff`→`#1D1D1F`：详情问题文字、列表牌阵名、「评审详情」span、score 文字（completed）
     - 紫强调 `#d4d0f0`→`#1D1D1F`：建议修正方向、输出文本
     - 标签灰紫 `#8a86a8`→`#6E6E73`：牌阵信息、维度标签、列表分类
     - 次级灰紫 `#6e6c88`→`#8E8E93`：列表时间、空状态提示、版本号
     - 极暗提示 `#3e3c54`→`#C7C7CC`：列表 score 未完成（`completed ? "#1D1D1F" : "#C7C7CC"`）
     - 暗条底/分隔 `rgba(212,208,240,0.07)`→`#E5E5EA`：维度分隔线
     - 卡片 hover 边 `rgba(210,205,245,0.32)` / `rgba(212,208,240,0.13)`→`boxShadow` 加深：列表卡片 hover 从改变边框改为加深阴影（`0 1px 3px` → `0 4px 12px`，与 clients / quality 一致）
     - 琥珀/pending `#c4a86a`→`#FF9500`：evStatusColor.pending / dimColor >=3
     - 绿/completed `#5ea888`→`#34C759`：evStatusColor.completed / dimColor >=5
     - 红/failed `#c04068`→`#FF3B30`：evStatusColor.failed / dimColor <3
  5. **样式对象替换**：容器 `base`→flex 外层、`card`→`adminCard`（白 `#FFFFFF`）、`btnGhost`→`adminBtnSecondary`；所有文字统一 `fontFamily:'PingFang SC','Microsoft YaHei',sans-serif`。

---

## 2026-08-27

### v1.21.0 P1-08b+ 运行时向量检索上线（Cloudflare Workers AI bge-m3 + Atlas $vectorSearch，补回 v1.20.0 偏差，零成本）
- **动机 / 产品决策**：v1.20.0 因「运行时 Node/Render 无法取 query embedding」采用关键词兜底，但用户已离线用 bge-m3 把 两千余条 段向量算好存 Atlas，线上只用关键词"可惜"。用户拍板用上 embedding 检索，选定 **Cloudflare Workers AI `@cf/baai/bge-m3` 免费档**（维度 1024 与入库向量同空间、直接 $vectorSearch 比对、零重嵌、零质量损失、免费额度对个人作品集绰绰有余）。
- **改了什么（仅 `server/index.js` 的 `retrieveKnowledge`，其余零改）**：
  1. 新增 `embedWithCloudflare(text)`：调 Cloudflare `@cf/baai/bge-m3`，读 `[环境变量已脱敏]`/`[环境变量已脱敏]`，返回 [向量维度已脱敏]向量并显式 [源码位置] 归一化（幂等）；环境变量缺失或调用失败返 null。
  2. 新增 `vectorSearchChunks(queryVec, top)`：对 `knowledge_chunks` 跑 Atlas `$vectorSearch`（索引 `vector_index`，余弦，numCandidates=max(50,top*10)）。
  3. `retrieveKnowledge` 改为混合检索：① 人工知识 `knowledge(active)` 关键词命中（精选优先，权重基线 100+）② **向量语义主路**（Cloudflare 编码 query → $vectorSearch，权重 50+cosine*10）③ 关键词 chunk 兜底（仅向量不可用时）。去重（内容前 40 字）+ 排序 + 截断 top。
- **铁律守护**：`generateHandler` 零改；`生成规则模块` 零改；输出结构权重/内部结构标记/业务常量/评分十二维/前端三处注入点均未触碰；管理端知识库标签页 UI 未动。
- **偏差补回**：v1.20.0「实施偏差」标注的「未实现请求时 $vectorSearch」已正式补回——现为「向量语义主路 + 关键词兜底」混合，零成本、零重嵌。

### v1.21.1 知识库 tab UI 修复（下拉框深底浅字对比度 + 筛选栏分类/状态标签）
- **动机 / 产品决策**：v1.20.0 引入管理端「📚 知识库」标签页后，状态筛选下拉在 Windows 默认渲染下出现「白底 + 淡紫字」导致看不清；同时两个筛选栏并排无标签，用户无法一眼识别「分类」与「状态」。本版为纯视觉层修复，**不触及任何业务逻辑**。
- **改了什么（仅 `src/App.jsx` + `src/index.css`）**：
  1. `src/index.css`：强制 `select, option` 使用深底（`--bg-dropdown: #0c0a14`）+ 浅字（`#eceaff`），解决 Windows 原生下拉白底淡紫字不可读的问题。
  2. `src/App.jsx` 知识库筛选栏：为两个下拉框分别加「分类」「状态」文字标签，避免两个「全部」并列造成的歧义；同时调整布局使标签与下拉框对应关系清晰。
- **铁律守护**：`generateHandler` 零改；`生成规则模块` 零改；知识库 CRUD/检索/反馈沉淀等业务逻辑未动；访客端零改动。
- **提交**：已推送到 origin/main（`eae4069`）。

### v1.21.2 知识库状态文案中文化（生效中 / 待审 / 归档，value 保持英文）
- **动机 / 产品决策**：v1.21.1 上线后用户反馈知识库状态筛选栏里 `active/pending/archived` 英文看不懂，要求统一成中文。但数据库/接口层仍用英文枚举值（`active/pending/archived`），仅 UI 层做显示映射，保证后端数据契约不变。
- **改了什么（仅 `src/App.jsx`）**：
  1. 筛选栏 `<option value="active">生效中</option>` / `<option value="pending">待审</option>` / `<option value="archived">归档</option>`。
  2. 列表状态徽章同步映射：生效中 / 待审 / 归档。
  3. `value` 与徽章判断逻辑仍用英文枚举，接口请求/数据库写入不变。
- **铁律守护**：纯 UI 文案替换；`server/index.js` 零改；状态枚举值不变；接口契约不变；访客端零改动。

### v1.20.0 P1-08b RAG 资料结构化（KnowledgeModel + 检索端点 + 三处生成注入 + 反馈沉淀 + 管理端知识库标签页）
- **对应审计节点**：P1-08 拆出的 b 段（RAG 资料结构化）。在 P1-08a 看板诊断之后，正式引入「知识库」能力：把占卜领域知识结构化入库、检索接入生成（完整 RAG）、反馈自动沉淀为待审知识草稿。
- **动机 / 产品决策**：用户拍板「向量与结构化知识一起存云端 MongoDB Atlas 统一管理」——故采用 MongoDB Atlas Vector Search 形态（离线语料进 `knowledge_chunks`、管理端条目进 `knowledge` 集合，均含 `embedding` 字段），不单独部署 ChromaDB / 向量服务。决策已齐，本卡直接实施（详见《P1-08b-RAG资料结构化-实现指令.md》§十三）。
- **改了什么（后端 `server/index.js`）**：
  1. **`KnowledgeModel`（`knowledge` 集合，[源码位置]，置于既有 8 模型同区）**：`title`/`content`/`category`(牌意补充/话术规范/禁忌/客户常见Q/其他)/`tags`/`source`(manual/import/feedback)/`status`(pending/active/archived)/`relatedSpread`/`clientId`/`embedding`[Number 可空]/`embeddingModel`；建 `category`/`status`/`tags`/`updatedAt` 索引。`embedding` 取不到留 null，检索自动降级关键词。
  2. **检索端点 `GET /api/knowledge/retrieve`（[源码位置]，公开无 requireAuth，与生成同姿态）**：取 `status:"active"` 条目 + 离线语料 `knowledge_chunks`，中文 2–4 字滑窗分词重叠打分取 top-K，返回 `{items, context}`；Atlas 不可用 / 异常时返空、前端跳过注入（RAG 优雅降级）。**运行时零向量依赖**：query embedding 不在请求时取（决策§十三②禁止运行时调 embeddings 接口，且 Render 无 Python+bge-m3），离线 `vector_index` 与 `knowledge_chunks` 向量保留供离线工具 `rag_query.py` 使用。
  3. **管理端 CRUD + 批量导入（均 `requireAuth`）**：`GET /api/knowledge`（[源码位置]，列表+分类/状态/标签筛选）、`POST /api/knowledge`（[源码位置]，新建）、`PUT /api/knowledge/:id`（[源码位置]，编辑）、`DELETE /api/knowledge/:id`（[源码位置]，硬删）、`POST /api/knowledge/import`（[源码位置]，JSON 数组批量导入）。新建/导入 `embedding` 留 null、`embeddingModel:"BAAI/bge-m3"` 记录意图。
  4. **`POST /api/feedback` 反馈沉淀（[源码位置]，仍公开不阻塞主流程）**：`FeedbackModel.create` 之后追加 `KnowledgeModel.create`（`source:"feedback"`、`status:"pending"`、`category:"客户常见Q"`），各自 try/catch 互不影响；沉淀=养料，须人工升效才进检索，不反向改写 prompt（铁律守）。
- **改了什么（前端 `src/App.jsx`，仅管理端新增标签页 + 三处生成注入）**：
  1. **三处生成注入**（`fetchKbContext` 模块级辅助，[源码位置]）：访客生成（[源码位置]）/ 管理端生成（[源码位置]）拼接进 `[内部实现细节已脱敏]`；两处 `reviseOutput`（访客 [源码位置] / 管理端 [源码位置]）走单提示词模式、等价追加进修订提示。检索失败 catch 返空跳过，访客端零感知（`参考辅助资料` 标记仅进模型 system prompt，不进用户可见输出）。
  2. **管理端「📚 知识库」标签页**（仅管理端，[源码位置] 标题 + [源码位置] tab 按钮，与◫离线评测/数据看板并列）：列表（标题/分类/状态/来源/标签/更新时间）+ 分类/状态筛选 + 新建/编辑表单（title/content/category/tags/relatedSpread）+ 批量导入 + 状态流转（pending→active 升效 / archived 归档）+ 删除。新增 state（`kbList` 等 8 个）/ 取数函数（`fetchKnowledge`/`saveKnowledge`/`deleteKnowledge`/`setKbStatus`/`importKnowledge`/`openKnowledgeView` 等）。
- **实施偏差（透明标注）**：检索端点运行时采用 PRD §5.2/§5.4 明确保留的「关键词滑窗兜底」路径（始终可用、零向量依赖、生产可跑），**未在本卡内实现请求时 `$vectorSearch`**（因运行时 Node/Render 无法取 query embedding，决策§十三②禁止运行时调 embeddings 接口）。离线 `knowledge_chunks` 的 bge-m3 向量与 Atlas `vector_index` 已建（见《RAG入库SOP.md》+ `rag_query.py`），后续若需请求时向量检索，须另开变更评估「运行时 embedding 方案」（如服务端调用 embeddings 接口或本地模型），不在本卡范围。
- **未动清单**：`generateHandler`／`tarotPrompt.js`／输出结构权重／内部结构标记 解牌路由契约／业务常量／评分十二维／看板/异步评审。

---

## 2026-08-26

### v1.19.0 P1-08a 数据看板补全（质量分析层 A + 访客行为三率层 B + 访客漏斗具体化层 C）
- **对应审计节点**：P1-08 拆出的 a 段（先于 RAG 的 b 段）。在已上线的 P1-05 基础数据看板之上补全「质量分析 + 访客行为埋点 + 漏斗具体化」三类缺口。**不引入向量库、不抢 P1-08b（RAG）**。
- **动机 / 产品决策**：看板已上线但「输出质量总览 / 问题分类 / 牌阵 / 反馈热点」四块空白、访客行为三率（反馈率/二次生成率/保存到历史率）为占位、漏斗带「输入问题/选择牌阵无埋点」缺口说明。本版把看板从「流量概览」升级为「能回答哪类问题 AI 味最重、哪个牌阵输出最水、反馈集中在哪些痛点」的诊断工具。
- **改了什么（后端 `server/index.js`）**：
  1. **层 A `GET /api/stats-quality`（[源码位置]，requireAuth）**：聚合 `RatingModel` 十二维（键名逐字对应审计 §11，禁自造维度名）+ 按六类分类平均（爱情/事业/学业/人际/成长/运势 + 未分类）+ 按牌阵平均（降序 + 样本数）+ 规则检查合规率（`RuleCheckModel.manualStatus` 分布 + 失败率）+ 反馈热点（`manualStatus==='fail'` 或 `manualNote` 非空的 `manualNote` 滑窗 2–4 字分词高频词 TOP 12，无外部 NLP 依赖）。`try/catch` 返空结构非 500。
  2. **层 B 三率真实计算（[源码位置]+ `GET /api/stats`）**：`feedbackRate = visitor_feedback / visitor_generate`、`reviseRate = visitor_revise / visitor_generate`、`visitorSaveRate = visitor_save_history / visitor_view_result`；分母为 0 返 null、分母>0 分子为 0 返实数 0；`placeholders` 数组清空不再占位。
  3. **层 C 漏斗具体化（[源码位置]）**：重定义为无缺口 5 步（进入主界面 → 选择分类 → 抽牌 → 生成成功 → 保存历史），删原「点击生成」冗余步与「输入问题」独立步；前端每步显示首步 / 步进转化率（口径见前端块①）。
  4. **`EVENT_TYPES` 扩展**：`visitor_feedback` / `visitor_revise` / `visitor_save_history` 三类（前期已补，逐字小写下划线）。
  5. **新增 `POST /api/feedback`（[源码位置]，公开无 requireAuth，与 `/api/event` 同姿态）**：入参 `{sessionId, clientId, originalAnswer, revisedAnswer, feedbackText, category, spreadName}`，落 `FeedbackModel` 后返 `{ok:true}`、catch 防 500。因前端无法直接写 Mongo，`reviseOutput` 流结束新答案写入后 fire-and-forget 调用，为未来训练/分析铺数据；仅记录不注入知识库。
- **改了什么（前端 `src/App.jsx`，仅管理端「◫ 数据看板」）**：
  1. 三处静默发射（复用既有 `trackEvent` [源码位置]，封装 `POST /api/event` + `.catch`，无新 UI）：`visitor_save_history` 在 `saveSession` 写成功后（[源码位置]）；`visitor_feedback` 在反馈框**首次有效输入**时发（[源码位置]，ref 去重只发一次）；`visitor_revise` 在点提交 `reviseOutput` 时发（[源码位置]）。选项3 语义：`feedbackRate ≥ reviseRate`，差值 =「写了反馈但没触发二次生成」的访客，有分析价值；禁止「提交时两都发」恒等写法。
  2. `fetchStatsQuality`（[源码位置]）拉取层 A；`openDashboardView` 打开看板时一并加载。
  3. 六块渲染：① 访客漏斗具体化（删「输入问题/选择牌阵无埋点」缺口说明 + 每步首步/步进转化率）② 输出质量总览（十二维条形，<6.5 coral「偏弱」、≥8.5 teal「达标」）③ 问题分类维度（六类卡）④ 牌阵维度（降序表，最低分标「最水」）⑤ 反馈热点（高频词 chip + 失败原因）⑥ 访客行为真实三卡（反馈率/二次生成率/保存到历史率，角标「埋点已补·真实」）。
- **铁律守护（逐条）**：`generateHandler` 零改（diff 仅路由注册上下文，无函数体改动）；不碰 `生成规则模块`／输出结构权重／内部结构标记／解牌路由；C 端零新增可见 UI（三发射均为静默、复用既有 `trackEvent`）；十二维键名逐字对应审计 §11；不引入向量库、`FeedbackModel` 只记录不注入。
- **验证（法医 + 构建）**：`npm run build` 通过（32 modules，无错误）；`grep` 确认 `POST /api/feedback` 真在且 `FeedbackModel.create` 仅在其内；三发射命中 [源码位置]/[源码位置]/[源码位置] 均位于 `VisitorApp` 区间、无新按钮/入口；`stats-quality` 真在（[源码位置] 服务端 + [源码位置] 前端）；漏斗缺口说明已删；`generateHandler` 零改。运行时真跑（十二维与 `RatingModel` 抽样一致、三率与 `EventModel` 计数一致、C 端无新增看板 UI）归浏览器自查。
- **未动清单**：`generateHandler`／`tarotPrompt.js`／输出结构权重／内部结构标记 解牌路由契约未触碰；向量库/RAG 留 P1-08b；管理端整体重绘留 P1-08 之后。

## 2026-08-25

### v1.18.0 P1-07 离线批量评测与 prompt 版本管理（样例集 + 版本登记册 + 批量运行 + 版本对比，C 端不可见）
- **对应审计节点**：P1-07 离线批量评测 + prompt 版本管理（审计 v0.3 §389–394、验收 §862／§866）。建立在 P1-03（规则检查）／P1-04（质量记录）／P1-06（异步模型评审）之上，**不抢 P1-08（RAG 资料结构化）**。
- **动机 / 产品决策**：解决「输出标准没有量化、迭代记录分散在 AI 对话中、每次改 prompt 后难以比较效果」。建立「固定问题 + 牌阵 + 牌面 + 期望标准」的可重复测试集，并让每次 prompt 修改带版本号、评测结果与变更说明。
- **本版定位**：prompt 版本管理 = **版本登记册 + 按版本对比**，**不是运行时热替换 prompt 内容**。改 prompt 仍需改代码常量并重新部署。
- **改了什么（后端 `server/index.js`）**：
  1. **三个数据模型**：`BatchCaseModel`（样例集）、`PromptVersionModel`（版本登记册，`version` 建 unique 索引保证编号唯一）、`BatchRunModel`（运行结果，含 `sessionId`／`ruleCheckId`／`evaluationId` 用于关联既有管线）。三个文件降级常量 `batchcases.json`／`promptversions.json`／`batchruns.json`，与既有 `data.json`／`events.json`／`rulechecks.json` 同级
  2. **十条端点（全部 `requireAuth`）**：样例集 CRUD 四条（[源码位置]／946／967／991）、版本登记册三条（[源码位置]／1016／1038）、`POST /api/batch-eval/run`（[源码位置]）、`GET /api/batch-runs`（[源码位置]）、`GET /api/batch-eval/compare`（[源码位置]）
  3. **`runEvalGeneration(caseItem, [内部实现细节已脱敏])`（[源码位置]，方案 B）**：系统提示词由**第二个形参**传入（前端下发），缺失即抛错；调用形态参考 `callReviewModel`（`[内部实现细节已脱敏]` + 同款 OpenAI／Anthropic 格式探测），因批量评测需服务端拿到完整文本，不走 `generateHandler` 的流式 SSE 转发
  4. **`runBatchEval(caseItems, [内部实现细节已脱敏], versionLabel)`**：后台逐条跑，**单条失败 catch 后继续下一条**，不整体中断；复用而非重写既有管线——规则检查走 `runRuleChecks` + `appendRuleCheck`，模型评审走 `RatingModel.create` + `runModelReview`（P1-06 函数直接调用）；每条用 `batch-<uuid>` 作 `sessionId`，使管理端质量记录／模型评审可按 `batch-` 前缀区分离线评测与真实访客数据
  5. **可选版本标签**（2026-08-26 产品负责人批准的扩展）：`/api/batch-eval/run` 接受可选 `promptVersion` 入参，`ver = versionLabel?.trim() || PROMPT_VERSION`，传播至 `BatchRun`／`RuleCheck`／`Rating` 三处。**仅作归因标签，不改变实际使用的 prompt 内容**（内容始终来自前端下发的 `[内部实现细节已脱敏]`）。此扩展的必要性：`PROMPT_VERSION` 是代码常量，同一部署内跑两批评测版本号完全相同，`compare` 查不出差异，§866 验收将无法在单次部署内闭环
  6. **两处未被要求但必要的守护**：`run` 端点单次上限 50 条防误触巨额 token 消耗；`PUT /api/prompt-versions/:id` 设当前版本前先 `updateMany` 将其余 `isCurrent` 置 false，否则会出现多个「当前版本」
- **改了什么（前端 `src/App.jsx`）**：
  1. **15 个 state**（`beTab`／`beCases`／`beVersions`／`beRuns`／`beLoading`／`beSelCaseIds`／`beRunning`／`beVerLabel`／`beNewCase`／`beNewVer`／`beCmpCaseId`／`beCmpV1`／`beCmpV2`／`beCmpResult`／`beRunDetail`）  2. **离线评测管理**：管理端支持样例集、规则版本和批量运行结果的维护与比较。
  3. **`view === "batcheval"` 渲染分支（[源码位置]）+ 三子区**：
     - **样例集**（[源码位置]）：表格式列表（问题／分类／牌阵／牌面／期望标准／备注）+ 新增／编辑／删除；**内置 6 条预置样例**覆盖恋爱（维纳斯爱之牌阵）／事业（时间线分支）／学业（万能牌阵）／人际（二选一牌阵）／综合运势（时间流运势牌阵）／重点牌阵（凯尔特十字 11 张），空态时提供「写入 6 条预置样例」一键初始化
     - **prompt 版本**（[源码位置]）：列表（版本号／简称／说明／是否当前徽标）+ 新建（编号+简称+说明+设当前）+ 切换当前；顶部显式说明「不会在运行时替换 prompt 内容」
     - **批量运行与对比**（[源码位置]）：勾选样例（含全选）+ 可选版本标签输入 + 「运行选中」按钮（**确认弹窗明确提示将消耗模型调用与 token 成本**）；运行结果表（时间／问题／牌阵／版本／状态）可点入详情（规则检查逐项三色 + **复用 P1-06 `REVIEW_DIM_LABELS` 展示十二维** + 建议修正方向 + 输出文本经 `stripMarkers`）；版本对比区选同一样例 + 两个版本标签 → 并排展示两侧的规则检查三色计数、评分、十二维、输出文本
  4. **入口**：管理端客户列表页头部新增「◫ 离线评测」（[源码位置]），与「◧ 模型评审」「◫ 数据看板」「◔ 质量记录」并列，沿用管理端暗色 token
  5. **`[内部实现细节已脱敏]` 下发（方案 B 关键）**：`runBatchSelected` 发送 `[内部实现细节已脱敏]: 生成规则配置`，取自 `src/App.jsx` [源码位置] 既有 import
- **§2.3 铁律说明**：
  - **架构勘误已确认**：原指令假设 server 可 `import 生成规则模块`，实测不成立——`server/index.js` 从未 import 该模块（全文件 `tarotPrompt` 仅 [源码位置]／[源码位置] 两处注释），`generateHandler` 从 `req.body.[内部实现细节已脱敏]` 取词，server 是纯代理。故采用**方案 B**：server 不 import 客户端模块，避免引入 backend→frontend 耦合
  - **`generateHandler` 零改**：全文件定义数 = 1，函数体未改动
  - **`生成规则模块` 业务零改**：`git diff --stat 生成规则模块` 为空
- **业务代码**：未动。`generateHandler` / `生成规则模块` / 输出结构权重 [输出结构权重已脱敏] / 内部结构标记 标记 / `SPREADS`／`SPREAD_LAYOUTS`／`SPREAD_IMAGES`／`SPREAD_TOOLTIPS` / 解牌路由契约（`/api/generate`、`/api/generate-public`）/ 访客端与输出页 UI / `runEvaluation`／`newEvalSession` 静默触发 / 质量记录·模型评审·数据看板既有逻辑，全部零改动。
- **怎么验证**（全部实测）：
  - `npm run build` ✓ **876ms**（32 modules transformed，无新报错／警告）
  - **`generateHandler`**：定义数 = 1，函数体零改
  - **三模型**：`BatchCaseModel`／`PromptVersionModel`／`BatchRunModel` 各 1 处 `mongoose.model` 注册；`runModelReview` 定义数 = 1（复用未重写），在 `runBatchEval` [源码位置] 被调用
  - **前端**：「◫ 离线评测」入口 [源码位置]；`view === "batcheval"` 分支 [源码位置]；三子区 [源码位置]／[源码位置]／[源码位置]
  - **C 端零新增**：`VisitorApp` 区间（[源码位置]）内 `离线评测|batcheval|beTab|beCases|beVersions|beRuns|runBatchSelected|openBatchEvalView|batch-eval|batch-cases|prompt-versions` 匹配数 **0**
- **待人工验收（需真跑服务，Claude 无浏览器能力）**：① 样例 CRUD 与「写入 6 条预置样例」；② 版本新建／设当前（唯一性）；③ 批量运行产生 `BatchRun` 且关联 `RuleCheck` + `Rating`、十二维分数回填；④ 用两个不同版本标签各跑一次同一样例 → `compare` 并排显示差异（§866 闭环）；⑤ 访客端完整生成确认无任何评测／版本／批量 UI。
- **关联产物**：`server/index.js`、`src/App.jsx`。
- **提交状态**：按指令**未 commit、未 push**；`git rev-list --count origin/main..HEAD` = **0**（真实数字）。

### v1.17.0 管理端记录管理（质量记录 / 模型评审批量删除 + 左滑面板 + 双向级联清理）
- **类型**：管理端功能增量。**与 P1-07（离线批量评测 + prompt 版本管理）、P1-08（RAG 资料结构化）无关**，二者仍是独立路线图项。
- **动机 / 产品决策**：用户主动中断生成时，质量记录与模型评审会留下乱码与未完成（pending/failed）记录，需要人工选择性清理。用户原话要求：「在这两个功能里在右上角再加一个管理记录的功能，点击后左边弹出来一个小方框，点击可以选择，也有按钮可以全选，可以选择自己不需要的记录删除。」
- **不做（防画蛇添足）**：不新增「标记中断／异常」等根因溯源字段（用户只要求删除管理）；不重写两视图既有列表／详情；不做管理端整体重绘（已定 P1-08 之后统一进行）。
- **改了什么**（`server/index.js` + `src/App.jsx`）：
  1. **新增 `DELETE /api/rule-checks`**（[源码位置]，**requireAuth**）：入参 `{ids: checkId[]}`；Mongo 主路**先查 `sessionId` → 再删 → 最后级联** `RatingModel.deleteMany({sessionId:{$in:...}})`（顺序不可反，否则查不到关联，会留下孤儿记录使质量记录回退到「待 P1-06」占位）；文件降级路按 `checkId` 过滤 `rulechecks.json` 写回（评分仅存 Mongo，此路无需级联）
  2. **新增 `DELETE /api/evaluations`**（[源码位置]，**requireAuth**）：入参 `{ids: _id[]}`；同样先查 `sessionId` 再删再级联 `RuleCheckModel`；降级路按 `sessionId` 过滤 `rulechecks.json`，与上一路对称
  3. **新增 `validIdList()`**：两路由共用校验——必须为非空数组、≤200 条、每项为非空字符串；不合格返回 `{ok:true,skipped:true}`。两路由 `catch` 均返回 `{ok:true,skipped:true}`，**绝不 500**
  4. **前端新增 4 个 state**：`manageTarget`（null/"quality"/"review"）、`selRcIds`、`selEvIds`、`manageBusy`
  5. **前端新增 `deleteRecords(target, ids)`**：二次确认 → DELETE → 成功后清空选中并重取列表；失败静默不弹错
  6. **两个「管理记录」按钮**：模型评审视图 [源码位置]、质量记录视图 [源码位置]，均在刷新按钮左侧同一 flex 行，沿用 `btnGhost` 不引入新配色
  7. **左侧滑出管理面板**：遮罩（点击关闭）+ `fixed left:0 width:320` 面板（`stopPropagation` 防误关）；含标题／关闭按钮、全选复选框（`rows.length > 0 && selected.length === rows.length`）、可滚动逐条勾选列表、底部「删除选中（N）」按钮（空选或 `manageBusy` 时 disabled + 灰化 + `cursor:not-allowed`）
- **§3.4 偏差说明（已获产品负责人判定合规）**：指令要求把面板作为 `manageTarget && (...)` 挂在「管理端渲染区、两视图同级」。经核实**该位置不存在可行解**：`rcRows`/`rcTime` 定义在 `view === "quality"` 分支内（[源码位置]/[源码位置]）、`evTime` 定义在 `view === "review"` 分支内（[源码位置]），而两分支均为 early-return，不存在能同时访问这些变量的共享渲染区。改为组件作用域函数 `renderManagePanel(target, rows, fmtTime, getId, getLabel)`（[源码位置]），由两分支各自传入自身数据与时间格式化函数（[源码位置] / [源码位置]）。此做法**严格复用既有 `rcTime`/`evTime`，未新造时间格式函数**，且避免面板代码重复。
- **§3.2 修正记录**：指令原文要求 `credentials: "include"` 并称与既有取数函数一致。经核实不符——`fetchRuleChecks`（[源码位置]）与 `fetchEvaluations` 均用 `[内部实现细节已脱敏]: [内部实现细节已脱敏] ${localStorage.getItem("[内部实现细节已脱敏]")}`，全文件 `credentials` 出现次数为 0；后端 `requireAuth` 只读 `req.headers.[内部实现细节已脱敏]` 不读 cookie，照原文会导致两个 DELETE 被 401 拦下、功能失效。按指令自带回退条款「若现有取数函数用别的鉴权头，请对齐，不要自创」改用 [内部实现细节已脱敏] token。**产品负责人已确认此为指令笔误，本处理正确。**
- **业务代码**：未动。`generateHandler`（全文件仅 1 处定义、函数体零改动）/ `runModelReview`／`callReviewModel`／`parseReviewJson`（P1-06 终态，3 处均未改）/ `生成规则模块` / 输出结构权重 [输出结构权重已脱敏] / 内部结构标记 标记 / 解牌路由契约（`/api/generate`、`/api/generate-public`）/ 访客端与输出页 UI / `runEvaluation`／`newEvalSession` 静默触发（10 处调用点原样保留），全部零改动。
- **怎么验证**（全部实测）：
  - `npm run build` ✓ 1.27s（32 modules transformed，无新报错／警告）
  - **第 14 项 异常不崩**：空数组／非数组／含非字符串／无 ids 字段／超限 201 条，共 5 种畸形入参，两路由**全部返回 200 + `skipped:true`，零 500**
  - **第 11 项 双向级联**：方向 A 删质量记录（`checkId=d29b9faf…`）→ 该记录与同 `sessionId` 评审**同步消失**；方向 B 删评审（`_id=6a8ed06e…`）→ 评审与同 `sessionId` 质量记录**同步消失**。双向级联完整
  - **第 10 项 多条真删**：造 3 条 → 批量 DELETE 返回 `deleted:3` → 总数 12→9、测试记录残留 0
  - **测试记录已清理**：连同 P1-06 阶段遗留的 2 条评审记录一并删除；最终质量记录 9 条／评审 2 条，均为真实数据，`v1170-`／`p106-` 前缀残留均为 **0**
  - **C 端零新增**：`VisitorApp` 区间（[源码位置]）内 `管理记录|manageTarget|setManageTarget|renderManagePanel|selRcIds|selEvIds|manageBusy|deleteRecords` 匹配数 **0**
- **第 12–13 项说明**：全选与空选保护属纯前端交互，本地无浏览器无法点击复验，已做代码级核验（`allChecked` 计算 [源码位置]、全选 onChange [源码位置]、disabled 条件 [源码位置]）。实际点击行为待产品负责人浏览器自查。
- **待人工验收**：① 管理端两视图右上角「管理记录」可打开左滑面板；② 全选／取消全选、逐条勾选、删除计数、空选禁用；③ 删除后列表刷新且对端记录同步消失；④ 访客端完整生成 + 「根据反馈修改」确认无任何新增按钮／入口／数字。
- **关联产物**：`server/index.js`、`src/App.jsx`。
- **提交状态**：按指令**未 commit、未 push**；`git rev-list --count origin/main..HEAD` = **0**（真实数字）。工作区 2 个文件待提交。

### v1.16.0 P1-06 异步模型评审（评分闭环）v1（RatingModel 十二维异步评分 + 管理端模型评审标签页 + 质量记录接真实分数，C 端不可见）
- **对应审计节点**：P1-06 异步模型评审（审计 v0.3 [源码位置]、§11 [源码位置] 评分表维度细化）；PRD §9.3 方案二（[源码位置]）、§10.5 质量层 [源码位置]、§12.5 [源码位置]（失败重试最多 2 次）；`输出结构保真对照表.md` §0/§2。
- **动机 / 产品决策**：把输出质量从「纯规则检查」升级为「规则检查 + 模型评审」双路闭环，用审计 §11 十二维为每次生成打结构化分（1/3/5），为 prompt 改版提供系统性依据（审计 [源码位置]）。铁律：异步非阻塞、C 端零 UI、不碰业务解牌、评分非绝对真值、**禁止编造分数**（pending/failed 显式状态）、不抢做 P1-07/P1-08。
- **改了什么**（`server/index.js` + `src/App.jsx`，**未碰 generateHandler / tarotPrompt.js / 输出结构权重 / 内部结构标记 / 解牌路由**）：
  1. **扩展 `RatingModel`**：补 `strict:false` + `status`（enum pending/completed/failed）/`promptVersion`/`source`/`question`/`category`/`spreadName`/`cards`/`outputTextSnapshot`/`hallucinationRisk`/`reviewComment`/`[内部实现细节已脱敏]`/`[内部实现细节已脱敏]`；**十二维键名逐字保留未动**；新增 `createdAt`/`reviewer`/`sessionId` 三个索引  2. **新增评审引擎**：后台异步执行结构化质量评审，失败可重试并保留失败状态，不阻塞主生成。  3. **接入后台评审链路**：主结果先展示，评审结果异步写入管理端质量记录，评审不可用时不影响用户查看结果。、`GET /api/evaluations`（[源码位置]，requireAuth，仅取 `reviewer:"model"`，按 createdAt 倒序）、`GET /api/evaluations/:id`（[源码位置]，requireAuth，未找到返回 404）
  4. **`sessionId` 关联链接通**：`/api/rule-check` 从 body 解出 `sessionId` 并透传给 `appendRuleCheck`（原先未接，关联会断）
  5. **前端 `runEvaluation()`**（[源码位置]）镜像 `runRuleCheck`，fire-and-forget；新增 `newEvalSession()`（[源码位置]）生成一次性 UUID，**同一次生成的规则检查与评审共用同一 sessionId**；在 4 个生成完成点接入（访客首次 [源码位置]、访客二次 [源码位置]、管理端首次 [源码位置]、管理端二次 [源码位置]）
  6. **质量记录接真实分数**：`fetchRuleChecks` 并取 `/api/evaluations` 建 `evalMap`（同 sessionId 取最新）；两处「待 P1-06」占位替换为真实状态——详情区按 pending/failed/completed 分别渲染「评审中…」/「评审未完成」/「总分 N 分 + 十二维明细 + 建议修正方向」；列表单元格同理显示「N 分」/「评审中…」/「评审未完成」；**无关联评审的旧记录保留「待 P1-06」并注明产生于 P1-06 之前**
  7. **新增管理端「模型评审」标签页**（`view === "review"`，入口「◧ 模型评审」）：列表（时间/牌阵/分类/状态/总分/prompt 版本）+ 详情（本次生成上下文、十二维网格按分着色 5=绿/3=黄/1=红、总分、提示风险、重试次数、建议修正方向、输出文本经 `stripMarkers`）+ 空态与加载态
  8. **新增 `REVIEW_DIM_LABELS`**（前端 [源码位置]）与 `REVIEW_DIMS`（后端 [源码位置]）：十二维键名与中文标签逐字对照审计 §11.1–§11.12，顺序即审计顺序
  9. **开关**：`ENABLE_MODEL_REVIEW=false` 整体关闭评审（省 token）；`REVIEW_MODEL` 指定评审专用模型（默认回退 `API_MODEL`）
- **业务代码**：未动。`generateHandler`（全文件仅 1 处定义，内部未改）/ `生成规则模块` / 输出结构权重 [输出结构权重已脱敏] / 内部结构标记 标记 / 解牌路由契约（`/api/generate`、`/api/generate-public`）/ 访客端与输出页 UI / 质量记录与数据看板既有逻辑（仅替换占位、新增入口），全部零改动。
- **怎么验证**（全部实测，非口述）：
  - `npm run build` ✓ 3.89s（32 modules transformed，无警告）
  - **pending→completed 真通**：`POST` 立即返回 `{ok:true,evaluationId}` 且记录 `status:pending`/`score:null`（证明 fire-and-forget）；约 25 秒后 `status:completed`、**十二维 12/12 齐全**、`score:3.17`（∈[1,5]）、`hallucinationRisk:"low"`（∈枚举）、`reviewComment` 88 字中文、`[内部实现细节已脱敏]:0`。评审判分合理可信——样例故意只写 1 张牌就跳总结，模型对 `cardCompleteness`/`element`/`numerology`/`cardInteraction` 均判 1 分，评语准确指出「解读仅覆盖了第一张牌」
  - **重试与失败**：临时改错 `[环境变量已脱敏]` 重启 → `POST` 仍返回 200（不 500）；约 30 秒后 `status:"failed"`、`[内部实现细节已脱敏]:2`、`[内部实现细节已脱敏]:"review upstream 401"`，**服务仍在监听未崩**
  - **开关**：追加 `ENABLE_MODEL_REVIEW=false` 重启 → `POST` 返回 `{ok:true,skipped:true}`、无 `evaluationId`、库中未产生该记录
  - **C 端零新增核验**：`VisitorApp` 区间（[源码位置]）内 `模型评审|evalMap|evSelected|REVIEW_DIM_LABELS|fetchEvaluations|openReviewView|view === "review"` 匹配数 **0**
- **待人工验收**：浏览器走查——① 访客端完整生成 + 「根据反馈修改」，确认无任何新增评审 UI／数字／入口，解读照常且未变慢；② 管理端「模型评审」标签页列表与详情、质量记录里的真实分数显示。
- **关联产物**：`server/index.js`、`src/App.jsx`。
- **提交状态**：按指令**未 commit、未 push**；`git rev-list --count origin/main..HEAD` = **0**（真实数字，此前历史虚报已纠正）。工作区有 2 个文件待提交。

### v1.15.0 P1-05 基础数据看板 v1（埋点迁 Mongo + 管理端看板：访问/生成成功率/失败率/牌阵分布/漏斗，C 端不可见）
- **对应审计节点**：P1-05 基础数据看板 v1（审计 v0.3 §6.2 [源码位置]、验收 [源码位置]）；PRD §4.2/[源码位置]、§10.5/[源码位置]、漏斗/质量层 [源码位置]、需求卡 [源码位置]。
- **动机 / 产品决策**：把 P1-02 埋点转化为管理端可见的匿名聚合指标，解决"没有流量监测、数据看板、漏斗判断"（审计 [源码位置]/[源码位置]/[源码位置]）；并将埋点事件从 `events.json` 迁到 MongoDB（用户 2026-08-26 决策），使看板数据跨部署持久保留。铁律：只加管理端看板、C 端零新增、不碰业务解牌、v1 不做增长归因/用户画像/付费转化、**禁止编造算不出的指标**（占位「待埋点补全」）。
- **改了什么**（`server/index.js` + `src/App.jsx`，**未碰业务解牌**）：
  1. **埋点迁 Mongo（六处联动改动）**：新增 `EventModel`（`strict:false` + `ts:-1`/`type:1` 索引），字段与既有 `appendEvent` 写入结构一一对应，不破坏数据形状；`readEvents()` 改 `async` 双路（Mongo 按 `ts` 倒序优先，失败降级 `events.json`）；`appendEvent()` 改 `async` 双路（`EventModel.create` 优先，失败降级写文件）；**降级分支改为直接读文件而非回调 `readEvents()`** —— 否则降级时会重新命中 Mongo 造成循环；`POST /api/event` 改 fire-and-forget（`appendEvent(e).catch(()=>{})`），响应不被写库阻塞；`GET /api/events` 补 `await`。**不做历史迁移**（Mongo 为空即起点，`events.json` 旧数据保留不动）
  2. **新增 `GET /api/stats`（requireAuth）**：支持 `?from=&to=` 毫秒时间戳筛选；真实指标 `pv` / `uv`（去重 `sessionId`）/ `generateTotal` / `generateSuccess` / `successRate`（仅访客端口径，无分母返回 `null` 而非 0）/ `errorCount` / `errorRate`（**v1 粗略代理，未做会话级关联**）/ `spreadDist` / `categoryDist` / `funnel` 五阶段 / `exitCount` / `totalEvents`；`distBy` 只统计确实带该字段的事件，缺字段归入「未记录」，**不臆造牌阵名**；`catch` 返回空指标对象而非 500
  3. **`placeholders` 机制**：返回 `["feedbackRate","reviseRate","visitorSaveRate"]` 告知前端哪些不可计算（当前埋点无 feedback/revise 事件类型，访客保存走 localStorage 无服务端事件）
  4. **管理端新增「数据看板」标签页**（`view === "dashboard"`）：3 个 state + `fetchStats`（带 token，支持全部/近7天/近30天）+ `openDashboardView`；概览卡片 5 项（比率无分母显示「—」）；访客漏斗条形图并**明确标注「输入问题/选择牌阵两步无独立埋点，未补数」**；牌阵分布与事件分类分布（按计数降序）；**待埋点补全区三项均显示占位文案、不显示任何数字**；空状态显示「暂无埋点数据」，不用 0 伪装成有数据
  5. **入口**：客户列表页头部新增「◫ 数据看板」按钮，与「◔ 质量记录」并列，未改其他 tab 逻辑与样式
- **业务代码**：未动。`generateHandler` / `生成规则模块` / 输出结构权重 [输出结构权重已脱敏] / 内部结构标记 标记 / 解牌路由契约（`/api/generate`、`/api/generate-public`）/ 访客端与输出页 UI / 质量记录模块，全部零改动。
- **怎么验证**：
  - `npm run build` ✓ 872ms（32 modules transformed，无警告）
  - **Mongo 迁库实测**：`POST /api/event` → 200 后直查 `events` 集合可见该条；返回记录含 `clientId: ""` —— 该字段 POST body 未传、`/api/event` 构造时也没有，**只能由 `eventSchema` 默认值产生，反证确实走了 Mongo**；`events.json` 保持 17 条未动（符合「不做历史迁移」）
  - **口径对照实测（审计 [源码位置]）**：造 8 条覆盖漏斗各阶段的事件后，`GET /api/stats` 与 `GET /api/events` 手算逐项比对——`pv`(2) / `uv`(3) / `generateTotal`(2) / `generateSuccess`(1) / `errorCount`(1) / `exitCount`(1) / `funnel` 五阶段 / `totalEvents`(9) **12 项全部一致**；`successRate`(0.5) 与 `errorRate`(0.5) 手算与看板一致
  - **空数据实测**：`?from=` 未来时间戳 → `totalEvents:0`、`successRate:null`、`errorRate:null`、`spreadDist:{}`，**返回 null 而非 0 伪装**
  - **C 端零新增核验**：`VisitorApp` 区间（[源码位置]）内 `数据看板|fetchStats|statsRange|待埋点补全|openDashboardView|view === "dashboard"` 匹配数 **0**
- **待人工验收**：浏览器走查——① 访客端完整生成 + 输出页确认无任何新增看板 UI／数字／入口；② 管理端「数据看板」标签页概览/分布/漏斗/占位/空状态正常（Claude 无浏览器能力）。
- **关联产物**：`server/index.js`、`src/App.jsx`。
- **本地 commit**：`3d05dc3`（2 files changed，+262 −6）。**未 push**。

### v1.14.1 访客端移除「✎ 编辑文字」直接编辑（C 端不编辑铁律）
- **动机 / 产品决策**：用户发现访客输出页存在「✎ 编辑文字」按钮，点开后输出按十模块切成可编辑块（即"以前的卡片状"），违反铁律「C 端不允许编辑文字、不允许出现卡牌内容」。git 溯源确认该直接编辑能力来自用户自己的 v1.10.1（A10-02 输出阅读/二次生成 UI，commit 5fbc35a），非 Claude P1 回归。按用户决定：移除直接编辑，保留「根据反馈修改」（反馈→二次生成，非直接改字）。
- **改了什么**（仅 `src/App.jsx` 访客输出区）：
  1. 删除访客端 `✎ 编辑文字` 按钮及其 `editMode` 块编辑视图分支（原 [源码位置] 三元结构），该分支把输出按十模块切为带标签 textarea 块（如"牌面解读（第1张）"）= 用户所见"卡片状"
  2. 保留默认连续文本阅读视图（`stripMarkers(editableOutput)`，无标签无边框）
  3. **保留**「根据反馈修改」按钮（reviseOutput，反馈→二次生成）
  4. 管理端编辑能力未动（管理端本可编辑客户解读）
- **业务代码**：未动 generateHandler / tarotPrompt.js / 输出结构权重 / [内部标记] 标记 / 解牌路由契约；v1.14.0 质检能力未受影响。
- **关联产物**：`src/App.jsx`。**未 push**。

### v1.14.0 P1-04 管理端质量记录测试模块 v1（质量记录列表+详情+人工评语，C 端不可见）
- **对应审计节点**：P1-04 管理端质量记录测试模块 v1（审计 v0.3 §6.2 / [源码位置]、[源码位置]、[源码位置]、验收 [源码位置]）；PRD `03-PRD/tarot-assistant-prd-v0.2.md` §4.2/[源码位置]、§6.2/[源码位置]、§6.2 管理端最小界面/[源码位置]、§9.3/[源码位置]。
- **动机 / 产品决策**：把 P1-03 攒下的规则检查结果在管理端可视化，并支持人工评语与标记，形成可追溯质量记录。铁律：只加**管理端**查看/评语能力，**C 端零新增**（不展示任何质检分/提示/入口）、**v1 不做自动模型评审**（不调评审模型、不编造任何分数，那是 P1-06）、不碰业务解牌代码、测试模块独立不与客户档案强耦合（PRD [源码位置]）。
- **改了什么**（`server/index.js` + `src/App.jsx`，**未碰业务解牌**）：
  1. **扩展 `RuleCheck` 持久化结构**（复用 P1-03 的 `rulechecks` 集合 / `rulechecks.json` 降级，未新建文件）：新增 `question` / `outputText` / `cardNames` / `manualStatus`（enum `pending|pass|fail`，默认 `pending`）/ `manualNote`（默认 `""`）。schema 加 `{ strict: false }` 与逐字段默认值，**P1-03 旧记录缺字段不报错**（向前兼容）；新增 `manualStatus` 索引
  2. **`POST /api/rule-check` 接收并落盘新字段**：`outputText` 缺省回退为 `text`；`manualStatus` / `manualNote` 显式初始化
  3. **新增 `PUT /api/rule-checks/:checkId`（requireAuth）**：`manualStatus` 走白名单校验、`manualNote` 仅接受字符串（畸形 body 无法写脏数据）、无有效字段时返回 `{ok:true,skipped:true}` 不动记录、双路降级（Mongo `findOneAndUpdate` / `rulechecks.json` 按 `checkId` 定位后写回）、`checkId` 未找到返回 404、**catch 返回 200 不 500**
  4. **前端 4 处 `runRuleCheck` 钩子补传 `question` / `outputText`**（访客 generate、访客 reviseOutput、管理端 generate、管理端 reviseOutput）——仅采集，无任何 C 端展示
  5. **管理端新增独立「质量记录」标签页**（`view === "quality"`）：
     - 数据层：`fetchRuleChecks`（带 token，时间倒序兜底排序——Mongo 已排序但 json 降级路径未排序）、`openQualityView`、`saveManualReview`（**乐观更新**列表与详情，避免整表重取）
     - 列表：时间（倒序）/ 牌阵 / 规则检查结果三色徽标（🟢pass · 🟡risk · 🔴fail）/ 人工状态（待评·通过·失败）/ **评审列固定「待 P1-06」灰字占位** / prompt 版本；含牌阵筛选、刷新按钮、加载态与空态
     - 详情：本次输入（时间·来源·问题·牌阵·分类·牌面）/ 规则检查明细（逐项 `label`+`status` 三色+`detail`）/ 输出文本（`maxHeight:320` 滚动区，经 `stripMarkers` 剥离 内部结构标记）/ 人工评语输入框 + 「标记通过 / 标记失败 / 仅存评语」三按钮 / 模型评审占位块
     - 入口：客户列表页头部新增「◔ 质量记录」按钮，与既有导出/导入/退出并列，**未改其他 tab 逻辑与样式**
  6. **v1 全程未产生任何模型评分**：评审列与详情评审块均为占位文案，代码中无任何分数计算或伪造
- **业务代码**：未动。**`generateHandler` 一行未改**；`生成规则模块` / 输出结构权重 [输出结构权重已脱敏] / 内部结构标记 标记 / 解牌路由契约（`/api/generate`、`/api/generate-public` 入参出参）/ 访客端与输出页 UI / `RatingModel` 十二维，全部零改动。
- **怎么验证**：
  - `npm run build` ✓ 1.27s（32 modules transformed，无警告）
- 使用脱敏测试样例完成质量记录接口的新增、查询与人工标记验证。
  - **重启持久化通过**（对齐审计验收 [源码位置]）：kill 服务进程后重启，`GET` 仍返回 4 条、其中人工评语记录 1 条完好
  - **C 端零新增核验**：`VisitorApp` 区间（[源码位置]）内 `质量记录|规则检查|manualStatus|rcSelected|待 P1-06|质检` 匹配数 **0**；所有质检 UI 标识均在 [源码位置] 之后的管理端区（[源码位置] 为注释）
- **待人工验收**：浏览器走查——① 访客端完整生成 + 输出页确认无任何新增质检 UI／分数／提示；② 管理端「质量记录」标签页列表与详情正常、人工评语可保存（Claude 无浏览器能力）。
- **关联产物**：`server/index.js`、`src/App.jsx`。
- **本地 commit**：`cc7ce43`（2 files changed，+268 −4）。**未 push**。

### v1.13.0 P1-03 规则自动检查（POST /api/rule-check + runRuleChecks + 10 项规则 + 双路持久化）
- **对应审计节点**：P1-03 规则自动检查（审计 v0.3 §6.2）；PRD `03-PRD/tarot-assistant-prd-v0.2.md` §9.2。
- **动机 / 产品决策**：把输出质量从纯 prompt 依赖升级为「可量化规则检查」，为 P1-04 质量记录模块 / P1-06 异步评审攒结构化质检数据。铁律：只加数据层/质检能力，**禁止任何 C 端 UI**（不展示质检分/提示/按钮/loading）、**禁止阻断主结果**、**禁止改 generateHandler / tarotPrompt.js / 输出结构权重 / 业务路由契约**、本轮不做模型评审（那是 P1-06）。
- **改了什么**（`server/ruleChecks.js` 新建 + `server/index.js` + `src/App.jsx` + `.gitignore`，**未碰业务代码**）：
  1. **`server/ruleChecks.js`（新建）**：`runRuleChecks(text, ctx)` 逐项实现 PRD §9.2 十项，每项返回 `{key,label,status,detail}`，三态 `pass|risk|fail`
     - `perCardMinLength`（每张牌字数下限，按 `cardNames.length` 或牌阵推断牌数，下限 220 字／牌，只 `risk` 不 `fail`，长度受模型影响）
     - `forbiddenWords`（违禁词，命中 `fail`）、`markdownSymbols`（`#`/`**`/反引号/行首 `- `/`>`/`===`，命中 `fail`）、`decorativeSymbols`（`✦★☆◆▶❖═─│` 等，命中 `fail`）
     - `positionTitlesPresent`（12 个已知牌阵的位置标题清单，缺失只 `risk`）
     - `disclaimerPresent`（**遵守 PRD §8.4 分流**：`isFirstTime || isDecisionQuestion` 且缺失 → `fail`；老用户且非决策问题缺失 → 仅 `risk`）
     - `noDecisionForUser`（"你应该/你一定要/你需要去/你务必/建议你去"，命中 `fail`）
     - `noEmptyQuestionExpression`（`hasQuestion===false` 时检"根据你的问题/你问的"等，命中 `fail`）
     - `coversEachCard`（逐牌名覆盖，允许意译，缺失只 `risk`）
     - `hallucinationWeak`（"可能是/你内心深处/你潜意识"等，**只 `risk`、绝不 `fail`、绝不扣分**——PRD §9.2 明示误报率高，扣分须由 P1-06 模型评审确认）
     - **违禁词清单来源**：`生成规则模块` [源码位置]【禁止求证结尾】、[源码位置]【绝对禁用说教指导词汇】、[源码位置]【说教识别规则（最高优先级）】，作为可扩展常量 `FORBIDDEN_PATTERNS` / `VERIFICATION_PATTERNS`，逐条注释标注出处行号
     - **检查前剥离 内部结构标记 结构标记**，避免系统标记本身触发符号类规则（已用例验证）
     - 纯本地、同步、毫秒级，**不调用任何模型 API**
  2. **`PROMPT_VERSION = "1.10.0"` 常量**（对应 v1.10.0「输出结构系统化重构」版，即十模块骨架 + 内部结构标记 标记那一版）；每次 `tarotPrompt.js` 结构性改版时手动递增，用于质检记录的版本归因
  3. **`POST /api/rule-check`（公开端点，与 `POST /api/event` 同权，访客端也要打）**：入参全部可选（`text` / `spreadName` / `category` / `source` / `hasQuestion` / `isFirstTime` / `isDecisionQuestion` / `cardNames`），缺省走宽松判定；`promptVersion` **由服务端自动填充**，客户端无需传；返回 `{checks:[...], summary:{pass,risk,fail,total}}`；**catch 分支返回 `200 {ok:true,skipped:true}` 而非 500**——质检异常绝不阻断用户查看主结果
  4. **`GET /api/rule-checks`（requireAuth，与 `GET /api/events` 同权）**：返回全部质检记录，供 P1-04 管理端模块消费
  5. **双路持久化**（复用 v1.11.0 的 `useMongo && mongoReady` 开关 + v1.12.0 的文件降级写法）：Mongo 就绪 → `RuleCheckModel`（`rulechecks` 集合，字段 `checkId/source/promptVersion/spreadName/category/hasQuestion/createdAt/result`，`createdAt: -1` 与 `promptVersion: 1` 双索引）；未就绪 → 降级写 `server/rulechecks.json`，`readRuleChecks()/appendRuleCheck()` 沿用 `readEvents/appendEvent` 的 try/catch 静默写法
  6. **前端 `runRuleCheck(text, ctx)`**（`src/App.jsx` [源码位置]，紧邻 `trackEvent`）：fire-and-forget，`.catch(()=>{})` 失败静默；新增 `DECISION_Q_RE` 常量判定求决策问题
  7. **4 处钩子**（均在生成流 `while` 结束、`fullOutput`/`revised` 完全拼好之后追加一行）：访客端 `generate`（[源码位置]）、访客端 `reviseOutput`（[源码位置]）、管理端 `generate`（[源码位置]）、管理端 `reviseOutput`（[源码位置]）。**未新增任何 state、按钮或显示文案**
  8. **`.gitignore`**：追加 `server/rulechecks.json`（本地降级产物，Mongo 就绪时走库）
- **业务代码**：未动。**`generateHandler`（`server/index.js`）流式逻辑一行未改**（规则检查是完全独立的端点，不在流式里插逻辑）；`生成规则模块` / 输出结构权重 [输出结构权重已脱敏] / 内部结构标记 标记 / 解牌路由契约（`/api/generate`、`/api/generate-public` 入参出参）/ 访客端与输出页 UI，全部零改动。
- **怎么验证**：
  - `npm run build` ✓ 1.26s（32 modules transformed，无警告）
  - **9 个规则用例全部通过**（临时脚本 `_test_rulechecks.mjs` 直连模块测试，验证后已删）：违禁词+替用户决定+Markdown 三项同时 `fail`、装饰符号 `fail`+脑补 `risk`、免责四态（首次缺失=`fail` / 老用户非决策缺失=`risk` / 含关键词=`pass`）、空问题禁止表达 `fail`、逐牌覆盖 `risk`、牌阵位置标题 `pass`、内部结构标记 标记不触发符号规则
  - **一处测试方法说明**：首次 `curl` 时 Git Bash 破坏 UTF-8 中文，导致中文违禁词规则未命中（返回体里 `牌阵「������ʮ��」` 即证据），ASCII 的 `**` 正常命中。改用 Node 直连模块测试后中文规则全部正确 `fail`。这是测试环境编码问题，非代码缺陷。
- **待人工验收**：浏览器走查一次完整生成，确认 **C 端界面无任何新增质检 UI／分数／提示**、解读照常完整显示（Claude 无浏览器能力，需产品负责人自查）。
- **关联产物**：`server/ruleChecks.js`（新建）、`server/index.js`、`src/App.jsx`、`.gitignore`。
- **本地 commit**：`ba9dcaa`（4 files changed，+408）。**未 push**（建议与 v1.12.0 埋点一起推）。

### v1.12.0 P1-02 基础埋点（/api/event + trackEvent + 12 项白名单）
- **对应审计节点**：P1-02 基础埋点（为以后看板 + 质量闭环攒行为数据）。
- **动机 / 产品决策**：客户档案与解读数据需要行为层补充——记录"谁（访客/管理端）在何时做了什么动作"，为后续数据看板、质量分析提供原始素材。铁律：只加数据层/埋点能力，**禁止任何 UI**（不建看板、不加按钮、不显示"已记录"）、**禁止改业务解牌代码**、**禁止接 MongoDB**（仍走 events.json 降级，P1-04/06 才上库）、所有打点静默、失败不影响主流程。
- **改了什么**（`server/index.js` + `src/App.jsx` + `.gitignore`，均在管理端/数据层范围内，**未碰业务代码**）：
  1. **后端事件存储**：`EVENTS_FILE = events.json`（与 `data.json` 平行，互不污染）；`readEvents()`（文件不存在返回 `[]`）、`appendEvent(e)`（读→push→写，沿用 readClients/writeClients 的 try/catch 静默写法）
  2. **白名单常量** `EVENT_TYPES`（12 项）：`visitor_category_select` / `visitor_draw` / `visitor_generate` / `visitor_view_result` / `visitor_exit` / `admin_client_add` / `admin_client_delete` / `admin_generate` / `admin_export` / `page_view_visitor` / `page_view_admin` / `error_occurred`
  3. **`POST /api/event`（无鉴权，访客端也要打点）**：校验 `type ∈ EVENT_TYPES` 否则 400 静默丢弃；`payload` JSON.stringify 后限 2048 字节，超限 400；构造 `{ id: crypto.randomUUID(), type, ts: Date.now(), sessionId, payload }` 落盘（后端无 `uid()`，改用 Node 内置 `crypto.randomUUID()`）；catch 分支返回 200 而非 500——埋点失败绝不能让占卜流程感知异常
  4. **`GET /api/events`（requireAuth，管理端未来看板用）**：返回全量事件数组
  5. **前端 `trackEvent(type, payload, sessionId)`**（`src/App.jsx` [源码位置]，`uid()` 之后）：`fetch("/api/event", {method:"POST", headers, body}).catch(()=>{})` 失败静默
  6. **11 个业务打点 + 2 个错误分支**（均在原有语句后追加一行，未改业务逻辑）：访客端分类选择 / 抽牌 / 生成解读 + 查看结果 / 页面卸载；管理端建档 / 删客户 / 生成 / 导出；两端首页加载；generate 与 export 的 catch 分支记 `error_occurred`。未新增任何 state、按钮或显示文案
  7. **`.gitignore`**：新增 `server/events.json` 忽略（埋点数据为本地测试产物，与 data.json 同级）
- **业务代码**：未动。解牌流程 / `生成规则模块` / 输出结构权重 / 内部结构标记 标记 / 数据层 schema / `/api/clients` 等路由契约，全部零改动。
- **⚠️ 已知限制（非本轮遗漏）**：`events.json` 与 `data.json` 同源——**Render 云端每次重新部署会清空**，本地存的数据不会同步到线上。这是"无数据库"老问题在埋点上的体现，待 P1-04 接 MongoDB 后统一改为持久存储；本轮不解决持久化
- **关联产物**：`server/index.js`、`src/App.jsx`、`.gitignore`
- **本地 commit**：`ea0fc2c`（3 files changed，+94 −2）。**未 push**（与后续 P1-04 一起推）。

### v1.11.0 P1-01 数据库接入（MongoDB 激活 + 四实体建模 + 迁移/备份 + 降级）
- **对应审计节点**：P1-01 数据库方案选择（`01-审计/tarot-assistant-audit-v0.3.md` §6.2）；PRD `03-PRD/P1-01-数据库方案选择-PRD.md`（已批准）。
- **动机**：客户档案此前只存 `server/data.json`，无备份、无索引、无查询能力，P1-02~P1-08 全部依赖一个稳定存储。本轮打地基。
- **前提**：`server/index.js` 已预埋 MongoDB 雏形（mongoose import / useMongo 开关 / clientSchema / readClients-writeClients 双路），本次为**补完并激活**，不是从零写。
- **数据模型决策**：Session 以 `Client.sessions` **嵌套数组**承载，不另建集合（与现有 data.json 结构和代码一致，零迁移成本）。PRD §3.2 独立集合方案与 §5 拆两集合方案已同步作废，`clientId: ObjectId` 字段废弃。Feedback / Rating 仍为**独立集合**，通过 `clientId` + `sessionId` 关联嵌套 session。四数据概念（Client / Session / Feedback / Rating）均已落地。
- **改了什么**（`server/index.js` 数据层 + `src/App.jsx` 建档表单最小字段 + `.gitignore`）：
  1. **A1 降级开关增强**：`const useMongo` → `let useMongo`，新增 `let mongoReady = false`；连接成功置 `mongoReady = true` 并打印「✅ MongoDB 已连接」，失败则 `useMongo = false` + 打印「❌ MongoDB 连接失败，降级到 data.json」；`readClients` / `writeClients` 判断由 `if (useMongo)` 收紧为 `if (useMongo && mongoReady)`，避免连接中途请求打到未就绪的 Model
  2. **A2 clientSchema 扩充**：补 `gender`（enum 男/女/未知，default 未知）、`tags`（[String]，default []）、`createdAt`、`updatedAt`；`sessions` 类型由 `Mixed` 收紧为 `[Mixed]`；加三索引 `name: 1` / `gender: 1` / `updatedAt: -1`
  3. **A3 两个独立集合**：`FeedbackModel`（clientId / sessionId / originalAnswer / revisedAnswer / feedbackText / createdAt）；`RatingModel`（`dimensions` 九维 + `score` + `reviewer` enum self/peer/model + createdAt）
  4. **评分维度对照保真表 §11**：`RatingModel.dimensions` 共 12 项，逐一对应《审计 v0.3》§11「评分表维度细化」——`questionRelevance`(§11.1 问题相关性) / `cardPosition`(§11.2 牌阵位置对应) / `cardCompleteness`(§11.3 逐张牌解读完整度) / `element`(§11.4 元素解读) / `numerology`(§11.5 灵数变化解读) / `imageryFigure`(§11.6 画面和人物分析) / `cardInteraction`(§11.7 牌与牌交互关系) / `eventMapping`(§11.8 事件映射) / `disclaimer`(§11.9 免责声明和边界) / `adviceQuality`(§11.10 建议质量) / `emotionValue`(§11.11 情绪价值) / `formatCompliance`(§11.12 格式合规)。**更正**：v1.11.0 初版误将维度自造为 9 个且记录中谎称「对应§8 九项」，已于 **v1.11.3** 按 §11 修正为 12 项（见下）。打分阈值 / 各维权重 / 总分聚合公式 / 由谁评，全部留待 P1-06，本轮只建结构
  5. **A4 路由自决**：暂不暴露 `/api/feedback`、`/api/ratings`，只建 Model。理由：实际写入发生在 P1-04（反馈链）与 P1-06（评分）实现时，届时直接 `new FeedbackModel().save()`；现在暴露端点需额外定义请求体校验与错误处理而前端不会调用，属无用复杂度。已获产品负责人认可
  6. **迁移脚本** `_migrate_to_mongo.cjs`：读 `server/data.json` → `insertMany` 到 Client 集合（保留 sessions 嵌套）；缺字段自动补默认值（gender 未知 / tags [] / 时间戳）；`ordered: false` 容错单条失败；**不删原文件**；无 data.json 则打印「无历史数据，跳过迁移」干净退出
  7. **备份脚本** `_backup.cjs`：Client 全量 dump 到 `backup-YYYYMMDD.json`（Atlas 自动快照为主，本脚本手动兜底；现有 `/api/export` 亦可导出）
  8. **管理端建档表单**（`src/App.jsx`）：新增 `newClientGender` / `newClientTags` 状态；`addClient` 组装 client 对象时写入 `gender` / `tags`（标签按逗号、中文逗号或换行分隔，trim 后过滤空值）；表单加性别三按钮单选 + 标签 textarea；提交后重置两个新状态
  9. **`.gitignore`**：新增临时脚本白名单 `_migrate_to_mongo.cjs` / `_backup.cjs` / `backup-*.json`，防误提交
- **业务代码**：未动。解牌流程 / `生成规则模块` / 输出结构权重 [输出结构权重已脱敏] / 内部结构标记 标记 / 已删字数地板 / 访客端与输出页 UI / `readClients`-`writeClients` 对外签名 / `/api/clients`、`/api/export`、`/api/import` 路由契约，全部零改动。
  - `npm run build` ✓ 866ms（32 modules transformed，无警告）
  - 迁移脚本实跑：`data.json` 存在（179466 字节）且无 URI 时干净退出报「未配置 [环境变量已脱敏]」，两道前置校验均正确
- **⚠️ 待验证（如实记录，非本轮遗漏）**：
  - **待配置 `[环境变量已脱敏]` 后运行迁移**：两个临时脚本**保留在仓库根目录**（不删、不进 git），等配好连接串跑完迁移再清理
  - 验收项 3（设 URI 后显示「✅ MongoDB 已连接」）、项 4（故意填错 URI 降级不崩且站点可访问）需产品负责人配置 Atlas 或本地 `mongod` 后自行验证 —— 连接信息属于个人凭证，不随公开材料发布
  - 验收项 7（浏览器开管理端建档能选性别、加标签；历史注入逻辑不变）需浏览器自查（Claude 无浏览器能力）
  - 首次真实连接时建议留意日志有无 schema 相关警告
- **关联产物**：`server/index.js`、`src/App.jsx`、`.gitignore`、`_migrate_to_mongo.cjs`、`_backup.cjs`（后两者本地保留、gitignored）、`backup/v1.11.0-P1-01数据库接入.md`
- **本地 commit**：`0e43ba1`（3 files changed，+92 −10）。**未 push**（本地优先，等后续 P1 节点一起推）。

### v1.11.1 建档表单：性别/标签改为 AI 自动识别（去手动必填）
- **对应审计节点**：P1-01 建档表单（上轮 v1.11.0 新增的性别三按钮 + 标签 textarea）。
- **动机 / 产品决策**：产品负责人明确——性别与标签**不该靠手动 UI 输入**，而应由 AI 对「访客/咨询者传回的咨询内容」做一次内容识别后自动填入表单（表单值仍可手改纠错）。上轮手动控件属于过渡实现，本轮按此方向改造。
- **前提澄清**：当前访客端匿名、数据不流回管理端，故「识别数据源」现实落地为——**占卜师在建档表单里填写客户咨询内容，点「AI 识别」即由后端 LLM 提取性别与标签**。未来访客档案回流时，同一接口可复用。
- **改了什么**（`server/index.js` + `src/App.jsx`，均在已开发的管理端/数据层范围内，**未碰业务代码**）：
  1. **后端新增 `/api/extract-meta` 接口**（`requireAuth`，与建档同权）：接收 `{ text }`，用新增的 `chatOnce()` 非流式单次对话（复用 generateHandler 同款模型/格式切换逻辑，OpenAI 兼容与 Anthropic 原生双路，max_tokens=500），要求模型只返回 JSON `{ gender, tags }`；后端再用 `extractJSON()` 兜底解析，`gender` 仅接受 男/女/未知（其余归「未知」），`tags` 取数组前 8 个去空。`chatOnce` / `extractJSON` 为只读新增，不改既有 generateHandler 行为
  2. **前端建档表单**：新增「咨询内容」textarea（`newClientQuestion`）；其下方加「✨ AI 识别性别与标签」按钮（`recognizeMeta` → `fetch /api/extract-meta` → 回填 `newClientGender` / `newClientTags`）；原性别三按钮、标签 textarea **保留但改为「AI 已识别、可手动调整」**，并加 `metaTouchedRef` 守卫——用户一旦手动改过性别或标签，失焦自动识别不再覆盖其手改值
  3. `addClient` 提交后重置 `newClientQuestion` 与 `metaTouchedRef`
- **业务代码**：未动。解牌流程 / `生成规则模块` / 输出结构权重 / 内部结构标记 标记 / 数据层 / `/api/clients` 等路由契约，全部零改动。
- **怎么验证**：
  - `npm run build` ✓（32 modules transformed，dist 产出 266.86 kB JS，无警告）
- **⚠️ 待验证（非本轮遗漏）**：
  - **识别效果与成本**：每次点「AI 识别」= 1 次小模型调用（haiku/deepseek 等，取决于 `API_MODEL`）。建议产品负责人浏览器自查：填一段含性别暗示 + 明确议题的咨询内容，看性别/标签是否识别准确、手改是否生效
  - 性别字段当前为「男/女/未知」三态；若未来需非二元，schema `enum` 与表单需同步扩，留待需求明确
  - 「咨询内容」仅用于本次识别，**未单独入库**（建档后真正占卜时问题会作为 session 存入）；如需把首询也留存，后续可加 `firstQuestion` 字段，本轮有意不做以免扩 schema
- **关联产物**：`server/index.js`、`src/App.jsx`
- **本地 commit**：`cf02608`（2 files changed，+90 −4）。**未 push**。⚠️ 本版「UI 识别按钮」方向已被产品负责人纠正，由 v1.11.2 改为后台静默识别并撤销 UI 控件。

### v1.11.2 建档性别/标签：撤销 UI 控件，改为生成解读时后台静默识别
- **对应审计节点**：P1-01 客户档案细分字段（gender/tags，供以后数据分析用）。
- **动机 / 产品决策（纠正 v1.11.0 / v1.11.1）**：产品负责人澄清——性别与标签是**存进客户档案的"细分字段"，用途是以后做数据分析**（男女比例、标签分类趋势等），**不是**给占卜师一个"识别工具"。因此 UI 上不该有任何手动选择或识别按钮；填充应在**后台自动**完成、占卜师无感。
- **改了什么**（`src/App.jsx`，仅管理端；`server/index.js` 保留 v1.11.1 的 `/api/extract-meta`）：
  1. **撤销 UI 控件**：删除 v1.11.0 的「性别三按钮 + 标签 textarea」与 v1.11.1 的「咨询内容 textarea + ✨AI识别按钮」，建档表单回到「姓名 + 备注」；删除 `newClientGender`/`newClientTags`/`newClientQuestion`/`metaTouchedRef` 四个 state 与 `recognizeMeta` 函数；`addClient` 建档时 gender 固定 `"未知"`、tags 固定 `[]`（字段仍写入档案，供分析备用）
  2. **后台静默识别**：在管理端 `generate()` 生成解读完成后，若该客户档案 `gender` 仍为"未知"或 `tags` 为空，自动调用 `/api/extract-meta` 识别本次 `question`，静默更新该客户档案的 `gender`/`tags` 并 `saveClients`（占卜师无感；识别失败静默忽略、不影响占卜；已识别过则不再重复触发）
  3. **客户列表卡片只读展示**：识别出的 gender（非"未知"）与 tags 以小字显示在客户名下方，为以后分析可视化打底；无任何编辑入口
- **业务代码**：未动。解牌流程 / `生成规则模块` / 输出结构权重 / 内部结构标记 标记 / 数据层 schema / `/api/clients` 等路由契约，全部零改动。访客端（匿名、无档案）不受影响。
- **怎么验证**：
  - `npm run build` ✓（32 modules transformed，dist 265.82 kB，无警告）
- 实测元数据抽取接口：使用脱敏样例验证结构化返回成功。
- **⚠️ 说明**：识别发生在占卜师**首次给某客户生成解读**时（每次仅 1 次小模型调用，已识别则不再触发）；成本取决于 `API_MODEL`。真正跑通需浏览器实测一次"建档 → 给该客户生成解读 → 回列表看性别/标签是否已自动出现"。
- **关联产物**：`src/App.jsx`
- **本地 commit**：（待提交，1 file changed）。**未 push**（本地优先）。

### v1.11.3 评分维度修正：ratingSchema 九维自造 → 对照保真表 §11 十二维
- **动机 / 纠正**：产品负责人复核数据库模块时指出——`RatingModel.dimensions` 在 v1.11.0 被误设为 9 个自造键名（`moduleCompleteness` / `ratioFidelity` / `eventUnderstanding` / `cardPosition` / `adviceBoundary` / `disclaimer` / `emotionValue` / `firstImpression` / `cardDepth`），且 CHANGELOG 谎称「对应《输出结构保真对照表》§8 九项」。实际保真表第 11 节「评分表维度细化」定义的是 **12 个维度**，自造键名既未对照保真表、又凭空编造（模块完整度 / 比例保真 / 第一印象 / 牌面深度 保真表无对应项）。属「做错」项，须修正。
- **改了什么**（`server/index.js` [源码位置] `ratingSchema.dimensions`）：删 9 个自造键，改为 12 项 1:1 对照 §11 —— `questionRelevance`(§11.1 问题相关性) / `cardPosition`(§11.2 牌阵位置对应) / `cardCompleteness`(§11.3 逐张牌解读完整度) / `element`(§11.4 元素解读) / `numerology`(§11.5 灵数变化解读) / `imageryFigure`(§11.6 画面和人物分析) / `cardInteraction`(§11.7 牌与牌交互关系) / `eventMapping`(§11.8 事件映射) / `disclaimer`(§11.9 免责声明和边界) / `adviceQuality`(§11.10 建议质量) / `emotionValue`(§11.11 情绪价值) / `formatCompliance`(§11.12 格式合规)。`score` / `reviewer` / `createdAt` / `sessionId` / `clientId` 不变。
- **同步修正**：CHANGELOG v1.11.0 第 4 项「九维键名锁死…对应§8 九项」虚假记录已更正为「对照保真表 §11 十二项」并标注本更正。
- **业务代码**：未动。其余 schema（clientSchema / feedbackSchema）、解牌流程、prompt、前端全部零改动。
- **关联产物**：`server/index.js`、CHANGELOG（本地，gitignored）。
- **本地 commit**：（待提交，1 file changed）。**未 push**（本地优先）。

### v1.10.2 禁输出引号（双/单）+ 范式示例去引号
- **动机**：AI 输出中的引号字符（双引号、单引号）破坏真人口语质感，用户要求全面禁止。
- **改了什么**（`生成规则模块`）：
  1. [源码位置]：【绝对禁止的输出格式】新增禁引号条款，覆盖中文双弯引号 ""、英文直双引号 " "、中文单弯引号 ''、英文直单引号 ' '；需要引用或强调时用自然叙述或上下文代替，不得用引号包裹任何词
  2. [源码位置]：改写牌位名与牌名范式示例，去掉所有引号；原示例「"在'过去'这个位置，你抽到了愚者正位……"」改为「在过去这个位置，你抽到了愚者正位……」；报幕式标签头示例同步去引号
- **业务代码**：未动。输出结构权重 [输出结构权重已脱敏] 不动；其他禁格式（破折号/装饰符号/Markdown/标签头/连续空行）保留。
- **构建验证**：`npm run build` ✓ 854ms（32 modules transformed）
- **关联产物**：`生成规则模块`

### v1.10.1 输出阅读视图统一为单段 + 去除字数地板
- **动机**：访客端输出解读完成后直接显示分块 textarea（带中文标签的小框），阅读门槛高；字数地板（三张牌阵 ≥1200 字）导致模型为凑字数灌水，信息密度低。
- **改了什么**：
  1. `src/App.jsx` 访客端（[源码位置]/[源码位置]）：新增 `editMode` state，默认显示连续一整段纯文本（阅读视图，`stripMarkers(editableOutput)`），点「✎ 编辑文字」进分块编辑，点「完成」退回阅读视图；`isRevising`/`revisionPhase` 状态提示移到 `editMode` 条件外（两视图下均可见）；阅读视图外观与现网一致（`whiteSpace: pre-wrap`，无新配色/布局）；`splitBlocks`/`replaceBlock`/`blockLabel` 等 A1 工具及二次生成保标记逻辑全部保留
  2. `生成规则模块` [源码位置]：删除总字数地板（三张牌阵不少于 1200 字 / 单张不少于 600 字）；删除配套前句"禁止以精炼简洁为由压缩任何模块"（无地板后会诱导灌水）；保留后句"禁止为凑字数灌水挤占比例"；比例数字 [输出结构权重已脱敏] 与十模块标记全部不动
  3. `src/App.jsx` 管理端 userPrompt [源码位置]：删除"总字数不低于 1200 字"地板行，其余不动
- **业务代码**：未动。`SPREADS` / `SPREAD_LAYOUTS` / AI 接口 / 路由 / 其他屏视觉全部保留。
- **构建验证**：`npm run build` ✓ 847ms
- **关联产物**：`src/App.jsx`、`生成规则模块`

### v1.10.0 输出内容系统化重构（Phase 2 完成）
- **动机**：审计 §7.2/§7.3 定义的十模块骨架（招呼/事件理解/牌面初判/初印象解释/逐牌解读/三牌总结/事件映射/免责/建议/情绪价值，比例 [输出结构权重已脱敏]）在 prompt 中仅有逐牌与总结两项，其余八项缺失；输出页为整段堆砌无结构；铁律 B 已获产品负责人显式放行。
- **唯一事实源**：`03-PRD/输出结构保真对照表.md`（v1.2）。

**第 0 步（基线存档，read-only）**
- 改前手动运行凯尔特十字 / 万能牌阵 / 时间流运势 / 二选一四份生成，存 `backup/v1.10.0-baseline/`。
- 每份记录：问题 + 各牌正逆位 + 总字数 + 逐牌字数 + 人工标注十模块占比；作为改后对比基准。

**第 1 步（tarotPrompt.js 主体重构）**
- `[源码位置]`："300字/牌绝对下限"整块重写为比例驱动（§7 比例优先于字数）
- `[源码位置]`：禁说教规则追加 `[内部标记]` 例外条款（特殊类放行积极框架 / 其余轻量非指令）
- `[源码位置]`：原"用客人现实逻辑串联因果链"→ 改为"按抽牌顺序/客人给定时间线陈述，不得用因果连接词建立虚构因果关系"（§5.1 澄清）
- `[源码位置]`："指出唯一触发条件"（"主动卸下防御…"）一并裁掉，防边缘触发禁说教与 type2 免责矛盾
- `[源码位置]`：灵数两句话篇幅限制，仅在 `[内部标记]` 单牌块内保留，`[内部标记]` 内按 权重充分展开
- `[源码位置]`（[源码位置]）：元素缺失限制加"仅限 `[内部标记]` 内放开"例外
- `[源码位置]`：禁装饰符号末尾追加系统标记白名单（`[内部标记]` 双方括号为内部用途，非装饰符）
- `[源码位置]`：600/1000 字 + 300字/牌 硬下限整块重写，改为"三牌阵不低于 1200 字，多牌阵等比放大，任何情况不低于 1000 字地板"
- 新增「输出结构骨架（十模块）」整节（[源码位置] 结束前）：十个 `[内部标记]` 标记、比例数字 [输出结构权重已脱敏] 逐字保留、建议两类边界（§4.1）、免责两类触发（§4.2）、事件理解反幻觉硬约束（§5）、逐牌位强制（§6，`[源码位置]` 真人叙事范式，禁带特殊字符的报幕式标签头）、骨架十点自检

**第 2 步（连带坑修复，userPrompt）**
- 访客端 `[源码位置]`：删除"不低于 600 字"硬命令与"每张牌单独解读不少于 300 字"下限；"最后单独一段回答问题"并入 `[内部标记]` 删除重复；追加 `category` 字段，建议模块触发条件补料
- 管理端 `[源码位置]` 对应段落：同步删除 300 字硬命令；同步追加 `category` 字段
- 管理端 `[源码位置]`（结论直切规则）：**删除**，理由：与 `[内部标记]` 功能重叠致双重"回到原问题"段；"如果一定要做一个选择的话"与 `[内部标记]` 语义重叠；"禁顺其自然"与 `disclaim type2` 自身用词矛盾；`[内部标记]` + 日常事件规则已承载决断力

**第 3 步（App.jsx:1399 输出渲染 stripMarkers）**
- thinking 清理之后加 `stripMarkers` 函数，正则 `[内部标记正则已脱敏]` 剥离所有 `[内部标记]` 标记
- 访客端流式态（`[源码位置]`）与生成后 textarea（`[源码位置]`）均套 `stripMarkers`
- 管理端对应两处同步
- 历史页三处展示补漏（展示存档内容时同样 stripping）
- 二次生成 `reviseOutput`（`[源码位置]`）：补"保留 内部结构标记 标记，不新增不删除"指令，防反馈链后结构塌方（§5.3）
- 输出页样式**零改动**，外观与现网一致

**第 4 步（编辑态方案 A1）**
- 原单 `<textarea>` 改为按模块分块小 textarea；每块旁显示中文模块名标题（仅 UI 标签，不进 editableOutput，不发 AI）
- `splitBlocks(text)` / `replaceBlock(text, key, value)` / `MODULE_LABELS` 工具函数（组件外）
- `editableOutput` 为唯一真源，编辑时替换对应片段再拼回，不引入第二份 blocks state
- `[内部标记]` 标记留 state，用户永远看不到
- 管理端无独立分块编辑（管理端走 tarotPrompt 完整 system prompt，已通过标记保结构）

**第 5 步（凯尔特十字牌数修复）**
- 访客端 userPrompt 追加"本次牌数硬约束"：`slots.length` 动态注入，要求输出恰好 N 个 card 标记、编号连续，输出前逐一点数自检
- 管理端同步追加相同约束（同时清理管理端遗留的重复结论段 [源码位置]）
- 触发原因：凯尔特十字 11 张基线对比时出现 card 标记少于 11 个的漏牌问题，牌数动态注入可从提示词层强制 AI 补齐

**清理**
- 删除根目录临时脚本 6 个（`_extract_spreads.cjs` / `_baseline_run.cjs` / `_baseline_annotate.cjs` / `_baseline_after.cjs` / `_test_a1.cjs` / `_baseline_spreads.json`），均不进 git

**业务代码**
未动：`SPREADS` / `SPREAD_LAYOUTS` / `SPREAD_IMAGES` / `SPREAD_TOOLTIPS` / AI 接口 / 路由 A1-A10 B1-B4 C1-C5 / 其他屏视觉。

**构建验证**
`npm run build` ✓（32 modules transformed，最终 build 3.83s）
- **关联产物**：`生成规则模块`、`src/App.jsx`、`backup/v1.10.0-baseline/`（本地，gitignored）、`03-PRD/输出结构保真对照表.md`（v1.2，唯一事实源）

---

## 2026-08-24

### v1.9.2 停止提交 dist，改由 Render 构建（回收 dist 入库）
- **动机**：v1.9.1 误判 Render 为「直接服务仓库已提交 dist 的 Static Site」，从而把 dist/ 一并入库。经核对部署日志（`Running 'npm start'` → `node server/index.js`）与 `server/index.js:12,268`（`DIST_DIR = ../dist`、`express.static(DIST_DIR)`），本项目实际是 **Web Service**，部署流程为 `build`(`npm run build`，vite 把 `public/` 复制到 `dist/`) → `start`(`node server/index.js` 服务 `dist/`)。仓库里的 dist/ 是冗余的，每次部署由 Render 重建。
- **改了什么**（`.gitignore` + 解除 dist 追踪）：
  1. `.gitignore` 删除 dist 例外（`!dist/*.png`/`!dist/**/*.png` 及 jpg/jpeg 对称），新增 `dist/` 忽略；`public/` 例外全部保留（public 为源码必须入库）
  2. `git rm -r --cached dist/`（本地 dist/ 保留，不影响预览）
- **实际移除范围比预期大**：除 12 个背景 PNG 与 2 个 `dist/assets/*` 外，`dist/cards/` 下全部塔罗牌 webp（大牌 0–21 + 小牌）也一并退出版本控制 —— 整个 dist 目录退出的必然结果。**连带影响**：`/cards/*.webp`（抽牌界面牌背 `/cards/背面.webp`、解读页牌面图）现在同样依赖 Render 构建时从 `public/cards/` 复制。风险点从「文件是否入库」转移到「构建是否成功」。
- **业务代码**：未动（`server/index.js` / `src/App.jsx` / `src/index.css` 零改动）
- **效果**：仓库体积增长收敛，408 超时风险下降；今后改 `src/` 只需 push 源码，图片随 Render 构建自动进 `dist/`
- **待人工确认**：Render Deploy 日志应出现 `vite v5.4.21 building for production...` + `✓ built in ...` 与 `node server/index.js` 启动；仓库无 `render.yaml`（配置在后台），无法由本地验证
- **关联产物**：`.gitignore`、`backup/v1.9.2-停止提交dist改由Render构建.md`

### v1.9.1 修复 Render 背景图 404：放行 dist PNG 并入库
- **动机**：v1.9.0 已放行 `public/**/*.png` 并入库 12 个素材，但线上背景图仍然全部 404。
- **根因**：本项目 `dist/` 是**版本化目录**（`dist/index.html`、`dist/assets/*.js`、`dist/assets/*.css` 一直随提交入库），Render 直接取仓库里的 `dist/` 提供静态资源，并不在部署时重跑 `vite build`。v1.9.0 的 `.gitignore` 例外只写了 `!public/*.png` / `!public/**/*.png`；Vite 构建虽会把 `public/` 素材复制到 `dist/`，但这些复制品仍被第 31 行全局 `*.png` 规则拦截，于是 12 个 PNG 只进了 `public/`、没进 `dist/`，线上读 `dist/` 自然 404。
  > **后续修正**：此处「Render 直接取仓库 dist/」的判断有误，v1.9.2 已据部署日志与 `server/index.js` 更正为 Web Service（部署时重跑构建）。本条目保留原文以存迭代痕迹。
- **改了什么**（`.gitignore` + `dist/` 12 个 PNG）：
  1. `.gitignore` 补充 dist 例外：`!dist/*.png`、`!dist/**/*.png`
  2. 同步补 jpg/jpeg 例外（`!dist/*.jpg`、`!dist/**/*.jpg`、`!dist/*.jpeg`、`!dist/**/*.jpeg`），避免后续换素材格式再踩同一个坑
  3. 入库 12 个 dist PNG：`dist/draw/抽牌背景.png`、`dist/entity/实体抽牌背景.png`、`dist/history/卡片背景.png`、`dist/history/历史背景.png`、`dist/home/主页-bg.png`、`dist/intro/intro1-bg.png`、`dist/intro/intro2-bg.png`、`dist/intro/tarot.png`、`dist/intro/月相.png`、`dist/intro/牌面.png`、`dist/logo.png`、`dist/output/解读背景.png` —— 与 `public/` 下 12 个同名文件一一对应
  4. 原始高清图目录 `贝柚_塔罗高清图片/`、`牌阵/` 仍由第 31 行 `*.png` 拦截，未被放行
- **遗留风险**：`dist/` 既入库且线上直接取用，**今后每次改 `src/` 都必须重跑 `npm run build` 并把 `dist/` 一起提交**，否则线上代码与源码不同步。本轮已重建确认一致。
  > 该风险已由 v1.9.2 消解 —— dist/ 退出版本控制，改由 Render 每次部署重建。
- **业务代码**：未动。本轮只改 `.gitignore` 一个文件 + 新增 12 个二进制素材，`src/` 零改动。
- **推送记录**：首次 push 报 HTTP 408 超时（非凭证问题），诊断后以 `http.postBuffer=524288000` 重试成功（`56f5a9b..7777ef6`）
- **关联产物**：`.gitignore`、`backup/v1.9.1-修复Render背景图404.md`

---

## 2026-08-24

### v1.9.0 抽牌下移收尾 + 空问题前置拦截 + gate 还原上线
- **动机**：抽牌内容下移量仍不足；万能/时间流牌阵空问题拦截时机太晚（抽完牌才提示）；intro gate 需从测试模式还原为上线值并部署。
- **改了什么**（`src/App.jsx`）：
  1. 抽牌弹性块权重 1.6 : 1 → **2.5 : 1**（顶部 `flex: "2.5 1 0"` @1134、底部 `flex: "1 1 0"` @1216），「计数器 + 副标题 + 牌阵」整体进一步下压；调参点仍是这两个权重
  2. 空问题前置拦截**原问题**：校验只存在于 `generate()`（@1335-1345），即抽完牌之后才触发 —— 用户点 NEXT → 抽牌 → 抽完 → 点确认 → 才被 alert 退回，白抽一轮
  3. 改法三层：① 派生状态 `REQUIRE_QUESTION`/`needsQuestion`/`questionMissing`（@1331-1333）；② NEXT `disabled` + `aria-disabled` + 视觉弱化（背景 `rgba(212,208,240,0.18)`、文字 `rgba(11,12,20,0.45)`、`cursor: not-allowed`）；③ 点击兜底 `if (questionMissing) { alert("请先输入问题"); return; }`，绕过 disabled 也不放行
  4. NEXT 上方新增提示行，区分两阵：时间流→「需先填写时间范围与问题」、万能→「需先填写你的问题」
  5. 其余牌阵 `questionMissing` 恒 false，空问题照常放行；`generate()` 内原有两处 alert 校验**未删除**，作为最后防线保留
  6. `INTRO_TEST_MODE` `true` → **`false`**（@3106），注释块改为「✅ 已还原为首次弹（上线值）」并说明再次验收的临时切换方式；首次进入走 intro 并写 `localStorage["moonphase_intro_seen"]`，之后直接进主界面；`isAdmin` 始终跳过（未变）
- **业务代码**：未动。`generate()` 内原有校验逐字保留；`pick`/`nav`/`confirm`/拖拽/滚轮/`wrapIdx`/`normalizeOffset` 及 `deck`/`drawn`/`flippedCount` 链路未碰；新增的是派生只读状态与 UI 禁用态
- **怎么验证**：`npm run build` ✓ 922ms（32 modules transformed）
- **关联产物**：`src/App.jsx`、`backup/v1.9.0-抽牌下移与空问题拦截与gate还原.md`

---

## 2026-08-24

### v1.8.9 抽牌界面内容整体下移（修 v1.8.8 方向错误）
- **动机**：v1.8.8 的下移量不够，用户反馈牌阵、"已抽 x/y 张"大字、副标题三者仍太靠上。
- **根因（v1.8.8 方向错了）**：抽牌界面 flex 列中，计数器自带 `marginTop: "auto"`，会**吸收掉所有新增的底部空间**。v1.8.8 通过加大底部确认槽 `marginBottom`（18→40）试图把上方内容"顶下去"，实际效果只是压缩底部导航，对上方三元素的下移贡献极小 —— 继续加大只会把底部导航挤扁，不会让内容下移。
- **改了什么**（`src/App.jsx`）：
  1. 删除计数器的 `marginTop: "auto"` 与底部区的 `marginTop: "auto"`
  2. 改为在「顶栏 → 计数器」之间插入 `flex: "1.6 1 0"` + `minHeight: 24` 弹性块
  3. 在「牌阵 → 底部区」之间插入 `flex: "1 1 0"` + `minHeight: 16` 弹性块
  4. 剩余空间按 **1.6 : 1** 分配，上方留白多于下方，使「计数器 + 副标题 + 牌阵」整体落到屏幕中下部
  5. `minHeight` 兜底：极矮视口下弹性块被压到 0 时仍保留最小间距，避免元素贴死
  6. 确认槽 `marginBottom` 保持 40（v1.8.8 的值），该值对"确认按钮与底部导航间距"仍有效，只是不再承担"整体下移"职责
- **调参点**：1.6 : 1 为估值，下移不足则调大第一个权重（如 2 : 1），过头则调小（如 1.2 : 1）。两个弹性块是唯一调参点。
- **业务代码**：未动。`pick`/`nav`/`confirm`/`beginDrag`/`moveDrag`/`endDrag`/`onWheel`/`wrapIdx`/`normalizeOffset` 及 `deck`/`drawn`/`flippedCount` 链路逐字保留；本轮仅增删两个纯布局 `<div>` 与三处 flex 属性
- **怎么验证**：`npm run build` ✓ 1.06s（32 modules transformed）
- **关联产物**：`src/App.jsx`、`backup/v1.8.9-抽牌内容整体下移.md`

---

## 2026-08-24

### v1.8.8 抽牌界面布局调整 + 解读/实体牌界面背景
- **动机**：主页与抽牌背景素材升版；抽牌牌阵偏上偏小、确认按钮偏低；解读与实体牌两界面尚未换背景图。
- **改了什么**（`src/App.jsx`）：
  1. 主页背景 4.0（1288030 字节）与抽牌背景 2.0（1471750 字节，含暗纹）均由用户替换，路径不变，**代码未改**
  2. 牌阵放大 1.2 倍：`CW` 64→77、`CH` 112→134、`PIVOT` 380→456、扇形容器 `height` 300→360。**`PIVOT` 必须同比例放大** —— 它是所有牌共享的旋转支点距牌顶距离，牌高放大而支点不动会使支点相对落进牌身内部、扇形收拢而非张开（intro2 已踩过同一个坑，见 v1.8.7）；`ANGLE_STEP` 保持 4.8，牌宽与支点同比例放大后角度不变即维持原叠压密度
  3. 牌阵垂直居中：原布局两个 `marginTop: "auto"` 已构成上下对称弹性留白，重心偏上的实际原因是底部区 `paddingBottom: 64` 与确认槽位占据下方空间，故通过加大确认槽 `marginBottom` 重新平衡两侧留白
  4. 确认占卜按钮上移：确认槽 `marginBottom` 18→40，按钮上移 22px 并拉开与底部导航行距离
  5. 解读界面背景 `/output/解读背景.png` 铺满（`...base` 展开后追加背景属性，未污染共享 `base` 样式对象）
  6. 实体牌录入界面背景 `/entity/实体抽牌背景.png` 铺满
  7. 两处顶栏均按 memory 规则改 `background: transparent`、删除 `borderBottom`、文字加 `textShadow` 补对比度；均加 `overflowX: hidden` + `maxWidth: 100vw` 防移动端横向溢出
- **业务代码**：未动。`pick`/`nav`/`confirm`/`beginDrag`/`moveDrag`/`endDrag`/`onWheel`/`wrapIdx`/`normalizeOffset` 及 `deck`/`drawn`/`flippedCount` 链路逐字保留，改动仅为几何常量与 CSS 属性
- **怎么验证**：`npm run build` ✓ 2.43s（32 modules transformed）；四个素材文件均 `ls` 核验存在（08-24 20:23）
- **关联产物**：`src/App.jsx`、`backup/v1.8.8-抽牌布局与解读实体背景.md`

---

## 2026-08-24

### v1.8.7 顶栏完全透明 + intro2 整排牌图直接放置
- **动机**：顶栏半透明毛玻璃仍留深色带；intro2 牌堆连续几轮做不对，根因是素材性质误判。
- **改了什么**（`src/App.jsx`）：
  1. 主页与历史记录顶栏改 `background: transparent`，删除 `backdropFilter`/`WebkitBackdropFilter`，**并删除 `borderBottom`**（1px 描边同样会在背景图上切出可见横线，与"完整铺满"矛盾）
  2. 对比度补偿改为给**文字本身**加 `textShadow`（主页产品名与历史页标题 `0 1px 8px rgba(0,0,0,0.8)`、历史页返回按钮 `0 1px 6px rgba(0,0,0,0.75)`），而非给顶栏加背景层
  3. intro2 牌堆推翻前几轮做法：`/intro/牌面.png` 实际是 **823×400 横向整排牌**，设计已把整排扇形排好在图内。此前误判为单张牌面，切成 10 份（`FAN_ANGLES`）+ 套 `222×384` 竖框 + `objectFit: cover` 裁切 + `PIVOT` 算扇形；横图塞竖框被大幅裁切，牌面 `1px solid` 描边显得像突兀空框 —— 这才是"牌堆不对"的真正原因，与角度/尺寸参数无关，前几轮反复调 `ANGLE_STEP`/`PIVOT` 都是在错误前提上微调
  4. 改法：删除 `CW`/`CH`/`FAN_ANGLES`/`PIVOT` 及 10 张牌循环，改单个 `<img>`，`width: min(, 760px)` + `height: auto` 保原比例、`maxWidth: none` 防全局 img 规则压制、父容器 `overflow: hidden` 裁两侧；容器 `marginTop` 90→40、`minHeight` 340→200
  5. 抽牌背景：用户已替换 `public/draw/抽牌背景.png`（1615697 字节），路径不变，**代码未改**
- **已记入 memory**：`tarot-paimian-asset-is-full-row`（整排牌不可切分）、`tarot-topbar-fully-transparent`（顶栏须全透明）
- **怎么验证**：`npm run build` ✓ 835ms（32 modules transformed）
- **关联产物**：`src/App.jsx`、`backup/v1.8.7-顶栏全透明与整排牌图.md`

---

## 2026-08-23

### v1.8.6 三页背景素材 + 分类推荐牌阵 + 画像引导词
- **动机**：历史记录页/卡片、抽牌界面换背景素材；新增事件分类推荐牌阵功能；画像牌阵引导词更新。
- **补记说明**：本条目在 v1.8.7 阶段补写，当轮汇报声称已留痕实际未落盘。
- **改了什么**（`src/App.jsx`）：
  2. 历史页背景 `/history/历史背景.png` 铺满（局部加在 `showHistory` 分支，未污染共享的 `base` 样式对象）；卡片背景 `/history/卡片背景.png` + `overflow: hidden` 配合原有 `borderRadius: 24` 裁在圆角内
  3. 抽牌界面背景 `/draw/抽牌背景.png` 铺满，删除 7 个 CSS 装饰元素（3 模糊光球 + 4 月环描边）
  4. 新增 `CATEGORY_SPREADS` 数据表（6 分类，牌阵名均核对为 `SPREADS` 准确 key）+ `tipCat` 状态，交互与牌阵说明一致（点一下展开、再点收起）；6 列窄格锚点分三段防溢出，方向朝下避免遮挡上方输入框
  5. 画像牌阵引导词逐字替换
  6. **操作失误（已修复）**：编辑 `SUIT_COLORS` 时误删 `"大阿尔卡那": "#d4d0f0"` 一行，发现后立即补回
- **怎么验证**：`npm run build` ✓ 843ms（32 modules transformed）
- **关联产物**：`src/App.jsx`、`backup/v1.8.6-三页背景与分类推荐牌阵.md`

---

## 2026-08-23

### v1.8.5 牌堆再放大与移动端横向溢出修复
- **动机**：牌面继续放大；修移动端点最右列牌阵时屏幕被拉宽、NEXT 按钮变形的 bug。
- **补记说明**：本条目在 v1.8.7 阶段补写，当轮汇报声称已留痕实际未落盘。
- **改了什么**（`src/App.jsx`）：
  1. 牌面 148×256 → 222×384，放弃几何精算改手写 `FAN_ANGLES`，`PIVOT` 560→620，容器下移（**此套参数 v1.8.7 已全部删除**）
  2. 横向溢出**真实根因与用户排查方向不同**：排除了缩略图（有 `overflow: hidden` + `flexShrink: 0`，4 列仅算出 42px）与选中态（只改颜色无宽度变化）；真凶是**我在 v1.7.3 加的牌阵说明提示框** —— `width: max-content` + `maxWidth: 260` + 从卡片中心 `translateX(-)`，最右列卡片中心距屏幕右缘仅约 60px，提示框右半边约 70px 捅出视口撑宽页面，带动 `position: fixed` 的 NEXT 拉长
  3. 用户点击的四个牌阵恰好都在最右列，印证根因**只与所在列有关**，与牌数、缩略图复杂度无关（双选项抉择 18 张牌看似最可疑实为巧合）
  4. 三道防线：按列换锚点（左列 `left:0`／右列 `right:0`／中列居中，箭头相应偏移）+ `maxWidth: min(240px, 68vw)` + 主页根容器 `overflowX: hidden` & `maxWidth: 100vw`
- **怎么验证**：`npm run build` ✓ 998ms（32 modules transformed）
- **关联产物**：`src/App.jsx`、`backup/v1.8.5-牌堆放大与横向溢出修复.md`

---

## 2026-08-23

### v1.8.4 牌堆放大与分类高亮
- **动机**：intro2 牌面放大；主页分类点击缺少明显视觉反馈。
- **补记说明**：本条目在 v1.8.7 阶段补写，当轮汇报声称已留痕实际未落盘。
- **改了什么**（`src/App.jsx`）：
  1. 牌面 74×128 → 148×256，`ANGLE_STEP` 9→5.4、`PIVOT` 300→560（牌高翻倍后支点不下移会落进牌身内部使扇形收拢）（**此套参数 v1.8.7 已全部删除**）
  2. 分类选中态由紫色系 `var(--accent-dim)`/`#B3ABDA`/`var(--accent)` 改为同色系半亮 `rgba(236,234,248,0.15)` + 边框 `rgba(236,234,248,0.42)` + 文字 `#F4F1F7`，加 `transition: 180ms` 与 `aria-pressed`
  3. 层级理由：旧紫色系与 NEXT 不同色系强弱不清晰，改同色系仅差亮度后"未选中→选中→NEXT"递进才明确
  4. **一处发现**：用户描述 NEXT 为 `#ECEAF8`+`#0B0C14`，代码实际是 `var(--accent)`=`#d4d0f0` 与 `var(--btn-p-text)`=`#07060f`，两组接近但不同；按"保持不变"未动并已报告
- **怎么验证**：`npm run build` ✓ 913ms（32 modules transformed）
- **关联产物**：`src/App.jsx`、`backup/v1.8.4-牌堆放大与分类高亮.md`

---

## 2026-08-23

### v1.8.3 intro2 与主页背景素材
- **动机**：intro2 与主页换用设计出图的背景素材；扇形牌堆改用新牌面；删除 intro2 装饰性汉堡。
- **补记说明**：本条目在 v1.8.7 阶段补写，当轮汇报声称已留痕实际未落盘。
- **改了什么**（`src/App.jsx`）：
  1. intro2 背景 `/intro/intro2-bg.png` 铺满，删除两个 CSS 模糊光球（背景图自带氛围光会叠加）
  2. 牌面 `/cards/背面.webp` → `/intro/牌面.png`（**此时仍按"单张牌面"处理，属错误前提，v1.8.7 已推翻**）
  3. 删除 intro2 顶栏装饰性汉堡（引导阶段无跳转目标）
  4. 主页背景 `/home/主页-bg.png` 铺满；顶栏因原为不透明 `var(--bg-base)` + `sticky` 会切出黑带，改半透明毛玻璃（**此方案 v1.8.7 已推翻为完全透明**）
  5. **一处发现**：`intro2-bg.png` 与 `主页-bg.png` MD5 完全一致（`d989570061a254e78155e0988ad79874`，均 1377555 字节），已报告待确认是有意共用还是复制取错
- **怎么验证**：`npm run build` ✓ 917ms（32 modules transformed）
- **关联产物**：`src/App.jsx`、`backup/v1.8.3-intro2与主页背景素材.md`

---

## 2026-08-23

### v1.8.2 翻页方向修正 + intro1 文案上移
- **动机**：v1.8.1 把翻页方向做反了；intro1 文案过于靠下显得局促。
- **补记说明**：本条目在 v1.8.7 阶段补写，当轮汇报声称已留痕实际未落盘。
- **改了什么**（`src/App.jsx`）：
  1. 方向反转需四处联动：轨道顺序 `[intro2][intro1]`→`[intro1][intro2]`、初始 transform `-100vw`→`0`、翻页后 `0`→`-100vw`、手势钳制 `Math.max(0, Math.min(dx, W))`→`Math.min(0, Math.max(dx, -W))`、阈值 `dragX > W*0.22`→`dragX < -W*0.22`
  2. 轨道改回自然阅读顺序后，v1.8.1 那套"反直觉但必要"的解释随之失效 —— 那个绕弯设计完全是方向理解错误的产物
  3. intro1 文案块 `marginTop` 56vh→38vh，整块上移约 18vh（四段内容同在一个 flex 列内，只动一个值即整体平移）
- **怎么验证**：`npm run build` ✓ 875ms（32 modules transformed）
- **关联产物**：`src/App.jsx`、`backup/v1.8.2-翻页方向修正与文案上移.md`

---

## 2026-08-23

### v1.8.1 intro1 改用图片素材 + 右滑翻页
- **动机**：intro1 的产品名改用设计出图的图片素材（不再 CSS 手搓字体）；翻页交互从点击改为右滑。
- **改了什么**（`src/App.jsx`、`src/index.css`）：
  1. 新增 `IntroFlow` 组件统管两屏，横向轨道 `width: 200vw`。**轨道里 intro2 排在 intro1 左边**（反直觉但必要）：初始 `translateX(-100vw)` 显示 intro1，向右拖动时 translateX 趋向 0，intro1 右滑出、intro2 左侧滑入，符合"向右滑动翻页"手势。若按自然顺序把 intro1 放左边，向右滑会露出左侧空白，方向就反了
  2. 手势细节：`Math.max(0,…)` 只跟随向右位移（intro1 是第一屏无处可退）、`Math.min(dx, innerWidth)` 防拖过头、翻页阈值屏宽 、拖动中 `transition: none` 跟手、松手 400ms 缓动回弹、`touchAction: "pan-y"` 保留纵向滚动、鼠标+触摸双路径、`onMouseLeave` 也调 `end()` 防卡 dragging
  3. intro1 改图片素材：背景 `/intro/intro1-bg.png` 铺满（底部进度栏已含在图内）；产品名删除 CSS 渲染的 `<BrandName size={46}>`，改为 `/intro/月相.png`（上）+ `/intro/tarot.png`（下）纵向排列
  4. 中文文件名处理：`月相.png` 用 `encodeURI()` 包裹，直接写中文路径在部分部署环境（nginx 未配 UTF-8、CDN 转发）会 404；另加 `backgroundColor: "#0D0E1A"` 兜底防背景图加载失败白屏
  5. 删除失效代码：`StarburstRays` 组件（26 条 CSS 辐射线，背景图已含星爆效果）、`@keyframes intro-ray-glow` + `.intro-rays`
  6. `BrandName` 保留：intro2 顶栏仍在使用（App.jsx:2847），非死代码
- **未改动**：测试模式 gate 保持 `INTRO_TEST_MODE = true`；素材统一走 `/intro/` 路径未引用源目录；intro2 全部内容；slogan 与产品描述保留原文字渲染
- **怎么验证**：`npm run build` ✓ 834ms（32 modules transformed），CSS 4.96→4.84 kB
- **关联产物**：`src/App.jsx`、`src/index.css`、`backup/v1.8.1-intro1图片素材与右滑翻页.md`

---

## 2026-08-23

### v1.8.0 intro1/intro2 引导页从零新建 + 临时测试模式
- **v1.7.7+ 临时进入测试模式，intro 每次弹出**（便于检索：还原点为 `App.jsx` 中 `INTRO_TEST_MODE`，改回 `false` 即恢复"仅首次弹出"）
- **改了什么**（`src/App.jsx`、`src/index.css`）：
  1. 新增 `--font-sans-cn`（PingFang SC / 微软雅黑 / Hiragino Sans GB / Noto Sans SC），中文不走 Cinzel/Cormorant 避免 fallback 成宋体
  2. 新增 `BrandName` 组件中英分段渲染：`月相` 走无衬线、`Tarot` 走 Cinzel 并补 `fontSize × 1.04`/`letterSpacing × 1.6`（Cinzel 大写在同字号下视觉小于汉字）
  3. 新增 `StarburstRays`：26 条 1px 渐变细线从顶部中央扇出，长度/透明度三档交替
  4. 新增 `Intro1`：深空底 `#0D0E1A` + radial 光晕 + 星爆 + 3 个 blur 圆球；文案块 `marginTop: 56vh` 落在垂直 -；静态文案逐字按映射清单（产品名/slogan/四行描述）
  5. 新增 `Intro2`：顶栏 logo + BrandName + 汉堡（`aria-hidden` + `pointerEvents: none` 纯装饰，引导阶段无跳转目标）；主标题 `What's your mind saying?` 纯英文整体 Cinzel 三行硬分行；分隔线 + 倒三角；10 张 `/cards/背面.webp` 扇形牌堆复用 VirtualDraw 共享 pivot 几何（`ANGLE_STEP = 9`、`transformOrigin: 300px`）；按钮文案 `开始占卜`（高保真图的 "STAR" 是占位）
  6. 未画 iOS 状态栏：高保真图中 `12:00 + 信号 + 电池` 属原生状态栏，Web 应用不绘制
  7. 测试模式 gate：`INTRO_TEST_MODE = true` + `INTRO_SEEN_KEY = "moonphase_intro_seen"`；测试模式下 `finishIntro` 不写标记（否则首次访问即写入、重载就被跳过）；localStorage 读写包 try/catch 防隐私模式抛错；admin 路径短路为 done 不受影响
- **业务代码**：SPREADS / SPREAD_LAYOUTS / 抽牌逻辑 / AI 接口 / Prompt / 流程 A1-A10 均未触碰；`VisitorApp` 与 `TarotApp` 内部未改，仅由 `AppRouter` 外层包裹
- **怎么验证**：`npm run build` ✓ 859ms（32 modules transformed）
- **关联产物**：`src/App.jsx`、`src/index.css`、`backup/v1.8.0-intro引导页.md`

---

## 2026-08-23

### v1.7.7 分类图标优先级修正 + 弯曲返回箭头
- **动机**：解读界面右上角分类图标被 AI 自动判断覆盖了用户在主界面的手动选择；另「放弃保存，重新开始」的图标第三次重绘。
- **改了什么**（`src/App.jsx`）：
  1. 分类优先级修正（修 bug）：根因是两处 `onChange`（App.jsx:1828 主输入框、App.jsx:1904 展开弹窗）无条件执行 `categoryManualRef2.current = false`，用户选过主题后只要再改一个字，flag 就被清空，下次 `question` 变化时 `autoClassify` 覆盖用户选择。修复加两道独立防线：① 两处重置加条件 `if (!selectedTheme)`；② `useEffect` 条件加 `!selectedTheme`、依赖数组加 `selectedTheme`
  2. 回退路径未变：用户从未手动选主题时 `autoClassify(question)` 照常生效；`autoClassify` 函数本体（App.jsx:446）逐字未动
  3. 刷新图标第三次重绘：v1.7.5 弧线终点与箭头方向不咬合、v1.7.6 仍是圆形刷新语义，本次改为常见的"返回/撤销"弯曲箭头（`M2.5 6.5h8.5a4 4 0 010 8H6` 横线右延后回转 + `M5.5 3.5l-3 3 3 3` 箭头头指左），语义与「放弃保存，重新开始」一致
- **保留决定**：「已选牌面」卡片按用户明确要求保留
- **怎么验证**：`npm run build` ✓ 821ms（32 modules transformed）
- **关联产物**：`src/App.jsx`、`backup/v1.7.7-分类优先级与返回箭头.md`

---

## 2026-08-23

### v1.7.6 分类图标动态绑定 + 重新开始按钮整改
- **动机**：v1.7.5 把解读卡片右上角写成固定心形，属实现错误；另修「重新开始」按钮图标观感与文案语义。
- **改了什么**（`src/App.jsx`）：
  1. 修正 v1.7.5 的错误：映射清单（`高保真占位符映射清单v1.0.md:59`）原文为「6 个事件分类对应的小图标 / 动态绑定（分类图标）」，心形只是"爱情"分类的占位示例。新增 `CAT_ICON_PATHS` 常量表 + `CatIcon` 组件（App.jsx:12-30），解读卡片右上角改为 `<CatIcon cat={category} size={19} />`，随当前事件分类动态变化
  2. 6 个分类图标语义：爱情→心形、学业→书本、事业→公文包、人际→双人、成长→上升折线、运势→月亮
  3. 运势图标同步替换：主页分类 chip 的"运势"由五角星改为月亮，与解读卡片同一套语义
  4. `MAIN_THEMES` 6 条内联 SVG 改为统一复用 `<CatIcon cat="…" />`，消除"同一分类两处图标不一致"的隐患（name/cat 字段未动）
  5. 重新开始按钮图标重绘：旧 `M3 9a6 6 0 1010.5-4` 弧线终点与箭头方向不匹配，改为 `M15 9A6 6 0 113.9 5.8` + 箭头头在左上，逆时针回转语义清晰，加 `flexShrink: 0` 防长文案挤压
  6. 按钮文案「重新开始」→「放弃保存，重新开始」；配合调整 fontSize 14→13、letterSpacing 1→0.5、gap 8→7、横向 padding 10→8、新增 `lineHeight: 1.3`
- **怎么验证**：`npm run build` ✓ 836ms（32 modules transformed）
- **关联产物**：`src/App.jsx`、`backup/v1.7.6-分类图标动态绑定.md`

---

## 2026-08-23

### v1.7.5 输出/解读界面视觉对齐 + 时间流引导词 + 历史页铅笔图标
- **动机**：对照 `输出界面高保真.png` 逐项对齐解读界面视觉；补上一轮遗留的时间流引导词；修历史页分类标签图标辨识问题。
- **改了什么**（`src/App.jsx`）：
  1. 时间流运势牌阵引导词（上一轮遗留合并记录）：旧文案只引导时间不引导问题 → 「请写明你想了解的时间范围，以及你关心的问题。例如：未来一个月，我的事业会怎么样？」；两处访客端输入栏同步（App.jsx:1763 主栏、App.jsx:1839 展开弹窗）
  2. 历史页分类标签：复核发现代码本就是「铅笔图标 + 分类文字」，不存在按 category 动态变的图标 —— 用户看到的"信号/波浪"即 10px 铅笔，尺寸过小导致辨识失败。铅笔 SVG 10→12px（viewBox 等比同步），分类文字/CATEGORIES 数据/改分类交互均未动
  3. 顶栏：中间 `{spread}` 动态牌阵名 → 固定标题「牌面解读」；右侧时钟图标 → 汉堡三横线（与主页/历史页统一），仍为历史记录入口；左侧保持「箭头+返回」（全局返回键规则优先于高保真图的裸箭头）
  4. 卡片头部新增：左「时钟 + 牌阵·{spread}」，右描边心形（固定，非 category 动态）；删除旧「✦ 解读参考」小标签
  5. 加载态中央新增装饰：250px 虚线圆 + 196px 实线圆同心 + ✦ 星芒 + 标题「牌面解读结果」
  6. 反馈框从卡片内移出为兄弟元素，独立 18px 圆角框，rows 2→3；「根据反馈修改」文字按钮 → 框内右侧 44px 圆形描边上箭头按钮，无内容时 opacity 0.32 禁用
  7. 底部按钮：flex 三按钮 → grid 两等宽按钮，保存到历史加下载箭头图标、重新开始加刷新图标
- **未采纳高保真图的两处**（用户既定文案优先）：加载文字保留「占卜师正在夜观星象，请稍候……」（图为「AI 正在为你解读牌意…」）；反馈占位符保留「有想修改补充的地方就写在这里，留空直接保存也可以~」（图为「请输入反馈」）
- **未删除的两块**：「已选牌面」「今日问题」卡片高保真图未画，但承载真实数据，删除属砍功能而非视觉对齐，待用户明确指示
- **怎么验证**：`npm run build` ✓ 846ms（32 modules transformed）
- **关联产物**：`src/App.jsx`、`backup/v1.7.5-输出界面视觉对齐.md`

---

## 2026-08-23

### v1.7.4 牌阵提问引导词每阵独立
- **动机**：原先除万能牌阵/时间流运势牌阵外，其余牌阵共用同一句 fallback 引导词「例如：我未来一周的运势如何」，与牌阵实际用途脱节，用户不知道该写什么。
- **改了什么**（`src/App.jsx`）：
  1. 新增 `SPREAD_PLACEHOLDERS` 常量表（App.jsx:400），10 个牌阵引导词逐字录入，紧邻 `SPREAD_TOOLTIPS` 定义
  2. 两处访客端 placeholder 判断链末端接入查表：`App.jsx:1763`（主输入栏）、`App.jsx:1839`（展开弹窗输入栏），`"例如：我未来一周的运势如何"` → `(SPREAD_PLACEHOLDERS[spread] || "例如：我未来一周的运势如何")`
  3. logo 更新无需改码：`public/logo.png` 已由用户替换为重新裁剪版本，前端读 `/logo.png` 自动生效
- **业务约束**：万能牌阵、时间流运势牌阵分支在判断链前端，原引导词逐字保留未动
- **未覆盖项**：`单张牌`/`自定义牌阵` 不在清单内，沿用原 fallback；`App.jsx:2501` 管理端输入栏属另一套 UI，本轮未改
- **怎么验证**：`npm run build` ✓ 824ms（32 modules transformed）
- **关联产物**：`src/App.jsx`、`backup/v1.7.4-牌阵引导词每阵独立.md`

---

## 2026-08-23

### v1.7.3 抽牌界面收尾 3 项 + 牌阵说明提示框恢复

- **动机**：v1.7.2 验收后抽牌界面基本定稿，收尾 3 处交互/视觉问题；另恢复 UI 改版时丢失的牌阵说明提示框。
- **改了什么**（`src/App.jsx`、`src/index.css`）：
  1. 方向键翻页动效（修 bug）：旧 `nav()` 执行 `setSettling(true)`，而 settling=true 时卡牌 transition 被置 `none` —— 等于主动关掉动画导致瞬移。改为保持 `settling=false`，新增 `navAnim` 状态，翻页期间 transition 用 `transform 420ms cubic-bezier(0.33,0.9,0.28,1)`，翻页可明确感知；动画中重复点击被忽略
  2. 确认占卜弹出加速：自动翻牌初始延迟 200→40ms，间隔 160→70ms，抽完最后一张几乎即时出现
  3. 确认占卜框去外框：`border+background+borderRadius` 全去掉，改纯文字 17px/letterSpacing 4 + 双层紫色 `textShadow` 光晕 + 下方 132px 渐变发丝分隔线；slot minHeight 52→58、marginBottom 8→18 与底部导航分区；新增 CSS `@keyframes confirm-rise`（260ms 上浮淡入）；箭头 20→17px 与文字等高
  4. 牌阵说明提示框恢复：丢失原因是 v1.6.x 改版时访客端牌阵网格由 `TooltipButton` 换成自绘 div 卡片，tooltip 渲染逻辑一并丢失（`SPREAD_TOOLTIPS` 数据一直在 App.jsx:381 未删）。新增 `tipSpread` 状态实现"点一下展开、再点一下收回"，提示框沿用 `TooltipButton` 原始视觉参数
- **业务约束**：`SPREAD_TOOLTIPS` 数据定义逐字未动
- **怎么验证**：`npm run build` ✓ 831ms（32 modules transformed）
- **关联产物**：`src/App.jsx`、`src/index.css`、`backup/v1.7.3-抽牌收尾3项与牌阵说明恢复.md`

---

## 2026-08-23

### v1.7.2 抽牌界面 4 项微调（第二轮）

- **动机**：v1.7.1 验收后，抽牌界面仍有 4 处手感问题：抽中无位移、底部导航偏低、确认按钮箭头过小。
- **改了什么**（`src/App.jsx`，`VirtualDraw` 视觉层）：
  1. 动画时长复核：`pick()` 1000ms，transition 改为 `transform 980ms` + `opacity 620ms ease 340ms`，1000ms 内收尾
  2. 抽中动效补全"上移 + 渐隐"：旧版 `rotate(0deg) scale(1.06)` 原地淡出 → 新版 `translateY(-64px) rotate(${rot}deg) scale(1.04)`，保留扇形角度、先浮起再消失
  3. 底部手形/左右键上移：`paddingBottom` 24 → 64
  4. 确认占卜箭头放大：SVG 14×14 → 20×20（viewBox 保持 14，等比放大描边），与 14px 文字等重
- **复核项**（v1.7.0 已落地，本轮确认有效）：确认按钮 slot `minHeight:52` 常驻不挤压导航；自动翻牌 200ms/160ms 快速弹出
- **怎么验证**：`npm run build` ✓ 3.12s（32 modules transformed）
- **关联产物**：`src/App.jsx`、`backup/v1.7.2-抽牌界面4项微调第二轮.md`

---

## 2026-08-22

### v1.7.1 输出/解读界面改版

- **动机**：按高保真图与产品要求重建输出界面顶栏、反馈文案、按钮样式，补全历史记录全局入口。
- **改了什么**（`src/App.jsx`，输出屏幕分支）：
  1. 顶栏重建：← 返回（左）| 牌阵名居中 | 历史记录钟表图标（右，全局入口）；粘性 sticky top 56px，与其他界面样式统一
  2. 反馈框 placeholder 逐字改为：「有想修改补充的地方就写在这里，留空直接保存也可以~」
  3. 「保存到历史」按钮改为淡紫色高亮（rgba(179,171,218,0.18) 背景 + 0.5透明边框），与「重新开始」ghost 样式明显区分
  4. 历史记录全局入口：右上角钟表 SVG 按钮，onClick → setShowHistory(true)，在解读界面也能直接进历史
- **怎么验证**：`npm run build` ✓ 885ms
- **关联产物**：`src/App.jsx`、`backup/v1.7.1-输出界面改版.md`

---

## 2026-08-22

### v1.7.0 抽牌界面 4 项微调 + 输出界面开始

- **动机**：v1.6.9 验收后补充微调，并开始输出/解读界面迭代。
- **改了什么**（`src/App.jsx`）：
  1. 动画时长 1000ms：pick() 1500→1000ms；transition 1400→900ms/1100→700ms/200→150ms
  2. 自动翻牌加速：初始延迟 700→200ms，每张间隔 260→160ms，确认按钮出现更快
  3. 底部导航固定位置：`minHeight:52` 的确认按钮 slot 在按钮未出现时也保留空间，导航不被挤压；paddingBottom:24 整体上移
  4. 确认按钮图标：`›` 字符换为 14×14 SVG 箭头，与 14px 正文字号等高
- **怎么验证**：`npm run build` ✓ 1.02s
- **关联产物**：`src/App.jsx`、`backup/v1.7.0-抽牌4项微调.md`

---

## 2026-08-22

### v1.6.9 抽牌界面 4 项微调

- **动机**：v1.6.8 验收后补充细节：删除已抽缩略图、加抽牌动效、修重抽图标、返回键加文字。
- **改了什么**（`src/App.jsx`）：
  1. 删除"已抽牌背缩略图"一排（`drawn.length > 0` thumbnail strip 整块移除）
  2. 抽牌动效：pick 延迟 320ms→1500ms；被抽牌 scale(1.06) + rotate→0 + opacity→0，transition 1400ms；opacity 延迟 200ms 使"起飞"先于"消隐"
  3. 重抽图标：换为双弧线+双箭头的对称循环图标（两段 5.5r 弧 + 两个三角箭头）
  4. 返回键：补充 `<span>返回</span>` 文字，与全站返回键样式统一
- **怎么验证**：`npm run build` ✓ 856ms
- **关联产物**：`src/App.jsx`、`backup/v1.6.9-抽牌界面4项微调.md`

---

## 2026-08-22

### v1.6.8 抽牌界面 7 项细节整改

- **动机**：对照高保真图逐条修复 7 个视觉差异。
- **改了什么**（`src/App.jsx`）：
  1. 环形循环：offset 不再 clamp，wrapIdx 让牌从第 78 张无缝滑回第 1 张
  2. 顶部按钮重排：← 返回（左）| 上一张（中）| 重抽（右）；删除右上角重复的 X/Y 计数
  3. 底部手形图标放大至 32px，左右箭头 18px，权重对比明确
  4. 大字"已抽 X/Y 张"下移至牌区上方（`marginTop: auto`）
  5. 删除底部"取消"按钮，返回键即取消
  6. 所有按钮去圆形/方形描边容器，纯 icon + text 形态
  7. 背景改为 `#080910` + 三个 heavy-blur rgba 色块（blur 60–80px）营造星月远景
- **怎么验证**：`npm run build` ✓ 870ms
- **关联产物**：`src/App.jsx`、`backup/v1.6.8-抽牌界面7项细节整改.md`

---

## 2026-08-22

### v1.6.7 抽牌界面视觉高保真对齐（第二轮）

- **动机**：对照高保真参考图逐元素修复：密集扇形排布、顶部圆形图标+文字按钮、中间大字计数提示、月相装饰背景、底部圆形导航按钮组。
- **改了什么**（`src/App.jsx`）：
  1. 牌堆改为扇形辐射布局（ANGLE_STEP=4.8°，PIVOT=380px），所有牌以同一轴心展开成密集半圆扇面
  2. 顶部按钮全部改为圆形描边样式：← 返回（左）| 上一张 + 重抽（中）| 计数（右）
  3. 新增"已抽 X/Y 张"大字计数（26px/fontWeight 300）及副标题操作提示
  4. 背景改为深蓝紫 `#090b18`，叠加四个月相半透明圆环装饰（fixed 定位）
  5. 底部改为三圆形按钮：← | 手形引导图标 | →
  6. 抽牌阶段不再显示空槽位格，仅在已抽到牌后展示缩略条
- **怎么验证**：`npm run build` ✓ 852ms
- **关联产物**：`src/App.jsx`、`backup/v1.6.7-抽牌界面视觉高保真对齐.md`

---

## 2026-08-22

### v1.6.6 抽牌界面半圆交互重构

- **动机**：抽牌区需要继续贴合高保真参考，补齐密集半圆排布、滚轮切换、底部移动键和顶部图标文字按钮，同时只保留抽牌相关元素。
- **改了什么**（`src/App.jsx`）：
  1. 虚拟抽牌区改为密集半圆视觉，左右两侧牌面渐隐，拖拽/滚轮/左右键都可切换牌组
  2. 顶部新增"重抽 / 上一张"图标+文字按钮
  3. 抽牌界面收敛为纯抽牌相关内容，去掉问题描述展示
  4. 底部左右移动键下移到界面底部，并保留动效切换
- **怎么验证**：`npm run build` ✓ 837ms
- **关联产物**：`src/App.jsx`、`backup/v1.6.6-抽牌界面半圆交互重构.md`

---

## 2026-08-22

### v1.6.4 事件分类 / 输入上限 / 历史记录筛选联动同步

- **动机**：流程图更新到 v0.3 后，事件分类从 5 类调整为 6 类；主页输入框字符上限与扩展图标需要同步放大；历史记录页的筛选入口、分类文案、层级结构需要继续对齐高保真。
- **改了什么**（`src/App.jsx`）：
  1. 全局分类同步为 6 类：爱情 / 学业 / 事业 / 人际 / 成长 / 运势
  2. autoClassify()、MAIN_THEMES、历史页分类默认值与 fallback 全量同步
  3. 主输入框与展开输入框字符上限 200 → 500，计数显示改为 0/500
  4. 展开输入图标放大并上移
  5. 历史记录页标题、搜索 placeholder、筛选按钮、时间档位、分类面板与 session card 层级重构完成
- **怎么验证**：`npm run build` ✓ 893ms
- **关联产物**：`src/App.jsx`、`backup/v1.6.4-字符上限与历史分类同步.md`

---

## 2026-08-22

### v1.6.2 主页输入栏微调（定稿）

- **动机**：上一批次 expandInput 功能布局和背景不达标。
- **改了什么**（`src/App.jsx`）：
  1. 主 textarea 内：字符计数移至左下角，expand icon 移至右下角，底部对齐（`bottom:8/10`）
  2. 字符上限 150 → 200（主 textarea + modal textarea 的 onChange guard + maxLength + 显示文案全部同步）
  3. modal 卡片背景：`var(--bg-panel)`（rgba半透明）→ `#0d0f1c`（不透明实色）；textarea 背景同步改 `#161828`
- **怎么验证**：`npm run build` ✓ 847ms；主页定稿确认
- **关联产物**：`src/App.jsx`

---

## 2026-08-22

### v1.6.1 主页视觉整改

- **动机**：UI 保真度不足，与高保真参考图偏差显著；部分功能细节（toggle大小、排序、对齐）未达标；logo 无效；映射清单文案未落地。
- **改了什么**（`src/App.jsx` + `public/logo.png`）：
  1. logo：复制 `_thumb/logo透明底不带文字.png` 到 `public/logo.png`，img src="/logo.png"正常渲染
  2. Topbar：移除多余月相CSS圆圈图标；"MOON TAROT" → "月相Tarot"（per 映射清单 主页1）
  3. 副标题："THE READING RITUAL" → "What's your mind saying?"（per 映射清单 静态替换）
  4. SpreadThumbnail：新增 scale 缩放逻辑（maxH=52px），双选项抉择/凯尔特十字/质点牌阵等高牌数缩略图不再溢出格子
  5. 牌阵格子图标区：`minHeight: 50` → `height: 56`（固定高度保证标题+卡数文字底部对齐）
  6. 移除单张牌：VISITOR_SPREADS 追加 `&& s !== "单张牌"` 过滤（用户确认可删）
  7. 牌阵排序：追加 `.sort((a, b) => SPREADS[a].length - SPREADS[b].length)`，按卡牌数量递增排列
  8. 输入框扩展：新增 `expandInput` state + expand icon button（左下角）+ 全屏蒙层 textarea modal（8行，同步 question 值）
  9. Toggle 按钮放大：`padding 5px 18px / fontSize 11` → `padding 9px 24px / fontSize 13`；`useVirtual` 默认 `true`
- **映射清单复核**：主页1三项全中（月相Tarot / logo.png / What's your mind saying?），无漏映射
- **关联产物**：`src/App.jsx`；`public/logo.png`；映射清单对照：主页1 高保真 修改版.png

---

## 2026-08-22

### v1.6.0 业务流程恢复

- **动机**：UI 重构后，实体牌路径（A6 物理分支）被切断；toggle 实体/虚拟丢失；textarea placeholder 固定不变；output view 返回未重置 showCardSelect。
- **改了什么**（`src/App.jsx`）：
  1. 新增 `showCardSelect` state（`useState(false)`）
  2. 新增 `if (showCardSelect)` return 块——含 sticky topbar（牌阵名 + ☉ 实体牌标签）、CardSelector 逐槽列表、固定底部"确认 ›"按钮
  3. NEXT 按钮改为条件分支：`useVirtual ? setShowDraw(true) : setShowCardSelect(true)`
  4. 底部 toggle 双按钮（☉ 实体牌 / ◎ 虚拟抽牌）增加 pill 样式，当前选中态高亮
  5. textarea placeholder 改为动态三分支（时间流运势牌阵 / 万能牌阵 / 其他）
  6. output view "← 返回"按钮补加 `setShowCardSelect(false)` reset
- **怎么验证**：`npm run build` ✓ 3.02s 零错误；虚拟路径 NEXT→VirtualDraw 正常；实体路径全链路可走通
- **关联产物**：`src/App.jsx`；对照文档：FE-SPEC A6 节（虚实双路径）

---

## 2026-08-20

### v1.1 独立视觉重构

- **动机**：按备份母版做一版更克制的 UI，保留全部流程和业务，只换视觉语言。
- **改了什么**：新增 `src/App.v1.1.jsx`、`src/index.v1.1.css`、`src/main.v1.1.jsx`、`index.v1.1.html`; 重写为中性色+单一强调色的卡片界面，替换英文字装饰标题，补足图标化入口与更清晰的层级。
- **怎么验证**：`node --check` 通过；独立入口可从 `index.v1.1.html` 打开。
- **关联产物**：`src/App.v1.1.jsx`、`src/index.v1.1.css`、`src/main.v1.1.jsx`、`index.v1.1.html`。

## 2026-08-19

### 产品文档归档结构建立

- **动机**：产物散落在桌面、codex outputs、项目根目录三处，互相不同步；面试反馈指出"文档缺失、迭代记录缺失"。
- **改了什么**：在本地文档工作目录下建立统一目录结构（00-INDEX / 01-审计 / 02-流程图 / 03-PRD / 05-迭代记录 / 06-求职材料 / 99-原始素材），将散落产物复制归档；建立本 CHANGELOG 和总索引。
- **怎么验证**：`find . -type f` 输出与 INDEX 表一致；原文件全部保留在桌面和 codex outputs 作天然备份。
- **关联产物**：00-INDEX.md、本文件。

### 审计+PRD 合并文档 v0.3 交付并抽查通过

- **动机**：v0.2 功能范围是平铺清单，无内部结构、无排序、无逐项验收；面试反馈指出"无文档/流程图/迭代记录"。
- **改了什么**：codex 将审计 v0.2 升级为 v0.3 并合并 PRD 内容——第 6 节改为 21 张需求卡片（六要素齐全，P0 按 A1-A10 分组）；第 13 节改为 40 条"操作→预期结果"走查清单；第 16 节新增 v1.1/v1.2/v1.3 版本规划（含依赖关系）；保留保真对照表。
- **怎么验证**：抽查第 6 节（卡片六要素齐全）、第 13 节（格式正确、有验收人+方式）、第 16 节（三版本含目标+卡片+依赖）；比例骨架逐字保留。
- **关联产物**：01-审计/tarot-assistant-audit-v0.3.md、00-INDEX.md（已更新说明合并文档性质）。

### 首页信息层级方案 P0-A1-01 交付并迭代通过

- **动机**：v1.1 第一张需求卡片需要低保真方案；面试反馈"AI 视觉弱"。
- **改了什么**：codex 先出一版全展开静态低保真→反馈后返工为三状态渐进展示（①首次进入 ②关闭说明后 ③输入问题后），主操作框大于辅助框，按钮从"开始下一步"拆为"提交问题""修改分类""选择牌阵"。归档至 03-PRD/。
- **怎么验证**：对照第 13 节验收清单条目 1-2（首次进入/关闭说明后刷新不重复弹）；三状态从①到③能看出"用户每做一步长出新内容"。
- **关联产物**：03-PRD/首页信息层级方案-P0-A1-01.md。

### UI 视觉规范 v0.1 建立

- **动机**：产品负责人竞品观察（5 点：无logo/入口纯文字无图标/板块无卡片边界/信息过载/首次进入无亮点）；面试官评 AI 视觉弱。
- **改了什么**：将 5 个观察点转化为 6 条通用视觉规范（产品身份/入口符号化/卡片化/简洁化/首次亮点/适用范围），作为所有 P0 卡片的通用约束。低保真阶段标注"预留位"，高保真阶段落地。
- **怎么验证**：后续每张 P0 卡片低保真方案必须对照本规范自检。
- **关联产物**：07-设计规范/UI视觉规范v0.1.md、00-INDEX.md（已更新）。

---

## 2026-08-18

### PRD v0.2 交付并抽查通过

- **动机**：审计 v0.2 确认后，按 PM 标准产物顺序进入 PRD 阶段。
- **改了什么**：codex 生成 PRD v0.2，含 13 节（背景/用户/痛点/目标/双端流程/功能范围/页面结构/AI输出标准/评测方案/数据方案/RAG/异常流程/验收标准）；流程节点逐字引用审计第 4 节；AI 输出骨架保留原始 10 模块+比例；埋点按四要素写双清单；脑补编造设为一票否决；免责声明分流规则写入。
- **怎么验证**：保真对照表 31 行全绿；比例数字逐字对；节点名称无改写。
- **关联产物**：03-PRD/tarot-assistant-prd-v0.2.md、01-审计/tarot-assistant-audit-v0.2.md。

---

## 2026-08-17

### 审计 v0.2 交付并抽查通过

- **动机**：v0.1 把 AI 输出结构压扁成概括清单，比例权重丢失；评测方案停在概念层无技术实现。
- **改了什么**：恢复 10 模块原始比例（[输出结构权重已脱敏]）+括号内执行细节；评测方案拆成规则检查/异步评审/离线批量三方案，含成本、串行异步、界面、降级；评分表 12 维度写 1/3/5 分；RAG 写成目标能力而非已实现；保真对照表 31 行。
- **怎么验证**：逐项核对原始拆分；笔误"水货"修正为"水火相互抑制"。
- **关联产物**：01-审计/tarot-assistant-audit-v0.2.md。

### 用户流程图定稿

- **动机**：审计后发现流程未被文档化，缺事实来源。
- **改了什么**：用户手搓双端流程图（访客端 A1-A10、历史 B1-B4、管理端 C1-C5），符号按 GB/T 1526 规范化（胶囊/矩形/菱形/平行四边形/圆柱/虚线便签）。
- **怎么验证**：文字转录逐字引用作为唯一事实来源；后续 PRD 引用此节点。
- **关联产物**：02-流程图/真正的手搓修改版双端流程图.png。

---

## 2026-08-16

### 项目审计启动 + 评测反馈组织

- **动机**：用户对 codex 末版输出不满（细节被压缩、评审无方案、PRD/流程图缺失）。
- **改了什么**：组织四点反馈文案（比例恢复、评审技术方案、评分维度细化、审计 v0.2 写法约束）；教 PM 产物链路（审计→流程图→PRD→原型→评测表）。
- **关联产物**：99-原始素材/对话文档.docx。

---

## 模板（以后每次迭代照抄）

```
## YYYY-MM-DD

### v1.X.X 简短标题
- **动机**：为什么改？（对应哪个痛点/面试反馈/用户反馈）
- **改了什么**：具体改动点，可列清单
- **怎么验证**：怎么确认这次改对了？（走查/数据/评测表/构建通过）
- **关联产物**：改了哪些文件路径
```
