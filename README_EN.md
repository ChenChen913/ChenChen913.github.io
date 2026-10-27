# Chen Wang · Personal Homepage

[中文](README.md)

A personal homepage built with Jekyll. **Cloudflare Pages is the primary site**, with GitHub Pages retained as a backup and rollback entry.

🔗 Primary: **[chenchen913.pages.dev](https://chenchen913.pages.dev)**
🔗 Backup: **[chenchen913.github.io](https://chenchen913.github.io)**

## Tech Stack

- Jekyll static site generator
- Cloudflare Pages (primary) + GitHub Pages (backup)
- GitHub Actions builds and deploys both sites
- Bilingual standalone pages (Chinese / English)
- Responsive design (desktop / tablet / mobile)

## Directory Structure

```
├── _config.yml          # Jekyll global config (url, collections, exclude, etc.)
├── _config.cloudflare.yml # Cloudflare override: points url to pages.dev
├── _headers             # Cloudflare Pages response headers
├── _data/               # Site data (edit content mostly here)
│   ├── personal.yml     #   name, intro, footer date, etc.
│   ├── education.yml    #   education history
│   ├── experience.yml   #   work experience
│   ├── skills.yml       #   skill list
│   ├── social.yml       #   email, GitHub and other social links
│   └── navigation.yml   #   navbar labels
├── _layouts/
│   ├── default.html     # homepage layout (shared by index.html / en.html)
│   └── detail.html      # detail page layout (projects / publications)
├── _projects/           # project detail pages (Markdown, bilingual via <!-- PAGE_ENGLISH_SPLIT_2026 --> separator)
├── _publications/       # publication detail pages (same as above)
├── docs/                # internal plans / audit docs (not published)
├── AUDIT-REPORT.md      # round-1 audit report (not published)
├── AUDIT-REPORT-2.md    # round-2 audit report (not published)
├── AUDIT-REPORT-3.md    # round-3 security scan report (not published)
├── CONTENT-GUIDE.md     # content maintenance guide (not published)
├── DEPLOY.md            # deployment guide (not published)
├── TROUBLESHOOTING.md   # troubleshooting guide (not published)
├── assets/              # avatar, PDFs, PDF viewer, vendored libs (vendor/), og-image.png, favicon
├── index.html           # Chinese homepage entry
├── en.html              # English homepage entry
├── 404.html             # 404 page
├── index_empty.html     # homepage temporarily-closed page (not published)
├── portfolio-single-file.html  # offline single-file fallback (not published; content checked by check_portfolio_sync.py)
├── style.css / script.js # site-wide styles and interaction scripts
├── update-date.py       # syncs homepage and fallback footer/banner dates and the sync marker
├── check_portfolio_sync.py     # verifies single-file page stays content-synced with data
├── generate_assets.py   # generates og share image and PNG favicon (Pillow)
├── backup.ps1           # local backup script (keeps N most recent backups)
├── robots.txt           # search-engine crawler rules
├── LICENSE              # open-source license
├── Gemfile / Gemfile.lock / .ruby-version  # Ruby dependencies
├── requirements-ci.txt  # CI Python deps (pinned + hash-verified)
├── .editorconfig / .gitattributes / .gitignore  # editor / line-ending / ignore rules
└── .github/workflows/   # GitHub Actions deployment config
```

> `DEPLOY.md`, `TROUBLESHOOTING.md`, `CONTENT-GUIDE.md` and other internal docs are
> listed in `exclude` in `_config.yml` and never published. `backups/` holds local
> snapshots and is git-ignored.
>
> `portfolio-single-file.html` is a maintained single-file fallback page for
> offline viewing when the hosted sites are unavailable. It is also excluded
> from the build — please do not delete it.

## Local Preview

Requires Ruby 3.3 (see `.ruby-version`):

```bash
bundle install
bundle exec jekyll serve
# open http://127.0.0.1:4000 in your browser
```

If installing Ruby is inconvenient, just push to GitHub and let Actions build it.

## Editing Workflow

1. **Edit content**: update the corresponding YAML files under `_data/`
   (remember to update both Chinese and English fields); edit project /
   publication bodies in `_projects/` and `_publications/`. When homepage
   content changes, mirror it in `portfolio-single-file.html`.
2. **Refresh dates**: run `python update-date.py` to sync both homepage and
   fallback footers, the fallback banner, and the sync marker.
3. **Local check**: run `python check_portfolio_sync.py` and preview locally;
   watch YAML indentation and Liquid tag pairing.
4. **Commit & push**:
   ```bash
   git add -A
   git commit -m "update notes"
   git push origin main
   ```
5. **Verify deployment**: confirm the Actions build succeeds, then refresh both
   [chenchen913.pages.dev](https://chenchen913.pages.dev) (primary) and
   [chenchen913.github.io](https://chenchen913.github.io) (backup).

## License

Source code is licensed under the [MIT License](LICENSE); personal information,
written content, images and PDF documents are All Rights Reserved.
