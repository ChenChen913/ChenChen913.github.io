# 项目构建踩坑记录

> 记录 2026-07-04 Jekyll 迁移后的首次 GitHub Pages 部署过程中遇到的所有问题及解决方案。

---

## 一、GitHub Pages 部署后显示 404

### 问题现象

将 Jekyll 项目 push 到 `ChenChen913/ChenChen913.github.io` 仓库后，访问 `https://chenchen913.github.io` 显示 404。

### 排查过程

| 次数 | 尝试 | 结果 |
|---|---|---|
| 第 1 次 | 等 5-8 分钟 | 仍然 404 |
| 第 2 次 | 通过 `gh api` 检查 Pages 构建状态 | 状态 `building`，无错误信息 |
| 第 3 次 | 手动触发重新构建 | 状态变成 `errored`，错误信息仅为 `"Page build failed"` |

### 为什么反复多次都没有解决

**GitHub 内置的 Pages Jekyll 构建不提供详细错误日志。** 错误信息只有一句 `"Page build failed"`，没有栈追踪，没有文件路径，没有行号。这意味着：

- 任何 YAML 语法错误、Liquid 语法错误、Jekyll 配置问题，反馈都一样
- 无法定位具体出错位置
- 每次修改后 push → 等 2 分钟 → 看 `errored` → 猜测原因 → 再改 → 循环

### 最终解决方案

**放弃 GitHub 内置 Jekyll 构建，改用 GitHub Actions。**

原因：GitHub Actions 提供完整的构建日志（包括 Ruby、Bundler、Jekyll 的输出），可以准确定位错误。

具体步骤：
1. 创建 `.github/workflows/deploy.yml`，在 Ubuntu runner 上执行 `bundle exec jekyll build`
2. 使用 `peaceiris/actions-gh-pages@v4` 将 `_site/` 推送到 `gh-pages` 分支
3. 将 GitHub Pages 源从 `main` 分支切换到 `gh-pages` 分支

**关键教训：** 涉及 Jekyll 的项目，不要依赖 GitHub 内置构建的"黑盒"错误提示。初次部署就直接用 GitHub Actions，或者本地 `jekyll build` 验证后再 push。

---

## 二、Liquid 语法错误：assign 不支持比较运算

### 问题现象

GitHub Actions 日志报错：

```
Liquid Warning: Liquid syntax error (line 6): Expected end_of_string but found comparison
  in "{{site.publications.size > 0 }}" in /_layouts/default.html
```

### 原因

`_layouts/default.html` 中使用了以下写法：

```liquid
{% assign has_pubs = site.publications.size > 0 %}
{% assign has_projs = site.projects.size > 0 %}
{% assign has_exp = e.roles.size > 0 %}
```

**Liquid 的 `{% assign %}` 标签不支持比较运算符。** 这是 Liquid 语言本身的限制，不是 Jekyll 的问题。比较运算只能在 `{% if %}` 标签中使用，不能在 `{% assign %}` 中直接赋值布尔表达式的结果。

### 为什么之前没发现

静态检查工具（YAML 验证、Liquid 标签配对检查）都无法检测这个错误，因为：
- YAML 解析器只检查 YAML 语法，不检查 Liquid
- 标签配对检查只检查 `{% if %}` ↔ `{% endif %}` 配对，不检查标签内容语义
- 本地没有 Ruby/Jekyll 环境，无法运行 `jekyll build` 进行实际构建

### 解决方案

改为 if/endif 条件赋值：

```liquid
{% assign has_pubs = false %}{% if site.publications.size > 0 %}{% assign has_pubs = true %}{% endif %}
{% assign has_projs = false %}{% if site.projects.size > 0 %}{% assign has_projs = true %}{% endif %}
{% assign has_exp = false %}{% if e.roles.size > 0 %}{% assign has_exp = true %}{% endif %}
```

**教训：** Liquid 模板的语义正确性无法通过静态分析保证。有条件时应在本地 `jekyll build` 验证；无条件时应优先使用 GitHub Actions 而非内置构建以获取详细日志。

---

