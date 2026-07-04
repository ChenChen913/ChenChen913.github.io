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

### 原理：Markdown 如何变成网页

每篇论文和项目都是一个 Markdown 文件，Jekyll 自动把它转成独立的 HTML 页面。

**文件映射关系：**

```
_projects/campus-qa-bot.md
  → 网址 /projects/campus-qa-bot/?lang=zh
  → 网址 /projects/campus-qa-bot/?lang=en

_publications/rag-thesis.md
  → 网址 /publications/rag-thesis/?lang=zh
  → 网址 /publications/rag-thesis/?lang=en
```

**转换流程：**

```
Markdown 文件                         Jekyll 构建
┌─────────────────────┐              ┌──────────────────┐
│ ---                 │              │                  │
│ zh:                 │  frontmatter │ 读取 title/meta  │
│   title: 论文标题    │ ──────────→ │ 等结构化数据     │
│   desc: 摘要        │              │                  │
│ en: ...             │              ├──────────────────┤
│ ---                 │              │                  │
│                     │   正文       │ 读取 Markdown    │
│ 中文正文...          │ ──────────→ │ → 转 HTML        │
│                     │              │                  │
│ <!-- English -->    │   分隔符     │ 按分隔符切分     │
│                     │ ──────────→ │ 中英文内容       │
│ English content...  │              │                  │
│                     │              ├──────────────────┤
└─────────────────────┘              │                  │
                                     │ _layouts/        │
                                     │ detail.html      │
                                     │ （详情页模板）    │
                                     │ 套入数据+内容    │
                                     │                  │
                                     └──────────────────┘
```

**关键配置（`_config.yml` 中不需要改动）：**

| 配置 | 作用 |
|---|---|
| `collections.publications.output: true` | 让每篇论文 `.md` 生成独立页面 |
| `collections.projects.output: true` | 让每个项目 `.md` 生成独立页面 |
| `defaults.type.publications.layout: detail` | 论文页面用 `_layouts/detail.html` 模板 |
| `defaults.type.projects.layout: detail` | 项目页面用同一个模板 |

**`<!-- English -->` 分隔符的作用：**

每篇论文/项目的正文中，用 `<!-- English -->` 把中文和英文内容分开。模板（`_layouts/detail.html`）会按这个分隔符切成两段，分别放入中文区和英文区。根据来源页面语言（`?lang=zh` 或 `?lang=en`），只显示对应语言的内容。

**新增内容无需改代码：**

只需在 `_publications/` 或 `_projects/` 下新建 `.md` 文件，写好 frontmatter 和正文 → `git push` → 主页自动出现新卡片 → 点击跳转到自动生成的详情页。

### 删除论文/项目栏目

把 `_publications/` 或 `_projects/` 下所有 `.md` 文件删掉即可。栏目和导航项自动隐藏。

### 删除工作经历栏目

编辑 `_data/experience.yml`，把 `roles:` 下的内容清空为 `roles: []`。

### 通用更新流程（改完内容后如何推送）

无论修改了什么（数据文件、Markdown、样式），推送步骤都一样：

```bash
# 第一步：进入项目文件夹
cd /c/Users/11853/Desktop/个人主页2

# 第二步：把所有改动加入暂存区
git add .

# 第三步：提交（备注写清楚改了什么）
git commit -m "更新了个人信息"

# 第四步：推送到 GitHub
git push
```

推送后，GitHub Actions 自动构建并部署，约 **1-2 分钟**后网站更新。不需要手动点任何按钮。

### 常见修改速查

| 想改的内容 | 编辑哪个文件 | 改什么字段 |
|---|---|---|
| 姓名 | `_data/personal.yml` | `zh.name` / `en.name` |
| 头衔/简介 | `_data/personal.yml` | `zh.tagline` / `en.tagline` |
| 邮箱 | `_data/social.yml` | `email` |
| GitHub / Gitee / X 链接 | `_data/social.yml` | `github` / `gitee` / `x` 等 |
| 微信公众号 | `_data/social.yml` | `zh.wechat` / `en.wechat` |
| Footer 版权/更新日期 | `_data/personal.yml` | `zh.footer_copyright` 等 |
| 教育背景 | `_data/education.yml` | `zh` / `en` 下的对应字段 |
| 工作经历 | `_data/experience.yml` | `roles` 下的条目 |
| 技能 | `_data/skills.yml` | `zh` / `en` 下的分类和标签 |
| 新增论文 | `_publications/` 下新建 `.md` | 参考已有文件的 frontmatter |
| 新增项目 | `_projects/` 下新建 `.md` | 参考已有文件的 frontmatter |
| 头像 | 替换 `assets/avatar.jpg` | 保持文件名不变 |

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

## 四、部署到 GitHub Pages（详细步骤）

### 4.1 创建 GitHub 仓库

