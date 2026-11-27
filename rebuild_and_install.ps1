Write-Host "=========================================="
Write-Host "PINUM APP - REBUILD & INSTALL (ZERO UPDATES / PERMANENT UI)"
Write-Host "=========================================="

Write-Host "`n1. Exporting clean JS bundle (without expo-updates)..."
npx expo export:embed --platform android --dev false --reset-cache --entry-file node_modules/expo/AppEntry.js --bundle-output new_bundle.js

if (-not (Test-Path 'new_bundle.js')) {
    Write-Error "Failed to generate new_bundle.js"
    exit 1
}

Write-Host "`n2. Compiling Hermes bytecode..."
& "node_modules\react-native\sdks\hermesc\win64-bin\hermesc.exe" -emit-binary -out index.android.bundle.hbc new_bundle.js

if (-not (Test-Path 'index.android.bundle.hbc')) {
    Write-Error "Failed to generate index.android.bundle.hbc"
    exit 1
}

Write-Host "`n3. Extracting and patching AndroidManifest to permanently kill EAS updates..."
[System.Reflection.Assembly]::LoadWithPartialName('System.IO.Compression') | Out-Null
[System.Reflection.Assembly]::LoadWithPartialName('System.IO.Compression.FileSystem') | Out-Null

$srcApk = if (Test-Path 'pinumapp_local.apk') { 'pinumapp_local.apk' } else { 'pinumapp.apk' }
$zip = [System.IO.Compression.ZipFile]::OpenRead((Resolve-Path $srcApk).Path)
$entry = $zip.GetEntry('AndroidManifest.xml')
$stream = $entry.Open()
$manifestBytes = New-Object byte[] $entry.Length
$stream.Read($manifestBytes, 0, $manifestBytes.Length) | Out-Null
$stream.Close()
$zip.Dispose()

function Replace-Utf16([byte[]]$data, [string]$oldS, [string]$newS) {
    $oB = [System.Text.Encoding]::Unicode.GetBytes($oldS)
    $nB = [System.Text.Encoding]::Unicode.GetBytes($newS)
    for ($i = 0; $i -le $data.Length - $oB.Length; $i++) {
        $m = $true
        for ($j = 0; $j -lt $oB.Length; $j++) {
            if ($data[$i + $j] -ne $oB[$j]) { $m = $false; break }
        }
        if ($m) {
            Write-Host "  Patcher: Replacing '$oldS' with '$newS' at offset $i"
            for ($j = 0; $j -lt $nB.Length; $j++) {
                $data[$i + $j] = $nB[$j]
            }
        }
    }
}

# Neutralize EAS update strings (exact string lengths preserved)
Replace-Utf16 $manifestBytes 'expo.modules.updates.ENABLED' 'expo.modules.updates.DISABLE'
Replace-Utf16 $manifestBytes 'ALWAYS' 'NEVER_'
Replace-Utf16 $manifestBytes 'https://u.expo.dev/b0a6ec06-37a1-4fa4-a72f-a83dddf59d57' 'http://127.0.0.1:0/00000000-0000-0000-0000-000000000000'
Replace-Utf16 $manifestBytes '1.0.0' '1.0.1'

# Set versionCode to 3
$manifestBytes[8140] = 0x03

[System.IO.File]::WriteAllBytes('AndroidManifest.patched.bin', $manifestBytes)

Write-Host "`n4. Packaging updated APK with new bundle and patched manifest..."
$tempZip = 'pinumapp_temp.zip'
Copy-Item $srcApk $tempZip -Force

$mode = [System.IO.Compression.ZipArchiveMode]::Update
$zip = [System.IO.Compression.ZipFile]::Open((Resolve-Path $tempZip).Path, $mode)

$toRemove = @()
foreach ($entry in $zip.Entries) {
    if ($entry.FullName -match '^META-INF/.*\.(SF|RSA|DSA|EC)$' -or $entry.FullName -eq 'META-INF/MANIFEST.MF' -or $entry.FullName -eq 'assets/index.android.bundle' -or $entry.FullName -eq 'AndroidManifest.xml') {
        $toRemove += $entry
    }
}
Write-Host "  Removing $($toRemove.Count) old signatures/manifest/bundle..."
foreach ($entry in $toRemove) {
    $entry.Delete()
}

[System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile($zip, (Resolve-Path 'index.android.bundle.hbc').Path, 'assets/index.android.bundle')
[System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile($zip, (Resolve-Path 'AndroidManifest.patched.bin').Path, 'AndroidManifest.xml')
$zip.Dispose()

Write-Host "`n5. Running zipalign..."
$zipalign = 'C:\Users\defaultuser0.DESKTOP-P7AKPL3\AppData\Local\Android\Sdk\build-tools\36.1.0\zipalign.exe'
& $zipalign -f -p 4 $tempZip pinumapp_aligned.apk

Write-Host "`n6. Running apksigner..."
$apksigner = 'C:\Users\defaultuser0.DESKTOP-P7AKPL3\AppData\Local\Android\Sdk\build-tools\36.1.0\apksigner.bat'
& $apksigner sign --ks android/app/debug.keystore --ks-pass pass:android --ks-key-alias androiddebugkey --key-pass pass:android --out pinumapp.apk pinumapp_aligned.apk

Write-Host "`n7. Verifying APK signature & badging..."
& $apksigner verify pinumapp.apk
& 'C:\Users\defaultuser0.DESKTOP-P7AKPL3\AppData\Local\Android\Sdk\build-tools\36.1.0\aapt2.exe' dump badging pinumapp.apk | Select-Object -First 2

Remove-Item $tempZip, pinumapp_aligned.apk, AndroidManifest.patched.bin -Force -ErrorAction SilentlyContinue

Write-Host "`n8. Purging old app from emulator and installing fresh build..."
adb uninstall com.abrar.pinumapp
adb install pinumapp.apk
Start-Sleep -Seconds 1
adb shell am start -n com.abrar.pinumapp/.MainActivity
Start-Sleep -Seconds 4
Write-Host "`nSUCCESS! App is running with permanent updated UI and zero updates rollback vector."
