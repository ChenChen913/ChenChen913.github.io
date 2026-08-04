# 个人主页审核问题修复 Implementation Plan

> **For 执行代理:** 使用 executing-plans 流程逐任务实施。每个任务完成后，**必须先运行该任务"验证"一节中的命令并确认输出符合预期**，再把任务前的 `[ ]` 改为 `[x]`。不得跳步、不得提前打勾。

**Goal:** 修复 AUDIT-REPORT.md 中 17 个编号问题、安全/SEO 可改进项，以及复核中发现的额外问题；最后清理无用文件并推送到 GitHub。

**Architecture:** 本项目是 Jekyll + GitHub Pages 静态站。修复分四类：Python 同步检查升级、Liquid 模板/数据修正、CI 工作流修正、内部文档合并精简；图片资源用 Pillow 脚本生成，第三方前端库改为本地自托管。

**Tech Stack:** Jekyll (Liquid/kramdown)、GitHub Actions、Python 3.13 + Pillow、PowerShell。

**已知约束:** 本机未安装 Ruby，Jekyll 构建/链接检查无法本地执行；模板类修改以静态断言验证，最终由 push 后的 GitHub Actions 构建验证。

---

## 任务清单总览

- [x] Task 0: 创建 docs/plans/ 并加入 Jekyll exclude
- [x] Task 1: check_portfolio_sync.py 升级为内容级校验 + glob（#1 #2）
- [x] Task 2: 邮箱防抓取改为 JS 拼装 href，清理源码明文（#4）
- [x] Task 3: javascript: 黑名单改 http/https 白名单（#5，共 5 处）
- [x] Task 4: 详情页页脚年份从 personal.yml 读取（#6）
- [x] Task 5: 头像 img 补 width/height（#7）
- [x] Task 6: has_code 死代码移除 + has_math 改 front matter 开关（#8 #9）
- [x] Task 7: README / README_EN 修正（#10）
- [x] Task 8: 合并 DEPLOY.md / DEPLOY-OPTIONS.md / RUBY-JEKYLL.md（#11）
- [x] Task 9: .gitattributes / .editorconfig 补 *.ps1（#12）
- [x] Task 10: workflow_dispatch 支持手动部署（#13）
- [x] Task 11: concurrency 按 job 拆分（#14）
- [x] Task 12: 删除过期的 _site/ 构建残留（#15）
- [x] Task 13: backup.ps1 加 -Keep 保留策略并清理 backups/ 测试残留（#16）
- [x] Task 14: 删除 __pycache__/（#17）
- [x] Task 15: backup.ps1 备份清单补全（复核发现 E）
- [x] Task 16: 详情页 PDF URL 拼接健壮化（复核发现 G）
- [x] Task 17: JSON-LD knowsAbout 输出具体技能（复核发现 H）
- [x] Task 18: 生成 og-image.png(1200×630) 与 favicon-32x32.png（SEO #1 #2）
- [x] Task 19: hreflang 静态路径评估结论写入代码注释（SEO #3）
- [x] Task 20: CSP 平台限制记录进 DEPLOY.md（安全可改进）
- [x] Task 21: KaTeX / highlight.js 本地自托管（安全可改进）
- [x] Task 22: 全仓库文档分隔符统一为 PAGE_ENGLISH_SPLIT_2026（复核发现 B）
- [x] Task 23: 最终静态验证套件
- [x] Task 24: 无用文件最终清点与确认
- [x] Task 25: git 提交并推送 GitHub

---

## Task 0: 创建 docs/plans/ 并加入 Jekyll exclude

**关联:** 前置条件（spec 本身含 Liquid 代码示例，若被 Jekyll 处理会破坏构建）

**文件:**
- Modify: `_config.yml`（exclude 列表）

**步骤:**
1. 本文件已创建于 `docs/plans/2026-08-04-fix-audit-issues.md`。
2. 在 `_config.yml` 的 exclude 中新增一行 `- docs/`（目录级排除，防止未来新增计划文档被发布）。

