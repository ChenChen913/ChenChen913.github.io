# 从 GitHub 迁移到 Cloudflare · 详细指南

> 适用对象：已经把项目放在 GitHub，部分项目使用 GitHub Pages 部署，希望迁移到 Cloudflare Pages / Workers 的项目所有者。  
> 目标：**迁移后 Cloudflare 成为主站，GitHub Pages 继续作为可访问的备用入口；后端数据有明确的迁移、验证和回滚方案。**
>
> **本文分两部分**：第 1–16 章是**通用方法论**（任何项目都能照着做）；
> 第 17 章是**本项目的实战记录**（Jekyll 双站部署的真实配置、实测数据与踩过的坑）。
>
> - 官方文档核实与线上实测：**2026-11-14**
> - 配套文档：部署操作看 `DEPLOY.md`；排障看 `TROUBLESHOOTING.md`；验收数据看 `docs/acceptance-2026-10-27-cloudflare.md`

## ⚠️ 先读这段：2026 年的 Pages 已不是「新建项目的默认选择」

Cloudflare 现在把新项目的推荐路径指向 **Workers + Static Assets**，Pages 进入「继续支持、只修 bug、不再加新功能」的状态：

| | Cloudflare Pages | Workers + Static Assets |
|---|---|---|
| 定位 | Git 连接的静态站托管 | 静态资源 + 服务端逻辑合一 |
| 新功能 | 基本停止 | Durable Objects、Cron、Queues、渐进部署、完整可观测性、Vite 插件 |
| 纯静态站 | **仍是最省事的选择**（git push 即部署） | 可以，但要自己维护 `wrangler` 配置 |
| 已有项目 | **没有强制迁移期限** | 有具体需求时再迁 |

**结论**

- 新建**纯静态**站 → Pages 依然好用，零配置；
- 新建**带后端或需要边缘逻辑**的 → 直接用 Workers，别从 Pages 起步；
- **已经在 Pages 上跑得好、没遇到限制的 → 不要为了追新而迁移。** 迁移最差的理由是新鲜感。

本文以 Pages 为主线（本项目用的就是它），涉及 Workers 的差异会单独标注。

## 目录

1. 先看结论
2. 迁移前评估
3. GitHub → Cloudflare 对应关系
4. **Pages 的运行机制与硬限制**（默认行为、URL 处理、`_headers` / `_redirects`、额度）
5. 保留 GitHub 部署入口
6. 后端数据怎么处理
7. 完整迁移步骤
8. 域名与访问入口策略
9. 测试清单
10. 回滚方案
11. 安全注意事项
12. 费用与限制
13. 不同项目类型的迁移示例
14. 单项目迁移记录模板
15. 常见迁移陷阱与检查表
16. 迁移验收标准
17. **实战记录：本项目的双站迁移**（架构、实测数据、踩过的坑）
18. 可选扩展：SEO 与 GEO
19. 参考资料

## 一、先看结论

### 1. 推荐的整体策略

对绝大多数个人项目，推荐：

- **Cloudflare 做主站**；
- **GitHub Pages 继续保留**，作为只读备用入口；
- **代码仍以 GitHub 仓库为源头**；
- Cloudflare 通过 Git 集成或 Wrangler/Actions 部署；
- 后端数据先确认在哪里，再决定用 KV、D1、R2、Durable Objects，或继续使用外部数据库；
- 迁移前先备份，迁移中双跑验证，迁移后再观察至少 1~4 周。

### 2. 不要一上来就删除 GitHub Pages

- GitHub Pages 是免费、现成的备用入口；
- 迁移不是“搬走一个文件夹”，而是“先建新站、验证新站、再切主入口”；
- 在 Cloudflare 稳定运行一段时间前，不要关闭 GitHub Pages；
- 也不要让两个站点同时写同一份后端数据；应保持单一写入源。

### 3. 三种项目类型

| 类型 | 例子 | 迁移重点 |
|------|------|----------|
| 纯静态 | 文档、博客、展示页、纯前端工具 | Pages 直接部署，GitHub Pages 可保留 |
| 静态 + 外部后端 | 前端调用 Supabase、Firebase、自己的 API | 前端迁移，后端先保留；再决定是否迁到 Cloudflare |
| 全栈/有服务端 | Node/Express、Next.js、数据库、文件上传、登录 | Pages Functions/Workers + D1/KV/R2，工作量最大 |

## 二、迁移前评估

### 1. 每个项目先填一张清单

| 项目项 | 需要确认的内容 |
|--------|----------------|
| 仓库 | GitHub 仓库地址、默认分支、是否私有 |
| 类型 | 纯静态 / SPA / SSR / API / 全栈 |
| 构建 | 是否需要构建、构建命令、输出目录、Node 版本 |
| 路由 | 是否有 SPA、动态路由、404、重定向 |
| 原地址 | `username.github.io/repo`、自定义域名、路径前缀 |
| 后端 | 是否有 API、数据库、对象存储、认证、定时任务 |
| 数据 | 数据存在哪、量多大、多久更新一次、是否可导出 |
| 文件 | 图片/附件是否在仓库、GitHub Releases、外部存储 |
| 用户 | 是否需要登录、第三方 OAuth、Cookie、Session |
| 集成 | Webhook、邮件、支付、统计、搜索等 |
| 流量 | 日访问、峰值、带宽、并发 |
| 域名 | 是否已有自定义域名、DNS 在哪、是否有 MX/其他记录 |

### 2. 先判断迁移难度

- **低**：纯静态、无后端、无登录、无文件上传。
- **中**：静态前端 + 外部 API/数据库，需要改配置和 CORS。
- **高**：有服务端逻辑、数据库、文件存储、认证、定时任务、WebSocket。
- **很高**：重度依赖 Node 原生模块、文件系统、长连接、复杂后台任务、专有云服务。

难度高的项目不要一次性全迁；可以先迁静态前端，后端继续保留，确认稳定后再迁数据。

## 三、GitHub → Cloudflare 对应关系

| GitHub 侧 | Cloudflare 侧 | 说明 |
|-----------|---------------|------|
| GitHub Pages | Cloudflare Pages | 静态站点托管 |
| GitHub Actions 构建/部署 | Pages Git 集成、Wrangler 或 Actions | 可保留 GitHub Actions |
| GitHub 仓库 | GitHub 仓库 + Cloudflare Git 集成 | 代码源不变 |
| GitHub Pages 自定义域名 | Pages Custom domains | 建议保留 `github.io` 作备用 |
| GitHub Pages 的 404/重定向 | `_redirects` / `_headers` | SPA 需要额外配置 |
| GitHub API / Issues 作为数据源 | 保留 GitHub API 或迁移 D1/KV | 注意速率限制和 Token |
| GitHub Releases 文件 | R2 或继续用 Releases | 文件多时建议 R2 |
| 外部 REST API | Workers / Pages Functions 或继续保留 | 先保持接口兼容 |
| PostgreSQL / MySQL | D1 或 Hyperdrive + 外部数据库 | D1 是 SQLite，不是 Postgres |
| Redis / 简单缓存 | KV | KV 是最终一致，不适合强一致场景 |
| 图片/附件 | R2 | 支持 S3 API，出站流量免费 |
| 定时任务 | Cron Triggers | Workers 定时触发 |
| 长连接/实时协作 | Durable Objects | 通常需要 Workers Paid |
| 登录认证 | 保留原认证或 Cloudflare Access | 管理后台可先用 Access |
| GitHub Secrets | Cloudflare Secrets / 环境变量 | 不要把密钥写进前端 |

## 四、Pages 的运行机制与硬限制

> 这一章是**动手前必须知道的**。Pages 有很多隐式行为：配错了不报错，只表现成「页面不对劲」。

### 1. 它会自动加这些响应头

不用写 `_headers` 就自带：

| Header | 值 |
|---|---|
| `Access-Control-Allow-Origin` | `*` |
| `Referrer-Policy` | `strict-origin-when-cross-origin` |
| `X-Content-Type-Options` | `nosniff` |
| `Etag` | 每个 200 响应 |
| `Server` | `cloudflare` |
| `Cf-Ray` | 请求 ID |

条件性添加：

- 资源被压缩时：`Cache-Control: no-transform` + `Content-Encoding`
- 请求可缓存（不带 `Authorization` / `Range`）：`Cache-Control: public, max-age=0, must-revalidate`
- 预览 URL：`X-Robots-Tag: noindex`

**这意味着**：在 `_headers` 里重复配 `Referrer-Policy` 或 `X-Content-Type-Options` 属于冗余（无害）；而 `HSTS`、`X-Frame-Options`、`Permissions-Policy`、`CSP` 确实要自己配。

### 2. URL 处理：`.html` 会被重定向掉

- `/contact.html` → 重定向到 `/contact`
- `/about/index.html` → 重定向到 `/about/`
- 官方文档只写 "redirect"；**实测返回 308**，且 **query 参数保留**（`/en.html?v=1` → `/en?v=1`）

后果：站内链接如果写死 `.html`，每次点击都多一跳。

| 做法 | 结果 |
|---|---|
| 内链保留 `.html` | 兼容 GitHub Pages（它不认无扩展名路径），CF 上多一跳 308 |
| 内链改无扩展名 | CF 直连，GitHub Pages 上 404 |
| 双站并存 | **只能选第一种**，把 308 当作 CDN 开销接受 |

本项目选了第一种，理由见第 17 章。

### 3. 404 与「被当成 SPA」的陷阱

- Pages 从请求路径开始**向上逐级查找最近的 `404.html`**（`/blog/404.html` 与 `/404.html` 可以共存）
- **没有顶层 `404.html` 时，Pages 认为你是 SPA**，把所有未匹配路径都返回 `/` 的内容

第二条是隐形炸弹：**产物里少一个 `404.html`，整站就变成「任何路径都返回首页」**，不报任何错，但搜索引擎会认为你有无限多个重复页面。

