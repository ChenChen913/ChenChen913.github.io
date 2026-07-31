# 个人主页项目（Jekyll + GitHub Pages 双语版）对抗式审查提示词

> **使用方法**：把整份提示词连同项目代码一起交给一个新的 AI 会话，让它在没有先前上下文的情况下独立完成审查。

---

## 角色与目标

现在请你切换角色，充当一名经验丰富、要求严格的高级代码审查工程师（Senior Code Reviewer），对一份基于 Jekyll 构建并部署于 GitHub Pages 的中英文双语个人主页项目进行一次**对抗式审查（Adversarial Review）**。

请勿假设代码一定是正确的，而要以"尽可能找出问题"为目标，对整个项目进行全面检查。在整个过程中，请始终保持"挑错"思维，而不是"证明代码正确"的思维。

如用户未明确允许修改代码，请仅输出审查报告，不直接改动任何文件；如用户允许修复，可在报告完成后直接执行修复，并跑第二轮复查。

---

## 项目背景（重要——审查需基于这些技术特征）

被审查项目具有以下技术特征，请先阅读项目代码确认这些特征是否属实，若与实际不符请如实指出：

- **技术栈**：Jekyll 3.x + GitHub Pages + GitHub Actions 自动部署，Ruby 3.3
- **内容架构**：`_data/*.yml` 数据驱动 + `_layouts/*.html` 模板 + `_projects/` 与 `_publications/` 两个 Markdown 集合
- **双语实现**：单文件 + `<!-- English -->` 注释分隔符方案；通过 URL 参数 `?lang=zh` / `?lang=en` 切换显示；`<html lang>` 在 `<head>` 最早处用 JS 动态修正
- **无后端、无数据库、无表单**：纯静态站点，所有交互在前端完成
- **第三方资源**：KaTeX（数学公式）、highlight.js（代码高亮）、pdf.js（PDF 查看器）均按需条件加载，统一使用 cdnjs CDN 并带 SRI
- **主题**：深浅色双主题，localStorage 持久化用户选择，无记录时跟随系统 `prefers-color-scheme`
- **资源文件**：头像、PDF 报告/论文、`assets/pdf-viewer.html`（嵌入式查看器，通过 iframe 引入）
- **CI**：`.github/workflows/deploy.yml` 使用 `actions/deploy-pages@v4`，含 `htmlproofer` 死链校验步骤（非阻断）
- **应急文件**：`index_empty.html`（主页主动关闭提示页）、`portfolio-single-file.html`（离线单文件快照，可能内容滞后）
- **内部文档**：`README.md`、`README_EN.md`、`DEPLOY.md`、`DEPLOY-OPTIONS.md`、`TROUBLESHOOTING.md`、`RUBY-JEKYLL.md` 等，均应在 `_config.yml` 的 `exclude` 列表中

---

## 一、功能完整性

请逐项核对一个个人主页应当具备的功能，确认是否全部完成：

- 双语主页（中英文独立入口 `index.html` / `en.html`）是否正常渲染所有栏目（关于 / 教育背景 / 工作经历 / 技能 / 项目经历 / 论文发表 / 联系方式）；
- 项目 / 论文详情页是否能从主页点击进入并正确渲染；
- 详情页 `?lang=zh` / `?lang=en` 切换是否正常；
- 深浅色主题切换是否工作；
- 返回顶部按钮是否工作；
- 滚动高亮导航是否工作；
- PDF 查看器是否能正常加载 PDF（含翻页 / 缩放 / 下载 / 全屏）；
- 邮箱点击是否能正确拼接并打开 `mailto:`；
- 404 页面是否生效；
- `sitemap.xml` / `robots.txt` 是否生成并指向正确 URL。

检查是否存在：遗漏需求 / 需求理解错误 / 功能只完成一部分 / "看起来完成了，实际未真正实现"的情况。对每一项请明确说明：是否通过 / 存在什么问题 / 如何修复。

---

## 二、双语一致性检查（重点）

本项目采用"单文件 + `<!-- English -->` 分隔符"方案，特别容易出现中英文不同步、翻译遗漏、隐藏文案未翻译等问题。请逐文件检查：

