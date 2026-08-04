#!/usr/bin/env python3
"""检查 portfolio-single-file.html 与数据源的内容级同步。

校验两部分：
1. 内容级：从 _data/*.yml 与 _projects/_publications 详情页 front matter 提取关键字段，
   逐一断言出现在 portfolio-single-file.html 中（HTML 反转义后比较）。
2. 新鲜度：portfolio 内的"最后同步：YYYY-MM-DD"标记不得早于相关数据文件的最后提交日期。
"""
import glob
import html
import os
import re
import subprocess
import sys
from datetime import datetime

import yaml

repo = os.path.dirname(os.path.abspath(__file__))
portfolio = os.path.join(repo, "portfolio-single-file.html")
DATA_PATTERNS = ("_data/**/*.yml", "_data/**/*.yaml")
CONTENT_PATTERNS = ("_projects/**/*.md", "_publications/**/*.md")


def load_data():
    """读取所有相关 YAML 数据文件。"""
    data = {}
    for pattern in DATA_PATTERNS:
        for path in glob.glob(os.path.join(repo, pattern), recursive=True):
            name = os.path.splitext(os.path.basename(path))[0]
            with open(path, encoding="utf-8") as f:
                data[name] = yaml.safe_load(f) or {}
    return data


def expected_fragments(data):
    """从数据文件提取需要在单文件页中出现的文本片段。"""
    frags = []

    personal = data.get("personal", {})
    for lang in ("zh", "en"):
        p = personal.get(lang, {})
        frags.extend([p.get("name"), p.get("tagline")])

    social = data.get("social", {})
    frags.append(social.get("email"))

    education = data.get("education", {})
    for lang in ("zh", "en"):
        edu = education.get(lang, {})
        frags.extend([edu.get("school"), edu.get("detail"), edu.get("period")])
        frags.extend(edu.get("honors", []))
        frags.extend(edu.get("courses", []))

    experience = data.get("experience", {})
    for role in experience.get("roles", []):
        for lang in ("zh", "en"):
            rd = role.get(lang) or role.get("zh") or {}
            frags.extend([rd.get("role"), rd.get("company"), rd.get("period")])
            frags.extend(rd.get("bullets", []))

    skills = data.get("skills", {})
    for lang in ("zh", "en"):
        for cat in skills.get(lang, []):
            frags.extend(cat.get("items", []))

    for pattern in CONTENT_PATTERNS:
        for path in glob.glob(os.path.join(repo, pattern), recursive=True):
            with open(path, encoding="utf-8") as f:
                text = f.read()
            m = re.search(r"^---\n(.*?)\n---", text, re.S | re.M)
            if not m:
                continue
            fm = yaml.safe_load(m.group(1)) or {}
            for lang in ("zh", "en"):
                d = fm.get(lang) or fm.get("zh") or {}
                frags.extend([d.get("title"), d.get("desc"), d.get("meta")])
                # 仅项目详情页的 tech 在主页卡片上渲染；论文 tech 不渲染，故不纳入校验。
                if "_projects" in path:
                    frags.extend(d.get("tech", []))
                t = d.get("type")
                if t:
                    frags.append(t)

    return [str(f).strip() for f in frags if f]


def verify_fragments(text, frags):
    """返回缺失片段列表；全部包含时返回空列表。"""
    return [f for f in frags if f not in text]


def check_content():
    """内容级校验：单文件页必须包含所有关键字段。"""
    try:
        with open(portfolio, encoding="utf-8") as f:
            text = html.unescape(f.read())
    except OSError as e:
        print(f"错误：无法读取 {portfolio}：{e}", file=sys.stderr)
        return False

    data = load_data()
    missing = verify_fragments(text, expected_fragments(data))
    if missing:
        print("错误：以下关键字段未在 portfolio-single-file.html 中找到（内容级同步失败）：",
              file=sys.stderr)
        for item in missing[:30]:
            print(f"  - {item}", file=sys.stderr)
        if len(missing) > 30:
            print(f"  …（共 {len(missing)} 项缺失）", file=sys.stderr)
        return False
    return True


def check_marker_freshness():
    """新鲜度校验：'最后同步'标记不得晚于相关文件的最后提交日期。"""
    try:
        with open(portfolio, encoding="utf-8") as f:
            text = f.read()
    except OSError as e:
        print(f"错误：无法读取 {portfolio}：{e}", file=sys.stderr)
        return False

    m = re.search(r"最后同步：(\d{4}-\d{2}-\d{2})", text)
    if not m:
        print("错误：未找到'最后同步'标记（格式：最后同步：YYYY-MM-DD）。", file=sys.stderr)
        return False
    marker = datetime.strptime(m.group(1), "%Y-%m-%d").date()

    paths = []
    for pattern in DATA_PATTERNS + CONTENT_PATTERNS:
        paths.extend(glob.glob(os.path.join(repo, pattern), recursive=True))
    if not paths:
        print("错误：未找到任何需要比对的数据/内容文件。", file=sys.stderr)
        return False

    proc = subprocess.run(
        ["git", "log", "-1", "--format=%cs", "--"] + paths,
        cwd=repo,
        capture_output=True,
        text=True,
    )
    if proc.returncode != 0:
        print(f"错误：git log 执行失败：{proc.stderr.strip()}", file=sys.stderr)
        return False
    latest = proc.stdout.strip()
    if not latest:
        print("错误：未找到相关数据文件的提交记录。", file=sys.stderr)
        return False
    last_commit = datetime.strptime(latest, "%Y-%m-%d").date()

    if last_commit > marker:
        print(
            f"错误：数据文件最近提交日期（{last_commit}）晚于 portfolio 的'最后同步'标记（{marker}）。\n"
            "请手动同步 portfolio-single-file.html 的内容并更新标记后重新提交。",
            file=sys.stderr,
        )
        return False
    print(f"portfolio 同步检查通过（最后同步 {marker}，数据最后提交 {last_commit}）。")
    return True


def main():
    ok = check_content()
    if not ok:
        sys.exit(1)
    ok = check_marker_freshness()
    if not ok:
        sys.exit(1)


if __name__ == "__main__":
    main()
