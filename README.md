# 王晨 · 个人主页

[English](README_EN.md)

基于 Jekyll 构建的个人主页，部署于 GitHub Pages。 

🔗 在线访问：**[chenchen913.github.io](https://chenchen913.github.io)**

## 技术栈

- Jekyll 静态站点生成
- GitHub Pages 托管 + GitHub Actions 自动部署
- 中英文双语独立页面
- 响应式设计（PC / 平板 / 手机）

## 目录结构

```
├── _config.yml          # Jekyll 全局配置（url、collections、exclude 等）
├── _data/               # 站点数据（改内容主要在这里）
│   ├── personal.yml     #   姓名、简介、页脚日期等
│   ├── education.yml    #   教育经历
│   ├── experience.yml   #   实践经历
│   ├── skills.yml       #   技能清单
│   ├── social.yml       #   邮箱、GitHub 等社交链接
│   └── navigation.yml   #   导航栏文案
├── _layouts/
│   ├── default.html     # 主页布局（index.html / en.html 共用）
│   └── detail.html      # 详情页布局（项目 / 论文）
├── _projects/           # 项目详情页（Markdown，中英文用 <!-- English --> 分隔）
├── _publications/       # 论文详情页（同上）
├── assets/              # 头像、PDF 文件、PDF 查看器
├── index.html           # 中文主页入口
├── en.html              # 英文主页入口
├── style.css / script.js# 全站样式与交互脚本
├── update-date.py       # 更新页脚“最后更新”日期的脚本
└── .github/workflows/   # GitHub Actions 自动部署配置
```

> `DEPLOY.md`、`TROUBLESHOOTING.md`、`INDEPENDENT-AUDIT.md` 等为内部文档，已在
> `_config.yml` 的 `exclude` 中排除，不会发布到线上。`backups/` 为本地历史
> 快照，已加入 `.gitignore` 不入库。

## 本地预览

需要 Ruby 3.3（见 `.ruby-version`）：

```bash
bundle install
bundle exec jekyll serve
# 浏览器打开 http://127.0.0.1:4000
```

若不方便装 Ruby，也可以直接推送到 GitHub，由 Actions 构建后在线查看。

## 修改流程

1. **改内容**：编辑 `_data/` 下对应的 YAML 文件（中英文字段都要改）；
   项目 / 论文正文改 `_projects/`、`_publications/` 下的 Markdown。
2. **更新页脚日期**：运行 `python update-date.py`。
3. **本地校验**（可选）：本地预览确认无误，注意 YAML 缩进和 Liquid 标签配对。
4. **提交推送**：
   ```bash
   git add -A
   git commit -m "更新说明"
   git push origin main
   ```
5. **验证部署**：GitHub 仓库 Actions 页面确认构建成功（约 1 分钟），
   刷新 [chenchen913.github.io](https://chenchen913.github.io) 查看效果。

## 许可证

代码部分采用 [MIT License](LICENSE)；个人信息、文字内容、图片与 PDF 文档保留所有权利。
