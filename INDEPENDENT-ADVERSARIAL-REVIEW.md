# 独立对抗式审查报告

> **审查日期**：2026-07-31
> **审查依据**：`项目审查提示词-Jekyll双语个人主页版.md`（19 章审查清单）
> **审查方法**：在未阅读 `COMPREHENSIVE-REVIEW.md` 的情况下，独立通读全部源码后完成本报告
> **审查范围**：全项目所有文件（配置 / 数据 / 模板 / 页面 / 脚本 / 样式 / CI / 文档 / 应急文件）

---

## 总体结论

**评分：B+**

项目整体工程质量较高：Jekyll 数据驱动架构清晰、双语方案基本可用、CI/CD 流程完善、文档详尽。但仍存在 **1 个阻断级构建风险**（审查提示词文件本身未排除会导致 Jekyll 构建失败）、**1 个内容层面的时间线矛盾**（2020 年毕业生做 2025 年毕业设计）、以及若干双语一致性、文档代码脱钩、SEO 缺失问题。

---

## 已通过的检查项

- ✅ 双语主页 `index.html` / `en.html` 通过 `default.html` 布局渲染，所有栏目（关于 / 教育 / 经历 / 技能 / 项目 / 论文 / 联系）正常
- ✅ 项目 / 论文详情页可通过主页点击进入，`detail.html` 布局按 `<!-- English -->` 分隔符切分中英文
- ✅ 深浅色主题切换工作正常，`localStorage` 持久化 + `try/catch` 兜底 + `prefers-color-scheme` 跟随
- ✅ 返回顶部按钮：SVG 圆环进度计算正确（`CIRCUMFERENCE = 2π × 22 ≈ 138.23`），`maxScroll <= 0` 除零兜底
- ✅ 滚动高亮导航：rAF 节流 + 底部强制激活最后 section + 导航点击后短暂抑制 spy
- ✅ PDF 查看器：pdf.js 3.11.174 + SRI + `disableAutoFetch: true` + `disableStream: false` 流式加载 + 翻页取消旧渲染任务
- ✅ 邮箱混淆：`data-u` / `data-d` 拆分 + JS 拼接 `mailto:`
- ✅ 404 页面：`noindex` + 双语 + 主题初始化
- ✅ `robots.txt` 指向 `sitemap.xml`，`jekyll-sitemap` 插件启用
- ✅ CDN 资源全部带 `integrity` + `crossorigin="anonymous"`（cdnjs 源，pdf.worker.min.js 无 SRI 已注释说明）
- ✅ 外链 `target="_blank"` 均带 `rel="noopener noreferrer"`
- ✅ `Gemfile.lock` 存在且含 `x86_64-linux-gnu` / `x86_64-linux-musl` 平台
- ✅ `.ruby-version` = 3.3，与 CI `ruby-version: '3.3'` 一致
- ✅ CI 使用 `actions/deploy-pages@v4` + `concurrency` 防竞态
- ✅ `htmlproofer` 死链校验（非阻断）
- ✅ KaTeX / highlight.js 按需条件加载（`has_math` / `has_code` 检测）
- ✅ `passive: true` 滚动监听
- ✅ `prefers-reduced-motion` 尊重（CSS 动画降级 + 返回顶部平滑滚动降级）
- ✅ skip-link 键盘可达性
- ✅ `.editorconfig` 规范（LF / UTF-8 / 2 空格）
- ✅ 联系方式 Grid 响应式（桌面 3 列 / 平板 2 列 / 手机 1 列）
- ✅ iPhone Safe Area 适配（`env(safe-area-inset-bottom)`）

---

## 发现的所有问题

### 🔴 Critical（阻断级，必须立即修复）

#### C1. 审查提示词文件未加入 `_config.yml` exclude，将导致 Jekyll 构建失败

**文件**：`_config.yml` 第 42-55 行（exclude 列表）、`项目审查提示词-Jekyll双语个人主页版.md`

**问题**：`项目审查提示词-Jekyll双语个人主页版.md` 是根目录下的 `.md` 文件，未被 `_config.yml` 的 `exclude` 列表排除。该文件包含大量 Liquid 模板语法示例（如第 70 行 `{% if l == 'zh' %}...{% else %}...{% endif %}`、第 246 行 `{% %}` / `{{ }}`），Jekyll 会将其当作真正的 Liquid 模板解析，导致构建失败。

这正是 `TROUBLESHOOTING.md` 第三章（DEPLOY.md 被误解析）和第十八章（AUDIT-REPORT.md 导致构建失败）的同类问题**第三次复发**。

**修复建议**：在 `_config.yml` 的 `exclude` 列表中添加 `项目审查提示词-Jekyll双语个人主页版.md`。同时建议将 `INDEPENDENT-ADVERSARIAL-REVIEW.md`（本文件）也加入 exclude。

