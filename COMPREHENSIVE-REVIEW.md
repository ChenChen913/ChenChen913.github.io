# 项目综合审查报告（Comprehensive Review）

- **审查对象**：王晨 · 个人主页（Jekyll + GitHub Pages）
- **审查日期**：2026-07-28
- **审查方式**：独立审查。本报告第 1—4 部分在**未阅读** INDEPENDENT-AUDIT.md 的前提下独立完成，第 5 部分为事后对照评价与融合，第 6 部分为历史审计存档。
- **审查性质**：第 1—5 部分为只读审查，未修改项目中任何文件与代码。

> 📌 **文档状态（2026-07-28 融合提交）**：本文件现为项目唯一有效审计文档，已加入 `_config.yml` 的 exclude 列表（不会发布到线上）。原 INDEPENDENT-AUDIT.md 已于同日融合进本报告第 5、6 部分后删除，原文可用 `git log --all -- INDEPENDENT-AUDIT.md` 从 Git 历史找回（更早的 AUDIT-REPORT.md 同理）。本报告全文刻意不含 Liquid 模板语法字符，不会引发 Jekyll 构建失败。

---

## 1. 审查标准（针对个人主页类项目）

个人主页项目不同于业务系统：无后端、无数据库、单人维护、访问者主要是招聘方与同行。因此标准侧重"内容可信、构建稳定、体验专业、长期可维护"，共 8 个维度：

| # | 维度 | 关注点 |
|---|------|--------|
| S1 | 内容正确性与双语一致性 | 中英文内容对应、事实性信息（链接、日期、课程、奖项）准确无占位残留 |
| S2 | 构建与部署可靠性 | Jekyll 配置正确、exclude 完整、CI 流程健壮、构建可复现 |
| S3 | 前端工程质量 | HTML 语义化、JS 健壮性（异常兜底、性能节流）、CSS 组织 |
| S4 | 性能 | 资源体积、第三方库按需加载、避免不必要的重排/重绘 |
| S5 | SEO 与可发现性 | meta/canonical/sitemap/robots/结构化数据/双语页面互指 |
| S6 | 安全与隐私 | CDN 资源完整性校验（SRI）、外链 rel 属性、个人信息暴露面控制 |
| S7 | 可访问性（a11y） | aria 标签、键盘可达、动效偏好尊重、屏幕阅读器语言正确 |
| S8 | 可维护性与工程卫生 | 内容与模板分离、文档完备、Git 卫生、编辑器规范、许可证 |

---

## 2. 总体结论

**总评：A−（约 90 / 100）。** 对一个个人主页项目而言，这是**远超平均水准**的工程质量。内容驱动架构（`_data/` YAML + 模板）、KaTeX/highlight.js 按需条件加载、CDN 资源全部带 SRI、深浅色主题防闪烁、prefers-reduced-motion 尊重、完整的内部文档体系（部署/排障/审计），都体现出成熟的工程习惯。Git 历史清晰，工作区干净，历次审计修复有据可查。

未发现任何 P0（阻断级）问题。以下按严重程度列出发现项。

---

## 3. 发现的问题

### 3.1 P1 — 建议尽快处理

**F1. 仓库缺少 Gemfile.lock，CI 构建不可复现**
`.github/workflows/deploy.yml` 使用 `ruby/setup-ruby@v1` 且开启 `bundler-cache: true`，但仓库中没有提交 Gemfile.lock。后果：① 每次 CI 构建实际解析到的 gem 版本可能不同（`github-pages ~> 232` 只是范围约束），上游 gem 更新可能导致某天构建突然失败或产物变化；② bundler 缓存的命中效果打折。建议本地执行 `bundle lock` 后将 Gemfile.lock 提交入库。

**F2. 项目详情页的 GitHub 链接指向错误仓库**
`_projects/campus-qa-bot.md` 中 `github:` 字段指向 `https://github.com/ChenChen913/ChenChen913.github.io`——这是**个人主页本身的仓库**，而不是"校园知识库问答机器人"项目的仓库。招聘方点进去看到的是主页源码而非该项目源码，属于内容可信度问题。若该项目未开源，建议直接删掉该字段（模板已支持无链接时自动隐藏）。

