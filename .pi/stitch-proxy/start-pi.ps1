# Avvia il proxy Stitch MCP (se non già attivo) e poi pi, nella cartella del progetto.
# Equivalente di ~/.config/opencode/stitch-proxy/start-opencode.ps1, adattato a pi.

$proxyPort = 9020
$proxyScript = "$PSScriptRoot\stitch-proxy.mjs"
$projectDir = Split-Path (Split-Path $PSScriptRoot -Parent) -Parent   # cartella del progetto (genitore di .pi)

# Avvia il proxy solo se la porta non è già in ascolto
$portInUse = Get-NetTCPConnection -LocalPort $proxyPort -ErrorAction SilentlyContinue
if (-not $portInUse) {
    Write-Host "Avvio del proxy Stitch MCP sulla porta $proxyPort..."
    Start-Process -WindowStyle Hidden -FilePath "node" -ArgumentList "`"$proxyScript`""
    Start-Sleep -Seconds 1
    Write-Host "Proxy avviato."
} else {
    Write-Host "Proxy Stitch già attivo sulla porta $proxyPort."
}

# Verifica che la chiave Stitch sia presente nell'ambiente (Utente o processo)
$stitchKey = [Environment]::GetEnvironmentVariable("STITCH_API_KEY", "User")
if (-not $stitchKey) { $stitchKey = $env:STITCH_API_KEY }
if (-not $stitchKey) {
    Write-Warning "STITCH_API_KEY non trovata: imposta la chiave prima di avviare pi."
    Write-Warning "  [Environment]::SetEnvironmentVariable('STITCH_API_KEY','<chiave>','User')"
}

# Lancia pi nella cartella del progetto, riprendendo l'ultima sessione (-c)
Set-Location $projectDir
pi -c