**验证:**
```powershell
Select-String -Path _config.yml -Pattern "docs/" 
```
预期：输出包含 `- docs/` 的那一行。

---

## Task 1: check_portfolio_sync.py 升级为内容级校验 + glob（#1 #2）

**关联问题:** AUDIT #1（同步检查只比对日期标记）、#2（硬编码文件清单）；复核发现 D（portfolio 邮箱 3 处硬编码由校验兜底）

**文件:**
- Modify: `check_portfolio_sync.py`

**步骤:**
1. 保留"最后同步：YYYY-MM-DD"标记日期检查，但路径改为 glob：`_data/**/*.yml`、`_projects/**/*.md`、`_publications/**/*.md`；若某类路径为空则报错。
2. 新增内容级校验：从 `_data/*.yml` 与两个详情页 front matter 提取关键字段（姓名、tagline、邮箱、学校、荣誉、课程、经历角色/公司/时间/要点、技能项、项目/论文的 title/desc/meta/type/tech），逐项断言 `portfolio-single-file.html` 的 HTML 反转义文本包含该字段；缺失则输出缺失清单并以退出码 1 失败。
3. 拆出可单测函数：`load_data()`、`expected_fragments()`、`verify_fragments(text, frags)`、`check_content()`。

> 执行注记：校验时发现论文 `tech` 字段在线上任何页面均不渲染（仅项目卡片渲染 tech），故校验范围调整为只断言线上实际展示的字段，代码内已加注释说明。

**验证:**
```powershell
python check_portfolio_sync.py
```
预期：输出 `portfolio 同步检查通过`，退出码 0。
```powershell
@'
import check_portfolio_sync as c
text = open(c.portfolio, encoding="utf-8").read()
missing = c.verify_fragments(text, ["这个字段肯定不存在-xyz"])
print("missing:", missing)
assert missing, "负向测试应返回缺失项"
'@ | python -
```
预期：打印 `missing: ['这个字段肯定不存在-xyz']`，无异常。

---

## Task 2: 邮箱防抓取改为 JS 拼装 href，清理源码明文（#4）

**关联问题:** AUDIT #4；复核发现 C（index_empty.html 注释自相矛盾）、D（portfolio 冗余数组）

**文件:**
- Modify: `_layouts/default.html`
- Modify: `index_empty.html`
- Modify: `_data/social.yml`（注释）
- Modify: `portfolio-single-file.html`（删除冗余 JS 字符码数组，保留明文并注明离线页可接受）

**步骤:**
1. `default.html`：邮箱链接初始 `href="#"`，`<noscript>` 只写"请启用 JavaScript 查看邮箱 / Enable JavaScript to view email"（不再出现邮箱明文）；JS 同时设置 `a.href = 'mailto:' + addr` 与 `a.textContent = addr`；更新注释说明源码中不再有明文邮箱。
2. `index_empty.html`：两个邮箱链接（email-link / email-link-en）同样处理；noscript 分别显示中/英文提示；更新文件头注释，如实说明 href/noscript 由 Jekyll 数据注入、仅 JS 数组硬编码。
3. `social.yml`：更新注释，说明邮箱唯一数据源 + default/index_empty 两处 JS 数组 + portfolio 明文（由 sync 校验兜底）。
4. `portfolio-single-file.html`：删除 `String.fromCharCode` 字符码数组（离线备案页明文可接受），避免无意义的三处硬编码。

**验证:**
```powershell
Select-String -Path "_layouts\default.html","index_empty.html" -Pattern "wcn913@gmail.com|href=\"mailto:"
```
预期：无输出。
```powershell
Select-String -Path "portfolio-single-file.html" -Pattern "String.fromCharCode"
```
预期：无输出。
```powershell
python -c "codes=[119,99,110,57,49,51,64,103,109,97,105,108,46,99,111,109]; print(''.join(map(chr,codes)))"
```
预期：`wcn913@gmail.com`（数组仍能正确解码）。

---

