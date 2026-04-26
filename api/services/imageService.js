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
        const pixazoKey = process.env.PIXAZO_API_KEY || config.PIXAZO_API_KEY;
        console.log(`[Image] Generating. Pixazo key present: ${!!pixazoKey}, length: ${pixazoKey?.length}`);

        if (!pixazoKey) {
          throw new Error('PIXAZO_API_KEY is not configured on the server.');
        }

        const filename = `${id}-${i}.png`;
        const filepath = join(this.outputDir, filename);

        const imageBuffer = await this.generateWithPixazo(prompt, style, pixazoKey);
        writeFileSync(filepath, imageBuffer);

        const resultUrl = `/uploads/generated/images/${filename}`;
        results.push({ url: resultUrl, thumbnail: resultUrl, index: i });
        console.log(`✓ Image ${i + 1}/${numImages} generated via Pixazo (Flux Schnell)`);
      } catch (error) {
        console.error(`✗ Image generation failed:`, error.message);
        throw error;
      }
    }

    return results;
  }

  async generateWithPixazo(prompt, style, pixazoKey) {
    const stylePrompts = {
      realistic: 'photorealistic, highly detailed, professional photography',
      anime: 'anime style, vibrant colors, cel-shaded',
      general: 'high quality, detailed'
    };

    const enhancedPrompt = `${prompt}, ${stylePrompts[style] || stylePrompts.general}`;
    console.log(`[Image] Calling Pixazo API (flux-schnell)...`);

    const response = await fetch('https://api.pixazo.ai/v1/generate', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${pixazoKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'flux-schnell',
        prompt: enhancedPrompt
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Pixazo image error: ${response.status} - ${errorData.error || errorData.message || JSON.stringify(errorData)}`);
    }

    const data = await response.json();
    console.log(`[Image] Pixazo response keys: ${Object.keys(data).join(', ')}`);

    // Pixazo returns image URL or base64
    const imageUrl = data.url || data.image_url || data.output || data.data?.[0]?.url;
    if (imageUrl) {
      const imgRes = await fetch(imageUrl);
      if (!imgRes.ok) throw new Error(`Failed to download image from Pixazo: ${imgRes.status}`);
      console.log(`[Image] Pixazo image generated successfully`);
      return Buffer.from(await imgRes.arrayBuffer());
    }

    const base64 = data.base64 || data.image || data.data?.[0]?.b64_json;
    if (base64) {
      console.log(`[Image] Pixazo image returned as base64`);
      return Buffer.from(base64, 'base64');
    }

    throw new Error(`Pixazo returned unexpected response: ${JSON.stringify(data)}`);
  }
}

export const imageGenerationService = new ImageGenerationService();
export default ImageGenerationService;
