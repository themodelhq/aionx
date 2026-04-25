import { config } from '../utils/config.js';
import { ensureDirSync } from '../utils/helpers.js';
import { join } from 'path';
import { writeFileSync } from 'fs';

class ImageGenerationService {
  constructor() {
    this.outputDir = join(config.UPLOADS_DIR, 'generated', 'images');
    ensureDirSync(this.outputDir);
  }

  async generate({ id, prompt, style = 'realistic', aspectRatio = '1:1', quality = 'standard', numImages = 1 }) {
    const results = [];

    for (let i = 0; i < numImages; i++) {
      try {
        const filename = `${id}-${i}.png`;
        const filepath = join(this.outputDir, filename);

        if (config.ZSKY_API_KEY) {
          try {
            const imageBuffer = await this.generateWithZSky(prompt, style, aspectRatio);
            writeFileSync(filepath, imageBuffer);
            const resultUrl = `/uploads/generated/images/${filename}`;
            results.push({ url: resultUrl, thumbnail: resultUrl, index: i });
            console.log(`✓ Image ${i + 1}/${numImages} generated via ZSky AI`);
            continue;
          } catch (apiError) {
            console.error('ZSky AI error, trying Hugging Face fallback:', apiError.message);
          }
        }

        // Fallback to Hugging Face
        if (config.HUGGINGFACE_API_KEY) {
          try {
            const imageBuffer = await this.generateWithHuggingFace(prompt, style);
            writeFileSync(filepath, imageBuffer);
            const resultUrl = `/uploads/generated/images/${filename}`;
            results.push({ url: resultUrl, thumbnail: resultUrl, index: i });
            console.log(`✓ Image ${i + 1}/${numImages} generated via Hugging Face`);
            continue;
          } catch (apiError) {
            console.error('Hugging Face error:', apiError.message);
          }
        }

        throw new Error('No image generation API key configured. Please set ZSKY_API_KEY on Render.');
      } catch (error) {
        console.error(`✗ Image generation failed:`, error.message);
        throw error;
      }
    }

    return results;
  }

  async generateWithZSky(prompt, style, aspectRatio) {
    // ZSky AI uses a Stable Diffusion compatible API
    const response = await fetch(`${config.ZSKY_API_URL}/generate`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.ZSKY_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        prompt,
        style,
        aspect_ratio: aspectRatio,
        num_inference_steps: 30,
        guidance_scale: 7.5
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`ZSky AI error: ${response.status} - ${errorText}`);
    }

    return Buffer.from(await response.arrayBuffer());
  }

  async generateWithHuggingFace(prompt, style) {
    const models = {
      realistic: 'stabilityai/stable-diffusion-2-1',
      anime: 'Linaqruf/anything-v3.0',
      general: 'stabilityai/stable-diffusion-2-1'
    };
    const model = models[style] || models.general;
    const apiUrl = `${config.HUGGINGFACE_API_URL}/${model}`;

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.HUGGINGFACE_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        inputs: prompt,
        parameters: { guidance_scale: 7.5, num_inference_steps: 30 }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Hugging Face error: ${response.status} - ${errorText}`);
    }

    return Buffer.from(await response.arrayBuffer());
  }
}

export const imageGenerationService = new ImageGenerationService();
export default ImageGenerationService;
