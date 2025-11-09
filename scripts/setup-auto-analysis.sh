#!/bin/bash

# Quick Setup Script for Automatic Video Analysis
# This helps you enable auto-analysis for your cameras

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}🎥 Automatic Video Analysis Setup${NC}"
echo ""

# Check for required arguments
if [ "$#" -lt 2 ]; then
    echo -e "${YELLOW}Usage: ./setup-auto-analysis.sh <camera-id> <convex-url> [interval-seconds]${NC}"
    echo ""
    echo "Example:"
    echo "  ./setup-auto-analysis.sh k17abc123... https://accurate-marlin-326.convex.site 30"
    echo ""
    exit 1
fi

CAMERA_ID="$1"
CONVEX_URL="$2"
INTERVAL="${3:-30}"

echo -e "${GREEN}Configuration:${NC}"
echo "  Camera ID: $CAMERA_ID"
echo "  Convex URL: $CONVEX_URL"
echo "  Capture Interval: ${INTERVAL}s"
echo ""

echo -e "${BLUE}📝 Setup Steps:${NC}"
echo ""

echo "1️⃣  Enable Auto-Analysis in Convex Dashboard:"
echo "   - Open: $CONVEX_URL"
echo "   - Go to: Data → cameraFeeds table"
echo "   - Find camera: $CAMERA_ID"
echo "   - Set fields:"
echo "     • autoAnalyze: true"
echo "     • analyzeIntervalSeconds: $INTERVAL"
echo "     • isActive: true"
echo ""

echo "2️⃣  Deploy Your Convex Functions:"
echo "   cd to your project directory and run:"
echo "   ${YELLOW}npx convex deploy${NC}"
echo ""

echo "3️⃣  Start Automatic Frame Capture:"
echo ""
echo "   ${GREEN}Option A: From Webcam (for testing)${NC}"
echo "   python scripts/livestream-monitor.py \\"
echo "     --source 0 \\"
echo "     --camera-id \"$CAMERA_ID\" \\"
echo "     --api-url \"$CONVEX_URL\" \\"
echo "     --interval $INTERVAL"
echo ""

echo "   ${GREEN}Option B: From RTSP Stream (production)${NC}"
echo "   python scripts/livestream-monitor.py \\"
echo "     --source \"rtsp://camera-ip:554/stream\" \\"
echo "     --camera-id \"$CAMERA_ID\" \\"
echo "     --api-url \"$CONVEX_URL\" \\"
echo "     --interval $INTERVAL"
echo ""

echo "   ${GREEN}Option C: From Video File (demo)${NC}"
echo "   python scripts/livestream-monitor.py \\"
echo "     --source \"path/to/video.mp4\" \\"
echo "     --camera-id \"$CAMERA_ID\" \\"
echo "     --api-url \"$CONVEX_URL\" \\"
echo "     --interval $INTERVAL"
echo ""

echo "4️⃣  Verify It's Working:"
echo "   - Open Convex Dashboard → Data → cameraFeeds"
echo "   - Check 'lastAnalyzedAt' updates every ${INTERVAL}s"
echo "   - Check 'visionAnalysis' table for new entries"
echo "   - Check 'Agent Activity' panel for ReAct workflow"
echo ""

echo -e "${GREEN}✅ Setup complete!${NC}"
echo ""
echo -e "${YELLOW}💡 Tips:${NC}"
echo "  - Use interval=10 for high-frequency monitoring"
echo "  - Use interval=60 for cost-effective monitoring"
echo "  - Priority=10 for critical safety monitoring"
echo "  - Monitor cache stats: curl \"$CONVEX_URL/api/cache-stats\""
echo ""

echo -e "${BLUE}📚 For more details, see: AUTO_VIDEO_ANALYSIS.md${NC}"