### 3.2 P2 — 值得修复

**F3. 详情页浏览器标签标题恒为中文**
`_layouts/detail.html` 的 title 与 og:title 始终使用中文标题（meta_zh.title），英文访客通过 `?lang=en` 访问时，页面正文是英文但浏览器标签页、分享卡片标题仍是中文。可用 JS 在语言修正脚本中同步替换 document.title。

**F4. 双语页面缺少 hreflang 互指**
index.html 与 en.html 是同一内容的双语版本，但 head 中没有 `rel="alternate" hreflang` 互指标签，搜索引擎无法识别两者的语言对应关系，可能出现英文用户搜到中文页的情况。属于 SEO 基础设施的最后一块拼图（sitemap/robots/canonical/JSON-LD 均已就绪）。

**F5. 跨页面滚动位置恢复存在逻辑串扰**
script.js 在 beforeunload 时**无条件**将滚动比例写入 sessionStorage（键 `_scrollRatio`），而 default.html 加载时会读取并恢复。问题场景：用户在主页滚动到 60% → 点进项目详情页（此时保存了主页的 60%）→ 在详情页滚到底部点"返回主页"（beforeunload 又触发，**用详情页的滚动比例覆盖**了主页的）→ 主页恢复到一个错误的位置。该机制本意是服务"中英文切换保持位置"，但对所有导航一视同仁地保存，导致详情页往返时位置错乱。建议仅在点击语言切换按钮时保存。

**F6. deploy.yml 缺少 concurrency 配置**
连续两次 push 会触发两个并行的 Pages 部署任务，可能出现旧构建后完成覆盖新构建的竞态。GitHub 官方 Pages 工作流模板均包含 `concurrency: group: "pages"` 配置，建议补上。

**F7. 首次访问不跟随系统深色偏好，且与 theme-color 矛盾**
主题初始化逻辑是"localStorage 无记录则强制 light"，而 head 中的两条 theme-color meta 却按 prefers-color-scheme 分深浅。结果：深色系统用户首次访问时，浏览器 UI（地址栏）是深色、页面内容却是浅色，观感割裂。建议首访时以 `window.matchMedia('(prefers-color-scheme: dark)')` 为默认值（用户手动切换后仍以 localStorage 为准）。

### 3.3 P3 — 可选改进

**F8. 疑似课程名笔误**：`_data/education.yml` 中"外部程序设计（94 分）"（英文版对应 "External Programming"）不是常见课程名，疑似"Web 程序设计"或其他课程的笔误，建议核对成绩单。
**F9. 缺少自定义 404 页面**：GitHub Pages 支持根目录放置 404.html，当前访问失效链接会看到 GitHub 默认 404，与站点风格不符。
**F10. og:image 使用证件照头像**：avatar.jpg（约 17 KB，竖版小图）作为社交分享卡片图，在微信/X 等平台展示效果差，规范尺寸为 1200×630。
**F11. CI 无构建产物校验**：Actions 只做 build + deploy，可加一步 htmlproofer（或类似工具）校验死链、图片 alt 缺失等，防止内容性回归。
**F12. 邮箱混淆强度有限**：email-link 的 data-u/data-d 属性中仍是明文的邮箱两段，能执行简单拼接规则的爬虫仍可还原。作为静态站这是合理的折中，但不应视其为有效防护。
**F13. 路径写法不一致**：default.html 中样式表与头像用纯相对路径（style.css、assets/avatar.jpg），detail.html 则用 relative_url 过滤器生成根路径。当前都能工作（主页在根目录），但属于隐性约定，未来若增加嵌套页面复用 default 布局会踩坑。
**F14. 布局内散落内联样式**：detail.html 与 default.html 有十余处 style="..." 内联样式，建议归入 style.css 统一管理。
**F15. PDF 查看器快速翻页无渲染取消**：pdf-viewer.html 的 renderPage 未持有/取消上一次 render task，快速连续翻页时旧任务仍在后台向已脱离 DOM 的 canvas 绘制，浪费算力（无功能性错误）。
**F16. 缺少跳转正文的 skip-link**：键盘用户每次都要 Tab 穿过整个导航才能到正文，加一个视觉隐藏的"跳到主内容"链接是低成本的 a11y 改进。
**F17. 文件末尾杂项**：skills.yml 第 10、20 行有仅含空格的行；campus-qa-bot.md front matter 开头有两个多余空行。纯外观问题。

