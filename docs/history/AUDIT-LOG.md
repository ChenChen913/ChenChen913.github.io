# 审核与修复历史

> 本文件汇总本项目历次深度审核的**结论**。原始报告的详细论证已随修复一起进入 git 历史，
> 这里只保留「当时发现了什么、怎么处置、留下什么教训」——出问题时可据此回溯。
>
> 上一版本：根目录 `AUDIT-REPORT.md` / `AUDIT-REPORT-2.md` / `AUDIT-REPORT-3.md`（三份原始报告，
> 2026-11-14 合并为本文并归档，原文可在该日期之前的提交中找到）。

## 一览

| 轮次 | 日期 | 范围 | 发现 | 结果 |
|---|---|---|---|---|
| 第一轮 | 2026-08-04 | 全仓库人工审查（模板/样式/脚本/数据/CI/文档） | 17 项（3 高 / 6 中 / 8 低） | 16 项已修，1 项保留为有意取舍 |
| 第二轮 | 2026-08-04 | 逐项验证第一轮 + 全量重审 | 13 项（3 高 / 5 中 / 5 低） | 12 项已修，1 项结论撤销 |
| 第三轮 | 2026-08-06 | Codex Security 全量扫描（75 文件） | 6 项，全部低危 | 全部修复，复扫 0 项 |
| 第四轮 | 2026-11-14 | 部署链路实测 + 线上双站核对 | 2 项严重 + 若干一般 | 已修复并上线验证 |

---

## 第一轮 · 2026-08-04（人工全量审查）

**总体判断**：基础质量明显高于同类个人主页（CI 有死链阻断、Actions 固定完整 SHA、PDF 查看器有路径白名单），问题主要集中在**手工同步的副本**与**文档漂移**上。

