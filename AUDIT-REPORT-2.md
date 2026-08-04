# 个人主页项目深度审核报告（第二轮）

> 审核日期：2026-08-04（第二轮，针对 `fe00a72` "修复 25 项问题" 之后的代码）
> 审核方式：逐项验证第一轮 17 个问题的修复情况 + 全量重新审查
> 第一轮报告见 `AUDIT-REPORT.md`

---

## 一、第一轮问题的修复验证

先给结论：**第一轮 17 项全部得到处理，且大部分修得很到位。**

| 原问题 | 验证结果 |
|---|---|
| #1 三套副本 / sync 只比日期 | ✅ `check_portfolio_sync.py` 重写为内容级断言（逐字段比对），我本地实际运行通过 |
| #2 sync 检查硬编码文件名 | ✅ 已改 glob（`_projects/**/*.md` 等），并验证通过 |
| #3 空 body 黑魔法 | ⚪ 保留原设计（可接受的取舍） |
| #4 邮箱假混淆 | ✅ href 与显示文本均改 JS 字符码拼装，源码无明文（但见新问题 H3） |
| #5 `javascript:` 黑名单 | ✅ 改 http/https 白名单 + downcase |
| #6 详情页页脚硬编码 2026 | ✅ 改从 `personal.yml` 的 `footer_copyright` 读取 |
| #7 头像无尺寸 | ✅ 已加 width/height |
| #8/#9 has_code/has_math | ✅ 改 front matter `math:` 开关 + 去掉死代码 |
| #10 README 分隔标记/目录树 | ✅ 已修正 |
| #11 文档合并 | ✅ DEPLOY-OPTIONS/RUBY-JEKYLL 已合并删除，无残留引用 |
| #12 ps1 行尾 | ✅ .gitattributes/.editorconfig 已补 |
| #13 CI 手动部署 | ✅ 加了 workflow_dispatch 输入（但见新问题 H2，**该修复本身有 bug**） |
| #14 巡检/部署 concurrency | ✅ 已拆分两个 group |
| #16 backups 测试残留 | ✅ 31MB → 3.2MB，只剩 2 个目录；backup.ps1 加了 -Keep 保留策略 |
| og-image / favicon PNG | ✅ 已生成，实测尺寸 1200×630 / 32×32 正确 |
| KaTeX/highlight.js 自托管 | ⚠️ 已自托管，**但 KaTeX 字体文件缺失**（见 H1） |

---

## 二、新发现问题（本轮重点）

### 🔴 H1. KaTeX 自托管缺 `fonts/` 目录——公式页必坏

`assets/vendor/katex/` 只有 3 个文件（css/js/auto-render），**没有 fonts 目录**。而 `katex.min.css` 里引用了约 60 个字体文件：

```css
src:url(fonts/KaTeX_AMS-Regular.woff2) format("woff2"),...
```

后果：任何在 front matter 加 `math: true` 的页面，每个数学字形都会 404，公式以系统衬线字体兜底渲染，上下标/积分号/分式严重变形——比"不渲染"还难看。目前仓库里没有页面用 `math: true`，所以是**潜伏炸弹**；而 CONTENT-GUIDE.md 已经告诉将来的自己"公式页加 `math: true` 即可"，迟早踩中。

**修复**：从 KaTeX 0.16.9 发布包把 `fonts/` 目录（约 60 个 woff2/woff/ttf，~300KB 只保留 woff2 也够）放进 `assets/vendor/katex/fonts/`。

### 🔴 H2. CI 手动部署开关的类型陷阱——勾选 deploy 后反而不会部署

`deploy.yml` 两个 job 的条件：

```yaml
if: github.event_name == 'push' || (github.event_name == 'workflow_dispatch' && github.event.inputs.deploy == 'true')
```

`workflow_dispatch` 的 `type: boolean` 输入在 `github.event.inputs` 上下文中是**真正的布尔值 `true`，不是字符串 `'true'`**。GitHub Actions 表达式对 `true == 'true'` 做松散比较的结果是 **false**。

后果：手动触发并勾选 deploy 时，`build-and-deploy` 被跳过；同时 `check-external-links` 的条件 `deploy != 'true'` 反而为真——**你想部署，它却跑了一遍外链巡检**，静默相反，没有任何报错。

**修复**：改用 `inputs` 上下文（它会把布尔转成字符串）：

```yaml
if: github.event_name == 'push' || (github.event_name == 'workflow_dispatch' && inputs.deploy == 'true')
# check-external-links:
if: github.event_name == 'schedule' || (github.event_name == 'workflow_dispatch' && inputs.deploy != 'true')
```

### 🔴 H3. 邮箱"唯一数据源"名不副实，且出现检查盲区

`social.yml` 新注释写"邮箱唯一数据源是本文件"，但实际上**模板里已经没有任何地方读 `social.email`**（全仓 grep 为零）——线上页面显示的邮箱来自 `_layouts/default.html` 和 `index_empty.html` 里两处**手工维护的 JS 字符码数组**。social.yml 现在只是 sync 脚本的参照物。

更麻烦的是盲区：`check_portfolio_sync.py` 只校验 portfolio-single-file.html。如果改邮箱时改了 social.yml + portfolio，**忘了改两处 JS 数组，线上网站会显示旧邮箱，且所有检查全部绿灯**——这正是第一轮 #4 想消除的那类事故，只是换了个位置。