#### C2. "毕业设计"项目时间线与毕业年份矛盾

**文件**：`_projects/campus-qa-bot.md` 第 4 行、`_data/education.yml` 第 4 行

**问题**：教育背景显示 2016.09 — 2020.06 毕业，但项目 `campus-qa-bot.md` 标注为"毕业设计（Capstone Project）"，时间却是 2025.09 — 2026.03。一个 2020 年毕业的学生不可能在 2025-2026 年做"毕业设计"。这是一个事实层面的时间线矛盾，会被招聘方/读者质疑简历真实性。

**修复建议**：将"毕业设计"改为"个人项目"或其他准确描述（如"AI 应用开发项目"），或将项目时间调整为在校期间。英文版 "Capstone Project" 同步修改。

---

### 🟠 High（严重影响用户体验或可维护性）

#### H1. 详情页无 `?lang=` 参数时同时显示中英文

**文件**：`_layouts/detail.html` 第 14-22 行、第 54-57 行

**问题**：CSS 隐藏规则为 `.lang-zh .detail-en { display: none; }` 和 `.lang-en .detail-zh { display: none; }`。`lang-zh` / `lang-en` class 仅在 URL 含 `?lang=zh` / `?lang=en` 时由 JS 添加（第 15-21 行）。若直接访问详情页 URL 不带 `?lang=` 参数（如从 sitemap、搜索引擎、直接分享链接进入），则两个 class 都不存在，中英文内容**同时显示**。

主页链接到详情页时带了 `?lang={{ l }}`（`default.html` 第 206、234 行），所以从主页点击进入是正常的。但搜索引擎索引的 URL 可能不含参数。

**修复建议**：在 JS 中增加默认语言逻辑——当无 `?lang=` 参数时，默认添加 `lang-zh` class（或重定向到 `?lang=zh`）。

#### H2. 详情页 `<html lang>` 硬编码为 `zh-CN`，搜索引擎看到错误语言

**文件**：`_layouts/detail.html` 第 8 行

**问题**：`<html lang="zh-CN">` 硬编码，虽然 JS 在第 14-22 行根据 `?lang=en` 动态修正为 `en`，但搜索引擎爬虫不执行 JS，会认为所有详情页都是中文。影响英文页面的 SEO 和屏幕阅读器正确朗读。

**修复建议**：考虑在 Jekyll 构建时无法确定语言（单文件双内容）的限制下，至少在 `<head>` 最早处的 JS 中做修正（已实现），但应在注释中标注此限制。或者考虑为英文版生成独立 URL（如 `/en/projects/...`）。

#### H3. 详情页缺少 hreflang 互指

**文件**：`_layouts/detail.html` 第 36 行

**问题**：`detail.html` 仅有 `<link rel="canonical">`，无 `hreflang` 互指标签。主页 `default.html` 有完整的 `zh-CN` / `en` / `x-default` 三条 alternate（第 23-25 行），但详情页缺失。搜索引擎无法识别详情页的中英文对应关系。

**修复建议**：由于详情页中英文共用同一 URL（靠 `?lang=` 参数区分），hreflang 互指在技术上受限。可考虑添加 `<link rel="alternate" hreflang="zh-CN" href="{{ page.url | absolute_url }}?lang=zh">` 和 `hreflang="en"` 版本。

#### H4. 详情页缺少 meta description 和 og:description

**文件**：`_layouts/detail.html` 第 24-35 行

**问题**：`detail.html` 有 `og:title` 和 `og:type`，但缺少 `meta name="description"`、`og:description`、`og:image`。影响搜索引擎摘要和社交分享卡片。

**修复建议**：从 front matter 的 `desc` 字段生成 meta description，从 `pdf` 或默认头像生成 og:image。

#### H5. DEPLOY.md 描述的部署方式与实际 CI 严重不符

**文件**：`DEPLOY.md` 第 343-359 行（第 4.6 节）

**问题**：DEPLOY.md 第 4.6 节"两个分支是怎么来的"描述：
- `gh-pages` 分支由 `peaceiris/actions-gh-pages` 创建
- `peaceiris/actions-gh-pages@v4` 把 `_site/` 推到 `gh-pages` 分支

但实际 `.github/workflows/deploy.yml` 使用的是 `actions/upload-pages-artifact@v3` + `actions/deploy-pages@v4`（Actions 直接部署，无 `gh-pages` 分支）。`TROUBLESHOOTING.md` 第九章记录了从 legacy 到 workflow 的迁移，但 `DEPLOY.md` 第 4.6 节**从未同步更新**。

**修复建议**：重写 DEPLOY.md 第 4.6 节，描述当前的 `actions/deploy-pages` 部署方式，删除对 `gh-pages` 分支和 `peaceiris/actions-gh-pages` 的描述。