| # | 级别 | 问题 | 处置 |
|---|---|---|---|
| 1 | 🔴 | 三套手工同步的页面副本（正式版 / 备案页 / 关闭提示页），邮箱硬编码 4 处 | 备案页保留但升级为内容级校验；邮箱改为 4 处同步 + 脚本校验 |
| 2 | 🔴 | `check_portfolio_sync.py` 硬编码详情页文件名，新增内容后检查静默失效 | 改 glob（`_projects/**/*.md` 等）✅ |
| 3 | 🟡 | 空 body + layout 不输出 `{{ content }}` 的隐式约定 | 保留原设计，靠注释约束（可接受取舍） |
| 4 | 🔴 | 邮箱"防抓取"形同虚设：`mailto:` 与 `<noscript>` 都是明文 | href 与显示文本均改 JS 字符码拼装 ✅ |
| 5 | 🟡 | `javascript:` 链接过滤大小写敏感，可绕过 | 黑名单改 http/https 白名单 + downcase ✅ |
| 6 | 🟡 | 详情页页脚年份硬编码，与 `personal.yml` 双源 | 改从数据文件读取 ✅ |
| 7 | 🟡 | 头像 `<img>` 未声明宽高，可能 CLS | 补 `width`/`height` ✅ |
| 8 | 🟢 | `has_code` 检测是死代码（渲染后不含 ``` ） | 移除 ✅ |
| 9 | 🟢 | `has_math` 对围栏与反引号误报 | 改 front matter `math: true` 开关 ✅ |
| 10 | 🟡 | README 与实际实现脱节（分隔标记、目录树、栏目名） | 全部修正 ✅ |
| 11 | 🟡 | 文档体量过重且重叠（6 份 85KB，DEPLOY/OPTIONS/RUBY-JEKYLL 三份高度重叠） | 合并为 DEPLOY + CONTENT-GUIDE 两份 ✅ |
| 12 | 🟢 | `.gitattributes` / `.editorconfig` 未覆盖 `*.ps1` | 补齐 ✅ |
| 13 | 🟡 | `workflow_dispatch` 无法手动触发部署 | 增加 deploy 输入 ✅ |
| 14 | 🟢 | 巡检与部署共用 concurrency group | 拆成两个 group ✅ |
| 15 | 🟢 | `_site/link-report.json` 来源不明的构建残留 | 本地残留，不入库，无影响 |
| 16 | 🟡 | `backups/` 31MB、12 个子目录，含测试残留 | 清理至 3.2MB，脚本加保留策略 ✅ |
| 17 | 🟢 | `__pycache__/` 本地残留 | 加进 `_config.yml` 的 `exclude` ✅ |

---

## 第二轮 · 2026-08-04（验证 + 重审）

**核心结论**：第一轮 17 项全部处理且质量高，但**修复本身引入了三处新偏差**。这是"修复型提交"的典型风险——改完必须验证实际路径，不能只看代码改没改。

| # | 级别 | 问题 | 处置 |
|---|---|---|---|
| H1 | 🔴 | KaTeX 自托管漏了 `fonts/` 目录（CSS 引用约 60 个字体文件），一旦有 `math: true` 页面必然全 404 | 补齐 0.16.47 的 `fonts/` ✅ |
| H2 | 🔴 | 判定"`github.event.inputs` 是布尔值导致手动部署失效" | **结论撤销**，见下方教训 ✅ |
| H3 | 🔴 | 邮箱"唯一数据源"名不副实：模板里没有任何地方读 `social.email`，且 sync 检查不覆盖两处 JS 数组 | 检查脚本增加 JS 字符码解码比对 ✅ |
| M1 | 🟡 | CONTENT-GUIDE 与 social.yml 对"改邮箱要动几处"说法矛盾 | 统一口径 ✅ |
| M2 | 🟡 | `index_empty.html` 头部注释描述的是已废弃的旧实现 | 更新注释 ✅ |
| M3 | 🟡 | CONTENT-GUIDE 用行号引用（`script.js` 第 66 行），已过期 | 改为"搜索常量名"定位 ✅ |
| M4 | 🟡 | `index.html` 注释指向 DEPLOY.md 第三节，实际是第五节 | 修正 ✅ |
| M5 | 🟡 | `check_portfolio_sync.py` 隐式依赖 PyYAML，CI 未声明 | 新增 `requirements-ci.txt` ✅ |
| L1 | 🟢 | `generate_assets.py` 硬编码 og 图文案，与 `personal.yml` 双源 | 改为从数据文件读取 ✅ |
| L2 | 🟢 | README 目录树未收录新文件 | 已补（但见下方"文档保鲜"教训）✅ |
| L3 | 🟢 | `backup.ps1` 备份清单未含 `docs/`、`.github/` | 补齐 ✅ |
| L4 | 🟢 | TROUBLESHOOTING 的 exclude 示例与现状不一致 | 已加"以 `_config.yml` 为准"说明 ✅ |
| L5 | 🟢 | 备案页标记缩进丢失、`pre-jekyll` 目录不匹配清理正则等杂项 | 按需处理 |

### 教训：`inputs` vs `github.event.inputs`

第二轮把「手动勾选 deploy 反而不部署」判成 P0 bug，并建议把条件改成 `inputs.deploy == 'true'`。
**这个判断是反的**，2026-10-27 已撤销。GitHub 官方文档原文：

> The information in the `inputs` context and `github.event.inputs` context is identical except that
> the `inputs` context **preserves Boolean values as Booleans** instead of converting them to strings.

- `inputs` → 保留布尔 `true`
- `github.event.inputs` → 转成字符串 `'true'`

所以仓库里现有的 `github.event.inputs.deploy == 'true'` 是**对的**；而照那条"修复"改成
`inputs.deploy == 'true'`，因为 Actions 表达式对 `true == 'true'` 做松散比较（向数字转换）结果是 `false`，
才会**真的让手动部署失效**。

**方法教训**：这类类型语义问题必须核对官方文档原文，不能按上下文名字推断。

---

## 第三轮 · 2026-08-06（安全扫描）

工具：Codex Security（standard 模式，全仓库 75 文件，覆盖率 complete）。
6 项全部低危，前提都是"仓库内容被攻击者控制"才有意义（本站在线无用户输入）。

| # | 问题 | 修复 |
|---|---|---|
| 1 | 导航 `id` / `label` 未转义，可存储型 XSS | 加 `\| escape` ✅ |
| 2 | URL 协议校验用子串匹配，`javascript:` 可绕过 | 改按 `://` 前协议段锚定，仅放行 http/https ✅ |
| 3 | KaTeX 0.16.9 有已知 XSS（CVE-2024-28243/28244/28245） | 升级 0.16.47 ✅ |
| 4 | 出版物 PDF 路径未转义，可属性注入 | 属性值加 `\| escape` ✅ |
| 5 | CI 未固定 `pip install pyyaml`，供应链风险 | 新增 `requirements-ci.txt` + `--require-hashes` ✅ |
| 6 | 外链巡检会对内容里任意 URL 发起请求 | 统一 `--disable-external` ✅ |

