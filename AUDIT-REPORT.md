# 个人主页项目深度审核报告

> 审核日期：2026-08-04
> 审核范围：全仓库（Jekyll 模板、样式、脚本、数据文件、CI/CD、工具脚本、文档、本地杂物）
> 审核方式：逐文件人工审查 + 交叉比对（模板 ↔ 数据 ↔ 文档 ↔ CI）

---

## 总体评价

先说公道话：这个项目的基础质量**明显高于同类个人主页**——CI 有死链阻断检查、Actions 固定完整 SHA、PDF 查看器做了路径白名单、前后经过多轮审查修复（git log 可见 50+57 项修复）。以下内容是在这个高基数上继续挑出来的问题，按严重程度分级：

- 🔴 **高**：会导致内容错误、检查失效或维护事故
- 🟡 **中**：正确性/一致性问题，影响体验或增加维护成本
- 🟢 **低**：风格、卫生、可选项

---

## 一、架构与维护性问题

### 🔴 1. 三套手工同步的页面副本，是全项目最大的维护地雷

同一份主页内容存在三份独立实现：

| 文件 | 性质 | 大小 |
|---|---|---|
| `_layouts/default.html` + `_data/*.yml` | 线上正式版 | — |
| `portfolio-single-file.html` | 手工复刻的单文件备案页 | 64 KB |
| `index_empty.html` | 又一份独立样式/文案的关闭提示页 | 4 KB |

- `portfolio-single-file.html` 需要手工同步 **7 个数据源文件**的内容，纯靠人肉纪律。
- 邮箱地址硬编码在 **4 个地方**（`social.yml`、`default.html` 字符码数组、`index_empty.html` 字符码数组、`portfolio-single-file.html`），改一次邮箱要改 4 处，漏一处就出现线上线下不一致。
- 所谓的同步保障 `check_portfolio_sync.py` **只比对"最后同步：YYYY-MM-DD"这行文字标记与 git 提交日期**，完全不比内容。也就是说：只改标记日期不改内容，检查照样通过——防君子不防"忘记"。

**建议**：备案页改为构建期生成（写个 Python 脚本从 `_data/` 渲染出单文件 HTML），或至少把 sync 检查升级为内容级 diff（提取关键字段逐一断言存在）。

### 🔴 2. `check_portfolio_sync.py` 硬编码详情页文件清单，新增内容后检查静默失效

```python
paths = ["_data", "_projects/campus-qa-bot.md", "_publications/rgv-dynamic-scheduling.md"]
```

新增任何项目/论文后，如果忘记改这行，CI 里的同步检查就对新增内容**完全失明**，且没有任何报错提示。应改为 glob：`_projects/**/*.md`、`_publications/**/*.md`。

### 🟡 3. 空 body + layout 不输出 `{{ content }}` 的黑魔法

`index.html` / `en.html` 正文为空，全靠 `default.html` 布局渲染，且布局刻意不输出 `{{ content }}`。这个设计只靠注释约定维系，任何贡献者（或未来的自己）在 index.html 里写点内容都会静默丢失。建议布局里加 `{{ content }}` 输出点（空内容输出为空，无副作用），让设计不再依赖"必须保持为空"的约定。

---

## 二、正确性与潜在 Bug

### 🔴 4. 邮箱"防抓取"形同虚设

`default.html` 第 258 行：

```liquid
<a href="mailto:{{ site.data.social.email }}" ...><noscript>{{ site.data.social.email }}</noscript></a>
```

- `mailto:` 的 href 是**明文**邮箱，直接写在 HTML 源码里；
- `<noscript>` 里的邮箱也是**明文**写在 HTML 源码里。

爬虫不需要执行任何 JS，直接正则扫源码就能拿到邮箱。字符码数组只保护了"渲染后的可见文本"这一层，而源码里邮箱出现了 **2 次明文**。这是安全剧场（security theater）——要么接受明文（大多数学术主页都这么做），要么把 href 也改成 JS 拼装、noscript 里写"请开启 JS 查看"。`index_empty.html` 同样存在此问题。

### 🟡 5. `javascript:` 链接过滤大小写敏感，可被变体绕过

