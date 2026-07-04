# 部署与维护指南（Jekyll 版）

本项目使用 Jekyll 构建，GitHub Pages 原生支持，push 即自动部署。

---

## AI 操作禁区（AI Assistant Rules）

以下规则对 AI 助手具有强制约束力，违反会导致网站损坏。

### 🚫 绝对禁止的操作

| 规则 | 说明 |
|---|---|
| **禁止删除或修改 `_layouts/default.html` 中的 CSS 引用** | `<link rel="stylesheet" href="style.css">` 和 `<script src="script.js">` 不可删除 |
| **禁止修改 `style.css` 中的 CSS 变量块** | 第 1-35 行的 `:root` / `html[data-theme="light"]` / `html[data-theme="dark"]` 三个块 |
| **禁止修改 `style.css` 中的 `scroll-margin-top`** | 第 61 行，值必须与 `script.js` 第 65 行的 `NAV_OFFSET` 相等 |
| **禁止修改 `_layouts/default.html` 中 `<header>` 和 `<section>` 的 `id` 属性** | `about`/`education`/`experience`/`skills`/`projects`/`publications`/`contact` |
| **禁止修改 `_data/navigation.yml` 中的 `id` 字段** | 必须与 HTML 中的 section id 严格对应 |
| **禁止删除 `_layouts/` 中的 `{% if has_pubs %}` 等条件判断** | 这些控制栏目和导航项的自动显示/隐藏 |
| **禁止修改 `script.js` 中的 `NAV_OFFSET`** | 第 65 行，值 80，必须与 CSS `scroll-margin-top` 一致 |
| **禁止删除 `script.js` 中的 `computeActiveSection` / `createBackToTopButton` 函数** | 核心交互逻辑 |
| **禁止修改 `_config.yml` 中的 `collections` 配置** | 控制论文/项目集合的输出 |

### ⚠️ 谨慎操作

| 规则 | 说明 |
|---|---|
| **修改 `_data/navigation.yml`** | 增删导航项需同步修改 `_layouts/default.html` 中对应的 `<section>` |
| **修改 `style.css` 底部留白** | 第 400 行 `clamp(200px, 25vh, 300px)`，减小可能导致联系方式导航不亮 |
| **修改 `script.js` 第 65 行 `NAV_OFFSET`** | 必须同步修改 `style.css` 第 61 行 `scroll-margin-top` |

### ✅ 可以自由修改的内容

| 内容 | 位置 | 说明 |
|---|---|---|
| 姓名/头衔 | `_data/personal.yml` | `zh.name` / `en.name` / `zh.tagline` / `en.tagline` |
| 邮箱/社交链接 | `_data/social.yml` | 改完中英文页面同步生效 |
| 教育背景 | `_data/education.yml` | 荣誉列表和课程标签支持增删 |
| 工作经历 | `_data/experience.yml` | 增删 `roles` 下的条目；全删则自动隐藏栏目 |
| 技能 | `_data/skills.yml` | 增删分类和标签 |
| 论文发表 | `_publications/*.md` | 新增/删除 `.md` 文件；删光则自动隐藏栏目 |
| 项目经历 | `_projects/*.md` | 同上 |
| Footer 文字 | `_data/personal.yml` | `footer_copyright` / `footer_updated` |
| 头像照片 | `assets/avatar.jpg` | 替换文件即可 |
| 导航菜单文字 | `_data/navigation.yml` | 改 `label`，不改 `id` |

### 🔧 修改后验证清单

1. `bundle exec jekyll serve` — 本地预览
2. 检查布局 / 深浅色切换 / 导航高亮 / 返回顶部按钮
3. 检查联系方式 Grid 布局（桌面 3 列 / 平板 2 列 / 手机 1 列）
4. 中英文切换后滚动位置是否一致
5. 论文/项目标题点击能跳转到详情页

---

## 一、项目目录结构

```
/
├── _config.yml                # Jekyll 站点配置
├── Gemfile                    # Ruby 依赖（本地预览用）
├── _layouts/
│   ├── default.html           # 主页布局（中英文共用）
│   └── detail.html            # 论文/项目详情页布局
├── _data/
│   ├── navigation.yml         # 导航菜单（中英文）
│   ├── personal.yml           # 姓名 / 头衔 / Footer
│   ├── social.yml             # 联系方式（邮箱/GitHub/...）
│   ├── education.yml          # 教育背景
│   ├── experience.yml         # 工作经历
│   └── skills.yml             # 技能
├── _publications/             # 论文 Markdown
│   ├── rag-thesis.md
│   └── lightweight-text-classification.md
├── _projects/                 # 项目 Markdown
│   ├── campus-qa-bot.md
│   ├── tool-calling-assistant.md
│   ├── resume-keyword-matcher.md
│   └── waste-classification.md
├── index.html                 # 中文主页（Jekyll frontmatter）
├── index-en.html              # 英文主页（Jekyll frontmatter）
├── index_empty.html           # "主页暂时关闭"提示页
├── style.css                  # 全局样式（不动）
├── script.js                  # 全局脚本（不动）
├── assets/
│   └── avatar.jpg             # 头像
├── backups/                   # 历史备份
└── DEPLOY.md                  # 本文档
```

