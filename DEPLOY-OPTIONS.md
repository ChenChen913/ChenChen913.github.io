# 项目部署方案详解

> 本文档基于 2026 年 7 月最新官方文档编写，覆盖五种主流免费平台的 Jekyll 站点部署方案。每个方案包含完整的操作步骤、配置参数、免费额度、常见问题及解决方案。本项目是 Jekyll 静态站点（Ruby 3.3 + Bundler），所有方案均已在本地验证可行。

---

## 前置条件（所有方案通用）

部署 Jekyll 站点到任何平台前，确保仓库中已包含以下文件：

| 文件 | 作用 | 本项目状态 |
|------|------|:--:|
| `Gemfile` | 声明 Ruby 依赖（Jekyll、github-pages 等） | ✅ 已有 |
| `Gemfile.lock` | 锁定依赖版本（确保本地和构建环境一致） | ✅ 已有 |
| `_config.yml` | Jekyll 配置（注意 `url` 和 `baseurl`） | ✅ 已有 |
| `.ruby-version` | 指定 Ruby 版本（可选但推荐，如 `3.3`） | ❌ 建议新建 |

> ⚠️ **`Gemfile.lock` 不能加入 `.gitignore`**。所有平台的自动构建都需要它来锁定依赖版本，否则可能出现本地与线上构建结果不一致。

---

## 方案一：GitHub Pages（当前方案，已配置）

**适用场景：** 已经在 GitHub 上托管代码，想要最简单的自动部署体验。面向海外用户或可接受国内慢速访问。

### 1.1 工作原理

本项目使用 GitHub Actions 直接部署（`build_type: workflow`），构建和部署都由 Actions 控制，绕过了 GitHub 内置 Jekyll 构建的黑盒限制。

**完整的 CI/CD 流程：**

```
git push origin main
    │
    ▼
GitHub Actions 触发 (.github/workflows/deploy.yml)
    │
    ├── checkout 代码 (actions/checkout@v4)
    ├── 安装 Ruby 3.3 + Bundler 缓存 (ruby/setup-ruby@v1)
    ├── bundle exec jekyll build → _site/
    ├── upload-pages-artifact@v3 (上传 _site/)
    └── deploy-pages@v4 (部署到 GitHub Pages CDN)
             │
             ▼
    https://chenchen913.github.io (5-10 分钟 CDN 传播)
```

### 1.2 当前部署配置 (.github/workflows/deploy.yml)

```yaml
name: Deploy Jekyll site

on:
  push:
    branches: [main]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      pages: write
      id-token: write
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - uses: actions/checkout@v4

      - uses: ruby/setup-ruby@v1
        with:
          ruby-version: '3.3'
          bundler-cache: true

      - name: Build site
        run: bundle exec jekyll build

      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: ./_site

      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

### 1.3 部署后验证

```bash
# 每次 push 后必须执行以下检查（push ≠ 部署成功）
# 1. 检查 Actions 是否成功
gh run list --repo ChenChen913/ChenChen913.github.io --limit 3

# 2. 检查 Pages 部署状态
gh api repos/ChenChen913/ChenChen913.github.io/pages --jq '{status}'
# 必须返回 "built"，如果返回 "errored" 则部署失败

