# 个人主页项目安全扫描与修复报告（第三轮）

> 扫描日期：2026-08-06
> 工具：OpenAI Codex Security（`@openai/codex-security` 0.1.6，CLI + 内置插件 0.1.15）
> 推理模型：DeepSeek `deepseek-v4-flash`（`deepseek-v4-pro` 的 Codex 集成当时尚未开放）
> 范围：全仓库 75 个文件（standard 模式，覆盖率 complete）

---

## 一、扫描发现（6 项，全部低危）

本轮使用 Codex Security 对仓库做全量扫描，共报告 6 个低危问题。所有问题都以“仓库内容本身被攻击者控制”为前提（个人主页无用户输入），实际被利用需要仓库/CI 被攻破，但仍按报告逐项修复。

| # | 问题 | 位置 | 修复方式 |
|---|---|---|---|
| 1 | 导航 `id`/`label` 未转义，可造成存储型 XSS | `_data/navigation.yml` → `_layouts/default.html` 导航锚点 | `{{ item.id \| escape }}` / `{{ item.label \| escape }}` |
| 2 | URL 协议校验用子串匹配，`javascript:` 链接可绕过 | `_layouts/default.html` 项目/社交链接 | 改为按 `://` 前的协议段锚定判断，仅放行 `http`/`https` |
| 3 | 内置 KaTeX 0.16.9 存在已知 XSS（CVE-2024-28243/28244/28245） | `assets/vendor/katex/` | 升级到 0.16.47（js/css/auto-render/fonts 一并替换） |
| 4 | 出版物 PDF 路径未转义，可属性注入 | `_layouts/detail.html` `data-zh`/`data-en` | 属性值追加 `\| escape` |
| 5 | CI 未固定 `pip install pyyaml`，供应链风险 | `.github/workflows/deploy.yml` | 新增 `requirements-ci.txt`（`PyYAML==6.0.2` + sha256），`pip --require-hashes` |
| 6 | 外链巡检对任意 URL 发起未验证外部请求 | `.github/workflows/deploy.yml` `check-external-links` | 统一 `--disable-external`，巡检改为只读内部链接检查 |

---

## 二、修复清单

1. **导航转义**：`_layouts/default.html` 导航锚点的 `id` 与 `label` 均加 `| escape`，与模板其余插值保持一致。
2. **URL 协议校验**：项目 github/demo 与社交 GitHub/Gitee/X 链接均改为先取 `://` 前的协议段（`split: '://' | first`），只有 `http`/`https` 才输出真实 href，其余输出 `#`。
3. **KaTeX 升级**：`assets/vendor/katex/` 下的 `katex.min.js`、`katex.min.css`、`auto-render.min.js` 与 `fonts/` 全部替换为 0.16.47。
4. **PDF 属性转义**：`_layouts/detail.html` 的 `data-zh`/`data-en` 属性值加 `| escape`，保留原有 `..` 路径拒绝逻辑。
5. **CI 依赖固定**：新增 `requirements-ci.txt`，固定 `PyYAML==6.0.2` 并列出 Linux 常用 wheel 的 sha256；部署任务改用 `pip install --require-hashes -r requirements-ci.txt`。
6. **CI 出站请求收敛**：定时/手动巡检统一加 `--disable-external`，不再向站点内容中的任意 URL 发起外部请求。

---

## 三、验证

- 静态检查：`node --check script.js`、Python 语法检查、YAML 解析均通过。
- 重新扫描：使用同一工具与模型对修复后的仓库副本重新全量扫描，结果见下方“四、结论”。

> 说明：Codex Security 在中文 Windows 上存在 GBK 解码 bug（git 输出含中文路径/提交信息即崩溃）。扫描在 ASCII 路径的仓库副本上进行，并对官方插件副本打了 UTF-8 解码补丁（`--plugin-path` 指向副本），原项目未做任何额外改动。

---

## 四、结论

重新扫描结果：**0 项报告发现，覆盖率 complete**（扫描完成于 2026-08-06，扫描 ID `1fd1aac3-b8f8-4ab9-a349-01da1b6b4dc1`）。

6 个低危问题已全部修复并通过验证，本轮安全扫描闭环。