## 三、DEPLOY.md 被 Jekyll 误解析

### 问题现象

GitHub Actions 日志报错：

```
Liquid Exception: Liquid syntax error (line 366): 'if' tag was never closed in DEPLOY.md
```

### 原因

`DEPLOY.md` 中包含以下代码示例：

```markdown
## 代码示例
{% if has_pubs %}...{% endif %}
```

Jekyll 会处理**所有**项目根目录下的文本文件，包括 `.md` 文件。`DEPLOY.md` 中的 `{% if %}` 标签没有对应的 `{% endif %}`（因为是文档中的示例代码，不是真正的模板逻辑），Jekyll 解析时发现 `if` 标签未闭合，抛出错误。

### 为什么之前没发现

- 静态 Liquid 配对检查只检查 `.html` 布局文件，没有检查 `.md` 文件
- 这是一个"Jekyll 处理范围"的概念性问题：以为只有 `_layouts/` 下的文件会被处理，不知道根目录的 `.md` 文件也会被扫描

### 解决方案

在 `_config.yml` 的 `exclude` 列表中加入 `DEPLOY.md`：

```yaml
exclude:
  - DEPLOY.md
```

**教训：** 任何包含 `{% %}` 或 `{{ }}` 语法示例的文档文件，都必须加入 Jekyll 的 `exclude` 列表。否则 Jekyll 会尝试解析它们。

---

## 四、英文版 index-en.html 持续 404

### 问题现象

中文版（`index.html`）正常显示后，英文版（`index-en.html`）持续返回 404。

文件确认存在于 `gh-pages` 分支，大小为 15877 字节，内容为完整的渲染 HTML（开头为 `<!DOCTYPE html>`），但 GitHub Pages 始终返回 404。

### 排查过程

| 次数 | 尝试 | 结果 |
|---|---|---|
| 第 1 次 | 在 frontmatter 加 `permalink: /index-en.html` | 文件存在但仍 404 |
| 第 2 次 | 删除 `_config.yml` 全局 `permalink: /:title/` | 文件存在但仍 404 |
| 第 3 次 | 通过 `curl -sL` 确认 GET 返回的是 GitHub 404 页面 | 确认是 GitHub Pages 路由问题 |
| 第 4 次 | 尝试 `index-en`（无扩展名） | 301 redirect → 404 |

### 最终解决方案

**将文件名从 `index-en.html` 改为 `en.html`。**

GitHub Pages 对 `index-en.html` 这种带连字符的文件名存在路由问题（具体原因不明，可能是 CDN 缓存或路由规则冲突）。改为不带连字符的 `en.html` 后立即 200 OK。

### 联动修改

- `_layouts/default.html`：lang-btn 的 `href` 从 `index-en.html` 改为 `en.html`
- `_layouts/detail.html`：详情页 "Back to Home" 链接从 `/index-en.html` 改为 `/en.html`
- 英文版入口文件从 `index-en.html` 重命名为 `en.html`

**教训：** GitHub Pages 对特定文件名的处理存在未知限制。遇到类似情况时，尝试更简单的文件名（无连字符、无特殊字符）可能直接解决问题。

---

## 五、英文页项目/论文摘要显示中文

### 问题现象

英文版（`en.html`）上线后，项目经历和论文发表的摘要显示的是中文。

例如：英文页的项目卡片中显示 `"基于 RAG 架构做的毕业设计项目..."` 而不是英文描述。

### 原因

布局中使用 Jekyll 的 `excerpt` 来显示摘要：

```liquid
<p class="project-desc">{{ proj.excerpt | strip_html | truncate: 120 }}</p>
```

Jekyll 的 `excerpt` 取的是 Markdown 正文**第一个段落**。每个 Markdown 文件的结构是中文内容在前、英文在后：

```markdown
中文摘要内容。

<!-- English -->
English abstract content.
```

由于中文在分隔符之前，`excerpt` 始终取到中文内容。

### 解决方案

1. 在布局中将 `proj.excerpt` 改为 `proj[l].desc`（l 是当前语言 `zh` 或 `en`）：