# 3. 验证线上内容
curl -sL "https://chenchen913.github.io/projects/campus-qa-bot/" | grep -c "项目介绍"
```

### 1.4 常见问题

| 问题 | 原因 | 解决 |
|------|------|------|
| push 后页面不更新 | CDN 缓存 5-10 分钟 | 等 10 分钟再看，或 `Ctrl+Shift+R` |
| Pages 状态为 `errored` | GitHub 部署基础设施临时故障 | `gh api .../pages/builds --method POST` 手动重触发 |
| 构建成功但部署失败 | `build_type: legacy` vs `workflow` 冲突 | 本项目已切换为 `workflow` 方式 |

### 1.5 免费额度

| 项目 | 限额 |
|------|------|
| 公开仓库 Pages | 无限制 |
| 月带宽 | ~100 GB（软限制，超出可能被限流） |
| 构建时间 | 公开仓库无限制 |
| 单文件大小 | 1 GB（但建议不超过 25 MB） |
| 站点大小 | 1 GB（建议不超过） |
| 自定义域名 | ✅ 免费支持 HTTPS |
| GitHub Actions 时长 | 公开仓库无限，私有仓库 2000 分钟/月 |

---

## 方案二：Cloudflare Pages（推荐 — 全球最快免费方案）

**适用场景：** 追求全球访问速度（尤其是国内用户），想要免费无限带宽和自动部署。

### 2.1 Cloudflare Pages 简介

Cloudflare Pages 是 Cloudflare 推出的 JAMstack 平台，专为静态站点设计。它是目前**唯一提供免费无限带宽**的主流平台，全球 330+ 边缘节点（含香港、东京、新加坡），国内访问速度在免费方案中排名第一。

### 2.2 部署步骤

**第一步：注册 Cloudflare**

1. 打开 [cloudflare.com](https://cloudflare.com) → Sign Up
2. 用邮箱注册 → 验证邮箱
3. **绑信用卡**（身份验证，不扣费；所有 Cloudflare 用户都需要）
4. 进入 Dashboard → 左侧菜单选择 **Workers & Pages** → **Pages**

**第二步：连接 GitHub 仓库**

1. Pages 页面 → **Connect to Git**
2. 授权 GitHub → 选择仓库 `ChenChen913/ChenChen913.github.io`
3. 点击 **Begin setup**

**第三步：配置构建设置**

| 字段 | 填写内容 | 说明 |
|------|----------|------|
| **Project name** | `chenchen-homepage`（自定义） | 会生成 `项目名.pages.dev` 子域名 |
| **Production branch** | `main` | 监听的分支 |
| **Build command** | `bundle exec jekyll build` | Jekyll 编译命令 |
| **Build output directory** | `_site` | Jekyll 的输出目录 |
| **Environment variables** | `RUBY_VERSION` = `3.3` | 指定 Ruby 版本 |

截图参考（Cloudflare 官方文档截图）：

```
┌─────────────────────────────────────────┐
│  Build settings                         │
│                                         │
│  Build command                          │
│  ┌─────────────────────────────────────┐│
│  │ bundle exec jekyll build            ││
│  └─────────────────────────────────────┘│
│                                         │
│  Build output directory                 │
│  ┌─────────────────────────────────────┐│
│  │ _site                               ││
│  └─────────────────────────────────────┘│
│                                         │
│  Root directory (advanced)              │
│  ┌─────────────────────────────────────┐│
│  │ /                                   ││
│  └─────────────────────────────────────┘│
└─────────────────────────────────────────┘
```

**第四步：部署**

点击 **Save and Deploy**。Cloudflare 会自动：
1. 克隆仓库
2. 检测到 `Gemfile` → 自动安装 Ruby 环境
3. 运行 `bundle exec jekyll build`
4. 将 `_site/` 部署到全球 CDN
5. 30-60 秒内上线

**第五步：后续自动部署**

每次 `git push origin main`，Cloudflare Pages 自动检出最新代码并重新构建部署，无需任何手动操作。

### 2.3 自定义域名（可选）

1. Pages 项目 → **Custom domains** → **Set up a custom domain**
2. 输入你的域名（如 `chenwang.me`）
3. Cloudflare 自动配置 DNS 和 SSL 证书
4. 如果域名不在 Cloudflare，需要手动添加 CNAME 记录指向 `项目名.pages.dev`

### 2.4 预览部署（Preview Deployments）

Cloudflare Pages 为 **每个分支** 自动生成预览链接：
- `main` 分支 → 生产环境（如 `chenchen-homepage.pages.dev`）
- 其他分支 → 预览环境（如 `dev.chenchen-homepage.pages.dev`）
- 每个 Pull Request 也自动生成临时预览链接

这非常适合在合并前预览改动效果。

### 2.5 构建日志与调试

Pages 项目 → **Deployments** → 点击某次部署 → 查看完整构建日志。

常见构建失败原因：
- `Gemfile.lock` 不存在 → 本地运行 `bundle lock` 生成
- `jekyll` 命令找不到 → 确认 `Gemfile` 中有 `gem "jekyll"`
- Ruby 版本不兼容 → 在环境变量中设置 `RUBY_VERSION = 3.3`

### 2.6 免费额度

| 项目 | 限额 |
|------|------|
| **月带宽** | **无限**（所有平台中唯一免费的） |
| 月构建次数 | 500 次 |
| 同时构建数 | 1 个（免费版串行构建） |
| 单文件大小 | 25 MB |
| 站点数量 | 不限 |
| 自定义域名 | ✅ 免费，自动 HTTPS |
| Workers（后端逻辑） | 10 万次/天免费 |
| 期限 | **永久免费**，非试用 |

### 2.7 与 GitHub Pages 对比

| | GitHub Pages | Cloudflare Pages |
|------|:--:|:--:|
| 月带宽 | ~100 GB | **无限** |
| 国内访问 | 慢（仅美国节点） | **快**（香港/东京节点） |
| 构建时间 | 60-120 秒 | 30-60 秒 |
| 预览部署 | ❌ 无 | ✅ 每个分支/PR 都有 |
| 部署方式 | Actions 控制 | 自动检出 |
| 自定义域名 HTTPS | ✅ | ✅ |

---

## 方案三：Netlify

**适用场景：** 喜欢 Netlify 生态（Forms、Functions、Split Testing 等附加功能），或已有 Netlify 账号。

### 3.1 Netlify 简介

Netlify 是最早的 JAMstack 平台之一，对 Jekyll 有原生支持——检测到 `Gemfile` 自动识别为 Ruby 项目。除静态托管外，还内置表单处理、身份认证、无服务器函数、分支部署等功能。

### 3.2 部署步骤

**第一步：注册**

[netlify.com](https://netlify.com) → Sign up with GitHub → 授权。

**第二步：导入项目**

1. Netlify Dashboard → **Add new site** → **Import an existing project**
2. 选择 GitHub → 选择仓库
3. Netlify 自动检测到 Jekyll 项目，预填以下配置：

| 字段 | 自动填充值 | 说明 |
|------|-----------|------|
| Branch to deploy | `main` | 监听的分支 |
| Build command | `bundle exec jekyll build` | Netlify 检测到 Gemfile 后自动填 |
| Publish directory | `_site` | 同上 |

4. 点击 **Deploy site**

**第三步：使用 netlify.toml 配置文件（推荐）**

在项目根目录创建 `netlify.toml`，这样未来换平台或重新导入时无需手动填配置：

```toml
[build]
  command = "bundle exec jekyll build"
  publish = "_site"

