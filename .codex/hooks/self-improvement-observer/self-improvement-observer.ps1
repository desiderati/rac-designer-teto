[Diagnostics.CodeAnalysis.SuppressMessageAttribute('PSAvoidAssignmentToAutomaticVariable', 'Event', Justification = 'Preserve the existing public hook -Event parameter contract.')]
param(
    [string]$Event = 'Unknown'
)

$ErrorActionPreference = 'Stop'
[Console]::OutputEncoding = New-Object System.Text.UTF8Encoding($false)
$OutputEncoding = [Console]::OutputEncoding
$script:StateLockTimeoutMilliseconds = 60000
$script:StateLockRetryInitialMilliseconds = 25
$script:StateLockRetryMaximumMilliseconds = 250

function Write-HookResponse {
    param(
        [AllowNull()]
        [string]$AdditionalContext
    )

    $response = [ordered]@{ continue = $true }
    if (-not [string]::IsNullOrWhiteSpace($AdditionalContext)) {
        $response['hookSpecificOutput'] = [ordered]@{
            hookEventName     = $Event
            additionalContext = $AdditionalContext
        }
    }
    $response | ConvertTo-Json -Depth 8 -Compress
    exit 0
}

function ConvertFrom-JsonSafe {
    param(
        [string]$Text
    )

    if ([string]::IsNullOrWhiteSpace($Text)) {
        return $null
    }

    try {
        return $Text | ConvertFrom-Json
    }
    catch {
        return $null
    }
}

function Get-StateDirectory {
    $scriptDirectory = Split-Path -Parent $PSCommandPath
    return Join-Path $scriptDirectory 'state'
}

function Get-UtcNow {
    return [DateTimeOffset]::UtcNow.ToString('o')
}

function Invoke-WithStateLock {
    param(
        [string]$StateDirectory,
        [scriptblock]$Action,
        [int]$TimeoutMilliseconds = $script:StateLockTimeoutMilliseconds
    )

    New-Item -ItemType Directory -Path $StateDirectory -Force | Out-Null
    $lockPath = Join-Path $StateDirectory '.observer.lock'
    $deadline = [DateTimeOffset]::UtcNow.AddMilliseconds($TimeoutMilliseconds)
    $lockStream = $null
    $retryDelayMilliseconds = $script:StateLockRetryInitialMilliseconds + ($PID % 25)

    while ($null -eq $lockStream) {
        try {
            $lockStream = [System.IO.File]::Open(
                $lockPath,
                [System.IO.FileMode]::OpenOrCreate,
                [System.IO.FileAccess]::ReadWrite,
                [System.IO.FileShare]::None
            )
        }
        catch [System.IO.IOException] {
            $remainingMilliseconds = [int][Math]::Max(
                0,
                ($deadline - [DateTimeOffset]::UtcNow).TotalMilliseconds
            )
            if ($remainingMilliseconds -le 0) {
                throw [System.TimeoutException]::new(
                    "Timed out waiting for the Self Improvement Observer state lock."
                )
            }
            Start-Sleep -Milliseconds ([Math]::Min($retryDelayMilliseconds, $remainingMilliseconds))
            $retryDelayMilliseconds = [Math]::Min(
                $retryDelayMilliseconds * 2,
                $script:StateLockRetryMaximumMilliseconds
            )
        }
    }

    try {
        return & $Action
    }
    finally {
        $lockStream.Dispose()
    }
}

function Get-SafeSessionId {
    param(
        [AllowNull()]
        $Payload
    )

    if ($null -ne $Payload -and -not [string]::IsNullOrWhiteSpace([string]$Payload.session_id)) {
        return [string]$Payload.session_id
    }

    return 'unknown-session'
}