> 真实案例：Jekyll 项目把 `404.html` 误加进 `exclude`，构建成功、CI 全绿，线上却所有不存在的 URL 都返回 200 + 首页内容，直到用 `curl` 探 404 才发现。

**自查**：

```bash
curl -s -o /dev/null -w '%{http_code}\n' https://你的站/一个不存在的路径
# 必须是 404，不能是 200
```

### 4. 缓存：默认够用，别乱加

- 可缓存资源默认 `max-age=0, must-revalidate` + `Etag`，走 304 协商缓存
- 每次部署后，资产在 CDN 上保持缓存**直到下次部署**
- 单个数据中心内 TTL 约一周，也可能提前消失
- 官方明确建议：**多数情况下不要自定义缓存**。尤其在自定义域名那层再加 Cache Rule，会和 Pages 的 redirect / Functions 打架，出现「部署完了还是旧内容」

**唯一值得加长缓存的情况**：文件名带内容哈希的资产（`app.a1b2c3.js`），可设 `max-age=31556952, immutable`。

本站的 `style.css` / `script.js` **不带哈希**，所以刻意不配长缓存——否则改版后用户会长时间看到旧样式。

### 5. `_headers` 的规则叠加机制（最容易搞错的地方）

**规则不是「首个匹配」，而是「全部叠加」。** 一个请求命中多条规则时，所有规则的 header 都会应用。

```text
/*
  X-Frame-Options: SAMEORIGIN

/assets/*
  Cache-Control: public, max-age=31536000
```

请求 `/assets/a.png` 会**同时**拿到 `X-Frame-Options` 和 `Cache-Control`。

**同一个 header 被应用两次 → 值用逗号连接**：

```text
Cache-Control: public, max-age=604800, public, max-age=0, s-maxage=86400
```

这对 `Cache-Control` 是灾难：按 RFC 9111，重复指令时缓存要么取第一个值、要么判定为过期，**结果不可控且不报错**。

**要覆盖而不是叠加，用 `!` 先 detach**：

```text
/assets/*
  Cache-Control: public, max-age=0, s-maxage=86400

/assets/model.bin
  ! Cache-Control
  Cache-Control: public, max-age=604800
```

顺序有讲究：`!` 只能删掉**它之前**规则加的东西，所以**窄规则必须写在宽规则后面**。

其他约束：

- 最多 **100 条规则**，单行最多 **2,000 字符**（含空格）
- `*` splat 只能有一个
- `:placeholder` 每个只能引用一次
- `_headers` 本身**不会被当作静态文件提供**（不会泄露）
- **对 Pages Functions 的响应无效**——有 Functions 时要写在代码里

### 6. `_redirects`：与 `_headers` 相反的匹配逻辑

**`_headers` 是全部叠加，`_redirects` 是首个命中。** 同一个 source 有多条规则时，**最上面的生效**。

```text
# 静态重定向（默认 302，可显式写 301/303/307/308）
/old-page            /new-page                301

# 占位符
/blog/:year/:slug    /posts/:year/:slug       301

# splat
/legacy/*            /archive/:splat          301

# proxy / rewrite（地址栏不变，返回 200）
/app/*               /app/index.html          200
```

**约束与陷阱**

- 最多 **2,000 条静态 + 100 条动态**，每行限 **1,000 字符**
- **静态规则必须写在动态规则之前**，否则会被前面的通配规则抢先命中
- 默认状态码是 **302**，不是 301——做永久迁移要显式写
- 支持 301 / 302 / 303 / 307 / 308；**不支持**按国家、语言、Cookie 做条件重定向
- **proxy（200）只有第一条生效**：`/a /b 200` 配 `/b /c 200`，请求 `/a` 只渲染 `/b`，不会继续到 `/c`
- **proxy 会制造重复内容**，搜索引擎会惩罚。真要用，记得在 `_headers` 里补 `Link: <规范地址>; rel="canonical"`
- `_redirects` **不作用于 Pages Functions** 的响应

> **本项目为什么没有配 `_redirects`**：双站的核心矛盾是「`.html` vs 无扩展名路径」。用 200 rewrite 把它抹平，等于让同一内容在两个地址上都返回 200——那正是我们想避免的重复内容。**308 收敛到单一规范地址，反而是对的。**

### 7. 硬限制一览（Free 计划）

| 项 | 限制 | 备注 |
|---|---|---|
| 构建 | **1 并发 / 500 次每月** | 单次 20 分钟超时 |
| 文件数 | **20,000** | 付费 100,000，需设环境变量 `PAGES_WRANGLER_MAJOR_VERSION=4` |
| 单文件大小 | **25 MiB** | 更大的放 R2 |
| 自定义域名 | 100 个/项目 | |
| 项目数 | 100 个/账号 | 不常批准上调 |
| `_headers` 规则 | 100 条 | 单行 2,000 字符 |
| `_redirects` | 2,100 条 | 2,000 静态 + 100 动态 |
| 预览部署 | 无限 | |
| 静态请求 / 带宽 | 不计费 | |
| 上传（Wrangler） | 20,000 文件 / 25 MiB | 拖拽式只有 1,000 文件 |

> **500 次构建/月**算的是**部署到 Cloudflare 的次数**，不是 CI 里的构建次数。同一个 job 内构建两次、只上传一次，仍只计 1 次。真正翻倍的场景是给两个 Cloudflare 项目各配一次上传。

### 8. Direct Upload 与 Git 集成的取舍

| | Git 集成 | Direct Upload |
|---|---|---|
| 触发 | push 自动构建 | 自己构建后上传 |
| 构建环境 | Cloudflare 提供 | 你的 CI |
| **能否互转** | — | **不能。选了 Direct Upload 就永远不能切到 Git 集成**，要换只能重建项目 |
| 生产分支 | 界面可改 | **没有界面**，只能调 API `PATCH /accounts/{id}/pages/projects/{name}` |
| 预览部署 | 每分支/PR 自动 | `wrangler pages deploy --branch=<名>` |
| 构建产物 | Cloudflare 决定 | 完全由你控制 |

**本项目为什么选 Direct Upload**：需要在 GitHub Actions 里构建两次（一次给 GitHub Pages、一次给 Cloudflare），两次产物的绝对地址不同。交给 Cloudflare 构建会用另一套 Ruby 环境，无法保证两站产物一致。

**代价**：失去 Git 集成的便利，全靠自己的 workflow；而且这个决定**不可逆**。

## 五、保留 GitHub 部署入口

### 1. 保留 GitHub Pages 本身

> 先明确：GitHub Pages 只托管静态文件，本身没有服务端 API。所谓“保留 GitHub 的接口”，通常指保留 `username.github.io/repo` 页面地址、旧的自定义域名入口，或者继续保留项目原本调用的外部 API；GitHub Pages 不能承载新的后端接口。

迁移期间：

- 不要删除仓库；
- 不要关闭 GitHub Pages；
- 不要删除 `gh-pages` 分支、构建工作流或 `CNAME` 文件；
- 不要改仓库名（项目页地址会变）；
- 不要删除旧的自定义域名配置，直到新站验证完成。

建议把 GitHub Pages 当作：

- **Cloudflare 故障时的只读备用站**；
- **旧链接的兼容入口**；
- **回滚时的快速退路**。

### 2. 自定义域名的处理

如果 GitHub Pages 当前绑定了自定义域名，例如 `www.example.com`：

- 同一个主机名不能同时指向 GitHub Pages 和 Cloudflare Pages；
- 迁移时建议：
  1. 先把 Cloudflare 新站部署到 `pages.dev` 或新的测试域名；
  2. 验证完成后，把自定义域名切到 Cloudflare Pages；
  3. 保留 GitHub Pages 的默认 `username.github.io/repo` 地址作为备用；
  4. 旧自定义域名如果不再指向 GitHub Pages，原 GitHub Pages 自定义域名配置可以后续清理。
- 不要为了“保留旧站”而让 DNS 同时指向两个平台；这会导致随机 404 或证书错误。

### 3. GitHub Pages 的路径前缀问题

GitHub 项目页通常是：

> `https://username.github.io/repo/`

Cloudflare Pages 通常是根路径：

> `https://project.pages.dev/`

所以迁移时常见问题是：

- 前端把资源路径写死成 `/repo/...`；
- Vite/React 的 `base` 配置只适合 GitHub Pages；
- 绝对路径链接在新站 404；
- 路由 basename 不一致。

处理方式：

- 尽量使用相对路径；
- 用环境变量区分 `BASE_PATH`；
- 在 Cloudflare 构建时把 `base` 改为 `/`；
- 检查 CSS、JS、图片、favicon、manifest、Service Worker 的路径；
- 测试首页、子路由、刷新、404、分享链接。

### 4. SPA 与 404

GitHub Pages 对 SPA 通常需要 `404.html` 回退；Cloudflare Pages 可以用 `_redirects`：

```
/* /index.html 200
```

注意：

- 只对 SPA 使用全站回退；静态多页站点不要把所有路径都回退到首页；
- 避免把 API 路径也回退成 HTML；
- 检查 `_redirects` 是否被正确发布到输出目录。

### 5. PWA 与本地缓存

迁移后是新 origin：

- 旧域名和新域名的 localStorage 不共享；
- 旧 PWA 和新 PWA 是两个安装；
- Service Worker 缓存按 origin 隔离；
- 如果应用依赖本地缓存，用户需要在新站重新登录/导入数据；
- 后端数据不会因为换 origin 丢失，但本机未同步数据可能留在旧 origin。

### 6. 保留 GitHub Actions

可以继续保留 GitHub Actions：

- 它仍可负责 GitHub Pages 的构建和部署；
- Cloudflare 可以另外用 Git 集成或自己的部署工作流；
- 不建议让两个部署同时修改同一份构建产物；
- 建议明确“代码源是 GitHub，GitHub Pages 是备用，Cloudflare 是主站”。