```liquid
<p class="project-desc">{{ proj[l].desc }}</p>
<p class="pub-desc">{{ pub[l].desc }}</p>
```

2. 给所有项目和论文的 frontmatter 添加 `desc` 字段：

```yaml
zh:
  desc: 中方摘要文本
en:
  desc: English description text
```

3. 共修改了 6 个 Markdown 文件（2 篇论文 + 4 个项目）。

**教训：** 在双语内容中，不要依赖 Jekyll 的 `excerpt`（始终取第一段）。应在 frontmatter 中维护语言特定的 `desc` 字段，让布局按当前语言选择对应文本。

---

## 六、GitHub 网络不稳定

### 问题现象

在部署过程中，多次出现 GitHub 无法连接的情况：

- `git push` 报 `Failed to connect to github.com port 443`
- `curl https://github.com` 超时
- 有时能连上有时候不能

### 影响

- 代码修改完成后无法立即推送验证
- 需要告知用户手动 `git push`
- 拉长了整个部署调试周期

### 应对策略

- 每次修改后在本地 commit，网络恢复后统一 push
- 优先使用 GitHub CLI（`gh`）而非 `git` 来查询状态（`gh` 的 token 认证更稳定）
- 无法 push 时让用户从本地手动执行

---

## 七、kramdown 数学公式渲染失败

### 问题现象

Markdown 中使用 `$$ E=mc^2 $$` 写数学公式，页面显示为 `[E=mc^2]` 原始文本，未渲染为数学公式。

### 尝试过的方案（均失败）

| 方案 | 结果 |
|---|---|
| `_config.yml` 添加 `kramdown.math_engine: mathjax` | 不生效，kramdown 仍将 `$$` 转换为方括号 |
| 添加 MathJax CDN 到 `_layouts/detail.html` | MathJax 已加载，但 kramdown 输出的不是 `<script type="math/tex">` 标签，MathJax 无法处理 |

### 根因

GitHub Pages 的 kramdown 版本在 GFM 输入模式下，`math_engine` 配置不生效。kramdown 将 `$$...$$` 当作普通段落处理，转换为了 HTML 中的方括号格式。

### 解决方案

将所有 `$$...$$` 公式用 HTML `<div>` 标签包裹：

```html
<div>
$$
\text{similarity}(\mathbf{q}, \mathbf{d}) = \frac{\mathbf{q} \cdot \mathbf{d}}{\|\mathbf{q}\| \cdot \|\mathbf{d}\|}
$$
</div>
```

原理：kramdown 不处理 `<div>` 内部的 Markdown 语法，`$$` 原样输出到 HTML。浏览器端的 MathJax 直接识别并渲染。

---

## 八、Markdown 图片引用本地文件不显示

### 问题现象

Markdown 中使用 `![架构图](assets/projects/campus-qa-arch.png)` 引用本地图片，但文件不存在，图片无法显示。

### 解决方案

**方案 A（本次采用）：** 使用内嵌 SVG，直接在 Markdown 中以 HTML 方式写入 `<svg>` 标签。适合流程图、架构图等简单图表，无需外部文件。

**方案 B（推荐用于照片/截图）：** 将图片文件放入 `assets/` 对应子目录，在 Markdown 中用相对路径引用即可自动显示。

---

## 九、提交代码 ≠ 部署成功：未验证 Pages 实际部署状态

### 2026-07-04 案例：campus-qa-bot.md 内容精简后页面仍显示旧内容

**问题现象**

将 `_projects/campus-qa-bot.md` 从 ~200 行精简到 ~55 行（删除了核心指标表格、系统架构图、数学公式、代码块、数学公式测试等所有旧内容），`git push` 后用户反馈页面依然显示全部旧内容。

**根因：Jekyll 构建成功但 Pages 部署失败，且未做部署后验证**

流程问题分三步：

| 步骤 | 实际状态 | AI 的假设 |
|------|----------|-----------|
| `git push` | ✅ 已推到 GitHub | ✅ 已推到 GitHub |
| Jekyll 构建 (GitHub Actions) | ✅ 构建成功，产物推到 gh-pages | ✅ "部署成功" |
| Pages 部署 (GitHub 内部) | ❌ 连续 3 次失败："Deployment failed, try again later" | ❌ **没检查这一步** |

