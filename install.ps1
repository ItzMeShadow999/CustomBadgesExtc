$ErrorActionPreference = 'Stop'
try { [Console]::OutputEncoding = [System.Text.Encoding]::UTF8 } catch { }
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

$Owner  = 'ItzMeShadow999'
$Repo   = 'CustomBadgesExtc'
$Branch = 'main'
$AmoUrl = 'https://addons.mozilla.org/en-US/firefox/addon/custombadges-for-discord/'

$Files = @(
    'LICENSE',
    'README.md',
    'extension/background.js',
    'extension/content.js',
    'extension/icon128.png',
    'extension/icon16.png',
    'extension/icon32.png',
    'extension/icon48.png',
    'extension/manifest.json',
    'extension/popup.html',
    'extension/popup.js'
)

$SymSec  = [string][char]0x00A7
$SymStep = [string][char]0x25B8
$SymOk   = [string][char]0x25C6
$SymWarn = [string][char]0x25AA
$SymDie  = [string][char]0x2716
$SymEll  = [string][char]0x2026

function Step($m) { Write-Host ""; Write-Host "$SymSec $m" -ForegroundColor Magenta }
function Info($m) { Write-Host "  $SymStep $m" -ForegroundColor Gray }
function Ok($m)   { Write-Host "  $SymOk $m" -ForegroundColor Green }
function Warn($m) { Write-Host "  $SymWarn $m" -ForegroundColor Yellow }
function Die($m)  { Write-Host "  $SymDie $m" -ForegroundColor Red; throw $m }

$SpinFrames = @(0x280B, 0x2819, 0x2839, 0x2838, 0x283C, 0x2834, 0x2826, 0x2827, 0x2807, 0x280F) | ForEach-Object { [string][char]$_ }

function Draw-Spin($frame, $label, $text) {
    try { $w = [Console]::WindowWidth } catch { $w = 80 }
    if ($w -lt 40) { $w = 40 }
    $room = $w - 5 - $label.Length - 3
    if ($room -lt 1) { $text = '' }
    elseif ($text.Length -gt $room) { $text = $text.Substring(0, $room - 1) + $SymEll }
    $tail = if ($text) { " $SymStep $text" } else { '' }
    Write-Host -NoNewline "`r  $frame " -ForegroundColor Magenta
    Write-Host -NoNewline (($label + $tail).PadRight($w - 5)) -ForegroundColor Gray
}

function Clear-Spin {
    try { $w = [Console]::WindowWidth } catch { $w = 80 }
    if ($w -lt 40) { $w = 40 }
    Write-Host -NoNewline ("`r" + (' ' * ($w - 1)) + "`r")
}

$BannerArt = @'
   #########                      #####                             ###########                #####
  ###~~~~~###                    ~~###                             ~~###~~~~~###              ~~###
 ###     ~~~  ##### ####  #####  #######    ######  #############   ~###    ~###  ######    #######   #######  ######   #####
~###         ~~### ~###  ###~~  ~~~###~    ###~~###~~###~~###~~###  ~##########  ~~~~~###  ###~~###  ###~~### ###~~### ###~~
~###          ~### ~### ~~#####   ~###    ~### ~### ~### ~### ~###  ~###~~~~~###  ####### ~### ~### ~### ~###~####### ~~#####
~~###     ### ~### ~###  ~~~~###  ~### ###~### ~### ~### ~### ~###  ~###    ~### ###~~### ~### ~### ~### ~###~###~~~   ~~~~###
 ~~#########  ~~######## ######   ~~##### ~~######  #####~### ##### ########### ~~########~~########~~#######~~######  ######
  ~~~~~~~~~    ~~~~~~~~ ~~~~~~     ~~~~~   ~~~~~~  ~~~~~ ~~~ ~~~~~ ~~~~~~~~~~~   ~~~~~~~~  ~~~~~~~~  ~~~~~### ~~~~~~  ~~~~~~
                                                                                                     ### ~###
                                                                                                    ~~######
                                                                                                     ~~~~~~
'@
$BannerArt = $BannerArt.Replace('#', [string][char]0x2588).Replace('~', [string][char]0x2592)

function Enable-VT {
    try {
        Add-Type -Namespace CB -Name Con -MemberDefinition @'
[DllImport("kernel32.dll")] public static extern IntPtr GetStdHandle(int h);
[DllImport("kernel32.dll")] public static extern bool GetConsoleMode(IntPtr h, out int m);
[DllImport("kernel32.dll")] public static extern bool SetConsoleMode(IntPtr h, int m);
'@
        $h = [CB.Con]::GetStdHandle(-11)
        $m = 0
        if ([CB.Con]::GetConsoleMode($h, [ref]$m)) { return [CB.Con]::SetConsoleMode($h, ($m -bor 4)) }
        return $false
    } catch { return $false }
}