---

## 4. 各维度评分与亮点

| 维度 | 评分 | 说明 |
|------|------|------|
| S1 内容正确性与双语一致性 | 8.5/10 | 中英文结构严格对应；扣分项：F2 错误仓库链接、F3 详情页标题、F8 疑似笔误 |
| S2 构建与部署可靠性 | 8.5/10 | exclude 列表完整且有惨痛教训后的制度化；扣分项：F1 无 lockfile、F6 无 concurrency |
| S3 前端工程质量 | 9/10 | JS 全面 IIFE + strict mode + try/catch 兜底 + rAF 节流 + 文档高度缓存；scroll spy 的边界处理（页面到底强制激活末节）细致 |
| S4 性能 | 9/10 | KaTeX/hljs 按内容条件加载是亮点；头像已压缩（17 KB）；PDF 查看器开启流式按需加载；扣分项：F15 |
| S5 SEO | 8/10 | canonical/sitemap/robots/JSON-LD/OG 齐备；扣分项：F4 hreflang、F10 og:image |
| S6 安全与隐私 | 9/10 | 所有 CDN 资源带 SRI + crossorigin；外链统一 noopener noreferrer；PDF 查看器动态文案用 createTextNode 而非 innerHTML 拼接，有 XSS 意识 |
| S7 可访问性 | 8.5/10 | aria-label、aria-hidden、prefers-reduced-motion、详情页尽早修正 html lang 供屏幕阅读器使用；扣分项：F16、F7 |
| S8 可维护性 | 9.5/10 | 内容全部 YAML 化、注释密度恰当且解释"为什么"、README 含修改流程、.editorconfig、MIT + 内容保留权利的双轨许可、Git 提交信息规范 |

**特别值得肯定的设计决策**：
- 详情页双语用单文件 + 注释分隔符方案，配合 URL 参数过滤显示——避免了文件翻倍，代价（二次 markdownify 的脆弱性）在个人站规模下完全可接受；
- index.html/en.html 顶部的"这是 Jekyll 模板不要双击打开"注释，精准预防了静态站新手最常见的困惑；
- update-date.py 基于脚本自身路径定位数据文件，任意目录可运行；
- index_empty.html"主动关闭"预案页，考虑到了链接已分享后想临时下线的真实场景。

---

## 5. 对 INDEPENDENT-AUDIT.md 的评价与融合

*（本部分在第 1—4 部分完稿之后阅读 INDEPENDENT-AUDIT.md 补充。）*

### 5.1 总体评价：一份质量很高、但"时态混乱"的审计文档

**评价：8.5/10。** INDEPENDENT-AUDIT.md 的方法论明显优于一般个人项目审计：12 维度标准、四档严重度、与更早的 AUDIT-REPORT 双向互评（9.2 节诚实列出自己漏掉的 9 项、9.3 节列出对方漏掉的 20 项）、37 项问题带 P0—P3 分级与逐项处置状态、还有"局限性"自我声明章节。它当时发现的问题（Gemfile.lock、update-date.py 硬编码路径、DEPLOY.md 引用不存在的文件、SRI 缺失、detail.html lang 硬编码等）经我逐一核对，**判断基本全部准确**，且绝大多数已按其第十一节的状态记录真实修复——我在当前代码中逐项验证过：SRI 已加、头像已压缩到 17 KB、.ruby-version/LICENSE/.editorconfig 已存在、KaTeX/hljs 已条件加载、pdf-viewer 已国际化、update-date.py 已改为相对路径定位。**状态标记与代码实况一致，无虚报。**

