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
      // Re-read keys at call time to avoid module cache issues
      const magicHourKey = process.env.MAGIC_HOUR_API_KEY || config.MAGIC_HOUR_API_KEY;
      const tavusKey = process.env.TAVUS_API_KEY || config.TAVUS_API_KEY;
      const tavusReplicaId = process.env.TAVUS_REPLICA_ID || config.TAVUS_REPLICA_ID;

      console.log(`[Video] Generating. Magic Hour key: ${!!magicHourKey}, Tavus key: ${!!tavusKey}, ReplicaId: ${!!tavusReplicaId}`);

      // Prefer Tavus for avatar/conversational video (when image provided), Magic Hour for general
      if (imageUrl && tavusKey) {
        console.log(`[Video] Using Tavus (image-to-video)`);
        return await this.generateWithTavus({ id, prompt, imageUrl, duration, tavusKey, tavusReplicaId });
      }

      if (magicHourKey) {
        console.log(`[Video] Using Magic Hour`);
        return await this.generateWithMagicHour({ id, prompt, imageUrl, duration, resolution, motionStyle, magicHourKey });
      }

      if (tavusKey) {
        console.log(`[Video] Using Tavus (text-to-video fallback)`);
        return await this.generateWithTavus({ id, prompt, imageUrl, duration, tavusKey, tavusReplicaId });
      }

      throw new Error('No video API key configured. Please set MAGIC_HOUR_API_KEY or TAVUS_API_KEY on Render.');
    } catch (error) {
      console.error(`✗ Video generation failed:`, error.message);
      throw error;
    }
  }

  async generateWithMagicHour({ id, prompt, imageUrl, duration, resolution, motionStyle, magicHourKey }) {
    const body = {
      name: `AionX-${id}`,
      style: { prompt, motion_style: motionStyle },
      duration,
      resolution
    };

    if (imageUrl) body.input_image_url = imageUrl;

    console.log(`[Video] Submitting Magic Hour job...`);

    const submitResponse = await fetch('https://api.magichour.ai/v1/ai-video-clips', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${magicHourKey}`,
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
    console.log(`[Video] Magic Hour job submitted: ${jobId}`);

    const videoUrl = await this.pollMagicHour(jobId, magicHourKey);

    const filename = `${id}.mp4`;
    const filepath = join(this.outputDir, filename);
    const videoBuffer = await this.downloadFile(videoUrl);
    writeFileSync(filepath, videoBuffer);

    const resultUrl = `/uploads/generated/videos/${filename}`;
    console.log(`✓ Magic Hour video saved`);
    return { url: resultUrl, thumbnail: resultUrl, duration, resolution, motionStyle };
  }

  async pollMagicHour(jobId, magicHourKey, maxAttempts = 36, intervalMs = 5000) {
    for (let i = 0; i < maxAttempts; i++) {
      await new Promise(r => setTimeout(r, intervalMs));

      const res = await fetch(`https://api.magichour.ai/v1/ai-video-clips/${jobId}`, {
        headers: { 'Authorization': `Bearer ${magicHourKey}` }
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

      console.log(`[Video] Magic Hour job ${jobId} status: ${status} (${i + 1}/${maxAttempts})`);
    }

    throw new Error('Magic Hour video generation timed out after 3 minutes');
  }

  async generateWithTavus({ id, prompt, imageUrl, duration, tavusKey, tavusReplicaId }) {
    if (!tavusReplicaId) {
      throw new Error('TAVUS_REPLICA_ID is required for Tavus video generation');
    }

    const body = {
      replica_id: tavusReplicaId,
      script: prompt,
      video_name: `AionX-${id}`
    };

    if (imageUrl) body.background_url = imageUrl;

    console.log(`[Video] Submitting Tavus job with replica: ${tavusReplicaId}`);

    const response = await fetch('https://tavusapi.com/v2/videos', {
      method: 'POST',
      headers: {
        'x-api-key': tavusKey,
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
    console.log(`[Video] Tavus job submitted: ${videoId}`);

    const videoUrl = await this.pollTavus(videoId, tavusKey);

    const filename = `${id}.mp4`;
    const filepath = join(this.outputDir, filename);
    const videoBuffer = await this.downloadFile(videoUrl);
    writeFileSync(filepath, videoBuffer);

    const resultUrl = `/uploads/generated/videos/${filename}`;
    console.log(`✓ Tavus video saved`);
    return { url: resultUrl, thumbnail: resultUrl, duration, resolution: '1080P', motionStyle: 'avatar' };
  }

  async pollTavus(videoId, tavusKey, maxAttempts = 36, intervalMs = 5000) {
    for (let i = 0; i < maxAttempts; i++) {
      await new Promise(r => setTimeout(r, intervalMs));

      const res = await fetch(`https://tavusapi.com/v2/videos/${videoId}`, {
        headers: { 'x-api-key': tavusKey }
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

      console.log(`[Video] Tavus job ${videoId} status: ${status} (${i + 1}/${maxAttempts})`);
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