## Task 3: javascript: 黑名单改 http/https 白名单（#5）

**关联问题:** AUDIT #5（实际 5 处而非 3 处）

**文件:**
- Modify: `_layouts/default.html`

**步骤:**
1. 项目链接 2 处：循环内先 `{% assign gh = proj.github | downcase %}` / `{% assign dh = proj.demo | downcase %}`，仅当包含 `http://` 或 `https://` 时输出链接，否则 `href="#"`。
2. 社交链接 3 处：对 `s.github` / `s.gitee` / `s.x` 同样先 downcase 再白名单判断。
3. 保留原有的 `proj.github != '#'` 外包装与 `escape` / `rel="noopener noreferrer"`。

**验证:**
```powershell
Select-String -Path "_layouts\default.html" -Pattern "contains 'javascript:'"
```
预期：无输出。
```powershell
Select-String -Path "_layouts\default.html" -Pattern "downcase|'http://'"
```
预期：共出现 10 处（5 个 downcase + 5 个 http://）。

---

## Task 4: 详情页页脚年份从 personal.yml 读取（#6）

**关联问题:** AUDIT #6

**文件:**
- Modify: `_layouts/detail.html`

**步骤:**
1. 删除硬编码 `&copy; 2026`，改为 `<span class="detail-zh">{{ p.footer_copyright | escape }}</span><span class="detail-en">{{ p_en.footer_copyright | escape }}</span>`。

**验证:**
```powershell
Select-String -Path "_layouts\detail.html" -Pattern "&copy; 2026"
```
预期：无输出。
```powershell
Select-String -Path "_layouts\detail.html" -Pattern "footer_copyright"
```
预期：输出 2 行（zh/en）。

---

## Task 5: 头像 img 补 width/height（#7）

**关联问题:** AUDIT #7

**文件:**
- Modify: `_layouts/default.html`

**步骤:**
1. 头像 `<img>` 增加 `width="112" height="144"`（与 CSS `.avatar` 一致）。

**验证:**
```powershell
Select-String -Path "_layouts\default.html" -Pattern "avatar.jpg"
```
预期：包含 `width="112" height="144"` 的那一行（og:image 两行除外）。

---

## Task 6: has_code 死代码移除 + has_math 改 front matter 开关（#8 #9）

**关联问题:** AUDIT #8（`content contains '```'` 恒 false）、#9（~~~ 围栏/行内反引号误报）

**文件:**
- Modify: `_layouts/detail.html`