`default.html` 中三处外链过滤：

```liquid
{% unless proj.github contains 'javascript:' %}
```

`JavaScript:`、`jAvAsCrIpT:`、`java\tscript:` 等变体全部绕过。虽然数据来自自己的 YAML（风险低），但过滤逻辑本身写法不严密——Liquid 里应先 `downcase` 再判断，或用白名单（只允许 `http`/`https` 开头）代替黑名单。

### 🟡 6. 详情页页脚年份硬编码，与 `personal.yml` 双源失配

`detail.html` 第 209 行硬编码 `&copy; 2026`，而主页页脚来自 `_data/personal.yml` 的 `footer_copyright`。跨年后两处必然一个忘改。`update-date.py` 也不管这个硬编码。建议详情页页脚同样从 `personal.yml` 读取。

### 🟡 7. 头像 `<img>` 未声明 width/height

`default.html` 第 129 行 `<img src="...avatar.jpg" alt="...">` 无尺寸属性。虽然外层 `.avatar` 容器有固定尺寸兜底，浏览器仍可能在图片加载前产生布局偏移（CLS）。补上 `width="112" height="144"`（与 CSS 一致）即可零成本消除。

### 🟢 8. `has_code` 检测冗余

`detail.html` 第 9 行 `content contains '```'`——kramdown 渲染完成后 content 里不可能再有 ` ``` `，该条件恒为 false，只有 `contains '<pre'` 真正起作用。无害但属于死代码，反映检测逻辑没有被实际验证过。

### 🟢 9. `has_math` 对 `~~~` 围栏和行内反引号仍误报

已有注释承认（仅多加载 KaTeX 不破坏渲染），记录备查。若在意，可用 rouge 高亮后判断是否存在 `.katex` 需求，或干脆给详情页加 `math: true` front matter 开关，比猜正文可靠。

---

## 三、文档与代码漂移

### 🟡 10. README.md 与实际实现脱节

- README 第 30 行写"中英文用 `<!-- English -->` 分隔"，**实际标记是 `<!-- PAGE_ENGLISH_SPLIT_2026 -->`**。按 README 操作的人加的内容会被模板静默丢弃（detail.html 只认后者，找不到标记时英文区块留空）。
- 目录结构清单缺 `404.html`、`index_empty.html`、`backup.ps1`、`check_portfolio_sync.py`、`portfolio-single-file.html`（后两者虽在引用块提及，但目录树未列）。
- README 称 `experience.yml` 为"实践经历"，文件内注释为"工作经历"。

### 🟡 11. 文档体量过重且内容重叠

6 份 Markdown 文档合计约 **85 KB**（TROUBLESHOOTING 26K + DEPLOY 20K + DEPLOY-OPTIONS 19K + CONTENT-GUIDE 8.7K + RUBY-JEKYLL 6.4K + 双 README）。DEPLOY.md / DEPLOY-OPTIONS.md / RUBY-JEKYLL.md 三者主题高度重叠。对一个 2 页面 + 2 详情的个人站，文档维护成本已超过代码本身，建议合并为"部署一份 + 内容指南一份"。

### 🟢 12. `.gitattributes` / `.editorconfig` 未覆盖 `*.ps1`

Windows 脚本 CRLF 例外只列了 `bat/cmd/reg/rc/sln/csproj`，漏了仓库里实际存在的 `backup.ps1`。现代 PowerShell 吃 LF 没问题，但既然定了规则就该一致——要么补上 `*.ps1`，要么在注释里说明有意为之。

---

## 四、CI/CD 问题

### 🟡 13. `workflow_dispatch` 无法手动触发部署

`deploy.yml` 第 21 行 deploy job 有 `if: github.event_name == 'push'`。想在不改代码的情况下强制重新部署（比如 GitHub Pages 抽风后）做不到，只能空提交。建议把手动触发的判断改为输入参数（`workflow_dispatch.inputs`），让手动触发既能跑巡检也能选部署。

### 🟢 14. 定时外链巡检与部署共用 concurrency group

两个 job 都在 `group: "pages"` 下，周一 03:00 UTC 的外链巡检如果撞上部署会排队。巡检是只读的，不需要与部署互斥，建议拆成独立 group。