### 7. 保留 API 接口

如果项目不只是静态页面，还要保留原有 API：

- 先让旧 API 继续在线，不要在新后端未验证前关掉；
- 新前端可以继续调用旧 API，先完成托管迁移；
- 在旧 API 的 CORS 白名单中加入新的 Cloudflare 域名；
- API 路径尽量加版本号，例如 `/api/v1/...`；
- 迁移期间不要同时改接口协议和部署平台；
- 如果旧 API 不能被新域名直接访问，可以在 Pages Functions 里做一层反向代理；
- 不要做没有冲突处理的双写；需要双写时，先设计主键、时间戳和冲突策略；
- 旧 API 在切换后保留只读一段时间，方便回滚；
- 前端 API 地址放在环境变量里，不要写死在源码中。

## 六、后端数据怎么处理

### 1. 先确认数据到底在哪

| 数据位置 | 常见情况 | 迁移方式 |
|----------|----------|----------|
| 代码仓库里的 JSON/Markdown | 博客、文档、静态数据 | 复制到 Pages 静态资源，或导入 D1/KV |
| 浏览器 localStorage | 纯前端工具、离线记录 | 导出 JSON，新站导入；换 origin 不会自动带过去 |
| 外部数据库 | Supabase、Firebase、MySQL、Postgres | 保留并接入，或迁移 D1/Hyperdrive |
| 对象存储 | 图片、附件、备份 | 迁移 R2，或继续使用原存储 |
| 第三方 API | 天气、支付、地图、AI | 保留 API，前端改域名/CORS |
| GitHub 本身 | Issues、仓库文件、Releases | 继续调用 GitHub API，或迁移到 D1/R2 |
| 服务端本地文件 | 上传文件、SQLite 文件 | 迁移 R2/D1；不能依赖 Workers 本地磁盘 |

### 2. Cloudflare 存储产品怎么选

| 产品 | 适合 | 不适合 |
|------|------|--------|
| KV | 配置、会话、简单 JSON、低频写入 | 关系查询、强一致、高频写入 |
| D1 | 关系型数据、CRUD、中小型业务表 | 超大数据库、复杂事务、存储过程 |
| R2 | 图片、附件、备份、静态文件 | 需要复杂查询的业务数据 |
| Hyperdrive | 继续使用现有 Postgres/MySQL | 想完全去掉外部数据库 |
| Durable Objects | 实时协作、房间、强一致状态 | 简单静态数据、低成本优先 |
| Queues | 异步任务、重试、削峰 | 同步请求链路 |
| Cron Triggers | 定时任务 | 需要常驻进程的任务 |

选择原则：

- **先保留，再迁移**：外部数据库能继续用，就先保留，前端先迁；
- **不要为了用 Cloudflare 而强行把关系数据塞进 KV**；
- **KV 适合整包 JSON 或少量键，不适合当 SQL 数据库**；
- **文件不要放 KV/D1**，放 R2；
- **需要事务和查询，用 D1 或保留外部数据库**。

### 3. 不同类型数据的迁移方法

#### 3.1 仓库里的 JSON / Markdown

- 如果只是静态内容：直接复制到 Pages 的静态目录；
- 如果前端通过 fetch 读取：改成新路径，保留旧路径作回退；
- 如果内容很大或需要查询：导入 D1；
- 如果前端依赖 GitHub Raw 的 CORS/速率：改为 Pages 静态文件或 R2，避免 GitHub API 限流。

#### 3.2 localStorage

- 导出为 JSON；
- 在新站提供导入入口；
- 导入时做字段校验和去重；
- 不能假设新站能读旧域名的 localStorage；
- 如果数据重要，先让用户在旧站导出，再在新站导入。

#### 3.3 关系型数据库

以 PostgreSQL/MySQL 为例：

1. 导出 schema 和数据；
2. 评估目标：
   - 继续使用原数据库：用 Hyperdrive 连接；
   - 迁移 D1：需要把 SQL 方言改为 SQLite 兼容；
3. 在 staging 环境导入；
4. 校验行数、主键、外键、索引、时间字段、编码；
5. 做一轮读写测试；
6. 冻结旧库写入，做最终增量同步；
7. 切换读取，再切换写入；
8. 旧库保留只读一段时间。

D1 不是 PostgreSQL：

- 不支持所有 Postgres 类型、函数、存储过程；
- 复杂 SQL 需要改写；
- 事务和并发模型不同；
- 迁移前先做兼容性评估。

#### 3.4 文件与图片

- 从 GitHub 仓库、GitHub Releases、外部对象存储迁移到 R2；
- 可用 S3 兼容工具（如 rclone）批量复制；
- 迁移后重写文件 URL；
- 配置 R2 自定义域名和 CORS；
- 校验文件数量、大小、Content-Type、缓存头；
- 旧文件链接保留一段时间或做 301。

#### 3.5 认证与用户

- 如果继续用原认证服务：只改前端域名和回调地址；
- 如果迁到 Cloudflare：
  - 管理后台可用 Cloudflare Access；
  - 业务用户需要自己实现 Session/JWT；
  - 密码哈希、OAuth 回调、Cookie 域都要重新验证；
- 不要在前端保存服务端密钥；
- 迁移用户前先确认密码哈希算法能否导出，不能导出时考虑强制重置密码。

#### 3.6 外部 API 与接口

- 先保持旧 API 在线；
- 让新前端指向同一 API，或在 Cloudflare Functions 里做代理；
- 在 API 侧增加新域名的 CORS 白名单；
- 接口加版本号，例如 `/api/v1/...`；
- 不要在迁移期间改接口协议；
- 如果旧 API 只能被 GitHub Pages 域名访问，需要提前放开新域名。

#### 3.7 D1 / KV / R2 操作示例

D1（关系型数据）：

```bash
# 1. 创建数据库
npx wrangler d1 create my-project-db

# 2. 在 wrangler.toml 中绑定
[[d1_databases]]
binding = "DB"
database_name = "my-project-db"
database_id = "<创建时返回的 ID>"

# 3. 导入 schema 和初始数据（先本地/预发验证）
npx wrangler d1 execute my-project-db --file=./schema.sql --remote
npx wrangler d1 execute my-project-db --file=./seed.sql --remote

# 4. 导出备份
npx wrangler d1 export my-project-db --output=./backup.sql --remote
```

KV（简单 JSON / 配置）：

```bash
npx wrangler kv key put --namespace-id=<命名空间 ID> "config" --path=./config.json --remote
npx wrangler kv key get --namespace-id=<命名空间 ID> "config" --remote
```

R2（文件 / 图片）：

```bash
npx wrangler r2 bucket create my-project-assets
npx wrangler r2 object put my-project-assets/path/example.jpg --file=./example.jpg
```

迁移后必须校验：

- D1：行数、主键、外键、索引、时间字段、空值、关键业务记录；
- KV：key 是否存在、JSON 是否能解析、写入后是否能被应用读取；
- R2：文件数量、大小、Content-Type、CORS、公开访问 URL；
- 所有数据：迁移前后抽样对比 + 校验和/数量统计。

> D1 是 SQLite，不是 PostgreSQL。迁移前先检查 SQL 方言、字段类型、函数、存储过程、事务和并发模型是否兼容；不要直接假设 Postgres 的 SQL 可以原样运行。

### 4. 双跑与切换

推荐顺序：

1. **旧站 + 旧后端**：保持现状；
2. **新站 + 旧后端**：先迁前端，验证 API/CORS；
3. **新站 + 新后端（只读）**：迁移数据后先验证读；
4. **新站 + 新后端（写入）**：冻结旧写入，切换写；
5. **旧站只读**：保留回滚入口；
6. 观察 1~4 周后，再考虑关闭旧后端。

不要做：

- 两个站点同时写同一份数据；
- 没有备份就删旧库；
- 没验证就改 DNS；
- 迁移中途同时改业务逻辑和部署平台。

## 七、完整迁移步骤

### 阶段 1：准备

- [ ] 列出项目清单和优先级；
- [ ] 每个项目填迁移评估表；
- [ ] 备份代码、数据库、文件、环境变量；
- [ ] 记录旧地址、旧 API、旧域名、DNS TTL；
- [ ] 准备 Cloudflare 账号和项目命名规范；
- [ ] 准备测试域名（不要一开始就动主域名）。

### 阶段 2：建 Cloudflare 项目

- [ ] Cloudflare Dashboard → Workers & Pages → 创建 Pages 项目；
- [ ] 选择 Git 集成，或使用 Direct Upload / Wrangler；
- [ ] 配置构建命令、输出目录、Node 版本；
- [ ] 配置环境变量和 Secrets；
- [ ] 如需 Functions，创建 `functions/` 目录；
- [ ] 如需 KV/D1/R2，创建资源并绑定；
- [ ] 部署到 `pages.dev` 测试地址。

Cloudflare Pages 常用配置：

| 配置项 | 示例 |
|--------|------|
| 构建命令 | `npm run build` |
| 输出目录 | `dist` |
| 根目录 | 仓库根目录，或 monorepo 的子目录 |
| Node 版本 | 按项目要求设置，例如 20 |
| 环境变量 | `API_BASE_URL`、功能开关等 |
| Functions 目录 | `functions/` |
| KV/D1/R2 绑定 | 在 `wrangler.toml` 或 Dashboard 中配置 |

Direct Upload 示例：

```bash
npm ci
npm run build
npx wrangler pages deploy dist --project-name my-project
```

Git 集成方式：

1. Cloudflare Dashboard → Workers & Pages → Create → Pages → Connect to Git；
2. 选择 GitHub 仓库和分支；
3. 填写构建命令、输出目录、环境变量；
4. 保存并部署；
5. 后续推送代码后由 Cloudflare 自动构建，GitHub Pages 可以继续独立构建。