**主要缺陷是"时态混乱"**：该文档第一~十节仍以现在时描述修复前的旧状态（如"avatar.jpg 636KB""缺少 SRI""缺少 .ruby-version/LICENSE""detail.html 无条件加载 KaTeX"等），只有第十一节的状态列标注了已修复。不看到最后的读者会误以为这些问题仍然存在。此外还有几处内部瑕疵：

1. **数字自相矛盾**：头像体积在 3.5 节写 636KB，在 9.3 节和 F-P1-1 写 649KB；
2. **建议自相矛盾**：第六节建议 #11"CDN 统一为 bootcdn"，而 F-P2-1 的实际处置是统一到 cdnjs（理由正当：bootcdn 有供应链事件前科）——正文建议未回改，留下了与结论相反的过时建议；
3. **把有缺陷的机制当亮点**：第七节亮点 4 和 3.11 节称赞 sessionStorage 滚动位置保持"细节到位"，但未发现该机制存在跨页面串扰缺陷（见我的 F5）；
4. **修复引入新问题而未复核**：F-P0-7 记录"github 填入真实仓库地址"，但实际填入的是**个人主页自身的仓库**而非该项目的仓库（见我的 F2）——修复动作形式上完成了，实质上把"占位链接"变成了"误导链接"，且未做修复后验证。

### 5.2 交叉核对：它发现而我遗漏的

诚实记录，以下问题是 INDEPENDENT-AUDIT（含其融合的 AUDIT-REPORT 视角）覆盖而我第 3 部分未提出的：

| # | 问题 | 当前状态 | 说明 |
|---|------|---------|------|
| 1 | 内容时间线矛盾：2020 届毕业 → 5 年空档 → 2025 实习 →"毕业设计"用词不成立 | ⏸️ 所有者决定暂缓 | 我核对了 _data 与 _projects，该矛盾**至今仍在**。我未提出是因为记忆中知道内容为待替换性质，但作为独立审查应当照实记录——这是我的遗漏 |
| 2 | 技能表中 Openclaw/Hermes/Trae 等小众工具名无上下文 | 仍存在 | 招聘者视角的合理提醒，我未覆盖 |
| 3 | 缺"关于我"段落、tagline 支撑不足 | ⏸️ 暂缓 | 内容运营视角，我的标准 S1 偏事实正确性，未覆盖信息架构 |
| 4 | 文档与代码一致性专项比对（DEPLOY.md 等 6 份文档逐一对照实际目录） | 已修复 | 我本轮未逐行核对 18KB 的 DEPLOY.md 与实际结构，它当年的比对深度值得肯定 |
| 5 | portfolio-single-file.html 与主版本内容脱钩的同步责任问题 | 已以"历史快照"注释方式处置 | 我仅把它当作已排除的遗留文件带过 |

### 5.3 交叉核对：我发现而它遗漏的

以下是我的第 3 部分中 INDEPENDENT-AUDIT 完全未覆盖的**当前仍然存在**的问题：

| 我的编号 | 问题 | 级别 |
|---------|------|:--:|
| F2 | campus-qa-bot 的 github 链接指向主页仓库而非项目仓库（其 F-P0-7 修复引入） | P1 |
| F3 | 详情页 title/og:title 恒为中文 | P2 |
| F4 | 双语页面缺 hreflang 互指 | P2 |
| F5 | 滚动位置恢复机制跨页面串扰（它反而列为亮点） | P2 |
| F6 | deploy.yml 缺 concurrency 防部署竞态 | P2 |
| F7 | 首访不跟随系统深色偏好，与 theme-color meta 行为矛盾 | P2 |
| F8 | "外部程序设计"疑似课程名笔误 | P3 |
| F9 | 缺自定义 404 页面 | P3 |
| F10 | og:image 用竖版证件照，分享卡片效果差 | P3 |
| F15 | PDF 查看器快速翻页无渲染取消 | P3 |

另外两项与它重叠但角度更新：F1（Gemfile.lock 至今仍未提交，其 F-P0-5 状态"⏳ 待本地执行"**已挂起近一个月**，是全部 37 项中唯一未闭环的 P0）；F11（CI 校验，它建议校验"文档引用的文件存在"，我建议校验构建产物死链，可合并为一步）。

