# 个人主页第二轮审核问题修复 Implementation Plan（AUDIT-REPORT-2）

> **For 执行代理:** 逐任务实施。每个任务完成后，**必须先运行该任务"验证"一节中的命令并确认输出符合预期**，再把任务清单中的 `[ ]` 改为 `[x]`。不得跳步、不得提前打勾。
>
> 第一轮 spec：`docs/plans/2026-08-04-fix-audit-issues.md`（已全部完成）。

**Goal:** 修复 `AUDIT-REPORT-2.md` 中经复核确认为真的问题（H1/H3/M1-M5/L1-L3/L5a/L5b），明确 H2、L5c 为报告误判不修；最后清理无用文件并推送到 GitHub。

**Architecture:** 本项目是 Jekyll + GitHub Pages 静态站。本轮修复分四类：KaTeX 自托管字体补全（H1）、邮箱同步检查覆盖 JS 字符码数组（H3）、内部文档口径与过期注释统一（M1-M4）、CI 声明 PyYAML 依赖（M5）、脚本/文档/备份清单数据源化与补全（L1-L3/L5）；H2（CI 布尔比较写法正确）与 L5c（`_site` 已不存在）不修改。

**Tech Stack:** Jekyll (Liquid/kramdown)、GitHub Actions、Python 3.13 + Pillow + PyYAML、PowerShell。

**已知约束:** 本机未安装 Ruby，Jekyll 构建无法本地执行；模板类修改以静态断言验证，最终由 push 后的 GitHub Actions 构建验证。GitHub 443 直连不稳定，push 失败时重试。

---

## 任务清单总览

- [x] Task 0: 创建本 spec 文档（docs/ 已排除出 Jekyll 构建）
- [x] Task 1: H1 补全 KaTeX fonts/ 目录（20 个 woff2）
- [x] Task 2: H3 check_portfolio_sync.py 增加 JS 字符码数组邮箱校验
- [x] Task 3: M1 统一邮箱修改口径（CONTENT-GUIDE / social.yml / default.html 注释）
- [x] Task 4: M2 更新 index_empty.html 过期注释
- [x] Task 5: M3 CONTENT-GUIDE 行号引用改为搜索定位
- [x] Task 6: M4 index.html 注释节号改为第五节
- [x] Task 7: M5 deploy.yml 显式安装 PyYAML
- [x] Task 8: L1 generate_assets.py 从数据文件读取姓名/tagline/URL
- [x] Task 9: L2 README / README_EN 目录树补全
- [x] Task 10: L3 backup.ps1 备份清单补 docs/.github/robots.txt
- [x] Task 11: L4 已核实无需修改（TROUBLESHOOTING 已有"以 _config.yml 为准"说明）
- [x] Task 12: L5a+复核补充 修正 portfolio 注释缩进与过期的"字符码数组/noscript 兜底"描述
- [x] Task 13: L5b backup.ps1 注明 pre-jekyll 备份为有意保留
- [x] Task 14: 清理无用文件（__pycache__/临时文件等）
- [ ] Task 15: 提交（含 AUDIT-REPORT-2.md 与 _config.yml）并推送 GitHub

> 明确不修：H2（`github.event.inputs.deploy == 'true'` 是 workflow_dispatch 布尔输入的正确写法，见 actions/runner#3571）、L5c（`_site` 当前不存在）。

---

## Task 0: 创建本 spec 文档

**关联:** 前置条件（spec 含 Liquid/YAML 代码示例，必须放在已排除的 `docs/` 下）

**文件:**
- Create: `docs/plans/2026-08-04-fix-audit-2-issues.md`

**步骤:**
1. 本文件已创建。
2. 确认 `_config.yml` exclude 已含 `docs/`（第一轮已加，当前仍存在）。

**验证:**
```powershell
Select-String -Path _config.yml -Pattern "- docs/"
```
预期：输出包含 `- docs/` 的行。

---

## Task 1: H1 补全 KaTeX fonts/ 目录

**关联问题:** AUDIT-REPORT-2 H1（`assets/vendor/katex/` 无 fonts/，katex.min.css 引用 60 个字体文件，任何 `math: true` 页面会字体 404）

**文件:**
- Create: `assets/vendor/katex/fonts/KaTeX_*.woff2`（20 个）

