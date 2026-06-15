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
            # Fall through to the .codex heuristic.
        }

        $codexDirectory = Join-Path $candidate ".codex"
        if (Test-Path -LiteralPath $codexDirectory) {
            return (Resolve-Path -LiteralPath $candidate).ProviderPath
        }
    }

    return $null
}

if ($Event -ne "UserPromptSubmit") {
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

$signals = New-Object System.Collections.Generic.List[string]

if ((Test-Path -LiteralPath (Join-Path $repositoryRoot ".agents/prompts")) -or
    (Test-Path -LiteralPath (Join-Path $repositoryRoot ".agents/templates")) -or
    (Test-Path -LiteralPath (Join-Path $repositoryRoot ".agents/examples"))) {
    $signals.Add("Scaffold: .agents/prompts, .agents/templates, and .agents/examples are available. Track exact files under these directories that you actually read or applied in this turn. In the final response, include 'Scaffold usage:' with exact paths grouped as prompts, templates, and examples only when at least one such file was used; omit the note when none were used.")
}

if (Test-Path -LiteralPath (Join-Path $repositoryRoot ".agents/references/local-continuity.md")) {
    $signals.Add("Continuity contract: changelog and work-item handling is governed by AGENTS.md plus .agents/references/local-continuity.md.")
}

if ((Test-Path -LiteralPath (Join-Path $repositoryRoot "graphify-out/graph.json")) -and
    (Test-Path -LiteralPath (Join-Path $repositoryRoot "graphify-out/GRAPH_REPORT.md"))) {
    $signals.Add("Graphify: graphify-out/GRAPH_REPORT.md is available; prefer it before broad raw-file architecture searches.")
}

if (Test-Path -LiteralPath (Join-Path $repositoryRoot "RTK.md")) {
    $signals.Add("RTK: RTK.md is available for repository-local RTK guidance.")
}

if (Test-Path -LiteralPath (Join-Path $repositoryRoot "KNOWLEDGE_BASE.md")) {
    $signals.Add("Knowledge Base: KNOWLEDGE_BASE.md is available for repository-local shared Knowledge Base guidance.")
}

if ($signals.Count -eq 0) {
    Write-HookResult -Result ([pscustomobject]@{
        continue = $true
    })
    exit 0
}

$signalLines = ($signals | ForEach-Object { "- $_" }) -join [Environment]::NewLine
$additionalContext = @(
    "Scaffold Context Visibility for this repository:"
    $signalLines
    "Preserve the AGENTS.md Scaffold Usage Trace: report only .agents/prompts, .agents/templates, and .agents/examples files actually read or applied in this turn. Do not list files merely because they exist or would have been relevant."
    "Preserve the AGENTS.md Skills Usage Trace: in the final response, include 'Skills usage:' with one bullet per skill only when a skill's SKILL.md instructions were actually read or its workflow was actually applied in this turn; omit the note when no skill was used."
    'Preserve the AGENTS.md Hooks Trace: in the final response, include "Hooks" with bullets formatted "- `{hook-slug}`: description" only for hook signals visibly active in this session; omit the note when no hook signal was visible.'
) -join ([Environment]::NewLine + [Environment]::NewLine)

Write-HookResult -Result ([pscustomobject]@{
    continue = $true
    hookSpecificOutput = [pscustomobject]@{
        hookEventName = "UserPromptSubmit"
        additionalContext = $additionalContext
    }
})
