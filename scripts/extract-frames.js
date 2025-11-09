#!/usr/bin/env node
/**
 * Frame Extraction Script for Convex Vision Analysis (Node.js)
 * 
 * Extracts frames from video files and sends them to Convex API
 * 
 * Requirements:
 *   npm install fluent-ffmpeg axios
 * 
 * Usage:
 *   node extract-frames.js --video path/to/video.mp4 --camera-id <id> --api-url <url>
 *   node extract-frames.js --youtube <url> --camera-id <id> --api-url <url>
 */

const ffmpeg = require('fluent-ffmpeg');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

class FrameExtractor {
  constructor(apiUrl, cameraId, targetFps = 0.5, priority = 1) {
    this.apiUrl = apiUrl.replace(/\/$/, '') + '/api/analyze-frame';
    this.cameraId = cameraId;
    this.targetFps = targetFps;
    this.priority = priority;
    this.framesSent = 0;
    this.framesCached = 0;
    this.framesSkipped = 0;
  }

  async extractFromVideo(videoPath) {
    if (!fs.existsSync(videoPath)) {
      throw new Error(`Video file not found: ${videoPath}`);
    }

    console.log(`📹 Processing video: ${videoPath}`);

    // Create temp directory for frames
    const tempDir = path.join(__dirname, 'temp_frames');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir);
    }

    return new Promise((resolve, reject) => {
      let frameCount = 0;

      ffmpeg(videoPath)
        .fps(this.targetFps)
        .on('start', (cmd) => {
          console.log(`🎬 Starting extraction at ${this.targetFps} FPS`);
        })
        .on('progress', (progress) => {
          if (progress.frames) {
            process.stdout.write(`\r📊 Extracting... ${progress.frames} frames`);
          }
        })
        .on('end', async () => {
          console.log('\n✅ Extraction complete! Sending to API...');
          
          // Send all extracted frames
          const files = fs.readdirSync(tempDir);
          for (const file of files.sort()) {
            if (file.endsWith('.jpg')) {
              await this.sendFrame(path.join(tempDir, file), frameCount++);
            }
          }

          // Cleanup
          fs.rmSync(tempDir, { recursive: true });

          console.log('\n📈 Summary:');
          console.log(`   Sent: ${this.framesSent}`);
          console.log(`   Cached: ${this.framesCached}`);
          console.log(`   Skipped: ${this.framesSkipped}`);
          
          resolve();
        })
        .on('error', (err) => {
          console.error('❌ Error:', err.message);
          reject(err);
        })
        .save(path.join(tempDir, 'frame-%04d.jpg'));
    });
  }

  async sendFrame(framePath, frameNumber) {
    // Read and encode frame
    const frameBuffer = fs.readFileSync(framePath);
    const frameB64 = frameBuffer.toString('base64');

    try {
      const response = await axios.post(this.apiUrl, {
        cameraId: this.cameraId,
        frameData: frameB64,
        priority: this.priority,
      }, {
        timeout: 30000,
      });

      const result = response.data;

      // Track results
      let status;
      if (result.cached) {
        this.framesCached++;
        status = '💾 CACHED';
      } else if (result.skipped) {
        this.framesSkipped++;
        status = '⏭️  SKIPPED';
      } else if (result.queued) {
        this.framesSent++;
        status = `📤 QUEUED ${result.message || ''}`;
      } else {
        status = '❓ UNKNOWN';
      }

      console.log(`Frame ${frameNumber}: ${status}`);
      
    } catch (error) {
      console.error(`❌ Error sending frame ${frameNumber}:`, error.message);
    }
  }

  async extractFromYouTube(youtubeUrl) {
    console.log(`📺 Downloading from YouTube: ${youtubeUrl}`);
    
    const tempVideo = path.join(__dirname, 'temp_youtube.mp4');
    
    // Use youtube-dl or yt-dlp to download
    const { exec } = require('child_process');
    
    return new Promise((resolve, reject) => {
      exec(`yt-dlp -f worst -o "${tempVideo}" "${youtubeUrl}"`, async (error) => {
        if (error) {
          reject(new Error('Failed to download YouTube video. Make sure yt-dlp is installed.'));
          return;
        }

        console.log('✅ Download complete!');
        
        // Extract frames
        await this.extractFromVideo(tempVideo);
        
        // Cleanup
        if (fs.existsSync(tempVideo)) {
          fs.unlinkSync(tempVideo);
        }
        
        resolve();
      });
    });
  }
}

// CLI
if (require.main === module) {
  const args = process.argv.slice(2);
  
  const getArg = (flag) => {
    const index = args.indexOf(flag);
    return index !== -1 && args[index + 1] ? args[index + 1] : null;
  };

  const hasFlag = (flag) => args.includes(flag);

  const video = getArg('--video');
  const youtube = getArg('--youtube');
  const cameraId = getArg('--camera-id');
  const apiUrl = getArg('--api-url');
  const fps = parseFloat(getArg('--fps') || '0.5');
  const priority = parseInt(getArg('--priority') || '1');

  if (!cameraId || !apiUrl) {
    console.error('❌ Missing required arguments: --camera-id and --api-url');
    console.log('\nUsage:');
    console.log('  node extract-frames.js --video <path> --camera-id <id> --api-url <url>');
    console.log('  node extract-frames.js --youtube <url> --camera-id <id> --api-url <url>');
    console.log('\nOptions:');
    console.log('  --fps <number>      Frames per second (default: 0.5)');
    console.log('  --priority <1-10>   Priority level (default: 1)');
    process.exit(1);
  }

  if (!video && !youtube) {
    console.error('❌ Must specify either --video or --youtube');
    process.exit(1);
  }

  const extractor = new FrameExtractor(apiUrl, cameraId, fps, priority);

  (async () => {
    try {
      if (video) {
        await extractor.extractFromVideo(video);
      } else if (youtube) {
        await extractor.extractFromYouTube(youtube);
      }
      console.log('✅ Done!');
    } catch (error) {
      console.error('❌ Error:', error.message);
      process.exit(1);
    }
  })();
}

module.exports = { FrameExtractor };

