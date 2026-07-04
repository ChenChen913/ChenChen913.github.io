# Ruby 与 Jekyll 简介

> 本文档面向不熟悉 Ruby 和 Jekyll 的读者，解释它们是什么、为什么要用、以及在本项目中扮演什么角色。

---

## Ruby 是什么

Ruby 是一门通用的动态编程语言，由日本的松本行弘（Matz）在 1995 年创造。它的设计哲学是"程序员的快乐"——语法自然、读起来像英文。

**在本项目中的角色：** Ruby 本身不需要学。你只需要安装它，因为 Jekyll 是用 Ruby 写的。整个项目中没有一行 Ruby 代码是手写的——所有 Ruby 工作都由 `bundle` 和 `jekyll` 两个命令行工具完成。

```bash
# 你只需要这两条命令，不需要写 Ruby 代码
bundle install          # 安装依赖（类似 npm install）
bundle exec jekyll build  # 构建网站
```

---

## Jekyll 是什么

Jekyll 是一个**静态站点生成器**（Static Site Generator）。它做一件事：把 Markdown 文件 + HTML 模板编译成一个完整的静态网站。

### 静态站点 vs 动态站点

| | 动态站点（WordPress 等） | 静态站点（Jekyll 等） |
|------|------|------|
| 服务器需要 | PHP / Node.js / 数据库 | **不需要**，纯 HTML 文件 |
| 每次访问 | 查询数据库 → 组装页面 | 直接返回已有的 HTML |
| 速度 | 较慢 | 极快 |
| 安全 | 有注入/数据库攻击风险 | **几乎零攻击面** |
| 托管 | 需要服务器/VPS | 丢到任何地方都能跑 |
| 费用 | 月付主机费 | **免费**（GitHub Pages 等） |

### Jekyll 的工作流程

```
你写的文件                      Jekyll 做的事                   输出
─────────────────────────────────────────────────────────────────
_projects/campus-qa-bot.md  →  读取 YAML 头部 + Markdown
_layouts/detail.html         →  Liquid 模板渲染               →  projects/campus-qa-bot/index.html
_data/personal.yml           →  数据注入模板
_config.yml                  →  站点配置
assets/                      →  原样复制                       →  assets/
```

**一句话总结：** Jekyll 把分散的 Markdown 文件和数据文件拼成一个完整的网站，输出纯静态 HTML。

---

## 本项目为什么用 Jekyll

| 原因 | 说明 |
|------|------|
| **免费托管** | 静态 HTML 可以免费部署到 GitHub Pages、Cloudflare Pages 等 |
| **内容与样式分离** | 个人资料在 `_data/*.yml`，项目经历在 `_projects/*.md`，改内容不用动 HTML |
| **中英文双版本** | 一份模板 + 两套数据 = 自动生成中英文页面，无需维护两套 HTML |
| **Markdown 写内容** | 项目详情页用 Markdown 写，比手写 HTML 快得多 |
| **零数据库** | 没有 WordPress 的安全漏洞、版本升级、插件兼容性问题 |
| **Git 版本控制** | 所有内容都是文本文件，每次修改都有记录 |

---

## 常用命令速查

```bash
# 安装依赖（首次运行或 Gemfile 有变化时执行）
bundle install

# 本地预览（启动开发服务器，浏览器打开 http://localhost:4000）
bundle exec jekyll serve

# 构建站点（生成 _site/ 目录）
bundle exec jekyll build

# 构建 + 草稿预览
bundle exec jekyll build --drafts
```

---

## 项目目录结构

```
个人主页2/
├── _config.yml          # Jekyll 配置文件（站点名、Markdown 引擎等）
├── Gemfile              # Ruby 依赖声明（要装哪些 gem）
├── Gemfile.lock         # 依赖版本锁定（确保所有人构建结果一致）
├── index.html           # 中文版主页
├── en.html              # 英文版主页
├── _layouts/            # 页面模板（default.html 主页 / detail.html 详情页）
├── _data/               # 数据文件（个人信息、导航、技能等，YAML 格式）
├── _projects/           # 项目经历（Markdown，每篇一个文件）
├── _publications/       # 论文发表（同上）
├── assets/              # 静态资源（图片、PDF、CSS、JS、PDF 查看器）
│   ├── avatar.jpg
│   ├── pdf-viewer.html
│   └── projects/
├── style.css            # 全局样式
├── script.js            # 全局脚本（导航、主题、返回顶部等）
├── .github/workflows/   # GitHub Actions 自动部署配置
├── TROUBLESHOOTING.md   # 踩坑记录
├── DEPLOY.md            # 部署说明
├── DEPLOY-OPTIONS.md    # 五种部署方案对比
└── README.md            # 项目说明
```

---

## 如何修改网站内容

你不需要懂 Ruby 或 Jekyll。修改内容只需编辑对应文件：

| 要改什么 | 编辑哪个文件 |
|----------|-------------|
| 你的姓名、简介 | `_data/personal.yml` |
| 教育背景 | `_data/education.yml` |
| 工作经历 | `_data/experience.yml` |
| 技能标签 | `_data/skills.yml` |
| 联系方式 | `_data/social.yml` |
| 导航菜单名称 | `_data/navigation.yml` |
| 新增项目经历 | `_projects/` 下新建 `.md` 文件 |
| 新增论文 | `_publications/` 下新建 `.md` 文件 |
| 修改颜色/字体 | `style.css` |
| 修改交互逻辑 | `script.js` |

所有数据文件都支持中英文双版本，格式一目了然，不需要编程知识。

---

## 常见问题

**Q: 为什么不用 WordPress / Hexo / Hugo？**

A: WordPress 需要 PHP + 数据库，有安全风险和维护成本。Hexo 和 Hugo 也很好，但 Jekyll 是 GitHub Pages 的原生支持框架，与 GitHub 集成最紧密。选择工具没有绝对的对错，Jekyll 对这个项目来说够用且免费。

**Q: 我需要学 Ruby 吗？**

A: 不需要。你只需要两行命令：`bundle install` 和 `bundle exec jekyll build`。内容全部用 Markdown 和 YAML 写，零编程。

**Q: 本地没装 Ruby 怎么办？**

A: GitHub Actions 在云端自动构建，你不需要本地构建。写完内容直接 `git push`，GitHub 自动帮你编译部署。

**Q: `bundle exec` 是什么意思？**

A: `bundle exec` 的作用是"在当前项目的依赖环境中执行后面的命令"。它确保用的是本项目 `Gemfile.lock` 锁定的 Jekyll 版本，而不是系统全局安装的版本。类似于 Python 的虚拟环境或 Node.js 的 `npx`。

---

> 最后更新：2026-07-04