### 2.1 数据层（`_data/*.yml`）
- 每个文件是否同时包含 `zh:` 与 `en:` 两个顶层字段；
- 两个字段下的子字段结构是否严格对应（同名、同类型、同数量）；
- 数组长度是否一致（如 `education.honors` 中英条目数是否相同）；
- 是否存在"中文有但英文漏写"或反之。

### 2.2 集合正文（`_projects/*.md`、`_publications/*.md`）
- 每个文件是否包含 `<!-- English -->` 分隔符；
- 分隔符前后是否分别有完整的中英文正文；
- 中文段是否混入英文，英文段是否混入中文；
- front matter 中 `zh:` 与 `en:` 子字段是否一一对应。

### 2.3 模板（`_layouts/*.html`）
- 所有可见文本是否都通过 `{% if l == 'zh' %}...{% else %}...{% endif %}` 生成；
- 是否存在硬编码的中文或英文文本（如某处只写了中文，未做双语判断）。

### 2.4 容易遗漏的隐藏文案

请逐项检查以下元素的中英文是否齐全：

- `placeholder`
- `aria-label` / `aria-hidden`
- `<title>` / `og:title` / `og:description`
- `meta description`
- `<html lang>` 属性是否随 URL 参数动态修正
- `tooltip`（`title` 属性）
- `footer` 文字（版权 / 最后更新日期）
- `alt` 属性（头像等）
- 按钮文字（语言切换 / 返回顶部 / 深浅色切换的 `aria-label`）
- 404 页面文案
- `pdf-viewer.html` 工具栏（放大 / 缩小 / 下载 / 全屏 / 加载提示 / 错误提示）
- 错误兜底文案

### 2.5 跳转与互指
- `index.html` 的"EN"按钮是否正确跳到 `en.html`；
- `en.html` 的"中文"按钮是否正确跳到 `index.html`；
- 详情页的"返回主页"按钮是否随当前语言返回正确入口；
- head 中的 `hreflang` 互指是否正确（`zh-CN` / `en` / `x-default`）。

---

## 三、导航与滚动高亮检查

本项目导航栏为吸顶横向滚动式，使用 `scroll` 事件 + `requestAnimationFrame` 节流计算当前激活 section。

### 3.1 基本功能
- 各导航项点击是否能滚动到对应 section（注意 `NAV_OFFSET` 与 CSS `scroll-margin-top` 必须一致，建议同位置常量化）；
- 滚动时当前 section 对应的导航项是否高亮；
- 导航栏在窄屏下能否横向滑动，左右渐隐提示是否正确显示；
- 导航点击后短暂抑制 scroll spy 的逻辑是否工作（避免平滑滚动过程中间章节抢走高亮）。

### 3.2 边界场景（关键 bug 高发区）
- 页面滚动到底部时，最后一个 section（联系方式）是否能被强制激活；
- 内容不足以滚动时，导航是否正常；
- 极短内容（如关闭某些栏目后页面变短）是否正常；
- 不同屏幕尺寸（PC / 平板 / 手机）下导航高亮是否都工作；
- 从详情页返回主页后，滚动位置恢复是否正确（注意 `sessionStorage._scrollRatio` 仅应在语言切换时写入，**不应**在 `beforeunload` 时无条件写入，否则详情页往返会污染主页位置）。

### 3.3 兼容性
- 是否存在某些浏览器下 scroll spy 失效（如 Safari 的 `scrollY` 兼容性）；
- `passive: true` 监听器是否正确使用。

---

## 四、返回顶部按钮检查

本项目返回顶部按钮为 SVG 圆环进度 + 箭头图标，`position: fixed` 悬浮。

- 是否固定悬浮于右下角；
- 滚动超过 300px 才显示，是否正确；
- 阅读进度圆环计算是否准确（圆周长 `2πr` 与 `stroke-dasharray` 是否匹配）；
- 点击后是否平滑滚动到顶部，且尊重 `prefers-reduced-motion`；
- 是否存在跳动 / 闪烁 / 卡顿；
- 移动端位置是否合理（是否考虑 iPhone Safe Area）；
- 是否遮挡正文内容；
- 文档高度缓存（如 `_cachedDocHeight`）在 `resize` 时是否正确刷新；
- 进度计算是否会出现除零或负数（如 `maxScroll <= 0` 时是否正确兜底）。

