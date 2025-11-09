#!/usr/bin/env python3
"""
Continuous Livestream Monitor for Technician Cameras

This script continuously extracts frames from a live video stream
and sends them to the frame processing API at a configurable interval.

WARNING: This will continuously use API credits. Use with caution!

Requirements:
    pip install opencv-python requests

Usage:
    # Monitor a webcam
    python livestream-monitor.py \
      --source 0 \
      --camera-id <id> \
      --api-url <url> \
      --interval 5 \
      --priority 5

    # Monitor an RTSP stream
    python livestream-monitor.py \
      --source rtsp://camera-ip:554/stream \
      --camera-id <id> \
      --api-url <url> \
      --interval 10

    # Monitor YouTube live stream (requires yt-dlp + ffmpeg)
    python livestream-monitor.py \
      --source "https://youtube.com/watch?v=LIVE_VIDEO_ID" \
      --camera-id <id> \
      --api-url <url> \
      --interval 5
"""

import cv2
import base64
import requests
import argparse
import time
import sys
from datetime import datetime

class LivestreamMonitor:
    def __init__(self, source, camera_id, api_url, interval=5, priority=5):
        """
        Initialize livestream monitor
        
        Args:
            source: Video source (0 for webcam, URL for stream)
            camera_id: Convex camera ID
            api_url: Convex API URL
            interval: Seconds between frame captures
            priority: Frame priority (1-10)
        """
        self.source = source
        self.camera_id = camera_id
        self.api_url = api_url.rstrip('/') + '/api/analyze-frame'
        self.interval = interval
        self.priority = priority
        self.running = False
        self.frames_sent = 0
        self.frames_cached = 0
        self.frames_skipped = 0
        self.last_sent_time = 0
        
    def start(self):
        """Start monitoring the livestream"""
        print("🎥 Starting livestream monitor...")
        print(f"   Source: {self.source}")
        print(f"   Camera ID: {self.camera_id}")
        print(f"   Interval: {self.interval}s")
        print(f"   Priority: {self.priority}")
        print("\n⚠️  WARNING: This will continuously use API credits!")
        print("   Press Ctrl+C to stop\n")
        
        # Open video source
        if isinstance(self.source, str) and self.source.startswith(('http', 'rtsp')):
            # URL source
            cap = cv2.VideoCapture(self.source)
        else:
            # Try as webcam index
            try:
                source_idx = int(self.source)
                cap = cv2.VideoCapture(source_idx)
            except ValueError:
                # File path
                cap = cv2.VideoCapture(self.source)
        
        if not cap.isOpened():
            print(f"❌ Error: Could not open video source: {self.source}")
            sys.exit(1)
        
        print("✅ Video source opened successfully\n")
        
        self.running = True
        frame_count = 0
        
        try:
            while self.running:
                ret, frame = cap.read()
                
                if not ret:
                    print("⚠️  Warning: Failed to read frame, retrying...")
                    time.sleep(1)
                    continue
                
                frame_count += 1
                current_time = time.time()
                
                # Check if it's time to send a frame
                if current_time - self.last_sent_time >= self.interval:
                    self.send_frame(frame, frame_count)
                    self.last_sent_time = current_time
                
                # Small sleep to prevent CPU overuse
                time.sleep(0.1)
                
        except KeyboardInterrupt:
            print("\n\n⏹️  Stopping monitor...")
        finally:
            cap.release()
            self.print_stats()
    
    def send_frame(self, frame, frame_number):
        """Send a single frame to the API"""
        # Encode frame to JPEG
        _, buffer = cv2.imencode('.jpg', frame, [cv2.IMWRITE_JPEG_QUALITY, 85])
        frame_b64 = base64.b64encode(buffer).decode('utf-8')
        
        # Send to API
        payload = {
            'cameraId': self.camera_id,
            'frameData': frame_b64,
            'priority': self.priority
        }
        
        try:
            response = requests.post(self.api_url, json=payload, timeout=30)
            response.raise_for_status()
            result = response.json()
            
            # Track results
            timestamp = datetime.now().strftime("%H:%M:%S")
            
            if result.get('cached'):
                self.frames_cached += 1
                status = "💾 CACHED"
            elif result.get('skipped'):
                self.frames_skipped += 1
                status = "⏭️  SKIPPED"
            elif result.get('queued'):
                self.frames_sent += 1
                status = f"📤 QUEUED {result.get('message', '')}"
            else:
                status = "❓ UNKNOWN"
            
            print(f"[{timestamp}] Frame {frame_number:6d}: {status}")
            
        except requests.exceptions.RequestException as e:
            print(f"❌ Error sending frame {frame_number}: {e}")
    
    def print_stats(self):
        """Print final statistics"""
        total = self.frames_sent + self.frames_cached + self.frames_skipped
        
        print("\n" + "="*50)
        print("📊 Monitoring Statistics")
        print("="*50)
        print(f"   Total frames processed: {total}")
        print(f"   Sent for analysis: {self.frames_sent}")
        print(f"   Cached (instant): {self.frames_cached}")
        print(f"   Skipped (similar): {self.frames_skipped}")
        
        if total > 0:
            cache_rate = (self.frames_cached / total) * 100
            skip_rate = (self.frames_skipped / total) * 100
            print(f"\n   Cache hit rate: {cache_rate:.1f}%")
            print(f"   Skip rate: {skip_rate:.1f}%")
            print(f"   Cost efficiency: {cache_rate + skip_rate:.1f}%")
        
        print("\n✅ Monitor stopped")

def main():
    parser = argparse.ArgumentParser(
        description="Continuous livestream monitor for technician cameras"
    )
    
    parser.add_argument('--source', required=True, 
                       help='Video source (0 for webcam, URL for stream, or file path)')
    parser.add_argument('--camera-id', required=True, 
                       help='Convex camera feed ID')
    parser.add_argument('--api-url', required=True, 
                       help='Convex deployment URL')
    parser.add_argument('--interval', type=int, default=5, 
                       help='Seconds between frames (default: 5)')
    parser.add_argument('--priority', type=int, default=5, choices=range(1, 11),
                       help='Frame priority 1-10 (default: 5)')
    
    args = parser.parse_args()
    
    monitor = LivestreamMonitor(
        source=args.source,
        camera_id=args.camera_id,
        api_url=args.api_url,
        interval=args.interval,
        priority=args.priority
    )
    
    monitor.start()

if __name__ == '__main__':
    main()