当时的部署方式是 `peaceiris/actions-gh-pages` → `gh-pages` 分支 → GitHub 内部 `pages-build-deployment`。Jekyll 构建虽然成功，但 GitHub Pages 的部署服务临时故障，`gh-pages` 分支最新 commit 始终未上线。由于 AI 没有单独检查 Pages 部署状态，误以为"push + 构建成功 = 已部署"。

**为什么容易犯这个错误**

1. **GitHub Pages 有两层构建**：第一层是用户配置的 GitHub Actions（Jekyll 构建），第二层是 GitHub 内部的 Pages 部署。第一层成功不代表第二层成功。
2. **Pages 部署失败没有主动通知**：GitHub 不会给仓库推送者发邮件或通知，除非主动去 Actions 页面查看。
3. **CDN 缓存拖慢验证**：即使部署成功，CDN 也有 5-10 分钟延迟，无法即时验证。

**最终解决方案**

将部署方式从 legacy（gh-pages 分支）切换为 GitHub Actions 直接部署：

```bash
# 1. 将 Pages 构建类型从 legacy 切换为 workflow
gh api repos/ChenChen913/ChenChen913.github.io/pages --method PUT \
  -f build_type='workflow'

# 2. 修改 workflow 用 actions/deploy-pages 替代 peaceiris/actions-gh-pages
```

workflow 关键改动：
```yaml
# 旧方案（legacy，可能被 GitHub 内部部署卡住）
- uses: peaceiris/actions-gh-pages@v4
  with:
    publish_dir: ./_site
    publish_branch: gh-pages

# 新方案（GitHub Actions 直接部署，一步到位）
- uses: actions/upload-pages-artifact@v3
  with:
    path: ./_site
- uses: actions/deploy-pages@v4
```

同时需要设置正确的 permissions：
```yaml
permissions:
  contents: read
  pages: write
  id-token: write
```

**AI 易犯错误模式**

```
修改源文件 → 本地验证通过 → git push → 看 Actions 构建日志显示 ✅
→ "部署完成了！"  ← 这里就错了
→ 实际情况：GitHub Pages 内部部署可能失败，线上还是旧内容
```

**验证清单（每次部署后必须执行）**

| 步骤 | 命令/操作 | 目的 |
|------|----------|------|
| 1. 检查 Actions 构建日志 | `gh run list --limit 3` | 确认 Jekyll build 成功 |
| 2. 检查 Pages 部署状态 | `gh api repos/:owner/:repo/pages --jq '{status}'` | 确认 Pages 状态为 `built` 而非 `errored` |
| 3. 对线上页面做内容校验 | `curl -sL $URL \| grep -c "关键内容"` | 确认新内容已生效、旧内容已清除 |
| 4. 注意 CDN 延迟 | 部署成功后等 2-3 分钟再验证 | 避免看到的是 CDN 缓存的旧页面 |

**教训**

> push + Actions 构建成功 ≠ 线上已生效。必须单独验证 GitHub Pages 部署状态和线上页面实际内容。不要在 Actions 日志显示绿色就宣布"部署完成"。

---

## 十、PDF 在手机/平板端触发下载而非内嵌显示

### 问题现象

详情页使用 `<iframe src=".pdf">` 嵌入 PDF。桌面端浏览器内置 PDF 查看器正常显示；手机/平板端浏览器不支持 iframe 内嵌 PDF，自动弹出下载对话框。

### 尝试过的错误方案

| 方案 | 结果 |
|------|------|
| 移动端检测 + fallback 卡片链接 | 用户不接受，点击卡片仍然触发下载；要求"和电脑端一样直接看到 PDF" |

### 最终方案：PDF.js 自建查看器

**原理**：放弃依赖浏览器原生 PDF 渲染，改用 pdf.js 在 canvas 上纯 JS 渲染，全平台一致。

