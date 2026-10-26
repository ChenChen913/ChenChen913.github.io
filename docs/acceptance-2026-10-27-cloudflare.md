# Cloudflare 迁移验收记录

> 按 `CLOUDFLARE_MIGRATION_GUIDE.md` 第十五章的验收标准执行。
> 本文件为内部档案，已在 `_config.yml` 的 `exclude` 中（`docs/`），不发布到线上。

## 一、基本信息

| 项 | 值 |
|---|---|
| 项目 | ChenChen913.github.io（Jekyll 个人主页） |
| 迁移版本 | `af56961`（部署接入）+ `bf63a6f`（文档与 hreflang 修正） |
| 原入口 | `https://chenchen913.github.io`（保留，作备用与回滚） |
| 新入口 | `https://chenchen913.pages.dev`（主站） |
| 部署模式 | Direct Upload：GitHub Actions 构建，wrangler 上传 |
| 验收环境 | Windows + Edge（Playwright 驱动）、curl、Cloudflare 边缘节点 LAX |
| 验收日期 | 2026-10-27 |

## 二、结论

**通过。P0 = 0，P1 = 0，P2 = 3（均为已知取舍或平台限制），P3 = 1。**

核心用户路径 100% 走通；两站产物内容级一致；旧入口可用；回滚路径实测有效。

## 三、逐维度结果

| 维度（guide 4.x） | 结果 | 说明 |
|---|---|---|
| 4.1 可访问性与基础设施 | 通过 | 全站 200；HTTPS 正常；404 返回真 404；跳转链 ≤ 1 跳 |
| 4.2 页面、路由与跳转 | 通过 | 5 个页面直达 200；导航锚点、高亮、hash 正确；旧 `.html` 308 且参数保留；尾斜杠规则统一 |
| 4.3 静态资源与构建产物 | 通过 | 25 项资源全部 200（含 KaTeX 字体、pdf.js、highlight、头像、favicon、og-image）；浏览器侧资源失败 0、4xx 0 |
| 4.4 核心功能 | 通过 | 主题切换+持久化、回到顶部、导航锚点、中英切换、PDF 渲染（4 页 canvas 正常） |
| 4.5 API 与接口 | 不适用 | 纯静态站，无 API |
| 4.6 登录、权限与 Cookie | 不适用 | 无登录、无 Cookie |
| 4.7 数据一致性 | 通过 | 两站同路径 HTML 字节相等，差异仅 10 行且全部是短域名相关（canonical / og:url / og:image / hreflang） |
| 4.8 PWA、Service Worker | 不适用 | SW 注册数 0（本项目从未使用 PWA，符合设计） |
| 4.9 第三方集成 | 通过 | 请求域名只有 `chenchen913.pages.dev`，**零外部依赖**（KaTeX / highlight.js / pdf.js 全部自托管） |
| 4.10 SEO 与分享 | 通过（有取舍） | canonical 各指自己、hreflang 正确、sitemap 域名正确、robots 指向正确；见 P2-1 |
| 4.11 性能 | 通过 | 首页 TTFB 208ms / FCP 432ms / 传输 6.2KB（br）；论文页 TTFB 243ms / FCP 472ms |
| 4.12 监控、日志与回滚 | 部分通过 | 回滚路径实测全 200；无主动监控，见 P2-2 |
| 4.13 安全与合规 | 通过（有取舍） | 无密钥入库、内部文件全部 404、安全响应头生效；无 CSP，见 P2-3 |

## 四、关键实测数据

### 4.1 两站内容一致性（guide 4.7）

| 页面 | CF | GH | 字节相等 | 差异行 |
|---|---|---|---|---|
| 首页 | 17465B | 17465B | ✅ | 仅域名 |
| 英文页 | 17487B | 17487B | ✅ | 仅域名 |
| 项目详情 | 11435B | 11435B | ✅ | 仅域名 |
| 论文详情 | 12815B | 12815B | ✅ | 仅域名 |

差异全部落在 `<link rel="canonical">`、`<meta property="og:url">`、`<meta property="og:image">`、`<link rel="alternate" hreflang>` 四类标签上，正是两次构建刻意要区分的地方。

### 4.2 路由与跳转（guide 4.2）

| 请求 | 结果 | 判定 |
|---|---|---|
| `/` | 200 | 正常 |
| `/index.html` | 308 → `/` | 正常，参数保留 |
| `/index` | 308 → `/` | 正常 |
| `/en` | 200 | 正常 |
| `/en.html` | 308 → `/en` | 正常，参数保留 |
| `/en/` | 308 → `/en` | 尾斜杠统一 |
| `/projects/campus-qa-bot` | 308 → `/projects/campus-qa-bot/` | 尾斜杠统一 |
| `/projects/campus-qa-bot/?lang=en` | 200 | 语言参数未丢 |
| 不存在的路径 | 404 | 真 404，非 200 首页 |
| `/404` | 200 | 404 页面本身可访问 |