function Get-Hash {
    param(
        [AllowNull()]
        [string]$Value
    )

    if ($null -eq $Value) {
        $Value = ''
    }

    $sha = [System.Security.Cryptography.SHA256]::Create()
    try {
        $bytes = [System.Text.Encoding]::UTF8.GetBytes($Value)
        $hashBytes = $sha.ComputeHash($bytes)
        return [System.BitConverter]::ToString($hashBytes).Replace('-', '').ToLowerInvariant()
    }
    finally {
        $sha.Dispose()
    }
}

function Get-ObjectHash {
    param(
        [AllowNull()]
        $Value
    )

    if ($null -eq $Value) {
        return ''
    }

    try {
        return Get-Hash -Value ($Value | ConvertTo-Json -Depth 20 -Compress)
    }
    catch {
        return ''
    }
}

function Get-ObjectLength {
    param(
        [AllowNull()]
        $Value
    )

    if ($null -eq $Value) {
        return 0
    }

    try {
        return (($Value | ConvertTo-Json -Depth 20 -Compress).Length)
    }
    catch {
        return 0
    }
}

function Get-StructuredToolOutcome {
    param(
        [AllowNull()]
        [string]$ToolName,
        [AllowNull()]
        $ToolResponse
    )

    $outcome = [ordered]@{}
    if ($null -eq $ToolResponse -or $ToolResponse -isnot [PSCustomObject]) {
        return $outcome
    }

    $properties = $ToolResponse.PSObject.Properties
    $successProperty = $properties['success']
    if ($null -ne $successProperty -and $successProperty.Value -is [bool]) {
        $outcome['success'] = [bool]$successProperty.Value
        return $outcome
    }

    foreach ($exitCodeName in @('exit_code', 'exitCode')) {
        $exitCodeProperty = $properties[$exitCodeName]
        if ($null -eq $exitCodeProperty -or $null -eq $exitCodeProperty.Value) {
            continue
        }

        $exitCode = [string]$exitCodeProperty.Value
        if ($exitCode -match '^-?\d+$') {
            $outcome['exit_code'] = $exitCode
            return $outcome
        }
    }

    $isErrorProperty = $properties['isError']
    if ($null -ne $isErrorProperty) {
        if ($isErrorProperty.Value -is [bool]) {
            $outcome['success'] = -not [bool]$isErrorProperty.Value
        }
        return $outcome
    }

    $hasMcpResultShape = (
        -not [string]::IsNullOrWhiteSpace($ToolName) -and
        $ToolName.StartsWith('mcp__', [System.StringComparison]::OrdinalIgnoreCase) -and
        $null -ne $properties['content']
    )
    if ($hasMcpResultShape) {
        $outcome['success'] = $true
    }

    return $outcome
}

function Get-PropertyNames {
    [Diagnostics.CodeAnalysis.SuppressMessageAttribute('PSUseSingularNouns', 'Get-PropertyNames', Justification = 'Preserve the existing internal collection-returning helper name and all callers.')]
    param(
        [AllowNull()]
        $Value
    )

    if ($null -eq $Value) {
        return @()
    }

    if ($Value -is [System.Management.Automation.PSCustomObject]) {
        return @($Value.PSObject.Properties.Name | Sort-Object)
    }

    return @()
}

function Get-PromptCategory {
    param(
        [AllowNull()]
        [string]$Prompt
    )

    if ([string]::IsNullOrWhiteSpace($Prompt)) {
        return 'unknown'
    }

    $lower = $Prompt.ToLowerInvariant()
    if ($lower -match 'security|seguran|vulnerability|secret|token|credential') { return 'security' }
    if ($lower -match 'test|validate|verificar|validar|coverage|pytest|unittest') { return 'testing' }
    if ($lower -match 'review|revis|code-review|pull request|pr ') { return 'review' }
    if ($lower -match 'doc|readme|changelog|adr|obsidian|documentation') { return 'documentation' }
    if ($lower -match 'hook|automation|automacao|schedule|weekly|monitor') { return 'automation' }
    if ($lower -match 'deploy|production|prod|rollback|migration|migracao') { return 'production' }
    if ($lower -match 'commit|branch|git|merge|rebase|push|pull') { return 'git' }
    if ($lower -match 'bug|debug|erro|error|incident|root cause') { return 'debugging' }
    if ($lower -match 'refactor|refator|architecture|design|plan') { return 'planning' }
    if ($lower -match 'implement|criar|adicionar|corrigir|fix|build') { return 'coding' }
    return 'general'
}

