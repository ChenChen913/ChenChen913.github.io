# 部署与维护指南

本项目是 Jekyll 静态站，托管于 GitHub Pages（`chenchen913.github.io`），push 即自动构建部署。本文档合并了原 DEPLOY.md / DEPLOY-OPTIONS.md / RUBY-JEKYLL.md 三份文档的内容，是部署、内容维护、备份与安全限制的唯一参考。

内容修改的详细增删改流程见 `CONTENT-GUIDE.md`；构建与部署踩坑记录见 `TROUBLESHOOTING.md`。

---

## 一、AI 操作禁区（AI Assistant Rules）

以下规则对 AI 助手具有强制约束力，违反会导致网站损坏。

### 🚫 绝对禁止的操作

| 规则 | 说明 |
|---|---|
| **禁止删除或修改 `_layouts/default.html` 中的 CSS/JS 引用** | `<link rel="stylesheet" href="{{ '/style.css' | relative_url }}">` 和 `<script src="{{ '/script.js' | relative_url }}">` 不可删除 |
| **禁止修改 `style.css` 中的 CSS 变量块** | `:root` / `html[data-theme="light"]` / `html[data-theme="dark"]` 变量定义 |
| **禁止修改 `style.css` 中的 `scroll-margin-top`** | 值必须与 `script.js` 中的 `NAV_OFFSET` 相等 |
| **禁止修改 `_layouts/default.html` 中 `<header>`/`<section>` 的 `id`** | `about`/`education`/`experience`/`skills`/`projects`/`publications`/`contact` |
| **禁止修改 `_data/navigation.yml` 中的 `id` 字段** | 必须与 HTML 中的 section id 严格对应 |
| **禁止删除 `_layouts/` 中的 `{% if has_pubs %}` 等条件判断** | 控制栏目和导航项的自动显示/隐藏 |
| **禁止修改 `script.js` 中的 `NAV_OFFSET`** | 值 80，必须与 CSS `scroll-margin-top` 一致 |
| **禁止删除 `script.js` 中的 `computeActiveSection` / `createBackToTopButton` 函数** | 核心交互逻辑 |
| **禁止修改 `_config.yml` 中的 `collections` 配置** | 控制论文/项目集合的输出 |
| **禁止删除 `portfolio-single-file.html`** | 单文件离线备案页，与数据内容级同步由 `check_portfolio_sync.py` 校验 |

### ⚠️ 谨慎操作

| 规则 | 说明 |
|---|---|
| **修改 `_data/navigation.yml`** | 增删导航项需同步修改 `_layouts/default.html` 中对应的 `<section>` |
| **修改 `style.css` 底部留白** | `footer.site-footer` 的 `padding-bottom` 减小可能导致联系方式导航不亮 |
| **修改 `script.js` 的 `NAV_OFFSET`** | 必须同步修改 `style.css` 的 `scroll-margin-top` |
| **修改 `_data/social.yml` 的邮箱** | 需同步 `_layouts/default.html` 与 `index_empty.html` 中的 JS 字符码数组（见"修改内容"一节） |

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
| Footer 文字 | `_data/personal.yml` | `footer_copyright` / `footer_updated`（`update-date.py` 自动更新日期） |
| 头像照片 | `assets/avatar.jpg` | 替换文件即可 |
| 导航菜单文字 | `_data/navigation.yml` | 改 `label`，不改 `id` |

### 🔧 修改后验证清单

1. `python check_portfolio_sync.py` — 校验单文件备案页与数据内容同步
2. `bundle exec jekyll serve` — 本地预览
3. 检查布局 / 深浅色切换 / 导航高亮 / 返回顶部按钮
4. 中英文切换后滚动位置是否一致
5. 论文/项目标题点击能跳转到详情页

---

## 二、Ruby 与 Jekyll 速查

Ruby 是本项目的运行语言，但**你不需要学 Ruby**——只需两条命令：

```bash
bundle install             # 安装依赖（首次运行或 Gemfile 有变化时执行）
bundle exec jekyll build   # 构建网站（生成 _site/）
bundle exec jekyll serve   # 本地预览（浏览器打开 http://localhost:4000）
```