#### H6. DEPLOY-OPTIONS.md 称 Gemfile.lock 不存在，但实际已存在

**文件**：`DEPLOY-OPTIONS.md` 第 14 行、第 18-23 行

**问题**：DEPLOY-OPTIONS.md 前置条件表格标注 `Gemfile.lock` 状态为"❌ 需生成"，并有一大段"本仓库尚未提交 Gemfile.lock"的警告。但实际 `Gemfile.lock` 已存在且包含完整依赖锁定和多平台支持。文档与代码严重脱钩。

**修复建议**：更新表格状态为"✅ 已有"，删除生成 Gemfile.lock 的警告段落，更新"最后更新"日期。

#### H7. DEPLOY-OPTIONS.md 推荐 bootcdn，存在供应链安全风险

**文件**：`DEPLOY-OPTIONS.md` 第 421-429 行（第 5.2 节）

**问题**：文档推荐将 cdnjs 替换为 `cdn.bootcdn.net` 以加速国内访问。bootcdn 在 2024 年发生过供应链安全事件（恶意代码注入），使用存在风险。

**修复建议**：删除 bootcdn 推荐，改为推荐其他安全的国内 CDN（如 `unpkg.com` 配合国内镜像）或使用自托管。至少添加安全风险警告。

#### H8. 技能数据中英文不一致："React" vs "React Basics"

**文件**：`_data/skills.yml` 第 7 行 vs 第 17 行

**问题**：中文版技能列表中 Web 开发基础含 `React`，英文版对应为 `React Basics`。同一技能在中英文中名称不一致，可能给读者造成误解。

**修复建议**：统一为相同表述（建议都用 `React` 或都用 `React Basics`）。

#### H9. 课程名"外部程序设计"疑为笔误

**文件**：`_data/education.yml` 第 20 行、第 42 行

**问题**：中文课程名"外部程序设计"在常见高校课程体系中不存在，疑为"Web 程序设计"或"面向对象程序设计"的笔误。英文翻译 "External Programming" 是直译，进一步印证这可能不是一个真实的课程名。

**修复建议**：核实真实课程名并更正。

#### H10. 应急文件 index_empty.html 仅有中文版

**文件**：`index_empty.html`

**问题**：`index_empty.html` 是"主页暂时关闭"提示页，仅有中文版本。若英文访客访问将看到纯中文，体验不佳。审查提示词第十六章明确要求应急页面提供双语版本。

**修复建议**：添加英文文案（与 404.html 类似的 `lang` 检测逻辑），或至少添加英文翻译提示。

#### H11. index_empty.html 邮箱明文暴露

**文件**：`index_empty.html` 第 79 行

**问题**：`<a href="mailto:wcn913@gmail.com">wcn913@gmail.com</a>` 邮箱完全明文。主站 `default.html` 已采用 `data-u` / `data-d` 拆分混淆方案，但应急文件未同步，会被爬虫抓取。

**修复建议**：使用与主站相同的邮箱混淆方案。

#### H12. 404 页面英文版"Back to Home"链接指向中文主页

**文件**：`404.html` 第 50 行

**问题**：`<a href="{{ '/index.html' | relative_url }}" class="nf-btn nf-en">Back to Home</a>` — 英文版返回按钮指向 `index.html`（中文主页），而非 `en.html`（英文主页）。

**修复建议**：将英文版按钮 href 改为 `{{ '/en.html' | relative_url }}`。

#### H13. og:image 使用竖版头像，社交分享卡片效果差

**文件**：`_layouts/default.html` 第 20 行

**问题**：`og:image` 指向 `/assets/avatar.jpg`，头像尺寸为 112×144（竖版）。社交平台（微信 / Twitter / LinkedIn）推荐 og:image 为 1200×630 横版图，竖版头像在分享卡片中会被裁剪或留白。

**修复建议**：制作一张 1200×630 的横版社交分享图（可包含姓名 + 头衔 + 简单设计），放入 `assets/` 并更新 og:image。

---

### 🟡 Medium（值得修复，但不阻断）

#### M1. `_config.yml` 的 `kramdown.math_engine: mathjax` 配置无效

**文件**：`_config.yml` 第 38-39 行

**问题**：配置了 `math_engine: mathjax`，但 `TROUBLESHOOTING.md` 第七章已记录此配置在 GFM 模式下不生效。项目实际使用 KaTeX（在 `detail.html` 中通过 CDN 加载）。此配置是误导性的死配置。

**修复建议**：删除 `math_engine: mathjax` 行，或注释说明实际使用 KaTeX。

#### M2. lock.yml 临时工作流未删除

**文件**：`.github/workflows/lock.yml`

