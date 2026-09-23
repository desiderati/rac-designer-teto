[Diagnostics.CodeAnalysis.SuppressMessageAttribute('PSAvoidAssignmentToAutomaticVariable', 'Event', Justification = 'Event is the existing public hook parameter; renaming it would break callers.')]
param(
    [string]$Event = "SessionStart"
)

$ErrorActionPreference = "Stop"
$OutputEncoding = [System.Text.UTF8Encoding]::new($false)
[Console]::OutputEncoding = [System.Text.UTF8Encoding]::new($false)

if ($Event -ne "SessionStart") {
    exit 0
}

$repoRoot = (& git rev-parse --show-toplevel 2>$null)
if (-not $repoRoot) {
    $repoRoot = (Get-Location).Path
}

$graphPath = Join-Path $repoRoot "graphify-out/graph.json"
if (-not (Test-Path -LiteralPath $graphPath -PathType Leaf)) {
    exit 0
}

@{
    systemMessage = 'Graphify index exists. Use `query`, `path`, or `explain` only when the structural relationship is unknown; return at most three source files, read those canonical sources, and never rebuild or export the graph during a normal task. Open a known file and symbol directly.'
} | ConvertTo-Json -Compress
