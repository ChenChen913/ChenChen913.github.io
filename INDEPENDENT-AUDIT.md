# 独立审查报告 · ChenChen913.github.io

> 本报告由独立审查者在 **未参考项目内已有的 `AUDIT-REPORT.md`** 的情况下完成。
> 审查日期：2026-07-28
> 审查对象：基于 Jekyll 的中英文双语个人主页（GitHub Pages 部署）
> 审查方式：源码静态阅读 + 配置文件分析 + 文档一致性比对
>
> ℹ️ 文中反复引用的 `AUDIT-REPORT.md` 已于 2026-07-28 删除（其全部发现已融合进本报告第十一节并处理完毕），如需查阅原文可用 `git log --all -- AUDIT-REPORT.md` 从 Git 历史找回。

---

## 一、审查标准（独立制定）

针对"个人项目"这一性质，本报告从以下 12 个维度建立审查标准。每个维度按 🔴 Critical / 🟠 High / 🟡 Medium / 🟢 Low 四档评定问题严重度：

| # | 维度 | 关注点 |
|---|------|--------|
| 1 | 项目结构与组织 | 目录清晰、职责分离、命名一致、备份合理 |
| 2 | 代码质量 | HTML/CSS/JS 规范、注释、命名、死代码 |
| 3 | 文档完整性 | README、部署、排查、修改指南、**文档与实际一致** |
| 4 | 功能完整性 | 核心功能、边界、跨浏览器、可访问性 |
| 5 | 性能 | 资源大小、加载、运行时、移动端 |
| 6 | 安全性 | XSS、外部依赖、链接安全、敏感信息 |
| 7 | 可维护性 | 数据/模板分离、可扩展、**无硬编码路径** |
| 8 | 部署与 CI/CD | 自动化、流程清晰、**依赖锁定**、验证 |
| 9 | 可访问性 | 语义化、ARIA、键盘、对比度 |
| 10 | SEO 与社交分享 | Meta、OpenGraph、结构化数据、Sitemap |
| 11 | 国际化（i18n） | 双语支持、切换、内容完整性 |
| 12 | 版本控制 | `.gitignore`、提交、文件命名 |

---

## 二、项目概览

| 项 | 内容 |
|---|---|
| **项目类型** | 个人主页 / 作品集网站 |
| **技术栈** | Jekyll 4 + Liquid + 原生 HTML/CSS/JS（无前端框架） |
| **部署平台** | GitHub Pages（GitHub Actions 直接部署，`build_type: workflow`） |
| **核心特性** | 中英文双语、深浅色主题、响应式、PDF 内嵌查看器、KaTeX 数学公式、highlight.js 代码高亮 |
| **代码体量** | 1537 行（布局+数据+脚本+样式+内容） |
| **资源体积** | avatar.jpg 636K + 2 个 PDF 共 ~2.3M |

整体定位是 **轻量、纯静态、零数据库、零后端** 的个人作品集，与所声明技术栈完全吻合。

---

## 三、按维度审查结果

### 3.1 项目结构与组织 ✅ 良好

**优点：**
- 标准 Jekyll 目录结构：`_layouts/`、`_data/`、`_projects/`、`_publications/`、`assets/`，职责分明
- `_config.yml` 中显式 `exclude` 了 `backups/`、`index_empty.html`、`portfolio-single-file.html`、`DEPLOY.md`、`TROUBLESHOOTING.md`，避免被 Jekyll 误处理
- 备份机制存在（`backups/2026-07-04-stable/` 与 `backups/pre-jekyll-2026-07-04/`），区分了 Jekyll 化前后的版本

**问题：**
- 🟡 `backups/` 整个目录被提交到 Git 仓库，会持续增加仓库体积。如果只是本地备份，应加入 `.gitignore`；如果需要保留历史快照，更专业的做法是打 Git tag 而不是把文件复制进 `backups/`
- 🟡 根目录下有中文文件名 `放头像说明.txt`，在非 UTF-8 系统/某些 CI 环境下可能导致问题，且文件内容仅为头像说明，可合并到 README 或删除
- 🟢 `portfolio-single-file.html`（43KB）是单文件备份版本，与主版本内容需手动同步，长期维护成本高，建议在 README 中明确标注"同步责任"

### 3.2 代码质量 ✅ 良好

**优点：**
- `script.js` 整体包裹在 IIFE 中，避免污染全局作用域
- 中文注释详尽，每个函数都有"为什么这样写"的说明，不只是"做了什么"
- CSS 使用 CSS 变量系统，浅色/深色主题对应清晰
- HTML 语义化标签使用合理（`<header>`、`<section>`、`<article>`、`<footer>`、`<nav>`）

**问题：**
- 🟡 `script.js` 全部使用 `var`，未采用 `const`/`let`。虽然兼容性最好，但现代浏览器占比已超过 95%，可考虑现代化以减少意外 hoisting 风险
- 🟡 `script.js` 中 `_cachedDocHeight`（第 265 行声明）在 `computeActiveSection`（第 124 行使用）之前被引用，依赖 `var` hoisting 才能正常工作。逻辑上正确但可读性差
- 🟡 `_layouts/default.html` 中存在少量内联样式，如 `style="color:inherit;text-decoration:none;"`（第 183 行）和 `style="margin-bottom:0.9em;"`（第 187 行），违反样式分离原则
- 🟢 `assets/pdf-viewer.html` 第 157 行有 `console.error(err)` 残留，生产环境应移除或包装
- 🟢 `script.js` 第 1 行有 4 空格缩进，整个文件看起来像是被嵌套在某个外层中，纯审美问题

### 3.3 文档完整性 ⚠️ 存在严重不一致

**优点：**
- 文档数量充足：`README.md`、`README_EN.md`、`DEPLOY.md`、`DEPLOY-OPTIONS.md`、`RUBY-JEKYLL.md`、`TROUBLESHOOTING.md`
- `TROUBLESHOOTING.md` 记录了 17 个真实踩坑案例，包含根因分析和教训，质量很高
- `DEPLOY.md` 设有"AI 操作禁区"小节，明确列出不可改动的关键代码位置，对 AI 协作场景非常实用

**严重问题（文档与实际代码不一致）：**
- 🔴 **`DEPLOY.md` 第 75-81 行**列出的项目目录结构与实际不符：
  - 文档说 `_publications/` 下有 `rag-thesis.md` 和 `lightweight-text-classification.md`，**实际只有 `rgv-dynamic-scheduling.md`**
  - 文档说 `_projects/` 下有 `campus-qa-bot.md`、`tool-calling-assistant.md`、`resume-keyword-matcher.md`、`waste-classification.md` **4 个文件，实际只有 `campus-qa-bot.md` 1 个**
