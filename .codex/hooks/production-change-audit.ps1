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

$templatePath = Join-Path $repositoryRoot ".agents/templates/production-changes.template.md"
if (-not (Test-Path -LiteralPath $templatePath)) {
    Write-HookResult -Result ([pscustomobject]@{
        continue = $true
    })
    exit 0
}

$additionalContext = @(
    "Production Change Audit for this repository:"
    "- After an explicitly authorized state-changing production action completes, create the audit record."
    "- Template: .agents/templates/production-changes.template.md"
    "- Destination: .agents/production-changes/YYYY-MM/YYYYMMDD-{slug}.production-change.md"
    "- Do not create the record before the production mutation; the record documents what actually happened."
    "- Use sanitized evidence only; never include complete secrets, tokens, cookies, private keys, sensitive personal data, intact financial payloads, or raw logs containing credentials."
    "- In the same final chat response, include a concise `Production audit:` section."
    "- Each bullet must be written in the final response language and capture the executed action, affected target, and observed result."
    "- Keep `Production audit:` bullets sanitized and minimal; do not paste raw command output."
    "- If .agents/scripts/validate_production_changes.py is available, run it before final close-out when the production change record contains command, log, link, screenshot, payload, or configuration evidence."
    "Production audit:"
) -join ([Environment]::NewLine + [Environment]::NewLine)

Write-HookResult -Result ([pscustomobject]@{
    continue = $true
    hookSpecificOutput = [pscustomobject]@{
        hookEventName = "UserPromptSubmit"
        additionalContext = $additionalContext
    }
})