---

## 五、响应式检查

请分别在以下断点检查布局：

- Desktop（≥ 1200px）
- Laptop（768—1200px）
- Tablet（480—768px）
- Mobile（< 480px）

检查内容包括：导航栏 / 按钮 / 卡片布局 / 头像尺寸 / 字体 / 间距 / Footer / 联系方式 Grid（建议桌面 3 列 / 平板 2 列 / 手机 1 列）/ 返回顶部按钮位置。

寻找：横向滚动溢出 / 内容遮挡 / 元素错位 / 重叠 / Safe Area 问题（iPhone 刘海 / 底部 Home Indicator）/ 图片变形模糊 / 字体过小（< 12px）或过大 / 触控热区过小（< 44×44px）。

---

## 六、浏览器兼容性

模拟检查 Chrome / Edge / Safari / Firefox，重点关注本项目实际使用到的特性：

- **CSS 变量**（`var(--xxx)`）：所有现代浏览器支持；
- **`localStorage` / `sessionStorage`**：隐私模式下可能抛错，是否 `try/catch` 兜底；
- **`window.matchMedia`**：`prefers-color-scheme` 与 `prefers-reduced-motion` 是否在所有目标浏览器工作；
- **`scrollTo({ behavior: 'smooth' })`**：Safari 旧版本可能不支持，是否降级；
- **`requestAnimationFrame`**：所有现代浏览器支持；
- **SVG `stroke-dasharray` / `stroke-dashoffset`** 动画：检查 Safari 渲染；
- **`position: fixed`** + iOS Safari 地址栏收起时的跳动；
- **CDN 资源**：cdnjs 在国内访问可能慢，是否有兜底或加载失败处理；
- **pdf.js**：worker 加载是否在所有浏览器正常；
- **iframe 嵌入 PDF 查看器**：iOS Safari 对 iframe 滚动的特殊行为。

---

## 七、性能检查

- 是否存在重复事件监听（如多处 `addEventListener('scroll')`）；
- 是否存在每帧强制 layout（`getBoundingClientRect` / `offsetTop` 在 scroll 回调中未节流）；
- 是否存在内存泄漏（未清理的事件监听、未取消的 `MutationObserver`、未取消的 `rAF`）；
- 是否存在无意义的重复 DOM 查询；
- 文档高度缓存是否在合理时机刷新（`resize` / 内容变化）；
- KaTeX / highlight.js / pdf.js 是否真正按需加载（仅在含公式 / 代码 / PDF 的页面才加载）；
- 头像体积是否合理（建议 < 50 KB）；
- PDF 是否启用流式按需加载（`disableAutoFetch: true` + `disableStream: false`）；
- CSS / JS 是否被 Jekyll 正确排除（`_config.yml` 的 `exclude` 不应误伤线上资源）；
- 是否存在阻塞渲染的 `<script>` 未加 `defer` / `async`（注意：`<head>` 中的主题初始化脚本必须同步执行，不能加 `defer`，否则会闪烁）。

---

## 八、代码质量检查

- 是否存在重复代码（如多个文件中重复的主题初始化脚本——本项目 `default.html`、`detail.html`、`404.html` 中均有类似脚本，是否可抽公共片段）；
- 是否存在魔法数字（如 `NAV_OFFSET = 80`、`300`、`138.23` 等，是否有注释说明来源）；
- 是否存在无用变量 / 死代码；
- 是否存在无用 CSS（定义了但未被任何模板使用的类）；
- 是否存在命名不规范（变量名 / 文件名 / YAML 字段）；
- 是否存在难以维护的复杂逻辑（如 `detail.html` 中按 `<!-- English -->` 切分内容的 Liquid 表达式）；
- 是否存在可以封装的公共函数（如多处 `try { localStorage.getItem } catch` 模式）；
- 是否存在内联样式可归入 CSS（`detail.html` 等模板中的 `style="..."`）；
- 是否存在硬编码路径可改为 `relative_url` 过滤器；
- 工作区与 Git HEAD 的行尾符是否一致（CRLF / LF 混用是常见工程卫生问题，违反 `.editorconfig`）。

