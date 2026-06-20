param(
    [string]$Event = "UserPromptSubmit"
)

$ErrorActionPreference = "Stop"
[Console]::OutputEncoding = [System.Text.UTF8Encoding]::new($false)
$OutputEncoding = [Console]::OutputEncoding

function Write-HookResult {
    param([object]$Result)

    $Result | ConvertTo-Json -Depth 8 -Compress
}

function Read-HookPayload {
    $raw = [Console]::In.ReadToEnd()
    if ([string]::IsNullOrWhiteSpace($raw)) {
        return [pscustomobject]@{}
    }

    try {
        return $raw | ConvertFrom-Json
    }
    catch {
        return [pscustomobject]@{}
    }
}

function Resolve-RepositoryRoot {
    $candidates = New-Object System.Collections.Generic.List[string]

    if ($PSScriptRoot) {
        $scriptRepositoryRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
        if (-not [string]::IsNullOrWhiteSpace($scriptRepositoryRoot)) {
            $candidates.Add($scriptRepositoryRoot)
        }
    }

    foreach ($candidate in $candidates) {
        if ([string]::IsNullOrWhiteSpace($candidate) -or -not (Test-Path -LiteralPath $candidate)) {
            continue
        }

        try {
            $gitRoot = & git -C $candidate rev-parse --show-toplevel 2>$null
            if ($LASTEXITCODE -eq 0 -and -not [string]::IsNullOrWhiteSpace($gitRoot)) {
                return (Resolve-Path -LiteralPath $gitRoot).ProviderPath
            }
        }
        catch {
            # No Git root available for this installed hook.
        }
    }

    return $null
}

function Invoke-Git {
    param(
        [string]$RepositoryRoot,
        [string[]]$Arguments
    )

    $output = & git -C $RepositoryRoot @Arguments 2>$null
    if ($LASTEXITCODE -ne 0) {
        return $null
    }

    return (($output | Out-String).Trim())
}

function Resolve-GitPath {
    param(
        [string]$RepositoryRoot,
        [string]$Name
    )

    $path = Invoke-Git -RepositoryRoot $RepositoryRoot -Arguments @("rev-parse", "--git-path", $Name)
    if ([string]::IsNullOrWhiteSpace($path)) {
        return $null
    }

    if ([System.IO.Path]::IsPathRooted($path)) {
        return $path
    }

    return (Join-Path $RepositoryRoot $path)
}

function Get-DangerousGitState {
    param([string]$RepositoryRoot)

    $checks = [ordered]@{
        "merge"       = "MERGE_HEAD"
        "cherry-pick" = "CHERRY_PICK_HEAD"
        "revert"      = "REVERT_HEAD"
        "bisect"      = "BISECT_LOG"
        "rebase"      = "rebase-merge"
        "rebase-apply" = "rebase-apply"
    }

    foreach ($label in $checks.Keys) {
        $gitPath = Resolve-GitPath -RepositoryRoot $RepositoryRoot -Name $checks[$label]
        if (-not [string]::IsNullOrWhiteSpace($gitPath) -and (Test-Path -LiteralPath $gitPath)) {
            return $label
        }
    }

    return $null
}

function Get-StatePath {
    param([string]$RepositoryRoot)

    return (Join-Path $RepositoryRoot ".codex/hooks/git-freshness-preflight/state/session.json")
}

function Write-SessionState {
    param([string]$RepositoryRoot)

    $statePath = Get-StatePath -RepositoryRoot $RepositoryRoot
    $stateDirectory = Split-Path -Parent $statePath
    New-Item -ItemType Directory -Path $stateDirectory -Force | Out-Null

    $state = [pscustomobject]@{
        sessionStartUtc = [DateTimeOffset]::UtcNow.ToString("o")
        repositoryRoot = $RepositoryRoot
    }
    $state | ConvertTo-Json -Depth 4 | Set-Content -LiteralPath $statePath -Encoding utf8
}

function Read-SessionState {
    param([string]$RepositoryRoot)

    $statePath = Get-StatePath -RepositoryRoot $RepositoryRoot
    if (-not (Test-Path -LiteralPath $statePath)) {
        return $null
    }

    try {
        return (Get-Content -Raw -LiteralPath $statePath | ConvertFrom-Json)
    }
    catch {
        return $null
    }
}

