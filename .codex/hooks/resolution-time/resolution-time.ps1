param(
    [string]$Event = 'Stop'
)

$ErrorActionPreference = 'Stop'
[Console]::OutputEncoding = New-Object System.Text.UTF8Encoding($false)
$OutputEncoding = [Console]::OutputEncoding
# Windows PowerShell 5 may misread UTF-8-without-BOM scripts as ANSI.
# Compose Portuguese accents from codepoints to keep hook output stable.
$C_CEDILLA = [string][char]0x00E7
$A_TILDE = [string][char]0x00E3

function Write-HookResponse {
    param(
        [string]$Message
    )

    $responseParts = @('"continue":true')

    if (-not [string]::IsNullOrWhiteSpace($Message)) {
        $responseParts += '"systemMessage":' + (ConvertTo-JsonStringLiteral -Value $Message)
    }

    '{' + ($responseParts -join ',') + '}'
    exit 0
}

function Write-UserPromptContextResponse {
    param(
        [string]$Message
    )

    $response = @{
        continue = $true
        hookSpecificOutput = @{
            hookEventName = 'UserPromptSubmit'
            additionalContext = $Message
        }
    }

    $response | ConvertTo-Json -Depth 8 -Compress
    exit 0
}

function ConvertTo-JsonStringLiteral {
    param(
        [AllowNull()]
        [string]$Value
    )

    if ($null -eq $Value) {
        return 'null'
    }

    $builder = New-Object System.Text.StringBuilder
    [void]$builder.Append('"')

    foreach ($char in $Value.ToCharArray()) {
        $code = [int][char]$char

        switch ($code) {
            8 { [void]$builder.Append('\b'); continue }
            9 { [void]$builder.Append('\t'); continue }
            10 { [void]$builder.Append('\n'); continue }
            12 { [void]$builder.Append('\f'); continue }
            13 { [void]$builder.Append('\r'); continue }
            34 { [void]$builder.Append('\"'); continue }
            92 { [void]$builder.Append('\\'); continue }
        }

        if ($code -lt 32 -or $code -gt 126) {
            [void]$builder.AppendFormat('\u{0:x4}', $code)
            continue
        }

        [void]$builder.Append($char)
    }

    [void]$builder.Append('"')
    return $builder.ToString()
}

function Get-PayloadObject {
    param(
        [string]$PayloadText
    )

    if ([string]::IsNullOrWhiteSpace($PayloadText)) {
        return $null
    }

    try {
        return $PayloadText | ConvertFrom-Json
    } catch {
        return $null
    }
}

function Get-StateDirectory {
    $scriptDirectory = Split-Path -Parent $PSCommandPath
    return Join-Path $scriptDirectory 'state'
}

function Get-SafeSessionKey {
    param(
        [string]$SessionId
    )

    if ([string]::IsNullOrWhiteSpace($SessionId)) {
        return $null
    }

    return ($SessionId -replace '[^a-zA-Z0-9._-]', '_')
}

function Get-StatePath {
    param(
        [string]$SessionId
    )

    $sessionKey = Get-SafeSessionKey -SessionId $SessionId
    if ([string]::IsNullOrWhiteSpace($sessionKey)) {
        return $null
    }

    return Join-Path (Get-StateDirectory) ($sessionKey + '.json')
}

function Write-SessionState {
    param(
        $Payload
    )

    $sessionId = [string]$Payload.session_id
    $statePath = Get-StatePath -SessionId $sessionId
    if ([string]::IsNullOrWhiteSpace($statePath)) {
        return
    }

    $stateDirectory = Get-StateDirectory
    New-Item -ItemType Directory -Path $stateDirectory -Force | Out-Null

    $state = @{
        session_id = $sessionId
        started_at_utc = [DateTimeOffset]::UtcNow.ToString('o')
        source = [string]$Payload.source
        model = [string]$Payload.model
        transcript_path = [string]$Payload.transcript_path
    }

    $state | ConvertTo-Json -Compress | Set-Content -LiteralPath $statePath -Encoding utf8
}

