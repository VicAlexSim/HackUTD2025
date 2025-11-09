#!/bin/bash

# Demo Test Script for Frame Processing
# This script tests the frame processing system with a sample image

set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Frame Processing Demo Test${NC}"
echo ""

# Check for required arguments
if [ "$#" -lt 2 ]; then
    echo -e "${RED}❌ Error: Missing required arguments${NC}"
    echo ""
    echo "Usage: ./demo-test.sh <camera-id> <api-url> [image-path]"
    echo ""
    echo "Example:"
    echo "  ./demo-test.sh k17abc123... https://accurate-marlin-326.convex.site test-image.jpg"
    echo ""
    echo "If no image is provided, a test pattern will be generated."
    exit 1
fi

CAMERA_ID="$1"
API_URL="$2"
IMAGE_PATH="${3:-}"

echo -e "${GREEN}📝 Configuration:${NC}"
echo "  Camera ID: $CAMERA_ID"
echo "  API URL: $API_URL"
echo ""

# If no image provided, create a test pattern
if [ -z "$IMAGE_PATH" ]; then
    echo -e "${YELLOW}⚠️  No image provided. Creating test pattern...${NC}"
    
    # Check if ImageMagick is installed
    if ! command -v convert &> /dev/null; then
        echo -e "${RED}❌ ImageMagick not found. Please install it:${NC}"
        echo "  macOS: brew install imagemagick"
        echo "  Ubuntu: apt install imagemagick"
        echo ""
        echo "Or provide an image path: ./demo-test.sh $CAMERA_ID $API_URL path/to/image.jpg"
        exit 1
    fi
    
    IMAGE_PATH="/tmp/test-pattern-$$.jpg"
    convert -size 640x480 -gravity center \
        -background lightblue \
        -fill black \
        -pointsize 48 \
        label:"Data Center\nTest Frame\n$(date +%H:%M:%S)" \
        "$IMAGE_PATH"
    
    echo -e "${GREEN}✅ Test pattern created: $IMAGE_PATH${NC}"
fi

# Check if image exists
if [ ! -f "$IMAGE_PATH" ]; then
    echo -e "${RED}❌ Error: Image not found: $IMAGE_PATH${NC}"
    exit 1
fi

echo ""
echo -e "${BLUE}📤 Sending frame to API...${NC}"

# Convert image to base64
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    IMAGE_B64=$(base64 -i "$IMAGE_PATH")
else
    # Linux
    IMAGE_B64=$(base64 -w 0 "$IMAGE_PATH")
fi

# Send to API
RESPONSE=$(curl -s -X POST "${API_URL}/api/analyze-frame" \
    -H "Content-Type: application/json" \
    -d "{
        \"cameraId\": \"${CAMERA_ID}\",
        \"frameData\": \"${IMAGE_B64}\",
        \"priority\": 10
    }")

echo ""
echo -e "${GREEN}✅ Response received:${NC}"
echo "$RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$RESPONSE"

# Parse response
if echo "$RESPONSE" | grep -q '"cached":true'; then
    echo ""
    echo -e "${GREEN}💾 Frame was found in cache! (instant result)${NC}"
elif echo "$RESPONSE" | grep -q '"queued":true'; then
    echo ""
    echo -e "${BLUE}📤 Frame queued for batch processing${NC}"
    
    # Get queue status
    echo ""
    echo -e "${BLUE}📊 Checking queue status...${NC}"
    STATS=$(curl -s "${API_URL}/api/cache-stats")
    echo "$STATS" | python3 -m json.tool 2>/dev/null || echo "$STATS"
elif echo "$RESPONSE" | grep -q '"skipped":true'; then
    echo ""
    echo -e "${YELLOW}⏭️  Frame skipped (too similar to recent frames)${NC}"
fi

# Cleanup temp file if created
if [ -z "$3" ]; then
    rm -f "$IMAGE_PATH"
fi

echo ""
echo -e "${GREEN}✅ Test complete!${NC}"
echo ""
echo -e "${BLUE}Next steps:${NC}"
echo "  1. Check your Convex dashboard for analysis results"
echo "  2. View Agent Activity panel for ReAct workflow logs"
echo "  3. Look for auto-generated tickets if issues were detected"
echo ""
echo "To process a full video:"
echo -e "  ${YELLOW}python scripts/extract-frames.py --youtube <url> --camera-id $CAMERA_ID --api-url $API_URL${NC}"

