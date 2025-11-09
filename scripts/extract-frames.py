#!/usr/bin/env python3
"""
Frame Extraction Script for Convex Vision Analysis

This script extracts frames from video files or YouTube videos and sends them
to the Convex API for analysis with intelligent batching.

Requirements:
    pip install opencv-python requests yt-dlp pillow

Usage:
    # From local video file
    python extract-frames.py --video path/to/video.mp4 --camera-id <convex_camera_id> --api-url <your_convex_url>
    
    # From YouTube URL
    python extract-frames.py --youtube https://youtube.com/watch?v=... --camera-id <camera_id> --api-url <your_api_url>
    
    # With custom frame rate
    python extract-frames.py --video video.mp4 --camera-id <id> --api-url <url> --fps 1
"""

import cv2
import base64
import requests
import argparse
import time
import os
from typing import Optional
from pathlib import Path

class FrameExtractor:
    def __init__(self, api_url: str, camera_id: str, target_fps: float = 0.5, priority: int = 1):
        """
        Initialize frame extractor
        
        Args:
            api_url: Full Convex deployment URL (e.g., https://accurate-marlin-326.convex.site)
            camera_id: Convex camera feed ID
            target_fps: Frames per second to extract (default: 0.5 = 1 frame every 2 seconds)
            priority: Priority for frame processing (1-10, higher = more urgent)
        """
        self.api_url = api_url.rstrip('/') + '/api/analyze-frame'
        self.camera_id = camera_id
        self.target_fps = target_fps
        self.priority = priority
        self.frames_sent = 0
        self.frames_cached = 0
        self.frames_skipped = 0
        
    def extract_from_video(self, video_path: str) -> None:
        """Extract frames from a local video file"""
        if not os.path.exists(video_path):
            raise FileNotFoundError(f"Video file not found: {video_path}")
        
        print(f"📹 Opening video: {video_path}")
        cap = cv2.VideoCapture(video_path)
        
        if not cap.isOpened():
            raise ValueError("Failed to open video file")
        
        # Get video properties
        video_fps = cap.get(cv2.CAP_PROP_FPS)
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        duration = total_frames / video_fps
        
        print(f"📊 Video info: {video_fps:.2f} FPS, {total_frames} frames, {duration:.2f}s duration")
        print(f"🎯 Extracting at {self.target_fps} FPS")
        
        # Calculate frame interval
        frame_interval = int(video_fps / self.target_fps)
        
        frame_count = 0
        extracted_count = 0
        
        try:
            while True:
                ret, frame = cap.read()
                if not ret:
                    break
                
                # Extract every Nth frame
                if frame_count % frame_interval == 0:
                    self._send_frame(frame, frame_count, total_frames)
                    extracted_count += 1
                
                frame_count += 1
                
        finally:
            cap.release()
            print(f"\n✅ Extraction complete!")
            print(f"   Total frames: {frame_count}")
            print(f"   Extracted: {extracted_count}")
            print(f"   Sent: {self.frames_sent}")
            print(f"   Cached: {self.frames_cached}")
            print(f"   Skipped: {self.frames_skipped}")
    
    def extract_from_youtube(self, youtube_url: str, max_duration: int = 300) -> None:
        """
        Extract frames from a YouTube video
        
        Args:
            youtube_url: YouTube video URL
            max_duration: Maximum seconds to process (default: 300 = 5 minutes)
        """
        try:
            import yt_dlp
        except ImportError:
            raise ImportError("yt-dlp not installed. Run: pip install yt-dlp")
        
        print(f"📺 Downloading YouTube video: {youtube_url}")
        
        # Use temp directory that works on both Windows and Unix
        temp_dir = os.path.join(os.path.dirname(__file__), 'temp_downloads')
        os.makedirs(temp_dir, exist_ok=True)
        
        ydl_opts = {
            'format': 'worst[ext=mp4]/worst/best',  # Use lowest quality MP4 to save bandwidth
            'outtmpl': os.path.join(temp_dir, 'temp_video.%(ext)s'),
            'quiet': False,
            'no_warnings': False,
            # Try to avoid formats that require ffmpeg
            'prefer_free_formats': True,
        }
        
        try:
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                info = ydl.extract_info(youtube_url, download=True)
                video_path = ydl.prepare_filename(info)
            
            print(f"✅ Downloaded to: {video_path}")
            
            # Extract frames from downloaded video
            self.extract_from_video(video_path)
            
            # Cleanup
            if os.path.exists(video_path):
                os.remove(video_path)
                print("🗑️  Cleaned up temporary video file")
            
            # Remove temp directory if empty
            try:
                os.rmdir(temp_dir)
            except:
                pass  # Directory not empty or doesn't exist
                
        except Exception as e:
            error_msg = str(e)
            if 'ffmpeg' in error_msg.lower():
                print("\n❌ Error: ffmpeg is required to download YouTube videos")
                print("\n📦 Install ffmpeg:")
                print("   Windows: choco install ffmpeg")
                print("   macOS:   brew install ffmpeg")
                print("   Linux:   apt install ffmpeg")
                print("\nOr download manually: https://ffmpeg.org/download.html")
                print("\n💡 Alternative: Download the video manually and use --video instead:")
                print(f"   python {__file__} --video path/to/video.mp4 --camera-id ... --api-url ...")
            raise
    
    def _send_frame(self, frame, frame_number: int, total_frames: int) -> None:
        """Send a single frame to the API"""
        # Encode frame to JPEG
        _, buffer = cv2.imencode('.jpg', frame, [cv2.IMWRITE_JPEG_QUALITY, 85])
        
        # Convert to base64
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
            
            progress = (frame_number / total_frames) * 100
            print(f"[{progress:5.1f}%] Frame {frame_number:6d}: {status}")
            
        except requests.exceptions.RequestException as e:
            print(f"❌ Error sending frame {frame_number}: {e}")
    
    def extract_from_webcam(self, duration: int = 60) -> None:
        """
        Extract frames from webcam for live testing
        
        Args:
            duration: Duration in seconds to capture (default: 60)
        """
        print(f"📷 Opening webcam (will capture for {duration}s)")
        cap = cv2.VideoCapture(0)
        
        if not cap.isOpened():
            raise ValueError("Failed to open webcam")
        
        start_time = time.time()
        frame_count = 0
        
        try:
            while (time.time() - start_time) < duration:
                ret, frame = cap.read()
                if not ret:
                    break
                
                self._send_frame(frame, frame_count, duration * self.target_fps)
                frame_count += 1
                
                # Wait for next frame based on target FPS
                time.sleep(1.0 / self.target_fps)
                
        finally:
            cap.release()
            print(f"\n✅ Webcam capture complete!")
            print(f"   Frames captured: {frame_count}")
            print(f"   Sent: {self.frames_sent}")
            print(f"   Cached: {self.frames_cached}")


