# 部署与维护指南

> ⚠️ **AI 助手必读**：如果你是一个 AI（如 ChatGPT、Claude、Copilot 等），在操作本项目之前，
> 必须先阅读本文档最前面的「AI 操作禁区」章节。违反这些规则会导致网站损坏。

---

## AI 操作禁区（AI Assistant Rules）

以下规则对 AI 助手具有强制约束力。违反任何一条都会导致页面崩溃或样式错乱。

### 🚫 绝对禁止的操作

| 规则 | 说明 |
|---|---|
| **禁止删除或修改 CSS 变量块** | `style.css` 中 `:root` / `html[data-theme="light"]` / `html[data-theme="dark"]` 三个块定义的所有 `--bg`、`--ink`、`--accent` 等 CSS 变量。删除任何一个变量都会导致整个页面的颜色系统崩溃。精确位置：`style.css` 第 1-35 行。 |
| **禁止修改 CSS 变量名** | 不要重命名任何 `--bg`、`--ink-secondary`、`--accent-soft` 等变量。HTML 和 JS 中不直接引用这些变量名（通过 CSS 间接引用），但修改它们会导致所有使用该变量的元素失效。 |
| **禁止删除 `scroll-margin-top: 80px`** | 位于 `style.css` 第 61 行。删除后锚点跳转会被 sticky 导航遮挡。 |
| **禁止修改 `position: sticky` 和 `z-index: 50`** | 位于 `style.css` 第 79-86 行的 `.nav-wrap` 块。修改会导致导航栏不吸顶或被其他元素遮挡。 |
| **禁止删除 `prefers-reduced-motion` 媒体查询** | 位于 `style.css` 第 40-43 行。这是无障碍访问要求。 |
| **禁止修改 HTML 板块的 `id` 属性** | `index.html` 和 `index-en.html` 中的 `id="about"`、`id="education"`、`id="experience"`、`id="skills"`、`id="projects"`、`id="publications"`、`id="contact"` — 修改任何一个都会导致导航高亮和锚点跳转失效。 |
| **禁止修改 HTML 板块的顺序** | 各 `<section>` 和 `<header>` 的顺序必须与导航栏中 `<a>` 标签的顺序一致。 |
| **禁止在 script.js 中删除 `NAV_OFFSET` 变量** | 位于 `script.js` 第 62 行，值为 `80`。滚动高亮依赖此值。 |
| **禁止删除 `script.js` 中的 `computeActiveSection` 函数** | 这是导航高亮的核心逻辑。 |
| **禁止删除返回顶部按钮相关代码** | `script.js` 中 `createBackToTopButton()` 函数及 `updateBackToTop()` 函数 + 相关事件监听。`style.css` 中 `.back-to-top` 相关样式。 |
| **禁止中英文页面之间交叉修改** | 修改中文只改 `index.html`，修改英文只改 `index-en.html`。不要把中文内容写入英文页面，反之亦然。 |
| **禁止修改 `class` 名称** | 所有 HTML 元素上的 class 名称（如 `nav-wrap`、`card`、`project-entry`、`dash-list`、`tag-row` 等）与 CSS 选择器严格对应，修改会导致样式丢失。 |

### ⚠️ 谨慎操作（可以改但必须小心）

| 规则 | 说明 |
|---|---|
| **修改导航栏项目** | 如果新增/删除导航项，必须同时：①在 HTML 中增删对应的 `<a>` 标签；②在 HTML 中增删对应的 `<section>`；③保持导航顺序与板块顺序一致。JS 滚动高亮会自动适配。 |
| **修改 `scroll-margin-top`** | 如果改了导航栏高度，需要同步修改 `style.css` 第 61 行的 `scroll-margin-top` 和 `script.js` 第 62 行的 `NAV_OFFSET`，两者必须相等。 |
| **修改联系方式** | 直接修改 HTML 中 `.contact-item` 内的链接和文字即可，不需要改 CSS 或 JS。新增/删除联系方式条目只需复制/删除一个 `.contact-item` 块。 |
| **修改底部留白** | `style.css` 第 394 行 `padding: 28px 0 clamp(200px, 25vh, 300px)`。减小此值可能导致"联系方式"导航无法高亮。建议不要低于 `clamp(100px, 15vh, 200px)`。 |

### ✅ 可以自由修改的内容