**问题**：注释明确说"生成完成后本工作流即可删除"，但文件仍存在。虽然 `workflow_dispatch` 仅手动触发，不影响自动部署，但属于工程卫生问题。

**修复建议**：删除 `lock.yml`（Gemfile.lock 已生成）。

#### M3. KaTeX 渲染使用 innerHTML

**文件**：`_layouts/detail.html` 第 194 行

**问题**：`span.innerHTML = html`，其中 `html` 来自 `katex.renderToString()`。KaTeX 内部会转义输入，通常安全，但使用 `innerHTML` 是 XSS 的常见模式。审查提示词第十一章专门提到此项。

**修复建议**：KaTeX 官方文档示例即使用 innerHTML，且 `throwOnError: false` + 输入来自 Markdown 正文（非用户直接输入），风险较低。可在注释中说明安全性考量。保持现状但标注。

#### M4. `_spyResumeOnScroll` 监听器永不移除

**文件**：`script.js` 第 168-178 行

**问题**：每次导航点击都调用 `window.addEventListener("scroll", _spyResumeOnScroll, { passive: true, once: false })`。虽然浏览器会对相同函数引用 + 相同选项去重，但该监听器在首次添加后永不移除，即使不需要也会在每次 scroll 事件中被调用（执行 clearTimeout + setTimeout）。

**修复建议**：在 `_spyPaused` 恢复为 false 后用 `removeEventListener` 移除，或改用 `once: true` + 每次重新创建。影响较小，可暂缓。

#### M5. `.workbuddy/` 未加入 .gitignore

**文件**：`.gitignore`

**问题**：`.workbuddy/memory/` 包含 AI 工具的工作日志（含 commit hash、内部审查记录等），当前未被 git 跟踪（`git ls-files` 确认），但 `.gitignore` 未排除该目录。一次 `git add -A` 就会将其提交到公开仓库。

**修复建议**：在 `.gitignore` 中添加 `.workbuddy/`。同时建议排除 `.trae-cn/` 等 AI 工具目录。

#### M6. 详情页 footer 硬编码中文姓名

**文件**：`_layouts/detail.html` 第 151 行

**问题**：`<span>&copy; 2026 {{ p.name }}</span>`，其中 `p = site.data.personal.zh`（第 3 行），所以英文详情页 footer 显示的是中文名"王晨"而非"Chen Wang"。

**修复建议**：根据当前语言选择姓名，或使用 `p_en.name`。

#### M7. 多份文档"最后更新"日期过期

**文件**：`DEPLOY.md`（2026-07-04）、`DEPLOY-OPTIONS.md`（2026-07-04）、`RUBY-JEKYLL.md`（2026-07-04）

**问题**：这些文档的"最后更新"日期停留在 2026-07-04，但项目在 2026-07-28 仍有重要变更（如 TROUBLESHOOTING.md 第十八章）。文档日期未同步更新。

**修复建议**：更新日期或移除具体日期改用"以 Git 提交记录为准"。

#### M8. JSON-LD Person schema 不完整

**文件**：`_layouts/default.html` 第 30-39 行

**问题**：JSON-LD 仅包含 `name`、`url`、`image`、`sameAs`。可补充 `email`（注意混淆）、`jobTitle`、`alumniOf`、`knowsAbout` 等字段，提升结构化数据丰富度。

**修复建议**：按 schema.org/Person 规范补充字段。注意邮箱不要明文放入 JSON-LD。

#### M9. 头像 img 使用内联 onerror

**文件**：`_layouts/default.html` 第 131 行

**问题**：`onerror="this.style.display='none';"` 内联事件处理器。虽然 CSP 友好性不是此项目的重点，但内联事件处理器是不佳实践。

**修复建议**：在 `script.js` 中通过 `addEventListener('error', ...)` 绑定。影响较小，可暂缓。

#### M10. 重复的主题初始化脚本

**文件**：`_layouts/default.html` 第 42-52 行、`_layouts/detail.html` 第 41-51 行、`404.html` 第 14-26 行

**问题**：三处文件包含几乎相同的主题初始化 IIFE。若需修改逻辑（如新增主题选项），需同步改三处，容易遗漏。

**修复建议**：可抽取为 Jekyll include（如 `_includes/theme-init.html`），三处 `{% include %}` 引用。但鉴于主题初始化必须在 `<head>` 同步执行且依赖极少，当前方案的可靠性也是可接受的。标注为可选改进。

---

### 🟢 Low（可选改进）

#### L1. 魔法数字部分缺少注释来源

**文件**：`script.js`、`assets/pdf-viewer.html`