复扫结果：**0 项**，扫描 ID `1fd1aac3-b8f8-4ab9-a349-01da1b6b4dc1`。

---

## 第四轮 · 2026-11-14（部署链路 + 线上实测）

这一轮不是读代码，而是**实际跑一遍部署链路**。结果发现链路已经断了两周。

| 级别 | 问题 | 处置 |
|---|---|---|
| 🔴 P0 | 部署链路中断：`ubuntu-latest` 默认 Python 升到 3.14，PyYAML 6.0.2 无 cp314 wheel → pip 回退 sdist → 而 PyPI 把 sdist 重新打包过，登记的是旧 hash → `--require-hashes` 直接中断。**10-27 之后任何 push 都上不了线**。 | 补真实 sdist hash + 两个 job 固定 `actions/setup-python` 到 3.13 ✅ |
| 🔴 P1 | `github.io/_headers` 返回 200（1554 字节），内部配置注释可明文下载 | `include` 从 `_config.yml` 移到 `_config.cloudflare.yml` ✅ |
| 🟡 | 定时巡检只跑链接检查，`build-and-deploy` 在 schedule 时被 skip → 部署坏了数周无人知 | 巡检补跑依赖安装 + `check_portfolio_sync.py` ✅ |
| 🟢 | `_config.yml` 的 `exclude` 漏 `__pycache__/` | 已补 ✅ |
| 🟢 | 依赖 PR 积压：其中 activesupport 那个夹带 `json` 2.x → 3.1.0（major） | 三个纯 patch 合并；major 那个关闭并写明后续路径 ✅ |

**为什么两周没被发现**：静态站长期无 push，而定时任务恰好绕开了会失败的那一步。
**教训**：定时任务必须覆盖"真实部署路径"，否则监控只是心理安慰。

---

## 贯穿多轮的教训

1. **修复型提交要验证实际路径，不能只看代码改没改。** 第二轮的 H1/H3 都是"改对了地方但漏了配套"。
2. **手工同步的副本是维护地雷。** 邮箱 4 处、备案页 7 个数据源——每加一处副本，漏改概率就翻一倍。能自动化校验的一定要自动化。
3. **文档引用不要写行号。** 行号是最易碎的引用方式，改成"搜索某个常量/章节标题"更耐久。
4. **类型语义问题查官方文档。** H2 那条把布尔与字符串的转换方向搞反，导致一条错误建议被写进报告并差点被采纳。
5. **监控要盯着真实链路。** 只巡检表面（链接可达）而不覆盖实际部署步骤，会让故障静默数周。

## 值得保持的做法

审核过程中反复被点名为优点的几件事，改代码时不要破坏：

- CI 用 html-proofer 做**阻断式**内部死链检查，外链巡检单独跑且**不阻断部署**——分级合理
- Actions 全部固定到完整 commit SHA，Python 依赖用 `--require-hashes`
- `update-date.py` 写临时文件 + 原子替换，匹配数不为 1 时拒绝写入（防静默过期）
- `backup.ps1` 先暂存后转正、路径越界检查
- 主题/语言防闪烁脚本前置在 `<head>` 同步执行，`prefers-reduced-motion` 全链路尊重
- **每个已知取舍都有注释说明**——这种诚实的注释文化是本项目最值钱的部分