function Get-Blurple($t) {
    $stops = @(@(71, 82, 196), @(88, 101, 242), @(124, 140, 248), @(165, 176, 255))
    $t = [math]::Max(0, [math]::Min(1, $t))
    $s = $t * ($stops.Count - 1)
    $i = [math]::Min([int][math]::Floor($s), $stops.Count - 2)
    $f = $s - $i
    $a = $stops[$i]
    $b = $stops[$i + 1]
    return @(
        [int]($a[0] + ($b[0] - $a[0]) * $f),
        [int]($a[1] + ($b[1] - $a[1]) * $f),
        [int]($a[2] + ($b[2] - $a[2]) * $f)
    )
}

function Show-Banner {
    $lines = @($BannerArt -split "`r?`n" | Where-Object { $_.Length -gt 0 })
    $max = ($lines | Measure-Object -Property Length -Maximum).Maximum
    try { $w = [Console]::WindowWidth } catch { $w = 120 }
    if ($w -lt ($max + 1)) {
        Write-Host "$SymOk CustomBadges" -ForegroundColor Magenta
        return
    }
    if (-not (Enable-VT)) {
        for ($row = 0; $row -lt $lines.Count; $row++) {
            $color = if ($row -lt 7) { 'Blue' } else { 'DarkBlue' }
            Write-Host $lines[$row] -ForegroundColor $color
        }
        return
    }
    $esc = [char]27
    $rows = $lines.Count
    for ($row = 0; $row -lt $rows; $row++) {
        $line = $lines[$row].PadRight($max)
        $sb = New-Object System.Text.StringBuilder
        $lastQ = -1
        for ($c = 0; $c -lt $line.Length; $c++) {
            $ch = $line[$c]
            if ($ch -eq ' ') { [void]$sb.Append(' '); continue }
            $t = ($c / $max) * 0.85 + ($row / $rows) * 0.15
            $q = [int][math]::Round($t * 24)
            if ($q -ne $lastQ) {
                $rgb = Get-Blurple ($q / 24)
                [void]$sb.Append("$esc[38;2;$($rgb[0]);$($rgb[1]);$($rgb[2])m")
                $lastQ = $q
            }
            [void]$sb.Append($ch)
        }
        [void]$sb.Append("$esc[0m")
        Write-Host $sb.ToString()
    }
}

function Download-Files($base, $targets) {
    $wc = New-Object System.Net.WebClient
    $wc.Headers.Add('User-Agent', 'CustomBadgesExtc-Installer')
    $sw = [Diagnostics.Stopwatch]::StartNew()
    $total = $targets.Count
    $n = 0
    $i = 0
    try { [Console]::CursorVisible = $false } catch { }
    try {
        foreach ($t in $targets) {
            $n++
            $task = $wc.DownloadFileTaskAsync("$base$($t.Src)", $t.Dest)
            do {
                Draw-Spin $SpinFrames[$i % $SpinFrames.Count] "Downloading ($n/$total)" $t.Src
                $i++
                Start-Sleep -Milliseconds 60
            } while (-not $task.IsCompleted)
            if ($task.IsFaulted -or $task.IsCanceled) {
                Clear-Spin
                $reason = if ($task.Exception) { $task.Exception.GetBaseException().Message } else { 'cancelled' }
                Die "failed to download $($t.Src): $reason"
            }
        }
    } finally {
        try { [Console]::CursorVisible = $true } catch { }
        Clear-Spin
        $wc.Dispose()
    }
    return [math]::Round($sw.Elapsed.TotalSeconds, 1)
}

Write-Host ""
Show-Banner
Write-Host ""
Write-Host "$SymOk CustomBadges extension installer" -ForegroundColor Magenta
Write-Host "  Third-party extension. Client mods are against Discord's ToS, use at your own risk." -ForegroundColor DarkGray

Step "Choose browser"

