# docs 目录说明

> 这里放**不发布到线上**的内部文档。整个 `docs/` 在 `_config.yml` 的 `exclude` 里，
> 线上访问 `/docs/` 的任何路径都返回 404。

## 目录结构

| 路径 | 是什么 | 什么时候看 |
|---|---|---|
| `acceptance-2026-10-27-cloudflare.md` | Cloudflare 迁移验收记录（P0/P1/P2 缺陷清单与决策依据） | 想确认「为什么两站各自 canonical」「为什么不做 CSP」「为什么接受 308」时 |
| `history/AUDIT-LOG.md` | 四轮审核的结论汇总 + 贯穿多轮的教训 | 想知道某个设计怎么定下来的、之前踩过什么坑 |
| `history/plans/` | 已完成的实施计划（施工记录，含每步验证命令） | 想回溯某次修复的具体操作步骤 |
| `reference/cloudflare-migration-guide.md` | 通用迁移方法论（约 1300 行，**非本项目专属**） | 将来迁到别的平台、或重新评估部署方案时 |
| `push-via-api.py` | 本机 `git push` 被代理拦截时的提交兜底脚本 | 要推送代码时（用法见 `DEPLOY.md` 与脚本头部注释） |

## 根目录那五份是日常要用的

| 文件 | 用途 |
|---|---|
| `README.md` / `README_EN.md` | 项目门面、目录结构、本地预览 |
| `DEPLOY.md` | 部署与维护，**最常翻的一份** |
| `TROUBLESHOOTING.md` | 踩坑案例库，遇到怪问题先搜这里 |
| `CONTENT-GUIDE.md` | 内容增删改的具体操作 |

## 归档原则

写完就没用的东西不要留在根目录。判断标准：

- **会反复查** → 留根目录（例如 `DEPLOY.md`）
- **只在特定场景查一次** → 进 `docs/`
- **记录「当时怎么做的」** → 进 `docs/history/`
- **跟本项目无关的通用资料** → 进 `docs/reference/`

2026-11-14 整理过一次：根目录从 9 份 Markdown 收敛到 5 份。
三份 `AUDIT-REPORT*.md` 合并成 `history/AUDIT-LOG.md`（原文保留在更早的提交里），
`CLOUDFLARE_MIGRATION_GUIDE.md` 移入 `reference/`。

> 提醒：`reference/` 里的那份指南是通用方法论，里面的示例（后端数据库、Workers、SPA 等）
> 与本项目无关。本项目的实际配置只有一处权威来源 —— `_config.cloudflare.yml` 和
> `.github/workflows/deploy.yml`，别拿通用指南当现状。
