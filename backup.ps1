# 个人主页备份脚本
# 用法：.\backup.ps1 [-Note "备注信息"]
# 示例：.\backup.ps1 -Note "新增实习经历"

param(
    [string]$Note = "stable"
)

$Date = Get-Date -Format "yyyy-MM-dd"
$BackupName = "$Date-$Note"
$BackupPath = "backups\$BackupName"

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

# 创建备份目录
if (Test-Path $BackupPath) {
    Write-Host "备份目录已存在，将覆盖: $BackupPath" -ForegroundColor Yellow
    Remove-Item -Recurse -Force $BackupPath
}
New-Item -ItemType Directory -Path $BackupPath -Force | Out-Null

# 复制核心文件
$CopiedCount = 0
foreach ($item in $CoreItems) {
    if (Test-Path $item) {
        Copy-Item -Recurse $item $BackupPath
        $CopiedCount++
    }
}

# 写入备份信息
$Info = @"
备份日期: $Date
备注: $Note
备份文件数: $CopiedCount 项
创建者: backup.ps1 自动生成
"@
$Info | Out-File "$BackupPath\BACKUP-INFO.txt" -Encoding UTF8

Write-Host ""
Write-Host "==========================================" -ForegroundColor Green
Write-Host "  备份完成！" -ForegroundColor Green
Write-Host "  目录: $BackupPath" -ForegroundColor Green
Write-Host "  文件: $CopiedCount 项" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Green
Write-Host ""

# 询问是否创建 Git tag
$CreateTag = Read-Host "是否创建 Git tag 做远程版本快照？(y/N)"
if ($CreateTag -eq "y" -or $CreateTag -eq "Y") {
    $TagName = "v$Date"
    if ($Note -ne "stable") {
        $TagName += "-$Note"
    }
    $TagMessage = "$Date 备份: $Note"
    git tag -a $TagName -m $TagMessage 2>$null
    if ($LASTEXITCODE -eq 0) {
        git push origin $TagName 2>$null
        if ($LASTEXITCODE -eq 0) {
            Write-Host "Git tag '$TagName' 已创建并推送到远程" -ForegroundColor Green
        } else {
            Write-Host "Git tag '$TagName' 已创建（本地），推送失败，请稍后手动 push" -ForegroundColor Yellow
        }
    } else {
        Write-Host "Git tag 创建失败（可能已存在），跳过" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "提示: backups/ 已在 .gitignore 中，不会推送到 GitHub。" -ForegroundColor Cyan
Write-Host "      Git tag 是远程备份，不怕丢。" -ForegroundColor Cyan
