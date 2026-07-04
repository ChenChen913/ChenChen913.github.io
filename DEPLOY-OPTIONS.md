# 项目部署方案详解

> 本文档列出本项目的四种部署方式，从本地到云端，覆盖所有常见平台。本项目是 Jekyll 静态站点，部署需要 Ruby 3.0+ 和 `Gemfile.lock` 文件（已在仓库中）。

---

## 方案一：本地构建 + 手动部署

**适用场景：** 自己有一台服务器 / VPS / 虚拟机，或部署到内网环境。也适用于静态文件托管服务（阿里云 OSS、腾讯云 COS 等）。

**原理**

Jekyll 将 Markdown + Liquid 模板编译为纯静态 HTML。`bundle exec jekyll build` 后，`_site/` 目录就是最终成品，无任何运行时依赖。

**步骤**

```bash
# 1. 安装 Ruby 3.0+
#    Windows: https://rubyinstaller.org
#    macOS:   brew install ruby
#    Linux:   sudo apt install ruby-full build-essential

# 2. 安装项目依赖
bundle install

# 3. 构建
bundle exec jekyll build

# 4. 部署 _site/ 目录
```

**部署目标选项：**

| 目标 | 方式 | 费用 |
|------|------|------|
| Nginx / Apache | `rsync` 或 FTP 上传 `_site/` 到 `/var/www/html/` | 仅服务器费 |
| 阿里云 OSS | 上传 `_site/` + 开启静态网站托管 | 存储费 + 流量费 |
| 腾讯云 COS | 同上 | 存储费 + 流量费 |
| 任何静态托管 | 上传 `_site/` 即可 | 因服务而异 |

> ⚠️ OSS/COS 方式每次更新后需手动刷新 CDN 缓存，否则用户可能看到旧版本。

**优点**

- 完全自主可控，不依赖第三方平台
- 不需要 GitHub Actions 等 CI/CD
- 纯静态文件，兼容所有 Web 服务器

**缺点**

- 每次更新需手动构建 + 上传
- 需自行处理 HTTPS 证书、域名解析、CDN 刷新

---

## 方案二：Gitee Pages

**适用场景：** 面向国内用户，需要比 GitHub Pages 更快的访问速度，可以接受手动触发更新。

**前提条件**
- Gitee 账号已完成实名认证（中国法律要求）
- 仓库名与 Gitee 用户名一致才能从根路径访问（如 `chenchen913.gitee.io`），否则地址会带仓库名（如 `chenchen913.gitee.io/repo-name`）

**原理**

Gitee Pages 内置 Jekyll 构建引擎，push 源码后手动点击"更新"触发构建和部署。

**步骤**

```bash
# 1. Gitee 创建仓库 → 名称与用户名一致（如 ChenChen913）

# 2. 本地添加 Gitee 远程仓库
git remote add gitee https://gitee.com/ChenChen913/ChenChen913.git

# 3. 推送
git push gitee main

# 4. Gitee 网页端 → 仓库 → 服务 → Gitee Pages → 启用
#    分支：main
#    部署目录：不填（默认根目录）
#    点击"更新"按钮
```

**后续更新：** 每次 `git push gitee main` 后必须手动点击"更新"才会重新部署。

**配置修改**

`_config.yml` 无需修改（`url: ""`, `baseurl: ""` 已适配根路径）。

PDF.js CDN 建议换成国内源：

```diff
- https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js
+ https://cdn.bootcdn.net/ajax/libs/pdf.js/3.11.174/pdf.min.js
```

> ⚠️ 同时需要替换 `pdf.worker.min.js` 的 URL。

**优点**

- 国内访问速度快
- 免费，支持 Jekyll 自动构建

**缺点**

- 需要实名认证
- **每次 push 后必须手动点"更新"**（免费版无自动部署）
- 偶尔因内容审核暂停
- 免费版不支持自定义域名
- 免费版存储 1 GB，带宽有限

---

## 方案三：Netlify / Vercel / Cloudflare Pages

**适用场景：** 想要全自动部署 + 全球 CDN，push 即上线，无需任何手动操作。

三个平台的操作流程几乎相同：注册 → 授权 GitHub → 选仓库 → 填构建命令 → 自动部署。以下分别说明各平台的细节和差异。

> **共同前提：** 仓库中必须有 `Gemfile.lock`（用于锁定 Ruby 依赖版本）。本项目已包含此文件。

---

### 3.1 Netlify