**实现**：
1. 创建 `assets/pdf-viewer.html`，引入 pdf.js CDN
2. 支持翻页（◀ ▶）、缩放（＋－）、下载（📥）、全屏（⛶）
3. 详情页 iframe src 从 `.pdf` 改为 `pdf-viewer.html?file=.pdf`
4. `disableAutoFetch: true` — 按需加载页面，大幅加速首屏
5. 进度条 + 百分比反馈，改善等待体验

**全屏按钮的特殊处理**：不能直接链接原始 PDF（手机端点击 PDF 链接仍会触发下载）。改为链接查看器页面自身（`pdf-viewer.html?file=.pdf`），手机端同样用 pdf.js 渲染。

**教训**：不要依赖浏览器原生 PDF 渲染做跨平台方案。手机浏览器对 `<iframe src=".pdf">` 的支持极差，pdf.js 是唯一可靠的跨平台方案。

---

## 十一、导航首次点击偏移到错误位置

### 问题现象

首次打开主页后点击导航栏某标签，页面跳到上一节而非目标位置。后续点击正常。

### 根因

导航链接使用浏览器默认锚点滚动（`<a href="#projects">`），首次加载时页面布局未完全稳定（头像图片加载、字体渲染改变页面高度），`scroll-margin-top` 计算偏移。

### 解决方案

在 `script.js` 中拦截所有 `#hash` 导航链接，用 `getBoundingClientRect().top` 实时计算滚动位置，替代浏览器默认锚点：

```javascript
navLinks.forEach(function (link) {
  link.addEventListener("click", function (e) {
    var href = this.getAttribute("href");
    if (!href || href.charAt(0) !== "#") return;  // 放行普通页面跳转
    e.preventDefault();
    var target = document.getElementById(href.replace("#", ""));
    if (!target) return;
    var top = target.getBoundingClientRect().top + window.scrollY - NAV_OFFSET;
    window.scrollTo({ top: top, behavior: "smooth" });
    history.pushState(null, null, "#" + id);
    setActive(id);
  });
});
```

### 衍生 Bug：返回主页失效

拦截所有导航链接后，详情页"返回主页"（`href="/index.html"`）也被拦截，因无对应元素导致链接被吞。修复：加 `href.charAt(0) !== "#"` 守卫，放行所有非哈希链接。

**教训**：对导航链接做事件拦截时，务必用 `href.charAt(0) === "#"` 区分哈希锚点和普通页面跳转，否则会破坏所有页面间导航。

---

## 十二、构建经验总结

### 必做事项

1. **Jekyll 项目必须本地验证或使用 GitHub Actions。**
2. **任何包含 Liquid 语法的文档文件必须加入 exclude。**
3. **Liquid `assign` 不能做比较运算。**
4. **双语内容的摘要不要用 `excerpt`。**
5. **GitHub Pages 对特定文件名有未知限制。**
6. **push + Actions 成功 ≠ 部署成功。** 必须验证 Pages 部署状态和线上内容。
7. **手机端不依赖浏览器原生 PDF 渲染。** 统一用 pdf.js。
8. **导航链接拦截必须区分 #hash 和普通链接。** 否则破坏页面跳转。
9. **首次点击偏移用 getBoundingClientRect 替代锚点。** 实时位置不受布局时序影响。

### 推荐的工作流

```
修改代码 → commit → push → Actions 构建+部署
                              ↓
                     gh api .../pages --jq '{status}'
                              ↓
                      built → curl 验证线上内容
                              ↓
                      CDN 缓存后浏览器确认
```

---

## 十三、浏览器翻译插件干扰 GitHub README 显示

### 问题现象

中文 README.md 中写了 `[English](README_EN.md)` 作为语言切换按钮，本地和代码层面都正确，但用户在 Chrome/Edge 中看到的却是被翻译成中文的文字（如"英语"），而非预期的 "English"。

### 根因

Chrome 和 Edge 安装了 GitHub 翻译插件（浏览器扩展），会自动将页面上英文文本翻译为中文。`[English]` 这个链接文字被插件识别为英文并翻译。

### 解决

