param(
    [string]$RepoPath = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path,
    [switch]$DryRun
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Get-ReservedDeviceNames {
    return @(
        "CON", "PRN", "AUX", "NUL",
        "COM1", "COM2", "COM3", "COM4", "COM5", "COM6", "COM7", "COM8", "COM9",
        "LPT1", "LPT2", "LPT3", "LPT4", "LPT5", "LPT6", "LPT7", "LPT8", "LPT9"
    )
}

function Parse-GitStatusPath {
    param([string]$StatusLine)

    if ([string]::IsNullOrWhiteSpace($StatusLine)) {
        return $null
    }

    if ($StatusLine.Length -lt 4) {
        return $null
    }

    $pathPart = $StatusLine.Substring(3)

    if ($pathPart -like "* -> *") {
        $parts = $pathPart -split " -> "
        if ($parts.Length -gt 1) {
            return $parts[-1]
        }
    }

    return $pathPart
}

function Remove-ProblemPath {
    param(
        [string]$RepoPath,
        [string]$RelativePath,
        [switch]$DryRun
    )

    $nativeRelativePath = $RelativePath -replace "/", "\\"
    $nativeAbsolutePath = Join-Path $RepoPath $nativeRelativePath
    $extendedPath = "\\?\$nativeAbsolutePath"

    if ($DryRun) {
        Write-Host "[dry-run] Would remove invalid path: $RelativePath"
        return
    }

    $deleted = $false

    try {
        Remove-Item -LiteralPath $nativeAbsolutePath -Force -ErrorAction Stop
        $deleted = $true
    }
    catch {
        # Reserved Windows device names (e.g., NUL) often fail through normal PowerShell APIs.
    }

    if (-not $deleted) {
        try {
            [System.IO.File]::Delete($extendedPath)
            $deleted = $true
        }
        catch {
            # Continue with cmd fallbacks.
        }
    }

    if (-not $deleted) {
        $escapedExtendedPath = $extendedPath.Replace('"', '""')
        & cmd /d /c "del /f /q \"\"$escapedExtendedPath\"\"" *> $null
        if ($LASTEXITCODE -eq 0) {
            $deleted = $true
        }
    }

    if (-not $deleted) {
        $escapedExtendedPath = $extendedPath.Replace('"', '""')
        & cmd /d /c "erase /f /q \"\"$escapedExtendedPath\"\"" *> $null
        if ($LASTEXITCODE -eq 0) {
            $deleted = $true
        }
    }

    if (-not $deleted) {
        $escapedExtendedPath = $extendedPath.Replace('"', '""')
        & cmd /d /c "rmdir \"\"$escapedExtendedPath\"\"" *> $null
        if ($LASTEXITCODE -eq 0) {
            $deleted = $true
        }
    }

    if ($deleted) {
        Write-Host "Removed invalid path: $RelativePath"
    }
    else {
        throw "Failed to remove invalid path: $RelativePath"
    }
}

if (-not (Test-Path -LiteralPath (Join-Path $RepoPath ".git"))) {
    throw "RepoPath does not appear to be a git repository: $RepoPath"
}

$reservedDeviceNames = Get-ReservedDeviceNames
$statusOutput = & git -C $RepoPath status --porcelain=v1 -uall

$problemPaths = New-Object System.Collections.Generic.List[string]

foreach ($line in $statusOutput) {
    $path = Parse-GitStatusPath -StatusLine $line
    if ([string]::IsNullOrWhiteSpace($path)) {
        continue
    }

    $leaf = Split-Path -Leaf $path
    if ([string]::IsNullOrWhiteSpace($leaf)) {
        continue
    }

    if ($reservedDeviceNames -contains $leaf.ToUpperInvariant()) {
        $problemPaths.Add($path)
    }
}

if ($problemPaths.Count -gt 0) {
    Write-Host "Detected Windows-reserved file paths that break git add:"
    foreach ($problemPath in $problemPaths) {
        Write-Host " - $problemPath"
        Remove-ProblemPath -RepoPath $RepoPath -RelativePath $problemPath -DryRun:$DryRun
    }
}
else {
    Write-Host "No Windows-reserved path blockers detected."
}

if ($DryRun) {
    Write-Host "Dry run complete."
    exit 0
}

& git -C $RepoPath add -A -- .
if ($LASTEXITCODE -ne 0) {
    throw "git add failed after cleanup."
}

Write-Host "git add -A completed successfully."