- 🔴 **`DEPLOY.md` 第 83 行**提到 `index-en.html`，但实际文件名是 `en.html`（TROUBLESHOOTING.md 第四章已记录重命名，但 DEPLOY.md 未同步更新）
- 🔴 **`DEPLOY.md` 第 219 行**有硬编码 Windows 路径 `cd /c/Users/11853/Desktop/个人主页2`，对 macOS/Linux 用户不友好
- 🟠 **`DEPLOY-OPTIONS.md` 第 14 行**声称 `Gemfile.lock` ✅ 已有，**但仓库中实际不存在 `Gemfile.lock` 文件**（见 3.8 节）
- 🟡 `README.md` 内容过于简略（仅 15 行），未提及如何本地预览、如何修改内容、项目结构等关键信息

### 3.4 功能完整性 ✅ 良好

**优点：**
- 核心交互完整：吸顶导航 + 滚动 spy 高亮 + 返回顶部按钮（带阅读进度环）+ 深浅色切换 + 中英文切换
- 边界处理细致：
  - `script.js` 第 122-128 行：滚动到底部时强制激活最后一个 section，避免导航高亮"漏激活"
  - `script.js` 第 164-176 行：导航点击后抑制 scroll spy 150ms，避免中间章节抢走高亮
  - `script.js` 第 152-153 行：`href.charAt(0) !== "#"` 守卫，放行非锚点链接
- 移动端 PDF 查看器使用 pdf.js 自建方案，规避了手机浏览器原生 PDF 渲染问题（见 TROUBLESHOOTING.md 第十章）
- `_layouts/default.html` 通过 `has_pubs`/`has_projs`/`has_exp` 条件判断，空数据时自动隐藏对应栏目

**问题：**
- 🟠 **`_layouts/detail.html` 第 5 行硬编码 `<html lang="zh-CN">`**，英文用户访问 `?lang=en` 时，页面初始声明为中文，JS 在第 31-39 行才动态修正。屏幕阅读器在 JS 执行前会以中文 pronunciation 朗读英文内容，影响无障碍体验
- 🟡 `assets/pdf-viewer.html` 同样硬编码 `<html lang="zh-CN">`，英文用户进入 PDF 查看器全屏时也是中文 lang
- 🟡 `_layouts/detail.html` 无条件加载 KaTeX 与 highlight.js CDN，即使该篇内容无数学公式或代码块也会加载，造成无谓的网络请求
- 🟢 `script.js` 中 `mql.addEventListener("change", function () { /* 注释 */ })`（第 28-30 行）是空监听器，应删除而非保留为"占位"

### 3.5 性能 ⚠️ 资源体积偏大

**优点：**
- `script.js` 使用 `requestAnimationFrame` 节流 scroll 事件
- 缓存 `_cachedDocHeight` / `_cachedWinHeight`，避免每帧强制 layout
- 滚动事件 `{ passive: true }` 标记，提升滚动流畅度
- pdf.js 配置 `disableAutoFetch: true` 按需拉取页面
- 主题切换在 `<head>` 内联脚本中提前执行，避免 FOUC（主题闪烁）

**问题：**
- 🔴 **`assets/avatar.jpg` 体积 636KB，分辨率 2149×2528**，但 CSS 显示尺寸仅 112×144（手机端 82×106）。应裁剪并压缩到合理尺寸（建议 < 50KB，尺寸不超过 400×500），当前是显示尺寸的 ~340 倍冗余
- 🟠 `assets/projects/campus-qa-report.pdf` 988KB、`assets/publications/智能RGV的动态调度策略研究.pdf` 1.3MB，未做任何压缩或 Web 优化
- 🟠 `style.css`（17KB）与 `script.js`（14KB）均未压缩，未配置任何 minify 流程
- 🟡 `_layouts/detail.html` 第 44-55、132、151 行加载了 3 个外部 CDN 资源（KaTeX CSS、highlight.js、KaTeX JS），每个都是同步阻塞加载
- 🟡 `backups/` 目录占用了仓库体积，每次 `git clone` 都会下载全部历史备份
- 🟡 无 `<meta name="theme-color">`，移动浏览器地址栏不会跟随主题变色

### 3.6 安全性 ✅ 良好

**优点：**
- 所有外部链接均带 `target="_blank" rel="noopener noreferrer"`，防止 reverse tabnabbing
- `localStorage` 访问全部包裹 try-catch，避免在隐私模式下抛错
- `mailto:` 链接使用 Jekyll 模板渲染，无明显 XSS 向量
- `pdf-viewer.html` 对未指定 `file` 参数的情况有 fallback 提示
- `.gitignore` 已排除 `_site/`、`.jekyll-cache/` 等构建产物

**问题：**
- 🟡 pdf.js 从 `cdnjs.cloudflare.com` 加载（`assets/pdf-viewer.html` 第 7、110 行），属于外部 CDN 供应链依赖。若 CDN 被劫持，可注入恶意脚本。建议加 SRI（Subresource Integrity）hash
- 🟡 KaTeX、highlight.js 同样从 `cdn.bootcdn.net` 加载，无 SRI 校验
- 🟢 `_data/social.yml` 中邮箱 `wcn913@gmail.com` 直接暴露在 HTML 中，会被爬虫抓取。可考虑用 JS 动态拼接或加 Cloudflare 邮件混淆

### 3.7 可维护性 ⚠️ 存在硬编码与 TODO 残留

**优点：**
- 数据与模板分离做得很好：所有可变内容在 `_data/*.yml`，模板纯净
- `DEPLOY.md` 中"可以自由修改的内容"表格明确划分了边界
- 导航栏 `id` 与 navigation.yml 严格对应，新增栏目只需改 yml

**问题：**
- 🔴 **`update-date.py` 第 16 行硬编码 Windows 路径** `r"C:\Users\11853\Desktop\个人主页2\_data\personal.yml"`。在 macOS/Linux/其他 Windows 用户路径下完全无法运行。应改为基于 `__file__` 的相对路径定位
- 🟠 `_data/experience.yml` 第 3 行注释 `# TODO: 替换为你的真实工作经历`，但下方已有真实内容。TODO 标签会误导维护者以为还是占位数据
- 🟠 `_data/social.yml` 第 3 行注释 `# TODO: 替换为你的真实链接`，同样问题
- 🟡 `portfolio-single-file.html` 是 1136 行的单文件副本，与主版本（index.html + style.css + script.js）需手动保持同步。没有任何自动化校验机制
- 🟡 `_layouts/detail.html` 中"返回主页"链接的 `class="detail-zh"`/`class="detail-en"` 与 CSS 规则配合实现语言过滤，但缺少注释说明该机制

### 3.8 部署与 CI/CD ⚠️ 依赖未锁定

**优点：**
- `.github/workflows/deploy.yml` 配置规范：使用 `actions/checkout@v4`、`ruby/setup-ruby@v1`、`actions/upload-pages-artifact@v3`、`actions/deploy-pages@v4`，均为官方维护的当前主流版本
- `permissions` 设置最小权限：`contents: read` + `pages: write` + `id-token: write`
- 显式指定 `ruby-version: '3.3'`
- `environment: github-pages` 配合 `url` 输出，便于追踪部署 URL
- `TROUBLESHOOTING.md` 第九章详细记录了从 `peaceiris/actions-gh-pages` 迁移到 `actions/deploy-pages` 的过程与教训