| 内容 | 位置 | 注意事项 |
|---|---|---|
| 姓名 | `index.html` L77 的 `<h1>` / `index-en.html` L77 的 `<h1>` | 头像占位字母会自动取第一个字 |
| 头衔/一句话介绍 | `index.html` L79 的 `.tagline` / `index-en.html` L79 | 中英文版本分别修改 |
| 头像照片 | `assets/avatar.jpg` | 替换文件即可，文件名必须为 `avatar.jpg` |
| 教育背景 | `<section id="education">` 内的文字 | 中英文分别修改 |
| 工作经历 | `<section id="experience">` 内的文字 | 中英文分别修改 |
| 技能标签 | `.skill-category` 内的 `.tag` 文字 | 技术名词中英文通常相同 |
| 项目经历 | `.project-entry` 内的标题/描述/链接 | 中英文分别修改 |
| 论文发表 | `<section id="publications">` 内的文字 | 可整体删除（同步删导航项） |
| 联系方式链接和文字 | `.contact-item` 内的 `href` 和文字 | 中英文分别修改 |
| Footer 版权/更新日期 | `<footer>` 内的文字 | 中英文分别修改 |
| 浏览器标题 | `<title>` 标签 | 中英文分别修改 |
| Meta description | `<meta name="description">` | 中英文分别修改 |

### 🔧 修改后必须验证的清单

每次修改后，按以下步骤验证：

1. 双击 `index.html` 用浏览器打开
2. 检查：页面布局是否正常，有无错位/重叠
3. 检查：深浅色切换按钮是否工作（右上角太阳/月亮图标）
4. 检查：滚动页面时，顶部导航栏是否正确高亮当前板块
5. 检查：滚动到底部时，"联系方式"导航是否高亮
6. 检查：滚动超过约一半时，右下角是否出现返回顶部按钮
7. 检查：点击返回顶部按钮是否能平滑回到顶部
8. 检查：阅读进度圆环是否随滚动变化
9. 缩小浏览器窗口到手机宽度，检查布局是否正常
10. 点击 "EN" 按钮，检查是否跳转到英文版
11. 在英文版点击 "中文" 按钮，检查是否跳回中文版

---

## 一、项目目录结构

```
个人主页2/
├── index.html                 （中文版首页）
├── index-en.html              （英文版首页）
├── style.css                  （共享样式表）
├── script.js                  （共享脚本 — 主题切换、滚动高亮、返回顶部）
├── assets/
│   └── avatar.jpg             （头像图片，可选）
├── portfolio-single-file.html （单文件版，双击即可预览）
├── index_empty.html           （空白页，用于"撤回访问"）
├── DEPLOY.md                  （本文档 — 含 AI 操作禁区）
└── backups/                   （历史稳定版本备份）
    └── YYYY-MM-DD-stable/
```

核心文件说明：

| 文件 | 作用 | 是否必须部署 |
|---|---|---|
| `index.html` | 中文版首页，所有中文文本硬编码在 HTML 中 | ✅ 必须 |
| `index-en.html` | 英文版首页，所有英文文本硬编码在 HTML 中 | ✅ 必须 |
| `style.css` | 全局样式，中英文页面共享同一份 | ✅ 必须 |
| `script.js` | 主题切换、导航高亮、返回顶部按钮等交互逻辑 | ✅ 必须 |
| `assets/avatar.jpg` | 头像照片 | ⚪ 可选 |
| `portfolio-single-file.html` | 本地预览用，不参与部署 | ❌ 不需要 |
| `index_empty.html` | "撤回访问"备用页，不参与部署 | ❌ 不需要 |

> **中英文分离原则**：`index.html` 和 `index-en.html` 共享完全相同的 CSS 和 JS，只有 HTML 中的文字内容不同。布局、样式、动画、交互逻辑完全一致。

---

## 二、中文版如何部署