function Get-PromptSignalFlags {
    [Diagnostics.CodeAnalysis.SuppressMessageAttribute('PSUseSingularNouns', 'Get-PromptSignalFlags', Justification = 'Preserve the existing internal collection-returning helper name and all callers.')]
    param(
        [AllowNull()]
        [string]$Prompt
    )

    if ([string]::IsNullOrWhiteSpace($Prompt)) {
        return @()
    }

    $lower = $Prompt.ToLowerInvariant()
    $flags = [System.Collections.Generic.List[string]]::new()
    if (
        $lower -match 'premissa.{0,40}(incorret|errad)' -or
        $lower -match 'decis[aã]o.{0,40}(incorret|errad)' -or
        $lower -match '(assumiu|assumption).{0,40}(incorret|wrong)' -or
        $lower -match '(wrong|incorrect).{0,30}(decision|assumption)' -or
        $lower -match '(modelo|model|voc[eê]|you).{0,30}(errou|was wrong)'
    ) {
        $flags.Add('decision-challenge')
    }
    if (
        $lower -match '(saiu|desvi\w*|afast\w*).{0,40}(escopo|solu[cç][aã]o)' -or
        $lower -match '(desvio|drift).{0,30}(escopo|scope)'
    ) {
        $flags.Add('scope-drift')
    }
    if (
        $lower -match '(eu corrigi|estou corrigindo|na verdade).{0,60}(voc[eê]|modelo|decis[aã]o|premissa)' -or
        $lower -match '(user correction|explicit correction)'
    ) {
        $flags.Add('explicit-correction')
    }
    if (
        $lower -match '(refa[cç]a|tente novamente|retrabalho|rework|retry)' -or
        $lower -match '(abandone|descarte).{0,40}(abordagem|approach)'
    ) {
        $flags.Add('retry-or-rework')
    }

    return @($flags)
}

function Get-ToolName {
    param(
        [AllowNull()]
        $Payload
    )

    if ($null -eq $Payload) {
        return ''
    }

    foreach ($name in @('tool_name', 'toolName', 'name')) {
        $property = $Payload.PSObject.Properties[$name]
        if ($null -ne $property -and -not [string]::IsNullOrWhiteSpace([string]$property.Value)) {
            return [string]$property.Value
        }
    }

    return ''
}

function New-BaseRecord {
    [Diagnostics.CodeAnalysis.SuppressMessageAttribute('PSUseShouldProcessForStateChangingFunctions', '', Justification = 'Construct an in-memory event record only; this function does not mutate external state.')]
    param(
        [string]$EventName,
        [AllowNull()]
        $Payload
    )

    $record = [ordered]@{
        timestamp_utc = Get-UtcNow
        event         = $EventName
        session_id    = Get-SafeSessionId -Payload $Payload
    }

    if ($null -ne $Payload) {
        foreach ($name in @('source', 'model', 'transcript_path', 'cwd')) {
            $property = $Payload.PSObject.Properties[$name]
            if ($null -ne $property -and -not [string]::IsNullOrWhiteSpace([string]$property.Value)) {
                $record[$name] = [string]$property.Value
            }
        }
    }

    return $record
}

function Add-JsonLine {
    param(
        [string]$Path,
        $Record
    )

    $directory = Split-Path -Parent $Path
    New-Item -ItemType Directory -Path $directory -Force | Out-Null
    $utf8NoBom = New-Object System.Text.UTF8Encoding($false)
    $line = ($Record | ConvertTo-Json -Depth 20 -Compress) + [Environment]::NewLine
    [System.IO.File]::AppendAllText($Path, $line, $utf8NoBom)
}