### 阶段 3：迁移前端

- [ ] 修正 base path / 资源路径；
- [ ] 配置 SPA 回退；
- [ ] 配置 `_headers`（缓存、安全头）；
- [ ] 检查 favicon、manifest、Service Worker；
- [ ] 更新 API 地址为可配置项；
- [ ] 检查移动端和 PWA。

### 阶段 4：迁移后端与数据

- [ ] 确定数据存放位置和迁移方式；
- [ ] 建 D1/KV/R2/Hyperdrive；
- [ ] 导入 schema 和数据；
- [ ] 校验数量、校验和、关键记录；
- [ ] 配置 Secrets；
- [ ] 测试读写、权限、文件上传/下载；
- [ ] 准备好回滚备份。

### 阶段 5：联调与验证

- [ ] 新旧站对比；
- [ ] API 兼容；
- [ ] CORS/Cookie/登录；
- [ ] 数据统计一致；
- [ ] 定时任务/Webhook；
- [ ] 404/重定向/SEO；
- [ ] 性能和移动端。

### 阶段 6：切域名

- [ ] 提前降低 DNS TTL；
- [ ] 在 Cloudflare Pages 添加自定义域名；
- [ ] 验证 SSL 和 HTTPS；
- [ ] 切换主域名；
- [ ] 保留 GitHub Pages 的 `github.io` 地址；
- [ ] 旧域名做 301 或保留并行；
- [ ] 监控错误和访问。

### 阶段 7：观察与收尾

- [ ] 监控 1~4 周；
- [ ] 检查 Cloudflare 用量；
- [ ] 备份新数据；
- [ ] 更新 README、文档、分享链接；
- [ ] 确认稳定后，再处理旧后端/旧数据库；
- [ ] 保留最后一次旧备份。

## 八、域名与访问入口策略

### 1. 三个入口并存

| 入口 | 用途 |
|------|------|
| `project.pages.dev` | Cloudflare 默认地址，测试/备用 |
| `username.github.io/repo` | GitHub Pages 备用入口 |
| 自定义域名 | 正式主入口，绑定 Cloudflare |

建议：

- 自定义域名只指向 Cloudflare；
- GitHub Pages 保留默认 `github.io` 地址；
- 不要同一个域名同时指向两家；
- 旧自定义域名切换后，原 GitHub Pages 自定义域名配置可以保留一段时间再清理。

### 2. 旧链接兼容

- 旧 GitHub Pages 链接可以保留不动；
- 需要统一入口时，在旧站加提示或做 301；
- 但不要过早删除旧入口，至少保留到新站稳定；
- 分享链接、二维码、文档中的旧地址要逐一更新。

### 3. DNS 切换注意事项

- 切换前把 DNS TTL 降低到 300 秒左右，方便回滚；
- 如果域名已有 MX、TXT、CAA、其他网站记录，先把它们导入/核对到 Cloudflare，再切 NS；
- 不要为了“新旧并存”让同一个主机名同时指向两家；DNS 只能有一个解析结果；
- Cloudflare Pages 自定义域名需要域名在 Cloudflare 管理；如果域名在别的服务商，先接入 Cloudflare；
- SSL 证书由 Cloudflare 自动签发，切换前确认 HTTPS 正常；
- 旧自定义域名切到 Cloudflare 后，GitHub Pages 的 `github.io` 地址仍可作为备用入口；
- 不要急着删除旧 DNS 记录，至少保留一个回滚窗口。

## 九、测试清单

### 页面与路由

- [ ] 首页、列表页、详情页
- [ ] 刷新子路由不 404
- [ ] 资源路径（CSS/JS/图片/字体）
- [ ] favicon、manifest、Service Worker
- [ ] 404 页面
- [ ] 重定向和尾斜杠

### 旧链接与 Service Worker

- [ ] 旧的 `.html` 链接和新的无扩展名链接都能正常打开；
- [ ] 在 Service Worker 已控制页面时点击、刷新、前进/后退都正常；
- [ ] 从非首页跳到首页后，首页没有显示成上一个页面；
- [ ] 断网/重新联网后，导航回退没有串页；
- [ ] 升级 Service Worker 后，旧缓存不会继续展示旧页面。

### API 与数据

- [ ] 所有 API 路径
- [ ] 读写、删除、分页、搜索
- [ ] 错误码和超时
- [ ] CORS、Cookie、登录态
- [ ] 数据数量和关键内容一致
- [ ] 文件上传/下载
- [ ] 定时任务和 Webhook

### 浏览器与设备

- [ ] Chrome / Safari / 手机浏览器
- [ ] 无痕窗口（排除旧缓存）
- [ ] PWA 安装
- [ ] 移动端布局
- [ ] 分享卡片/SEO（如需要）

## 十、回滚方案

回滚前必须准备好：

- 旧 GitHub Pages 仍可访问；
- 旧后端/旧数据库仍可访问；
- 数据备份可恢复；
- DNS TTL 足够低；
- 新站配置可快速切回。

回滚步骤：

1. 停止新站写入；
2. 把 DNS/自定义域名切回旧站；
3. 把前端 API 地址切回旧 API；
4. 必要时恢复旧数据库备份；
5. 检查数据是否有丢失；
6. 记录原因，修复后再迁移。

注意：

- 如果已经在新站写入数据，回滚前要先导出新数据；
- 不要把回滚当成“删掉新站”，保留新站用于排查；
- 旧后端至少保留到新站稳定运行后。

## 十一、安全注意事项

- 不要把 GitHub Token、Cloudflare API Token、数据库密码写进前端或仓库；
- 使用 GitHub Secrets 和 Cloudflare Secrets；
- Cloudflare API Token 按最小权限创建；
- 预览部署如果包含后台，使用 Cloudflare Access 保护；
- CORS 不要无条件放开所有来源，至少限制到自己的域名；
- 迁移期间旧 Token 能撤销的就撤销，能轮换的就轮换；
- 公开备份文件要确认是否包含敏感数据；
- 对管理接口加认证、限流和日志。

## 十二、费用与限制

> 数据核实于 **2026-11-14**，来源为各产品官方 Pricing 页面。额度会调整，以官方为准。

| 产品 | Free 计划额度 | 备注 |
|------|--------------|------|
| **Pages** | 500 次部署/月、20,000 文件、单文件 25 MiB、100 自定义域名 | 静态请求与带宽**不计费** |
| **Workers / Pages Functions** | 100,000 请求/天、10 ms CPU/次 | Pages Functions 计入 Workers 配额 |
| **KV** | 100,000 读取/天、1,000 写入/天、1 GB | 最终一致，不适合强一致场景 |
| **D1** | 500 万行读取/天、10 万行写入/天、5 GB、10 个库 | 超限后**查询直接报错**，不会扣费 |
| **R2** | 10 GB-month 存储、Class A 100 万次/月、Class B 1,000 万次/月 | **出站流量免费**；免费额度只对 Standard 存储类生效 |
| **Workers Paid** | $5/月起 | 提高请求/CPU 上限，解锁 Durable Objects |

**几个容易踩的计费细节**

- **D1 超限是硬失败**：日读写额度用完后，D1 API 直接返回错误，站点功能会中断，不是"降级"。缓存命中率低的查询特别容易把 rows read 打满（全表扫描 = 几千行）。
- **R2 的免费额度不覆盖 Infrequent Access**：那个存储类有 30 天最短存储期，删了也照收。
- **计费单位向上取整**：1,000,001 次操作按 200 万次算，1.1 GB-month 按 2 GB-month 算。
- **Pages 的 500 次/月是"部署次数"**，不是 CI 构建次数。同一 job 内构建多次、只上传一次，仍只计 1 次。
- 免费计划超额通常是**失败 / 限流**，不会自动扣款（这一点比按量计费的平台安全）。
- **域名年费另计**，Cloudflare 不包含注册费。

**估算方法**：先按现有流量跑两周，看 Cloudflare 控制台的请求量曲线，再判断是否需要付费计划。个人静态站基本一辈子用不到付费档。

## 十三、不同项目类型的迁移示例

### 1. 纯静态站点

- 直接把构建产物部署到 Pages；
- 不需要 Functions；
- GitHub Pages 保留为备用；
- 修正 base path 和 SPA 回退即可；
- 数据如果在仓库里，直接作为静态文件。

### 2. Vite / React / Vue SPA

- 构建命令：`npm run build`；
- 输出目录：`dist`；
- 配置 `BASE_URL`；
- 使用 `_redirects` 做 SPA 回退；
- API 地址改为环境变量；
- 检查 PWA/Service Worker 的 scope。

### 3. Node.js / Express API

- 改写成 Workers/Pages Functions；
- 不是所有 Node 包都能直接运行，先检查兼容性；
- 文件系统改为 R2；
- 数据库改为 D1/Hyperdrive；
- 长任务改为 Queues/Cron；
- 认证和 CORS 重新验证。

### 4. Next.js

- 可用 Cloudflare 的 Next.js 适配方案；
- 需要处理 SSR、ISR、图片优化、API 路由；
- 先做静态导出方案，还是完整 SSR，要提前决定；
- 迁移难度高于普通 SPA。

### 5. Supabase / Firebase 项目

- 第一步不一定要迁后端：先迁前端，保留原数据库/Auth/Storage；
- 在前端配置新域名，调整 CORS 和 OAuth 回调；
- 确认 RLS/权限规则没有依赖旧域名；
- 如果后续要迁 D1/R2，再单独做数据迁移；
- 不要在前端暴露 service role key。

### 6. Jekyll / Hugo / 静态博客

- 在 Pages 配置构建命令和输出目录；
- 修正 `baseURL` / `basePath`；
- 迁移评论、搜索、统计等第三方脚本；
- GitHub Pages 保留旧文章 URL 兼容。

## 十四、单项目迁移记录模板