function Read-SessionState {
    param(
        [string]$SessionId
    )

    $statePath = Get-StatePath -SessionId $SessionId
    if ([string]::IsNullOrWhiteSpace($statePath) -or -not (Test-Path -LiteralPath $statePath)) {
        return $null
    }

    try {
        return (Get-Content -LiteralPath $statePath -Raw) | ConvertFrom-Json
    } catch {
        return $null
    }
}

function Remove-SessionState {
    param(
        [string]$SessionId
    )

    $statePath = Get-StatePath -SessionId $SessionId
    if ([string]::IsNullOrWhiteSpace($statePath) -or -not (Test-Path -LiteralPath $statePath)) {
        return
    }

    Remove-Item -LiteralPath $statePath -Force

    $stateDirectory = Get-StateDirectory
    if ((Test-Path -LiteralPath $stateDirectory) -and -not (Get-ChildItem -LiteralPath $stateDirectory -Force | Select-Object -First 1)) {
        Remove-Item -LiteralPath $stateDirectory -Force
    }
}

function ConvertTo-DateTimeOffsetSafe {
    param(
        [AllowNull()]
        [string]$Value
    )

    if ([string]::IsNullOrWhiteSpace($Value)) {
        return $null
    }

    try {
        return [DateTimeOffset]::Parse(
            $Value,
            [System.Globalization.CultureInfo]::InvariantCulture,
            [System.Globalization.DateTimeStyles]::RoundtripKind
        )
    } catch {
        return $null
    }
}

function Get-TranscriptStartTime {
    param(
        [string]$TranscriptPath
    )

    if ([string]::IsNullOrWhiteSpace($TranscriptPath) -or -not (Test-Path -LiteralPath $TranscriptPath)) {
        return $null
    }

    foreach ($line in (Get-Content -LiteralPath $TranscriptPath -TotalCount 200)) {
        if ([string]::IsNullOrWhiteSpace($line)) {
            continue
        }

        try {
            $entry = $line | ConvertFrom-Json
        } catch {
            continue
        }

        $timestamp = ConvertTo-DateTimeOffsetSafe -Value ([string]$entry.timestamp)
        if ($null -ne $timestamp) {
            return $timestamp
        }
    }

    return $null
}

function Format-DurationCompact {
    param(
        [TimeSpan]$Duration
    )

    if ($Duration.TotalSeconds -lt 1) {
        return '0s'
    }

    $remainingSeconds = [Math]::Floor($Duration.TotalSeconds)
    $days = [Math]::Floor($remainingSeconds / 86400)
    $remainingSeconds = $remainingSeconds % 86400
    $hours = [Math]::Floor($remainingSeconds / 3600)
    $remainingSeconds = $remainingSeconds % 3600
    $minutes = [Math]::Floor($remainingSeconds / 60)
    $seconds = $remainingSeconds % 60

    $segments = @()
    if ($days -gt 0) { $segments += '{0}d' -f $days }
    if ($hours -gt 0) { $segments += '{0}h' -f $hours }
    if ($minutes -gt 0) { $segments += '{0}m' -f $minutes }
    if ($seconds -gt 0 -or $segments.Count -eq 0) { $segments += '{0}s' -f $seconds }

    return ($segments -join ' ')
}

function Get-SafeContextIdentifier {
    param(
        [AllowNull()]
        [string]$Value
    )

    if ([string]::IsNullOrWhiteSpace($Value)) {
        return $null
    }

    $trimmedValue = $Value.Trim()
    if ($trimmedValue.Length -gt 160) {
        return $null
    }

    if ($trimmedValue -notmatch '^[a-zA-Z0-9._:-]+$') {
        return $null
    }

    return $trimmedValue
}

function Get-SafeTranscriptFileName {
    param(
        [AllowNull()]
        [string]$TranscriptPath
    )

    if ([string]::IsNullOrWhiteSpace($TranscriptPath)) {
        return $null
    }

    try {
        $fileName = [System.IO.Path]::GetFileName($TranscriptPath)
    } catch {
        return $null
    }

    if ([string]::IsNullOrWhiteSpace($fileName)) {
        return $null
    }

    if ($fileName.Length -gt 220) {
        return $null
    }

    if ($fileName -notmatch '^[a-zA-Z0-9._-]+$') {
        return $null
    }

    return $fileName
}

