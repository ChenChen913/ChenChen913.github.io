# 内容维护指南（增 · 删 · 改）

> 本文档教你如何日常更新个人主页内容。所有操作只需改数据文件和 Markdown，**不需要碰 HTML/CSS/JS**。

---

## 项目架构速览

```
你改的文件                    网站上的效果
──────────────               ──────────────
_data/personal.yml    →      姓名、头衔、页脚
_data/social.yml      →      邮箱、GitHub、微信等联系方式
_data/education.yml   →      教育背景、荣誉、课程
_data/experience.yml  →      工作/实习经历
_data/skills.yml      →      技能分类和标签
_data/navigation.yml  →      导航菜单文字
_projects/*.md        →      项目卡片 + 详情页
_publications/*.md    →      论文卡片 + 详情页
assets/avatar.jpg     →      头像照片
```

**核心原理**：Jekyll 读取数据文件，自动生成网页。你只管改数据，网页自动更新。

---

## 一、增（添加新内容）

### 1.1 新增一个项目

**第一步**：在 `_projects/` 文件夹下新建 `.md` 文件（文件名用英文短横线，如 `my-new-project.md`）

**第二步**：写入以下格式内容：

```markdown
---
# ⚠️ github / demo 必须放在顶层（zh/en 之外），模板才能识别
github: https://github.com/你的用户名/仓库名
demo: https://demo-link.com
zh:
  type: 个人项目
  title: 项目名称
  meta: 独立开发 · 2026.03 — 2026.06
  desc: 一句话描述项目亮点
en:
  type: Personal Project
  title: Project Name
  meta: Solo Developer · Mar 2026 — Jun 2026
  desc: One-sentence description
---

> 没有开源或在线演示时，直接删掉 `github` / `demo` 两行即可，模板会自动隐藏对应按钮。

## 项目介绍

中文正文内容。可以用 Markdown 语法：**加粗**、`代码`、列表等。

如果需要展示 PDF，用 iframe：
<iframe src="{{ '/assets/pdf-viewer.html?file=/assets/your-file.pdf' | relative_url }}" width="100%" height="500" style="border:1px solid var(--border); border-radius:8px;"></iframe>

<!-- English -->

## Project Introduction

English content here.
```

**第三步**：`git add .` → `git commit -m "新增项目：xxx"` → `git push`

**效果**：主页自动出现新项目卡片，点击跳转到自动生成的详情页。

> **文件名 = 网址**：`_projects/my-new-project.md` → 网址 `/projects/my-new-project/`

### 1.2 新增一篇论文

在 `_publications/` 下新建 `.md`，格式与项目相同。`type` 字段填"期刊论文"/"会议论文"/"Journal Article"等。

如需在详情页内嵌 PDF 全文（在线查看，不触发下载），需要：
1. 把 PDF 文件放到 `assets/publications/` 目录；
2. 在 front matter 的 `zh:` 和 `en:` 下各加一行 `pdf: 文件名.pdf`（两处都填，文件名与文件一致）；
3. 模板会自动在详情页末尾渲染 PDF 查看器（pdf.js，支持翻页/缩放/下载/全屏）。

示例：

```markdown
---
zh:
  type: 期刊论文
  title: 论文标题
  meta: 期刊名 · 2026
  pdf: 论文文件名.pdf
en:
  type: Journal Article
  title: Paper Title
  meta: Journal Name · 2026
  pdf: 论文文件名.pdf
---
```

> 不填 `pdf` 字段则该论文详情页不显示 PDF 查看器，其余功能不受影响。

### 1.3 新增工作/实习经历

编辑 `_data/experience.yml`，在 `roles:` 下追加一个条目（注意中英文都要写）：

```yaml
roles:
  # ... 已有的经历 ...
  - zh:
      role: 职位名称
      company: 公司名 · 部门
      period: 2026.06 — 至今
      bullets:
        - 做了什么、用了什么技术、成果如何
        - 第二条要点
    en:
      role: Job Title
      company: Company · Department
      period: Jun 2026 — Present
      bullets:
        - What you did, tech used, outcomes
        - Second bullet point
```

> ⚠️ 注意：每条经历必须有 `zh:` 和 `en:` 两个语言块，字段名用 `role`（不是 title）、`bullets`（列表，不是 description 字符串）。

### 1.4 新增技能分类

编辑 `_data/skills.yml`，添加新分类：

```yaml
- category: 新分类名称
  items: [技能1, 技能2, 技能3]
```

### 1.5 新增教育荣誉/课程

编辑 `_data/education.yml`，在 `honors:` 或 `courses:` 下追加条目即可。

---

## 二、删（移除过时内容）

### 2.1 删除一个项目/论文

直接删除 `_projects/` 或 `_publications/` 下对应的 `.md` 文件即可。主页卡片和详情页自动消失。

