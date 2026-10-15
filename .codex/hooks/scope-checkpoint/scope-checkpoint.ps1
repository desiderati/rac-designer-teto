[Diagnostics.CodeAnalysis.SuppressMessageAttribute('PSAvoidAssignmentToAutomaticVariable', 'Event', Justification = 'Preserve the existing public hook -Event parameter contract.')]
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

try {
    # Consume the payload so the hook protocol completes, but never parse, retain, hash, or echo it.
    $null = [Console]::In.ReadToEnd()

    if ($Event -ne "UserPromptSubmit") {
        Write-HookResult -Result ([pscustomobject]@{ continue = $true })
        exit 0
    }

    $additionalContext = @'
Scope Checkpoint (consultative, static, and non-blocking):

- Maintain a concise internal contract: mission (objective, deliverables, done evidence); scope (total authorized universe, current focus, restriction source, unresolved remainder); trajectory (last evidence, smallest next action, expected evidence, evidenced blockers); detour (MAIN or SIDEQUEST, authorization, temporary objective, exit condition, return checkpoint).
- Before introducing a new domain, plan, gate, skill, external target, or investigation, classify the proposed material action. CONTINUE only when it produces or validates an active deliverable or removes an evidenced blocker. SIDEQUEST only when the operator explicitly authorizes a temporary objective by command or unequivocal natural language. RECENTER otherwise: abandon the detour and resume the smallest already-authorized action.
- Optional self-imposed hardening is not an evidenced blocker while an approved canonical path can still produce the deliverable. Pursue it only as an explicitly authorized side quest; otherwise recenter on the canonical path.
- A focus subset never erases the unresolved authorized universe. Only an explicit operator instruction may replace, cancel, or close the mission or its pending items.
- `!sidequest <objective>` preserves one return checkpoint and never creates a task, branch, or worktree automatically. Do not nest side quests.
- `!mainquest` or unequivocal natural language restores the main objective, focus, unresolved remainder, and next action. Without an active side quest, it is an informative no-op.
- `!scope` and its alias `!current-scope` report the main mission, current focus, unresolved remainder, active frame, and next action from the available conversation and explicit compaction context. They are read-only, never close a side quest, and never imply that the hook persisted mission state.
- Keep CONTINUE silent. Do not add ceremony, hard-block tools, infer drift from tool counts, or persist/reproduce prompt, response, tool-input, or tool-output content.
'@

    Write-HookResult -Result ([pscustomobject]@{
            continue           = $true
            hookSpecificOutput = [pscustomobject]@{
                hookEventName     = "UserPromptSubmit"
                additionalContext = $additionalContext.Trim()
            }
        })
}
catch {
    # Scope Checkpoint must never prevent the Codex session from continuing.
    Write-HookResult -Result ([pscustomobject]@{ continue = $true })
}
