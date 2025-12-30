# Auto-Backup Script for ADA Scanner
# Runs indefinitely. Checks for changes, commits, and pushes to 'dev' every 30 minutes.

$intervalSeconds = 1800 # 30 minutes

Write-Host "🚀 Auto-Backup Agent Started..." -ForegroundColor Green
Write-Host "Protected Branch: dev" -ForegroundColor Cyan
Write-Host "Interval: $intervalSeconds seconds" -ForegroundColor Cyan

while ($true) {
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm"
    
    # Check for changes
    $status = git status --porcelain
    if ($status) {
        Write-Host "[$timestamp] Changes detected. Backing up..." -ForegroundColor Yellow
        
        # Add all changes
        git add .
        
        # Commit
        git commit -m "Auto-save: $timestamp" | Out-Null
        
        # Push to dev
        # Note: Will fail safely if no remote is configured yet
        try {
            git push origin dev
            Write-Host "[$timestamp] ✅ Successfully pushed to origin/dev" -ForegroundColor Green
        }
        catch {
            Write-Host "[$timestamp] ⚠️  Commit created, but push failed (No remote configured?)" -ForegroundColor Red
        }
    }
    else {
        Write-Host "[$timestamp] No changes detected. Skipping backup." -ForegroundColor Gray
    }

    # Wait for next cycle
    Start-Sleep -Seconds $intervalSeconds
}
