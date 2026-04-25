import { config } from '../utils/config.js';
import { ensureDirSync } from '../utils/helpers.js';
import { join } from 'path';
import { writeFileSync } from 'fs';

class VideoGenerationService {
  constructor() {
    this.outputDir = join(config.UPLOADS_DIR, 'generated', 'videos');
    ensureDirSync(this.outputDir);
  }

  async generate({ id, prompt, imageUrl, duration = 6, resolution = '768P', motionStyle = 'cinematic' }) {
    try {
      // Prefer Tavus for avatar/conversational video, Magic Hour for general video
      if (imageUrl && config.TAVUS_API_KEY) {
        return await this.generateWithTavus({ id, prompt, imageUrl, duration });
      }

      if (config.MAGIC_HOUR_API_KEY) {
        return await this.generateWithMagicHour({ id, prompt, imageUrl, duration, resolution, motionStyle });
      }

      if (config.TAVUS_API_KEY) {
        return await this.generateWithTavus({ id, prompt, imageUrl, duration });
      }

      throw new Error('No video API key configured. Please set MAGIC_HOUR_API_KEY or TAVUS_API_KEY on Render.');
    } catch (error) {
      console.error(`✗ Video generation failed:`, error.message);
      throw error;
    }
  }

  async generateWithMagicHour({ id, prompt, imageUrl, duration, resolution, motionStyle }) {
    // Step 1: Submit the job
    const body = {
      name: `AionX-${id}`,
      style: {
        prompt,
        motion_style: motionStyle
      },
      duration,
      resolution
    };

    if (imageUrl) {
      body.input_image_url = imageUrl;
    }

    const submitResponse = await fetch('https://api.magichour.ai/v1/ai-video-clips', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.MAGIC_HOUR_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    if (!submitResponse.ok) {
      const err = await submitResponse.json().catch(() => ({}));
      throw new Error(`Magic Hour submit error: ${submitResponse.status} - ${err.error || err.message || 'Unknown'}`);
    }

    const submitData = await submitResponse.json();
    const jobId = submitData.id;

    console.log(`✓ Magic Hour video job submitted: ${jobId}`);

    // Step 2: Poll for completion (up to 3 minutes)
    const videoUrl = await this.pollMagicHour(jobId);

    // Step 3: Download and save
    const filename = `${id}.mp4`;
    const filepath = join(this.outputDir, filename);
    const videoBuffer = await this.downloadFile(videoUrl);
    writeFileSync(filepath, videoBuffer);

    const resultUrl = `/uploads/generated/videos/${filename}`;
    console.log(`✓ Magic Hour video saved: "${prompt.substring(0, 50)}..."`);
    return { url: resultUrl, thumbnail: resultUrl, duration, resolution, motionStyle };
  }

  async pollMagicHour(jobId, maxAttempts = 36, intervalMs = 5000) {
    for (let i = 0; i < maxAttempts; i++) {
      await new Promise(r => setTimeout(r, intervalMs));

      const res = await fetch(`https://api.magichour.ai/v1/ai-video-clips/${jobId}`, {
        headers: { 'Authorization': `Bearer ${config.MAGIC_HOUR_API_KEY}` }
      });

      if (!res.ok) continue;

      const data = await res.json();
      const status = data.status;

      if (status === 'complete' || status === 'completed') {
        const url = data.downloads?.mp4 || data.output_url || data.video_url;
        if (url) return url;
        throw new Error('Magic Hour job completed but no video URL found');
      }

      if (status === 'failed' || status === 'error') {
        throw new Error(`Magic Hour job failed: ${data.error || 'Unknown error'}`);
      }

      console.log(`Magic Hour job ${jobId} status: ${status} (attempt ${i + 1}/${maxAttempts})`);
    }

    throw new Error('Magic Hour video generation timed out after 3 minutes');
  }

  async generateWithTavus({ id, prompt, imageUrl, duration }) {
    if (!config.TAVUS_REPLICA_ID) {
      throw new Error('TAVUS_REPLICA_ID is required for Tavus video generation');
    }

    const body = {
      replica_id: config.TAVUS_REPLICA_ID,
      script: prompt,
      video_name: `AionX-${id}`
    };

    if (imageUrl) {
      body.background_url = imageUrl;
    }

    const response = await fetch('https://tavusapi.com/v2/videos', {
      method: 'POST',
      headers: {
        'x-api-key': config.TAVUS_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(`Tavus error: ${response.status} - ${err.message || 'Unknown'}`);
    }

    const data = await response.json();
    const videoId = data.video_id;

    console.log(`✓ Tavus video job submitted: ${videoId}`);

    // Poll for completion
    const videoUrl = await this.pollTavus(videoId);

    // Download and save
    const filename = `${id}.mp4`;
    const filepath = join(this.outputDir, filename);
    const videoBuffer = await this.downloadFile(videoUrl);
    writeFileSync(filepath, videoBuffer);

    const resultUrl = `/uploads/generated/videos/${filename}`;
    console.log(`✓ Tavus video saved: "${prompt.substring(0, 50)}..."`);
    return { url: resultUrl, thumbnail: resultUrl, duration, resolution: '1080P', motionStyle: 'avatar' };
  }

  async pollTavus(videoId, maxAttempts = 36, intervalMs = 5000) {
    for (let i = 0; i < maxAttempts; i++) {
      await new Promise(r => setTimeout(r, intervalMs));

      const res = await fetch(`https://tavusapi.com/v2/videos/${videoId}`, {
        headers: { 'x-api-key': config.TAVUS_API_KEY }
      });

      if (!res.ok) continue;

      const data = await res.json();
      const status = data.status;

      if (status === 'ready') {
        return data.download_url || data.hosted_url;
      }

      if (status === 'error' || status === 'failed') {
        throw new Error(`Tavus job failed: ${data.error || 'Unknown error'}`);
      }

      console.log(`Tavus job ${videoId} status: ${status} (attempt ${i + 1}/${maxAttempts})`);
    }

    throw new Error('Tavus video generation timed out after 3 minutes');
  }

  async downloadFile(url) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed to download video: ${res.status}`);
    return Buffer.from(await res.arrayBuffer());
  }
}

export const videoGenerationService = new VideoGenerationService();
export default VideoGenerationService;
