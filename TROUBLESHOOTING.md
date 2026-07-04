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

## 十、构建经验总结

### 必做事项

1. **Jekyll 项目必须本地验证或使用 GitHub Actions。** 不要依赖 GitHub 内置 Pages 构建的错误提示（太简略）。
2. **任何包含 Liquid 语法的文档文件必须加入 exclude。**
3. **Liquid `assign` 不能做比较运算。** 需要布尔值时必须用 `if/endif` 包裹。
4. **双语内容的摘要不要用 `excerpt`。** 在 frontmatter 中维护语言特定的 `desc` 字段。
5. **GitHub Pages 对特定文件名有未知限制。** 遇到 404 时，尝试简化文件名（去掉连字符）。
6. **push + Actions 构建成功 ≠ 部署成功。** 必须单独验证 Pages 部署状态（`gh api .../pages --jq '{status}'`）和线上页面实际内容。
7. **在 `.nojekyll` 环境下先验证 Pages 配置本身是否正常，再排查 Jekyll 问题。**

### 推荐的工作流

```
修改代码 → 本地 commit → git push → GitHub Actions 构建（约 2 分钟）
                                    ↓
                              查看 Actions 日志
                                    ↓
                         有错误 → 读详细日志 → 修复 → 重新 push
                         无错误 → 浏览器验证页面
```

---

> 最后更新：2026-07-04（新增第九章：部署验证教训）
