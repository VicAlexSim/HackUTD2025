#!/usr/bin/env python3
"""
Test Frame Processing with a Single Image

This is a simple test script that doesn't require ffmpeg or video processing.
Just send a single image to test the frame processing system.

Requirements:
    pip install requests pillow

Usage:
    # With an existing image
    python test-single-frame.py --image photo.jpg --camera-id <id> --api-url <url>
    
    # Generate a test image automatically
    python test-single-frame.py --camera-id <id> --api-url <url>
"""

import base64
import requests
import argparse
import sys
from datetime import datetime

def create_test_image():
    """Create a simple test image using PIL"""
    try:
        from PIL import Image, ImageDraw, ImageFont
    except ImportError:
        print("❌ Pillow not installed. Run: pip install pillow")
        sys.exit(1)
    
    # Create a 640x480 image with blue background
    img = Image.new('RGB', (640, 480), color=(173, 216, 230))
    
    # Add text
    draw = ImageDraw.Draw(img)
    
    # Try to use a default font
    try:
        font = ImageFont.truetype("arial.ttf", 36)
    except:
        font = ImageFont.load_default()
    
    # Draw text
    text_lines = [
        "Data Center Test Frame",
        datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "Frame Processing System",
    ]
    
    y_offset = 180
    for line in text_lines:
        # Get bounding box to center text
        bbox = draw.textbbox((0, 0), line, font=font)
        text_width = bbox[2] - bbox[0]
        x = (640 - text_width) // 2
        
        draw.text((x, y_offset), line, fill=(0, 0, 0), font=font)
        y_offset += 60
    
    # Save to temporary file
    temp_path = "test_frame_temp.jpg"
    img.save(temp_path, "JPEG")
    print(f"✅ Created test image: {temp_path}")
    
    return temp_path

def send_frame(image_path, camera_id, api_url, priority=5):
    """Send a single frame to the API"""
    
    # Read and encode image
    try:
        with open(image_path, 'rb') as f:
            image_data = f.read()
    except FileNotFoundError:
        print(f"❌ Error: Image not found: {image_path}")
        sys.exit(1)
    
    image_b64 = base64.b64encode(image_data).decode('utf-8')
    
    print(f"\n📤 Sending frame to API...")
    print(f"   Camera ID: {camera_id}")
    print(f"   API URL: {api_url}")
    print(f"   Priority: {priority}")
    print(f"   Image size: {len(image_data) / 1024:.1f} KB")
    
    # Send to API
    payload = {
        'cameraId': camera_id,
        'frameData': image_b64,
        'priority': priority
    }
    
    try:
        response = requests.post(f"{api_url}/api/analyze-frame", json=payload, timeout=30)
        response.raise_for_status()
        result = response.json()
        
        print("\n✅ Response received:")
        print(f"   {result}")
        
        # Parse response
        if result.get('cached'):
            print("\n💾 Frame was found in cache! (instant result)")
            print(f"   Analysis ID: {result.get('analysisId')}")
        elif result.get('queued'):
            print("\n📤 Frame queued for batch processing")
            print(f"   Queue ID: {result.get('queueId')}")
            print(f"   Status: {result.get('message')}")
        elif result.get('skipped'):
            print("\n⏭️  Frame skipped (too similar to recent frames)")
        
        return result
        
    except requests.exceptions.RequestException as e:
        print(f"\n❌ Error sending frame: {e}")
        sys.exit(1)

def check_cache_stats(api_url):
    """Get cache statistics"""
    print("\n📊 Fetching cache statistics...")
    
    try:
        response = requests.get(f"{api_url}/api/cache-stats", timeout=10)
        response.raise_for_status()
        stats = response.json()
        
        print("\n📈 Cache Statistics:")
        print(f"   Cache Entries: {stats['cache']['totalEntries']}")
        print(f"   Cache Hits: {stats['cache']['totalHits']}")
        print(f"   Hit Rate: {stats['cache']['hitRate']}")
        print(f"\n   Queue Pending: {stats['queue']['pending']}")
        print(f"   Queue Processing: {stats['queue']['processing']}")
        print(f"   Queue Completed: {stats['queue']['completed']}")
        print(f"   Queue Failed: {stats['queue']['failed']}")
        
        return stats
        
    except requests.exceptions.RequestException as e:
        print(f"   ⚠️  Could not fetch stats: {e}")
        return None

def main():
    parser = argparse.ArgumentParser(
        description="Test frame processing with a single image"
    )
    
    parser.add_argument('--image', help='Path to image file (optional, will generate test image if not provided)')
    parser.add_argument('--camera-id', required=True, help='Convex camera feed ID')
    parser.add_argument('--api-url', required=True, help='Convex deployment URL')
    parser.add_argument('--priority', type=int, default=5, help='Frame priority (1-10, default: 5)')
    parser.add_argument('--stats', action='store_true', help='Show cache stats after sending')
    
    args = parser.parse_args()
    
    print("🚀 Frame Processing Test")
    print("=" * 50)
    
    # Get or create image
    if args.image:
        image_path = args.image
        print(f"📷 Using image: {image_path}")
    else:
        print("📷 No image provided, creating test image...")
        image_path = create_test_image()
    
    # Send frame
    result = send_frame(image_path, args.camera_id, args.api_url, args.priority)
    
    # Get stats if requested
    if args.stats:
        check_cache_stats(args.api_url)
    
    print("\n✅ Test complete!")
    print("\n💡 Next steps:")
    print("   1. Check your Convex dashboard for analysis results")
    print("   2. View Agent Activity panel for ReAct workflow logs")
    print("   3. Look for auto-generated tickets if issues were detected")
    print("\nTo test with multiple frames from a video:")
    print(f"   python extract-frames.py --video <path> --camera-id {args.camera_id} --api-url {args.api_url}")

if __name__ == '__main__':
    main()