### 🟢 15. `_site/link-report.json` 来源不明的构建残留

本地 `_site/` 里有 `link-report.json`，CI 构建流程里没有任何步骤生成它。疑似 html-proofer 某次本地手动运行的产物。无害，但说明本地 `_site` 与 CI 产物可能不一致，建议本地构建前先清 `_site`。

---

## 五、本地仓库卫生

### 🟡 16. `backups/` 目录 31 MB、12 个子目录，含大量测试残留

```
2026-08-01-____evil-194654      ← 路径注入测试残留
2026-08-01-____evil2-205745     ← 同上
2026-08-01-outside-205745       ← 同上
2026-08-01-test-194654          ← 测试残留
2026-08-01-b2-205745-旧-...     ← 归档的归档
```

这些是给 `backup.ps1` 消毒逻辑做安全测试时留下的垃圾，且 `backup.ps1` 没有保留策略（旧备份永远堆积，还会产生"-旧-时间戳"的套娃目录）。既然脚本自己都说"Git tag 是远程备份，不怕丢"，建议：清掉测试残留与旧归档，只保留最新 1 份；给脚本加个"保留最近 N 份"的参数。

### 🟢 17. `__pycache__/` 残留

根目录有 Python 缓存目录（已 gitignore，不会入库，纯本地杂物），随手删。

---

## 六、安全（已做好的 & 可改进的）

**已做得好**：Actions 固定完整 commit SHA；CDN 资源带 SRI；PDF 查看器有同源 + `/assets/` 白名单 + 路径规范化；`backup.ps1` 有路径越界防护；Liquid 输出基本都有 `escape` / `jsonify` 转义。

**可改进**：
- KaTeX / highlight.js 依赖 cdnjs，无本地 fallback（已注释承认）。既然 pdf.js 都自托管了（1.7 MB），KaTeX/highlight.js 其实也可以自托管，彻底去掉外部依赖与供应链面。
- 无 CSP（GitHub Pages 不支持自定义响应头，属平台限制，仅记录）。

---

## 七、SEO / 性能小事（🟢）

1. `og:image` 用的是竖版证件照头像，社交分享裁切效果差。标准做法是单独做一张 1200×630 的分享图。
2. favicon 只有 SVG，旧版 Safari（< 26）不支持 SVG favicon，会没有图标。补一个 32×32 PNG fallback 一行 link 的事。
3. 详情页 hreflang 用 query 参数（`?lang=en`），搜索引擎支持有限——已注释承认，若在意可在 GitHub Pages 上用 Jekyll 的 `permalink` 做 `/en/publications/...` 真静态路径。

---

## 修复优先级建议

| 优先级 | 事项 | 工作量 |
|---|---|---|
| P0 | #2 sync 检查改 glob（防静默失效） | 5 分钟 |
| P0 | #4 邮箱明文：二选一（接受明文 or 真混淆） | 15 分钟 |
| P0 | #10 README 分隔标记修正（误导性文档比没文档更糟） | 5 分钟 |
| P1 | #1 备案页改为脚本生成 | 半天 |
| P1 | #6 详情页页脚年份从数据文件读 | 10 分钟 |
| P1 | #16 清理 backups/ 测试残留 | 10 分钟 |
| P2 | #5 javascript: 过滤改白名单 / #7 头像尺寸 / #13 CI 手动部署 | 各 10 分钟 |
| P3 | #11 文档合并精简 / #8 #9 #12 #14 #15 #17 / 七节小事 | 按需 |

---

## 附：值得保持的好习惯（审核中发现的亮点）

- CI 用 html-proofer 做阻断式死链检查，外链单独巡检不阻断部署——分级合理
- `update-date.py` 写入用临时文件 + 原子替换，部分匹配时拒绝写入防静默过期
- `backup.ps1` 先暂存后转正、路径越界检查、Note 消毒——脚本工程质量高
- 主题/语言防闪烁脚本前置 head 同步执行，reduced-motion 全链路尊重
- 每个已知取舍都有注释说明（"已知取舍"出现了 5+ 次），这种诚实的注释文化值得保持