**问题**：`NAV_OFFSET = 80` 有注释（第 66 行），`CIRCUMFERENCE = 138.23` 有注释（第 264 行），但 `300`（返回顶部显示阈值，第 298 行）和 `612`（PDF 页面默认宽度，`pdf-viewer.html` 第 194 行）缺少来源说明。`612` = 8.5 英寸 × 72 dpi（US Letter 默认宽度）。

**修复建议**：添加注释说明来源。

#### L2. `_data/social.yml` 邮箱明文存储于源码仓库

**文件**：`_data/social.yml` 第 5 行

**问题**：`email: wcn913@gmail.com` 明文存储。虽然前端做了混淆，但源码仓库中邮箱完全可读。这是数据驱动架构的固有取舍。

**修复建议**：可接受的风险。若需更强保护，可将邮箱拆分为 `email_user` 和 `email_domain` 两个字段存储。

#### L3. `.gitignore` 未排除常见 Ruby/Git 临时文件

**文件**：`.gitignore`

**问题**：未排除 `.bundle/`、`*.gem`、`.ruby-gemset` 等 Ruby 项目常见临时文件。Jekyll 默认排除 `Gemfile` / `Gemfile.lock` 但 `.gitignore` 层面也应有兜底。

**修复建议**：补充 `.bundle/` 和 `*.gem`。

#### L4. detail.html 大量内联样式

**文件**：`_layouts/detail.html` 第 119、124、125、126、132、136、137、138、139、150 行

**问题**：多处使用 `style="..."` 内联样式，如 `style="border-top:none; padding-top:40px;"`、`style="font-size:1.4rem; margin-bottom:0.3em;"` 等。

**修复建议**：可归入 `style.css`。但考虑到这些样式仅用于详情页，内联也有"就近维护"的优势。可选改进。

#### L5. CI htmlproofer 参数 `--no-enforce-https` 需验证

**文件**：`.github/workflows/deploy.yml` 第 42 行

**问题**：`--no-enforce-https` 需确认在 html-proofer 5.x 中是否仍有效。html-proofer 5.x 移除了部分旧参数（如 `--assume-extension`）。

**修复建议**：查阅 html-proofer 5.x 文档确认。若已弃用则移除。由于 `continue-on-error: true`，即使参数无效也不会阻断部署。

#### L6. `portfolio-single-file.html` 为历史快照，可能内容滞后

**文件**：`portfolio-single-file.html`

**问题**：离线单文件快照，`index.html` / `en.html` 注释中已说明"内容可能滞后"。作为应急预览工具有价值，但存在误导风险。

**修复建议**：在文件顶部添加更醒目的"历史快照"警告水印。或定期同步更新。

#### L7. `default.html` 项目/论文链接使用内联样式

**文件**：`_layouts/default.html` 第 206、234 行

**问题**：`style="color:inherit;text-decoration:none;"` 内联样式重复出现。

**修复建议**：在 CSS 中定义 `.project-title a, .pub-title a { color: inherit; text-decoration: none; }`。

---

## 按审查章节的问题索引

| 审查章节 | 发现的问题编号 |
|---|---|
| 一、功能完整性 | H1（详情页无参数显示双语）|
| 二、双语一致性 | H8（React vs React Basics）、H9（外部程序设计）、M6（footer 中文名）|
| 三、导航与滚动 | M4（spy 监听器不移除）|
| 四、返回顶部 | ✅ 无问题 |
| 五、响应式 | ✅ 无重大问题 |
| 六、浏览器兼容性 | ✅ 已做 try/catch 兜底 |
| 七、性能 | ✅ 按需加载 + 缓存高度 |
| 八、代码质量 | M9（内联 onerror）、M10（重复脚本）、L1（魔法数字）、L4/L7（内联样式）|
| 九、可维护性 | M1（死配置）、M2（临时工作流未删）|
| 十、Bug 猎杀 | H1（无参数双语同显）、C2（时间线矛盾）|
| 十一、安全 | H11（邮箱明文）、M3（innerHTML）、M5（.workbuddy 未忽略）、L2（邮箱源码明文）|
| 十二、SEO | H2（lang 硬编码）、H3（缺 hreflang）、H4（缺 description）、H13（og:image 竖版）、M8（JSON-LD 不完整）|
| 十三、构建与部署 | C1（审查文件未 exclude）、M2（lock.yml 未删）、L5（htmlproofer 参数）|
| 十四、文档一致性 | H5（DEPLOY.md 部署方式过时）、H6（Gemfile.lock 状态过时）、H7（bootcdn 风险）、M7（日期过期）|
| 十五、内容正确性 | C2（毕业设计时间线）、H8（技能不一致）、H9（课程名笔误）|
| 十六、可访问性 | H10（应急文件无双语）|
| 十七、最终输出 | 见上方分级列表 |

---

## 修复优先级建议

