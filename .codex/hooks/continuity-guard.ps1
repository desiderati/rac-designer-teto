param(
    [string]$Event = 'Stop'
)

$ErrorActionPreference = 'Stop'
[Console]::OutputEncoding = [System.Text.UTF8Encoding]::new($false)
$OutputEncoding = [Console]::OutputEncoding

function Write-HookResponse
{
    param(
        [string]$Message
    )

    $payload = @{ continue = $true }
    if (-not [string]::IsNullOrWhiteSpace($Message))
    {
        $payload.systemMessage = $Message
    }

    $payload | ConvertTo-Json -Compress
    exit 0
}

function Get-RepoRoot
{
    Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
}

function Get-GuardConfigPath
{
    Join-Path (Split-Path -Parent $PSScriptRoot) 'continuity-guard.json'
}

function Load-GuardConfig
{
    $configPath = Get-GuardConfigPath
    if (-not (Test-Path -LiteralPath $configPath))
    {
        return $null
    }

    try
    {
        return Get-Content -LiteralPath $configPath -Raw | ConvertFrom-Json
    }
    catch
    {
        return $null
    }
}

function Get-CommandsFromFunctionCall
{
    param(
        $Entry
    )

    $commands = New-Object System.Collections.Generic.List[string]
    if ($null -eq $Entry -or $Entry.type -ne 'response_item')
    {
        return $commands
    }

    $payload = $Entry.payload
    if ($null -eq $payload -or $payload.type -ne 'function_call')
    {
        return $commands
    }

    $toolName = [string]$payload.name
    $argumentsText = [string]$payload.arguments
    if ( [string]::IsNullOrWhiteSpace($argumentsText))
    {
        return $commands
    }

    try
    {
        $arguments = $argumentsText | ConvertFrom-Json
    }
    catch
    {
        return $commands
    }

    if ($toolName -match 'shell_command$')
    {
        $command = [string]$arguments.command
        if (-not [string]::IsNullOrWhiteSpace($command))
        {
            $commands.Add($command)
        }

        return $commands
    }

    if ($toolName -ine 'multi_tool_use.parallel')
    {
        return $commands
    }

    foreach ($toolUse in @($arguments.tool_uses))
    {
        if ($null -eq $toolUse)
        {
            continue
        }

        $recipientName = [string]$toolUse.recipient_name
        if ($recipientName -notmatch 'shell_command$')
        {
            continue
        }

        $command = [string]$toolUse.parameters.command
        if (-not [string]::IsNullOrWhiteSpace($command))
        {
            $commands.Add($command)
        }
    }

    return $commands
}

function Get-CommandMatchSurface
{
    param(
        [string]$Command
    )

    if ( [string]::IsNullOrWhiteSpace($Command))
    {
        return ''
    }

    $surface = $Command
    $surface = [System.Text.RegularExpressions.Regex]::Replace($surface, "(?s)@'[\s\S]*?'@", "@''@")
    $surface = [System.Text.RegularExpressions.Regex]::Replace($surface, '(?s)@"[\s\S]*?"@', '@""@')
    return $surface
}

function Test-ApplyPatchToolName
{
    param(
        [string]$Name
    )

    if ( [string]::IsNullOrWhiteSpace($Name))
    {
        return $false
    }

    return $Name -match '(^|[.:/])apply_patch$'
}

function Get-EntryTimestampUtc
{
    param(
        $Entry
    )

    if ($null -eq $Entry)
    {
        return $null
    }

    $timestampValue = $Entry.timestamp
    if ($null -eq $timestampValue)
    {
        return $null
    }

    if ($timestampValue -is [datetimeoffset])
    {
        return $timestampValue.UtcDateTime
    }

    if ($timestampValue -is [datetime])
    {
        return $timestampValue.ToUniversalTime()
    }

    $timestampText = [string]$timestampValue
    if ( [string]::IsNullOrWhiteSpace($timestampText))
    {
        return $null
    }

    $timestamp = [datetimeoffset]::MinValue
    if (-not [datetimeoffset]::TryParse($timestampText, [ref]$timestamp))
    {
        return $null
    }

    return $timestamp.UtcDateTime
}