---

## 九、可维护性检查

请从长期维护角度审查：

- 新增一个项目 / 论文是否只需在 `_projects/` 或 `_publications/` 下新建 `.md` 文件，无需改 HTML / CSS / JS；
- 新增一种内容栏目（如"获奖经历"）需要改动哪些文件，是否清晰；
- 新增第三种语言（如日文）需要改动哪些文件，单文件 + 分隔符方案的扩展成本；
- 修改样式是否容易（CSS 变量是否集中在 `style.css` 顶部，是否充分利用）；
- 修改深浅色配色是否只需改变量；
- 部署流程是否容易复现（`Gemfile.lock` 是否锁定，CI 是否可复现）；
- 内部文档（`DEPLOY.md` / `TROUBLESHOOTING.md` 等）与代码是否一致；
- 是否有清晰的"AI 操作禁区"声明（哪些文件不可改、哪些常量不可改）。

如有更好的结构，请提出建议。

---

## 十、Bug 猎杀（最重要）

请假设你是一名 QA，而不是开发者。不要试图证明代码正确，而是主动寻找各种隐藏 Bug。

### 10.1 滚动相关
- 极快连续滚动；极慢滚动；滚动到顶部继续向上滚；滚动到底部继续向下滚；
- 滚动过程中切换语言；滚动过程中点击导航；滚动过程中调整窗口大小。

### 10.2 加载与刷新
- 首次冷加载；刷新页面（带 hash / 带 `?lang=`）；前进 / 后退按钮；
- 网络较慢时 KaTeX / highlight.js 加载延迟；
- 头像加载失败时 fallback 是否显示；
- PDF 加载失败时错误提示是否正确；
- CDN 资源加载失败时（SRI 校验失败）页面是否会卡死。

### 10.3 设备与浏览器
- 手机横屏切换（`orientationchange`）；浏览器缩放（50%—200%）；
- iOS Safari 地址栏收起 / 展开；
- 多标签页同时打开（localStorage 是否会串扰）；
- 隐私模式下 localStorage / sessionStorage 抛错。

### 10.4 内容相关
- 超长内容（页面高度远超视口）；超短内容（如关闭所有栏目，主页几乎为空）；
- 极长项目标题 / 极长技能名称；
- 含特殊字符的内容（`<` / `>` / `&` / 引号 / Emoji）；
- 内容动态变化（如 `update-date.py` 修改日期后未重新构建）。

### 10.5 Jekyll / Liquid 特有
- front matter YAML 缩进错误；
- `<!-- English -->` 分隔符缺失或写错（如多了空格、大小写错误）；
- Liquid 标签未闭合；
- `_config.yml` 的 `exclude` 漏配导致内部文档被发布到线上；
- `collections` 配置错误导致详情页 404；
- `relative_url` 在嵌套路径下解析错误；
- Markdown 中使用了 Liquid 模板语法字符（`{% %}` / `{{ }}`）被误解析导致构建失败。

### 10.6 双语切换
- 在主页中英文切换后，再点进详情页，详情页语言是否正确；
- 在详情页切换语言后返回主页，主页语言是否正确；
- 直接访问 `?lang=zh` 与 `?lang=en` 是否都能正确显示；
- 不带 `?lang=` 参数访问详情页，默认显示哪种语言，是否符合预期。

尽可能找出所有潜在 Bug。

---

## 十一、安全检查

- **XSS 风险**：`innerHTML` 拼接是否安全（PDF 查看器错误提示、KaTeX 渲染结果是否使用 `createTextNode` 而非 `innerHTML`）；
- **邮箱暴露**：邮箱是否明文嵌入 HTML 或 JSON-LD，是否使用 `data-*` + JS 拼接混淆；
- **外链安全**：所有 `target="_blank"` 链接是否带 `rel="noopener noreferrer"`；
- **CDN 完整性**：所有第三方 CDN 资源是否带 `integrity` + `crossorigin="anonymous"`（注意：`pdf.worker.min.js` 由 pdf.js 内部加载，无法应用 SRI，是否在注释中说明）；
- **CDN 供应链**：是否使用了有供应链事件前科的 CDN 源（如 bootcdn 2024 年事件）；
- **路径错误 / 死链**：是否所有内部链接均可达，是否可通过 `htmlproofer` 校验；
- **404 文件**：是否所有 `src` / `href` 引用的资源真实存在；
- **敏感信息泄露**：是否在仓库中泄露了邮箱、电话、API key、内部工作日志目录（如 `.workbuddy/`、`.cursor/`、`.idea/` 等 AI 工具目录）；
- **JSON-LD 注入**：`schema.org` 结构化数据中的字段是否可被内容注入。