| 优先级 | 问题 | 修复难度 |
|---|---|---|
| 🔴 立即 | C1：exclude 审查文件 | 极低（加一行） |
| 🔴 立即 | C2：毕业设计时间线 | 低（改文案） |
| 🟠 尽快 | H1：详情页默认语言 | 低（加 JS 默认逻辑） |
| 🟠 尽快 | H5-H7：文档一致性 | 中（需逐份更新） |
| 🟠 尽快 | H12：404 英文链接 | 极低（改 href） |
| 🟠 尽快 | H10-H11：应急文件 | 中（加双语 + 混淆） |
| 🟡 计划 | M1-M10：中等问题 | 低-中 |
| 🟢 可选 | L1-L7：低优先级 | 低 |

---

> **审查声明**：本报告第 1-7 节完全基于独立阅读源码完成，未参考 `COMPREHENSIVE-REVIEW.md`。以下第 8 节为对照核验与融合。

---

## 8. 与 COMPREHENSIVE-REVIEW.md 的对照核验与融合

### 8.1 对 COMPREHENSIVE-REVIEW.md 的总体评价

**评价：9/10，一份高质量的成熟审计文档。**

该报告经历了三代审计融合（AUDIT-REPORT → INDEPENDENT-AUDIT → COMPREHENSIVE-REVIEW），具备以下优点：

- **8 维度审查标准**清晰且针对个人主页项目定制，比我使用的 19 章清单更聚焦；
- **修复状态标记准确**：我逐项核验了报告中标注 ✅ 的 15 项修复，全部与代码实况一致，无虚报；
- **自我诚实**：第 5.2 节主动列出了自己遗漏的 5 项问题（包括时间线矛盾），第 6.3 节标注了"有意识的保留现状决策"以避免重复审计；
- **工程经验沉淀**：第 6.4 节的 4 条教训（特别是"新增根目录 Markdown 必须排除"）有价值。

**主要不足**：

1. **文档一致性审查不彻底**：报告声称 DEPLOY-OPTIONS.md "已更正"，但当前该文档仍标注 Gemfile.lock 为"❌ 需生成"（实际已存在）；DEPLOY.md 第 4.6 节仍描述旧的 `peaceiris/actions-gh-pages` 部署方式（实际已迁移到 `actions/deploy-pages`）；DEPLOY-OPTIONS.md 仍推荐有供应链风险的 bootcdn。这三处文档代码脱钩均未被发现。
2. **未覆盖新增文件**：`项目审查提示词-Jekyll双语个人主页版.md` 是该报告完成后新增的文件，未被 exclude——这正是报告第 6.4 节教训 1 的"第四次复发"，说明教训停留在文档层面，未落地为自动化机制（如 pre-commit hook）。
3. **评分略高**：A−（约 90 分）的评分基于"大量 P2 已修复后的干净状态"。若计入文档脱钩和新增文件的构建风险，实际应在 85 分左右（B+）。

### 8.2 修复状态核验结果

逐项核验 COMPREHENSIVE-REVIEW.md 第 5.4 节的待办清单：

| 报告编号 | 问题 | 报告标注 | 我的核验 | 结论 |
|---|---|---|---|---|
| F1 | Gemfile.lock 缺失 | ✅ 已修复 | Gemfile.lock 存在，含 x86_64-linux-gnu/musl | ✅ 属实 |
| F2 | github 链接指向主页仓库 | ✅ 已修复 | campus-qa-bot.md 的 github 字段已删除 | ✅ 属实 |
| F3 | 详情页 title 恒中文 | ✅ 已修复 | detail.html 第 27-34 行 JS 替换 title | ✅ 属实 |
| F4 | 缺 hreflang | ✅ 已修复 | default.html 第 23-25 行有 hreflang | ✅ 属实 |
| F5 | 滚动位置串扰 | ✅ 已修复 | script.js 仅 lang-btn 点击时保存 | ✅ 属实 |
| F6 | 缺 concurrency | ✅ 已修复 | deploy.yml 第 10-12 行有 concurrency | ✅ 属实 |
| F7 | 首访不跟随系统主题 | ✅ 已修复 | 三处主题初始化均用 `saved \|\| matchMedia` | ✅ 属实 |
| F8 | 课程名"外部程序设计" | ⏸️ 待核实 | 仍存在于 education.yml | ⏸️ 属实 |
| F9 | 缺 404 页面 | ✅ 已修复 | 404.html 存在且双语 | ✅ 属实 |
| F10 | og:image 竖版 | ⏸️ 待素材 | 仍指向 avatar.jpg | ⏸️ 属实 |
| F11 | CI 无校验 | ✅ 已修复 | deploy.yml 有 htmlproofer 步骤 | ✅ 属实 |
| F13 | 路径写法不一致 | ✅ 已修复 | default.html 使用 relative_url | ✅ 属实 |
| F15 | PDF 翻页无取消 | ✅ 已修复 | pdf-viewer.html 第 199-200 行取消旧任务 | ✅ 属实 |
| F16 | 缺 skip-link | ✅ 已修复 | default.html 第 83 行、detail.html 第 102-103 行 | ✅ 属实 |
| F17 | 文件末尾杂项 | ✅ 已修复 | skills.yml 无多余空格行 | ✅ 属实 |