function Get-PathsFromApplyPatch
{
    param(
        [string]$PatchText
    )

    $paths = New-Object System.Collections.Generic.List[string]
    if ( [string]::IsNullOrWhiteSpace($PatchText))
    {
        return @()
    }

    foreach ($match in [System.Text.RegularExpressions.Regex]::Matches($PatchText, '(?m)^\*\*\* (?:Update|Add|Delete) File: (.+)$'))
    {
        $path = [string]$match.Groups[1].Value.Trim()
        if ( [string]::IsNullOrWhiteSpace($path))
        {
            continue
        }

        if (-not $paths.Contains($path))
        {
            $paths.Add($path)
        }
    }

    return @($paths)
}

function Test-LocalMaterialChangeCandidate
{
    param(
        $Candidate
    )

    if ($null -eq $Candidate)
    {
        return $false
    }

    $type = [string]$Candidate.type
    if ($type -ine 'custom_tool_call')
    {
        return $false
    }

    $status = [string]$Candidate.status
    if (-not [string]::IsNullOrWhiteSpace($status) -and $status -ine 'completed')
    {
        return $false
    }

    return Test-ApplyPatchToolName -Name ([string]$Candidate.name)
}

function Get-LocalMaterialChangeCandidates
{
    param(
        $Entry
    )

    if ($null -eq $Entry)
    {
        return @()
    }

    $candidates = New-Object System.Collections.Generic.List[object]
    $candidates.Add($Entry)
    if ($Entry.PSObject.Properties.Name -contains 'payload' -and $null -ne $Entry.payload)
    {
        $candidates.Add($Entry.payload)
    }

    return $candidates.ToArray()
}

function Test-LocalMaterialChangeEntry
{
    param(
        $Entry
    )

    foreach ($candidate in (Get-LocalMaterialChangeCandidates -Entry $Entry))
    {
        if (Test-LocalMaterialChangeCandidate -Candidate $candidate)
        {
            return $true
        }
    }

    return $false
}

function Get-LocalMaterialChangePathsFromEntry
{
    param(
        $Entry
    )

    if ($null -eq $Entry)
    {
        return @()
    }

    $paths = New-Object System.Collections.Generic.List[string]
    foreach ($candidate in (Get-LocalMaterialChangeCandidates -Entry $Entry))
    {
        if (-not (Test-LocalMaterialChangeCandidate -Candidate $candidate))
        {
            continue
        }

        foreach ($path in (Get-PathsFromApplyPatch -PatchText ([string]$candidate.input)))
        {
            if (-not $paths.Contains($path))
            {
                $paths.Add($path)
            }
        }
    }

    return @($paths)
}