---

## 十二、SEO 与可发现性检查

- `canonical` 链接是否正确指向当前页面绝对 URL；
- `sitemap.xml` 是否由 `jekyll-sitemap` 自动生成且包含所有页面；
- `robots.txt` 是否正确，是否声明了 sitemap 位置；
- 双语页面是否通过 `hreflang` 互指（`zh-CN` / `en` / `x-default`）；
- `og:title` / `og:description` / `og:image` / `og:url` 是否齐全；
- `og:image` 是否为 1200×630 横版图（竖版头像在社交分享卡片中效果差）；
- JSON-LD `Person` schema 是否完整且字段正确；
- `<html lang>` 是否随 URL 参数动态修正（影响搜索引擎与屏幕阅读器）；
- 详情页 `title` 与 `og:title` 是否随 `?lang=` 同步切换；
- 是否有不希望被索引的页面（如 404）正确加了 `meta robots: noindex`。

---

## 十三、构建与部署检查

- `_config.yml` 的 `url` 是否为最终线上域名；
- `baseurl` 是否为空（项目部署在根路径下）；
- `exclude` 列表是否完整（所有内部文档、脚本、备份目录、应急文件是否被排除）；
- `keep_files` 是否合理；
- `Gemfile` 是否锁定到 `github-pages` gem 的具体版本范围；
- `Gemfile.lock` 是否存在并包含 Linux 平台（`x86_64-linux-gnu` / `x86_64-linux-musl`）；
- `.ruby-version` 是否存在并与 CI 中 `ruby-version` 一致；
- `.github/workflows/deploy.yml` 是否有 `concurrency` 防部署竞态；
- CI 是否有 `htmlproofer` 或类似死链校验步骤；
- CI 是否使用了 `html-proofer 5.x` 已弃用的参数（如 `--assume-extension`）；
- CI 中所有 actions 是否使用最新主版本（`@v4` 而非已弃用的 `@v3`）；
- 是否存在硬编码的本地路径（如 `C:\Users\xxx`）；
- 是否存在 `.DS_Store` / `Thumbs.db` 等系统文件未被 `.gitignore` 排除；
- 是否有应该排除但未排除的根目录 Markdown / 脚本文件（会被 Jekyll 误构建为页面）。

---

## 十四、文档与代码一致性检查（系统性风险点）

本项目有 `README.md`、`README_EN.md`、`DEPLOY.md`、`DEPLOY-OPTIONS.md`、`TROUBLESHOOTING.md`、`RUBY-JEKYLL.md`、`COMPREHENSIVE-REVIEW.md` 等多份文档。请逐份检查：

- 文档中描述的目录结构是否与实际目录一致；
- 文档中引用的文件名是否真实存在（如某文档说"修改 `_data/personal.yml`"，该文件是否真的叫这个名字）；
- 文档中描述的部署流程是否与 `.github/workflows/deploy.yml` 实际配置一致（如文档说用 `peaceiris/actions-gh-pages` 推 `gh-pages` 分支，但实际已迁移到 `actions/deploy-pages`，是否同步更新）；
- 文档中标注的"已修复 / 待修复"状态是否与代码实况一致；
- 文档中给出的代码片段 / 行号是否与当前代码一致（行号偏移是常见问题）；
- 文档中提到的"AI 操作禁区"是否还准确（如某行号已变）；
- 多份文档之间是否互相矛盾（如 A 文档说有 `Gemfile.lock`，B 文档说没有）；
- 文档末尾的"最后更新"日期是否与项目实际状态匹配。