function Read-JsonFile {
    param(
        [string]$Path
    )

    if (-not (Test-Path -LiteralPath $Path)) {
        return $null
    }

    return (Get-Content -LiteralPath $Path -Raw) | ConvertFrom-Json
}

function Write-JsonFile {
    param(
        [string]$Path,
        $Value
    )

    $directory = Split-Path -Parent $Path
    New-Item -ItemType Directory -Path $directory -Force | Out-Null
    $utf8NoBom = New-Object System.Text.UTF8Encoding($false)
    $text = ($Value | ConvertTo-Json -Depth 20) + [Environment]::NewLine
    $temporaryPath = Join-Path $directory ('.{0}.{1}.tmp' -f ([System.IO.Path]::GetFileName($Path)), [guid]::NewGuid())
    $backupPath = Join-Path $directory ('.{0}.{1}.bak' -f ([System.IO.Path]::GetFileName($Path)), [guid]::NewGuid())

    try {
        [System.IO.File]::WriteAllText($temporaryPath, $text, $utf8NoBom)
        if (Test-Path -LiteralPath $Path) {
            [System.IO.File]::Replace($temporaryPath, $Path, $backupPath)
        }
        else {
            [System.IO.File]::Move($temporaryPath, $Path)
        }
    }
    finally {
        if (Test-Path -LiteralPath $temporaryPath) {
            Remove-Item -LiteralPath $temporaryPath -Force
        }
        if (Test-Path -LiteralPath $backupPath) {
            Remove-Item -LiteralPath $backupPath -Force
        }
    }
}

function Get-ShortHash {
    param(
        [AllowNull()]
        [string]$Value
    )

    $hash = Get-Hash -Value $Value
    if ($hash.Length -le 16) {
        return $hash
    }

    return $hash.Substring(0, 16)
}

function Get-ExistingEventCounts {
    [Diagnostics.CodeAnalysis.SuppressMessageAttribute('PSUseSingularNouns', 'Get-ExistingEventCounts', Justification = 'Preserve the existing internal collection-returning helper name and all callers.')]
    param(
        [AllowNull()]
        $Health
    )

    $eventCounts = [ordered]@{}
    if ($null -eq $Health -or $null -eq $Health.PSObject.Properties['event_counts']) {
        return $eventCounts
    }

    foreach ($property in $Health.event_counts.PSObject.Properties) {
        $eventCounts[$property.Name] = [int]$property.Value
    }

    return $eventCounts
}

function Update-HealthFile {
    [Diagnostics.CodeAnalysis.SuppressMessageAttribute('PSUseShouldProcessForStateChangingFunctions', '', Justification = 'The installed observer updates only its locked local state without interactive prompting.')]
    param(
        [string]$StateDirectory,
        $Record
    )

    $healthPath = Join-Path $StateDirectory 'health.json'
    $existingHealth = Read-JsonFile -Path $healthPath
    $eventCounts = Get-ExistingEventCounts -Health $existingHealth
    $eventName = [string]$Record['event']
    if (-not $eventCounts.Contains($eventName)) {
        $eventCounts[$eventName] = 0
    }
    $eventCounts[$eventName] = [int]$eventCounts[$eventName] + 1

    $eventCount = 0
    foreach ($value in $eventCounts.Values) {
        $eventCount += [int]$value
    }

    $health = [ordered]@{
        version                  = 1
        observer                 = 'Self Improvement Observer'
        status                   = 'observed'
        last_event               = $eventName
        last_event_timestamp_utc = [string]$Record['timestamp_utc']
        last_session_hash        = Get-ShortHash -Value ([string]$Record['session_id'])
        event_count              = $eventCount
        event_counts             = $eventCounts
        persisted                = $true
        raw_prompts              = $false
        raw_tool_inputs          = $false
        raw_tool_outputs         = $false
    }
    Write-JsonFile -Path $healthPath -Value $health
    return $health
}

