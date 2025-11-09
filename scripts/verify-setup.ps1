# Setup Verification Script for Windows
# Checks if your system is properly configured

param(
    [Parameter(Mandatory=$true)]
    [string]$ConvexUrl
)

Write-Host "🔍 Verifying System Setup" -ForegroundColor Blue
Write-Host ""
Write-Host "Checking: $ConvexUrl" -ForegroundColor Blue
Write-Host ""

# Check health endpoint
Write-Host "1️⃣  Checking API Health..." -ForegroundColor White

try {
    $health = Invoke-RestMethod -Uri "$ConvexUrl/api/health" -Method Get
    Write-Host "✅ API is reachable" -ForegroundColor Green
    Write-Host ""
    $health | ConvertTo-Json -Depth 10
    Write-Host ""
    
    # Check if OpenRouter is configured
    if (-not $health.environment.openRouterConfigured) {
        Write-Host "❌ OPENROUTER_API_KEY is not configured!" -ForegroundColor Red
        Write-Host ""
        Write-Host "📝 Setup Instructions:" -ForegroundColor Yellow
        Write-Host "1. Go to: https://openrouter.ai/"
        Write-Host "2. Sign up/Login (free tier available)"
        Write-Host "3. Get your API key (looks like: sk-or-v1-...)"
        Write-Host "4. Go to your Convex Dashboard"
        Write-Host "5. Navigate to: Settings → Environment Variables"
        Write-Host "6. Click 'Add Environment Variable'"
        Write-Host "7. Name: OPENROUTER_API_KEY"
        Write-Host "8. Value: sk-or-v1-YOUR_KEY_HERE"
        Write-Host "9. Click 'Save'"
        Write-Host ""
        Write-Host "Then deploy:" -ForegroundColor Blue
        Write-Host "  npx convex deploy"
        Write-Host ""
        exit 1
    } else {
        Write-Host "✅ OPENROUTER_API_KEY is configured" -ForegroundColor Green
    }
    
} catch {
    Write-Host "❌ Cannot reach API" -ForegroundColor Red
    Write-Host "Error: $_"
    Write-Host ""
    Write-Host "Make sure your Convex deployment is running:"
    Write-Host "  npx convex dev"
    exit 1
}

Write-Host ""
Write-Host "✅ System is ready!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Blue
Write-Host "1. Start webcam monitor:"
Write-Host "   python scripts/livestream-monitor.py \"  -ForegroundColor Yellow
Write-Host "     --source 0 \"  -ForegroundColor Yellow
Write-Host "     --camera-id YOUR_CAMERA_ID \"  -ForegroundColor Yellow
Write-Host "     --api-url $ConvexUrl \"  -ForegroundColor Yellow
Write-Host "     --interval 10"  -ForegroundColor Yellow
Write-Host ""
Write-Host "2. Watch the dashboard for agent activity!"

