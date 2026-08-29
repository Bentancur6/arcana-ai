# Arcana AI · 公开作品集材料索引

> 本目录只收录适合公开展示的产品、设计和项目复盘材料。原始聊天记录、客户数据、环境变量、Prompt 完整模板、内部评分样例和未脱敏工作底稿不随仓库发布。

## 公开材料

| 类型 | 文件 | 说明 |
|---|---|---|
| 项目说明 | [项目说明（在线阅读）](project-brief/project-brief.md) | 产品定位、用户场景、C/B 端边界、质量运营、RAG 与交付结果 |
| 项目说明 | [项目说明（下载/打印版 PDF）](project-brief/%E7%86%8A%E5%A6%8D-AI%E4%BA%A7%E5%93%81%E7%BB%8F%E7%90%86%E9%A1%B9%E7%9B%AE%E8%AF%B4%E6%98%8E.pdf) | 同一份项目说明的排版版本，便于下载或打印 |
| 产品审计 | [tarot-assistant-audit-v0.3-public.md](audit/tarot-assistant-audit-v0.3-public.md) | 脱敏后的用户流程、问题审计、需求优先级、评测方案和验收思路 |
| 迭代记录 | [CHANGELOG-public.md](changelog/CHANGELOG-public.md) | 脱敏后的版本演进、产品决策、实现路线和验证记录 |
| 用户流程图 | [v0.4-dual-mode-product-flow.png](flowcharts/v0.4-dual-mode-product-flow.png) | C 端访客流程与 B 端管理流程总览 |
| 低保真原型 | [low-fidelity-prototype-modao.zip](design/low-fidelity-prototype-modao.zip) | 墨刀低保真页面与交互结构 |
| 高保真设计 | [high-fidelity-figma.rar](design/high-fidelity-figma.rar) | Figma 高保真页面资源包 |

## 脱敏边界

以下内容仅保留为项目能力说明，不公开原文或具体参数：

- 客户姓名、真实聊天记录、可识别的咨询内容和内部测试样例；
- Prompt 完整模板、模块权重、内部标记和逐条提示词；
- API 凭证、数据库连接信息、环境变量和本地绝对路径；
- 内部模型评审成本、调用参数和未对外承诺的运营数据；
- 原始工作目录中的对话记录、备份、私密知识库和中间产物。

## 目录约定

```text
 docs/portfolio/
 ├── audit/          # 脱敏产品审计
 ├── changelog/      # 脱敏迭代记录
 ├── flowcharts/     # 对外流程图
 ├── project-brief/  # 项目说明
 └── design/         # 对外设计源文件压缩包
```

## 使用建议

建议先阅读项目说明（在线阅读版），再结合流程图理解双端产品边界；需要追问技术实现时，可继续查看仓库中的 React、Express、MongoDB Atlas、RAG、质量评审和部署代码。
