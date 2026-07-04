# 项目部署方案详解

> 本文档列出本项目的四种部署方式，从最简单到最适合国内访问，覆盖所有常见托管平台。

---

## 方案一：本地构建 + 手动部署

适用场景：自己有一台服务器 / 虚拟机 / VPS，或需要部署到内网环境。

**原理**

Jekyll 是一个静态站点生成器。运行 `bundle exec jekyll build` 后，`_site/` 目录下就是纯 HTML/CSS/JS 文件，没有任何 Ruby 或数据库依赖。这个目录可以丢到任何 Web 服务器上直接运行。

**步骤**

```bash
# 1. 安装 Ruby + Bundler（如已安装可跳过）
#    Windows: 下载 RubyInstaller
#    macOS:   brew install ruby
#    Linux:   sudo apt install ruby-full build-essential

# 2. 安装依赖
bundle install

# 3. 构建站点
bundle exec jekyll build

# 4. 把 _site/ 目录上传到服务器
#    - Nginx: 复制到 /var/www/html/
#    - Apache: 复制到 /var/www/html/ 或 htdocs/
#    - 任何静态文件托管服务（如阿里云 OSS、腾讯云 COS）都可以
```

**优点**

- 不依赖任何第三方平台，完全自主可控
- 不需要 GitHub Actions、Pages 等任何 CI/CD 服务
- 产出的是纯静态文件，兼容性最好

**缺点**

- 每次更新都要手动构建 + 手动上传
- 需要自己搞定服务器、域名、HTTPS 证书

---

## 方案二：Gitee Pages

适用场景：面向国内用户，希望比 GitHub Pages 更快的访问速度，且不介意手动触发更新。

**原理**

Gitee Pages 内置 Jekyll 构建引擎。push 源码到指定分支后，在网页端点击"更新"按钮触发构建和部署。类似于 GitHub Pages 的 legacy 模式。

**步骤**

```bash
# 1. Gitee 上创建仓库，名称必须与 Gitee 用户名一致
#    例如：https://gitee.com/ChenChen913/ChenChen913

# 2. 添加 Gitee 远程仓库
git remote add gitee https://gitee.com/ChenChen913/ChenChen913.git

# 3. 推送代码
git push gitee main

# 4. 仓库设置 → Gitee Pages → 启用
#    选择部署分支：main
#    点击"更新"按钮触发首次部署

# 5. 之后每次 push 后，需手动点击"更新"
```

**优点**

- 国内访问速度远优于 GitHub Pages
- 免费
- 支持 Jekyll 自动构建

**缺点**

- **需要实名认证**（中国法律要求）
- 每次 push 后要手动点"更新"按钮，不是全自动
- 偶尔因内容审核暂停服务
- 免费版不支持自定义域名

**配置修改**

`_config.yml` 无需修改（`url: ""` 和 `baseurl: ""` 已适配根路径）。

PDF.js CDN 建议换成国内源以提升加载速度：

```diff
- https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js
+ https://cdn.bootcdn.net/ajax/libs/pdf.js/3.11.174/pdf.min.js
```

---

## 方案三：Netlify / Vercel / Cloudflare Pages

适用场景：想要全自动部署 + 全球 CDN + 比 GitHub Pages 更快的体验。

### 3.1 Netlify

```bash
# 1. netlify.com 注册 → 用 GitHub 登录授权
# 2. 选择仓库 → 构建配置：
#    构建命令：bundle exec jekyll build
#    发布目录：_site
# 3. 点 Deploy，之后每次 git push 自动部署
```

| 免费额度 | 说明 |
|----------|------|
| 月带宽 | 100 GB |
| 月构建 | 300 分钟 |
| 站点数量 | 不限 |
| HTTPS | 自动 Let's Encrypt |
| 自定义域名 | 支持 |

### 3.2 Vercel

```bash
# 1. vercel.com 注册 → 用 GitHub 登录
# 2. 导入仓库，自动识别 Jekyll
# 3. 无需手动填构建命令，Vercel 自动检测
```

| 免费额度 | 说明 |
|----------|------|
| 月带宽 | 100 GB |
| 月构建 | 6000 分钟 |
| HTTPS | 自动 |
| 自定义域名 | 支持 |

### 3.3 Cloudflare Pages（推荐）

```bash
# 1. cloudflare.com 注册 → Pages → 授权 GitHub
# 2. 选择仓库 → 构建配置：
#    构建命令：bundle exec jekyll build
#    输出目录：_site
# 3. 点"保存并部署"，之后推送即自动部署
```

| 免费额度 | 说明 |
|----------|------|
| 月带宽 | **无限** |
| 月构建 | 500 次 |
| 全球节点 | 330+（含香港/东京） |
| HTTPS | 自动 |
| 自定义域名 | 支持 |
| 期限 | 永久，非试用 |

**为什么推荐 Cloudflare Pages：**
- 免费无限带宽，GitHub Pages 只有 100 GB 软限制
- 国内访问速度四者中最快（有香港和东京节点）
- PDF.js CDN（`cdnjs.cloudflare.com`）就是 Cloudflare 自家的，在 CF 上访问更快

---

## 方案四：多平台同时部署

可以把所有平台都配上，互不冲突。以 GitHub 为主，Gitee 和 Cloudflare 为辅：

```
本地写代码
    │
    ├── git push origin main (GitHub)
    │       ├── GitHub Actions → GitHub Pages (chenchen913.github.io)
    │       └── Cloudflare Pages 自动检出 → xxx.pages.dev
    │
    └── git push gitee main (Gitee)
            └── 手动点"更新" → Gitee Pages (chenchen913.gitee.io)
```

**多 remote 配置：**

```bash
# 添加所有远程仓库
git remote add origin  https://github.com/ChenChen913/ChenChen913.github.io.git
git remote add gitee   https://gitee.com/ChenChen913/ChenChen913.git

# 分别推送
git push origin main   # GitHub + Cloudflare 自动部署
git push gitee main    # Gitee 需手动触发
```

**统一推送（可选）：**

```bash
git remote set-url --add origin https://gitee.com/ChenChen913/ChenChen913.git
git push origin main   # 同时推送到 GitHub 和 Gitee
```

---

## 总结对比

| | GitHub Pages | Gitee Pages | Netlify | Vercel | Cloudflare Pages |
|------|:--:|:--:|:--:|:--:|:--:|
| 自动部署 | ✅ | ❌ 需手动 | ✅ | ✅ | ✅ |
| 国内速度 | ❌ 慢 | ✅ 快 | ⚠️ 一般 | ⚠️ 一般 | ✅ 快 |
| 免费带宽 | 100 GB | 1 GB | 100 GB | 100 GB | **无限** |
| 实名认证 | 不需要 | **需要** | 不需要 | 不需要 | 需要绑卡 |
| 自定义域名 | ✅ | ❌ 免费版 | ✅ | ✅ | ✅ |
| 构建次数 | 10/月* | 不限 | 300 分钟 | 6000 分钟 | 500 次 |

> *GitHub Pages 公开仓库构建次数不限，这里指的是 GitHub Actions 的私有仓库限制

---

> 最后更新：2026-07-04