**核验结论**：15 项标注 ✅ 的修复全部属实，状态标记无虚报。2 项 ⏸️ 待处理项确认仍存在。报告的诚信度很高。

### 8.3 交叉比对：双方都发现的问题

| 问题 | 我的编号 | 报告编号 | 当前状态 | 说明 |
|---|---|---|---|---|
| 课程名"外部程序设计"笔误 | H9 | F8 | ⏸️ 待核实 | 双方一致，需成绩单确认 |
| og:image 竖版头像 | H13 | F10 | ⏸️ 待素材 | 双方一致，需 1200×630 横版图 |
| 时间线/"毕业设计"矛盾 | C2 | 5.2 节 #1 | ⏸️ 暂缓 | 双方均发现，报告标注"所有者暂缓"；我评级为 Critical，报告视为内容项 |
| 内联样式 | L4/L7 | F14 | ⏸️ 暂缓 | 双方一致，改动量大另择时机 |
| 邮箱混淆强度有限 | L2 | F12 | 可接受 | 双方一致，静态站的合理折中 |

### 8.4 报告发现而我遗漏的

| 问题 | 报告来源 | 说明 |
|---|---|---|
| Openclaw/Hermes/Trae 等小众工具名无上下文 | 5.2 节 #2 | 招聘者视角的合理提醒，我未覆盖 |
| 缺"关于我"段落，tagline 支撑不足 | 5.2 节 #3 | 内容架构视角，我的审查侧重代码层面 |

### 8.5 我发现而报告未覆盖的（当前仍存在的问题）

以下是我的新发现，COMPREHENSIVE-REVIEW.md 完全未提及且**当前仍然存在**：

| 我的编号 | 问题 | 级别 | 说明 |
|---|---|---|---|
| **C1** | `项目审查提示词-Jekyll双语个人主页版.md` 未 exclude，将导致构建失败 | 🔴 Critical | 报告完成后新增的文件，含 Liquid 语法。报告第 6.4 节教训 1 的"第四次复发" |
| **H1** | 详情页无 `?lang=` 参数时中英文同时显示 | 🟠 High | 搜索引擎索引的 URL 可能不含参数 |
| **H5** | DEPLOY.md 第 4.6 节仍描述旧的 `peaceiris/actions-gh-pages` 部署 | 🟠 High | 文档与实际 CI 严重不符 |
| **H6** | DEPLOY-OPTIONS.md 称 Gemfile.lock "❌ 需生成"，实际已存在 | 🟠 High | 报告声称"已更正"但实际仍有误 |
| **H7** | DEPLOY-OPTIONS.md 推荐有供应链风险的 bootcdn | 🟠 High | 报告第 6.2 节记录了弃用 bootcdn 的理由，但文档中仍推荐 |
| **H8** | 技能数据 "React" vs "React Basics" 中英文不一致 | 🟠 High | 双语一致性问题 |
| **H10** | index_empty.html 仅有中文版 | 🟠 High | 应急页面无双语 |
| **H11** | index_empty.html 邮箱明文暴露 | 🟠 High | 与主站混淆方案不一致 |
| **H12** | 404 英文版"Back to Home"指向中文主页 | 🟠 High | 英文用户被导向中文页面 |
| **M1** | `kramdown.math_engine: mathjax` 死配置 | 🟡 Medium | TROUBLESHOOTING 已记录无效 |
| **M2** | lock.yml 临时工作流未删除 | 🟡 Medium | 注释自称"可删除" |
| **M4** | `_spyResumeOnScroll` 监听器永不移除 | 🟡 Medium | 性能卫生 |
| **M5** | `.workbuddy/` 未加入 .gitignore | 🟡 Medium | AI 工具目录有泄露风险 |
| **M6** | 详情页 footer 硬编码中文姓名 | 🟡 Medium | 英文页显示"王晨" |
| **M7** | 多份文档"最后更新"日期过期 | 🟡 Medium | 停留在 2026-07-04 |
| **M8** | JSON-LD Person schema 不完整 | 🟡 Medium | 可补充 email/jobTitle/alumniOf |
| **M9** | 头像 img 内联 onerror | 🟡 Medium | 不佳实践 |
| **M10** | 三处重复的主题初始化脚本 | 🟡 Medium | 可抽取为 include |