Jekyll 是静态站点生成器：把 Markdown + YAML 数据 + Liquid 模板编译成纯静态 HTML。没有数据库、没有服务端程序，因此几乎零攻击面，可以免费部署到任意静态托管平台。

`bundle exec` 的作用是在本项目 `Gemfile.lock` 锁定的依赖环境中执行命令，类似 Python 的虚拟环境，确保本地与 CI 构建结果一致。

常见问题：

- **需要学 Ruby 吗？** 不需要，内容全部用 Markdown 和 YAML 写。
- **本地没装 Ruby 怎么办？** 直接 `git push`，GitHub Actions 云端自动构建部署。
- **为什么用 Jekyll 而不是 WordPress/Hexo/Hugo？** WordPress 需要数据库且有安全风险；Jekyll 是 GitHub Pages 原生支持，集成最紧密。

---

## 三、目录结构

```
/
├── _config.yml                # Jekyll 配置（url、collections、exclude 等）
├── Gemfile / Gemfile.lock     # Ruby 依赖与版本锁定
├── _data/                     # 站点数据（改内容主要在这里）
│   ├── personal.yml           #   姓名 / 头衔 / Footer
│   ├── social.yml             #   邮箱 / GitHub / Gitee / X / 微信
│   ├── education.yml          #   教育背景
│   ├── experience.yml         #   工作经历
│   ├── skills.yml             #   技能
│   └── navigation.yml         #   导航菜单
├── _layouts/
│   ├── default.html           # 主页布局（index.html / en.html 共用）
│   └── detail.html            # 论文/项目详情页布局
├── _projects/                 # 项目详情页（Markdown）
├── _publications/             # 论文详情页（Markdown）
├── assets/                    # 头像、PDF、PDF 查看器、自托管前端库、og 分享图、favicon
├── index.html                 # 中文主页入口
├── en.html                    # 英文主页入口
├── 404.html                   # 404 页面
├── index_empty.html           # 主页暂时关闭提示页（不发布）
├── portfolio-single-file.html # 单文件离线备案页（不发布）
├── style.css / script.js      # 全站样式与交互脚本
├── update-date.py             # 更新页脚"最后更新"日期
├── check_portfolio_sync.py    # 校验备案页与数据内容级同步（CI 会执行）
├── generate_assets.py         # 生成 og 分享图与 PNG favicon
├── backup.ps1                 # 本地备份脚本（保留最近 N 份）
├── docs/                      # 内部计划/文档（不发布）
└── .github/workflows/         # GitHub Actions 自动部署配置
```

> `DEPLOY.md`、`CONTENT-GUIDE.md`、`TROUBLESHOOTING.md`、`AUDIT-REPORT.md`、`docs/`、`README*` 等内部文档已在 `_config.yml` 的 `exclude` 中，不会发布到线上。

---

## 四、如何修改内容

### 个人信息 / 联系方式

编辑 `_data/personal.yml` / `_data/social.yml` 对应字段即可。

⚠️ **邮箱唯一数据源**是 `_data/social.yml`，但防抓取副本（JS 字符码数组）同时存在于 `_layouts/default.html` 与 `index_empty.html`。改邮箱必须同步这两处数组；`portfolio-single-file.html` 的明文邮箱由 `check_portfolio_sync.py` 内容级校验兜底（漏改会报错）。

### 新增一篇论文

在 `_publications/` 下新建 `.md`：

```markdown
---
zh:
  type: 期刊论文
  title: 论文标题
  meta: 期刊名 · 2026
  seo_desc: 搜索摘要（可选）
  pdf: 论文文件名.pdf     # 可选；PDF 放 assets/publications/，详情页自动内嵌查看器
en:
  type: Journal Article
  title: Paper Title
  meta: Journal Name · 2026
  seo_desc: Search snippet (optional)
  pdf: 论文文件名.pdf     # 与 zh 保持一致
---

中文正文。

<!-- PAGE_ENGLISH_SPLIT_2026 -->
English body.
```

