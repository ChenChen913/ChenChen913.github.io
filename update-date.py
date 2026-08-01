#!/usr/bin/env python3
"""更新 personal.yml 中的页面最后更新日期为当前北京时间"""
import os
import re
import sys
from datetime import datetime, timezone, timedelta

BEIJING = timezone(timedelta(hours=8))
now = datetime.now(BEIJING)

# 中文格式：2026 年 07 月 05 日
zh_date = f"{now.year} 年 {now.month:02d} 月 {now.day:02d} 日"
# 英文格式：July 5, 2026
en_months = ['January','February','March','April','May','June',
             'July','August','September','October','November','December']
en_date = f"{en_months[now.month-1]} {now.day}, {now.year}"

# 基于本脚本所在目录定位，保证在任意机器/系统上都能运行
path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "_data", "personal.yml")
with open(path, encoding='utf-8') as f:
    content = f.read()
original = content

# 替换中文日期（精确匹配日期格式，其余行尾内容原样保留，防止吞掉注释/空白）
zh_pattern = re.compile(r"(footer_updated: 页面最后更新：)(\d{4} 年 \d{2} 月 \d{2} 日)(.*)$", re.M)
en_pattern = re.compile(r'(footer_updated: "Last updated: )([A-Za-z]+ \d{1,2}, \d{4})(".*)$', re.M)
zh_matched = bool(zh_pattern.search(content))
en_matched = bool(en_pattern.search(content))
content = re.sub(
    zh_pattern,
    rf"\g<1>{zh_date}\g<3>",
    content
)
# 替换英文日期
content = re.sub(
    en_pattern,
    rf'\g<1>{en_date}\g<3>',
    content
)

if content == original:
    if zh_matched and en_matched:
        print("日期已是最新，无需更新。")
        sys.exit(0)
    print("错误：未匹配到 footer_updated 日期格式，请检查 _data/personal.yml 中的字段格式。", file=sys.stderr)
    sys.exit(1)

if not (zh_matched and en_matched):
    print("错误：仅部分日期模式匹配成功，为防止日期静默过期，已中止写入。", file=sys.stderr)
    sys.exit(1)

# 固定写回 LF 行尾，与 .editorconfig / .gitattributes 约定一致
with open(path, 'w', encoding='utf-8', newline='\n') as f:
    f.write(content)

print(f"Updated: {zh_date} / {en_date}")