### 8.6 融合后的综合待办清单

合并两份报告，去重后**当前实际待办共 20 项**（含已暂缓项）：

#### 🔴 Critical（2 项）

| 编号 | 事项 | 来源 | 修复难度 |
|---|---|---|---|
| C1 | 将 `项目审查提示词-Jekyll双语个人主页版.md` 和 `INDEPENDENT-ADVERSARIAL-REVIEW.md` 加入 `_config.yml` exclude | 本报告新发现 | 极低 |
| C2 | "毕业设计"项目时间线与 2020 毕业年份矛盾（内容项，所有者暂缓） | 双方一致 | 低（改文案） |

#### 🟠 High（10 项）

| 编号 | 事项 | 来源 | 状态 |
|---|---|---|---|
| H1 | 详情页无 `?lang=` 参数时默认显示中文（而非双语同显） | 本报告新发现 | 待修复 |
| H5 | DEPLOY.md 第 4.6 节更新为 `actions/deploy-pages` 部署方式 | 本报告新发现 | 待修复 |
| H6 | DEPLOY-OPTIONS.md 更新 Gemfile.lock 状态为"✅ 已有" | 本报告新发现 | 待修复 |
| H7 | DEPLOY-OPTIONS.md 删除 bootcdn 推荐，添加安全警告 | 本报告新发现 | 待修复 |
| H8 | 统一技能数据 "React" / "React Basics" | 本报告新发现 | 待修复 |
| H9 | 核实"外部程序设计"课程名（需成绩单） | 双方一致 | ⏸️ 待核实 |
| H10 | index_empty.html 添加英文版本 | 本报告新发现 | 待修复 |
| H11 | index_empty.html 邮箱改用混淆方案 | 本报告新发现 | 待修复 |
| H12 | 404 英文版"Back to Home"链接改为 `en.html` | 本报告新发现 | 待修复 |
| H13 | og:image 改为 1200×630 横版图（需素材） | 双方一致 | ⏸️ 待素材 |

#### 🟡 Medium（10 项）

| 编号 | 事项 | 来源 | 状态 |
|---|---|---|---|
| M1 | 删除 `_config.yml` 无效的 `math_engine: mathjax` | 本报告新发现 | 待修复 |
| M2 | 删除临时工作流 `lock.yml` | 本报告新发现 | 待修复 |
| M3 | KaTeX innerHTML 安全性注释（保持现状） | 本报告新发现 | 可标注 |
| M4 | `_spyResumeOnScroll` 监听器优化 | 本报告新发现 | 待修复 |
| M5 | `.gitignore` 添加 `.workbuddy/` | 本报告新发现 | 待修复 |
| M6 | 详情页 footer 根据语言选择姓名 | 本报告新发现 | 待修复 |
| M7 | 更新文档"最后更新"日期 | 本报告新发现 | 待修复 |
| M8 | 补充 JSON-LD Person schema 字段 | 本报告新发现 | 待修复 |
| M9 | 头像 onerror 改为 JS 绑定（可选） | 本报告新发现 | 可暂缓 |
| M10 | 主题初始化脚本抽取为 include（可选） | 本报告新发现 | 可暂缓 |

#### 🟢 Low（7 项，均为可选改进，略）

### 8.7 融合结论

两份报告的关系是**"存量清剿后的增量发现"**：

- **COMPREHENSIVE-REVIEW**（2026-07-28）是一次大规模的存量问题清剿，37 项中已闭环 34 项，项目质量因此发生跃迁。其修复状态标记经我逐项核验**全部属实**，诚信度很高。
- **本报告**（2026-07-31）在"干净地面"上发现了 **18 项新问题**，主要集中在三个领域：
  1. **文档与代码脱钩**（H5/H6/H7/M7）——这是 COMPREHENSIVE-REVIEW 自身也承认的"系统性风险"，但其审查深度仍不足以覆盖所有文档；
  2. **新增文件的构建风险**（C1）——COMPREHENSIVE-REVIEW 第 6.4 节教训 1 的"第四次复发"，说明"教训写在文档里"不足以防止问题再现，需要落地为自动化机制（如 CI 中校验 exclude 列表完整性、pre-commit hook）；
  3. **双语一致性与 SEO 边界场景**（H1/H8/H10/H11/H12/M6）——这些是"从主页点击进入正常、但从搜索引擎/直接链接进入异常"的边界场景，需要在非正常入口路径下测试才能发现。

**综合评分修正**：COMPREHENSIVE-REVIEW 给出 A−（90 分），本报告独立给出 B+（85 分）。融合后取中间值 **B+/A−（87 分）**：项目工程质量在个人主页中属上游，但文档脱钩和构建风险拉低了分数。修复 C1 和 H5-H7 后可稳固达到 A−。