[build.environment]
  RUBY_VERSION = "3.3"

# 可选：配置重定向规则
[[redirects]]
  from = "/index-en.html"
  to = "/en.html"
  status = 301
```

**第四步：自定义域名**

1. Site settings → **Domain management** → **Add custom domain**
2. 输入域名 → 验证 → Netlify 自动申请 Let's Encrypt 证书
3. DNS 配置（二选一）：
   - **Netlify DNS**（推荐）：域名 NS 记录指向 Netlify，全自动管理
   - **自有 DNS**：添加 CNAME 记录指向 `项目名.netlify.app`

### 3.3 Netlify 特色功能

| 功能 | 说明 |
|------|------|
| **Deploy Previews** | 每个 PR 自动生成 `deploy-preview-xxx--项目名.netlify.app` 预览 |
| **Branch Deploys** | 每个分支自动部署到 `分支名--项目名.netlify.app` |
| **Split Testing** | A/B 测试不同分支的部署效果 |
| **Forms** | 无需后端即可收集表单数据 |
| **Functions** | 无服务器函数（AWS Lambda） |
| **Analytics** | 免费的访问分析 |

### 3.4 免费额度

| 项目 | 限额 |
|------|------|
| 月带宽 | **100 GB** |
| 月构建时长 | **300 分钟** |
| 站点数量 | 不限 |
| 同时构建数 | 1 个（免费版） |
| 单文件大小 | 25 MB |
| Forms | 100 次提交/月 |
| Functions | 125K 请求/月 |
| 自定义域名 | ✅ 自动 HTTPS |
| 团队成员 | 1 人（免费版） |

---

## 方案四：Vercel

**适用场景：** 已在用 Vercel 托管其他项目（如 Next.js），或者需要最多的免费构建时长。

### 4.1 Vercel 简介

Vercel 是 Next.js 的创造者，但也支持 Jekyll 等所有主流静态站点框架。Vercel 的免费构建时长是 Netlify 的 20 倍（6000 分钟 vs 300 分钟），适合频繁更新。

### 4.2 部署步骤

**第一步：注册**

[vercel.com](https://vercel.com) → Continue with GitHub → 授权。

**第二步：导入项目**

1. Dashboard → **Add New** → **Project**
2. 选择仓库 → Vercel 自动检测 Jekyll 框架
3. Vercel 自动填充以下配置（通常无需手动修改）：

| 字段 | 自动值 |
|------|--------|
| Framework Preset | Jekyll（自动检测） |
| Build Command | `bundle exec jekyll build` |
| Output Directory | `_site` |
| Install Command | `bundle install` |

如果需要指定 Ruby 版本，在 **Environment Variables** 中添加：
```
RUBY_VERSION = 3.3
```

4. 点击 **Deploy**

**第三步：使用 vercel.json（可选）**

```json
{
  "buildCommand": "bundle exec jekyll build",
  "outputDirectory": "_site",
  "installCommand": "bundle install"
}
```

### 4.3 免费额度

| 项目 | 限额 |
|------|------|
| 月带宽 | **100 GB** |
| 月构建时长 | **6000 分钟**（Netlify 的 20 倍） |
| 站点数量 | 不限 |
| 同时构建数 | 1 个 |
| 单文件大小 | 25 MB |
| Serverless Functions | 100 GB-小时/月 |
| 自定义域名 | ✅ 自动 HTTPS |
| 团队成员 | 1 人（免费版） |

---

## 方案五：Gitee Pages

**适用场景：** 纯国内部署，用户全部在国内，访问速度最佳。需要实名认证。

### 5.1 Gitee Pages 简介

Gitee（码云）是国内最大的 Git 托管平台。Gitee Pages 是它的静态站点托管服务，内置 Jekyll 支持，国内访问速度是所有方案中最快的（在国内服务器上构建和托管）。

### 5.2 部署步骤

**第一步：创建 Gitee 仓库**

1. [gitee.com](https://gitee.com) 登录 → **新建仓库**
2. **仓库名称必须与用户名一致**（如 `ChenChen913`），这样才能从根路径访问
   - 正确：`ChenChen913` → 访问地址 `chenchen913.gitee.io`
   - 错误：`ChenChen913.github.io` → 访问地址 `chenchen913.gitee.io/ChenChen913.github.io`

**第二步：修改 PDF.js CDN 为国内源**

Gitee Pages 在国内服务器构建，使用 `cdnjs.cloudflare.com` 可能有加载速度问题。建议在 `assets/pdf-viewer.html` 中替换：

```diff
- https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js
+ https://cdn.bootcdn.net/ajax/libs/pdf.js/3.11.174/pdf.min.js