**步骤:**
1. 从 cdnjs KaTeX 0.16.9 下载 20 个 woff2 字体到 `assets/vendor/katex/fonts/`：`KaTeX_AMS-Regular`、`KaTeX_Caligraphic-Bold`、`KaTeX_Caligraphic-Regular`、`KaTeX_Fraktur-Bold`、`KaTeX_Fraktur-Regular`、`KaTeX_Main-Bold`、`KaTeX_Main-BoldItalic`、`KaTeX_Main-Italic`、`KaTeX_Main-Regular`、`KaTeX_Math-BoldItalic`、`KaTeX_Math-Italic`、`KaTeX_SansSerif-Bold`、`KaTeX_SansSerif-Italic`、`KaTeX_SansSerif-Regular`、`KaTeX_Script-Regular`、`KaTeX_Size1-Regular`、`KaTeX_Size2-Regular`、`KaTeX_Size3-Regular`、`KaTeX_Size4-Regular`、`KaTeX_Typewriter-Regular`（各 `.woff2`）。
2. 下载失败重试 2 次；全部完成后清理空文件。

**验证:**
```powershell
$refs = Select-String -Path assets/vendor/katex/katex.min.css -Pattern 'fonts/(KaTeX_[A-Za-z0-9-]+\.woff2)' -AllMatches |
  ForEach-Object { $_.Matches } | ForEach-Object { $_.Groups[1].Value } | Sort-Object -Unique
$missing = $refs | Where-Object { -not (Test-Path "assets/vendor/katex/fonts/$_") }
Write-Output "refs=$($refs.Count) missing=$($missing.Count)"
$missing
```
预期：`refs=20 missing=0`，无输出缺失项；每个文件长度 > 0。

---

## Task 2: H3 邮箱同步检查覆盖 JS 字符码数组

**关联问题:** AUDIT-REPORT-2 H3（模板已无 `social.email`；邮箱实际在 default.html / index_empty.html 的 JS 字符码数组 + portfolio 明文；sync 只校验 portfolio，改漏 JS 数组会全绿）

**文件:**
- Modify: `check_portfolio_sync.py`

**步骤:**
1. 新增常量 `EMAIL_ARRAY_FILES`，指向 `_layouts/default.html` 与 `index_empty.html`。
2. 新增可单测函数：

```python
def extract_email_from_codes(text):
    """提取 'var codes = [...]' 并用 String.fromCharCode 规则解码为邮箱；找不到返回 None。"""
    matches = re.findall(r"var codes\s*=\s*\[([^\]]+)\]", text)
    if not matches:
        return None
    try:
        return "".join(chr(int(c)) for c in re.split(r"\s*,\s*", matches[0]))
    except ValueError:
        return None

def check_email_arrays(data):
    """防抓取 JS 字符码数组必须与 social.yml 的 email 一致。"""
    expected = (data.get("social") or {}).get("email")
    if not expected:
        print("错误：_data/social.yml 缺少 email 字段。", file=sys.stderr)
        return False
    ok = True
    for path in EMAIL_ARRAY_FILES:
        try:
            with open(path, encoding="utf-8") as f:
                text = f.read()
        except OSError as e:
            print(f"错误：无法读取 {path}：{e}", file=sys.stderr)
            return False
        actual = extract_email_from_codes(text)
        if actual is None:
            print(f"错误：{path} 未找到 JS 字符码数组（var codes = [...]）。", file=sys.stderr)
            ok = False
        elif actual != expected:
            print(f"错误：{path} 的字符码数组解码为 {actual!r}，与 social.yml email {expected!r} 不一致。", file=sys.stderr)
            ok = False
    if ok:
        print(f"邮箱 JS 字符码数组校验通过（{len(EMAIL_ARRAY_FILES)} 处与 social.yml 一致）。")
    return ok
```

3. `check_content(data)` 改为接收已加载的 data；`main()` 改为 `data = load_data()`，依次执行 `check_content(data)`、`check_email_arrays(data)`、`check_marker_freshness()`，任一失败则退出码 1。

**验证:**
```powershell
python check_portfolio_sync.py
```
预期：输出包含 `邮箱 JS 字符码数组校验通过（2 处与 social.yml 一致）` 与 `portfolio 同步检查通过`，退出码 0。

