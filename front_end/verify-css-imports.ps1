$root = 'd:\CODING\DATN\DATN-LearnOva\front_end\src'
$rx = [regex]'import\s+["''](?<spec>\.{1,2}/[^"'']*\.css)["'']'

$missing = New-Object System.Collections.Generic.List[string]
$ok = 0

Get-ChildItem -LiteralPath $root -Recurse -Include *.jsx, *.js | ForEach-Object {
    $f = $_
    $raw = [System.IO.File]::ReadAllText($f.FullName)
    foreach ($m in $rx.Matches($raw)) {
        $spec = $m.Groups['spec'].Value
        $p = [System.IO.Path]::GetFullPath(
            [System.IO.Path]::Combine($f.DirectoryName, ($spec -replace '/', '\')))
        if ([System.IO.File]::Exists($p)) {
            $ok++
        } else {
            $missing.Add("$($f.FullName.Substring($root.Length+1)) -> $spec")
        }
    }
}

"resolved OK : $ok"
"BROKEN      : $($missing.Count)"
$missing | ForEach-Object { "   $_" }