```
项目名：
GitHub 仓库：
项目类型：
当前地址：
目标地址：
构建命令：
输出目录：
环境变量：
数据存储：
文件存储：
认证方式：
定时任务/Webhook：
自定义域名：
DNS 所在：
迁移方式：
数据迁移方式：
测试结果：
回滚方式：
备注：
```

## 十五、常见迁移陷阱与检查表

> 下面按通用场景整理，不绑定某一个具体项目。迁移任何静态站、SPA、带后端项目时都可以逐项检查。

### 1. 页面路径、重定向与 404

GitHub Pages 和 Cloudflare Pages 对静态页面的 URL 处理不完全一样：

- GitHub Pages 的项目页通常在 `/repo/` 子路径下，常见形式是 `/repo/page.html`；
- Cloudflare Pages 往往会做“干净 URL”处理，例如把 `/page.html` 重定向到 `/page`；
- 有的托管平台会补/去尾斜杠，有的不会；
- SPA 还需要额外的 history fallback。

迁移时重点检查：

- 站内链接是否写死了 `.html`；
- 是否依赖 `/repo/` 这样的固定子路径；
- 是否有 `/page.html` 和 `/page` 两套地址；
- 404、重定向和尾斜杠是否一致；
- 分享链接、二维码、旧文档里的 URL 是否还能打开；
- SPA 回退是否只对前端路由生效，没有把 API 路径也回退成 HTML。

**常见现象**：点击子页面后地址变了，但内容还是首页；或者直接访问子页面 404。

**常见原因**：

- 链接写死了旧平台的 `.html`；
- 新平台对 `.html` 做了 301/308 重定向；
- Service Worker 或 CDN 在导航失败时回退到了首页缓存；
- 托管平台的 404/rewrite 规则把未知路径都指向了 `index.html`。

**处理原则**：

- 优先使用平台支持的规范 URL；
- 页面内链接尽量用相对路径或统一配置；
- 保留必要的旧链接重定向；
- 不要用“所有 404 都回首页”掩盖真正的路由错误；
- 用旧 URL 和新 URL 各测一遍。

### 2. PWA、Service Worker 与缓存

这是静态站点迁移中最容易被忽略的部分。

- Service Worker 缓存按 origin 隔离，换域名后是全新的缓存；
- 旧站和新站的 localStorage、IndexedDB、Cache Storage 都不共享；
- Service Worker 的 scope、start_url、manifest 路径都要检查；
- 导航请求和静态资源请求的缓存策略不同；
- 不要把所有导航页面都缓存到同一个 `index.html` key；
- 导航失败时不要无条件回退首页，否则子页面会“变成首页”；
- 更新代码后必须提升缓存版本，并确认旧 SW 会退出；
- 测试时用无痕窗口或全新浏览器配置，避免被旧缓存误导。

**常见现象**：

- 发版后用户仍看到旧页面；
- 点进子页面却显示首页；
- 离线时所有页面都显示同一份缓存；
- 手机上关掉 PWA 重开仍然旧内容。

**处理原则**：

- 导航请求和资源请求分开处理；
- 只有明确的前端路由才回退 `index.html`；
- 非首页导航按自己的 URL 缓存；
- 页面更新时 bump 缓存版本；
- 用“首页 → 子页 → 首页 → 刷新 → 重新打开”完整验证。

### 3. 构建路径与静态资源

GitHub Pages 项目页经常带子路径，而 Cloudflare Pages 通常部署在根路径，这会导致：

- CSS/JS/图片 404；
- favicon、manifest、Service Worker 路径错误；
- 绝对路径 `/assets/...` 指向错误位置；
- 前端路由 basename 不一致；
- 构建时注入的 `BASE_URL` 仍指向旧路径。

检查：

- 构建命令和输出目录是否正确；
- 资源是否使用相对路径或可配置的 base；
- 是否区分开发、预览、生产环境；
- 是否把环境变量写死在构建产物里；
- 是否有大小写敏感问题（Linux 主机常见）；
- 是否有文件没有进入构建产物。

### 4. API、CORS、登录与 Cookie

换域名后，浏览器会把新站当成新的 origin，常见问题：

- API 的 CORS 白名单没有加入新域名；
- OAuth 回调地址仍是旧域名；
- Cookie 的 Domain、Path、SameSite 设置不匹配；
- JWT 的 issuer/audience 校验失败；
- 前端 API 地址写死，无法切换环境；
- 旧 API 只能被旧域名访问。

处理：

- 新域名加入 CORS 白名单；
- 更新 OAuth 回调、Webhook、支付回调；
- 检查 Cookie 和 Session；
- API 加版本号，先保持兼容；
- 前端 API 地址放环境变量；
- 旧 API 保留一段时间，确认新站稳定后再下线；
- 不要把服务端密钥打进前端。

### 5. 后端数据迁移

无论数据在数据库、对象存储、localStorage 还是仓库文件里，都按同样顺序：

1. **盘点**：数据在哪、量多大、谁在写、是否可导出；
2. **备份**：迁移前完整备份，并验证能恢复；
3. **冻结写入**：在切换窗口停止旧系统写入；
4. **迁移到预发**：先导入 staging，不直接改生产；
5. **校验**：行数、主键、外键、索引、时间字段、编码、文件数量；
6. **只读验证**：新站先读，确认数据一致；
7. **切换写入**：再切写；
8. **保留旧数据**：至少保留一个回滚窗口。

重点注意：

- Postgres/MySQL 迁到 D1 时，SQL 方言和字段类型要转换；
- 自增 ID、序列、时间戳、时区、布尔值、空值要核对；
- 文件不要放数据库，放 R2 或对象存储；
- 认证密码哈希、OAuth 用户、权限关系要单独验证；
- 迁移脚本要幂等，支持重跑；
- 不要在没有备份的情况下删除旧库。

### 6. 域名、DNS 与邮件记录

- 自定义域名切换前，先降低 DNS TTL；
- 同一个主机名不能同时指向两个托管平台；
- 域名如果承载 MX、TXT、CAA 等记录，切换 NS 前先导入/核对，避免影响邮件和其他验证；
- 先验证 `pages.dev` 或测试域名，再切正式域名；
- SSL 证书要等签发完成；
- 旧域名可以保留 301 或并行一段时间；
- 不要过早删除旧平台的域名绑定。

### 7. SEO、统计与外部集成

迁移后容易漏掉：

- canonical、sitemap、robots；
- 301 重定向和旧链接；
- 搜索引擎站长验证；
- 统计代码、广告、评论、搜索；
- 分享卡片、Open Graph；
- Webhook、支付、邮件、第三方回调；
- 旧域名下的埋点和转化数据。

### 8. 通用上线检查清单

**迁移前**

- [ ] 确认项目类型：纯静态 / SPA / 带 API / 全栈
- [ ] 备份代码、数据库、文件和环境变量
- [ ] 记录旧 URL、旧 API、旧域名、DNS TTL
- [ ] 准备测试域名，不直接动主域名
- [ ] 确认回滚路径

**迁移后**

- [ ] 首页、子页面、404、重定向、尾斜杠
- [ ] CSS/JS/图片/favicon/manifest/Service Worker
- [ ] 旧 `.html` 链接和新无扩展名链接
- [ ] API、CORS、Cookie、登录、OAuth 回调
- [ ] 数据数量、关键记录、文件上传/下载
- [ ] PWA 安装、离线、刷新、重新打开
- [ ] 手机浏览器和桌面浏览器
- [ ] SEO、统计、分享卡片
- [ ] 错误日志和监控
- [ ] 回滚演练

**一句话原则**：迁移不是“把文件传上去”，而是“URL、缓存、数据、认证、域名、回滚”六条线同时验证。

## 十六、迁移验收标准（通用）

> 这一节是通用的迁移验收标准，不针对某个具体项目。  
> 目标：把“迁移完成”从主观感觉变成可检查、可记录、可回滚的验收结果。

### 1. 验收目标

一次合格的迁移，至少同时满足：

- 新站能正常访问，HTTPS 正常；
- 页面、导航、旧链接和重定向正常；
- 核心功能可用；
- API 和登录正常；
- 数据数量、内容和写入一致；
- PWA、缓存、移动端正常；
- 没有明显的安全、SEO、监控缺口；
- 旧站仍可回滚。

### 2. 缺陷分级

| 级别 | 定义 | 示例 | 验收处理 |
|------|------|------|----------|
| P0 | 阻断性问题 | 站点打不开、数据丢失、无法登录、核心流程完全不可用、密钥泄漏 | 必须修复，禁止上线 |
| P1 | 严重问题 | 主要页面 404、核心接口失败、数据明显不一致、关键跳转错误 | 必须修复，或书面风险接受并准备回滚 |
| P2 | 一般问题 | 个别样式、文案、非关键链接、轻微性能问题 | 可记录后修复，不阻塞验收 |

**通过标准**：

- P0 = 0；
- P1 = 0，或有明确的风险接受记录和回滚方案；
- 核心用户路径 100% 通过；
- 数据核对通过；
- 旧入口/旧链接可访问或正确跳转；
- 回滚方案经过演练；
- 监控观察期内没有新的 P0/P1。

### 3. 验收前置条件

- [ ] 新站已部署到测试域名或 `pages.dev`；
- [ ] DNS 尚未切正式域名，或已准备好快速回滚；
- [ ] 旧站、旧 API、旧数据仍可访问；
- [ ] 数据已完成备份并验证可恢复；
- [ ] 已有路由清单和关键用户路径清单；
- [ ] 有明确的验收负责人和记录模板；
- [ ] 测试环境使用新的浏览器配置或无痕窗口，避免旧缓存干扰。

### 4. 验收维度

#### 4.1 可访问性与基础设施