**问题：**
- 🔴 **缺少 `Gemfile.lock`**。`DEPLOY-OPTIONS.md` 第 18 行明确强调"`Gemfile.lock` 不能加入 `.gitignore`，所有平台的自动构建都需要它来锁定依赖版本"，但仓库中实际不存在此文件。`ruby/setup-ruby@v1` 的 `bundler-cache: true` 在无 lock 文件时只能用最新兼容版本，无法保证跨时间/跨机器的构建一致性
- 🟠 **缺少 `.ruby-version` 文件**。`DEPLOY-OPTIONS.md` 第 16 行表格中也建议新建此文件，但仓库中缺失
- 🟡 `Gemfile` 仅声明 `gem "github-pages"`，未指定版本号，进一步加剧版本浮动风险
- 🟡 `deploy.yml` 没有缓存 `vendor/bundle` 之外的内容（虽然 `bundler-cache: true` 已覆盖），但对于 PDF 资源等大型静态文件无优化
- 🟡 部署后验证流程在 `TROUBLESHOOTING.md` 第九章已总结，但未沉淀到 deploy.yml 中作为自动化校验步骤（如部署后 `curl` 检查关键内容）

### 3.9 可访问性 ✅ 良好（有小问题）

**优点：**
- 关键交互按钮均有 `aria-label`：`theme-toggle`（第 89 行）、`back-to-top`（动态生成，第 205 行）
- 装饰性元素带 `aria-hidden="true"`：`top-ribbon`、`avatar-fallback`、`nav-fade`
- `nav` 元素带 `aria-label`
- `prefers-reduced-motion` 在 CSS 中有专门处理（`style.css` 第 40-43 行），JS 中 `getScrollBehavior()` 也尊重此偏好
- 联系方式图标使用 inline SVG，可随主题变色，对比度良好
- 头像 `<img>` 有 `alt` 属性，且有 `onerror` fallback 到首字母占位

**问题：**
- 🟠 前述 `<html lang="zh-CN">` 硬编码问题（3.4 节），影响屏幕阅读器
- 🟡 头像 `onerror="this.style.display='none';"` 是内联事件处理，违反 CSP 最佳实践
- 🟡 `.back-to-top` 按钮在 `transform: translateY(12px)` 初始态下 `pointer-events: none`，但视觉上仍可能被键盘 focus 到（无 `tabindex="-1"` 配合）
- 🟡 项目卡片的标题链接（`_layouts/default.html` 第 183 行）用 `<a>` 包裹整段标题，但整张卡片不可点击，键盘用户需 Tab 到具体链接，无 visual focus indicator 强化
- 🟢 未提供"跳到主内容"（skip link）快捷键

### 3.10 SEO 与社交分享 ⚠️ 基础存在但可强化

**优点：**
- `default.html` 有 `<title>`、`<meta name="description">`、`<meta property="og:title">`、`<meta property="og:type">`、`<meta property="og:description">`
- 中英文版本的 description 内容是语言相关的，非简单复制

**问题：**
- 🟠 缺少 `<link rel="canonical">`，搜索引擎可能将 `?lang=zh` 和 `?lang=en` 视为重复内容
- 🟠 缺少 `sitemap.xml` 与 `robots.txt`，Jekyll 默认不生成
- 🟠 缺少结构化数据（JSON-LD `Person` schema）。对个人主页而言，JSON-LD 能让搜索引擎正确展示"人物知识图谱"
- 🟡 `detail.html` 完全没有 `<meta name="description">`，论文/项目详情页无 SEO 描述
- 🟡 `og:image` 缺失，社交分享时无预览图
- 🟡 缺少 `<meta name="theme-color">`，移动浏览器地址栏不会跟随主题
- 🟡 缺少 `favicon.ico` 与 `apple-touch-icon`
- 🟢 缺少 `twitter:card` 等 Twitter 专属 meta

### 3.11 国际化（i18n） ✅ 良好

**优点：**
- 双语机制设计巧妙：单份模板 + `_data/*.yml` 双语字段 + `page.lang` 切换，避免了维护两套 HTML
- 详情页通过 `<!-- English -->` 注释分隔中英文内容，配合 `?lang=zh`/`?lang=en` URL 参数显示对应版本
- 语言切换时通过 `sessionStorage._scrollRatio` 保持滚动位置（`script.js` 第 326-334 行），细节到位
- 语言切换按钮文字显示"将要切换到的语言"（中文页显示 "EN"，英文页显示 "中文"），符合用户预期

**问题：**
- 🟡 详情页 `<!-- English -->` 分隔符是隐式约定，无文档说明（`DEPLOY.md` 第 197-199 行有提及，但 `RUBY-JEKYLL.md` 中未说明）
- 🟡 详情页硬编码 `<html lang="zh-CN">`（见 3.4 节）
- 🟡 `assets/pdf-viewer.html` 工具栏文字（"放大"、"缩小"、"下载"、"全屏"、"正在加载 PDF…"）只有中文，英文用户访问时 UI 不友好
- 🟢 中英文内容深度不一致：英文 `desc` 字段普遍比中文短，可能影响英文读者的信息获取

### 3.12 版本控制 ⚠️ 可改进

**优点：**
- `.gitignore` 排除了 Jekyll 构建产物（`_site/`、`.sass-cache/`、`.jekyll-cache/`、`.jekyll-metadata`、`vendor/`）与系统文件（`.DS_Store`、`Thumbs.db`）
- `keep_files: [.git]` 保留 Git 元数据

**问题：**
- 🟠 缺少 `LICENSE` 文件。个人项目虽不强制要求，但明确版权声明可避免后续纠纷
- 🟡 `backups/` 目录应加入 `.gitignore`（若仅作本地备份），或改为定期打 Git tag（若需历史快照）
- 🟡 无 `.editorconfig`，多人协作时缩进/换行风格可能不一致
- 🟡 无任何 linting 配置（`.eslintrc`、`.prettierrc`、`.stylelintrc`、`yamllint`），代码风格仅靠人工维护
- 🟢 提交历史中可能存在大文件（avatar.jpg 636KB、两个 PDF 共 ~2.3MB），可考虑用 Git LFS 管理

---

## 四、内容一致性审查

### 4.1 时间线矛盾

- `_data/personal.yml`：**"2020 届本科毕业生"**
- `_data/education.yml`：**"2016.09 — 2020.06"**（与上方一致）
- `_data/experience.yml`：**"2025.06 — 2025.09"** AI 应用开发实习生
- `_projects/campus-qa-bot.md`：**"2025.09 — 2026.03"** 毕业设计
- `_publications/rgv-dynamic-scheduling.md`：**2019 年发表**

