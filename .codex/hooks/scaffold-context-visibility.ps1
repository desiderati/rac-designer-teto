[Diagnostics.CodeAnalysis.SuppressMessageAttribute('PSAvoidAssignmentToAutomaticVariable', 'Event', Justification = 'Event is the existing public hook parameter; renaming it would break callers.')]
[Diagnostics.CodeAnalysis.SuppressMessageAttribute('PSAvoidUsingEmptyCatchBlock', '', Scope = 'Function', Target = 'Resolve-RepositoryRoot', Justification = 'A failed Git-root probe deliberately falls through without breaking the hook.')]
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

function Resolve-GitMetadataPath {
    param(
        [string]$RepositoryRoot,
        [string]$GitPath
    )

    if ([System.IO.Path]::IsPathRooted($GitPath)) {
        $candidate = $GitPath
    }
    else {
        $candidate = Join-Path $RepositoryRoot $GitPath
    }

    return (Resolve-Path -LiteralPath $candidate).ProviderPath.TrimEnd(
        [System.IO.Path]::DirectorySeparatorChar,
        [System.IO.Path]::AltDirectorySeparatorChar
    )
}

function Resolve-CurrentWorktree {
    param([string]$RepositoryRoot)

    try {
        $gitDirectoryOutput = @(& git -C $RepositoryRoot rev-parse --git-dir 2>$null)
        if ($LASTEXITCODE -ne 0 -or $gitDirectoryOutput.Count -eq 0) {
            return $null
        }

        $commonDirectoryOutput = @(& git -C $RepositoryRoot rev-parse --git-common-dir 2>$null)
        if ($LASTEXITCODE -ne 0 -or $commonDirectoryOutput.Count -eq 0) {
            return $null
        }

        $gitDirectory = Resolve-GitMetadataPath `
            -RepositoryRoot $RepositoryRoot `
            -GitPath ($gitDirectoryOutput[0].Trim())
        $commonDirectory = Resolve-GitMetadataPath `
            -RepositoryRoot $RepositoryRoot `
            -GitPath ($commonDirectoryOutput[0].Trim())
        $branchOutput = @(& git -C $RepositoryRoot symbolic-ref --quiet --short HEAD 2>$null)
        $isDetached = $LASTEXITCODE -ne 0 -or $branchOutput.Count -eq 0

        if ($isDetached) {
            $kind = "detached HEAD"
            $branch = "detached HEAD"
        }
        else {
            $branch = $branchOutput[0].Trim()
            if ([string]::Equals(
                    $gitDirectory,
                    $commonDirectory,
                    [System.StringComparison]::OrdinalIgnoreCase
                )) {
                $kind = "primary checkout"
            }
            else {
                $kind = "linked worktree"
            }
        }

        return [pscustomobject]@{
            Kind   = $kind
            Name   = Split-Path -Leaf $RepositoryRoot
            Branch = $branch
            Path   = $RepositoryRoot
        }
    }
    catch {
        return $null
    }
}

if ($Event -ne "UserPromptSubmit") {
    Write-HookResult -Result ([pscustomobject]@{
            continue = $true
        })
    exit 0
}

$null = Read-HookPayload
$repositoryRoot = Resolve-RepositoryRoot
if ([string]::IsNullOrWhiteSpace($repositoryRoot)) {
    Write-HookResult -Result ([pscustomobject]@{
            continue = $true
        })
    exit 0
}

$currentWorktree = Resolve-CurrentWorktree -RepositoryRoot $repositoryRoot
if ($null -eq $currentWorktree) {
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
    $signals.Add("Graphify: an existing index is available. Use query/path/explain only when the structural relationship is unknown, return at most three sources, and never rebuild automatically; open known targets directly.")
}

if (Test-Path -LiteralPath (Join-Path $repositoryRoot "RTK.md")) {
    $signals.Add("RTK: RTK.md is available for repository-local RTK guidance.")
}

if (Test-Path -LiteralPath (Join-Path $repositoryRoot "KNOWLEDGE_BASE.md")) {
    $signals.Add("Knowledge Base: KNOWLEDGE_BASE.md is available for repository-local shared Knowledge Base guidance.")
}

$signalLines = ($signals | ForEach-Object { "- $_" }) -join [Environment]::NewLine
$worktreeLines = @(
    "Current worktree:"
    "- Kind: $($currentWorktree.Kind)"
    "- Name: $($currentWorktree.Name)"
    "- Branch: $($currentWorktree.Branch)"
    "- Path: $($currentWorktree.Path)"
) -join [Environment]::NewLine
$additionalContextParts = @(
    "Scaffold Context Visibility for this repository:"
    $worktreeLines
)
if (-not [string]::IsNullOrWhiteSpace($signalLines)) {
    $additionalContextParts += $signalLines
}
$additionalContextParts += @(
    'Preserve the AGENTS.md Continuation Suggestions: use `Próximos passos:`, optional `Melhorias sugeridas:` (0–3 grounded items), then one sanitized suggested-prompt block only when follow-up exists; keep scope and exclusions.'
    'Preserve the AGENTS.md Suggestion System: after material PRD, ADR, or non-trivial plan creation/review, silently evaluate `.agents/references/suggestion-system.md`. `!suggest` returns one; `!suggest explore` maps up to 12 and shortlists 3. Never mutate or auto-load skills, agents, or councils solely to suggest.'
    'Preserve the AGENTS.md Suggested Prompt: after a validated unambiguous plan/dry-run, suggest the exact confirmation phrase instead of another planning turn; if sensitive or state-changing scope is ambiguous, ask for planning or explicit confirmation instead of execution.'
    "Preserve the AGENTS.md Scaffold Usage Trace: report only .agents/prompts, .agents/templates, and .agents/examples files actually read or applied in this turn. Do not list files merely because they exist or would have been relevant."
    "Preserve the AGENTS.md Skills Usage Trace: in the final response, include 'Skills usage:' with one bullet per skill only when a skill's SKILL.md instructions were actually read or its workflow was actually applied in this turn; omit the note when no skill was used."
    'Preserve the AGENTS.md Hooks Trace: in the final response, include "Hooks" with bullets formatted "- `{hook-slug}`: description" only for hook signals visibly active in this session; omit the note when no hook signal was visible.'
)
$additionalContext = $additionalContextParts -join (
    [Environment]::NewLine + [Environment]::NewLine
)

Write-HookResult -Result ([pscustomobject]@{
        continue           = $true
        hookSpecificOutput = [pscustomobject]@{
            hookEventName     = "UserPromptSubmit"
            additionalContext = $additionalContext
        }
    })