```powershell
@'
import check_portfolio_sync as c
assert c.extract_email_from_codes("var codes = [119, 99, 110]") == "wcn"
assert c.check_email_arrays({"social": {"email": "wrong@example.com"}}) is False
print("negative-ok")
'@ | python -
```
预期：打印 `negative-ok`（错误邮箱会被检出，返回 False）。

---

## Task 3: M1 统一邮箱修改口径

**关联问题:** AUDIT-REPORT-2 M1（CONTENT-GUIDE 3.2 写"改 social.yml 即可"；social.yml 注释写"改本文件+两处 JS 数组"，漏 portfolio；default.html 注释"唯一数据源/两处同步"含糊）

**文件:**
- Modify: `CONTENT-GUIDE.md`（3.2 节 + 常见操作速查表"改邮箱"行）
- Modify: `_data/social.yml`（注释）
- Modify: `_layouts/default.html`（邮箱注释）

**步骤:**
1. `CONTENT-GUIDE.md` 3.2：改为"邮箱以外的联系方式编辑 `_data/social.yml` 对应字段即可；**改邮箱需同步 4 处**：`_data/social.yml` 的 `email`、`_layouts/default.html` 的 JS 字符码数组、`index_empty.html` 的 JS 字符码数组、`portfolio-single-file.html` 明文邮箱（`check_portfolio_sync.py` 会自动校验后 3 处与第 1 处一致）"。保留"联系方式均为真实有效账号"警告。
2. 速查表"改邮箱"行：怎么改列改为"`email` 字段 + 3 处防抓取副本（见 3.2）"。
3. `social.yml` 注释：删除"邮箱唯一数据源是本文件"，改为"邮箱以本文件为准；防抓取副本位于 default.html 与 index_empty.html 的 JS 字符码数组，portfolio 为明文离线副本；修改邮箱时同步这 4 处，sync 脚本自动校验一致性"。
4. `default.html` 邮箱注释：改为"邮箱数据以 _data/social.yml 为准；修改邮箱时同步本文件 JS 数组、index_empty.html JS 数组与 portfolio 明文（check_portfolio_sync.py 自动校验）"。

**验证:**
```powershell
Select-String -Path CONTENT-GUIDE.md -Pattern "同步 4 处|真实有效"
Select-String -Path _data/social.yml -Pattern "邮箱以本文件为准|4 处"
Select-String -Path _layouts/default.html -Pattern "以 _data/social.yml 为准"
Select-String -Path CONTENT-GUIDE.md -Pattern "改 `_data/social.yml`，改对应字段即可"
```
预期：前三组各至少命中 1 行；最后一组无输出（旧说法已删除）。

---

## Task 4: M2 更新 index_empty.html 过期注释

**关联问题:** AUDIT-REPORT-2 M2（注释仍写"href 与 noscript 由 Liquid 注入"，实际为 `href="#"` + JS）

**文件:**
- Modify: `index_empty.html`

**步骤:**
1. 将文件头注释中"邮箱 href 与 noscript 文本由 Liquid 从 `_data/social.yml` 注入；唯一硬编码副本是下方 JS 字符码数组……"改为："邮箱 href 与显示文本均由 JS 用字符码拼装（防简单抓取），noscript 仅提示启用 JS。邮箱数据以 `_data/social.yml` 为准；修改邮箱时同步本文件 JS 数组、`_layouts/default.html` 的 JS 数组与 `portfolio-single-file.html` 明文（sync 校验兜底）。"

**验证:**
```powershell
Select-String -Path index_empty.html -Pattern "Liquid 从|唯一硬编码副本"
Select-String -Path index_empty.html -Pattern "均由 JS 用字符码拼装"
```
预期：第一组无输出；第二组命中。

---

## Task 5: M3 CONTENT-GUIDE 行号引用改为搜索定位

**关联问题:** AUDIT-REPORT-2 M3（NAV_OFFSET 实际在 script.js L88，文档写 66；scroll-margin-top 实际在 style.css L65，文档写 61）

**文件:**
- Modify: `CONTENT-GUIDE.md`（"绝对不能碰的文件"表）

**步骤:**
1. `style.css` 行：`第 61 行的 scroll-margin-top` → `scroll-margin-top 声明（用搜索定位，当前约在第 65 行）`。
2. `script.js` 行：`NAV_OFFSET（第 66 行，值 80）` → `NAV_OFFSET 常量（用搜索定位，当前约在第 88 行，值 80）`。