**注册：** [netlify.com](https://netlify.com) → Sign up with GitHub

**部署步骤：**
1. Import from Git → 选择仓库
2. 构建配置：
   - Build command: `bundle exec jekyll build`
   - Publish directory: `_site`
3. 点击 Deploy site

**或使用配置文件（推荐）：** 在项目根目录创建 `netlify.toml`：

```toml
[build]
  command = "bundle exec jekyll build"
  publish = "_site"

[build.environment]
  RUBY_VERSION = "3.3"
```

有了这个文件，Netlify 导入时无需手动填任何配置。

| 免费额度 | 数值 |
|----------|------|
| 月带宽 | 100 GB |
| 月构建时长 | 300 分钟 |
| 站点数量 | 不限 |
| HTTPS | 自动 Let's Encrypt |
| 自定义域名 | 支持（在 Domain settings 中添加） |
| 预览部署 | 每个 PR 自动生成临时 `deploy-preview-xxx.netlify.app` 链接 |

---

### 3.2 Vercel

**注册：** [vercel.com](https://vercel.com) → Continue with GitHub

**部署步骤：**
1. Import Git Repository → 选择仓库
2. Vercel 自动检测到 Jekyll 项目，构建命令和输出目录自动填充
3. 点击 Deploy

> Vercel 对 Jekyll 有原生支持，通常不需要手动填配置。

| 免费额度 | 数值 |
|----------|------|
| 月带宽 | 100 GB |
| 月构建时长 | 6000 分钟（比 Netlify 多 20 倍） |
| 站点数量 | 不限 |
| HTTPS | 自动 |
| 自定义域名 | 支持（Settings → Domains） |
| 预览部署 | 每个 PR 自动生成 `xxx-git-xxx.vercel.app` 链接 |

---

### 3.3 Cloudflare Pages（推荐）

**为什么推荐：** 免费无限带宽 + 330+ 全球节点（含香港/东京）→ 国内访问速度免费方案中最快。

**注册：** [cloudflare.com](https://cloudflare.com) → 注册 → 左侧菜单 Pages

> ⚠️ 首次使用需要绑信用卡验证身份（不扣费，所有 Cloudflare 用户都要）。

**部署步骤：**
1. Pages → Connect to Git → 授权 GitHub → 选择仓库
2. 构建配置：
   - Build command: `bundle exec jekyll build`
   - Output directory: `_site`
3. 环境变量（可选，用于指定 Ruby 版本）：
   ```
   RUBY_VERSION = 3.3
   ```
4. 点击 Save and Deploy

**随后每次 `git push origin main`，Cloudflare Pages 自动检出并部署，30 秒内上线。**

| 免费额度 | 数值 |
|----------|------|
| 月带宽 | **无限** |
| 月构建次数 | 500 次 |
| 全球节点 | 330+（含香港、东京、新加坡） |
| HTTPS | 自动 |
| 自定义域名 | 支持（需域名 DNS 托管在 Cloudflare） |
| 预览部署 | 每个分支自动生成 `xxx.pages.dev` 预览链接 |
| 期限 | 永久，非试用 |

**附加优势：**
- PDF.js CDN（`cdnjs.cloudflare.com`）本身就是 Cloudflare 的，同一网络内加载极快
- 可以配合 Cloudflare DNS 做域名解析，全站加速一体化
- 免费 Workers 可以做简单的后端逻辑（如表单提交）

---

## 方案四：多平台同时部署

**适用场景：** GitHub 做主站，Gitee 做国内镜像，Cloudflare Pages 做加速——同时部署到多个平台，互不冲突，哪条线路快用户就自动走哪条。

**架构示意：**

```
本地写代码
    │
    git push origin main (一次推送)
    │
    ├── GitHub Actions → GitHub Pages (chenchen913.github.io)
    ├── Cloudflare Pages 自动检出 → xxx.pages.dev
    └── 手动 git push gitee → Gitee Pages (chenchen913.gitee.io)
```

**配置多 remote：**

```bash
# 查看当前 remote
git remote -v

# 添加 Gitee（如果还没有）
git remote add gitee https://gitee.com/ChenChen913/ChenChen913.git

# 分别推送（推荐：两个平台分开管理，清晰明了）
git push origin main    # 触发 GitHub Pages + Cloudflare Pages
git push gitee main     # 手动触发 Gitee Pages 更新
```

> ⚠️ 不推荐 `git remote set-url --add` 把多个地址绑在同一个 remote 上——push 时如果某个平台失败会部分成功，且看不出哪个平台出了问题。

**Gitee 镜像同步（可选）：** 在 Gitee 仓库设置中开启"从 GitHub 同步"，这样每次 GitHub 更新后 Gitee 自动拉取，省去手动 `git push gitee`。但仍然需要手动点 Gitee Pages 的"更新"按钮。

---

## 总结对比

| 平台 | 自动部署 | 国内速度 | 免费带宽 | 自定义域名 | 认证要求 | 构建配额 |
|------|:--:|:--:|:--:|:--:|:--:|:--:|
| **GitHub Pages** | ✅ | ❌ 慢 | 100 GB/月 | ✅ | 无 | 公开仓库不限 |
| **Gitee Pages** | ❌ 手动 | ✅ 快 | 1 GB 存储 | ❌ 免费版 | 实名认证 | 不限 |
| **Netlify** | ✅ | ⚠️ 一般 | 100 GB/月 | ✅ | 无 | 300 分钟/月 |
| **Vercel** | ✅ | ⚠️ 一般 | 100 GB/月 | ✅ | 无 | 6000 分钟/月 |
| **Cloudflare Pages** | ✅ | ✅ 快 | **无限** | ✅ | 绑卡验证 | 500 次/月 |

---

## 推荐组合

| 用户群体 | 推荐方案 |
|----------|----------|
| 只用国内 | Gitee Pages |
| 只用海外 | GitHub Pages（已配好） |
| **国内外兼顾（推荐）** | **GitHub Pages + Cloudflare Pages 双线** |
| 追求极致 | GitHub + CF + Gitee 三线 + 自定义域名智能分流 |

---

> 最后更新：2026-07-04