### 新增一个项目

同上，在 `_projects/` 下新建 `.md`。`github` / `demo` 链接必须放在 front matter **顶层**（`zh:` / `en:` 之外）：

```markdown
---
github: https://github.com/用户名/仓库名
demo: https://demo-link.com
zh:
  type: 个人项目
  title: 项目名称
  meta: 独立开发 · 2026.03 — 2026.06
  desc: 一句话描述
  tech: [Python, FastAPI]
en:
  type: Personal Project
  title: Project Name
  meta: Solo Developer · Mar 2026 — Jun 2026
  desc: One-sentence description
  tech: [Python, FastAPI]
---
```

### 详情页公式与代码

- 正文含数学公式时，在 front matter 加 `math: true`，详情页会自动加载自托管的 KaTeX。
- 正文含代码块时自动加载自托管 highlight.js，无需配置。

### 原理：Markdown 如何变成网页

```
_projects/campus-qa-bot.md
  → 网址 /projects/campus-qa-bot/?lang=zh 与 ?lang=en
```

Jekyll 读取 front matter 结构化数据（title/meta/desc），正文 Markdown 转 HTML，再按 `<!-- PAGE_ENGLISH_SPLIT_2026 -->` 分隔符切成中英文两段，套入 `_layouts/detail.html`；根据 `?lang=` 参数只显示对应语言。**不要改这个分隔符的名字**——模板只认它。

### 删除栏目 / 更新推送

- 删光 `_projects/` 或 `_publications/` 下所有 `.md` → 栏目和导航自动隐藏。
- `_data/experience.yml` 的 `roles: []` → 工作经历栏目自动隐藏。
- 推送通用流程：`git add .` → `git commit -m "说明"` → `git push`，约 1-2 分钟后线上更新。

### 常见修改速查

| 想改的内容 | 编辑哪个文件 | 改什么字段 |
|---|---|---|
| 姓名 | `_data/personal.yml` | `zh.name` / `en.name` |
| 头衔/简介 | `_data/personal.yml` | `zh.tagline` / `en.tagline` |
| 邮箱 | `_data/social.yml` + 两处 JS 数组 | `email` |
| GitHub / Gitee / X | `_data/social.yml` | `github` / `gitee` / `x` |
| 微信公众号 | `_data/social.yml` | `zh.wechat` / `en.wechat` |
| Footer 版权/日期 | `_data/personal.yml` | `footer_copyright` / `footer_updated` |
| 教育背景 | `_data/education.yml` | `zh` / `en` 对应字段 |
| 工作经历 | `_data/experience.yml` | `roles` 条目 |
| 技能 | `_data/skills.yml` | 分类和标签 |
| 新增论文/项目 | `_projects/` / `_publications/` 新建 `.md` | 参考已有文件 |
| 头像 | 替换 `assets/avatar.jpg` | 保持文件名不变 |

---

## 五、本地预览