**修复**：在 `check_portfolio_sync.py` 里加一步——从 default.html / index_empty.html 提取 `var codes = [...]` 数组，解码后与 `social.yml` 的 email 比对。十几行代码就能堵上。

---

### 🟡 M1. CONTENT-GUIDE 与 social.yml 的指引互相矛盾且均已过时

- `CONTENT-GUIDE.md` 3.2 节仍写"改联系方式：编辑 `_data/social.yml` 改对应字段即可，中英文页面同步生效"——对邮箱已不成立（需同步 3 处）；
- `social.yml` 注释说"改本文件 + 两处 JS 数组即可"——漏了 portfolio-single-file.html 也要改（虽然 sync 检查会拦）；
- 两处文档对"到底改几处"说法不一致。建议统一为：social.yml + default.html JS 数组 + index_empty.html JS 数组 + portfolio（或靠 H3 的自动检查兜底）。

### 🟡 M2. `index_empty.html` 头部注释与实现相反

第 17-20 行注释仍写"邮箱 href 与 noscript 文本由 Liquid 从 `_data/social.yml` 注入"——但这一轮已经把实现改成 `href="#"` + 纯 JS 拼装了，Liquid 注入已不存在。注释描述的是被改掉的旧实现，会误导后来者。

### 🟡 M3. CONTENT-GUIDE 行号引用过期

- "`script.js` 的 `NAV_OFFSET`（第 66 行）" → 实际在**第 88 行**
- "`style.css` 第 61 行的 `scroll-margin-top`" → 实际在**第 65 行**

行号引用本来就是易碎品，建议改成"搜索 `NAV_OFFSET` 常量"这类定位方式。

### 🟡 M4. `index.html` 注释指向不存在的章节

注释写"详见 DEPLOY.md 第三节'本地预览'"——三份文档合并后，本地预览是 DEPLOY.md 的**第五节**（第三节是目录结构）。`en.html` 的对应注释没写节号，反而没问题。

### 🟡 M5. CI 新增 PyYAML 隐式依赖未声明

新的 `check_portfolio_sync.py` 开头 `import yaml`，但 `deploy.yml` 里没有 `pip install pyyaml`，也没有 requirements.txt。当前能跑是因为 GitHub runner 镜像恰好预装了 PyYAML——镜像升级后可能某天突然挂掉，且报错信息（ModuleNotFoundError）离根因很远。本地同理（你机器上装了所以没感觉）。建议在 CI 加一行 `pip install pyyaml`，成本极低。

---

### 🟢 L1. `generate_assets.py` 硬编码 og 图文案

姓名、tagline、URL 直接写在脚本里（第 68-70 行），与 `_data/personal.yml` 形成新的双源。改 tagline 后 og 图不会同步。可以从 personal.yml 读取（脚本已依赖 PyYAML）。

### 🟢 L2. README 目录树未收录新文件

`AUDIT-REPORT.md`、`docs/`、`assets/vendor/`、`og-image.png`、`favicon-32x32.png`、`.editorconfig`/`.gitattributes` 均未在目录树中体现。第一轮刚修过目录树，这一轮又落后了——建议目录树只列"改内容需要知道的"，其余一句话带过，降低保鲜成本。

### 🟢 L3. `backup.ps1` 备份清单未含 `docs/`、`.github/`、`robots.txt`

新加的 CoreItems 覆盖了脚本和 Gemfile，但 CI 配置（deploy.yml）和计划文档（docs/）不在备份范围内。workflow 丢了只能从 git 历史捞。

### 🟢 L4. TROUBLESHOOTING 的 exclude 示例与实际配置不一致

第 613 行附近示例里有 `INDEPENDENT-AUDIT.md`（仓库中不存在该文件），且示例 exclude 列表与 `_config.yml` 现状不同。作为历史故障记录可以理解，但建议加一句"以下为当时快照，以 `_config.yml` 为准"。

### 🟢 L5. 杂项

- `portfolio-single-file.html` 第 13 行"最后同步"标记缩进丢失（顶格了），纯属外观，但 sync 正则不影响；
- `backups/pre-jekyll-2026-07-04` 不匹配保留策略的 `^\d{4}-\d{2}-\d{2}-` 正则，永远不会被自动清理——如果是有意保留里程碑备份，建议在 backup.ps1 注释里写明；
- `_site/link-report.json` 本地构建残留仍在（不入库，无实际影响）。

---

## 三、修复优先级

| 优先级 | 事项 | 工作量 |
|---|---|---|
| P0 | H2 CI boolean 比较（手动部署功能实际不工作） | 5 分钟 |
| P0 | H1 补 KaTeX fonts 目录 | 10 分钟 |
| P1 | H3 sync 检查覆盖两处 JS 邮箱数组 | 20 分钟 |
| P1 | M1/M2 邮箱相关文档口径统一 | 15 分钟 |
| P2 | M5 CI 声明 pyyaml 依赖 / M3 M4 文档引用修正 | 各 5 分钟 |
| P3 | L1-L5 | 按需 |

---

## 四、本轮结论

第一轮的修复整体质量很高（内容级 sync 检查、白名单过滤、文档合并都做得漂亮），但**修复本身引入了三处新偏差**：CI 布尔比较失效（H2）、KaTeX 字体缺失（H1）、邮箱数据源与检查覆盖错位（H3）。这正是"修复型提交"的典型风险——建议以后每轮大修后跑一次本仓的两个检查脚本 + 一次 CI 手动触发演练，把 H2 这类"改了但没验证过路径"的问题当场暴露。