def main():
    parser = argparse.ArgumentParser(
        description="Extract frames from video and send to Convex for analysis"
    )
    
    # Input source (one required)
    source_group = parser.add_mutually_exclusive_group(required=True)
    source_group.add_argument('--video', help='Path to video file')
    source_group.add_argument('--youtube', help='YouTube video URL')
    source_group.add_argument('--webcam', action='store_true', help='Use webcam')
    
    # Required parameters
    parser.add_argument('--camera-id', required=True, help='Convex camera feed ID')
    parser.add_argument('--api-url', required=True, help='Convex deployment URL')
    
    # Optional parameters
    parser.add_argument('--fps', type=float, default=0.5, 
                       help='Target FPS for extraction (default: 0.5 = 1 frame per 2 seconds)')
    parser.add_argument('--priority', type=int, default=1, choices=range(1, 11),
                       help='Frame priority 1-10 (default: 1)')
    parser.add_argument('--duration', type=int, default=60,
                       help='Duration in seconds for webcam capture (default: 60)')
    
    args = parser.parse_args()
    
    # Initialize extractor
    extractor = FrameExtractor(
        api_url=args.api_url,
        camera_id=args.camera_id,
        target_fps=args.fps,
        priority=args.priority
    )
    
    # Extract from appropriate source
    if args.video:
        extractor.extract_from_video(args.video)
    elif args.youtube:
        extractor.extract_from_youtube(args.youtube)
    elif args.webcam:
        extractor.extract_from_webcam(args.duration)


if __name__ == '__main__':
    main()

