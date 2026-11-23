[Diagnostics.CodeAnalysis.SuppressMessageAttribute('PSAvoidAssignmentToAutomaticVariable', 'Event', Justification = 'Event is the existing public hook parameter; renaming it would break callers.')]
param(
    [string]$Event = "PreToolUse",
    [switch]$EnforceExecutionBudget
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
    if ([string]::IsNullOrWhiteSpace($raw)) { return [pscustomobject]@{} }
    try { return $raw | ConvertFrom-Json } catch { return [pscustomobject]@{} }
}

function Get-CommandText {
    param([object]$Payload)
    foreach ($candidate in @(
            $Payload.tool_input.command
            $Payload.toolInput.command
            $Payload.input.command
            $Payload.command
        )) {
        if ($candidate -is [string] -and -not [string]::IsNullOrWhiteSpace($candidate)) {
            return $candidate
        }
    }
    return $null
}

function Get-CommandElementValue {
    param([System.Management.Automation.Language.CommandElementAst]$Element)
    if ($Element -is [System.Management.Automation.Language.StringConstantExpressionAst]) {
        return $Element.Value
    }
    if (
        $Element -is [System.Management.Automation.Language.ExpandableStringExpressionAst] -and
        $Element.NestedExpressions.Count -eq 0
    ) {
        return $Element.Value
    }
    return $Element.Extent.Text
}

function Get-ExecutableLeafName {
    param([string]$Value)
    if ([string]::IsNullOrWhiteSpace($Value)) { return $null }
    return [System.IO.Path]::GetFileName($Value.Trim()).ToLowerInvariant()
}

function Get-CommandInvocation {
    param([System.Management.Automation.Language.CommandAst]$CommandAst)
    $values = @(foreach ($element in $CommandAst.CommandElements) {
            Get-CommandElementValue -Element $element
        })
    if ($values.Count -eq 0) { return $null }
    $commandIndex = 0
    $wrappedByRtk = $false
    $commandName = Get-ExecutableLeafName -Value $values[$commandIndex]
    if ($commandName -in @("rtk", "rtk.exe")) {
        if ($values.Count -lt 2) { return $null }
        $wrappedByRtk = $true
        $commandIndex = 1
        $commandName = Get-ExecutableLeafName -Value $values[$commandIndex]
        if ($commandName -eq "proxy") {
            if ($values.Count -lt 3) { return $null }
            $commandIndex = 2
            $commandName = Get-ExecutableLeafName -Value $values[$commandIndex]
        }
    }
    $arguments = @()
    if (($commandIndex + 1) -lt $values.Count) {
        $arguments = @($values[($commandIndex + 1)..($values.Count - 1)])
    }
    return [pscustomobject]@{
        Name         = $commandName
        Arguments    = $arguments
        WrappedByRtk = $wrappedByRtk
    }
}

function Get-ParsedCommand {
    param([string]$CommandText)
    $tokens = $null
    $parseErrors = $null
    $ast = [System.Management.Automation.Language.Parser]::ParseInput(
        $CommandText,
        [ref]$tokens,
        [ref]$parseErrors
    )
    $invocations = @()
    if ($null -ne $ast) {
        $invocations = @(
            foreach ($commandAst in @($ast.FindAll(
                        { param($astItem) $astItem -is [System.Management.Automation.Language.CommandAst] },
                        $true
                    ))) {
                $invocation = Get-CommandInvocation -CommandAst $commandAst
                if ($null -ne $invocation) { $invocation }
            }
        )
    }
    return [pscustomobject]@{
        Ast         = $ast
        Tokens      = @($tokens)
        Errors      = @($parseErrors)
        Invocations = @($invocations)
    }
}

function Test-AmbiguousVariableBoundary {
    param([object]$ParsedCommand)
    foreach ($parseError in $ParsedCommand.Errors) {
        if ($parseError.ErrorId -ne "InvalidVariableReferenceWithDrive") { continue }
        $errorStart = $parseError.Extent.StartOffset
        foreach ($token in $ParsedCommand.Tokens) {
            if ($token.Kind -notin @("StringExpandable", "HereStringExpandable")) { continue }
            if (
                $token.Extent.StartOffset -le $errorStart -and
                $errorStart -lt $token.Extent.EndOffset
            ) {
                return $true
            }
        }
    }
    return $false
}