**验证:**
```powershell
Select-String -Path CONTENT-GUIDE.md -Pattern "第 66 行|第 61 行"
Select-String -Path CONTENT-GUIDE.md -Pattern "用搜索定位"
```
预期：第一组无输出；第二组命中 2 行。

---

## Task 6: M4 index.html 注释节号改为第五节

**关联问题:** AUDIT-REPORT-2 M4（注释写"DEPLOY.md 第三节本地预览"，合并后本地预览是第五节）

**文件:**
- Modify: `index.html`

**步骤:**
1. `详见 DEPLOY.md 第三节"本地预览"。` → `详见 DEPLOY.md 第五节"本地预览"。`

**验证:**
```powershell
Select-String -Path index.html -Pattern '第五节"本地预览"'
Select-String -Path index.html -Pattern '第三节"本地预览"'
```
预期：第一组命中；第二组无输出。

---

## Task 7: M5 deploy.yml 显式安装 PyYAML

**关联问题:** AUDIT-REPORT-2 M5（`check_portfolio_sync.py` import yaml，但 CI 未声明安装；当前靠 ubuntu-latest 镜像预装）

**文件:**
- Modify: `.github/workflows/deploy.yml`

**步骤:**
1. "Check portfolio sync freshness" 步骤改为：

```yaml
      - name: Check portfolio sync freshness
        run: |
          python -m pip install pyyaml --quiet
          python check_portfolio_sync.py
```

**验证:**
```powershell
Select-String -Path .github/workflows/deploy.yml -Pattern "pip install pyyaml"
```
预期：命中 1 行。

---

## Task 8: L1 generate_assets.py 数据源化

**关联问题:** AUDIT-REPORT-2 L1（L67-69 硬编码姓名/tagline/URL，与 personal.yml 双源）

**文件:**
- Modify: `generate_assets.py`

**步骤:**
1. 顶部增加 `import yaml`。
2. `generate_og_image()` 开头从数据读取：

```python
    with open(os.path.join(ROOT, "_data", "personal.yml"), encoding="utf-8") as f:
        personal = yaml.safe_load(f)
    with open(os.path.join(ROOT, "_config.yml"), encoding="utf-8") as f:
        config = yaml.safe_load(f)
    name = personal["zh"]["name"] + " · " + personal["en"]["name"]
    tagline = personal["zh"]["tagline"]
    url = str(config["url"]).replace("https://", "").replace("http://", "")
```

3. 删除原硬编码三行。
4. 运行 `python generate_assets.py` 重新生成 og-image.png 与 favicon-32x32.png。

**验证:**
```powershell
python generate_assets.py
```
预期：输出两行 `generated:`，无异常。

```powershell
@'
from PIL import Image
og = Image.open("assets/og-image.png")
fa = Image.open("assets/favicon-32x32.png")
print(og.size, fa.size)
assert og.size == (1200, 630) and fa.size == (32, 32)
'@ | python -
Select-String -Path generate_assets.py -Pattern '王晨 · Chen Wang|chenchen913.github.io'
```
预期：`(1200, 630) (32, 32)`，断言通过；Select-String 无输出（硬编码已删除）。

---

## Task 9: L2 README / README_EN 目录树补全

**关联问题:** AUDIT-REPORT-2 L2（目录树未收录 AUDIT-REPORT、docs/、vendor、og-image、favicon、.editorconfig 等）

**文件:**
- Modify: `README.md`
- Modify: `README_EN.md`

**步骤:**
1. 两份目录树中补入：
   - `docs/`（内部计划/审核文档，不发布）
   - `AUDIT-REPORT.md` / `AUDIT-REPORT-2.md`（审核报告，不发布）
   - `CONTENT-GUIDE.md` / `DEPLOY.md` / `TROUBLESHOOTING.md`（内容/部署/排障指南，不发布）
   - `assets/` 注释补充 vendor/、og-image.png、favicon
   - `robots.txt`、`LICENSE`、`Gemfile / Gemfile.lock / .ruby-version`
   - `.editorconfig / .gitattributes / .gitignore`
2. 保持树形符号对齐。

**验证:**
```powershell
Select-String -Path README.md,README_EN.md -Pattern "docs/|AUDIT-REPORT-2|og-image|robots.txt|editorconfig|vendor/"
```
预期：两个文件都命中上述关键词（各至少 5 行）。

---