1. 浏览器打开 [github.com](https://github.com)，登录
2. 点右上角 **+** → **New repository**
3. 填写：

| 字段 | 填什么 | 说明 |
|---|---|---|
| Repository name | `你的用户名.github.io` | **一个字都不能错**。这是 GitHub Pages 硬性要求，大小写严格一致 |
| Description | 个人主页 | 可选 |
| Public / Private | **选 Public** | Pages 免费版只支持公开仓库 |

4. **其他选项全部不勾。** 不要勾 "Add a README"、"Add .gitignore"、"Choose a license"。因为我们要从本地 push 上去，勾了会导致冲突
5. 点绿色的 **Create repository**

### 4.2 本地推送代码

打开终端（Windows 用 Git Bash），进入项目文件夹后**逐条**执行：

```bash
# 进入项目文件夹
cd 你的项目路径

# 1. 初始化为 Git 仓库
git init

# 2. 添加所有文件
git add .

# 3. 提交
git commit -m "首次提交：个人主页"

# 4. 主分支命名为 main
git branch -M main

# 5. 关联远程仓库（把下面网址中的"你的用户名"改成你的）
git remote add origin https://github.com/你的用户名/你的用户名.github.io.git

# 6. 推送到 GitHub（会弹浏览器让你授权）
git push -u origin main
```

> 如果第 6 步要求输密码但 GitHub 密码无效：GitHub 从 2021 年起不支持密码登录命令行。需要创建 Personal Access Token：Settings → Developer settings → Personal access tokens → Tokens (classic) → Generate new token，勾选 `repo` 权限，生成后把 token 当作密码输入。

### 4.3 确认部署成功

1. push 完成后等 **1-2 分钟**
2. 浏览器打开 `https://你的用户名.github.io`
3. 看到中文主页 → 成功！
4. 英文版：`https://你的用户名.github.io/index-en.html`

如果显示 404：再等 2 分钟。如果还不行：仓库 Settings → Pages，确认 Branch 选 `main`，目录选 `/ (root)`，点 Save。

### 4.4 GitHub 自动构建

**不需要任何额外操作。** GitHub 检测到 `_config.yml` 后自动用 Jekyll 构建。以后每次改内容只需：

```bash
git add .
git commit -m "更新了xxx内容"
git push
```

约 30-60 秒后网站自动更新。不需要手动点任何按钮。

### 4.5 如果 git push 要求输密码但 GitHub 密码无效

GitHub 从 2021 年起不支持命令行直接使用账号密码。需要创建 Personal Access Token：

1. 打开 GitHub → 右上角头像 → **Settings**
2. 左侧菜单最底部 → **Developer settings**
3. 左侧 **Personal access tokens** → **Tokens (classic)**
4. 点 **Generate new token** → **Generate new token (classic)**
5. Note 随便填（如 "个人主页部署"），勾选 **repo** 权限
6. 拉到底部点 **Generate token**
7. 复制生成的 token（只显示一次，别关页面！）
8. 回到终端，用户名填你的 GitHub 用户名，**密码那一栏粘贴这个 token**

---

## 五、部署到 Gitee Pages（国内访问更快）

### 5.1 与 GitHub Pages 的关键区别

| | GitHub Pages | Gitee Pages |
|---|---|---|
| 自动 Jekyll 构建 | ✅ 支持 | ❌ 不支持 |
| 部署方式 | push 源代码即可 | 需要先在本地 `jekyll build`，然后 push 生成的文件 |
| 免费版更新 | 自动 | 每次 push 后需**手动点"更新"按钮** |
| URL 格式 | `用户名.github.io` | `用户名.gitee.io/仓库名` |
| 自定义域名 | ✅ 免费支持 | ❌ 免费版不支持 |

### 5.2 部署步骤

#### 第一步：本地构建

```bash
cd 你的项目路径
bundle exec jekyll build
```

这会在项目下生成一个 `_site/` 文件夹，里面是完整的静态 HTML 文件。

#### 第二步：创建 Gitee 仓库

1. 打开 [gitee.com](https://gitee.com)，登录
2. 点右上角 **+** → **新建仓库**
3. 仓库名随便填（如 `homepage`），路径会自动生成
4. 选 **公开**
5. **不要勾** "使用 Readme 文件初始化这个仓库"
6. 点 **创建**

#### 第三步：推送构建产物

```bash
# 进入 _site 目录
cd _site

# 初始化并推送
git init
git add .
git commit -m "部署 Gitee Pages"
git remote add origin https://gitee.com/你的Gitee用户名/仓库名.git
git push -u origin master --force
```

> Gitee 默认分支名是 `master`（不是 `main`），注意区别。

#### 第四步：开启 Gitee Pages

1. 进入 Gitee 仓库页面
2. 顶部菜单找到 **服务** → **Gitee Pages**
3. 部署分支选 `master`，部署目录填 `/`（根目录）
4. 点 **启动**
5. **首次使用需要实名认证**（手机号验证，Gitee 强制要求）
6. 部署成功后，页面显示访问地址

#### 第五步：以后更新

```bash
# 1. 在项目根目录重新构建
cd 你的项目路径
bundle exec jekyll build

# 2. 进入 _site 推送
cd _site
git add .
git commit -m "更新"
git push

# 3. ⚠️ 回到 Gitee 网页 → 服务 → Gitee Pages → 点"更新"按钮
```

> **免费版不会自动更新。** 每次 push 之后必须手动去网页点"更新"按钮，否则网站内容不变。这是 Gitee 免费版的限制。

---

## 六、如何撤回访问

1. 用 `index_empty.html` 的内容覆盖 `index.html`（或删除 `_layouts/` 中的内容）
2. Push，GitHub 自动构建
3. 访问者看到"主页暂时关闭"提示页
4. 恢复：从 `backups/` 或 Git 历史恢复 `index.html` + `_layouts/default.html`，重新 push

---

## 七、备份机制

`backups/` 文件夹存放历史版本。每次大改前备份：

```bash
mkdir -p backups/$(date +%Y-%m-%d)-stable
cp -r _layouts _data _config.yml index.html index-en.html style.css script.js backups/$(date +%Y-%m-%d)-stable/
```

---

## 八、常见问题

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