function Test-ObserverVisibilityRequested {
    param(
        [AllowNull()]
        [string]$Prompt
    )

    if ([string]::IsNullOrWhiteSpace($Prompt)) {
        return $false
    }

    $lower = $Prompt.ToLowerInvariant()
    return ($lower -match 'self[- ]?improvement|observer|observador|hook|hooks|health\.json|events\.jsonl|sessions\.jsonl')
}

function Get-VisibilityMarkerPath {
    param(
        [string]$StateDirectory,
        [string]$SessionId
    )

    $sessionHash = Get-ShortHash -Value $SessionId
    return (Join-Path $StateDirectory "visibility-$sessionHash.json")
}

function New-ObserverAdditionalContext {
    [Diagnostics.CodeAnalysis.SuppressMessageAttribute('PSUseShouldProcessForStateChangingFunctions', '', Justification = 'The installed observer writes only its local visibility marker under the existing noninteractive hook contract.')]
    [Diagnostics.CodeAnalysis.SuppressMessageAttribute('PSReviewUnusedParameter', 'Health', Justification = 'Retain the existing Health parameter accepted by callers; no new interpretation of health data.')]
    param(
        [string]$StateDirectory,
        $Record,
        [AllowNull()]
        [string]$Prompt,
        $Health
    )

    if ([string]$Record['event'] -ne 'UserPromptSubmit') {
        return $null
    }

    $markerPath = Get-VisibilityMarkerPath -StateDirectory $StateDirectory -SessionId ([string]$Record['session_id'])
    $firstVisibleInSession = -not (Test-Path -LiteralPath $markerPath)
    $visibilityRequested = Test-ObserverVisibilityRequested -Prompt $Prompt

    if (-not $firstVisibleInSession -and -not $visibilityRequested) {
        return $null
    }

    $reason = if ($firstVisibleInSession) { 'first-session-visibility' } else { 'prompt-requested-visibility' }
    $marker = [ordered]@{
        version       = 1
        timestamp_utc = [string]$Record['timestamp_utc']
        session_hash  = Get-ShortHash -Value ([string]$Record['session_id'])
        reason        = $reason
        raw_prompts   = $false
    }
    Write-JsonFile -Path $markerPath -Value $marker

    return (
        'The Self Improvement Observer is active in this session. ' +
        'It recorded the hook event locally, persisted its health state, ' +
        'and does not store raw prompts.'
    )
}

function Ensure-ProfileFile {
    [Diagnostics.CodeAnalysis.SuppressMessageAttribute('PSUseApprovedVerbs', '', Justification = 'Preserve the existing internal helper name and its create-if-missing local state behavior.')]
    param(
        [string]$StateDirectory
    )

    $profilePath = Join-Path $StateDirectory 'profile.json'
    if (Test-Path -LiteralPath $profilePath) {
        return
    }

    $observerProfile = [ordered]@{
        version          = 1
        delivery_profile = [ordered]@{
            mode                             = $null
            source                           = 'unset'
            last_updated                     = $null
            can_override_repository_contract = $false
            can_override_user_instruction    = $false
            notes                            = @()
        }
    }
    Write-JsonFile -Path $profilePath -Value $observerProfile
}