## Task 10: L3 backup.ps1 备份清单补全

**关联问题:** AUDIT-REPORT-2 L3（CoreItems 缺 docs/.github/robots.txt）

**文件:**
- Modify: `backup.ps1`

**步骤:**
1. `$CoreItems` 数组在 `"assets"` 之后补 `"docs"`、`".github"`、`"robots.txt"`。

**验证:**
```powershell
Select-String -Path backup.ps1 -Pattern '"docs"|"\.github"|"robots\.txt"'
```
预期：3 行全部命中，且位于 `$CoreItems` 数组内。

---

## Task 11: L4 已核实无需修改

**关联问题:** AUDIT-REPORT-2 L4（TROUBLESHOOTING exclude 示例含 INDEPENDENT-AUDIT.md）

**结论:** TROUBLESHOOTING.md 第 620 行已有"当前有效清单以 _config.yml 为准"的说明，示例明确标注为当时修复记录，无需代码修改。

**验证:**
```powershell
Select-String -Path TROUBLESHOOTING.md -Pattern "当前有效清单以"
```
预期：命中 1 行（第 620 行，原文为"当前有效清单以 `_config.yml` 为准"）。

---

## Task 12: L5a + 复核补充 修正 portfolio 注释

**关联问题:** AUDIT-REPORT-2 L5a（L13"最后同步"顶格）+ 本轮复核补充（L15 仍写"本文件字符码数组/noscript 兜底"，实际已无数组）

**文件:**
- Modify: `portfolio-single-file.html`

**步骤:**
1. L13 `最后同步：...` 前补两个空格，与相邻注释行对齐。
2. 将"修改邮箱时同步 social.yml、_layouts/default.html、index_empty.html 与本文件字符码数组/noscript 兜底。"改为"修改邮箱时同步 social.yml、_layouts/default.html 与 index_empty.html 的 JS 数组、以及本文件明文邮箱（由 check_portfolio_sync.py 校验）。"

**验证:**
```powershell
Select-String -Path portfolio-single-file.html -Pattern "字符码数组/noscript"
$l = Get-Content -Encoding UTF8 portfolio-single-file.html
$l[12]
Select-String -Path portfolio-single-file.html -Pattern "本文件明文邮箱"
```
预期：第一组无输出；`$l[12]` 以两个空格开头；第三组命中。

---

## Task 13: L5b backup.ps1 注明 pre-jekyll 保留例外

**关联问题:** AUDIT-REPORT-2 L5b（`pre-jekyll-2026-07-04` 不匹配保留策略正则 `^\d{4}-\d{2}-\d{2}-`，永不自动清理）

**文件:**
- Modify: `backup.ps1`

**步骤:**
1. 在保留策略注释（`# 保留策略：按名称倒序…`）旁补一行：
   `# 注意：pre-jekyll-2026-07-04 是迁移前里程碑备份，名称不含 YYYY-MM-DD- 前缀，不受保留策略影响，属有意保留。`

**验证:**
```powershell
Select-String -Path backup.ps1 -Pattern "pre-jekyll-2026-07-04|有意保留"
```
预期：命中 2 行。

---

## Task 14: 清理无用文件

**关联:** 用户要求"最后删除附加的没有用的文件"

**步骤:**
1. 检查并删除本会话产生的 `__pycache__/`、`.pytest_cache/`、`_site/`、`backups/*.tmp-*` 等临时目录（均为忽略项，删除前校验路径在仓库内）。
2. `git status --short` 确认只剩预期改动。

**验证:**
```powershell
git status --short
```
预期：仅包含本 spec、AUDIT-REPORT-2.md、_config.yml 及本轮修改的文件；无临时目录。

---

## Task 15: 提交并推送 GitHub

**关联:** 用户要求最终推送到 GitHub；AUDIT-REPORT-2.md 与 _config.yml（exclude 新增）必须一起提交

**步骤:**
1. `git add -A`。
2. `git commit -m "fix: 按第二轮审核修复 KaTeX 字体/邮箱同步/文档口径等 12 项问题"`。
3. `git push origin main`（失败重试；确认远端已接收）。
4. 如 `gh` 可用，检查最新 workflow run 是否已触发。

**验证:**
```powershell
git status --short
git log -1 --oneline
git ls-remote origin main
```
预期：工作区干净；HEAD 为本次提交；远端 main 的 SHA 与本地一致。