这不是代码 bug，是浏览器扩展行为。换用没有翻译插件的浏览器（如夸克）即可正常显示。README 文件本身无需修改。

**教训**

> 用户反馈"网页端显示不对"时，先排除浏览器插件干扰。翻译类、广告拦截类扩展都可能改变页面渲染结果。让用户换一个无插件的浏览器或隐私模式验证，可以快速定位问题。

---

## 十四、项目目录迁移（跨盘符不影响 Git）

### 背景

用户询问将项目从 C 盘剪切到 D 盘是否影响 Git 推送和后续维护。

### 结论

**完全不影响。** Git 项目是自包含的（所有历史和配置在 `.git/` 目录内），不依赖磁盘盘符。

### 迁移后无需改动的部分

| 无需改动 | 原因 |
|----------|------|
| `git status / commit / push` | 远程地址存在 `.git/config`，与本地路径无关 |
| GitHub Actions 自动部署 | 远端构建，与本地路径无关 |
| Jekyll 构建 + 相对路径 | `relative_url` 等均为相对路径 |
| 所有项目配置文件 | 项目内无硬编码绝对路径 |

### 唯一需要做的

迁移后告知 AI 新的工作目录路径，后续操作切过去即可。

**教训**：Git 仓库是自包含的，所有历史、分支、远程配置都在项目内的 `.git` 目录中。只要 `.git` 目录完整，项目移动到任何盘符、任何路径都不会影响 Git 功能。

---

## 十五、对抗式审查发现的问题与修复

### 审查结果

2026-07-04 进行全项目对抗式审查，发现以下问题并全部修复：

| # | 问题 | 严重度 | 修复 |
|---|------|:--:|------|
| C1 | `color-mix()` 无 CSS fallback，老浏览器导航栏背景透明 | 🔴 | 加 `background: var(--bg-elevated)` 先行声明 |
| H1 | `systemTheme()` 死代码 | 🟡 | 删除 |
| H2 | 空 `_motionQuery` change 监听器 | 🟡 | 删除 |
| H3 | `en.html` 注释含中文"本地预览" | 🟡 | 改为 "Local Preview" |
| M1 | `detail.html` 硬编码 `lang="zh-CN"`，英文页语音错误 | 🟠 | JS 动态设置 `lang` |
| M2 | PDF 查看器不响应 resize | 🟠 | 加 debounced resize 监听 |
| L1 | `history.pushState` 无 try-catch | 🟢 | 包裹 try-catch |

### 审查结论

中英文分离、导航定位、返回顶部、响应式、安全性均通过检查。共修复 7 个问题（1 Critical + 3 High + 2 Medium + 1 Low）。

**教训**：CSS 新特性（`color-mix`、`aspect-ratio` 等）必须提供 fallback。`<html lang>` 在多语言页面中不能硬编码。对抗式审查应作为每次重大修改后的标准流程。

---

## 十六、导航点击时中间章节抢走高亮

### 问题现象

点击导航标签后平滑滚动到目标位置，但经过中间章节时导航高亮短暂切走（如点击"项目经历"，经过"技能"时高亮先跳到"技能"再回到"项目经历"），造成"卡顿"的视觉错觉。

### 根因

`computeActiveSection` 在平滑滚动过程中每帧都被触发，检测到当前位置属于中间章节时就更新 `setActive()`。

### 解决方案

点击导航后设 `_spyPaused = true`，抑制 scroll spy 800ms（足够平滑滚动完成），到期自动恢复。

**教训**：手动触发滚动时要考虑 scroll spy 的中间态干扰，短暂抑制比精确计算完成时间更简单可靠。

---

## 十七、页面更新日期自动化

### 问题

`_data/personal.yml` 中的 `footer_updated` 日期需手动更新，容易遗忘。

### 解决方案

创建 `update-date.py`，自动获取北京时间（UTC+8），写入中英文日期格式。每次推送前运行：

```bash
python update-date.py
git add _data/personal.yml
git commit -m "更新日期"
git push origin main
```

---

> 最后更新：2026-07-04（新增第十五～十七章：审查修复、spy 抑制、日期自动化）