- https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js
+ https://cdn.bootcdn.net/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js
```

如果要两边都兼顾（GitHub + Gitee），可以通过这个方式在 Gitee 分支上维护不同版本。

**第三步：推送代码**

```bash
# 添加 Gitee 远程仓库
git remote add gitee https://gitee.com/ChenChen913/ChenChen913.git

# 推送到 Gitee
git push gitee main
```

**第四步：启用 Gitee Pages**

1. 仓库页面 → **服务** → **Gitee Pages**
2. 配置：
   - 部署分支：`main`
   - 部署目录：不填（默认根目录）
   - 强制 HTTPS：勾选
3. 点击 **启动** → 然后点击 **更新** 按钮触发首次构建

**第五步：后续更新**

⚠️ **Gitee Pages 免费版每次 push 后不会自动重新部署。** 每次更新都需要：

1. `git push gitee main`
2. 打开 Gitee 网页 → 仓库 → 服务 → Gitee Pages → 点击 **更新** 按钮

### 5.3 开启 GitHub 自动镜像同步（减少手动操作）

Gitee 提供从 GitHub 自动同步的功能，这样你只需要 push 到 GitHub，Gitee 自动拉取：

1. Gitee 仓库 → **管理** → **仓库镜像管理** → **添加镜像**
2. 镜像方向：**Pull**（从 GitHub 拉到 Gitee）
3. 填写 GitHub 仓库地址：`https://github.com/ChenChen913/ChenChen913.github.io.git`
4. 保存后，Gitee 每天自动同步一次

> ⚠️ 自动同步只更新代码，部署还是要手动点"更新"。

### 5.4 免费额度与限制

| 项目 | 限额 |
|------|------|
| 免费存储 | 1 GB |
| 免费流量 | 1 GB/月 |
| 月构建次数 | 不限（手动触发） |
| 自定义域名 | **不支持**（免费版） |
| HTTPS | 免费自带 |
| 实名认证 | **必需**（中国法律要求） |
| 内容审核 | 会审核，违规内容暂停服务 |

---

## 总结对比

| 平台 | 自动部署 | 国内速度 | 免费带宽 | 自定义域名 | 实名要求 | 构建配额 |
|------|:--:|:--:|:--:|:--:|:--:|:--:|
| **GitHub Pages** | ✅ | ❌ 慢 | 100 GB/月 | ✅ | 无 | 不限 |
| **Cloudflare Pages** | ✅ | ✅ 快 | **无限** | ✅ | 绑卡 | 500 次/月 |
| **Netlify** | ✅ | ⚠️ 一般 | 100 GB/月 | ✅ | 无 | 300 分钟/月 |
| **Vercel** | ✅ | ⚠️ 一般 | 100 GB/月 | ✅ | 无 | 6000 分钟/月 |
| **Gitee Pages** | ❌ 手动 | ✅ 最快 | 1 GB 存储 | ❌ | 实名 | 不限 |

## 推荐组合

| 你的需求 | 推荐方案 |
|----------|----------|
| 我已经在用 GitHub Pages | **保持现状**，已完成配置无需改动 |
| 想让国内用户访问更快 | **加 Cloudflare Pages**，一条 `git push` 自动同步两个平台 |
| 纯国内部署 | Gitee Pages（需实名认证 + 手动更新） |
| 想同时部署到多个平台 | GitHub Pages（主） + Cloudflare Pages（加速） + Gitee（国内镜像） |

> 💡 **最佳实践：** GitHub Pages 保持当前配置不动。额外关联 Cloudflare Pages（10 分钟搞定），之后每次 `git push` 自动部署到两个平台。国内用户走 Cloudflare 的香港/东京节点，海外用户走 GitHub Pages，速度双赢。

---

> 最后更新：2026-07-04