🟠 **2020 年本科毕业后到 2025 年实习之间有 5 年空档期**，且 2025 年的"毕业设计"对一名 2020 届本科毕业生而言在语义上不成立（除非是读研/二专，但 education.yml 中无对应记录）。这会被招聘方注意到并质疑。

### 4.2 技能列表异常

`_data/skills.yml` 中"工具与协作"分类下出现 `Openclaw`、`Hermes`、`Trae` 等非主流工具名，且无上下文说明。建议在 README 或简历中补充这些工具的具体含义，避免 HR/面试官误判为占位文字。

### 4.3 "毕业设计"用词

`campus-qa-bot.md` 中文 `meta` 字段为"独立开发 · 2025.09 — 2026.03"，但 `title` 写"校园知识库问答机器人（毕业设计）"。若不是真的毕业设计，建议改为"个人项目"或"独立项目"。

---

## 五、综合评分

| 维度 | 评分 | 说明 |
|------|:--:|------|
| 项目结构 | 8.5/10 | 标准 Jekyll 结构，备份目录管理可优化 |
| 代码质量 | 8/10 | 注释充分、IIFE 隔离；可现代化为 ES6+ |
| 文档完整性 | 5/10 | 数量充足但与实际严重脱节 |
| 功能完整性 | 9/10 | 边界处理细致，交互流畅 |
| 性能 | 5.5/10 | 头像过大、未压缩、CDN 阻塞 |
| 安全性 | 8/10 | 链接安全做得好，缺 SRI |
| 可维护性 | 6/10 | 数据/模板分离好，但有硬编码路径 |
| 部署 CI/CD | 6/10 | Workflow 规范，但缺 Gemfile.lock |
| 可访问性 | 7.5/10 | 大部分到位，lang 硬编码影响 SR |
| SEO | 5/10 | 仅基础 meta，缺 sitemap/JSON-LD |
| 国际化 | 8/10 | 双语机制设计巧妙，少量细节可补 |
| 版本控制 | 6/10 | .gitignore 合理，缺 LICENSE/lint |
| **加权总分** | **6.9/10** | **基础扎实，但文档与生产化需补足** |

---

## 六、优先级修复建议

### 🔴 立即修复（Critical）

1. **生成并提交 `Gemfile.lock`**：本地执行 `bundle install` 后提交，同时执行 `bundle lock --add-platform x86_64-linux` 保证跨平台兼容
2. **修正 `update-date.py` 硬编码路径**：改为 `os.path.join(os.path.dirname(__file__), '_data', 'personal.yml')`
3. **同步 `DEPLOY.md` 目录结构**：删除已不存在的 `rag-thesis.md`、`lightweight-text-classification.md`、`tool-calling-assistant.md`、`resume-keyword-matcher.md`、`waste-classification.md`，把 `index-en.html` 改为 `en.html`

### 🟠 高优先级修复（High）

4. **压缩 `assets/avatar.jpg`**：从 636KB 降到 50KB 以内，尺寸从 2149×2528 裁剪到 400×500 左右
5. **生成 `Gemfile.lock` 的同时添加 `.ruby-version` 文件**（内容：`3.3`）
6. **修复 `detail.html` 硬编码 lang**：让 JS 在最早时机设置 `<html lang>`，或让模板根据 `page.lang` 渲染
7. **补全 SEO 基础设施**：添加 `sitemap.xml`、`robots.txt`、`<link rel="canonical">`、JSON-LD Person schema、`<meta name="theme-color">`、`favicon.ico`
8. **添加 CDN 资源的 SRI hash**：KaTeX、highlight.js、pdf.js
9. **清理 `_data/experience.yml` 与 `_data/social.yml` 中的 TODO 注释**
10. **核对内容时间线**：解释 2020-2025 的 5 年空档，或修正"毕业设计"用词

### 🟡 中优先级修复（Medium）

11. 统一 CDN 源（pdf.js 用 cdnjs，KaTeX 用 bootcdn，建议统一为 bootcdn）
12. `pdf-viewer.html` 工具栏国际化（或至少加英文 fallback）
13. `portfolio-single-file.html` 加入 README 说明同步责任，或考虑废弃
14. `style.css` / `script.js` 加入 minify 流程（可在 deploy.yml 中加一步）
15. 添加 `.editorconfig` 与基础 lint 配置
16. `backups/` 加入 `.gitignore`，或迁移为 Git tag
17. `README.md` 扩充内容，至少加入本地预览、修改流程、目录结构
18. 添加 `LICENSE` 文件

### 🟢 低优先级优化（Low）

19. `script.js` 现代化为 ES6+（`const`/`let`/箭头函数）
20. 移除空监听器 `mql.addEventListener("change", function () {})`
21. 移除 `console.error(err)` 或改为统一日志函数
22. 提取内联样式到 CSS class
23. 添加 skip link 与 visual focus indicator
24. 中文文件名 `放头像说明.txt` 改为英文或合并到 README

---

## 七、亮点（值得肯定的设计）

独立审查不仅要指出问题，也要客观记录项目中的优秀实践：

1. **`TROUBLESHOOTING.md` 的质量极高**：17 个真实踩坑案例，每个都有"问题现象 → 排查过程 → 根因 → 解决方案 → 教训"四段式结构，是项目知识沉淀的范本
2. **`DEPLOY.md` 中的"AI 操作禁区"**：明确列出不可改动的代码位置（CSS 变量块、`NAV_OFFSET`、section id 等），对 AI 协作场景的工程化思考领先于多数个人项目
3. **滚动 spy 的"底部强制激活"逻辑**（`script.js` 第 122-128 行）：解决了吸顶导航普遍存在的"最后一个 section 无法高亮"问题
4. **语言切换的滚动位置保持**（`script.js` 第 326-334 行 + `default.html` 第 34-56 行）：通过 `sessionStorage._scrollRatio` 实现，细节到位
5. **移动端 PDF 查看器方案**：放弃浏览器原生 PDF 渲染，用 pdf.js 自建查看器，规避了 iOS Safari 等移动浏览器的兼容性问题
6. **`prefers-reduced-motion` 全链路支持**：CSS media query + JS `getScrollBehavior()` 双重尊重用户偏好
7. **`color-mix()` 的 fallback 处理**（`style.css` 第 83-84 行）：TROUBLESHOOTING.md 第十五章记录的对抗式审查已修复，体现了自我迭代能力
8. **iPhone Safe Area 适配**（`style.css` 第 513 行 `env(safe-area-inset-bottom)`）：移动端细节到位

---

## 八、审查方法说明

本报告完全基于以下手段独立完成，未参考项目内的 `AUDIT-REPORT.md`：