---

## 二、如何修改内容

### 个人信息

编辑 `_data/personal.yml`：

```yaml
zh:
  name: 王晨         # ← 改这里
  tagline: ...       # ← 改这里
```

### 联系方式

编辑 `_data/social.yml`：

```yaml
email: your@email.com          # ← 改这里
github: https://github.com/you # ← 改这里
```

### 新增一篇论文

1. 在 `_publications/` 下新建 `.md` 文件：

```markdown
---
zh:
  type: 期刊论文
  title: 你的论文标题
  meta: 期刊名 · 2026
en:
  type: Journal Article
  title: Your Paper Title
  meta: Journal Name · 2026
---

中文摘要内容。

<!-- English -->
English abstract content.
```

2. Jekyll 自动生成详情页，主页自动出现新卡片。
3. 不需要改 HTML、CSS、JS。

### 新增一个项目

同上，在 `_projects/` 下新建 `.md`，额外可填 `github` 和 `demo` 链接。

### 删除论文/项目栏目

把 `_publications/` 或 `_projects/` 下所有 `.md` 文件删掉即可。栏目和导航项自动隐藏。

### 删除工作经历栏目

编辑 `_data/experience.yml`，把 `roles:` 下的内容清空为 `roles: []`。

---

## 三、本地预览

1. 安装 Ruby（macOS 自带；Windows 去 [rubyinstaller.org](https://rubyinstaller.org) 下载）
2. 在项目目录下运行：

```bash
gem install bundler
bundle install
bundle exec jekyll serve
```

3. 浏览器打开 `http://localhost:4000`

---

## 四、部署到 GitHub Pages

1. 创建仓库 `你的用户名.github.io`
2. Push 所有文件：

```bash
git init
git add .
git commit -m "Initial Jekyll site"
git branch -M main
git remote add origin https://github.com/你的用户名/你的用户名.github.io.git
git push -u origin main
```

3. **不需要任何额外操作**。GitHub 检测到 `_config.yml`，自动用 Jekyll 构建，约 1 分钟后：
   - 中文版：`https://你的用户名.github.io/`
   - 英文版：`https://你的用户名.github.io/index-en.html`

4. 以后每次改内容，只需：

```bash
git add .
git commit -m "更新内容"
git push
```

GitHub 自动重新构建，30-60 秒生效。不需要手动点任何按钮。

---

## 五、如何撤回访问

1. 用 `index_empty.html` 的内容覆盖 `index.html`（或删除 `_layouts/` 中的内容）
2. Push，GitHub 自动构建
3. 访问者看到"主页暂时关闭"提示页
4. 恢复：从 `backups/` 或 Git 历史恢复 `index.html` + `_layouts/default.html`，重新 push

---

## 六、备份机制

`backups/` 文件夹存放历史版本。每次大改前备份：

```bash
mkdir -p backups/$(date +%Y-%m-%d)-stable
cp -r _layouts _data _config.yml index.html index-en.html style.css script.js backups/$(date +%Y-%m-%d)-stable/
```

---

## 七、常见问题

**Q：push 后网站没更新？**
A：GitHub Pages 构建需要 30-90 秒。如果超过 2 分钟没变化，去仓库 Settings → Pages 看构建状态。红色表示构建失败（通常是 YAML 语法错误）。

**Q：本地 `bundle exec jekyll serve` 报错？**
A：确保 `bundle install` 成功。如果 Windows 上安装 `github-pages` gem 失败，尝试 `gem install jekyll` 后用 `jekyll serve`（功能相同）。

**Q：样式丢失？**
A：检查 `style.css` 是否在根目录，`_config.yml` 中没有被 exclude。

**Q：想新增一个栏目（如"获奖经历"）？**
A：(1) 在 `_data/navigation.yml` 加导航项；(2) 在 `_data/` 新建数据文件；(3) 在 `_layouts/default.html` 中复制一个 `<section>` 块改 id 和内容。

---

最后更新：2026 年 07 月 04 日
