#!/usr/bin/env python3
"""更新 personal.yml 中的页面最后更新日期为当前北京时间"""
import re
from datetime import datetime, timezone, timedelta

BEIJING = timezone(timedelta(hours=8))
now = datetime.now(BEIJING)

# 中文格式：2026 年 07 月 05 日
zh_date = f"{now.year} 年 {now.month:02d} 月 {now.day:02d} 日"
# 英文格式：July 5, 2026
en_months = ['January','February','March','April','May','June',
             'July','August','September','October','November','December']
en_date = f"{en_months[now.month-1]} {now.day}, {now.year}"

path = r"C:\Users\11853\Desktop\个人主页2\_data\personal.yml"
with open(path, encoding='utf-8') as f:
    content = f.read()

# 替换中文日期
content = re.sub(
    r"(footer_updated: 页面最后更新：).*",
    rf"\g<1>{zh_date}",
    content
)
# 替换英文日期
content = re.sub(
    r'(footer_updated: "Last updated: ).*(")',
    rf'\g<1>{en_date}\g<2>',
    content
)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)

print(f"Updated: {zh_date} / {en_date}")