function Get-TranscriptSignals
{
    param(
        [string]$TranscriptPath,
        [object[]]$Patterns
    )

    $matchedCommands = New-Object System.Collections.Generic.List[string]
    $hasLocalMaterialChange = $false
    $localChangedPaths = New-Object System.Collections.Generic.List[string]
    $latestMatchedCommandTimestampUtc = $null
    $latestLocalChangeTimestampUtc = $null

    if ([string]::IsNullOrWhiteSpace($TranscriptPath) -or -not (Test-Path -LiteralPath $TranscriptPath))
    {
        return @{
            matchedCommands = @()
            hasLocalMaterialChange = $false
            localChangedPaths = @()
            latestMatchedCommandTimestampUtc = $null
            latestLocalChangeTimestampUtc = $null
        }
    }

    foreach ($line in (Get-Content -LiteralPath $TranscriptPath -Tail 400 -ErrorAction SilentlyContinue))
    {
        if ( [string]::IsNullOrWhiteSpace($line))
        {
            continue
        }

        try
        {
            $entry = $line | ConvertFrom-Json
        }
        catch
        {
            continue
        }

        $entryTimestampUtc = Get-EntryTimestampUtc -Entry $entry
        $localPathsForEntry = @(Get-LocalMaterialChangePathsFromEntry -Entry $entry)
        if ($localPathsForEntry.Count -gt 0)
        {
            $hasLocalMaterialChange = $true
            foreach ($path in $localPathsForEntry)
            {
                if (-not $localChangedPaths.Contains($path))
                {
                    $localChangedPaths.Add($path)
                }
            }

            if ($null -ne $entryTimestampUtc -and ($null -eq $latestLocalChangeTimestampUtc -or $entryTimestampUtc -gt $latestLocalChangeTimestampUtc))
            {
                $latestLocalChangeTimestampUtc = $entryTimestampUtc
            }
        }
        elseif (-not $hasLocalMaterialChange -and (Test-LocalMaterialChangeEntry -Entry $entry))
        {
            $hasLocalMaterialChange = $true
        }

        foreach ($command in (Get-CommandsFromFunctionCall -Entry $entry))
        {
            $matchSurface = Get-CommandMatchSurface -Command $command
            foreach ($pattern in $Patterns)
            {
                $regex = [string]$pattern.regex
                if ( [string]::IsNullOrWhiteSpace($regex))
                {
                    continue
                }

                if ($matchSurface -match $regex)
                {
                    $matchedCommands.Add($command)
                    if ($null -ne $entryTimestampUtc -and ($null -eq $latestMatchedCommandTimestampUtc -or $entryTimestampUtc -gt $latestMatchedCommandTimestampUtc))
                    {
                        $latestMatchedCommandTimestampUtc = $entryTimestampUtc
                    }
                    break
                }
            }
        }
    }

    return @{
        matchedCommands = @($matchedCommands)
        hasLocalMaterialChange = $hasLocalMaterialChange
        localChangedPaths = @($localChangedPaths)
        latestMatchedCommandTimestampUtc = $latestMatchedCommandTimestampUtc
        latestLocalChangeTimestampUtc = $latestLocalChangeTimestampUtc
    }
}

function Get-DailyChangelogPath
{
    param(
        [string]$RepoRoot,
        [datetime]$Now
    )

    return Join-Path $RepoRoot (Get-DailyChangelogRelativePath -Now $Now)
}

function Get-DailyChangelogRelativePath
{
    param(
        [datetime]$Now
    )

    $monthSegment = $Now.ToString('yyyy-MM')
    $daySegment = $Now.ToString('yyyyMMdd')
    return ".agents/changelogs/$monthSegment/$daySegment.changelog.md"
}

function Test-DailyChangelogExists
{
    param(
        [string]$RepoRoot,
        [datetime]$Now
    )

    $path = Get-DailyChangelogPath -RepoRoot $RepoRoot -Now $Now
    return Test-Path -LiteralPath $path
}

function Get-NormalizedRelativePath
{
    param(
        [string]$Path
    )

    if ( [string]::IsNullOrWhiteSpace($Path))
    {
        return ''
    }

    $normalized = $Path.Trim() -replace '\\', '/'
    $normalized = $normalized -replace '^(?:\./)+', ''
    $normalized = $normalized -replace '^/+', ''
    return $normalized.ToLowerInvariant()
}

function Test-NormalizedContentHasPathToken
{
    param(
        [string]$Content,
        [string]$PathToken
    )

    if ([string]::IsNullOrWhiteSpace($Content) -or [string]::IsNullOrWhiteSpace($PathToken))
    {
        return $false
    }

    $escapedToken = [System.Text.RegularExpressions.Regex]::Escape($PathToken)
    $pattern = ('(?<![a-z0-9._/-]){0}(?![a-z0-9._/-])' -f $escapedToken)
    return [System.Text.RegularExpressions.Regex]::IsMatch($Content, $pattern)
}

function Get-ChangelogEvidencePaths
{
    param(
        [string[]]$Paths,
        [string]$DailyChangelogRelativePath
    )

    $evidencePaths = New-Object System.Collections.Generic.List[string]
    $normalizedDailyChangelogPath = Get-NormalizedRelativePath -Path $DailyChangelogRelativePath

    foreach ($path in @($Paths))
    {
        $normalizedPath = Get-NormalizedRelativePath -Path $path
        if ( [string]::IsNullOrWhiteSpace($normalizedPath))
        {
            continue
        }

        if ($normalizedPath -eq $normalizedDailyChangelogPath)
        {
            continue
        }

        if ($normalizedPath -match '(?i)^\.agents/work-items/.*\.work-item\.md$')
        {
            continue
        }

        if (-not $evidencePaths.Contains($normalizedPath))
        {
            $evidencePaths.Add($normalizedPath)
        }
    }

    return @($evidencePaths)
}

