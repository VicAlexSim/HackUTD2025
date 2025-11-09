#!/bin/bash

# Setup Verification Script
# Checks if your system is properly configured

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔍 Verifying System Setup${NC}"
echo ""

if [ "$#" -lt 1 ]; then
    echo -e "${YELLOW}Usage: ./verify-setup.sh <convex-url>${NC}"
    echo ""
    echo "Example:"
    echo "  ./verify-setup.sh https://accurate-marlin-326.convex.site"
    echo ""
    exit 1
fi

CONVEX_URL="$1"

echo -e "${BLUE}Checking: $CONVEX_URL${NC}"
echo ""

# Check health endpoint
echo "1️⃣  Checking API Health..."
HEALTH=$(curl -s "$CONVEX_URL/api/health")

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ API is reachable${NC}"
    echo ""
    echo "$HEALTH" | python -m json.tool 2>/dev/null || echo "$HEALTH"
    echo ""
    
    # Check if OpenRouter is configured
    if echo "$HEALTH" | grep -q "OPENROUTER_API_KEY not set"; then
        echo -e "${RED}❌ OPENROUTER_API_KEY is not configured!${NC}"
        echo ""
        echo -e "${YELLOW}📝 Setup Instructions:${NC}"
        echo "1. Go to: https://openrouter.ai/"
        echo "2. Sign up/Login (free tier available)"
        echo "3. Get your API key"
        echo "4. Go to your Convex Dashboard"
        echo "5. Navigate to: Settings → Environment Variables"
        echo "6. Add: OPENROUTER_API_KEY = sk-or-v1-YOUR_KEY_HERE"
        echo "7. Click 'Save'"
        echo ""
        echo -e "${BLUE}Then run: npx convex deploy${NC}"
        echo ""
        exit 1
    else
        echo -e "${GREEN}✅ OPENROUTER_API_KEY is configured${NC}"
    fi
else
    echo -e "${RED}❌ Cannot reach API${NC}"
    echo "Make sure your Convex deployment is running:"
    echo "  npx convex dev"
    exit 1
fi

echo ""
echo -e "${GREEN}✅ System is ready!${NC}"
echo ""
echo -e "${BLUE}Next steps:${NC}"
echo "1. Start webcam monitor:"
echo "   ${YELLOW}python scripts/livestream-monitor.py \\${NC}"
echo "   ${YELLOW}  --source 0 \\${NC}"
echo "   ${YELLOW}  --camera-id YOUR_CAMERA_ID \\${NC}"
echo "   ${YELLOW}  --api-url $CONVEX_URL \\${NC}"
echo "   ${YELLOW}  --interval 10${NC}"
echo ""
echo "2. Watch the dashboard for agent activity!"