function Test-RtkCmdletBoundary {
    param([object[]]$Invocations)
    foreach ($invocation in $Invocations) {
        if (-not $invocation.WrappedByRtk) { continue }
        if (
            $invocation.Name -match
            "(?i)^(?:Get|Set|New|Remove|Test|Resolve|Select|Where|ForEach|Copy|Move|Join|Split|Write|Read|Invoke|Start|Stop|ConvertTo|ConvertFrom)-[A-Za-z][\w-]*$"
        ) {
            return $true
        }
    }
    return $false
}

function Test-UnroutedExecutable {
    param([object[]]$Invocations)
    foreach ($invocation in $Invocations) {
        if ($invocation.WrappedByRtk) { continue }
        if ($invocation.Name -in @("rtk", "rtk.exe")) { continue }
        if ([string]::IsNullOrWhiteSpace($invocation.Name)) { continue }

        $resolved = Get-Command -Name $invocation.Name -ErrorAction SilentlyContinue |
            Select-Object -First 1
        if ($null -eq $resolved) { continue }
        if ($resolved.CommandType -in @("Application", "ExternalScript")) {
            return $true
        }
    }
    return $false
}

function Test-UnboundedFullRead {
    param([object[]]$Invocations, [int64]$MaximumBytes = 32768)
    foreach ($invocation in $Invocations) {
        if ($invocation.Name -notin @("get-content", "gc")) { continue }

        $arguments = @($invocation.Arguments)
        $bounded = $false
        $raw = $false
        $paths = [System.Collections.Generic.List[string]]::new()
        for ($index = 0; $index -lt $arguments.Count; $index++) {
            $argument = [string]$arguments[$index]
            if ($argument -match "(?i)^-(?:Raw)$") {
                $raw = $true
                continue
            }
            if ($argument -match "(?i)^-(?:TotalCount|Head|First|Tail)$") {
                if (($index + 1) -lt $arguments.Count) {
                    $count = 0
                    if ([int]::TryParse([string]$arguments[$index + 1], [ref]$count) -and $count -le 200) {
                        $bounded = $true
                    }
                    $index++
                }
                continue
            }
            if ($argument -match "(?i)^-(?:LiteralPath|Path)$") {
                if (($index + 1) -lt $arguments.Count) {
                    $paths.Add([string]$arguments[$index + 1])
                    $index++
                }
                continue
            }
            if (-not $argument.StartsWith("-")) {
                $paths.Add($argument)
            }
        }
        if ($bounded -and -not $raw) { continue }

        $totalBytes = [int64]0
        foreach ($path in $paths) {
            if ([string]::IsNullOrWhiteSpace($path)) { continue }
            try {
                $containsWildcard = [System.Management.Automation.WildcardPattern]::ContainsWildcardCharacters($path)
                $resolvedPath = if ([System.IO.Path]::IsPathRooted($path)) {
                    $path
                }
                else {
                    Join-Path (Get-Location) $path
                }
                $items = if ($containsWildcard) {
                    @(Get-Item -Path $resolvedPath -ErrorAction Stop)
                }
                else {
                    @(Get-Item -LiteralPath ([System.IO.Path]::GetFullPath($resolvedPath)) -ErrorAction Stop)
                }
                foreach ($item in $items) {
                    if (-not $item.PSIsContainer) { $totalBytes += [int64]$item.Length }
                    if ($totalBytes -gt $MaximumBytes) { return $true }
                }
            }
            catch {
                continue
            }
        }
        if ($totalBytes -gt $MaximumBytes) { return $true }
    }
    return $false
}

