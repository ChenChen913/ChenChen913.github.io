#!/usr/bin/env python3
"""按北京时间同步更新主页与离线备案页的中英文日期和同步标记。"""
import os
import re
import sys
from datetime import datetime, timezone, timedelta

ROOT = os.path.dirname(os.path.abspath(__file__))
PERSONAL_PATH = os.path.join(ROOT, "_data", "personal.yml")
PORTFOLIO_PATH = os.path.join(ROOT, "portfolio-single-file.html")


def read_text(path):
    with open(path, encoding="utf-8") as f:
        return f.read()


def replace_once(content, pattern, replacement, label):
    """每个目标必须恰好匹配一次；全部校验通过后才写入任何文件。"""
    count = len(pattern.findall(content))
    if count != 1:
        raise ValueError(f"{label} 应匹配 1 处，实际匹配 {count} 处")
    return pattern.sub(replacement, content, count=1)


def write_atomic(path, content):
    """固定写回 LF；先写临时文件再原子替换，避免截断原文件。"""
    tmp_path = path + ".tmp"
    try:
        with open(tmp_path, "w", encoding="utf-8", newline="\n") as f:
            f.write(content)
        os.replace(tmp_path, path)
    except OSError:
        try:
            if os.path.exists(tmp_path):
                os.remove(tmp_path)
        except OSError:
            pass
        raise


def main():
    beijing = timezone(timedelta(hours=8))
    now = datetime.now(beijing)
    iso_date = now.date().isoformat()
    zh_date = f"{now.year} 年 {now.month:02d} 月 {now.day:02d} 日"
    en_months = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December",
    ]
    en_date = f"{en_months[now.month - 1]} {now.day}, {now.year}"
    zh_date_pattern = r"\d{4} 年 \d{2} 月 \d{2} 日"
    en_date_pattern = r"[A-Za-z]+ (?:[1-9]|[12][0-9]|3[01]), \d{4}"

    try:
        personal_original = read_text(PERSONAL_PATH)
        portfolio_original = read_text(PORTFOLIO_PATH)
    except OSError as e:
        print(f"错误：读取日期文件失败：{e}", file=sys.stderr)
        return 1

    try:
        personal = replace_once(
            personal_original,
            re.compile(rf"(footer_updated: 页面最后更新：)({zh_date_pattern})(.*)$", re.M),
            rf"\g<1>{zh_date}\g<3>",
            "personal.yml 中文页脚",
        )
        personal = replace_once(
            personal,
            re.compile(rf'(footer_updated: "Last updated: )({en_date_pattern})(".*)$', re.M),
            rf"\g<1>{en_date}\g<3>",
            "personal.yml 英文页脚",
        )

        portfolio = replace_once(
            portfolio_original,
            re.compile(rf"(最后同步：)(\d{{4}}-\d{{2}}-\d{{2}})(.*)$", re.M),
            rf"\g<1>{iso_date}\g<3>",
            "备案页同步标记",
        )
        replacements = [
            (
                rf'(<span class="zh">页面最后更新：)({zh_date_pattern})(</span>)',
                rf"\g<1>{zh_date}\g<3>",
                "备案页中文页脚",
            ),
            (
                rf'(<span class="en">Last updated: )({en_date_pattern})(</span>)',
                rf"\g<1>{en_date}\g<3>",
                "备案页英文页脚",
            ),
            (
                rf'(<span class="zh">离线备案页 · 内容同步于 )({zh_date_pattern})(.*)$',
                rf"\g<1>{zh_date}\g<3>",
                "备案页中文顶部日期",
            ),
            (
                rf'(<span class="en">Offline fallback page · Synced )({en_date_pattern})(.*)$',
                rf"\g<1>{en_date}\g<3>",
                "备案页英文顶部日期",
            ),
        ]
        for source, replacement, label in replacements:
            portfolio = replace_once(portfolio, re.compile(source, re.M), replacement, label)
    except ValueError as e:
        print(f"错误：{e}。已中止，未写入任何文件。", file=sys.stderr)
        return 1

    changes = []
    if personal != personal_original:
        changes.append((PERSONAL_PATH, personal, "_data/personal.yml"))
    if portfolio != portfolio_original:
        changes.append((PORTFOLIO_PATH, portfolio, "portfolio-single-file.html"))
    if not changes:
        print("主页与备案页日期均已是最新，无需更新。")
        return 0

    try:
        for path, content, _ in changes:
            write_atomic(path, content)
    except OSError as e:
        print(f"错误：写入日期文件失败：{e}", file=sys.stderr)
        return 1

    print(f"Updated: {zh_date} / {en_date} / 最后同步 {iso_date}")
    print("已同步：" + "、".join(label for _, _, label in changes))
    return 0


if __name__ == "__main__":
    sys.exit(main())