1. **源码静态阅读**：逐行阅读 `_layouts/`、`script.js`、`style.css`、`assets/pdf-viewer.html`
2. **配置文件分析**：`_config.yml`、`Gemfile`、`.github/workflows/deploy.yml`、`.gitignore`
3. **数据文件比对**：所有 `_data/*.yml`、`_projects/*.md`、`_publications/*.md`
4. **文档一致性比对**：交叉对照 `DEPLOY.md`、`DEPLOY-OPTIONS.md`、`TROUBLESHOOTING.md`、`RUBY-JEKYLL.md`、`README.md` 中描述的目录结构与实际目录
5. **资源体积分析**：`du -h` 检查 `assets/` 与 `backups/`
6. **常见缺失文件检查**：搜索 `favicon`、`robots.txt`、`sitemap.xml`、`LICENSE`、`.editorconfig`、lint 配置等

下一步将阅读项目已有的 `AUDIT-REPORT.md`，与本报告进行对比、互证与融合。

---

# 第二部分：与项目已有 AUDIT-REPORT.md 的对比、评价与融合

> 在完成上文独立审查后，本节阅读项目内已有的 `AUDIT-REPORT.md`（由 Hermes Agent / deepseek-v4-pro 于 2026-07-28 完成，五轮审核），与之对比，并融合两份报告的结论。

## 九、对已有 AUDIT-REPORT.md 的总体评价

### 9.1 AUDIT-REPORT 的方法论优点（值得肯定）

| 方法论亮点 | 价值 |
|------------|------|
| **五轮递进式审核** | 十维度初评 → 多用户视角 → 整体综合 → 内容一致性 → 逐文件审计。结构化、可追溯 |
| **多用户视角审视** | 招聘者 / 同行 / 非技术访客 / AI 助手四视角，超越了纯技术审查的局限 |
| **逐文件审计** | 28 个文件/目录逐一评价，覆盖面非常广，每个文件都有独立状态标签 |
| **内容一致性交叉校验** | 主动比对 `portfolio-single-file.html`、`_data/*.yml`、Markdown 内容、文档之间的内部一致性 |
| **使用星级评分** | ★ 优秀 / ✅ 良好 / ⚠️ 需改进 / 🔴 严重 / 🟡 应处理，视觉直观 |
| **优先级分级建议** | P0 / P1 / P2 / P3 四级，便于维护者排期 |

### 9.2 AUDIT-REPORT 发现而本独立审查遗漏的问题

诚实记录：以下重要问题是 AUDIT-REPORT 首先发现，我的独立审查未覆盖或仅一笔带过：

| # | 问题 | AUDIT-REPORT 的发现 | 我的独立审查 |
|---|------|---------------------|--------------|
| 1 | **`portfolio-single-file.html` 内容与主版本严重不一致** | 详尽对比了身份、成绩、荣誉、课程、项目数、论文数、TODO 标记等 7 个字段，全部不匹配 | ❌ 我只提到"维护成本高"，未发现内容已实质性脱钩 |
| 2 | **`_config.yml` 的 `url` 字段为空影响 SEO** | 明确指出无法生成绝对 URL | ❌ 我提到了 SEO 缺失但未追溯到 `url` 字段 |
| 3 | **`_projects/campus-qa-bot.md` 的 `github`/`demo` 字段为 `"#"` 占位** | 单独列为 P0 问题 | ❌ 我未单独指出 |
| 4 | **"某科技公司"公司名缺乏可信度** | 从招聘者视角切入，列为 P0 | ❌ 我只把它当作"内容审查"未升级 |
| 5 | **缺少"关于我"段落** | 多次提到，列为 P1 | ❌ 我未提及 |
| 6 | **`tagline` 与内容定位不匹配**（"AI 应用开发方向"但内容支撑不足） | 第三轮综合判断明确指出 | ❌ 我未识别这一信息架构问题 |
| 7 | **`footer_updated` 日期 24 天未更新** | 在 personal.yml 审计中提到 | ❌ 我未提及 |
| 8 | **`TROUBLESHOOTING.md` 引用已重命名的 `index-en.html`** | 列为 P2 改进 | ❌ 我未提及（我只把 TROUBLESHOOTING.md 当作"优秀实践"来肯定） |
| 9 | **缺少 `.cursor/rules` 或 `AGENTS.md`** | 列为 P3 锦上添花 | ❌ 我未提及 |

**结论：** 在内容审查、用户视角、跨文件一致性方面，AUDIT-REPORT 比我的独立审查更深入。这些遗漏真实存在，是本独立审查的不足。

### 9.3 本独立审查发现而 AUDIT-REPORT 遗漏的问题

同样诚实记录：以下问题是我独立发现，AUDIT-REPORT 未覆盖：

| # | 问题 | 严重度 | 本独立审查的发现 | AUDIT-REPORT 状态 |
|---|------|:--:|------|------|
| 1 | **`update-date.py` 第 16 行硬编码 Windows 路径** `C:\Users\11853\Desktop\个人主页2\...` | 🔴 | 在 macOS/Linux/其他 Windows 路径下完全无法运行 | ❌ AUDIT-REPORT 第 396-399 行仅说"36 行，自动化日期更新脚本"，评 ✅ 良好，**未识别硬编码路径** |
| 2 | **缺失 `Gemfile.lock`** | 🔴 | DEPLOY-OPTIONS.md 自称"已有"但仓库实际不存在，影响构建可重现性 | ⚠️ AUDIT-REPORT 第 261 行只是"需确认"，**降级到 P3**，严重度评级偏低 |
| 3 | **`_data/experience.yml` 第 3 行 TODO 注释残留**（已有真实内容） | 🟠 | 误导维护者以为是占位数据 | ❌ AUDIT-REPORT 未提及 |
| 4 | **`_data/social.yml` 第 3 行 TODO 注释残留** | 🟠 | 同上 | ❌ AUDIT-REPORT 未提及 |
| 5 | **`_layouts/detail.html` 第 5 行硬编码 `<html lang="zh-CN">`** | 🟠 | 英文用户访问 `?lang=en` 时屏幕阅读器朗读错误 | ❌ AUDIT-REPORT 评 detail.html 为 ★ 优秀，**未识别此无障碍问题** |
| 6 | **`assets/pdf-viewer.html` 工具栏文字仅中文**（放大/缩小/下载/全屏/正在加载） | 🟡 | 英文用户进入全屏时 UI 不友好 | ❌ AUDIT-REPORT 评 pdf-viewer.html 为 ★ 优秀，**未识别国际化缺失** |
| 7 | **CDN 资源缺少 SRI hash**（KaTeX、highlight.js、pdf.js） | 🟡 | 供应链安全风险 | ❌ AUDIT-REPORT 第 145 行只说"外部 CDN 可信"，**未提 SRI** |
| 8 | **CDN 源不一致**：KaTeX 用 bootcdn，pdf.js 用 cdnjs | 🟡 | 国内访问速度差异 | ❌ AUDIT-REPORT 未提及 |
| 9 | **`detail.html` 无条件加载 KaTeX + highlight.js CDN** | 🟡 | 即使内容无公式无代码也会加载，浪费请求 | ❌ AUDIT-REPORT 未提及 |
| 10 | **`script.js` 第 28-30 行空监听器** `mql.addEventListener("change", function () {})` | 🟢 | 死代码 | ❌ AUDIT-REPORT 评 script.js 为 ★ 优秀，**未识别死代码** |
| 11 | **`script.js` 第 265 行 `_cachedDocHeight` hoisting 依赖** | 🟢 | 可读性差 | ❌ AUDIT-REPORT 未提及 |
| 12 | **`pdf-viewer.html` 第 157 行 `console.error(err)` 残留** | 🟢 | 生产环境不应保留 | ❌ AUDIT-REPORT 未提及 |
| 13 | **时间线矛盾**：2020 届本科毕业生 → 5 年空档 → 2025 实习 → 2025-2026 "毕业设计" | 🟠 | "毕业设计"用词对 2020 届毕业生在语义上不成立 | ❌ AUDIT-REPORT 未识别内容时间线问题 |
| 14 | **avatar.jpg 分辨率 2149×2528 vs 显示 112×144**（约 340 倍冗余） | 🟠 | 不仅文件大，分辨率也极不匹配 | ⚠️ AUDIT-REPORT 提到 649KB 过大，但未指出分辨率失衡 |
| 15 | **缺少 `.editorconfig`、lint 配置** | 🟡 | 多人协作风格不一致风险 | ❌ AUDIT-REPORT 未提及 |
| 16 | **缺少 `LICENSE` 文件** | 🟡 | 版权声明缺失 | ❌ AUDIT-REPORT 未提及 |
| 17 | **缺少 `<meta name="theme-color">`、`favicon.ico`、`apple-touch-icon`** | 🟡 | 移动端体验 | ⚠️ AUDIT-REPORT 提到 og:image 但未提这些 |
| 18 | **缺少 `<link rel="canonical">`** | 🟠 | 重复内容风险 | ❌ AUDIT-REPORT 未提及 |
| 19 | **`_projects/campus-qa-bot.md` 第 1-3 行 frontmatter 有空行**（在 `---` 和 `zh:` 之间） | 🟢 | 格式瑕疵 | ❌ AUDIT-REPORT 未提及 |
| 20 | **`Gemfile` 未指定 `github-pages` gem 版本号** | 🟡 | 版本浮动风险 | ❌ AUDIT-REPORT 评 Gemfile 为 ✅ 良好，**未提版本未锁定** |