function Test-ForeachPipeline {
    param([object]$ParsedCommand, [string]$CommandText)
    foreach ($foreachAst in @($ParsedCommand.Ast.FindAll(
                { param($astItem) $astItem -is [System.Management.Automation.Language.ForEachStatementAst] },
                $true
            ))) {
        foreach ($token in $ParsedCommand.Tokens) {
            if ($token.Kind -ne "Pipe") { continue }
            if ($token.Extent.StartOffset -lt $foreachAst.Extent.EndOffset) { continue }
            $between = $CommandText.Substring(
                $foreachAst.Extent.EndOffset,
                $token.Extent.StartOffset - $foreachAst.Extent.EndOffset
            )
            if ([string]::IsNullOrWhiteSpace($between)) { return $true }
            break
        }
    }
    return $false
}

function Test-NestedPowerShellCommand {
    param([object[]]$Invocations)
    foreach ($invocation in $Invocations) {
        if ($invocation.Name -notin @("pwsh", "pwsh.exe", "powershell", "powershell.exe")) {
            continue
        }
        foreach ($argument in $invocation.Arguments) {
            if ($argument -match "(?i)^-(?:Command|c)$") { return $true }
            if ($argument -match "(?i)^-(?:File|f)$") { break }
        }
    }
    return $false
}

function Test-RipgrepPositionalPathGlob {
    param([object[]]$Invocations)
    $optionsWithValues = [System.Collections.Generic.HashSet[string]]::new(
        [System.StringComparer]::Ordinal
    )
    foreach ($option in @(
            "-A", "--after-context", "-B", "--before-context", "-C", "--context",
            "--context-separator", "-E", "--encoding", "-e", "--regexp", "-f", "--file",
            "-g", "--glob", "--iglob", "--ignore-file", "-j", "--threads", "-M",
            "--max-columns", "-m", "--max-count", "--max-depth", "--max-filesize",
            "--path-separator", "--pre", "--pre-glob", "-r", "--replace", "--sort",
            "--sortr", "-t", "--type", "--type-add", "--type-clear", "-T", "--type-not",
            "--color", "--colors", "--engine", "--dfa-size-limit", "--regex-size-limit",
            "--field-context-separator", "--field-match-separator", "--hostname-bin",
            "--hyperlink-format"
        )) {
        [void]$optionsWithValues.Add($option)
    }
    foreach ($invocation in $Invocations) {
        if ($invocation.Name -notin @("rg", "rg.exe")) { continue }
        $positional = [System.Collections.Generic.List[string]]::new()
        $patternByOption = $false
        $pathOnly = $false
        $endOptions = $false
        for ($index = 0; $index -lt $invocation.Arguments.Count; $index++) {
            $argument = [string]$invocation.Arguments[$index]
            if (-not $endOptions -and $argument -eq "--") {
                $endOptions = $true
                continue
            }
            if (-not $endOptions -and $argument -match "^--(?:regexp|file)=") {
                $patternByOption = $true
                continue
            }
            if (-not $endOptions -and $argument -match "^-(?:e|f).+") {
                $patternByOption = $true
                continue
            }
            if (-not $endOptions -and $argument -eq "--files") {
                $pathOnly = $true
                continue
            }
            if (-not $endOptions -and $optionsWithValues.Contains($argument)) {
                if ($argument -in @("-e", "--regexp", "-f", "--file")) {
                    $patternByOption = $true
                }
                $index++
                continue
            }
            if (-not $endOptions -and $argument.StartsWith("-")) { continue }
            $positional.Add($argument)
        }
        $pathStart = if ($patternByOption -or $pathOnly) { 0 } else { 1 }
        for ($index = $pathStart; $index -lt $positional.Count; $index++) {
            if ($positional[$index] -match "[\\/]" -and $positional[$index] -match "[*?]") {
                return $true
            }
        }
    }
    return $false
}