$browsers = @(
    @{ Key = 'chrome';  Name = 'Chrome';  Url = 'chrome://extensions';  Exes = @("$env:ProgramFiles\Google\Chrome\Application\chrome.exe", "${env:ProgramFiles(x86)}\Google\Chrome\Application\chrome.exe", "$env:LOCALAPPDATA\Google\Chrome\Application\chrome.exe") },
    @{ Key = 'edge';    Name = 'Edge';    Url = 'edge://extensions';    Exes = @("${env:ProgramFiles(x86)}\Microsoft\Edge\Application\msedge.exe", "$env:ProgramFiles\Microsoft\Edge\Application\msedge.exe") },
    @{ Key = 'brave';   Name = 'Brave';   Url = 'brave://extensions';   Exes = @("$env:ProgramFiles\BraveSoftware\Brave-Browser\Application\brave.exe", "${env:ProgramFiles(x86)}\BraveSoftware\Brave-Browser\Application\brave.exe", "$env:LOCALAPPDATA\BraveSoftware\Brave-Browser\Application\brave.exe") },
    @{ Key = 'opera';   Name = 'Opera';   Url = 'opera://extensions';   Exes = @("$env:LOCALAPPDATA\Programs\Opera\opera.exe", "$env:ProgramFiles\Opera\opera.exe") },
    @{ Key = 'vivaldi'; Name = 'Vivaldi'; Url = 'vivaldi://extensions'; Exes = @("$env:LOCALAPPDATA\Vivaldi\Application\vivaldi.exe", "$env:ProgramFiles\Vivaldi\Application\vivaldi.exe") },
    @{ Key = 'firefox'; Name = 'Firefox'; Url = $AmoUrl;                Exes = @() }
)

$choice = $env:CB_BROWSER
if ($choice) {
    $browser = $browsers | Where-Object { $_.Key -eq $choice.ToLower() } | Select-Object -First 1
    if (-not $browser) { Die "Unknown browser '$choice'. Use chrome, edge, brave, opera, vivaldi or firefox." }
} else {
    for ($n = 0; $n -lt $browsers.Count; $n++) { Write-Host "  [$($n + 1)] $($browsers[$n].Name)" }
    $pick = Read-Host "  Select 1-$($browsers.Count)"
    $idx = 0
    if (-not [int]::TryParse($pick, [ref]$idx) -or $idx -lt 1 -or $idx -gt $browsers.Count) { Die "Invalid selection '$pick'." }
    $browser = $browsers[$idx - 1]
}
Ok $browser.Name

if ($browser.Key -eq 'firefox') {
    Step "Firefox"
    Info "Firefox installs from the official add-on page, no files needed"
    try { Start-Process $AmoUrl; Ok "opened $AmoUrl" } catch { Warn "open this page manually: $AmoUrl" }
    Write-Host ""
    Write-Host "$SymOk Done." -ForegroundColor Magenta
    Write-Host "  $SymStep Click Add to Firefox, then reload your Discord tab." -ForegroundColor Gray
    Write-Host ""
    return
}

Step "Extension files"

$dir = $env:CB_DIR
if (-not $dir) { $dir = Join-Path $env:LOCALAPPDATA 'CustomBadgesExtc' }
$dir = $dir.Trim().Trim('"').TrimEnd('\', '/')

$updating = Test-Path -LiteralPath (Join-Path $dir 'manifest.json')
if ($updating) { Info "existing install found, updating in place" }
New-Item -ItemType Directory -Path $dir -Force | Out-Null
Ok $dir

$base = "https://raw.githubusercontent.com/$Owner/$Repo/$Branch/"
$targets = @()
foreach ($f in $Files) { $targets += @{ Src = $f; Dest = (Join-Path $dir (Split-Path $f -Leaf)) } }
$secs = Download-Files $base $targets
Ok "Extension files ($($targets.Count) files, ${secs}s) copied to $dir"

Step "Open extensions page"

$copied = $false
try { Set-Clipboard -Value $dir; $copied = $true } catch { }
if ($copied) { Ok "folder path copied to clipboard" }

try { Start-Process explorer.exe -ArgumentList "`"$dir`""; Ok "opened the extension folder" } catch { Warn "open this folder manually: $dir" }

$exe = $null
foreach ($p in $browser.Exes) {
    if ($p -and (Test-Path -LiteralPath $p)) { $exe = $p; break }
}
if ($exe) {
    Start-Process -FilePath $exe -ArgumentList $browser.Url
    Ok "opened $($browser.Url)"
} else {
    Warn "$($browser.Name) not found. Paste $($browser.Url) into its address bar yourself."
}

Write-Host ""
Write-Host "$SymOk Almost done. Browsers do not allow silent installs, so two clicks are left:" -ForegroundColor Magenta
Write-Host "  $SymStep 1. Turn on Developer mode (switch in the top right of the extensions page)." -ForegroundColor Gray
if ($updating) {
    Write-Host "  $SymStep 2. Click the Reload arrow on the CustomBadges card, then refresh your Discord tab." -ForegroundColor Gray
} else {
    Write-Host "  $SymStep 2. Click Load unpacked and pick the folder above (its path is on your clipboard)." -ForegroundColor Gray
    Write-Host "  $SymStep 3. Pin the CustomBadges icon, then refresh your Discord tab." -ForegroundColor Gray
}
Write-Host ""
