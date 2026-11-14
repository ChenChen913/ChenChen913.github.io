#!/usr/bin/env python3
"""通过 GitHub Git Data API 做一次原子提交（本机 git 推不上去时用）。

背景
    本机 HTTP 代理拒绝 git 的 CONNECT 隧道，`git push` 会 502。
    但 `gh` 走 HTTPS API 是通的，所以改走 Git Data API。
    blob -> tree -> commit -> ref 四步，与 git push 等价：
    保留全部历史，只新增一个 commit，不做 force 覆盖。

用法
    1. 改下面的 FILES（要提交的文件，相对仓库根）和 MESSAGE（提交说明）
    2. python docs/push-via-api.py --dry-run   # 先看会改哪些，不真提交
    3. python docs/push-via-api.py             # 真提交

    --dry-run 只上传 blob（不创建 tree/commit，也不动 ref），
    用来验证路径写没写对、文件读不读得到。
"""
import base64
import json
import os
import subprocess
import sys

REPO = "ChenChen913/ChenChen913.github.io"
# 脚本放在 docs/ 下，上一级就是仓库根；换位置也不用改
SRC = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TMP = os.environ.get("TEMP") or os.environ.get("TMPDIR") or "."

DRY_RUN = "--dry-run" in sys.argv

# ==================== 每次提交改这里 ====================
FILES = [
    # "README.md",
    # "_config.yml",
]

MESSAGE = """提交说明"""
# =======================================================


def gh(args, input_path=None):
    cmd = ["gh", "api"] + args
    if input_path:
        cmd += ["--input", input_path]
    proc = subprocess.run(cmd, capture_output=True, text=True, encoding="utf-8")
    if proc.returncode != 0:
        print("gh api 失败:", " ".join(cmd), file=sys.stderr)
        print(proc.stderr, file=sys.stderr)
        sys.exit(1)
    return proc.stdout.strip()


def main():
    if not FILES:
        print("错误：FILES 为空，先填要提交的文件（相对仓库根）。", file=sys.stderr)
        return 1
    if MESSAGE.strip() == "提交说明":
        print("错误：MESSAGE 还是默认值，请写清这次改了什么。", file=sys.stderr)
        return 1

    missing = [p for p in FILES if not os.path.isfile(os.path.join(SRC, p))]
    if missing:
        print("错误：以下文件不存在（路径相对仓库根，用正斜杠）：", file=sys.stderr)
        for p in missing:
            print("  -", p, file=sys.stderr)
        return 1

    head = gh([f"repos/{REPO}/git/ref/heads/main", "--jq", ".object.sha"])
    tree = gh([f"repos/{REPO}/git/commits/{head}", "--jq", ".tree.sha"])
    print(f"当前 main : {head}")
    print(f"当前 tree : {tree}")

    entries = []
    for path in FILES:
        with open(os.path.join(SRC, path), "rb") as f:
            raw = f.read()
        req = os.path.join(TMP, "gh_push_blob.json")
        with open(req, "w", encoding="utf-8") as f:
            json.dump({"content": base64.b64encode(raw).decode("ascii"),
                       "encoding": "base64"}, f)
        sha = gh([f"repos/{REPO}/git/blobs", "-X", "POST", "--jq", ".sha"],
                 input_path=req)
        entries.append({"path": path, "mode": "100644", "type": "blob", "sha": sha})
        print(f"  blob {sha[:10]}  {path}  ({len(raw)} 字节)")

    if DRY_RUN:
        print("\n[dry-run] 到此为止：未创建 tree / commit，也未移动 ref。")
        return 0

    tree_req = os.path.join(TMP, "gh_push_tree.json")
    with open(tree_req, "w", encoding="utf-8") as f:
        json.dump({"base_tree": tree, "tree": entries}, f)
    new_tree = gh([f"repos/{REPO}/git/trees", "-X", "POST", "--jq", ".sha"],
                  input_path=tree_req)
    print(f"新 tree  : {new_tree}")

    commit_req = os.path.join(TMP, "gh_push_commit.json")
    with open(commit_req, "w", encoding="utf-8") as f:
        json.dump({"message": MESSAGE, "tree": new_tree, "parents": [head]},
                  f, ensure_ascii=False)
    new_commit = gh([f"repos/{REPO}/git/commits", "-X", "POST", "--jq", ".sha"],
                    input_path=commit_req)
    print(f"新 commit: {new_commit}")

    # force=false：期间若有人推了新提交，这里会失败而不是覆盖对方的commit
    ref_req = os.path.join(TMP, "gh_push_ref.json")
    with open(ref_req, "w", encoding="utf-8") as f:
        json.dump({"sha": new_commit, "force": False}, f)
    gh([f"repos/{REPO}/git/refs/heads/main", "-X", "PATCH", "--jq", ".object.sha"],
       input_path=ref_req)
    print("main 已前移。下一步：gh run list -R %s --workflow=deploy.yml" % REPO)
    return 0


if __name__ == "__main__":
    sys.exit(main())
