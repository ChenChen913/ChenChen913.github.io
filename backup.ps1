# 个人主页备份脚本
# 用法：.\backup.ps1 [-Note "备注信息"] [-CreateTag]
# 示例：.\backup.ps1 -Note "新增实习经历"
#       .\backup.ps1 -Note "新增实习经历" -CreateTag   # 非交互环境强制创建 Git tag

param(
    [string]$Note = "stable",
    [switch]$CreateTag
)

$Date = Get-Date -Format "yyyy-MM-dd"

# 消毒 Note：先拆掉路径分隔符与穿越成分，再替换文件名非法字符，
# 防止 $Note 注入路径（..\..\ 等）把备份写出 backups/ 目录
$SafeNote = $Note -replace '[\\/]', '_'
$SafeNote = $SafeNote -replace '\.\.', '_'
$SafeNote = $SafeNote -replace '[\\/:*?"<>|]', '_'
$SafeNote = $SafeNote -replace '[\x00-\x1F]', ''
$SafeNote = $SafeNote.Trim().TrimEnd('.')
if ([string]::IsNullOrWhiteSpace($SafeNote)) { $SafeNote = "stable" }

$BackupName = "$Date-$SafeNote"

# 脚本固定位于仓库根目录，不依赖调用者 CWD（跨平台用 Path.Combine，不用硬编码反斜杠）
$RepoRoot = $PSScriptRoot
$BackupRoot = [System.IO.Path]::GetFullPath([System.IO.Path]::Combine($RepoRoot, 'backups'))
$BackupPath = [System.IO.Path]::GetFullPath([System.IO.Path]::Combine($RepoRoot, 'backups', $BackupName))
if (-not $BackupPath.StartsWith($BackupRoot + [System.IO.Path]::DirectorySeparatorChar, [System.StringComparison]::OrdinalIgnoreCase)) {
    Write-Error "备份路径越界，已中止: $BackupPath"
    exit 1
}

# 核心文件和目录列表
$CoreItems = @(
    "_data",
    "_layouts",
    "_projects",
    "_publications",
    "assets",
    "index.html",
    "en.html",
    "404.html",
    "index_empty.html",
    "style.css",
    "script.js",
    "_config.yml"
)

# 先复制到暂存目录，全部成功后再替换正式备份：
# 任一复制失败都不会破坏上一份完好备份（不再"先归档后复制"）
$StagingPath = "$BackupPath.tmp-" + (Get-Date -Format 'yyyyMMdd-HHmmss')
New-Item -ItemType Directory -Path $StagingPath -Force | Out-Null

# 复制核心文件
$CopiedCount = 0
$CopyFailed = $false
foreach ($item in $CoreItems) {
    $src = Join-Path $RepoRoot $item
    if (Test-Path -LiteralPath $src) {
        try {
            Copy-Item -LiteralPath $src -Destination $StagingPath -Recurse -ErrorAction Stop
            $CopiedCount++
        } catch {
            Write-Error "复制失败: $item — $($_.Exception.Message)"
            $CopyFailed = $true
        }
    } else {
        Write-Warning "跳过缺失项: $item"
    }
}

if ($CopyFailed -or $CopiedCount -eq 0) {
    Write-Error "备份过程中存在失败项（或没有任何核心项被复制），已中止；暂存目录将被清理。"
    Remove-Item -LiteralPath $StagingPath -Recurse -Force -ErrorAction SilentlyContinue
    exit 1
}

# 写入备份信息
$Info = @"
备份日期: $Date
备注: $Note (消毒后: $SafeNote)
备份文件数: $CopiedCount 项
创建者: backup.ps1 自动生成
"@
try {
    $Info | Out-File (Join-Path $StagingPath 'BACKUP-INFO.txt') -Encoding UTF8 -ErrorAction Stop
} catch {
    Write-Error "写入备份信息失败，已中止: $($_.Exception.Message)"
    Remove-Item -LiteralPath $StagingPath -Recurse -Force -ErrorAction SilentlyContinue
    exit 1
}

# 暂存成功：若存在旧备份，先归档（带时间戳重命名）
if (Test-Path -LiteralPath $BackupPath) {
    $OldPath = "$BackupPath-旧-" + (Get-Date -Format 'yyyyMMdd-HHmmss')
    Write-Host "备份目录已存在，旧备份归档为: $OldPath" -ForegroundColor Yellow
    try {
        Move-Item -LiteralPath $BackupPath -Destination $OldPath -Force -ErrorAction Stop
    } catch {
        Write-Error "归档旧备份失败，已中止: $($_.Exception.Message)"
        Remove-Item -LiteralPath $StagingPath -Recurse -Force -ErrorAction SilentlyContinue
        exit 1
    }
}

# 暂存目录转正为正式备份
try {
    Move-Item -LiteralPath $StagingPath -Destination $BackupPath -Force -ErrorAction Stop
} catch {
    Write-Error "正式化备份目录失败，已中止: $($_.Exception.Message)"
    exit 1
}

Write-Host ""
Write-Host "==========================================" -ForegroundColor Green
Write-Host "  备份完成！" -ForegroundColor Green
Write-Host "  目录: $BackupPath" -ForegroundColor Green
Write-Host "  文件: $CopiedCount 项" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Green
Write-Host ""

# 询问是否创建 Git tag（-CreateTag 显式指定；stdin 被重定向时视为非交互环境，跳过提问）
$TagAnswer = 'n'
if ($CreateTag) {
    $TagAnswer = 'y'
} elseif ([Console]::IsInputRedirected) {
    Write-Warning "检测到非交互环境（stdin 重定向），跳过 Git tag；如需强制创建请加 -CreateTag 参数"
} else {
    $TagAnswer = Read-Host "是否创建 Git tag 做远程版本快照？(y/N)"
}
if ($TagAnswer -eq "y" -or $TagAnswer -eq "Y") {
    $TagName = "v$Date"
    if ($SafeNote -ne "stable") {
        $TagName += "-$SafeNote"
    }
    if ($TagName -notmatch '^[A-Za-z0-9][A-Za-z0-9._-]*$') {
        Write-Warning "Tag 名含非法字符 (${TagName})，已跳过创建；请使用字母/数字/._-"
    } else {
        if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
            Write-Warning "未检测到 git 命令，跳过 tag 创建"
        } else {
            $TagMessage = "$Date 备份: $SafeNote"
            $tagOut = git tag -a $TagName -m $TagMessage 2>&1
            $tagExit = $LASTEXITCODE
            if ($tagExit -eq 0) {
                $pushOut = git push origin $TagName 2>&1
                $pushExit = $LASTEXITCODE
                if ($pushExit -eq 0) {
                    Write-Host "Git tag '$TagName' 已创建并推送到远程" -ForegroundColor Green
                } else {
                    Write-Warning "Git tag '$TagName' 已创建（本地），推送失败：$pushOut"
                }
            } else {
                Write-Warning "Git tag 创建失败：$tagOut"
            }
        }
    }
}

Write-Host ""
Write-Host "提示: backups/ 已在 .gitignore 中，不会推送到 GitHub。" -ForegroundColor Cyan
Write-Host "      Git tag 是远程备份，不怕丢。" -ForegroundColor Cyan