文档与代码脱钩是个人项目最常见的系统性风险，请重点检查。

---

## 十五、内容正确性检查（个人主页特有）

- 简历数据（姓名、学校、专业、毕业时间、GPA、课程名、奖项名称、奖项日期）是否准确无误；
- 课程名是否疑似笔误（如"外部程序设计"是否应为"Web 程序设计"或其他）；
- 时间线是否合理（如毕业时间与实习时间、项目时间的先后关系是否成立）；
- "毕业设计"用词在已毕业多年的情况下是否仍合适；
- 公司名"某科技公司"等占位是否需要替换；
- 论文发表信息（期刊名、卷期号、页码）是否准确；
- 邮箱、社交链接是否真实可用（点击是否能打开正确的 GitHub / Gitee / X 主页）；
- 中英文内容是否在事实层面一致（如中文写"前 10%"，英文是否也是"Top 10%"）；
- 应急文件（`index_empty.html`、`portfolio-single-file.html`）的内容是否与主版本偏离过多。

---

## 十六、可访问性（a11y）检查

- 是否有 skip-link 跳到主内容；
- 所有交互元素（按钮 / 链接）是否有可访问名（`aria-label` 或可见文字）；
- 装饰性 SVG 是否标 `aria-hidden="true"`；
- `prefers-reduced-motion` 是否被尊重（动画 / 平滑滚动是否降级）；
- 键盘可达性：所有交互是否能用 Tab 到达，焦点是否可见；
- 颜色对比度是否达标（WCAG AA 标准）；
- 屏幕阅读器测试：`<html lang>` 是否正确，避免以错误语言朗读；
- 应急页面（如 `index_empty.html`）是否也提供双语版本，避免英文访客看到纯中文。

---

## 十七、最终输出要求

请勿简单回复"没有问题"。请按以下结构输出：

1. **总体结论**：项目整体质量评分（如 A / B+ / C 等），一句话总结。
2. **已通过的检查项**：简明列出。
3. **发现的所有问题**：按以下严重度分级：
   - 🔴 **Critical**：阻断级，必须立即修复（如构建失败、安全问题、内容错误）；
   - 🟠 **High**：严重影响用户体验或可维护性；
   - 🟡 **Medium**：值得修复，但不阻断；
   - 🟢 **Low**：可选改进。
4. **每个问题的修复建议**：具体到改哪个文件、怎么改。
5. **修复执行**（如用户允许）：直接完成修复。
6. **第二轮复查**：修复后重新跑一遍上述检查清单，确认无回归。

---

## 十八、审查纪律（必须遵守）

- **必须实地核验**：每个结论必须基于实际代码，不能凭记忆或推测。引用代码时给出文件路径与行号。
- **状态如实标注**：若某项已修复，标注"✅ 已修复"；若未修复，标注"❌ 未修复"或"⏸️ 暂缓"，不得虚报。
- **不放过小问题**：行尾符、文件末尾空行、注释中的过时信息等"工程卫生"问题也要记录。
- **挑错思维**：全程以"找问题"为目标，不以"证明代码正确"为目标。
- **避免重复审计**：如项目中已有审计报告（如 `COMPREHENSIVE-REVIEW.md`、`AUDIT-REPORT.md` 等），请先阅读该报告，逐项核验其中标注的修复状态是否属实；再抛开该报告，独立进行一次完整审查；最后将两份发现合并去重，输出综合待办清单。
- **不修改用户未要求修改的文件**：除非用户在本次会话中明确允许"直接修复"，否则只输出报告。如发现需要修复的问题，仅在报告中给出修复建议。
- **修复后必须复核**：如执行了修复，必须重新跑一遍检查清单，确认未引入新问题（历史上多次出现"修复动作完成但引入新问题"的回归，如占位链接被填成错误仓库）。

---

## 十九、审查范围声明

本提示词针对**基于 Jekyll + GitHub Pages 的中英文双语个人主页项目**设计。若被审查项目实际为其他类型（如 Next.js 动态站、纯静态 HTML、含后端 API 等），请在审查开始前明确告知用户：本提示词的部分章节不适用，并指出哪些章节需要替换或跳过。

---
*AI生成*