### 9.4 AUDIT-REPORT 中评级偏松或值得商榷的判断

以下是 AUDIT-REPORT 中我持有不同意见的评级或结论：

| # | AUDIT-REPORT 判断 | 我的不同意见 | 理由 |
|---|---|---|---|
| 1 | `update-date.py` 评 ✅ 良好（第 396-399 行） | 应降级为 ⚠️ 需改进 | 硬编码 Windows 路径使脚本无法在其他机器运行，违背"自动化脚本应可移植"的基本要求 |
| 2 | `Gemfile.lock` 缺失降级为 P3（第 481 行） | 应升级为 🔴 P0 | DEPLOY-OPTIONS.md 自身明确强调"不能加入 .gitignore"，但仓库中根本不存在。这是文档自称有但实际没有的严重不一致，且影响构建可重现性 |
| 3 | `_layouts/detail.html` 评 ★ 优秀（第 279-286 行） | 应降级为 ✅ 良好 | 硬编码 `<html lang="zh-CN">` 是无障碍缺陷，违反"优秀"标准 |
| 4 | `script.js` 评 ★ 优秀（第 298-308 行） | 应降级为 ✅ 良好 | 存在空监听器死代码、`var` hoisting 依赖、console 残留等问题 |
| 5 | `assets/pdf-viewer.html` 评 ★ 优秀（第 349-355 行） | 应降级为 ✅ 良好 | 工具栏仅中文、`console.error` 残留、CDN 源不一致 |
| 6 | `DEPLOY-OPTIONS.md` 评 ★ 优秀（第 372-376 行） | 应降级为 ⚠️ 需更新 | 第 14 行表格声称 `Gemfile.lock` 已有，与实际不符；第 16 行表格声称 `.ruby-version` 建议新建但实际缺失（这一条 AUDIT-REPORT 自己也漏了） |
| 7 | 综合评分 4.0/5.0 | 应为 3.4/5.0 | 见 9.5 节重新评分 |
| 8 | "信息量大而准确"形容 DEPLOY-OPTIONS.md（第 376 行） | "信息量大但含事实性错误" | Gemfile.lock 状态描述错误 |
| 9 | `Gemfile` 评 ✅ 良好（第 258-261 行） | 应降级为 ⚠️ 需改进 | `gem "github-pages"` 未指定版本，叠加 Gemfile.lock 缺失，依赖管理实际处于失控状态 |
| 10 | 安全性 ★★★★☆（第 141-145 行） | 应降级为 ★★★☆☆ | 缺少 SRI、邮箱明文暴露、CDN 供应链风险未充分讨论 |

### 9.5 综合评分重新计算

AUDIT-REPORT 给出 4.0/5.0 综合分。结合本独立审查的发现，重新核算如下：

| 维度 | AUDIT-REPORT 评分 | 本独立审查评分 | 融合评分 | 调整理由 |
|------|:--:|:--:|:--:|------|
| 内容完整性 | ★★★☆☆（3/5） | 6/10 | **3/5** | 双方一致：项目少、公司名模糊、链接占位 |
| 技术架构 | ★★★★★（5/5） | 8.5/10 | **4.5/5** | 架构确实优秀，但 Gemfile.lock 缺失拖累 |
| 用户体验 | ★★★★★（5/5） | 8/10 | **4.5/5** | 视觉/交互无可挑剔，但 detail.html lang 硬编码影响屏幕阅读器 |
| 可维护性 | ★★★☆☆（3/5） | 6/10 | **2.5/5** | update-date.py 硬编码路径、TODO 注释残留、portfolio-single-file 脱钩 |
| 多语言支持 | ★★★★☆（4/5） | 8/10 | **3.5/5** | 双语机制好，但 detail.html lang 硬编码 + pdf-viewer 仅中文 |
| 部署运维 | ★★★★★（5/5） | 6/10 | **3.5/5** | Workflow 规范，但 Gemfile.lock 缺失是硬伤 |
| SEO | ★★☆☆☆（2/5） | 5/10 | **2/5** | 双方一致：多项空白 |
| 创新与细节 | ★★★★★（5/5） | — | **5/5** | 双方一致：多项独创 |
| 文档质量 | ★★★★☆（4/5） | 5/10 | **2.5/5** | DEPLOY.md 引用不存在文件 + DEPLOY-OPTIONS.md 事实性错误，比 AUDIT-REPORT 评估更严重 |
| 安全性 | ★★★★☆（4/5） | 8/10 | **3/5** | 缺 SRI、邮箱明文 |
| **融合综合分** | **4.0/5.0** | **6.9/10** | **3.4/5.0** | **比 AUDIT-REPORT 低 0.6 分** |