1. 安装 Ruby 3.3（Windows 去 [rubyinstaller.org](https://rubyinstaller.org) 下载）
2. 项目目录运行：

```bash
gem install bundler
bundle install
bundle exec jekyll serve
```

3. 浏览器打开 `http://localhost:4000`

---

## 六、部署到 GitHub Pages（当前方案）

### 6.1 首次部署

1. 创建公开仓库，仓库名必须严格等于 `你的用户名.github.io`。
2. 本地推送：

```bash
git init
git add .
git commit -m "首次提交：个人主页"
git branch -M main
git remote add origin https://github.com/你的用户名/你的用户名.github.io.git
git push -u origin main
```

3. 如果要求密码：GitHub 自 2021 年起不支持命令行密码，需用 Personal Access Token（Settings → Developer settings → Tokens (classic)，勾选 `repo` 权限，把 token 当密码粘贴）。

### 6.2 自动构建流程

每次 push 到 `main`，GitHub Actions（`.github/workflows/deploy.yml`）自动执行：静态检查（node/Python/YAML）→ `check_portfolio_sync.py` → `jekyll build` → 内部链接检查 → 上传产物 → 部署到 Pages。**不需要 gh-pages 分支，不需要手动点任何按钮。**

手动触发：仓库 Actions 页面可手动运行该工作流；勾选 **deploy** 输入可强制重新部署（不勾则只跑外链巡检）。

### 6.3 部署后验证（push ≠ 部署成功）

```bash
gh run list --repo ChenChen913/ChenChen913.github.io --limit 3
gh api repos/ChenChen913/ChenChen913.github.io/pages --jq '{status}'
# 必须返回 "built"，返回 "errored" 则部署失败
curl -sL "https://chenchen913.github.io/projects/campus-qa-bot/" | grep -c "项目介绍"
```

### 6.4 常见问题与限额

| 问题 | 解决 |
|---|---|
| push 后页面不更新 | CDN 传播 5-10 分钟，等后再看或强刷 |
| Pages 状态 `errored` | `gh api repos/.../pages/builds --method POST` 手动重触发 |
| 构建失败 | 看 Actions 日志；常见原因是 YAML 语法错误或未排除的内部文档含 Liquid 代码 |

| 项目 | 限额 |
|---|---|
| 公开仓库 Pages | 无限站点、无限构建时长 |
| 月带宽 | ~100 GB（软限制） |
| 单文件/站点大小 | 1 GB（建议不超过 25 MB） |
| 自定义域名 | ✅ 免费 HTTPS |
| Actions 时长 | 公开仓库无限 |

---

## 七、备选部署方案

> 前提：所有平台都需要 `Gemfile.lock` 且**必须包含 Linux 平台**。本地在 macOS/Windows 上开发时先执行 `bundle lock --add-platform x86_64-linux` 并提交，否则 Cloudflare/Vercel/Netlify 构建可能因原生扩展编译失败。

### 7.1 Cloudflare Pages（推荐加速方案）

- 全球 330+ 边缘节点（含香港/东京），**免费无限带宽**，国内访问速度在免费方案中最快。
- 步骤：注册（需绑卡验证身份，不扣费）→ Workers & Pages → Connect to Git → 选仓库 → 构建命令 `bundle exec jekyll build`、输出目录 `_site`、环境变量 `RUBY_VERSION=3.3` → Save and Deploy。
- 每个分支/PR 自动生成预览链接；自定义域名免费自动 HTTPS。
- 免费额度：月带宽无限、月构建 500 次、单文件 25 MB、站点不限。

### 7.2 Netlify

- 自动识别 Gemfile 为 Ruby 项目，预填构建命令 `bundle exec jekyll build`、发布目录 `_site`。
- 推荐提交 `netlify.toml`（分支 `main`、环境 `RUBY_VERSION=3.3`；如需兼容旧链接可加 `/index-en.html` → `/en.html` 的 301 重定向）。
- 特色：Deploy Previews、Forms、Functions、Analytics。
- 免费额度：月带宽 100 GB、月构建 300 分钟、单文件 25 MB。

### 7.3 Vercel

- 自动检测 Jekyll，预填构建/安装命令；环境变量 `RUBY_VERSION=3.3`。
- 可选提交 `vercel.json`（buildCommand / outputDirectory / installCommand）。
- **最易踩坑**：构建环境是 Linux x86_64，必须先 `bundle lock --add-platform x86_64-linux`。
- 免费额度：月带宽 100 GB、月构建 **6000 分钟**（Netlify 的 20 倍）。

### 7.4 Gitee Pages（纯国内方案）

- 仓库名必须与用户名一致；**免费版每次 push 后需手动点"更新"按钮**，不会自动部署。
- 支持 GitHub 镜像同步（管理 → 仓库镜像管理 → Pull），但代码同步后部署仍需手动更新。
- 需要实名认证；自定义域名需 ICP 备案。
- 免费额度：1 GB 存储、1 GB/月流量。

### 7.5 对比与推荐

| 平台 | 自动部署 | 国内速度 | 免费带宽 | 自定义域名 | 实名 | 构建配额 |
|---|:--:|:--:|:--:|:--:|:--:|:--:|
| GitHub Pages | ✅ | 慢 | 100 GB/月 | ✅ | 无 | 不限 |
| Cloudflare Pages | ✅ | 快 | **无限** | ✅ | 绑卡 | 500 次/月 |
| Netlify | ✅ | 一般 | 100 GB/月 | ✅ | 无 | 300 分钟/月 |
| Vercel | ✅ | 一般 | 100 GB/月 | ✅ | 无 | 6000 分钟/月 |
| Gitee Pages | ❌ 手动 | 最快 | 1 GB/月 | 需备案 | 必须 | 不限 |

推荐组合：GitHub Pages 保持主站；国内加速加 Cloudflare Pages（一条 push 双平台部署）；纯国内则用 Gitee。

---

## 八、如何撤回访问

1. 用 `index_empty.html` 的内容覆盖 `index.html`（复制并重命名）。
2. Push，GitHub 自动构建；访问者看到"主页暂时关闭"。
3. 恢复：从 `backups/` 或 Git 历史恢复原始 `index.html`，重新 push。

---

## 九、备份机制

### 方式一：备份脚本（推荐）

```powershell
.\backup.ps1                          # 默认保留最近 3 份
.\backup.ps1 -Note "新增实习经历" -Keep 5
.\backup.ps1 -CreateTag               # 同时创建并推送 Git tag
```

脚本自动：
1. 在 `backups/` 下创建 `YYYY-MM-DD-备注` 文件夹；
2. 复制核心文件（`_data/`、`_layouts/`、`_projects/`、`_publications/`、`assets/`、全部根 HTML、`style.css`、`script.js`、`_config.yml`、`portfolio-single-file.html`、`check_portfolio_sync.py`、`update-date.py`、`generate_assets.py`、`backup.ps1`、Gemfile/Gemfile.lock）；
3. 按 `-Keep N` 清理旧备份（默认 3），只保留最近 N 份；
4. 可选创建 Git tag 推送到远程。

### 方式二：Git Tag 远程快照

```bash
git tag -a v2026-07 -m "7月版本"
git push origin v2026-07
git tag -l
```

> 💡 建议组合：本地 `backups/` 随时查看，Git tag 提供远程备份不怕丢。

---

## 十、安全与平台限制

- **CSP**：GitHub Pages 不支持自定义响应头，无法设置 Content-Security-Policy；属平台限制，仅记录。部署到支持响应头的平台时可另行配置。
- **前端依赖**：KaTeX、highlight.js、pdf.js 均已本地自托管（`assets/vendor/`、`assets/pdfjs/`），无 CDN 供应链依赖。
- **邮箱**：线上页面源码不含明文邮箱（JS 字符码拼装，仅防简单抓取）；离线备案页保留明文。
- **链接**：模板对 github/demo/社交链接使用 http/https 白名单，`javascript:` 等变体一律输出 `#`。

---

## 十一、常见问题

**Q：push 后网站没更新？**
A：等 1-2 分钟（CDN 传播最多 5-10 分钟）；超过 3 分钟去仓库 Settings → Pages 看构建状态，红色表示构建失败（通常是 YAML 语法错误）。

**Q：本地 `bundle exec jekyll serve` 报错？**
A：确认 `bundle install` 成功。Windows 上 github-pages gem 安装失败时，可 `gem install jekyll` 后临时用 `jekyll serve`。

**Q：样式丢失？**
A：检查 `style.css` 是否在根目录，`_config.yml` 中没有被 exclude。

**Q：想新增一个栏目（如"获奖经历"）？**
A：(1) `_data/navigation.yml` 加导航项；(2) `_data/` 新建数据文件；(3) `_layouts/default.html` 复制一个 `<section>` 块改 id 和内容。

**Q：GitHub Actions 构建失败且日志提示 Liquid 语法错误？**
A：多半是新增的内部文档（Markdown）被 Jekyll 当作页面解析。确认文件已加入 `_config.yml` 的 `exclude`，或去掉 front matter。

---

最后更新：2026 年 08 月 04 日