- [ ] 主域名和测试域名都能打开；
- [ ] HTTPS 正常，没有证书错误；
- [ ] 所有资源都是 HTTPS，没有混合内容；
- [ ] 首页状态码为 200；
- [ ] 404 页面返回 404，而不是 200 首页；
- [ ] 重定向没有循环，链路不超过 1~2 跳；
- [ ] 响应头、缓存头、字符集符合预期；
- [ ] 自定义域名、子域名和 `www` 策略符合设计。

#### 4.2 页面、路由与跳转（重点）

先整理一份**路由清单**：

- 主导航、页脚、卡片、按钮、CTA；
- 列表页、详情页、分类页、搜索页；
- 表单页、登录页、错误页；
- 旧平台有的页面；
- SPA 的动态路由；
- 需要登录后才能访问的页面。

逐项验证：

| 测试类型 | 怎么测 | 通过标准 |
|----------|--------|----------|
| 主导航 | 点击每个导航项 | 进入预期页面，URL 正确 |
| 页脚/卡片/按钮 | 点击可点击元素 | 目标页面正确，无空跳转 |
| 子页面直达 | 新标签打开/刷新 | 200 且渲染正确 |
| 浏览器返回/前进 | 连续跳转后操作 | 页面和滚动位置合理 |
| 旧 `.html` 链接 | 访问旧 URL | 200 或正确 301/308，不落到首页 |
| 旧域名/备用域名 | 访问旧入口 | 可访问，或 301/302 到新站且保留参数 |
| 无扩展名链接 | 访问新 URL | 200 且内容正确 |
| 尾斜杠 | 访问带/不带尾斜杠 | 统一 200 或 301，不循环 |
| 查询参数/锚点 | 带 `?query`、`#hash` 访问 | 参数和锚点生效 |
| 不存在的页面 | 访问随机路径 | 返回真正的 404 页面 |
| SPA 深链 | 直接访问子路由并刷新 | 应用正常渲染，不返回服务器 404 |
| 外部链接 | 点击外链 | 可访问或符合预期的新窗口行为 |
| 登录后跳转 | 登录/退出 | 回到正确页面，无开放重定向 |

**特别注意**：

- 不要把“所有未知路径都回首页”当成 SPA 回退；这会掩盖坏链接；
- 旧 `.html` 和新无扩展名地址应明确谁是规范地址；
- 如果使用 Service Worker，必须测“首次访问、刷新、返回、重开”四种情况；
- 页面跳转问题不能只看地址栏，必须确认标题、主内容和关键数据都正确。

#### 4.3 静态资源与构建产物

- [ ] CSS、JS、图片、字体、图标全部加载；
- [ ] 浏览器控制台没有 404/资源错误；
- [ ] 资源路径没有写死旧平台的子路径；
- [ ] manifest、favicon、Service Worker 路径正确；
- [ ] 构建产物的文件大小和数量合理；
- [ ] 没有把开发环境配置打进生产包；
- [ ] 文件名大小写与 Linux 主机一致；
- [ ] 缓存头合理，更新后能拿到新资源。

#### 4.4 核心功能

按关键用户路径逐条验收：

- 浏览、搜索、筛选、分页；
- 新增、编辑、删除、撤销；
- 表单校验、错误提示、空状态；
- 文件上传、下载、预览；
- 登录、退出、权限不足；
- 导入、导出、批量操作；
- 失败重试、超时、网络断开。

每条路径都要覆盖：

- 正常路径；
- 边界值；
- 错误输入；
- 空数据；
- 重复提交；
- 刷新/返回后的状态。

#### 4.5 API 与接口

- [ ] 关键接口的路径、方法、状态码、响应体正确；
- [ ] CORS 允许新域名；
- [ ] 认证头和 Cookie 正常；
- [ ] 超时、重试、错误码符合预期；
- [ ] 接口版本和旧客户端兼容；
- [ ] Webhook、支付回调、第三方回调已更新；
- [ ] 错误响应不会泄漏敏感信息。

#### 4.6 登录、权限与 Cookie

- [ ] 登录、退出、刷新后会话保持正常；
- [ ] OAuth 回调地址已更新；
- [ ] Cookie 的 Domain/Path/SameSite 正确；
- [ ] 不同角色权限正确；
- [ ] 未登录访问受保护页面会正确跳转；
- [ ] 退出后不能通过返回键恢复敏感页面；
- [ ] 管理后台有访问控制。

#### 4.7 数据一致性

- [ ] 迁移前后记录数量一致，或差异有明确解释；
- [ ] 主键、外键、索引、序列正常；
- [ ] 关键字段、时间字段、时区、编码正确；
- [ ] 文件数量、大小、Content-Type 正确；
- [ ] 新站可以正常读；
- [ ] 新站可以正常写；
- [ ] 导入/导出可用；
- [ ] 重复提交、并发写入不会产生明显脏数据；
- [ ] 旧数据保留，可回滚。

#### 4.8 PWA、Service Worker 与缓存

- [ ] 首次访问时 Service Worker 能注册；
- [ ] 第二次访问由 SW 控制，页面正常；
- [ ] 更新缓存版本后能拿到新代码；
- [ ] 断网时能展示合理的离线页，而不是错误页；
- [ ] 导航失败不会把所有子页都显示成首页；
- [ ] 换域名后旧 localStorage/缓存不会误用；
- [ ] 手机 PWA 关闭重开、刷新、返回都正常。

#### 4.9 第三方集成

- [ ] 统计代码正常上报；
- [ ] 支付、地图、搜索、评论等第三方组件正常；
- [ ] 邮件、短信、Webhook 正常；
- [ ] 回调域名、白名单已更新；
- [ ] 密钥只存在服务端。

#### 4.10 SEO 与分享

- [ ] 旧 URL 有 301 或保留可访问；
- [ ] canonical 指向新规范地址；
- [ ] sitemap、robots 正常；
- [ ] 分享卡片、Open Graph 正常；
- [ ] 没有重复内容或多套规范地址；
- [ ] 搜索引擎站长验证和统计已更新。

#### 4.11 性能

先定义预算，再对比旧站：

- 首页和关键页面的 LCP/TTFB；
- API 的 P50/P95 延迟；
- 移动网络下的加载；
- 静态资源是否命中 CDN；
- 是否有明显回退（例如 LCP 恶化超过约定阈值）。

建议至少记录：

- 首页加载时间；
- 最大内容绘制；
- 首屏资源数量；
- 关键 API 响应时间；
- 错误率。

#### 4.12 监控、日志与回滚

- [ ] 新站有访问日志和错误日志；
- [ ] 有 5xx、4xx、API 失败监控；
- [ ] 有告警接收人；
- [ ] 旧站和旧 API 仍在；
- [ ] 回滚步骤已演练；
- [ ] DNS TTL 足够低；
- [ ] 回滚后数据能恢复；
- [ ] 观察期内有人看监控。

#### 4.13 安全与合规

- [ ] 前端代码和构建产物中没有密钥、Token、数据库密码；
- [ ] 管理后台、调试接口、预览环境有访问控制；
- [ ] CORS 只允许可信来源，而不是无条件放开；
- [ ] Cookie 设置 HttpOnly/Secure/SameSite 符合场景；
- [ ] HTTPS 全站生效，没有混合内容；
- [ ] 公开备份和静态文件不包含敏感数据；
- [ ] 上传、导出、分享等接口没有明显越权；
- [ ] 依赖和第三方脚本来源可信。

### 5. 验收流程

**阶段 A：技术自检**

- 开发/维护者在测试域名完成功能、路由、API、数据、PWA 自检；
- 记录 P0/P1/P2。

**阶段 B：业务验收**

- 项目所有者按关键用户路径逐条操作；
- 不只看首页，要实际点击导航、按钮、表单、返回和刷新；
- 用新浏览器/无痕窗口验证，避免旧缓存。

**阶段 C：生产冒烟**

- 切正式域名后立即检查：
  - 首页；
  - 主导航；
  - 登录；
  - 一个关键写操作；
  - 一个关键读操作；
  - 旧链接跳转；
  - 404；
  - HTTPS。

**阶段 D：观察期**

- 观察 24~72 小时；
- 看错误率、5xx、API 失败、用户反馈；
- 没问题再签字确认迁移完成。

### 6. 验收记录模板

```text
项目：
迁移版本：
原入口：
新入口：
验收环境：
验收日期：
验收人：

核心路径通过率：
P0 数量：
P1 数量：
P2 数量：

数据核对：
旧链接/重定向：
登录/权限：
API/第三方：
PWA/移动端：
性能对比：
安全/权限：
监控/告警：
回滚演练：

结论：通过 / 有条件通过 / 不通过
备注：
```

### 7. 自动化建议

- 用 Playwright/Cypress 覆盖关键用户路径；
- 用 link checker 扫描站内链接和旧链接；
- 用 `curl` 或脚本批量检查状态码、重定向链和 HTTPS；
- 用 Lighthouse 对比迁移前后性能；
- 用 Cloudflare 预览部署做验收环境；
- 把验收结果记录在迁移记录模板里，不只看聊天记录。

> 验收的核心不是“页面能打开”，而是：**关键路径能走通、旧入口不丢失、数据不出错、出错能回滚。**

## 十七、实战记录：本项目的双站迁移

> 前 16 章是通用方法论。这一章记录**本项目（Jekyll 个人主页）实际怎么做的、踩过什么、修了什么**。
> 逐条操作命令见 `DEPLOY.md`；故障现象与排查见 `TROUBLESHOOTING.md`；完整验收数据见 `docs/acceptance-2026-10-27-cloudflare.md`。

### 1. 最终架构

**Cloudflare Pages 是主站，GitHub Pages 保留为备用。**

```
push 到 main
   │
   ├─ 构建 A（_site）────────────────→ GitHub Pages
   │     url = https://chenchen913.github.io
   │
   └─ 构建 B（_site_cf，追加 CF 配置）──→ wrangler 上传 → Cloudflare Pages
         url = https://chenchen913.pages.dev
```