**步骤:**
1. `has_math` 改为 `{% assign has_math = page.math | default: false %}`，注释说明：正文含公式的页面需在 front matter 写 `math: true`，不再猜测正文（彻底消除 ```/~~~ 围栏与行内反引号误报）。
2. `has_code` 移除 `content contains '```'`，只保留渲染后 `content contains '<pre'`。
3. 删除原"已知取舍"注释中关于 ~~~ 与行内反引号的部分。

**验证:**
```powershell
Select-String -Path "_layouts\detail.html" -Pattern "'```'"
```
预期：无输出。
```powershell
Select-String -Path "_layouts\detail.html" -Pattern "page.math"
```
预期：输出包含 `page.math` 的行。

---

## Task 7: README / README_EN 修正（#10）

**关联问题:** AUDIT #10

**文件:**
- Modify: `README.md`
- Modify: `README_EN.md`

**步骤:**
1. 两处 `<!-- English -->` 全部改为 `<!-- PAGE_ENGLISH_SPLIT_2026 -->`。
2. 目录树补充 `404.html`、`index_empty.html`、`portfolio-single-file.html`、`check_portfolio_sync.py`、`backup.ps1`。
3. `experience.yml` 注释由"实践经历"改为"工作经历"（README_EN 同步）。

**验证:**
```powershell
Select-String -Path "README.md","README_EN.md" -Pattern "<!-- English -->"
```
预期：无输出。
```powershell
Select-String -Path "README.md" -Pattern "PAGE_ENGLISH_SPLIT_2026|backup.ps1|check_portfolio_sync.py|404.html|index_empty.html"
```
预期：全部有输出。

---

## Task 8: 合并 DEPLOY.md / DEPLOY-OPTIONS.md / RUBY-JEKYLL.md（#11）

**关联问题:** AUDIT #11（文档重叠、体量过大）

**文件:**
- Rewrite: `DEPLOY.md`（合并三份内容、去重、统一分隔符）
- Delete: `DEPLOY-OPTIONS.md`
- Delete: `RUBY-JEKYLL.md`
- Modify: `_config.yml`（exclude 移除已删除文件）
- Modify: 所有引用 `DEPLOY-OPTIONS.md` / `RUBY-JEKYLL.md` 的文件

**步骤:**
1. 通读三份文档，将唯一内容（GitHub/Gitee/Cloudflare/Netlify/Vercel 部署步骤、Ruby/Jekyll 速查、AI 操作禁区、备份机制、验证清单）合并进新的 `DEPLOY.md`，重复章节只保留一份；总规模控制在原三份合计的 60% 以内。
2. 新文档中的分隔符统一写 `<!-- PAGE_ENGLISH_SPLIT_2026 -->`。
3. 删除 `DEPLOY-OPTIONS.md`、`RUBY-JEKYLL.md`；`_config.yml` exclude 同步删除这两行。
4. 全文搜索并更新对这两个文件的引用。

**验证:**
```powershell
Test-Path "DEPLOY-OPTIONS.md","RUBY-JEKYLL.md"
```
预期：均为 False。
```powershell
Get-ChildItem -File -Filter *.md | Where-Object { $_.Name -in @("DEPLOY.md","DEPLOY-OPTIONS.md","RUBY-JEKYLL.md") } | Measure-Object -Property Length -Sum
```
预期：只剩 DEPLOY.md，且字节数明显小于合并前三份之和（约 45.9 KB）。
```powershell
Get-ChildItem -Recurse -File -Include *.md | Select-String -Pattern "DEPLOY-OPTIONS\.md|RUBY-JEKYLL\.md"
```
预期：无输出（git 历史除外）。

---

## Task 9: .gitattributes / .editorconfig 补 *.ps1（#12）

**关联问题:** AUDIT #12

**文件:**
- Modify: `.gitattributes`
- Modify: `.editorconfig`
- Modify: `backup.ps1`（顺带统一为 LF 行尾，避免后续编辑产生混排行尾）

**步骤:**
1. `.gitattributes` 增加 `*.ps1 text eol=lf`（注释说明现代 PowerShell 兼容 LF）。
2. `.editorconfig` 增加 `[*.ps1]` 段，`end_of_line = lf`。
3. `backup.ps1` 统一为 LF（当前混排 CRLF/LF）。

**验证:**
```powershell
Select-String -Path ".gitattributes",".editorconfig" -Pattern "\*\.ps1"
```
预期：两文件均有输出。
```powershell
python -c "b=open('backup.ps1','rb').read(); print('CRLF', b.count(b'\r\n'), 'LF', b.count(b'\n')-b.count(b'\r\n'))"
```
预期：`CRLF 0`。

---

## Task 10: workflow_dispatch 支持手动部署（#13）

**关联问题:** AUDIT #13

**文件:**
- Modify: `.github/workflows/deploy.yml`

**步骤:**
1. `workflow_dispatch` 增加布尔输入 `deploy`（默认 false，描述"强制重新部署"）。
2. `build-and-deploy` 条件改为：`github.event_name == 'push' || (github.event_name == 'workflow_dispatch' && github.event.inputs.deploy == 'true')`。
3. `check-external-links` 条件改为：`github.event_name == 'schedule' || (github.event_name == 'workflow_dispatch' && github.event.inputs.deploy != 'true')`（手动部署时不再重复跑外链巡检）。

**验证:**
```powershell
python -c "import yaml; d=yaml.safe_load(open('.github/workflows/deploy.yml',encoding='utf-8')); print(d['on']['workflow_dispatch']['inputs']); print(d['jobs']['build-and-deploy']['if']); print(d['jobs']['check-external-links']['if'])"
```
预期：输出 inputs 字典与两个 if 表达式，内容与步骤一致。

---

## Task 11: concurrency 按 job 拆分（#14）

**关联问题:** AUDIT #14

**文件:**
- Modify: `.github/workflows/deploy.yml`

**步骤:**
1. 删除顶层 `concurrency`。
2. `build-and-deploy` 增加 job 级 `concurrency: group: "pages-deploy"`，`cancel-in-progress: false`。
3. `check-external-links` 增加 job 级 `concurrency: group: "pages-links"`，`cancel-in-progress: false`。

**验证:**
```powershell
python -c "import yaml; d=yaml.safe_load(open('.github/workflows/deploy.yml',encoding='utf-8')); print('top:', d.get('concurrency')); print('deploy:', d['jobs']['build-and-deploy']['concurrency']); print('links:', d['jobs']['check-external-links']['concurrency'])"
```
预期：`top: None`，两个 job 各有独立 group。

---

## Task 12: 删除过期的 _site/ 构建残留（#15）

**关联问题:** AUDIT #15（link-report.json 来源不明、_site 与源不同步）

**文件:**
- Delete: `_site/`（gitignored 构建产物，可安全重建）

**步骤:**
1. 先解析绝对路径并确认位于仓库根内，再递归删除 `_site/`。

**验证:**
```powershell
Test-Path "_site"
```
预期：False。

---

## Task 13: backup.ps1 加 -Keep 保留策略并清理 backups/ 测试残留（#16）

**关联问题:** AUDIT #16

**文件:**
- Modify: `backup.ps1`
- Delete: `backups/` 下 10 个测试残留/重复归档目录（保留最新正式备份与 pre-jekyll 历史备份）

**步骤:**
1. 新增参数 `[int]$Keep = 3`（默认保留最近 3 份）。
2. 备份成功转正后，按目录名倒序收集 `backups/*` 中符合 `^\d{4}-\d{2}-\d{2}-` 的目录，保留最近 `$Keep` 份，其余在**逐目录解析绝对路径并确认位于 $BackupRoot 内**后递归删除，并打印被清理的目录。
3. 手动清理：保留 `2026-08-01-b2-205745`（最新正式备份）与 `pre-jekyll-2026-07-04`（历史快照），删除其余 10 个目录（含 ____evil / ____evil2 / outside / test / b2-旧 / reg / reg-旧 / test-旧 / v1 / 2026-07-04-stable）。删除前逐个解析并校验绝对路径。

**验证:**
```powershell
Get-ChildItem backups -Directory | Select-Object -ExpandProperty Name
```
预期：仅 `2026-08-01-b2-205745` 与 `pre-jekyll-2026-07-04`。
```powershell
Select-String -Path "backup.ps1" -Pattern "Keep|Remove-Item.*Recurse"
```
预期：输出 -Keep 参数与清理逻辑。

---

## Task 14: 删除 __pycache__/（#17）

**关联问题:** AUDIT #17

**文件:**
- Delete: `__pycache__/`

**步骤:**
1. 解析绝对路径确认位于仓库根内，递归删除。

**验证:**
```powershell
Test-Path "__pycache__"
```
预期：False。

---

## Task 15: backup.ps1 备份清单补全（复核发现 E）

**关联问题:** 复核发现 E（备份不包含同步检查脚本、单文件页、Gemfile 等）

**文件:**
- Modify: `backup.ps1`

**步骤:**
1. `$CoreItems` 增加：`portfolio-single-file.html`、`check_portfolio_sync.py`、`update-date.py`、`generate_assets.py`（Task 18 创建）、`backup.ps1`、`Gemfile`、`Gemfile.lock`。

**验证:**
```powershell
Select-String -Path "backup.ps1" -Pattern "portfolio-single-file|check_portfolio_sync|generate_assets|Gemfile"
```
预期：全部有输出。

---

## Task 16: 详情页 PDF URL 拼接健壮化（复核发现 G）

**关联问题:** 复核发现 G（`prepend` 假设 pdf 字段是裸文件名）

**文件:**
- Modify: `_layouts/detail.html`

**步骤:**
1. 构造 pdf 路径前先 `remove_first: '/'`，并跳过含 `..` 的值：`{% assign _pdf = page.zh.pdf | remove_first: '/' %}{% unless _pdf contains '..' %}`。
2. 中英文 pdf 均按此处理，注释说明 pdf 字段约定为裸文件名。

**验证:**
```powershell
Select-String -Path "_layouts\detail.html" -Pattern "remove_first|contains '\.\.'"
```
预期：有输出。

---

## Task 17: JSON-LD knowsAbout 输出具体技能（复核发现 H）

**关联问题:** 复核发现 H（currently 输出分类名而非技能）

**文件:**
- Modify: `_layouts/default.html`

**步骤:**
1. `knowsAbout` 改为双重循环输出每个分类下的 `cat.items`，逗号处理用 `forloop.parentloop.last and forloop.last`。

**验证:**
```powershell
Select-String -Path "_layouts\default.html" -Pattern "parentloop.last"
```
预期：有输出。
```powershell
Select-String -Path "_layouts\default.html" -Pattern "cat.category \| jsonify"
```
预期：无输出。

---

## Task 18: 生成 og-image.png(1200×630) 与 favicon-32x32.png（SEO #1 #2）

**关联问题:** AUDIT 七节 #1（og:image 竖版证件照）、#2（无 PNG favicon）

**文件:**
- Create: `generate_assets.py`（Pillow 脚本，可重复生成两张图）
- Create: `assets/og-image.png`（1200×630）
- Create: `assets/favicon-32x32.png`（32×32，复刻 favicon.svg 的 W 形）
- Modify: `_layouts/default.html`、`_layouts/detail.html`（og:image 指向新图 + width/height meta；head 加 PNG favicon link）
- Modify: `404.html`、`index_empty.html`（head 加 PNG favicon link）
- Modify: `_config.yml`（exclude 加 `generate_assets.py`）
- Modify: `README.md` / `README_EN.md`（目录树加 generate_assets.py）

**步骤:**
1. 用 Pillow 生成两张图：og-image 浅色卡片（名称、副标题、网址、accent 色条），favicon 32×32 圆角矩形 #4A6FA0 + 白色 W。
2. 更新模板引用与 meta。

**验证:**
```powershell
python -c "from PIL import Image; a=Image.open('assets/og-image.png'); f=Image.open('assets/favicon-32x32.png'); print(a.size, f.size)"
```
预期：`(1200, 630) (32, 32)`。
```powershell
Select-String -Path "_layouts\default.html","_layouts\detail.html" -Pattern "og-image.png|og:image:width|favicon-32x32"
```
预期：全部有输出。

---

## Task 19: hreflang 静态路径评估结论写入代码注释（SEO #3）

**关联问题:** AUDIT 七节 #3（?lang= 查询参数 hreflang 支持有限）

**文件:**
- Modify: `_layouts/detail.html`

**步骤:**
1. 在现有 hreflang 注释后补充评估结论：GitHub Pages 无插件环境下实现 /en/ 真静态路径需重复内容源，与单一数据源原则冲突，故保留 query 方案并持续文档化。

**验证:**
```powershell
Select-String -Path "_layouts\detail.html" -Pattern "重复内容源|单一数据源"
```
预期：有输出。

---

## Task 20: CSP 平台限制记录进 DEPLOY.md（安全可改进）

**关联问题:** AUDIT 六节（无 CSP，平台限制）

**文件:**
- Modify: `DEPLOY.md`

**步骤:**
1. 新增"安全与平台限制"小节：GitHub Pages 不支持自定义响应头（无 CSP）；说明本站外部依赖策略（自托管 + SRI）。

**验证:**
```powershell
Select-String -Path "DEPLOY.md" -Pattern "CSP|自定义响应头"
```
预期：有输出。

---

## Task 21: KaTeX / highlight.js 本地自托管（安全可改进）

**关联问题:** AUDIT 六节（cdnjs 无本地 fallback、供应链面）

**文件:**
- Create: `assets/vendor/katex/katex.min.css`、`katex.min.js`、`auto-render.min.js`
- Create: `assets/vendor/highlight/highlight.min.js`、`github.min.css`
- Modify: `_layouts/detail.html`

**步骤:**
1. 从 cdnjs 下载 5 个文件到 `assets/vendor/` 对应目录。
2. `detail.html` 中所有 cdnjs 引用改为 `{{ '/assets/vendor/...' | relative_url }}`，移除 integrity/crossorigin 属性，注释说明本地自托管与来源版本。

**验证:**
```powershell
Get-ChildItem assets\vendor -Recurse -File | Select-Object FullName,Length
```
预期：5 个文件，katex.min.js/auto-render/highlight 等大小正常（KB 级）。
```powershell
Select-String -Path "_layouts\detail.html" -Pattern "cdnjs"
```
预期：无输出。

---

## Task 22: 全仓库文档分隔符统一为 PAGE_ENGLISH_SPLIT_2026（复核发现 B）

**关联问题:** 复核发现 B（`<!-- English -->` 残留在 5 份文档）

**文件:**
- Modify: `DEPLOY.md`、`CONTENT-GUIDE.md`、`TROUBLESHOOTING.md`（README 已在 Task 7 处理）

**步骤:**
1. 三份文档中所有 `<!-- English -->` 替换为 `<!-- PAGE_ENGLISH_SPLIT_2026 -->`，并顺带核对示例正文。

**验证:**
```powershell
Get-ChildItem -Recurse -File -Include *.md | Select-String -Pattern "<!-- English -->"
```
预期：无输出。

---

## Task 23: 最终静态验证套件

**关联问题:** 全局回归

**步骤:**
1. `python -m py_compile check_portfolio_sync.py update-date.py generate_assets.py`
2. `node --check script.js`
3. PyYAML 解析 `_data/**/*.yml` 与 `_config.yml`
4. `python check_portfolio_sync.py`
5. 全量 grep 断言：`wcn913@gmail.com` 仅出现在 social.yml / portfolio；`contains 'javascript:'` 为 0；`<!-- English -->` 为 0；`&copy; 2026` 在 detail.html 为 0；`cdnjs` 在 _layouts 为 0。
6. `git status --short` 检查待提交清单符合预期。

**验证:**
```powershell
python -m py_compile check_portfolio_sync.py update-date.py generate_assets.py; node --check script.js; python check_portfolio_sync.py; git status --short
```
预期：全部无错误，sync 检查通过，git status 只列出预期修改/新增/删除。

---

## Task 24: 无用文件最终清点与确认

**关联问题:** 用户要求"删除附加的没有用的文件"

**步骤:**
1. 确认 `_site/`、`__pycache__/`、`backups/` 测试残留、`DEPLOY-OPTIONS.md`、`RUBY-JEKYLL.md` 均已删除。
2. 检查仓库根与子目录是否存在其他杂物（`*.tmp`、`*.log`、孤立的 `link-report.json` 等），如有且确认无用则删除。

**验证:**
```powershell
Get-ChildItem -Force | Select-Object Name
```
预期：根目录只有预期文件，无 _site/__pycache__/backups 残留、无临时文件。

---

## Task 25: git 提交并推送 GitHub

**关联问题:** 用户要求推送

**步骤:**
1. `git add -A`
2. `git commit -m "fix: 按审核报告修复同步检查/邮箱混淆/链接白名单/文档合并/CI 改进等 25 项问题"`
3. `git push origin main`
4. 确认 push 后本地与远程同步，Actions 将自动构建验证。

**验证:**
```powershell
git status --short; git log -1 --oneline; git push origin main
```
预期：status 为空、log 显示新提交、push 成功。