function Get-PosixArgumentValue {
    param([string]$Text)
    # Decode literal quoting/escaping only. Never expand variables or run shell code.
    $values = [System.Collections.Generic.List[string]]::new()
    $word = [System.Text.StringBuilder]::new()
    $quote = [char]0
    $started = $false
    for ($index = 0; $index -lt $Text.Length; $index++) {
        $char = $Text[$index]
        if ($quote -eq "'") {
            if ($char -eq "'") { $quote = [char]0 }
            else { [void]$word.Append($char) }
            continue
        }
        if ($char -eq '\') {
            if (($index + 1) -ge $Text.Length) { return @() }
            $next = $Text[$index + 1]
            if ($quote -eq [char]0 -or $next -in @('$', '`', '"', '\', "`n")) {
                $index++
                if ($next -ne "`n") { [void]$word.Append($next); $started = $true }
            }
            else { [void]$word.Append($char) }
            continue
        }
        if ($char -eq '"') {
            $quote = if ($quote -eq '"') { [char]0 } else { [char]'"' }
            $started = $true
            continue
        }
        if ($quote -eq [char]0 -and $char -eq "'") {
            $quote = [char]"'"
            $started = $true
            continue
        }
        if ($quote -eq [char]0 -and [char]::IsWhiteSpace($char)) {
            if ($started) { $values.Add($word.ToString()); [void]$word.Clear(); $started = $false }
            continue
        }
        [void]$word.Append($char)
        $started = $true
    }
    if ($quote -ne [char]0) { return @() }
    if ($started) { $values.Add($word.ToString()) }
    return @($values)
}

function Get-PosixShellToken {
    param([string]$CommandText)
    # Retain quoting and token positions; never expand or execute shell text.
    $tokens = [System.Collections.Generic.List[object]]::new()
    $hereDocuments = [System.Collections.Generic.List[object]]::new()
    $pendingDelimiter = $null
    $index = 0
    while ($index -lt $CommandText.Length) {
        $char = $CommandText[$index]
        if ($char -eq "`n") {
            $tokens.Add([pscustomobject]@{ Kind = 'separator'; Raw = "`n" })
            $index++
            foreach ($hereDocument in $hereDocuments) {
                while ($index -lt $CommandText.Length) {
                    $end = $CommandText.IndexOf("`n", $index)
                    if ($end -lt 0) { $end = $CommandText.Length }
                    $line = $CommandText.Substring($index, $end - $index).TrimEnd("`r")
                    if ($hereDocument.StripTabs) { $line = $line.TrimStart([char]9) }
                    $index = [Math]::Min($end + 1, $CommandText.Length)
                    if ($line -ceq $hereDocument.Delimiter) { break }
                }
            }
            $hereDocuments.Clear()
            continue
        }
        if ([char]::IsWhiteSpace($char)) { $index++; continue }
        if ($char -eq '#') {
            while ($index -lt $CommandText.Length -and $CommandText[$index] -ne "`n") { $index++ }
            continue
        }
        $start = $index
        if ($CommandText.Substring($index) -match '^(?:&>>|&>|<<-|<<<|<<|>>|<>|<&|>&|>\||&&|\|\||[<>;&|])') {
            $operator = $Matches[0]
            $kind = if ($operator -match '^[;&|]+$') { 'separator' } else { 'redirect' }
            $index += $operator.Length
            $tokens.Add([pscustomobject]@{ Kind = $kind; Raw = $operator; Start = $start; End = $index })
            if ($operator -in @('<<', '<<-')) { $pendingDelimiter = $operator }
            continue
        }
        $quote = [char]0
        while ($index -lt $CommandText.Length) {
            $char = $CommandText[$index]
            if ($quote -eq "'") {
                if ($char -eq "'") { $quote = [char]0 }
            }
            elseif ($char -eq '\') { $index += 2; continue }
            elseif ($char -eq '"') { $quote = if ($quote -eq '"') { [char]0 } else { [char]'"' } }
            elseif ($quote -eq [char]0) {
                if ($char -eq "'") { $quote = [char]"'" }
                elseif ([char]::IsWhiteSpace($char) -or $char -in @('<', '>', ';', '&', '|')) { break }
            }
            $index++
        }
        $index = [Math]::Min($index, $CommandText.Length)
        $raw = $CommandText.Substring($start, $index - $start)
        $decoded = @(Get-PosixArgumentValue -Text $raw)
        $value = if ($decoded.Count -eq 1) { $decoded[0] } else { $raw }
        $tokens.Add([pscustomobject]@{ Kind = 'word'; Raw = $raw; Value = $value; Start = $start; End = $index })
        if ($null -ne $pendingDelimiter) {
            $hereDocuments.Add([pscustomobject]@{ Delimiter = $value; StripTabs = ($pendingDelimiter -eq '<<-') })
            $pendingDelimiter = $null
        }
    }
    return @($tokens)
}

function Get-PosixCommandSegment {
    param([string]$CommandText)
    $parts = [System.Collections.Generic.List[object]]::new()
    $current = [System.Collections.Generic.List[object]]::new()
    foreach ($token in @(Get-PosixShellToken -CommandText $CommandText)) {
        if ($token.Kind -eq 'separator') {
            if ($current.Count -gt 0) { $parts.Add([pscustomobject]@{ Tokens = @($current) }); $current.Clear() }
        }
        else { $current.Add($token) }
    }
    if ($current.Count -gt 0) { $parts.Add([pscustomobject]@{ Tokens = @($current) }) }
    $segments = [System.Collections.Generic.List[object]]::new()
    foreach ($part in $parts) {
        $tokens = $part.Tokens
        $commandIndex = 0
        if ($tokens[0].Value -eq 'rtk') {
            $commandIndex++
            if ($tokens.Count -gt 1 -and $tokens[1].Value -eq 'proxy') { $commandIndex++ }
        }
        if ($commandIndex -ge $tokens.Count -or $tokens[$commandIndex].Kind -ne 'word') { continue }
        if ($tokens[$commandIndex].Value -notmatch '(?:^|/)(?:rg|pwsh|powershell|cat)$') { continue }
        $arguments = @($tokens | Select-Object -Skip ($commandIndex + 1))
        $segments.Add([pscustomobject]@{
                Name      = ($tokens[0..$commandIndex].Value -join ' ')
                Args      = ($arguments.Raw -join ' ')
                Arguments = $arguments
            })
    }
    return @($segments)
}

function Get-PosixReadArgumentValue {
    param([object[]]$Tokens)
    $values = [System.Collections.Generic.List[string]]::new()
    for ($index = 0; $index -lt $Tokens.Count; $index++) {
        $token = $Tokens[$index]
        if ($token.Kind -eq 'redirect') {
            if (($index + 1) -lt $Tokens.Count -and $Tokens[$index + 1].Kind -eq 'word') {
                $index++
                # Input files are reads; output targets, descriptors and here-data are not.
                if ($token.Raw -in @('<', '<>')) { $values.Add($Tokens[$index].Value) }
            }
            continue
        }
        if ($token.Raw -match '^\d+$' -and ($index + 1) -lt $Tokens.Count -and
            $Tokens[$index + 1].Kind -eq 'redirect' -and $token.End -eq $Tokens[$index + 1].Start) { continue }
        $values.Add($token.Value)
    }
    return @($values)
}

function Test-PosixNestedPowerShellCommand {
    param([object[]]$Segments)
    foreach ($segment in $Segments) {
        if ($segment.Name -notmatch '(?:^|[/\s])(?:pwsh|powershell)$') { continue }
        if ($segment.Args -match '(?:^|\s)-(?:Command|c)(?:\s|$)') { return $true }
    }
    return $false
}

function Test-PosixRipgrepPositionalPathGlob {
    param([object[]]$Segments)
    $optionsWithValues = @(
        '-A', '--after-context', '-B', '--before-context', '-C', '--context',
        '--context-separator', '-E', '--encoding', '-e', '--regexp', '-f', '--file',
        '-g', '--glob', '--iglob', '--ignore-file', '-j', '--threads', '-M',
        '--max-columns', '-m', '--max-count', '--max-depth', '--max-filesize',
        '--path-separator', '--pre', '--pre-glob', '-r', '--replace', '--sort',
        '--sortr', '-t', '--type', '--type-add', '--type-clear', '-T', '--type-not',
        '--color', '--colors', '--engine', '--dfa-size-limit', '--regex-size-limit',
        '--field-context-separator', '--field-match-separator', '--hostname-bin',
        '--hyperlink-format'
    )
    foreach ($segment in $Segments) {
        if ($segment.Name -notmatch '(?:^|[/\s])rg$') { continue }
        $arguments = @(Get-PosixArgumentValue -Text $segment.Args)
        $positionals = [System.Collections.Generic.List[string]]::new()
        $pathOnly = $false
        $patternByOption = $false
        $endOptions = $false
        for ($index = 0; $index -lt $arguments.Count; $index++) {
            $argument = $arguments[$index]
            if (-not $endOptions -and $argument -eq '--') { $endOptions = $true; continue }
            if (-not $endOptions -and $argument -match '^--(?:regexp|file)=') {
                $patternByOption = $true
                continue
            }
            if (-not $endOptions -and $argument -match '^-(?:e|f).+') {
                $patternByOption = $true
                continue
            }
            if (-not $endOptions -and $argument -eq '--files') { $pathOnly = $true; continue }
            if (-not $endOptions -and $argument -in $optionsWithValues) {
                if ($argument -in @('-e', '--regexp', '-f', '--file')) {
                    $patternByOption = $true
                }
                $index++
                continue
            }
            if (-not $endOptions -and $argument.StartsWith('-')) { continue }
            $positionals.Add($argument)
        }
        $pathStart = if ($patternByOption -or $pathOnly) { 0 } else { 1 }
        for ($index = $pathStart; $index -lt $positionals.Count; $index++) {
            if ($positionals[$index] -match '[/\\]' -and $positionals[$index] -match '[*?]') {
                return $true
            }
        }
    }
    return $false
}

function Test-PosixUnboundedFullRead {
    param([object[]]$Segments, [int64]$MaximumBytes = 32768)
    foreach ($segment in $Segments) {
        if ($segment.Name -notmatch '(?:^|[/\s])cat$') { continue }
        foreach ($path in @(Get-PosixReadArgumentValue -Tokens $segment.Arguments)) {
            if ($path.StartsWith('-') -or $path -match '[*?$`]') { continue }
            try {
                $item = Get-Item -LiteralPath $path -ErrorAction Stop
                if (-not $item.PSIsContainer -and $item.Length -gt $MaximumBytes) { return $true }
            }
            catch { continue }
        }
    }
    return $false
}

function Read-PreflightPolicy {
    param([string]$ConfigPath, [hashtable]$PatternRegistry)
    $policy = [ordered]@{
        DefaultMode = "warn"
        Overrides   = @{}
        Notices     = [System.Collections.Generic.List[string]]::new()
    }
    if (-not (Test-Path -LiteralPath $ConfigPath -PathType Leaf)) {
        return [pscustomobject]$policy
    }
    try {
        $section = ""
        $schemaValid = $true
        $syntaxValid = $true
        foreach ($rawLine in (Get-Content -LiteralPath $ConfigPath -Encoding UTF8)) {
            $line = ($rawLine -replace "\s+#.*$", "").Trim()
            if ([string]::IsNullOrWhiteSpace($line)) { continue }
            if ($line -match "^\[([A-Za-z0-9_-]+)\]$") {
                $section = $Matches[1].ToLowerInvariant()
                continue
            }
            if ($line -notmatch '^([A-Za-z0-9_-]+)\s*=\s*(?:"([^"]*)"|([A-Za-z0-9_-]+))$') {
                $syntaxValid = $false
                $policy.Notices.Add(
                    "A configuração ativa contém sintaxe ignorada; o modo seguro warn foi preservado."
                )
                continue
            }
            $key = $Matches[1]
            $value = @($Matches[2], $Matches[3]) |
                Where-Object { $null -ne $_ -and $_ -ne "" } |
                Select-Object -First 1
            if ($section -eq "" -and $key -eq "schema_version") {
                if ($value -ne "1") {
                    $schemaValid = $false
                    $policy.Notices.Add(
                        "schema_version inválido foi ignorado; o modo seguro warn foi preservado."
                    )
                    $policy.DefaultMode = "warn"
                    $policy.Overrides = @{}
                }
                continue
            }
            if ($section -eq "" -and $key -eq "default_mode") {
                if ($value -in @("off", "warn", "deny")) {
                    $policy.DefaultMode = $value
                }
                else {
                    $policy.DefaultMode = "warn"
                    $policy.Notices.Add("default_mode inválido foi reduzido ao modo seguro warn.")
                }
                continue
            }
            if ($section -eq "patterns" -and $PatternRegistry.ContainsKey($key)) {
                if ($value -in @("off", "warn", "deny")) {
                    $policy.Overrides[$key] = $value
                }
                else {
                    $policy.Overrides[$key] = "warn"
                    $policy.Notices.Add(
                        "Um modo de padrão inválido foi reduzido ao modo seguro warn."
                    )
                }
            }
        }
        if (-not $schemaValid -or -not $syntaxValid) {
            $policy.DefaultMode = "warn"
            $policy.Overrides = @{}
        }
    }
    catch {
        $policy.DefaultMode = "warn"
        $policy.Overrides = @{}
        $policy.Notices.Add(
            "A configuração ativa não pôde ser lida; o modo seguro warn foi preservado."
        )
    }
    return [pscustomobject]$policy
}

try {
    if ($Event -ne "PreToolUse") { exit 0 }
    $command = Get-CommandText -Payload (Read-HookPayload)
    if ([string]::IsNullOrWhiteSpace($command)) { exit 0 }

    $detected = [System.Collections.Generic.HashSet[string]]::new()
    $enforced = [System.Collections.Generic.HashSet[string]]::new()
    if ($IsWindows -or $env:OS -eq 'Windows_NT') {
        $parsed = Get-ParsedCommand -CommandText $command
        if (Test-RtkCmdletBoundary -Invocations $parsed.Invocations) {
            [void]$detected.Add("RTK_CMDLET_BOUNDARY")
        }
        if (Test-NestedPowerShellCommand -Invocations $parsed.Invocations) {
            [void]$detected.Add("NESTED_POWERSHELL_COMMAND")
        }
        if (Test-ForeachPipeline -ParsedCommand $parsed -CommandText $command) {
            [void]$detected.Add("FOREACH_PIPELINE")
        }
        if (Test-RipgrepPositionalPathGlob -Invocations $parsed.Invocations) {
            [void]$detected.Add("RG_POSITIONAL_GLOB")
        }
        if (Test-AmbiguousVariableBoundary -ParsedCommand $parsed) {
            [void]$detected.Add("POWERSHELL_AMBIGUOUS_VARIABLE_BOUNDARY")
        }
        if ($EnforceExecutionBudget -and (Test-UnroutedExecutable -Invocations $parsed.Invocations)) {
            [void]$detected.Add("UNROUTED_EXECUTABLE")
            [void]$enforced.Add("UNROUTED_EXECUTABLE")
        }
        if ($EnforceExecutionBudget -and (Test-UnboundedFullRead -Invocations $parsed.Invocations)) {
            [void]$detected.Add("UNBOUNDED_FULL_READ")
            [void]$enforced.Add("UNBOUNDED_FULL_READ")
        }
    }
    else {
        $segments = Get-PosixCommandSegment -CommandText $command
        if (Test-PosixNestedPowerShellCommand -Segments $segments) {
            [void]$detected.Add("NESTED_POWERSHELL_COMMAND")
        }
        if (Test-PosixRipgrepPositionalPathGlob -Segments $segments) {
            [void]$detected.Add("RG_POSITIONAL_GLOB")
        }
        if ($EnforceExecutionBudget -and (Test-PosixUnboundedFullRead -Segments $segments)) {
            [void]$detected.Add("UNBOUNDED_FULL_READ")
            [void]$enforced.Add("UNBOUNDED_FULL_READ")
        }
    }
    if ($detected.Count -eq 0) { exit 0 }

    $registry = @{
        "RTK_CMDLET_BOUNDARY"                    = @{
            Blockable = $true
            Guidance  = "PowerShell cmdlet passed to RTK. Run the cmdlet in the active PowerShell layer; RTK only launches executables."
        }
        "NESTED_POWERSHELL_COMMAND"              = @{
            Blockable = $false
            Guidance  = "Nested PowerShell -Command detected. Use the active shell, or move non-trivial logic to a .ps1 file and invoke it with -File."
        }
        "FOREACH_PIPELINE"                       = @{
            Blockable = $true
            Guidance  = "Direct foreach output pipeline detected. Materialize foreach output in an explicit collection before sending it to a pipeline."
        }
        "RG_POSITIONAL_GLOB"                     = @{
            Blockable = $true
            Guidance  = "Positional glob detected in rg. Use --glob '<pattern>' and pass the directory separately."
        }
        "POWERSHELL_AMBIGUOUS_VARIABLE_BOUNDARY" = @{
            Blockable = $true
            Guidance  = 'Ambiguous variable boundary detected in an expandable PowerShell string. Use ${name}: for interpolation or a complete scoped variable such as $env:PATH.'
        }
        "UNROUTED_EXECUTABLE"                    = @{
            Blockable = $true
            Guidance  = "Executable not routed through RTK. Prefix the resolved executable with rtk, using rtk proxy when raw output is required."
        }
        "UNBOUNDED_FULL_READ"                    = @{
            Blockable = $true
            Guidance  = "Large integral file read detected. Read one bounded range at a time, with at most 200 lines per command."
        }
    }
    $repositoryRoot = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot "..\.."))
    $policy = Read-PreflightPolicy -ConfigPath (
        Join-Path $repositoryRoot ".agents\windows-shell-preflight.toml"
    ) -PatternRegistry $registry
    $warnings = [System.Collections.Generic.List[string]]::new()
    $denials = [System.Collections.Generic.List[string]]::new()
    foreach ($code in ($detected | Sort-Object)) {
        $mode = if ($enforced.Contains($code)) { "deny" } else { $policy.DefaultMode }
        if (-not $enforced.Contains($code) -and $policy.Overrides.ContainsKey($code)) {
            $mode = $policy.Overrides[$code]
        }
        $definition = $registry[$code]
        if ($mode -eq "deny" -and -not $definition.Blockable) {
            $mode = "warn"
            $policy.Notices.Add(
                "Um padrão não bloqueável configurado como deny foi reduzido a warn."
            )
        }
        if ($mode -eq "off") { continue }
        $message = "[$code] $($definition.Guidance)"
        if ($mode -eq "deny") { $denials.Add($message) } else { $warnings.Add($message) }
    }
    if ($warnings.Count -eq 0 -and $denials.Count -eq 0) { exit 0 }

    $lines = [System.Collections.Generic.List[string]]::new()
    if ($denials.Count -gt 0) {
        $lines.Add(
            "Shell Preflight: a política local bloqueou uma forma sintaticamente frágil antes da execução."
        )
    }
    else {
        $lines.Add(
            "Shell Preflight: o comando proposto corresponde a uma forma sintaticamente frágil."
        )
    }
    foreach ($message in $denials) { $lines.Add($message) }
    foreach ($message in $warnings) { $lines.Add($message) }
    foreach ($notice in ($policy.Notices | Select-Object -Unique)) {
        $lines.Add("[CONFIG] $notice")
    }
    $lines.Add("O hook não reescreveu, executou ou reproduziu o comando bruto.")
    $context = $lines -join [Environment]::NewLine
    $hookOutput = [ordered]@{
        hookEventName     = "PreToolUse"
        additionalContext = $context
    }
    if ($denials.Count -gt 0) {
        $hookOutput.permissionDecision = "deny"
        $hookOutput.permissionDecisionReason = $context
    }
    Write-HookResult -Result ([pscustomobject]@{
            hookSpecificOutput = [pscustomobject]$hookOutput
        })
}
catch {
    exit 0
}

exit 0