**为什么构建两次，而不是构建一次传两个地方**

站点的 canonical / og:url / hreflang / sitemap 全部来自 `site.url`。只构建一次再复制，Cloudflare 上的页面会声明自己是 `github.io` 的副本——那是错的，等于主动把权重交给旧站。

用 Jekyll 的多配置机制解决：

```bash
# GitHub Pages
bundle exec jekyll build                                   # → _site

# Cloudflare
bundle exec jekyll build \
  --config _config.yml,_config.cloudflare.yml \
  --destination _site_cf                                   # → _site_cf
```

`_config.cloudflare.yml` 只覆盖两件事：`url` 和 `include: [_headers]`。

**踩过的坑**：`--destination` 不能省。两个构建输出到同一目录会互相覆盖，而且是**静默覆盖**——后构建的把先构建的盖掉，CI 全绿，但其中一站内容是错的。

### 1.5 关键决策与理由（防止后来者重复讨论）

| 决策 | 理由 | 代价 |
|---|---|---|
| **两站各自 canonical 指自己** | 备用站不能退出索引，否则「CF 挂了还能访问」就失去意义 | 两份索引并存，可能分散少量权重 |
| **不给 GitHub Pages 加 `noindex`** | 同上。加了之后搜索引擎完全找不到备用入口 | — |
| **不做 CSP** | 全站大量内联 `<script>` 与内联 style，落地必须放行 `unsafe-inline`，防护收益有限却极易打断页面 | 无 CSP 防护 |
| **安全响应头只在 CF 生效** | GitHub Pages 不支持自定义响应头（平台限制）。用 `<meta>` 只能等效 `Referrer-Policy`，`X-Frame-Options` 无法替代 | 备用站无点击劫持防护（纯静态展示页，无攻击价值） |
| **接受 `.html` 的 308** | 内链要兼容 GitHub Pages | CF 上每次内链多一跳 308 |
| **配了 `_headers` 但不配缓存** | 文件名不带内容哈希，长缓存会让用户长期看到旧版 | 每次都走 304 协商 |

> 这几条都是**权衡后的选择，不是遗漏**。将来要改，先读 `docs/acceptance-2026-10-27-cloudflare.md` 第五节——那里记录了每个方案的后果对比。

### 2. 目录归属：`_headers` 到底该写在哪

`_headers` 必须被复制进产物根目录，Cloudflare 才读得到。Jekyll 默认忽略 `_` 开头的文件，所以要靠 `include`。

**但 `include` 写错地方会出事**：

| `include` 写在 | GitHub Pages 侧 | Cloudflare 侧 |
|---|---|---|
| `_config.yml` | ❌ `_headers` 被复制进 `_site`，`github.io/_headers` **可被公开下载**（实测 200、1554 字节） | ✅ 生效 |
| `_config.cloudflare.yml` | ✅ 默认忽略，返回 404 | ✅ 生效 |

**为什么第二个可行**：Jekyll 合并多配置时，**数组是整体替换而不是追加**。所以只有追加了 `_config.cloudflare.yml` 的那次构建才包含 `_headers`。

**验证必须查两件事，缺一不可**：

```bash
# ① GitHub 侧必须 404
curl -s -o /dev/null -w '%{http_code}\n' https://chenchen913.github.io/_headers

# ② Cloudflare 侧安全头必须还在
curl -sI https://chenchen913.pages.dev/ | grep -iE "strict-transport|x-frame|permissions-policy"
```

只查 ① 很可能把 Cloudflare 的安全头一起弄没了。

### 3. 实测数据（2026-10-27 验收）

#### 跳转行为

| 请求 | 结果 | 判定 |
|---|---|---|
| `/` | 200 | 正常 |
| `/index.html` | 308 → `/` | 正常，参数保留 |
| `/en.html` | 308 → `/en` | 正常，参数保留 |
| `/en/` | 308 → `/en` | 尾斜杠统一 |
| `/projects/xxx` | 308 → `/projects/xxx/` | 尾斜杠统一 |
| `/projects/xxx/?lang=en` | 200 | 参数未丢 |
| 不存在的路径 | 404 | 真 404，不是 200 首页 |

#### 两站产物一致性

| 页面 | 首页 | 英文页 | 项目详情 | 论文详情 |
|---|---|---|---|---|
| 字节数 | 17732 | 17764 | 14289 | 15695 |
| 归一域名后 diff | 空 | 空 | 空 | 空 |

差异只出现在 `canonical`、`og:url`、`og:image`、`hreflang` 四类标签上——正是两次构建刻意要区分的地方。

> **判断一致性的可靠方法是「同一路径分别取回、域名归一后 diff」**，不是比字节数（本机代理会截断大响应，详见踩坑 4）。

#### 性能

| 页面 | TTFB | FCP | 传输 |
|---|---|---|---|
| 首页 | 208ms | 432ms | 6.2KB（br） |
| 论文页 | 243ms | 472ms | 6.7KB |

#### 外部依赖

**零**。KaTeX、highlight.js、pdf.js 全部自托管在 `assets/vendor/`，浏览器请求的域名只有本站自己。

### 4. 踩过的坑（按代价排序）

#### 坑 1 · `_headers` 在备用站明文可下载

见上一节。代价：内部配置注释（缓存策略、CSP 取舍）全部外泄。根因是把 `include` 放进了 `_config.yml`。

#### 坑 2 · `.html` 链接的双站矛盾

GitHub Pages 不认无扩展名路径，Cloudflare 又把 `.html` 308 掉。

| 尝试的方案 | 结果 |
|---|---|
| 用 `_redirects` 让 `/en.html` 直接返回 200 | ❌ 同一内容出现两个 200 地址，制造真正的重复内容 |
| 内链改无扩展名 | ❌ GitHub Pages 上 404 |
| 保留 `.html`，接受多一跳 | ✅ 采用 |

**结论**：308 是正确行为（把非规范地址收敛到规范地址），多出的一跳由 CDN 承担，不值得为它让两站产物分叉。

#### 坑 3 · sitemap 里含 `/en.html`

`sitemap.xml` 列的是文件路径 `/en.html`，在 Cloudflare 上它会 308 到 `/en`。

Google 会跟随后索引最终地址，属轻微问题。**没有强行修改**——改它需要给 `en.html` 设特定 permalink，会破坏 GitHub Pages 侧。

#### 坑 4 · curl 验证会假阴性

本机出口经过代理，大响应被截断：同一页面多次能拿到 5846B / 17732B / 空。

**正确做法**：

- 只用 `curl` 判**状态码和跳转链**
- 判**内容**用浏览器（Playwright 取 `response.body()`）
- 判**两站一致性**用「归一域名后 diff」

#### 坑 5 · 部署链路断了，两周没人知道

**现象**：推送成功、HEAD 变了、线上不动、没有任何报错。

**根因**：两件事撞在一起——

1. `ubuntu-latest` 的默认 Python 升到 **3.14**，PyYAML 6.0.2 只有到 cp313 的 wheel，pip 只能回退源码包；
2. PyPI 把这个版本的 sdist **重新打包过**（文件名大小写和 hash 都变了），而 `requirements-ci.txt` 里登记的是旧 hash。

`--require-hashes` 找不到匹配，安装阶段直接中断，后面的构建、部署全部 skipped。

**为什么持续两周**：定时任务只跑链接检查，而真正会构建部署的 job 在 `schedule` 触发时是 skip 的。静态站又长期没有 push——故障永远不会自己冒出来。

**修法**：

- 补上真实 sdist hash（两个都保留）；
- 两个 job 都固定 `actions/setup-python` 到 3.13，命中官方 wheel，不再受 runner 默认版本漂移影响；
- **让定时巡检也跑一遍依赖安装 + 数据校验**，把它变成部署链路的哨兵。

**通用教训**：**监控必须覆盖真实部署路径。** 只检查「站点可达」会漏掉「根本推不上去」。

#### 坑 6 · Jekyll 项目特有的三个坑

| 现象 | 原因 | 修法 |
|---|---|---|
| 构建报 `Liquid syntax error` | 根目录的 `.md` 里有 Liquid 示例代码，被当模板解析 | 加进 `_config.yml` 的 `exclude` |
| 反向：从 exclude 移除但文件还在 | 中间态文件仍在根目录，Jekyll 照样解析它 | **exclude 的增删必须与文件增删在同一个提交里完成** |
| 不存在的路径返回 200 | `404.html` 被误 exclude，Pages 把整站当成 SPA | 确认产物根目录有 `404.html` |

> 第二条是真踩过的：先改 exclude、打算下个提交再删文件，结果中间那次构建直接失败（`'unless' tag was never closed`）。

### 5. 监控

| 手段 | 频率 | 覆盖内容 |
|---|---|---|
| `deploy.yml` 的巡检 job | 每周一 03:00 UTC | 依赖安装 + 数据校验 + 构建 + 内部链接 |
| `uptime-check.yml` | 每天 09:00 / 21:00（北京时间） | 两站共 9 项：状态码 + 页面关键字符串 |

**两种告警含义不同，别混**：

- `deploy.yml` 红 → 这次改动**没上线**，线上还是旧的
- `uptime-check.yml` 红 → 线上**现在就是坏的**，跟有没有人部署无关

> ⚠️ 两者都受 GitHub「仓库 60 天无活动 → 自动禁用 workflow」影响。长期静默期最隐蔽的失效**不是站点挂了，而是连告警都停了**。

### 6. 回滚

| 方式 | 范围 | 持续性 |
|---|---|---|
| Cloudflare 控制台 Rollback | **只回滚 CF 一侧**，GitHub Pages 不动 | 下次 push 会被覆盖，属临时止血 |
| 回滚 git commit（`PATCH /git/refs/heads/main`） | 两站一起退 | 持久，且会重新触发 CI |

