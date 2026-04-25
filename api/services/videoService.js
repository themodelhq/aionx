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
      const filename = `${id}.mp4`;
      const filepath = join(this.outputDir, filename);

      if (config.ZSKY_API_KEY) {
        try {
          const videoBuffer = await this.generateWithZSky(prompt, imageUrl, duration, motionStyle);
          writeFileSync(filepath, videoBuffer);
          const resultUrl = `/uploads/generated/videos/${filename}`;
          console.log(`✓ Video generated via ZSky AI: "${prompt.substring(0, 50)}..."`);
          return { url: resultUrl, thumbnail: resultUrl, duration, resolution, motionStyle };
        } catch (apiError) {
          console.error('ZSky AI video error:', apiError.message);
        }
      }

      throw new Error('No video generation API key configured. Please set ZSKY_API_KEY on Render.');
    } catch (error) {
      console.error(`✗ Video generation failed:`, error.message);
      throw error;
    }
  }

  async generateWithZSky(prompt, imageUrl, duration, motionStyle) {
    const body = {
      prompt,
      duration,
      motion_style: motionStyle,
      num_inference_steps: 25,
      guidance_scale: 7.5
    };

    if (imageUrl) {
      body.image_url = imageUrl;
    }

    const response = await fetch(`${config.ZSKY_API_URL}/video/generate`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.ZSKY_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`ZSky AI Video error: ${response.status} - ${errorText}`);
    }

    return Buffer.from(await response.arrayBuffer());
  }
}

export const videoGenerationService = new VideoGenerationService();
export default VideoGenerationService;