function Test-ChangelogMentionsPaths
{
    param(
        [string]$Content,
        [string[]]$Paths
    )

    $expectedPaths = New-Object System.Collections.Generic.List[string]
    foreach ($path in @($Paths))
    {
        $normalizedPath = Get-NormalizedRelativePath -Path $path
        if ( [string]::IsNullOrWhiteSpace($normalizedPath))
        {
            continue
        }

        if (-not $expectedPaths.Contains($normalizedPath))
        {
            $expectedPaths.Add($normalizedPath)
        }
    }

    if ($expectedPaths.Count -eq 0)
    {
        return $true
    }

    if ( [string]::IsNullOrWhiteSpace($Content))
    {
        return $false
    }

    $normalizedContent = $Content.ToLowerInvariant().Replace('\', '/')
    foreach ($expectedPath in $expectedPaths)
    {
        if (Test-NormalizedContentHasPathToken -Content $normalizedContent -PathToken $expectedPath)
        {
            continue
        }

        $segments = $expectedPath -split '/'
        $fileName = $segments[-1]
        $extension = [System.IO.Path]::GetExtension($fileName)
        if ($segments.Length -gt 1 -and -not [string]::IsNullOrWhiteSpace($extension))
        {
            $directory = $segments[0..($segments.Length - 2)] -join '/'
            $wildcard = ('{0}/*{1}' -f $directory, $extension)
            if (Test-NormalizedContentHasPathToken -Content $normalizedContent -PathToken $wildcard)
            {
                continue
            }
        }

        return $false
    }

    return $true
}

function Test-DailyChangelogEvidencesExecution
{
    param(
        [string]$RepoRoot,
        [datetime]$Now,
        $LatestExecutionTimestampUtc,
        [string[]]$ExpectedPaths
    )

    $changelogPath = Get-DailyChangelogPath -RepoRoot $RepoRoot -Now $Now
    if (-not (Test-Path -LiteralPath $changelogPath))
    {
        return $false
    }

    try
    {
        $changelogFile = Get-Item -LiteralPath $changelogPath -ErrorAction Stop
    }
    catch
    {
        return $false
    }

    if ($null -ne $LatestExecutionTimestampUtc -and $changelogFile.LastWriteTimeUtc -lt ([datetime]$LatestExecutionTimestampUtc))
    {
        return $false
    }

    $paths = Get-ChangelogEvidencePaths `
        -Paths $ExpectedPaths `
        -DailyChangelogRelativePath (Get-DailyChangelogRelativePath -Now $Now)
    if ($paths.Count -eq 0)
    {
        return $true
    }

    try
    {
        $content = Get-Content -LiteralPath $changelogPath -Raw -ErrorAction Stop
    }
    catch
    {
        return $false
    }

    return Test-ChangelogMentionsPaths -Content $content -Paths $paths
}

function Test-WorkItemUpdatedToday
{
    param(
        [string]$RepoRoot,
        [datetime]$Now
    )

    $workItemsDir = Join-Path $RepoRoot '.agents/work-items'
    if (-not (Test-Path -LiteralPath $workItemsDir))
    {
        return $false
    }

    $daySegment = $Now.ToString('yyyyMMdd')
    $dayStamp = $Now.ToString('yyyy-MM-dd')
    $updatedPattern = '(?m)^- atualizado em:\s*' + [System.Text.RegularExpressions.Regex]::Escape($dayStamp) + '(?:\s|$)'

    foreach ($file in (Get-ChildItem -LiteralPath $workItemsDir -File -Filter '*.work-item.md' -ErrorAction SilentlyContinue))
    {
        if ( $file.BaseName.StartsWith($daySegment))
        {
            return $true
        }

        if ($file.LastWriteTime.Date -eq $Now.Date)
        {
            return $true
        }

        try
        {
            $content = Get-Content -LiteralPath $file.FullName -Raw -ErrorAction Stop
        }
        catch
        {
            continue
        }

        if ($content -match $updatedPattern)
        {
            return $true
        }
    }

    return $false
}

function Test-ChangelogArtifactsExist
{
    param(
        [string]$RepoRoot
    )

    $changelogRoot = Join-Path $RepoRoot '.agents/changelogs'
    if (-not (Test-Path -LiteralPath $changelogRoot))
    {
        return $false
    }

    $files = @(Get-ChildItem -LiteralPath $changelogRoot -Recurse -File -Filter '*.md' -ErrorAction SilentlyContinue)
    return $files.Count -gt 0
}

function Get-PythonInvocation
{
    $python = Get-Command python -ErrorAction SilentlyContinue
    if ($null -ne $python)
    {
        return @{
            command = [string]$python.Source
            arguments = @()
        }
    }

    $py = Get-Command py -ErrorAction SilentlyContinue
    if ($null -ne $py)
    {
        return @{
            command = [string]$py.Source
            arguments = @('-3')
        }
    }

    return $null
}

function Format-ValidationOutput
{
    param(
        [object[]]$Output
    )

    $text = (@($Output) | ForEach-Object { [string]$_ }) -join "`n"
    $text = $text.Trim()
    if ([string]::IsNullOrWhiteSpace($text))
    {
        return 'sem detalhes de saída.'
    }

    $text = [System.Text.RegularExpressions.Regex]::Replace($text, '\s+', ' ')
    if ($text.Length -gt 360)
    {
        return $text.Substring(0, 357) + '...'
    }

    return $text
}

function Invoke-ChangelogContractValidation
{
    param(
        [string]$RepoRoot,
        $Config
    )

    if ($null -ne $Config -and $Config.PSObject.Properties.Name -contains 'validate_changelog_contract')
    {
        if ($Config.validate_changelog_contract -eq $false)
        {
            return ''
        }
    }

    $validatorPath = Join-Path $RepoRoot '.agents/scripts/validate_changelog_contract.py'
    if (-not (Test-Path -LiteralPath $validatorPath))
    {
        return ''
    }

    if (-not (Test-ChangelogArtifactsExist -RepoRoot $RepoRoot))
    {
        return ''
    }

    $python = Get-PythonInvocation
    if ($null -eq $python)
    {
        return 'Validação estrutural do changelog não executada: Python não encontrado.'
    }

    $output = @()
    try
    {
        $arguments = @($python.arguments) + @($validatorPath, $RepoRoot)
        $output = & $python.command @arguments 2>&1
        $exitCode = $LASTEXITCODE
    }
    catch
    {
        return 'Validação estrutural do changelog falhou: ' + $_.Exception.Message
    }

    if ($exitCode -eq 0)
    {
        return ''
    }

    return 'Validação estrutural do changelog falhou: ' + (Format-ValidationOutput -Output $output)
}

function Build-GuardMessage
{
    param(
        [int]$MatchCount,
        [string[]]$MissingArtifacts,
        [switch]$HasLocalMaterialChange,
        [switch]$HasDailyChangelog,
        [switch]$HasChangelogEvidence
    )

    $continuityReminder = 'validar se artefatos de changelog ou work-item foram gerados.'

    if ($MatchCount -gt 0)
    {
        $commandCountText = if ($MatchCount -eq 1)
        {
            '1 comando remoto'
        }
        else
        {
            '{0} comandos remotos' -f $MatchCount
        }
        return ('Sessão com {0} de mutação/implantação; {1}' -f $commandCountText, $continuityReminder)
    }

    if ($HasLocalMaterialChange)
    {
        return ('Sessão com alteração material; {0}' -f $continuityReminder)
    }

    if ($MatchCount -le 0)
    {
        return 'Nenhum registro de execução a ser persistido.'
    }
}

try
{
    if ($Event -ine 'Stop')
    {
        Write-HookResponse
    }

    $config = Load-GuardConfig
    if ($null -eq $config)
    {
        Write-HookResponse
    }

    $mode = [string]$config.mode
    if ([string]::IsNullOrWhiteSpace($mode) -or $mode -ieq 'off')
    {
        Write-HookResponse
    }

    $payloadText = [Console]::In.ReadToEnd()
    if ( [string]::IsNullOrWhiteSpace($payloadText))
    {
        Write-HookResponse
    }

    try
    {
        $payload = $payloadText | ConvertFrom-Json
    }
    catch
    {
        Write-HookResponse
    }

    $transcriptPath = [string]$payload.transcript_path
    if ( [string]::IsNullOrWhiteSpace($transcriptPath))
    {
        Write-HookResponse
    }

    $patterns = @($config.command_patterns)
    if ($patterns.Count -eq 0)
    {
        Write-HookResponse
    }

    $signals = Get-TranscriptSignals -TranscriptPath $transcriptPath -Patterns $patterns
    $matchedCommands = @($signals.matchedCommands)
    $hasLocalMaterialChange = [bool]$signals.hasLocalMaterialChange
    $localChangedPaths = @($signals.localChangedPaths)
    $latestMatchedCommandTimestampUtc = $signals.latestMatchedCommandTimestampUtc
    $latestLocalChangeTimestampUtc = $signals.latestLocalChangeTimestampUtc
    if ($matchedCommands.Count -eq 0 -and -not $hasLocalMaterialChange)
    {
        Write-HookResponse -Message (Build-GuardMessage -MatchCount 0 -MissingArtifacts @())
    }

    $repoRoot = Get-RepoRoot
    $now = Get-Date
    $missingArtifacts = New-Object System.Collections.Generic.List[string]
    $hasDailyChangelog = $true
    $hasChangelogEvidence = $true

    if ($config.require_daily_changelog -ne $false)
    {
        $hasDailyChangelog = Test-DailyChangelogExists -RepoRoot $repoRoot -Now $now
        if ($hasDailyChangelog)
        {
            if ($hasLocalMaterialChange)
            {
                $hasChangelogEvidence = Test-DailyChangelogEvidencesExecution `
                    -RepoRoot $repoRoot `
                    -Now $now `
                    -LatestExecutionTimestampUtc $latestLocalChangeTimestampUtc `
                    -ExpectedPaths $localChangedPaths
            }
            elseif ($matchedCommands.Count -gt 0)
            {
                $hasChangelogEvidence = Test-DailyChangelogEvidencesExecution `
                    -RepoRoot $repoRoot `
                    -Now $now `
                    -LatestExecutionTimestampUtc $latestMatchedCommandTimestampUtc `
                    -ExpectedPaths @()
            }
        }
        else
        {
            $hasChangelogEvidence = $false
        }
    }

    if ($matchedCommands.Count -gt 0 -and $config.require_work_item_updated_today -ne $false)
    {
        if (-not (Test-WorkItemUpdatedToday -RepoRoot $repoRoot -Now $now))
        {
            $missingArtifacts.Add('work-item da sessão')
        }
    }

    if ($config.require_daily_changelog -ne $false)
    {
        if (-not $hasDailyChangelog)
        {
            $missingArtifacts.Add('changelog do dia')
        }
        elseif (($matchedCommands.Count -gt 0 -or $hasLocalMaterialChange) -and -not $hasChangelogEvidence)
        {
            $missingArtifacts.Add('registro desta execução no changelog do dia')
        }
    }

    $changelogContractWarning = Invoke-ChangelogContractValidation -RepoRoot $repoRoot -Config $config

    $message = Build-GuardMessage `
        -MatchCount $matchedCommands.Count `
        -MissingArtifacts @($missingArtifacts) `
        -HasLocalMaterialChange:$hasLocalMaterialChange `
        -HasDailyChangelog:$hasDailyChangelog `
        -HasChangelogEvidence:$hasChangelogEvidence
    if (-not [string]::IsNullOrWhiteSpace($changelogContractWarning))
    {
        $message = ($message.TrimEnd() + ' ' + $changelogContractWarning)
    }
    Write-HookResponse -Message $message
}
catch
{
    Write-HookResponse
}