**怎么选**：主站刚推上去就坏了 → 控制台回滚止血；要长期回到旧版本 → 回滚 commit。

### 7. 成本核算

免费额度 500 次构建/月，算的是**部署到 Cloudflare 的次数**。

- 本项目每次 push 只做 **1 次** Cloudflare 部署（两次 `jekyll build` 都在同一个 CI job 内，只有一次 `wrangler pages deploy`），所以计 1 次
- 按每天 2–3 次 push 算：约 60–90 次/月
- 加上手动触发与定时巡检，远低于上限

**注意**：如果给两个站点各配一个独立 workflow、各自上传一次，消耗才会翻倍。本项目把两次构建放进同一个 job，正是为了省这个额度。

## 十八、可选扩展：SEO 与 GEO

> **这一节是可选扩展，不是迁移必须完成的步骤。**  
> 不继续做 SEO/GEO，不影响站点正常使用、数据迁移和验收结论。  
> 只有当站点面向公众、希望被搜索或 AI 引用时，才值得继续投入。

### 1. 两个名词的简短区别

> **SEO：让网页在搜索引擎里被搜到、排得高。GEO：让内容被 AI 问答引用、推荐。前者争排名，后者争被引用。**

补充：

- SEO 面向 Google、Bing、百度等传统搜索结果；
- GEO 通常指 **Generative Engine Optimization（生成式引擎优化）**，面向 ChatGPT、Perplexity、AI 摘要、Copilot 等 AI 搜索；
- GEO 有时也指“地理/本地优化”，属于本地 SEO，和这里说的生成式引擎优化不是一回事；
- 两者不是互相替代，而是共享“可抓取、结构清楚、内容可信、速度正常”的基础。

### 2. 先判断有没有必要

| 站点类型 | SEO | GEO | 建议 |
|----------|-----|-----|------|
| 私人后台、内部工具 | 不需要 | 不需要 | 重点做 noindex，禁止被收录 |
| 私人数据 + 少量公开内容 | 只优化公开页 | 可选 | 私人页禁止收录，公开页做基础 SEO |
| 公开文档、博客、内容站 | 有必要 | 可选 | 先做好 SEO，再考虑 GEO |
| 公开获客、品牌站 | 有必要 | 值得做 | SEO 是地基，GEO 是增量 |
| 线下本地服务 | 本地 SEO | 本地 GEO | 需要地址、地图、本地页面 |

**判断原则**：

- 没人需要通过搜索找到你：不需要；
- 只有自己用：不需要，甚至要防止被收录；
- 希望陌生人搜到、被 AI 引用：值得做，但先做 SEO 地基；
- SEO/GEO 不应成为迁移验收的阻塞项，除非“公开获客”本来就是项目目标。

### 3. 共同基础

无论是 SEO 还是 GEO，先做好这些：

- 使用自定义域名，不长期依赖平台子域名；
- 全站 HTTPS；
- 页面主体是可抓取的 HTML，不只靠 JS 渲染；
- 每页有唯一标题、描述、H1；
- 有 `robots.txt`、`sitemap.xml`；
- 有 canonical，避免平台域名和自定义域名重复；
- 404、301、尾斜杠、旧链接处理清楚；
- 加载速度和移动端体验正常；
- 公开页面允许搜索引擎和 AI 爬虫访问；
- 私人页面、后台、备份、API 明确 noindex。

### 4. SEO 落地清单

#### 4.1 页面与关键词

- 一个页面只对应一个主要主题；
- 标题和描述写清楚页面解决什么问题；
- 用 H1/H2/H3 表达结构；
- 不要所有页面抢同一个关键词；
- 重要页面从首页和其他公开页面链接过去。

#### 4.2 技术项

- `title`、`meta description`、canonical；
- Open Graph / Twitter Card；
- `sitemap.xml` 和 `robots.txt`；
- 301 旧链接，404 页面返回真正 404；
- 图片 alt、字体和脚本不阻塞渲染；
- Core Web Vitals 和移动端正常；
- 提交 Google Search Console、Bing Webmaster；
- 面向国内可另外提交百度搜索资源平台。

#### 4.3 结构化数据

按页面类型选择，不要乱标：

- 文章：`Article`
- 教程：`HowTo`
- 问答：`FAQPage`
- 产品：`Product`
- 本地业务：`LocalBusiness`
- 站点：`WebSite` / `Organization`

#### 4.4 内容与外链

- 内容真正解决问题，不堆关键词；
- 建立主题集群和内链；
- 标注作者、更新时间、来源；
- 在相关平台留下真实链接；
- 不买垃圾外链，不做关键词堆砌。

### 5. GEO 落地清单

GEO 不是玄学，重点在“让 AI 更容易理解、引用和信任”。

#### 5.1 答案优先

- 页面开头直接回答核心问题；
- 每个小节先给结论，再展开；
- 常见问题用 FAQ 形式；
- 多用步骤、清单、对比表、定义和例子。

#### 5.2 可信度

- 作者是谁、有什么经验；
- 首次发布和最近更新时间；
- 数据来源和引用链接；
- 不编造数据；
- 站点有关于页、联系方式、品牌名保持一致。

#### 5.3 可抓取性

- 公开正文不要只放在 JS 里；
- 保持 URL 稳定；
- 允许 AI 爬虫访问公开内容；
- 私人页、后台、备份路径继续 noindex；
- 可选 `llms.txt`，给 AI 工具一个站点摘要；它不是标准，也不是保证。

#### 5.4 外部提及

AI 引用往往来自“多处都提到你”：

- 公众号、知乎、小红书、GitHub、行业站点；
- 被其他文章引用；
- 品牌名、作者名、产品名保持一致。

#### 5.5 不要做的事

- 不要用 AI 批量生成垃圾页面；
- 不要为了 GEO 屏蔽所有 AI 爬虫，然后又希望被引用；
- 不要相信“保证被 AI 推荐”的服务；
- GEO 没有稳定的排名查询，效果需要长期观察。

### 6. Cloudflare 上的注意事项

- Cloudflare Pages 托管静态站，对 SEO 没有天然劣势，CDN 有利于速度；
- 自定义域名作为 canonical，平台子域名作为测试/备用；
- `pages.dev` 和自定义域名都能访问时，用 canonical 指定主域名；
- 预览部署、后台、API、备份目录用 `_headers` 设置 `X-Robots-Tag: noindex`；
- 用 `_redirects` 处理旧 URL；
- 检查 Bot Fight / WAF 设置，不要误伤搜索引擎和 AI 爬虫；
- 有动态内容再考虑 Workers/SSR，不要为了 SEO 强行上复杂架构。

### 7. 优先级建议

| 优先级 | 做什么 |
|--------|--------|
| P0 | 自定义域名、HTTPS、robots、sitemap、canonical、404/301、私人页 noindex |
| P1 | 标题/描述/H1、内链、内容质量、移动端、速度 |
| P2 | 结构化数据、Search Console/Bing、外链、作者与来源 |
| P3 | GEO：答案优先、FAQ、表格、AI 爬虫策略、`llms.txt`、外部提及 |

**结论**：

- 私人站点：不需要 SEO/GEO，先做防收录；
- 公开站点：SEO 是地基，GEO 是加分项；
- 先做技术 SEO 和内容，再考虑 GEO；
- SEO/GEO 是长期工作，不是迁移完成后的必填项。

## 十九、参考资料

**本指南第 4 章的事实来源（建议收藏这几个）**

- Pages 限额：https://developers.cloudflare.com/pages/platform/limits/
- Pages 的服务行为（URL/404/SPA/缓存/默认响应头）：https://developers.cloudflare.com/pages/configuration/serving-pages/
- `_headers` 语法与规则叠加：https://developers.cloudflare.com/pages/configuration/headers/
- `_redirects` 语法：https://developers.cloudflare.com/pages/configuration/redirects/
- Direct Upload 及其不可逆限制：https://developers.cloudflare.com/pages/get-started/direct-upload/
- 回滚到历史部署：https://developers.cloudflare.com/pages/configuration/rollbacks/
- 从 Pages 迁移到 Workers（含 `assets` 配置对照）：https://developers.cloudflare.com/workers/static-assets/compatibility-matrix/

**产品入口**

- Cloudflare Pages：https://developers.cloudflare.com/pages/
- Pages 自定义域名：https://developers.cloudflare.com/pages/configuration/custom-domains/
- Pages Functions：https://developers.cloudflare.com/pages/functions/
- Workers：https://developers.cloudflare.com/workers/
- Workers 定价：https://developers.cloudflare.com/workers/platform/pricing/
- KV：https://developers.cloudflare.com/kv/
- D1（含定价）：https://developers.cloudflare.com/d1/platform/pricing/
- R2（含定价与免费额度）：https://developers.cloudflare.com/r2/pricing/
- Hyperdrive：https://developers.cloudflare.com/hyperdrive/
- Cloudflare Access：https://developers.cloudflare.com/cloudflare-one/access/

**GitHub 侧**

- GitHub Pages 自定义域名：https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site
- GitHub Actions 输入上下文（`inputs` vs `github.event.inputs` 的布尔差异）：https://docs.github.com/en/actions/using-workflows/events-that-trigger-workflows#providing-inputs

---

**一句话总结**

迁移不是「把文件传上去」，而是 **URL、缓存、数据、认证、域名、回滚** 六条线同时验证。

对一个纯静态站（比如本项目），真正需要花心思的只有三件事：

1. **绝对地址**——两站各自的 canonical / sitemap 必须指向自己（否则等于把权重送出去）；
2. **`.html` 与尾斜杠**——两个平台的规范不一致，只能选一边兼容、接受另一边的跳转；
3. **监控**——静态站最危险的失效不是「挂了」，而是「部署链路断了但你不知道」。

后端、认证、数据库那些章节，纯静态站可以直接跳过。