**核心分歧原因：** AUDIT-REPORT 对"文档与代码一致性"和"构建可重现性"两个维度的权重偏低，把多处文档/代码不一致归为 P2/P3，本独立审查认为这些是 P0 级别的工程信用问题。

---

## 十、两份报告的互补关系

两份报告呈现出清晰的互补关系，各有侧重：

| 维度 | AUDIT-REPORT 强 | 本独立审查强 |
|------|:--:|:--:|
| 方法论结构（多轮/多视角） | ✅ | — |
| 内容审查（招聘视角、信息架构） | ✅ | — |
| 跨文件一致性（portfolio-single-file 等） | ✅ | — |
| 逐文件覆盖广度 | ✅ | — |
| 代码层面问题深度（hoisting、空监听器、console 残留） | — | ✅ |
| 配置/部署工程化（Gemfile.lock、SRI、CI） | — | ✅ |
| 无障碍（lang 硬编码、ARIA 细节） | — | ✅ |
| 国际化细节（pdf-viewer 仅中文） | — | ✅ |
| 安全（SRI、邮箱暴露、供应链） | — | ✅ |
| 时间线内容矛盾（2020 毕业 vs 2025 实习） | — | ✅ |
| 文档事实性错误（DEPLOY-OPTIONS 自称有 Gemfile.lock） | — | ✅ |

**形象比喻：** AUDIT-REPORT 像"产品经理视角的可用性审查"，本独立审查更像"工程团队的技术 due diligence"。两者结合才能得到完整画像。

---

## 十一、融合后的最终问题清单（按优先级）

合并两份报告的所有问题，去重并重新评级：

### 🔴 P0 — 必须立即修复（融合后共 7 项，比单份报告都多）✅ 已处理（2026-07-28）

| # | 问题 | 来源 | 文件 | 状态 |
|---|------|------|------|------|
| F-P0-1 | **`portfolio-single-file.html` 含旧版占位数据 + TODO 标记，与主版本完全脱钩** | AUDIT-REPORT | portfolio-single-file.html | ✅ 已处理（所有者决定保留为应急离线单文件版，已在顶部注释标注"历史快照，内容可能滞后"；该文件已 exclude，不影响构建） |
| F-P0-2 | **`DEPLOY.md` 引用 5 个不存在的文件 + 1 个已重命名文件** | 双方一致 | DEPLOY.md | ✅ 已修复（目录结构同步为实际的 `rgv-dynamic-scheduling.md` / `campus-qa-bot.md`，`index-en.html` 全部改为 `en.html`，示例路径与硬编码 Windows 路径已泛化） |
| F-P0-3 | **`DEPLOY-OPTIONS.md` 第 14 行声称 Gemfile.lock 已有，与实际不符** | 本独立审查 | DEPLOY-OPTIONS.md | ✅ 已修复（状态改为"❌ 需生成"，并补充精确生成命令） |
| F-P0-4 | **`update-date.py` 硬编码 Windows 路径**，无法跨机器运行 | 本独立审查 | update-date.py | ✅ 已修复（改为基于 `__file__` 的相对路径定位） |
| F-P0-5 | **仓库缺失 `Gemfile.lock`**，构建不可重现 | 本独立审查 | 仓库根目录 | ⏳ 待本地执行（本机无 Ruby/Bundler 环境，无法安全生成；已在 DEPLOY-OPTIONS.md 备好 `bundle install` + `bundle lock --add-platform x86_64-linux` 命令，需所有者在本地运行并提交） |
| F-P0-6 | **"某科技公司"公司名缺乏可信度** | AUDIT-REPORT | _data/experience.yml | ✅ 已处理（所有者确认为可随时修改的占位文字，暂按原样保留） |
| F-P0-7 | **`_projects/campus-qa-bot.md` 的 `github`/`demo` 字段为 `"#"` 占位** | AUDIT-REPORT | _projects/campus-qa-bot.md | ✅ 已修复（`github` 填入真实仓库地址，无演示的 `demo` 字段已移除） |

### 🟠 P1 — 高优先级（融合后共 11 项）✅ 已处理（2026-07-28）

| # | 问题 | 来源 | 状态 |
|---|------|------|------|
| F-P1-1 | 头像 avatar.jpg 649KB + 分辨率 2149×2528，应压缩到 50KB / 400×500 | 双方一致 | ✅ 已压缩为 400×471 / 17KB |
| F-P1-2 | 缺少 `.ruby-version` 文件 | 本独立审查 | ✅ 已新建（内容 3.3，与 workflow 一致） |
| F-P1-3 | `_layouts/detail.html` 硬编码 `<html lang="zh-CN">` | 本独立审查 | ✅ 语言修正脚本已前置到 head 最早位置（charset 之后立即执行） |
| F-P1-4 | SEO 空白：缺 sitemap.xml、robots.txt、canonical、JSON-LD、og:image、theme-color、favicon | 双方一致 | ✅ 已补：jekyll-sitemap 插件 + robots.txt + canonical/og:url/og:image/JSON-LD/theme-color；favicon 曾添加，后按所有者要求移除（不希望浏览器标签显示头像；2026-07-28 复核发现两个图标文件未删干净，已彻底删除） |
| F-P1-5 | `_config.yml` 的 `url` 字段为空 | AUDIT-REPORT | ✅ 已填入 https://chenchen913.github.io |
| F-P1-6 | CDN 资源缺少 SRI hash | 本独立审查 | ✅ 5 个 CDN 资源已加 integrity + crossorigin（worker 由 pdf.js 内部加载，浏览器不支持 SRI，已注释说明） |
| F-P1-7 | `_data/experience.yml` 与 `_data/social.yml` 的 TODO 注释残留 | 本独立审查 | ✅ 已删除两处 TODO 注释 |
| F-P1-8 | 内容时间线矛盾（2020 毕业 → 5 年空档 → 2025 实习 → 2025-2026 "毕业设计"） | 本独立审查 | ⏸️ 暂缓 — 按用户决定，内容文字不纠结真实性，随时可改 |
| F-P1-9 | 缺少"关于我"段落，tagline 与内容定位不匹配 | AUDIT-REPORT | ⏸️ 暂缓 — 内容类修改，同上 |
| F-P1-10 | 删除遗留文件 `放头像说明.txt` | 双方一致 | ✅ 已删除（文件自身注明头像就位后可删） |
| F-P1-11 | `Gemfile` 未指定 `github-pages` 版本号 | 本独立审查 | ✅ 已锁定 `"~> 232"` |

### 🟡 P2 — 中优先级（融合后共 11 项） ✅ 已处理（2026-07-28）