### 5.4 融合后的当前待办清单（两份报告合并去重，仅列尚未解决项）

INDEPENDENT-AUDIT 的 37 项中已闭环 34 项，未闭环 3 项；合并我的新发现后，**当前实际待办共 15 项**（原 16 项，其中"本文件加入 exclude"已在 2026-07-28 融合提交中完成）：

| 优先级 | 事项 | 来源 |
|:--:|------|------|
| ✅ P1 | 生成并提交 Gemfile.lock（含 `bundle lock --add-platform x86_64-linux`） ✅ 已修复（2026-07-28，commit b0073ed） | 双方一致（其 F-P0-5 唯一未闭环 P0） |
| ✅ P1 | 修正或删除 campus-qa-bot 的 github 字段（当前指向主页仓库） ✅ 已修复（2026-07-28，commit edc8685） | 本报告 F2 |
| ~~P1~~ | ~~将本文件 COMPREHENSIVE-REVIEW.md 加入 _config.yml exclude~~ ✅ 已完成（2026-07-28 融合提交） | 本报告新增 |
| ✅ P2 | 详情页 title 随 ?lang= 切换（F3） ✅ 已修复（2026-07-28，commit b3729a8） | 本报告 |
| ✅ P2 | 补 hreflang 互指（F4） ✅ 已修复（2026-07-28，commit b3729a8） | 本报告 |
| ✅ P2 | 滚动比例仅在语言切换时保存（F5） ✅ 已修复（2026-07-28，commit b3729a8） | 本报告 |
| ✅ P2 | deploy.yml 加 concurrency（F6） ✅ 已修复（2026-07-28，commit b3729a8） | 本报告 |
| ✅ P2 | 首访默认主题跟随系统偏好（F7） ✅ 已修复（2026-07-28，commit b3729a8） | 本报告 |
| P2 | 决策时间线/"毕业设计"用词/公司名（内容项，所有者已知悉暂缓） | INDEPENDENT-AUDIT F-P1-8/9、F-P0-6 |
| P3 | 核对"外部程序设计"课程名（F8） | 本报告 |
| P3 | 自定义 404 页面（F9） | 本报告 |
| P3 | 横版 og:image（F10） | 本报告 |
| P3 | CI 加 htmlproofer/文档引用校验（F11 + 其 12.2-3 合并） | 双方 |
| P3 | PDF 查看器渲染任务取消（F15） | 本报告 |
| P3 | skip-link（F16 = 其 F-P3-6，未处置） | 双方 |
| P3 | 内联样式归并 / ES6 现代化 / 空监听器清理（其 F-P3-3/4/5，未处置） | INDEPENDENT-AUDIT |

对 INDEPENDENT-AUDIT.md 本身的维护建议：~~在文档开头加一段"状态说明"，注明第一~十节为 2026-07-28 修复前的快照描述，并修正两处内部矛盾~~ → 实际处置：所有者决定将该文件融合进本报告后删除（历史精华存档见第 6 部分，原文可从 Git 历史找回），时态混乱与内部矛盾问题随之消除。

### 5.5 结论

两份报告的关系：INDEPENDENT-AUDIT.md 是一次**大规模的存量问题清剿**（37 项，修复率 34/37），它完成后项目质量发生了跃迁——这正是我第 2 部分给出 A− 而它当年只给 3.4/5.0 的原因：**我们审的实际上是同一个项目的两个时代**。我的报告价值在于：① 验证了它的修复真实落地、状态无虚报；② 找出了它的 3 处内部矛盾和 1 处修复引入的新问题（F2）；③ 在它清剿后的"干净地面"上又找出 10 项它未覆盖的新问题。二者融合后的有效待办即 5.4 节清单，P1 两项（Gemfile.lock、github 链接）与 P2 五项（F3—F7）均已修复并经 CI 验证通过（2026-07-28，三次 Actions 运行均 success），剩余待办为 P3 级技术项与所有者暂缓的内容项。

---

## 6. 历史审计存档（原 INDEPENDENT-AUDIT.md 融合摘要）