### 4.3 交互（guide 4.4）

| 检查 | 结果 |
|---|---|
| 主题切换 | light → dark，日月图标同步 |
| 主题持久化 | 点击后刷新仍为 dark（localStorage 生效） |
| 回到顶部 | 滚动后按钮出现，点击后 scrollY = 0 |
| 导航锚点 | 点击「项目经历」→ scrollY 1697，hash `#projects`，高亮项正确 |
| 语言切换（详情页） | `?lang=zh` → `?lang=en`，html lang、中英区显隐、按钮文案、aria-label 全对 |
| 键盘可达 | 首个 Tab 聚焦 skip-link，outline 可见 |
| PDF 查看器 | 4 页渲染，canvas 正常，工具栏完整 |
| 移动端 375px | 首页 / 英文页 / 论文页均无横向溢出 |
| 控制台错误 | 无（404 页的 404 资源报错属预期） |

### 4.4 性能（guide 4.11，3 次取中位）

| 页面 | TTFB | DOMContentLoaded | FCP | 传输 |
|---|---|---|---|---|
| 首页 | 208ms | 483ms | 432ms | 6.2KB |
| 论文页 | 243ms | 509ms | 472ms | 6.7KB |

## 五、缺陷清单

### P0（阻断）：0

### P1（严重）：0

### P2（一般，可记录后处理）

**P2-1 两站内容重复，各自 canonical 指自己**
双站并存期间，`pages.dev` 与 `github.io` 内容完全相同却各自声明 canonical，搜索引擎会视为两份独立文档。这不是错误配置（本来就希望两站都可用），但与 guide 4.10「没有重复内容或多套规范地址」的字面要求不符。
可选处置：给 GitHub Pages 侧加 `robots: noindex`（需按 `site.url` 在模板中条件判断），让它退化为纯备份站。**当前未做**，因为一旦 Cloudflare 出现访问问题，noindex 会让备用站也没法被搜到。

**P2-2 无主动监控**
部署失败靠 GitHub Actions 的失败邮件通知，没有针对 `pages.dev` 可用性的探测。若 Cloudflare 侧构建/上传失败而 GitHub Pages 成功，站点看似正常，实际主站已过期。

**P2-3 安全头只在 Cloudflare 生效**
`_headers` 是 Cloudflare Pages 专有机制，GitHub Pages 不支持自定义响应头，因此备用站没有 `X-Frame-Options` 等头。属平台限制，无法通过配置解决。

### P3（轻微）

**P3-1 站内 `.html` 链接在 Cloudflare 上多一跳 308**
为兼容 GitHub Pages（不认无扩展名路径）而保留 `.html` 写法。跳转由 CDN 承担，实测无感；参数在跳转中保留。

## 六、验收方法说明（重要）

本次验收**以浏览器实测为准，curl 只作辅助**。原因：本机出口经过代理，对大响应的传输不稳定，`curl` 多次出现「HTTP 200 但响应体被截断」的假阴性（例如首页只收到 8562B、PDF 只收到 505B、`KaTeX_AMS-Regular.woff2` 连续 3 次超时）。这些在浏览器侧全部正常——浏览器会自动重试、正确处理压缩与分块传输。

因此凡是涉及「内容是否完整」的判断，均以 Playwright 取 `response.body()` 的结果为准；curl 仅用于探测状态码与跳转链。

## 七、未覆盖项

| 项 | 原因 |
|---|---|
| Safari / Firefox 实机 | 本机只装了 Edge/Chrome，未做跨浏览器实测 |
| 中国大陆多地区网络 | 只在本机单一网络环境下验证 |
| 搜索引擎实际收录 | 需数周才能观察，无法即时验收 |
| 长时间稳定性观察 | guide 建议观察 1~4 周，本次仅做即时验收 |

## 八、复验命令

```bash
# 状态码与跳转链
curl -s -o /dev/null -w "%{http_code} %{num_redirects} %{url_effective}\n" \
  -L https://chenchen913.pages.dev/

# 安全响应头
curl -sI https://chenchen913.pages.dev/ | grep -iE "x-frame|permissions-policy|referrer"

# 两站一致性（字节数应相同）
curl -s --compressed https://chenchen913.pages.dev/ | wc -c
curl -s --compressed https://chenchen913.github.io/ | wc -c

# 内部文件不应可访问（应全部 404）
for f in _config.cloudflare.yml check_portfolio_sync.py requirements-ci.txt; do
  curl -s -o /dev/null -w "$f %{http_code}\n" https://chenchen913.pages.dev/$f
done
```

## 九、验收签署

| 项 | 结果 |
|---|---|
| 核心路径通过率 | 100% |
| P0 | 0 |
| P1 | 0 |
| P2 | 3（均为已知取舍/平台限制） |
| P3 | 1 |
| 回滚演练 | 通过（GitHub Pages 四个路径全 200） |
| 结论 | **通过** |