function Get-SessionStartUtc {
    param([object]$State)

    if ($null -eq $State -or $null -eq $State.sessionStartUtc) {
        return $null
    }

    if ($State.sessionStartUtc -is [DateTimeOffset]) {
        return $State.sessionStartUtc.UtcDateTime
    }

    if ($State.sessionStartUtc -is [DateTime]) {
        return $State.sessionStartUtc.ToUniversalTime()
    }

    $sessionStartText = [string]$State.sessionStartUtc
    if ([string]::IsNullOrWhiteSpace($sessionStartText)) {
        return $null
    }

    try {
        return ([DateTimeOffset]::Parse($sessionStartText)).UtcDateTime
    }
    catch {
        try {
            return ([DateTime]::Parse($sessionStartText)).ToUniversalTime()
        }
        catch {
            return $null
        }
    }
}

function Get-FetchHeadUtc {
    param([string]$RepositoryRoot)

    $fetchHeadPath = Resolve-GitPath -RepositoryRoot $RepositoryRoot -Name "FETCH_HEAD"
    if ([string]::IsNullOrWhiteSpace($fetchHeadPath) -or -not (Test-Path -LiteralPath $fetchHeadPath)) {
        return $null
    }

    return (Get-Item -LiteralPath $fetchHeadPath).LastWriteTimeUtc
}

function Get-AheadBehind {
    param(
        [string]$RepositoryRoot,
        [string]$Upstream
    )

    if ([string]::IsNullOrWhiteSpace($Upstream)) {
        return $null
    }

    $counts = Invoke-Git -RepositoryRoot $RepositoryRoot -Arguments @(
        "rev-list",
        "--left-right",
        "--count",
        "HEAD...@{u}"
    )
    if ([string]::IsNullOrWhiteSpace($counts)) {
        return $null
    }

    $parts = $counts -split "\s+"
    if ($parts.Count -lt 2) {
        return $null
    }

    return [pscustomobject]@{
        ahead = [int]$parts[0]
        behind = [int]$parts[1]
    }
}

if ($Event -notin @("SessionStart", "UserPromptSubmit")) {
    Write-HookResult -Result ([pscustomobject]@{
        continue = $true
    })
    exit 0
}

$payload = Read-HookPayload
$repositoryRoot = Resolve-RepositoryRoot
if ([string]::IsNullOrWhiteSpace($repositoryRoot)) {
    Write-HookResult -Result ([pscustomobject]@{
        continue = $true
    })
    exit 0
}

if ($Event -eq "SessionStart") {
    try {
        Write-SessionState -RepositoryRoot $repositoryRoot
    }
    catch {
        # Missing state must not break session startup; UserPromptSubmit will warn.
    }
}

$state = Read-SessionState -RepositoryRoot $repositoryRoot
$sessionStartUtc = Get-SessionStartUtc -State $state
$branch = Invoke-Git -RepositoryRoot $repositoryRoot -Arguments @("branch", "--show-current")
$upstream = Invoke-Git -RepositoryRoot $repositoryRoot -Arguments @(
    "rev-parse",
    "--abbrev-ref",
    "--symbolic-full-name",
    "@{u}"
)
$dangerousState = Get-DangerousGitState -RepositoryRoot $repositoryRoot
$aheadBehind = Get-AheadBehind -RepositoryRoot $repositoryRoot -Upstream $upstream

$signals = New-Object System.Collections.Generic.List[string]

if ([string]::IsNullOrWhiteSpace($branch)) {
    $signals.Add("Git branch: detached HEAD.")
}
else {
    $signals.Add("Git branch: ``$branch``.")
}

if (-not [string]::IsNullOrWhiteSpace($dangerousState)) {
    $signals.Add("A Git operation appears to be in progress (``$dangerousState``); do not modify files or continue Git operations until the operator resolves it.")
}

if ($null -ne $aheadBehind) {
    if ($aheadBehind.ahead -gt 0 -and $aheadBehind.behind -gt 0) {
        $signals.Add("Current remote-tracking refs show branch divergence (ahead=$($aheadBehind.ahead), behind=$($aheadBehind.behind)); do not fast-forward automatically.")
    }
    elseif ($aheadBehind.behind -gt 0) {
        $signals.Add("Current remote-tracking refs show this branch behind by $($aheadBehind.behind) commit(s); ask before applying ``git merge --ff-only``.")
    }
}

if ($signals.Count -le 1) {
    Write-HookResult -Result ([pscustomobject]@{
        continue = $true
    })
    exit 0
}

$signalLines = ($signals | ForEach-Object { "- $_" }) -join [Environment]::NewLine
$additionalContext = @(
    "Git Freshness Preflight for this repository:"
    $signalLines
    "This hook is advisory only: it must not fetch, pull, merge, stash, commit, or resolve conflicts by itself."
) -join ([Environment]::NewLine + [Environment]::NewLine)

Write-HookResult -Result ([pscustomobject]@{
    continue = $true
    hookSpecificOutput = [pscustomobject]@{
        hookEventName = $Event
        additionalContext = $additionalContext
    }
})