> 原文件约 45KB，已于 2026-07-28 删除，完整内容可用 `git log --all -- INDEPENDENT-AUDIT.md` 找回。本节保留其不可从当前代码反推的历史事实与经验结论。

### 6.1 审计谱系

本项目共经历三代审计文档，呈逐代融合关系：

1. **AUDIT-REPORT.md**（Hermes Agent，五轮审核：十维度初评→多用户视角→整体综合→内容一致性→逐文件审计，综合评分 4.0/5.0）—— 已于 2026-07-28 删除，发现全部融入 INDEPENDENT-AUDIT.md；
2. **INDEPENDENT-AUDIT.md**（12 维度独立审查 + 与 AUDIT-REPORT 双向互评融合，融合评分 3.4/5.0）—— 已于 2026-07-28 删除，精华融入本报告；
3. **COMPREHENSIVE-REVIEW.md**（本文件）—— 当前唯一有效审计文档。

### 6.2 修复前的项目状态快照（2026-07-28 清剿前）

以下问题当时存在、现已全部修复，记录在此供理解项目演进历程：

- 头像 avatar.jpg 原为 636KB / 2149×2528（显示尺寸仅 112×144，约 340 倍冗余），已压缩为 400×471 / 17KB；
- update-date.py 原硬编码 Windows 绝对路径，已改为基于脚本自身位置定位；
- DEPLOY.md 曾引用 5 个不存在的文件 + 已重命名的 index-en.html，已同步；DEPLOY-OPTIONS.md 曾错误声称 Gemfile.lock 已存在，已更正；
- 所有 CDN 资源原无 SRI、源不统一（bootcdn + cdnjs），已统一到 cdnjs 并全部加 integrity + crossorigin（选 cdnjs 而非 bootcdn 的理由：bootcdn 2024 年有供应链事件前科）；
- detail.html 原硬编码 lang="zh-CN" 且无条件加载 KaTeX/hljs，已改为 head 最早处 JS 修正 lang + 按内容条件加载；
- pdf-viewer.html 工具栏原仅中文，已加 zh/en 双语 I18N；
- 原缺失：sitemap/robots/canonical/JSON-LD/theme-color/.ruby-version/LICENSE/.editorconfig，均已补齐；_config.yml 的 url 字段原为空，已填入；
- 邮箱原明文嵌入 HTML 与 JSON-LD，已改为 data 属性 + JS 拼接；
- backups/ 原被 Git 跟踪，已移出并加入 .gitignore；遗留文件"放头像说明.txt"已删除；TODO 占位注释已清理。

### 6.3 有意识的"保留现状"决策（非遗漏，勿重复提问）

| 决策 | 理由 |
|------|------|
| portfolio-single-file.html 保留为应急离线单文件版 | 顶部已注"历史快照，内容可能滞后"，且已 exclude 不影响构建 |
| 不使用 favicon | 所有者明确不希望浏览器标签显示头像，图标文件已彻底删除 |
| "某科技公司"、时间线、"毕业设计"用词等内容项 | 所有者确认为可随时修改的占位性质，不纠结真实性 |
| 详情页单文件双语 + 注释分隔符机制保留 | 评估后认为拆为两套 collection 会增加重复和漏改风险 |
| 不引入本地 lint 工具链 | 静态小站收益低，CI 构建失败即是把关 |

### 6.4 沉淀的工程经验（来自历次审计的教训）

1. **新增任何根目录 Markdown/脚本前先问：它该不该发布到网站？** 不该就立即加 exclude——本项目因此两度构建失败（DEPLOY.md、AUDIT-REPORT.md 含 Liquid 语法示例被误解析）；
2. **修复一类问题时要泛化**，不要只修当前报错的那一个文件；
3. **文档与代码脱钩是系统性风险**：多份文档自称的状态与仓库实况不符曾是本项目最大隐患，建议在 CI 中加"文档引用的文件必须存在"校验；
4. **修复后必须复核**：历史上曾出现"修复动作完成但引入新问题"（占位链接被填成错误仓库）与"删除不彻底"（favicon 文件残留）两类回归。

