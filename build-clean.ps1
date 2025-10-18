# Build Clean Script - Handles OneDrive locked files
Write-Host "🧹 Cleaning build artifacts..." -ForegroundColor Cyan

# Stop all Node processes
Write-Host "Stopping Node.js processes..."
Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force
Start-Sleep -Seconds 2

# Try to remove .next folder
if (Test-Path ".next") {
    Write-Host "Removing .next folder..."
    
    # Method 1: Try direct removal
    try {
        Remove-Item -Path ".next" -Recurse -Force -ErrorAction Stop
        Write-Host "✅ .next folder removed successfully" -ForegroundColor Green
    }
    catch {
        Write-Host "⚠️  Direct removal failed, trying alternative method..." -ForegroundColor Yellow
        
        # Method 2: Remove files first, then folder
        try {
            Get-ChildItem -Path ".next" -Recurse -File | Remove-Item -Force -ErrorAction SilentlyContinue
            Get-ChildItem -Path ".next" -Recurse -Directory | Remove-Item -Force -Recurse -ErrorAction SilentlyContinue
            Remove-Item -Path ".next" -Force -ErrorAction SilentlyContinue
            Write-Host "✅ .next folder removed (alternative method)" -ForegroundColor Green
        }
        catch {
            Write-Host "⚠️  Some files may be locked by OneDrive. Proceeding anyway..." -ForegroundColor Yellow
        }
    }
}

Write-Host ""
Write-Host "🔨 Starting build..." -ForegroundColor Cyan
npm run build

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ Build completed successfully!" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "❌ Build failed with exit code $LASTEXITCODE" -ForegroundColor Red
    Write-Host ""
    Write-Host "💡 Tip: If you see EPERM errors, your project is in OneDrive." -ForegroundColor Yellow
    Write-Host "   Consider moving it to C:\Projects or C:\Dev to avoid sync issues." -ForegroundColor Yellow
}