function Get-SessionIdFromText {
    param(
        [AllowNull()]
        [string]$Value
    )

    if ([string]::IsNullOrWhiteSpace($Value)) {
        return $null
    }

    $match = [regex]::Match(
        $Value,
        '(?i)[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}'
    )
    if (-not $match.Success) {
        return $null
    }

    return $match.Value.ToLowerInvariant()
}

function Get-SessionCorrelationContext {
    param(
        $Payload
    )

    if ($null -eq $Payload) {
        return @()
    }

    $sessionId = Get-SafeContextIdentifier -Value ([string]$Payload.session_id)
    if ([string]::IsNullOrWhiteSpace($sessionId)) {
        $sessionId = Get-SafeContextIdentifier -Value ([string]$Payload.id)
    }

    $sessionFile = Get-SafeTranscriptFileName -TranscriptPath ([string]$Payload.transcript_path)
    if ([string]::IsNullOrWhiteSpace($sessionId)) {
        $sessionId = Get-SessionIdFromText -Value $sessionFile
    }

    $contextParts = @()
    if (-not [string]::IsNullOrWhiteSpace($sessionId)) {
        $contextParts += "session id $sessionId"
    }
    if (-not [string]::IsNullOrWhiteSpace($sessionFile)) {
        $contextParts += "session file $sessionFile"
    }

    if ($contextParts.Count -eq 0) {
        return @()
    }

    $lines = @(
        'Session correlation: ' + ($contextParts -join '; ') + '.'
    )

    if (-not [string]::IsNullOrWhiteSpace($sessionId)) {
        $lines += 'Use this session id to correlate current chat usage before falling back to lastActivity/date heuristics.'
    }

    return $lines
}

function Handle-SessionStart {
    param(
        $Payload
    )

    if ($null -eq $Payload) {
        Write-HookResponse
    }

    Write-SessionState -Payload $Payload
    $message = "Contador de tempo de resolu${C_CEDILLA}${A_TILDE}o iniciado."
    Write-HookResponse -Message $message
}

function Handle-Stop {
    param(
        $Payload
    )

    if ($null -eq $Payload) {
        Write-HookResponse
    }

    $sessionId = [string]$Payload.session_id
    $transcriptPath = [string]$Payload.transcript_path
    $sessionState = Read-SessionState -SessionId $sessionId

    if ([string]::IsNullOrWhiteSpace($transcriptPath) -and $null -ne $sessionState) {
        $transcriptPath = [string]$sessionState.transcript_path
    }

    $startedAt = $null
    if ($null -ne $sessionState) {
        $startedAt = ConvertTo-DateTimeOffsetSafe -Value ([string]$sessionState.started_at_utc)
    }

    if ($null -eq $startedAt) {
        $startedAt = Get-TranscriptStartTime -TranscriptPath $transcriptPath
    }

    if ($null -eq $startedAt) {
        Write-HookResponse
    }

    $duration = [DateTimeOffset]::UtcNow - $startedAt
    if ($duration.TotalSeconds -lt 0) {
        Write-HookResponse
    }

    if (-not [string]::IsNullOrWhiteSpace($sessionId)) {
        Remove-SessionState -SessionId $sessionId
    }

    $message = "Resolution Time: $(Format-DurationCompact -Duration $duration)"
    Write-HookResponse -Message $message
}

function Handle-UserPromptSubmit {
    param(
        $Payload
    )

    $messageLines = @(
        'Resolution Time: codex-resolution-time is installed; final duration is computed after the assistant response by the Stop hook.'
        'Do not claim current-turn Stop results before Stop hooks run.'
    )
    $messageLines += Get-SessionCorrelationContext -Payload $Payload
    $message = $messageLines -join [Environment]::NewLine

    Write-UserPromptContextResponse -Message $message
}

try {
    $payloadText = [Console]::In.ReadToEnd()
    $payload = Get-PayloadObject -PayloadText $payloadText

    switch ($Event) {
        'SessionStart' { Handle-SessionStart -Payload $payload }
        'Stop' { Handle-Stop -Payload $payload }
        'UserPromptSubmit' { Handle-UserPromptSubmit -Payload $payload }
        default { Write-HookResponse }
    }
} catch {
    Write-HookResponse
}
