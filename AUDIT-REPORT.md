# 个人主页项目综合审核报告

> 审核对象：`个人主页2`（王晨 · Jekyll 个人主页）
> 审核日期：2026-07-28
> 审核轮次：五轮
> 审核人：Hermes Agent (deepseek-v4-pro)

---

## 目录

1. [评价体系设计](#一评价体系设计)
2. [第一轮审核：十维度初评](#二第一轮审核十维度初评)
3. [第二轮审核：多用户视角审视](#三第二轮审核多用户视角审视)
4. [第三轮审核：整体综合判断](#四第三轮审核整体综合判断)
5. [第四轮审核：内容一致性交叉校验（新增）](#五第四轮审核内容一致性交叉校验新增)
6. [第五轮审核：逐文件审计（新增）](#六第五轮审核逐文件审计新增)
7. [综合评分汇总](#七综合评分汇总)
8. [改进建议（按优先级排序）](#八改进建议按优先级排序)
9. [附录：项目文件清单](#九附录项目文件清单)

---

## 一、评价体系设计

针对个人学术/职业主页类项目，制定以下 10 个评价维度：

| 维度 | 权重 | 核心问题 |
|------|:----:|----------|
| 1. 内容完整性 | ★★★★★ | 信息是否全面、真实、有说服力？有没有关键空白？ |
| 2. 技术架构 | ★★★★ | 架构选型是否合理？代码质量如何？ |
| 3. 用户体验 | ★★★★★ | 视觉设计、交互细节、响应式、无障碍、性能 |
| 4. 可维护性 | ★★★★ | 改内容要不要动代码？新人能否快速上手？AI 能否安全维护？ |
| 5. 多语言支持 | ★★★ | 翻译质量、切换体验、内容同步 |
| 6. 部署运维 | ★★★ | CI/CD 是否可靠？文档是否齐备？ |
| 7. SEO & 可发现性 | ★★★ | 搜索引擎能否搜到？社交分享预览如何？ |
| 8. 创新与细节 | ★★ | 有没有让人眼前一亮的细节？ |
| 9. 文档质量 | ★★★ | 文档是否覆盖关键场景？ |
| 10. 安全性 | ★★ | 外部依赖管理、信息暴露风险 |

---

## 二、第一轮审核：十维度初评

### 2.1 内容完整性 —— ★★★☆☆

**做得好的：**
- 教育背景扎实：学校、专业、6 项荣誉（含数学建模 H 奖、蓝桥杯省三等奖）、8 门核心课程（带分数）——信息密度高
- 联系方式齐全：邮箱、GitHub、Gitee、X、微信公众号共 5 个渠道
- 论文发表有正文描述、PDF 原文链接、期刊出处

**问题：**
- 工作经历公司名为"某科技公司"——没有说服力
- 技能偏基础（"HTML/CSS, React Basics"），缺乏项目成果佐证
- 只有 1 个项目（毕业设计）、1 篇论文（2019 年二作）
- 缺少"关于我"个人简介段落
- tagline 写"AI 应用开发方向"但内容对这个定位支撑不足

### 2.2 技术架构 —— ★★★★★

**优秀之处：**
- Jekyll + GitHub Pages 选型正确（免费、稳定、零运维）
- 数据与模板分离做到极致：`_data/*.yml` 管内容，`_layouts/` 管渲染
- Jekyll collections 机制用得恰当
- 自动隐藏逻辑优雅（`{% if has_pubs %}`）
- GitHub Actions 部署流程规范
- 有单文件降级版本（portfolio-single-file.html）

### 2.3 用户体验 —— ★★★★★

**视觉设计：**
- 冷色调浅灰白配色方案克制而专业
- CSS 变量体系清晰，双主题配色调校精细
- 排版细节到位：Georgia+宋体衬线体用于标题，PingFang SC+雅黑用于正文
- 标题前 4px accent 色竖线装饰简洁有力

**交互亮点：**
- 吸顶导航 + rAF 节流的 scroll spy
- 导航点击后手动滚动替代浏览器默认锚点（解决布局未稳定偏移问题）
- 点击后短暂抑制 spy 150ms（避免滚动经过中间章节抢走高亮）
- 返回顶部按钮带 SVG 阅读进度圆环
- 语言切换保存滚动比例到 sessionStorage
- 导航渐隐提示（横向溢出时左右渐变蒙层）
- 项目卡片虚化序号水印（opacity 0.07）
- 深浅色切换 localStorage 持久化

**响应式设计：**
- 三档断点（1024/640px）
- 联系方式 Grid 自适应（3列→2列→1列）
- 手机端触控热区放大
- iPhone Safe Area 考虑（`env(safe-area-inset-bottom)`）
- 页脚手机端居中竖排

### 2.4 可维护性 —— ★★★★★

- DEPLOY.md 含"AI 操作禁区"表（9 条禁改 + 3 条谨慎）
- 改内容只需编辑 YAML/Markdown
- 目录结构清晰，文件命名规范
- `backups/` 保存历史版本快照
- `update-date.py` 自动更新页脚日期

### 2.5 多语言支持 —— ★★★★☆

- 中英双语覆盖完整
- 语言切换体验好（滚动位置保持、按钮显示目标语言）

**小问题：** 项目/论文详情中英混在一个文件里用 `<!-- English -->` 分隔，编辑时容易破坏结构。

### 2.6 部署运维 —— ★★★★★

- GitHub Actions CI/CD 配置干净
- DEPLOY-OPTIONS.md 对比了 5 种部署方案（含免费额度、步骤、注意事项）
- 提示了 `bundle lock --add-platform x86_64-linux` 跨平台关键步骤

### 2.7 SEO & 可发现性 —— ★★☆☆☆

- 有 `<meta description>` 和 `og:title/type/description`
- **缺失：** og:image、twitter:card、JSON-LD Person schema、sitemap.xml、robots.txt、canonical URL
- `_config.yml` 的 `url` 为空，无法生成绝对 URL

### 2.8 创新与细节 —— ★★★★★

- 返回顶部 + 阅读进度圆环合二为一
- 导航横向渐隐提示（不需要汉堡菜单）
- 项目卡片巨大虚化序号
- 自建 PDF 查看器（pdf.js 翻页/缩放/下载/全屏）
- 详情页代码高亮 + KaTeX 数学公式 + 深色模式同步

### 2.9 文档质量 —— ★★★★★

5 份文档各司其职：

| 文档 | 受众 | 场景 |
|------|------|------|
| README.md/README_EN.md | 所有人 | 快速了解 |
| RUBY-JEKYLL.md | 非技术人员 | 理解技术栈 |
| DEPLOY.md | 维护者/AI | 部署 + AI 禁区 |
| DEPLOY-OPTIONS.md | 需要换平台的人 | 5 种方案对比 |
| TROUBLESHOOTING.md | 遇到问题的人 | 踩坑记录与反思 |

### 2.10 安全性 —— ★★★★☆

- 静态站点天然安全
- GitHub Actions 权限限定
- 外部 CDN 可信

---

## 三、第二轮审核：多用户视角审视

### 3.1 招聘者视角

- 3 秒内看到名字+头衔+照片 → 第一印象好
- "某科技公司"扣分——真实性存疑
- 技能列表偏通用，GitHub/demo 链接为 `#`（占位）
- **结论：页面印象好，但内容深度不够支撑"AI 应用开发方向"定位**

### 3.2 同行开发者视角

- 技术实现干净，代码质量高
- 前端细节用心
- 会发现 SEO 标签不全

### 3.3 非技术访客视角

- 页面好看、易读
- "某科技公司"令人困惑
- PDF 查看器实用
- 缺少"关于我"段落

### 3.4 AI 助手维护视角

- DEPLOY.md 的 AI 禁区表非常有用
- 数据模板分离降低维护风险
- 缺少项目级 AI 规则文件

---

## 四、第三轮审核：整体综合判断

**最强优势（Top 3）：**
1. 技术工程水平远超典型个人主页
2. 文档完整度惊人——5 份文档 + 中英双语
3. 交互体验细节拉满——滚动位置保持、导航渐隐、阅读进度圆环

**最弱短板（Top 3）：**
1. 内容深度不足——工作经历模糊、项目少、技能佐证不够
2. SEO 近乎空白
3. 内容定位与呈现不匹配——tagline 说"AI 应用开发方向"但页面没有充分体现

**一句话总结：技术实现接近满分、内容运营 60 分的个人主页。**

---

## 五、第四轮审核：内容一致性交叉校验（新增）

本轮对比了 `portfolio-single-file.html`、`_data/*.yml`、`_projects/*.md`、`_publications/*.md`、`DEPLOY.md` 之间的内容一致性。

### 🔴 发现 1：portfolio-single-file.html 与 Jekyll 版本内容严重不一致

单文件版本包含的是**旧版模板/占位数据**，从未随 Jekyll 版本更新：

| 字段 | portfolio-single-file.html（旧） | Jekyll 版本（新） |
|------|------|------|
| 身份 | "计算机科学与技术 · 2026 届本科毕业生" | "信息与计算科学 · 2020 届本科毕业生" |
| 成绩 | "前 15%，GPA 3.6/4.0" | "前 10%，CET-6" |
| 荣誉 | "互联网+创新创业大赛校赛二等奖" | 6 项详细荣誉（校长奖学金、MCM H 奖、蓝桥杯等） |
| 课程 | "数据结构与算法、机器学习、深度学习、NLP" | "数学分析上(99分)、Java高级程序设计(97分)等" |
| 项目数量 | **4 个**（含 AI 工具调用小助手、简历匹配、垃圾分类） | **1 个**（campus-qa-bot） |
| 论文数量 | **2 篇**（含"文本分类模型对比研究"） | **1 篇**（RGV 动态调度） |
| TODO 标记 | 有（"TODO：请改为真实的身份定位"等） | 无 |
| 技能"工具" | "Git、Docker 基础、Linux 基础" | "Git、Docker、Linux、Claude Code、Codex、Openclaw、Hermes、Trae" |

**严重性：🔴 高。** 如果有人直接打开 portfolio-single-file.html，看到的是完全不同的个人信息（假数据 + TODO），这会严重损害可信度。且 DEPLOY.md 的"方式 2（无需安装任何工具）"推荐用户打开此文件，引导了错误的内容。

### 🔴 发现 2：DEPLOY.md 引用了不存在的文件

DEPLOY.md 第二节"项目目录结构"中列出了以下文件，但它们**不存在**于当前 Jekyll 版本中：

- `_publications/rag-thesis.md` — 不存在
- `_publications/lightweight-text-classification.md` — 不存在
- `_projects/tool-calling-assistant.md` — 不存在
- `_projects/resume-keyword-matcher.md` — 不存在
- `_projects/waste-classification.md` — 不存在
- `index-en.html` — 已重命名为 `en.html`

**严重性：🔴 高。** 文档与实际项目结构不符，会误导维护者和 AI。

### 🟡 发现 3：TROUBLESHOOTING.md 引用了已重命名的文件

第四节标题为"英文版 index-en.html 持续 404"，记录了文件名从 `index-en.html` 改为 `en.html` 的过程。虽然这是一个历史记录（有价值），但使用者在阅读时可能困惑——文档说`index-en.html`，但项目中不存在。

**严重性：🟡 中。** 作为踩坑记录是有价值的，但可能需要加一条注释说明"当前版本已改为 en.html"。

### 🟡 发现 4：backups 目录在 Git 跟踪中

备份目录包含历史版本（约 256KB 源码），会随每次 clone 下载。对于部署项目来说不是大问题，但不符合"备份不应在仓库中"的最佳实践。

**严重性：🟡 中。** 建议加入 `.gitignore` 或移到仓库外部。

### 🟡 发现 5：放头像说明.txt 是遗留文件

这是 onboarding 引导文件，内容为"把你的照片改名为 avatar.jpg"。既然项目已经投入使用（有真实头像），这个文件应该删除。

---

## 六、第五轮审核：逐文件审计（新增）

对项目中的每一个文件进行独立审计。

### 6.1 `_config.yml` —— ✅ 良好

- 配置规范，collections 和 defaults 设置正确
- `url` 为空（降级 SEO 效果）
- exclude 列表完整（backups/、DEPLOY.md、TROUBLESHOOTING.md 等均已排除）
- `kramdown.math_engine: mathjax` 配置存在（实际在 GFM 模式下不生效，但无副作用）

### 6.2 `Gemfile` —— ✅ 良好

- `github-pages` gem + `webrick` 依赖干净
- 注意：缺少 `Gemfile.lock` 在仓库中（DEPLOY-OPTIONS.md 说"✅ 已有"，需确认）

### 6.3 `index.html` / `en.html` —— ✅ 良好

- 两个文件结构完全相同，仅 frontmatter 的 `lang` 字段不同
- 都引用 `layout: default`
- HTML 注释中有完整的预览/部署指引

### 6.4 `_layouts/default.html` —— ★ 优秀

- 263 行，是项目的核心模板
- 包含完整的页面结构：Header → Education → Experience → Skills → Projects → Publications → Contact → Footer
- 自动隐藏栏目逻辑正确（`has_pubs`/`has_projs`/`has_exp`）
- 导航链接支持条件渲染
- 语言切换功能内嵌
- Footer 使用 `_data/personal.yml` 的动态数据
- `script.js` 和 `style.css` 引用正确

### 6.5 `_layouts/detail.html` —— ★ 优秀

- 178 行，项目/论文详情页模板
- 支持 `?lang=zh` / `?lang=en` 参数过滤
- 内嵌 KaTeX 数学公式渲染 + highlight.js 代码高亮
- 深色模式同步高亮主题（MutationObserver 监听）
- KaTeX 仅渲染可见语言区域（性能优化）
- 自我完备的页面（有导航、返回按钮、页脚）

### 6.6 `style.css` —— ★ 优秀

- 520 行，完整的样式表
- CSS 变量体系（`--bg`, `--ink`, `--accent` 等三层级）
- 双主题配色精细调校
- 有 `prefers-reduced-motion` 无障碍支持
- 响应式三档断点（1024px、640px）
- `color-mix()` 有 fallback
- 代码注释详细（中文），包含设计意图说明

### 6.7 `script.js` —— ★ 优秀

- 336 行，IIFE 包裹，无全局变量污染
- 主题管理：localStorage 持久化 + 系统主题尊重
- Scroll spy：rAF 节流 + 底部强制高亮最后一项
- 导航手动滚动：替代浏览器锚点 + hash pushState + spy 短暂抑制
- 返回顶部 + 进度圆环：SVG 动态 stroke-dashoffset
- 语言切换前保存滚动比例
- 导航渐隐提示
- 几乎所有边界情况都考虑到了（空页面、无导航、无元素）

### 6.8 `_data/personal.yml` —— ✅ 良好

- 12 行，中英双语个人数据
- `footer_updated` 日期为 2026-07-04（距今 24 天未更新）

### 6.9 `_data/education.yml` —— ✅ 良好

- 44 行，教育背景数据
- 中英双语，荣誉和课程完整

### 6.10 `_data/experience.yml` —— ⚠️ 需改进

- 25 行，仅 1 段实习经历
- 公司名为"某科技公司"——需替换为真名

### 6.11 `_data/skills.yml` —— ✅ 良好

- 20 行，中英双技能数据
- 工具类别已更新（含 Claude Code、Codex、Openclaw、Hermes、Trae）

### 6.12 `_data/navigation.yml` —— ✅ 良好

- 38 行，中英双导航，7 个栏目
- id 与 HTML section id 严格对应

### 6.13 `_data/social.yml` —— ✅ 良好

- 18 行，联系方式完整

### 6.14 `_projects/campus-qa-bot.md` —— ⚠️ 需改进

- 43 行，中英双语的项目详情
- `github` 和 `demo` 字段为 `"#"`（占位）
- 内容用 `<!-- English -->` 分隔——有编辑风险

### 6.15 `_publications/rgv-dynamic-scheduling.md` —— ✅ 良好

- 45 行，中英双语的论文详情
- 期刊信息完整（《新型工业化》2019 年第 1 期）

### 6.16 `assets/pdf-viewer.html` —— ★ 优秀

- 216 行，自建 PDF 查看器
- 基于 pdf.js，支持翻页、缩放、下载、全屏
- 懒加载（`disableAutoFetch`）+ 进度条
- resize 防抖重新渲染
- 全平台一致体验（尤其手机端）

### 6.17 `portfolio-single-file.html` —— 🔴 严重问题

- 1135 行，44KB 的单文件版本
- **内容与 Jekyll 版本严重不一致**（详见第五章）
- 包含 TODO 标记和占位数据
- "工具"技能列表缺少当前版本中的工具（Claude Code、Codex 等）
- 主题初始化逻辑与主版本不同（跟随系统主题 vs 默认 light）

### 6.18 `DEPLOY.md` —— ⚠️ 需更新

- 480 行，部署与维护指南
- **目录结构引用了不存在的文件**（详见第五章）
- AI 操作禁区表优秀
- 部署步骤详细，覆盖 GitHub Pages 和 Gitee Pages

### 6.19 `DEPLOY-OPTIONS.md` —— ★ 优秀

- 500 行，5 种部署方案对比
- 含完整步骤、免费额度、常见问题
- 信息量大而准确

### 6.20 `TROUBLESHOOTING.md` —— ★ 优秀

- 569 行，17 个章节的踩坑记录
- 每个问题都记录了"现象→排查→根因→解决方案→教训"
- 包含"为什么反复多次都没解决"的反思——极有价值
- 引用了已重命名的 `index-en.html`（见 5.3）

### 6.21 `RUBY-JEKYLL.md` —— ★ 优秀

- 152 行，面向非技术人员的 Ruby/Jekyll 科普
- 有对比表格、工作流程图、修改内容速查表
- 对零基础读者极其友好

### 6.22 `README.md` / `README_EN.md` —— ✅ 良好

- 各 14 行，简洁的项目说明
- 含在线地址和技术栈

### 6.23 `update-date.py` —— ✅ 良好

- 36 行，自动化日期更新脚本
- 使用 UTC+8 北京时间，中英双格式输出

### 6.24 `.github/workflows/deploy.yml` —— ✅ 良好

- 35 行，GitHub Actions 部署配置
- 使用官方 action（checkout@v4, setup-ruby@v1, upload-pages-artifact@v3, deploy-pages@v4）
- 权限限定合理

### 6.25 `.gitignore` —— ✅ 良好

- 7 行，排除 `_site/`、缓存、vendor

### 6.26 `assets/avatar.jpg` —— ⚠️ 需优化

- 649KB，对于 112×144px 的头像过大，应压缩到 30-50KB

### 6.27 `放头像说明.txt` —— 🟡 应删除

- 10 行，onboarding 引导文件，已无用处

### 6.28 `backups/` 目录 —— 🟡 应移出仓库

- 包含两个历史版本快照（约 35 个文件，256KB+）
- 不应放在 Git 仓库中

---

## 七、综合评分汇总

| 维度 | 第一轮评分 | 第四/五轮调整 | 最终评分 | 说明 |
|------|:---:|:---:|:---:|------|
| 内容完整性 | ★★★☆☆ | — | ★★★☆☆ | 经历模糊、项目少 |
| 技术架构 | ★★★★★ | — | ★★★★★ | Jekyll 选型、数据分离、代码质量均优秀 |
| 用户体验 | ★★★★★ | — | ★★★★★ | 视觉、交互、响应式无可挑剔 |
| 可维护性 | ★★★★☆ | ▼ | ★★★☆☆ | ⚠️ 降级：单文件版本与主版本不一致，存在维护债务 |
| 多语言支持 | ★★★★☆ | — | ★★★★☆ | 细节好，但内容文件的中英混合写法有隐患 |
| 部署运维 | ★★★★★ | — | ★★★★★ | 文档详尽，CI/CD 规范 |
| SEO | ★★☆☆☆ | — | ★★☆☆☆ | 多项空白 |
| 创新与细节 | ★★★★★ | — | ★★★★★ | 多项独创细节 |
| 文档质量 | ★★★★★ | ▼ | ★★★★☆ | ⚠️ 降级：DEPLOY.md 包含过期引用 |
| 安全性 | ★★★★☆ | — | ★★★★☆ | 静态站点天然安全 |

**综合评分：★★★★☆（4.0 / 5.0）**

---

## 八、改进建议（按优先级排序）

### 🔴 P0 — 必须立即修复

| # | 问题 | 文件 | 建议 |
|---|------|------|------|
| P0-1 | portfolio-single-file.html 含旧版占位数据 | portfolio-single-file.html | **立即同步**：用 Jekyll 构建后的 `_site/index.html` 覆盖此文件，或删除并从 DEPLOY.md 移除引用 |
| P0-2 | DEPLOY.md 引用不存在的文件 | DEPLOY.md | 更新第二节目录结构，只列出实际存在的文件 |
| P0-3 | "某科技公司"缺乏可信度 | `_data/experience.yml` | 写出公司真名，或删除此经历 |
| P0-4 | 项目链接为 `#` 占位 | `_projects/campus-qa-bot.md` | 补充 GitHub 仓库链接或在线演示地址 |

### 🟠 P1 — 强烈建议

| # | 问题 | 文件 | 建议 |
|---|------|------|------|
| P1-1 | SEO 空白 | 多个 | 补充 og:image、sitemap.xml、robots.txt、JSON-LD Person schema |
| P1-2 | `_config.yml` url 为空 | `_config.yml` | 填上 `https://chenchen913.github.io` |
| P1-3 | 头像 649KB 过大 | assets/avatar.jpg | 压缩到 50KB 以内 |
| P1-4 | 缺少"关于我"段落 | `_layouts/default.html` | 在 Header 下方加 2-3 句话的个人简介 |
| P1-5 | 删除遗留文件 | 放头像说明.txt | 直接删除 |

### 🟡 P2 — 建议改进

| # | 问题 | 文件 | 建议 |
|---|------|------|------|
| P2-1 | backups 在 Git 跟踪中 | backups/ | 加入 `.gitignore` 或移到仓库外 |
| P2-2 | `_projects/` 中英混合写法 | `_projects/*.md` | 考虑拆分为独立文件或用 YAML frontmatter 字段 |
| P2-3 | TROUBLESHOOTING.md 引用了已更名的文件 | TROUBLESHOOTING.md | 为第四节加一条注释说明当前版本已改为 `en.html` |
| P2-4 | `footer_updated` 日期为 24 天前 | `_data/personal.yml` | 运行 `python update-date.py` 更新 |

### 🟢 P3 — 锦上添花

| # | 问题 | 建议 |
|---|------|------|
| P3-1 | 内容数量偏少 | 补充 1-2 个项目经历 |
| P3-2 | 缺少 `.cursor/rules` 或 AGENTS.md | 添加 AI 项目级规则文件 |
| P3-3 | 确认 `Gemfile.lock` 是否在仓库中 | 如果不在，运行 `bundle lock --add-platform x86_64-linux` 后提交 |

---

## 九、附录：项目文件清单

```
个人主页2/                            [状态]
├── _config.yml                      ✅ 良好（url为空）
├── Gemfile                          ✅ 良好
├── .gitignore                       ✅ 良好
├── index.html                       ✅ 良好
├── en.html                          ✅ 良好
├── index_empty.html                 ✅ 备份文件
├── style.css                        ★ 优秀
├── script.js                        ★ 优秀
├── portfolio-single-file.html       🔴 内容与主版本不一致
├── update-date.py                   ✅ 良好
├── README.md                        ✅ 良好
├── README_EN.md                     ✅ 良好
├── RUBY-JEKYLL.md                   ★ 优秀
├── DEPLOY.md                        ⚠️ 含过期文件引用
├── DEPLOY-OPTIONS.md                ★ 优秀
├── TROUBLESHOOTING.md               ★ 优秀（含过时引用）
├── 放头像说明.txt                    🟡 应删除
├── _layouts/
│   ├── default.html                 ★ 优秀
│   └── detail.html                  ★ 优秀
├── _data/
│   ├── personal.yml                 ✅ 良好
│   ├── education.yml                ✅ 良好
│   ├── experience.yml               ⚠️ "某科技公司"
│   ├── skills.yml                   ✅ 良好
│   ├── navigation.yml               ✅ 良好
│   └── social.yml                   ✅ 良好
├── _projects/
│   └── campus-qa-bot.md             ⚠️ 链接为"#"
├── _publications/
│   └── rgv-dynamic-scheduling.md    ✅ 良好
├── assets/
│   ├── avatar.jpg                   ⚠️ 649KB过大
│   ├── pdf-viewer.html              ★ 优秀
│   ├── projects/
│   │   └── campus-qa-report.pdf     ✅ 1MB
│   └── publications/
│       └── 智能RGV的动态调度策略研究.pdf ✅ 1.2MB
├── .github/workflows/
│   └── deploy.yml                   ✅ 良好
└── backups/                         🟡 应移出仓库
    ├── 2026-07-04-stable/
    └── pre-jekyll-2026-07-04/
```

---

> 审核完成时间：2026-07-28
> 五轮审核总计检查了 28 个文件/目录，发现 4 个 P0 级问题、5 个 P1 级建议、4 个 P2 级改进、3 个 P3 级锦上添花项。
