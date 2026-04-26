import { config } from '../utils/config.js';
import { ensureDirSync } from '../utils/helpers.js';
import { join } from 'path';
import { writeFileSync } from 'fs';

class VideoGenerationService {
  constructor() {
    this.outputDir = join(config.UPLOADS_DIR, 'generated', 'videos');
    ensureDirSync(this.outputDir);
  }

  async generate({ id, prompt, imageUrl, duration = 6, resolution = '720p', motionStyle = 'cinematic' }) {
    try {
      const pixazoKey = process.env.PIXAZO_API_KEY || config.PIXAZO_API_KEY;
      console.log(`[Video] Generating. Pixazo key present: ${!!pixazoKey}, length: ${pixazoKey?.length}`);

      if (!pixazoKey) {
        throw new Error('PIXAZO_API_KEY is not configured on the server.');
      }

      const filename = `${id}.mp4`;
      const filepath = join(this.outputDir, filename);

      let videoUrl;
      if (imageUrl) {
        console.log(`[Video] Using Pixazo image-to-video (Wan 2.6)`);
        videoUrl = await this.imageToVideo(prompt, imageUrl, duration, pixazoKey);
      } else {
        console.log(`[Video] Using Pixazo text-to-video (Wan 2.6)`);
        videoUrl = await this.textToVideo(prompt, duration, pixazoKey);
      }

      const videoBuffer = await this.downloadFile(videoUrl);
      writeFileSync(filepath, videoBuffer);

      const resultUrl = `/uploads/generated/videos/${filename}`;
      console.log(`✓ Video saved successfully via Pixazo`);
      return { url: resultUrl, thumbnail: resultUrl, duration, resolution, motionStyle };
    } catch (error) {
      console.error(`✗ Video generation failed:`, error.message);
      throw error;
    }
  }

  async textToVideo(prompt, duration, pixazoKey) {
    const response = await fetch('https://api.pixazo.ai/v1/generate', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${pixazoKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'wan-2-6-text-to-video',
        prompt,
        duration: Math.min(Math.max(duration, 2), 10)
      })
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(`Pixazo text-to-video error: ${response.status} - ${err.error || err.message || JSON.stringify(err)}`);
    }

    const data = await response.json();
    console.log(`[Video] Pixazo text-to-video response keys: ${Object.keys(data).join(', ')}`);
    return this.extractVideoUrl(data);
  }

  async imageToVideo(prompt, imageUrl, duration, pixazoKey) {
    const response = await fetch('https://api.pixazo.ai/v1/generate', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${pixazoKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'wan-2-6-image-to-video',
        prompt,
        image_url: imageUrl,
        duration: Math.min(Math.max(duration, 2), 10)
      })
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(`Pixazo image-to-video error: ${response.status} - ${err.error || err.message || JSON.stringify(err)}`);
    }

    const data = await response.json();
    console.log(`[Video] Pixazo image-to-video response keys: ${Object.keys(data).join(', ')}`);
    return this.extractVideoUrl(data);
  }

  extractVideoUrl(data) {
    // Pixazo may return task ID for async jobs or direct URL
    const url = data.url || data.video_url || data.output || data.data?.[0]?.url || data.result_url;
    if (url) return url;

    // If async, poll for result
    const taskId = data.task_id || data.id || data.job_id;
    if (taskId) {
      throw new Error(`Pixazo returned async task ${taskId} — polling not yet implemented. Check Pixazo dashboard.`);
    }

    throw new Error(`Pixazo returned unexpected response: ${JSON.stringify(data)}`);
  }

  async downloadFile(url) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed to download video: ${res.status}`);
    return Buffer.from(await res.arrayBuffer());
  }
}

export const videoGenerationService = new VideoGenerationService();
export default VideoGenerationService;