```bash
git rm _projects/old-project.md
git commit -m "删除过时项目：old-project"
git push
```

### 2.2 删除整个"项目"或"论文"栏目

把 `_projects/` 或 `_publications/` 下所有 `.md` 文件删光。栏目和导航项自动隐藏，不需要改 HTML。

### 2.3 删除工作经历栏目

编辑 `_data/experience.yml`，把 `roles:` 的值改为空数组：

```yaml
roles: []
```

栏目自动隐藏。

### 2.4 删除单条经历/荣誉/课程

编辑对应数据文件，删掉那一条即可。不需要改其他任何文件。

---

## 三、改（更新已有内容）

### 3.1 改姓名 / 头衔 / 页脚

编辑 `_data/personal.yml`：

```yaml
zh:
  name: 新名字
  tagline: 新头衔
  footer_copyright: © 2026 新名字
  footer_updated: 页面最后更新：2026 年 08 月 01 日
en:
  name: New Name
  tagline: New Tagline
  footer_copyright: © 2026 New Name
  footer_updated: "Last updated: August 01, 2026"
```

### 3.2 改联系方式

编辑 `_data/social.yml`，改对应字段即可。中英文页面同步生效。

### 3.3 改头像

用新照片替换 `assets/avatar.jpg`（保持文件名不变）。

### 3.4 改项目/论文内容

编辑对应的 `.md` 文件，改 frontmatter 中的字段或正文内容。

### 3.5 改导航菜单文字

编辑 `_data/navigation.yml`，改 `label` 字段。**不要改 `id` 字段**。

### 3.6 更新页脚日期

每次改完内容后，顺手更新 `_data/personal.yml` 中的 `footer_updated` 字段。

---

## 四、绝对不能碰的文件

以下文件控制网站的核心结构和交互，**修改会导致网站损坏**：

| 文件 | 不能改什么 |
|---|---|
| `_layouts/default.html` | 不要改 CSS/JS 引用、section 的 id 属性、主题切换逻辑 |
| `_layouts/detail.html` | 不要改 `<!-- English -->` 分隔符逻辑、KaTeX 加载逻辑 |
| `style.css` | 不要改第 4-35 行的 CSS 变量块、第 61 行的 `scroll-margin-top` |
| `script.js` | 不要改 `NAV_OFFSET`（第 66 行，值 80）、核心函数 |
| `_config.yml` | 不要改 `collections` 配置、`exclude` 列表（除非你确定知道后果）|
| `_data/navigation.yml` | 不要改 `id` 字段（可以改 `label`）|

---

## 五、修改后验证清单

每次改完内容推送前，检查：

1. **本地预览**（如果装了 Ruby）：`bundle exec jekyll serve` → 打开 `http://localhost:4000`
2. **中英文一致性**：中文改了什么，英文也要对应改什么
3. **页脚日期**：`footer_updated` 是否更新了
4. **YAML 语法**：缩进用空格不要用 Tab，冒号后面有空格
5. **文件名**：新建的项目/论文文件名用英文和短横线（如 `my-project.md`），不要用中文

推送后等 1-2 分钟，访问 `https://用户名.github.io` 确认更新。

---

## 六、常见操作速查表

| 我想... | 改哪个文件 | 怎么改 |
|---|---|---|
| 改名字 | `_data/personal.yml` | `zh.name` / `en.name` |
| 改邮箱 | `_data/social.yml` | `email` 字段 |
| 换头像 | `assets/avatar.jpg` | 替换文件，不改名 |
| 加项目 | `_projects/` 新建 `.md` | 参考 `campus-qa-bot.md` 格式 |
| 加论文 | `_publications/` 新建 `.md` | 参考 `rgv-dynamic-scheduling.md` 格式 |
| 加实习 | `_data/experience.yml` | `roles` 下追加条目 |
| 加技能 | `_data/skills.yml` | 追加分类或标签 |
| 删项目 | 删 `_projects/xxx.md` | 直接删除文件 |
| 改页脚日期 | `_data/personal.yml` | `footer_updated` |
| 改导航文字 | `_data/navigation.yml` | `label` 字段（不改 `id`）|

---

## 七、双语维护要点

1. **中文和英文必须同步修改**：改了中文的姓名，英文也要改
2. **`<!-- English -->` 是分隔符**：详情页正文中，分隔符上面是中文，下面是英文
3. **YAML 中的 `zh:` 和 `en:`**：每个字段都有中英文两个版本，缺一不可
4. **`footer_updated` 格式**：中文用"页面最后更新：2026 年 08 月 01 日"，英文用"Last updated: August 01, 2026"（前缀不能少，否则 `update-date.py` 无法自动更新）

---

> 更新日期：2026 年 07 月 31 日