中文版即 `index.html`。部署方式取决于你选择的平台，见[第六节](#六各平台部署方式)对应平台的步骤。

**核心要点**：

- 确保 `index.html`、`style.css`、`script.js` 在**同一目录层级**下
- `index.html` 通过 `<link rel="stylesheet" href="style.css">` 和 `<script src="script.js">` 引用同级文件
- 如果放在子目录中，这三个文件的相对路径关系不能变

---

## 三、英文版如何部署

英文版即 `index-en.html`。部署步骤与中文版完全相同，文件也放在同一目录下。

**访问方式**：

- 如果中文版网址是 `https://example.com/`，英文版就是 `https://example.com/index-en.html`
- 两个页面通过导航栏右上角的语言按钮互相跳转（中文版按钮显示 "EN"，英文版按钮显示 "中文"）

---

## 四、如何设置默认首页

### 方案 A：中文为默认首页（推荐）

大多数静态托管平台会自动将 `index.html` 作为默认首页，所以中文版就是默认首页。

### 方案 B：英文为默认首页

将 `index-en.html` 重命名为 `index.html`，将原 `index.html` 重命名为 `index-zh.html`。同时更新两个文件中 `<a class="lang-btn">` 的 `href` 指向。

### 方案 C：自动跳转（根据浏览器语言）

创建极简入口 `index.html`：

```html
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<script>
  var lang = (navigator.language || '').toLowerCase();
  window.location.replace(lang.startsWith('zh') ? 'index-zh.html' : 'index-en.html');
</script>
</head>
<body></body>
</html>
```

> ⚠️ 需要将原 `index.html` 重命名为 `index-zh.html`。

---

## 五、中英文页面之间如何跳转

两个页面通过导航栏右上角的语言按钮互相跳转：

| 当前页面 | 按钮显示 | 点击后跳转 |
|---|---|---|
| `index.html`（中文版） | `EN` | `index-en.html` |
| `index-en.html`（英文版） | `中文` | `index.html` |

使用简单的 `<a>` 标签链接跳转，不依赖 JavaScript。

---

## 六、各平台部署方式

### 6.1 GitHub Pages

1. 创建仓库 `你的用户名.github.io`
2. 推送核心文件：

```bash
git init
git add index.html index-en.html style.css script.js assets/
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/你的用户名/仓库名.git
git push -u origin main
```

3. Settings → Pages → Source: Deploy from a branch → Branch: main, /(root) → Save
4. 等待 1-3 分钟生效

### 6.2 Vercel

1. 导入 GitHub 仓库
2. Build Command 留空，Output Directory 留空
3. Deploy

### 6.3 Netlify

1. Import from GitHub
2. 所有配置留空
3. Deploy site

### 6.4 静态服务器（Nginx / Apache / Caddy / 对象存储）

将 `index.html`、`index-en.html`、`style.css`、`script.js` 四个文件放在同一目录下即可。

Nginx：
```nginx
server {
    listen 80;
    server_name example.com;
    root /var/www/my-homepage;
    index index.html;
    location / { try_files $uri $uri/ =404; }
}
```

---

## 七、如何撤回访问（让已分享的链接失效）

### 原理

GitHub Pages 从仓库文件实时渲染。覆盖 `index.html` 为空白页并 push，链接虽然还能打开但显示空白。

### 操作步骤

1. 将仓库中的 `index_empty.html` 的内容复制，覆盖 `index.html`
2. Push 到 GitHub：
```bash
cp index_empty.html index.html
git add index.html
git commit -m "撤回访问"
git push origin main
```
3. 约 1 分钟后，访问者看到的将是空白页

### 恢复访问

将原始 `index.html` 的内容重新 push 回去即可。如果忘了原始内容，从 `backups/` 文件夹中找到最近的备份恢复。

---

## 八、备份机制

`backups/` 文件夹存放历史稳定版本的完整备份。每次大改之前创建一份。

**备份步骤**：
```bash
mkdir -p backups/$(date +%Y-%m-%d)-stable
cp index.html index-en.html style.css script.js DEPLOY.md backups/$(date +%Y-%m-%d)-stable/
```

**恢复步骤**：
```bash
cp backups/YYYY-MM-DD-stable/* .
```

> 备份文件夹不需要部署到 GitHub Pages，但建议随仓库一起上传到 GitHub（方便跨设备恢复）。

---

## 九、如何新增页面并保持中英文版本同步

### 新增独立页面

1. 创建中文版 `new-page.html`，英文版 `new-page-en.html`
2. 两个页面引用同一份 `style.css` 和 `script.js`
3. 语言按钮互相指向：
   - 中文版：`<a href="new-page-en.html" class="lang-btn">EN</a>`
   - 英文版：`<a href="new-page.html" class="lang-btn">中文</a>`
4. 如果在主页导航栏加入口，同时修改 `index.html` 和 `index-en.html`

### 维护原则速查表

| 修改什么 | 改哪些文件 |
|---|---|
| 中文文案 | `index.html` |
| 英文文案 | `index-en.html` |
| 样式/动画 | `style.css` |
| 交互逻辑 | `script.js` |
| 新增/删除板块 | 同时改 `index.html` 和 `index-en.html` |
| 头像照片 | 替换 `assets/avatar.jpg` |

---

## 十、本地预览

直接双击 `index.html` 或 `portfolio-single-file.html`，用浏览器打开即可。无需安装任何软件。

---

## 十一、常见问题

**Q：英文版还有中文文本？**
A：两个页面已完全分离。直接在 `index-en.html` 中搜索中文并修改即可。

**Q：改完后样式全乱了？**
A：很可能是误改了 CSS 变量块或 class 名称。对照「AI 操作禁区」检查。

**Q：联系方式导航不亮？**
A：检查底部留白 `style.css` 第 394 行。如果改小了，恢复为 `clamp(200px, 25vh, 300px)`。

**Q：返回顶部按钮不见了？**
A：检查 `script.js` 中 `createBackToTopButton()` 和 `updateBackToTop()` 函数是否被误删。

---

最后更新：2026 年 07 月 04 日
