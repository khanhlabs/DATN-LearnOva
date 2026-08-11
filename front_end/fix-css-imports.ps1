param([switch]$Apply)

$root = 'd:\CODING\DATN\DATN-LearnOva\front_end\src'

# side-effect import, own line: import "./Foo"; | import '../bar/Foo'
$rx = [regex]'(?m)^(?<pre>[ \t]*import[ \t]+)(?<q>["''])(?<spec>\.{1,2}/[^"'']+)\k<q>(?<post>[ \t]*;?[ \t]*)(?=\r?$)'

$fix   = New-Object System.Collections.Generic.List[string]
$ambig = New-Object System.Collections.Generic.List[string]
$skip  = New-Object System.Collections.Generic.List[string]
$filesChanged = 0

Get-ChildItem -LiteralPath $root -Recurse -Include *.jsx, *.js | ForEach-Object {
    $f   = $_
    $raw = [System.IO.File]::ReadAllText($f.FullName)
    $rel = $f.FullName.Substring($root.Length + 1)
    $fileDirty = $false

    $new = $rx.Replace($raw, {
        param($m)
        $spec = $m.Groups['spec'].Value

        # already has an extension -> untouched
        if ([System.IO.Path]::GetExtension($spec) -ne '') { return $m.Value }

        $base = [System.IO.Path]::GetFullPath(
            [System.IO.Path]::Combine($f.DirectoryName, ($spec -replace '/', '\')))

        if (-not [System.IO.File]::Exists($base + '.css')) {
            $script:skip.Add("$rel : $spec")
            return $m.Value
        }

        # sibling module with the same basename (and it is not this file itself) -> flag
        $sib = @('.jsx', '.js') | Where-Object {
            [System.IO.File]::Exists($base + $_) -and ($base + $_) -ne $f.FullName }
        if ($sib) { $script:ambig.Add("$rel : $spec  (also has $($sib -join ','))") }

        $script:fix.Add("$rel : $spec -> $spec.css")
        $script:fileDirty = $true
        "$($m.Groups['pre'].Value)$($m.Groups['q'].Value)$spec.css$($m.Groups['q'].Value)$($m.Groups['post'].Value)"
    })

    if ($Apply -and $fileDirty) {
        # UTF-8 without BOM, same encoding as the rest of the repo
        [System.IO.File]::WriteAllText($f.FullName, $new, (New-Object System.Text.UTF8Encoding $false))
        $script:filesChanged++
    }
}

"MODE            : $(if ($Apply) { 'APPLY' } else { 'DRY-RUN' })"
"imports fixed   : $($fix.Count)"
"files changed   : $filesChanged"
"needs eyeball   : $($ambig.Count)"
$ambig | ForEach-Object { "   $_" }
"left alone      : $($skip.Count)  (no matching .css on disk)"
$skip | ForEach-Object { "   $_" }
