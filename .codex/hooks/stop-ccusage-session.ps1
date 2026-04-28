$ErrorActionPreference = 'Stop'
[Console]::OutputEncoding = New-Object System.Text.UTF8Encoding($false)
$OutputEncoding = [Console]::OutputEncoding

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

function Format-CompactNumber {
    param(
        [double]$Value
    )

    $culture = [System.Globalization.CultureInfo]::InvariantCulture
    $suffixes = @('', 'K', 'M', 'B', 'T')
    $scaled = [double]$Value
    $abs = [Math]::Abs($scaled)
    $index = 0

    while ($abs -ge 1000 -and $index -lt ($suffixes.Length - 1)) {
        $scaled /= 1000
        $abs /= 1000
        $index++
    }

    if ($abs -ge 999.5 -and $index -lt ($suffixes.Length - 1)) {
        $scaled /= 1000
        $abs /= 1000
        $index++
    }

    $decimals = if ($index -eq 0) { 0 } elseif ($abs -lt 10) { 1 } else { 0 }
    $formatted = $scaled.ToString(("0" + ($(if ($decimals -gt 0) { "." + ("#" * $decimals) } else { "" }))), $culture)
    return "{0}{1}" -f $formatted, $suffixes[$index]
}

function Get-RateLimitWindowLabel {
    param(
        $WindowMinutes
    )

    if ($null -eq $WindowMinutes) {
        return $null
    }

    $minutes = [int]$WindowMinutes

    switch ($minutes) {
        300 { return '5h' }
        1440 { return '24h' }
        10080 { return 'sem' }
        default {
            if (($minutes % 1440) -eq 0) {
                return '{0}d' -f ($minutes / 1440)
            }

            if (($minutes % 60) -eq 0) {
                return '{0}h' -f ($minutes / 60)
            }

            return '{0}m' -f $minutes
        }
    }
}

function Get-LatestTokenSnapshotFromTranscript {
    param(
        [string]$TranscriptPath
    )

    if ([string]::IsNullOrWhiteSpace($TranscriptPath) -or -not (Test-Path -LiteralPath $TranscriptPath)) {
        return $null
    }

    $latestSnapshot = $null

    foreach ($line in (Get-Content -LiteralPath $TranscriptPath -Tail 400)) {
        if ([string]::IsNullOrWhiteSpace($line)) {
            continue
        }

        try {
            $entry = $line | ConvertFrom-Json
        } catch {
            continue
        }

        if ($entry.type -ne 'event_msg') {
            continue
        }

        if ($entry.payload.type -ne 'token_count') {
            continue
        }

        $latestSnapshot = $entry.payload
    }

    return $latestSnapshot
}

function Format-RateLimitUsageSummary {
    param(
        $RateLimits
    )

    if ($null -eq $RateLimits) {
        return $null
    }

    $segments = @()
    $culture = [System.Globalization.CultureInfo]::GetCultureInfo('pt-BR')

    foreach ($slot in @('primary', 'secondary')) {
        $window = $RateLimits.$slot
        if ($null -eq $window -or $null -eq $window.used_percent) {
            continue
        }

        $label = Get-RateLimitWindowLabel -WindowMinutes $window.window_minutes
        if ([string]::IsNullOrWhiteSpace($label)) {
            continue
        }

        $percentText = ([double]$window.used_percent).ToString('0.#', $culture)
        $segmentLabel = switch ($slot) {
            'primary' { 'Uso {0}' -f $label }
            'secondary' {
                if ($label -eq 'sem') {
                    'Semanal'
                } else {
                    'Uso {0}' -f $label
                }
            }
            default { 'Uso {0}' -f $label }
        }

        $segments += '{0}: {1}%' -f $segmentLabel, $percentText
    }

    if ($segments.Count -eq 0) {
        return $null
    }

    return ($segments -join ' | ')
}

try {
    $payloadText = [Console]::In.ReadToEnd()
    if ([string]::IsNullOrWhiteSpace($payloadText)) {
        Write-HookResponse
    }

    $payload = $payloadText | ConvertFrom-Json
    $transcriptPath = [string]$payload.transcript_path
    if ([string]::IsNullOrWhiteSpace($transcriptPath)) {
        Write-HookResponse
    }

    $tokenSnapshot = Get-LatestTokenSnapshotFromTranscript -TranscriptPath $transcriptPath
    if ($null -eq $tokenSnapshot) {
        Write-HookResponse
    }

    $totalTokenUsage = $tokenSnapshot.info.total_token_usage
    if ($null -eq $totalTokenUsage -or $null -eq $totalTokenUsage.total_tokens) {
        Write-HookResponse
    }

    $totalTokens = [int64]$totalTokenUsage.total_tokens
    $formattedTokens = Format-CompactNumber -Value $totalTokens
    $rateLimits = $tokenSnapshot.rate_limits
    $rateLimitSummary = Format-RateLimitUsageSummary -RateLimits $rateLimits

    $sessionLabel = 'Tokens Sess{0}o: {1}' -f [char]0x00E3, $formattedTokens
    $messageParts = @($sessionLabel)
    if (-not [string]::IsNullOrWhiteSpace($rateLimitSummary)) {
        $messageParts += $rateLimitSummary
    }

    Write-HookResponse -Message ($messageParts -join ' | ')
} catch {
    Write-HookResponse
}