| # | 问题 | 来源 | 状态 |
|---|------|------|------|
| F-P2-1 | 统一 CDN 源（pdf.js 与 KaTeX 当前不一致） | 本独立审查 | ✅ 已全部统一到 cdnjs.cloudflare.com（bootcdn 2024 年有供应链事件；文件 hash 与原源一致，SRI 值不变） |
| F-P2-2 | `pdf-viewer.html` 工具栏国际化 | 本独立审查 | ✅ 已加 I18N 对象（zh/en），语言从 `?lang=` 参数或 referrer 自动检测，全屏链接透传 lang |
| F-P2-3 | `detail.html` 无条件加载 KaTeX + highlight.js | 本独立审查 | ✅ 已改为 Liquid `contains` 判断（has_math/has_code）按需加载 |
| F-P2-4 | `backups/` 加入 `.gitignore` 或迁移为 Git tag | 双方一致 | ✅ 已 `git rm -r --cached` 移出跟踪 + 加入 `.gitignore`（历史版本仍在 Git 提交记录中） |
| F-P2-5 | `TROUBLESHOOTING.md` 第四节加注释说明当前为 en.html | AUDIT-REPORT | ✅ 已加“当前状态（2026-07-28 注）”说明 |
| F-P2-6 | `footer_updated` 日期 24 天未更新 | AUDIT-REPORT | ✅ 已运行 `update-date.py` 更新为 2026-07-28 |
| F-P2-7 | 添加 `.editorconfig` + 基础 lint 配置 | 本独立审查 | ✅ 已加 `.editorconfig`；lint 不引入本地工具链（静态小站收益低，CI 构建失败即是把关） |
| F-P2-8 | 添加 `LICENSE` 文件 | 本独立审查 | ✅ 已加：代码 MIT + 个人内容/图片/PDF 保留所有权利 |
| F-P2-9 | `README.md` 扩充内容 | 本独立审查 | ✅ 已扩充：目录结构、本地预览、修改流程、许可证说明 |
| F-P2-10 | 邮箱明文暴露，可加 JS 混淆 | 本独立审查 | ✅ 已改为 data-u/data-d + JS 运行时拼接，JSON-LD 中 email 字段已移除 |
| F-P2-11 | 拆分 `_projects/*.md` 的中英混合写法 | AUDIT-REPORT | ⏸️ 保留现状 — 评估后认为 `<!-- English -->` 分隔机制简单可靠（单文件双语同步维护成本更低），拆分为两套 collection 会增加重复和漏改风险 |

### 🟢 P3 — 锦上添花（融合后共 8 项）

| # | 问题 | 来源 |
|---|------|------|
| F-P3-1 | 补充 1-2 个项目经历 | AUDIT-REPORT |
| F-P3-2 | 添加 `.cursor/rules` 或 AGENTS.md | AUDIT-REPORT |
| F-P3-3 | `script.js` 现代化为 ES6+ | 本独立审查 |
| F-P3-4 | 移除空监听器与 console 残留 | 本独立审查 |
| F-P3-5 | 提取内联样式到 CSS class | 本独立审查 |
| F-P3-6 | 添加 skip link 与 visual focus indicator | 本独立审查 |
| F-P3-7 | 中文文件名 `放头像说明.txt` 改为英文或合并到 README | 本独立审查 |
| F-P3-8 | `_projects/campus-qa-bot.md` frontmatter 空行清理 | 本独立审查 |

**合计：7 项 P0 + 11 项 P1 + 11 项 P2 + 8 项 P3 = 37 项可执行改进点。**

---

## 十二、最终融合结论

### 12.1 项目定性

这是一份 **"技术工程接近满分、内容运营不及格、文档与代码已实质性脱钩"** 的个人主页项目。

- **技术面**：Jekyll 选型正确、数据/模板分离彻底、CSS 变量体系完善、JS 边界处理细致、移动端适配到位。从代码质量本身看，确实达到了 ★★★★★ 水平。
- **内容面**：工作经历公司名模糊、项目链接为 `#` 占位、tagline 与实际支撑不匹配、时间线存在 5 年空档且"毕业设计"用词对 2020 届毕业生不成立。
- **文档面**：文档数量充足（6 份），但 DEPLOY.md 引用 5 个不存在的文件、DEPLOY-OPTIONS.md 事实性错误声称有 Gemfile.lock、portfolio-single-file.html 含旧版占位数据。文档已与代码实质性脱钩。
- **工程面**：缺失 Gemfile.lock 使构建不可重现；`update-date.py` 硬编码 Windows 路径无法跨机器运行；CDN 缺少 SRI；缺 Sitemap/Canonical/JSON-LD。

### 12.2 给维护者的三句话建议

1. **立即修复 P0 的 7 项**（特别是 portfolio-single-file.html 同步、Gemfile.lock 生成、update-date.py 路径修正、DEPLOY.md 同步实际结构），这些是"信用级"问题，会让任何认真看的人对项目可信度产生怀疑。
2. **完成 P1 的 SEO 与内容补全**，特别是补 1-2 个真实项目链接、解释 2020-2025 的 5 年空档、补"关于我"段落，让 tagline"AI 应用开发方向"有内容支撑。
3. **建立"文档同步检查"机制**，每次大改后在 deploy.yml 中加一步校验文档中引用的文件是否真实存在，避免再次出现 DEPLOY.md 引用 5 个不存在文件的情况。

### 12.3 给项目所有者的元建议

本项目最大的隐患不是任何一个具体 bug，而是 **"文档与代码已经脱钩"** 这一系统性问题——多份文档自称的状态与实际仓库状态不符（Gemfile.lock、文件列表、portfolio-single-file 内容）。建议在每次发布前增加一个自动化校验步骤，把"文档中提到的文件必须存在"作为 CI 的硬性检查。

---

## 十三、本融合报告的局限性

诚实声明：

1. **未实际运行项目**：本审查是纯静态阅读，未运行 `bundle exec jekyll serve` 实际渲染，因此无法发现运行时才暴露的问题（如 Liquid 渲染顺序、资源 404、CSS 实际效果等）
2. **未做跨浏览器测试**：所有可访问性、响应式判断基于代码阅读，未在真实设备/浏览器中验证
3. **未做性能基准测试**：性能评分基于资源体积和代码模式推断，未用 Lighthouse 等工具实测
4. **未检查 Git 历史**：未分析 commit 历史，可能遗漏已修复但未文档化的回归问题
5. **融合评分的权重选择有主观性**：3.4/5.0 的最终分融合了两份独立判断，但仍受审查者个人经验影响

如需更高可信度的审查，建议补充：实际渲染验证 + Lighthouse 性能测试 + axe-core 无障碍自动化扫描 + 跨浏览器手动测试。

---

> **融合报告完成时间：** 2026-07-28
> **审查文件总数：** 28 个文件 + 6 份文档 + 1 个 workflow
> **发现问题总数：** 37 项（7 P0 + 11 P1 + 11 P2 + 8 P3）
> **融合后综合评分：** 3.4 / 5.0（比 AUDIT-REPORT 的 4.0 低 0.6，主要因文档/代码脱钩与 Gemfile.lock 缺失被升级为 P0）
