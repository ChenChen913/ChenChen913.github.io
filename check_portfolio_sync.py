#!/usr/bin/env python3
"""检查 portfolio-single-file.html 的"最后同步"标记是否落后于数据文件的最后提交日期。"""
import os
import re
import subprocess
import sys
from datetime import datetime

repo = os.path.dirname(os.path.abspath(__file__))
portfolio = os.path.join(repo, "portfolio-single-file.html")

with open(portfolio, encoding="utf-8") as f:
    text = f.read()

m = re.search(r"最后同步：(\d{4}-\d{2}-\d{2})", text)
if not m:
    print("错误：未找到'最后同步'标记（格式：最后同步：YYYY-MM-DD）。", file=sys.stderr)
    sys.exit(1)
marker = datetime.strptime(m.group(1), "%Y-%m-%d").date()

paths = ["_data", "_projects/campus-qa-bot.md", "_publications/rgv-dynamic-scheduling.md"]
proc = subprocess.run(
    ["git", "log", "-1", "--format=%cs", "--"] + paths,
    cwd=repo,
    capture_output=True,
    text=True,
)
if proc.returncode != 0:
    print(f"错误：git log 执行失败：{proc.stderr.strip()}", file=sys.stderr)
    sys.exit(1)
latest = proc.stdout.strip()
if not latest:
    print("错误：未找到相关数据文件的提交记录。", file=sys.stderr)
    sys.exit(1)
last_commit = datetime.strptime(latest, "%Y-%m-%d").date()

if last_commit > marker:
    print(
        f"错误：数据文件最近提交日期（{last_commit}）晚于 portfolio 的'最后同步'标记（{marker}）。\n"
        "请手动同步 portfolio-single-file.html 的内容并更新标记后重新提交。",
        file=sys.stderr,
    )
    sys.exit(1)
print(f"portfolio 同步检查通过（最后同步 {marker}，数据最后提交 {last_commit}）。")