try {
    $payloadText = [Console]::In.ReadToEnd()
    $payload = ConvertFrom-JsonSafe -Text $payloadText
    $additionalContext = $null
    $stateDirectory = Get-StateDirectory
    New-Item -ItemType Directory -Path $stateDirectory -Force | Out-Null
    $eventsPath = Join-Path $stateDirectory 'events.jsonl'
    $sessionsPath = Join-Path $stateDirectory 'sessions.jsonl'
    $record = New-BaseRecord -EventName $Event -Payload $payload
    $prompt = ''

    switch ($Event) {
        'SessionStart' {
            $record['phase'] = 'start'
        }

        'UserPromptSubmit' {
            if ($null -ne $payload -and $null -ne $payload.PSObject.Properties['prompt']) {
                $prompt = [string]$payload.prompt
            }
            $record['prompt_hash'] = Get-Hash -Value $prompt
            $record['prompt_length'] = $prompt.Length
            $record['prompt_category'] = Get-PromptCategory -Prompt $prompt
            $promptSignalFlags = @(Get-PromptSignalFlags -Prompt $prompt)
            if ($promptSignalFlags.Count -gt 0) {
                $record['prompt_signal_flags'] = $promptSignalFlags
            }
        }

        'PostToolUse' {
            $toolInput = if ($null -ne $payload -and $null -ne $payload.PSObject.Properties['tool_input']) { $payload.tool_input } else { $null }
            $toolResponse = if ($null -ne $payload -and $null -ne $payload.PSObject.Properties['tool_response']) { $payload.tool_response } else { $null }
            $record['tool_name'] = Get-ToolName -Payload $payload
            $record['tool_input_keys'] = @(Get-PropertyNames -Value $toolInput)
            $record['tool_input_hash'] = Get-ObjectHash -Value $toolInput
            $record['tool_input_length'] = Get-ObjectLength -Value $toolInput
            $record['tool_response_hash'] = Get-ObjectHash -Value $toolResponse
            $record['tool_response_length'] = Get-ObjectLength -Value $toolResponse

            $toolOutcome = Get-StructuredToolOutcome -ToolName $record['tool_name'] -ToolResponse $toolResponse
            if ($toolOutcome.Contains('exit_code')) {
                $record['exit_code'] = $toolOutcome['exit_code']
            }
            if ($toolOutcome.Contains('success')) {
                $record['success'] = $toolOutcome['success']
            }
        }

        'Stop' {
            $record['phase'] = 'stop'
        }
    }

    $stateResult = Invoke-WithStateLock -StateDirectory $stateDirectory -Action {
        $healthPath = Join-Path $stateDirectory 'health.json'
        if (Test-Path -LiteralPath $healthPath) {
            Read-JsonFile -Path $healthPath | Out-Null
        }

        Ensure-ProfileFile -StateDirectory $stateDirectory
        if ($Event -in @('SessionStart', 'Stop')) {
            Add-JsonLine -Path $sessionsPath -Record $record
        }

        Add-JsonLine -Path $eventsPath -Record $record
        $health = Update-HealthFile -StateDirectory $stateDirectory -Record $record
        return [ordered]@{
            additional_context = New-ObserverAdditionalContext `
                -StateDirectory $stateDirectory `
                -Record $record `
                -Prompt $prompt `
                -Health $health
        }
    }
    $additionalContext = [string]$stateResult['additional_context']
}
catch {
    try {
        $stateDirectory = Get-StateDirectory
        $errorPath = Join-Path $stateDirectory 'errors.jsonl'
        $errorRecord = [ordered]@{
            timestamp_utc      = Get-UtcNow
            event              = $Event
            error_type         = $_.Exception.GetType().FullName
            error_message_hash = Get-Hash -Value ([string]$_.Exception.Message)
        }
        Invoke-WithStateLock -StateDirectory $stateDirectory -TimeoutMilliseconds 2000 -Action {
            Add-JsonLine -Path $errorPath -Record $errorRecord
        } | Out-Null
    }
    catch {
        # The observer must never block the Codex session.
        $null = $_
    }

    if ($Event -eq 'UserPromptSubmit') {
        $additionalContext = (
            'The Self Improvement Observer hit a local error while recording this hook event. ' +
            'The Codex session can continue; check the local observer errors.jsonl file for details.'
        )
    }
}

Write-HookResponse -AdditionalContext $additionalContext
