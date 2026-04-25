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
        if (!config.GEMINI_API_KEY) {
          throw new Error('GEMINI_API_KEY is not set on the server.');
        }

        const filename = `${id}-${i}.png`;
        const filepath = join(this.outputDir, filename);

        const imageBuffer = await this.generateWithGemini(prompt, style, aspectRatio);
        writeFileSync(filepath, imageBuffer);

        const resultUrl = `/uploads/generated/images/${filename}`;
        results.push({ url: resultUrl, thumbnail: resultUrl, index: i });
        console.log(`✓ Image ${i + 1}/${numImages} generated via Gemini Imagen: "${prompt.substring(0, 50)}..."`);
      } catch (error) {
        console.error(`✗ Image generation failed:`, error.message);
        throw error;
      }
    }

    return results;
  }

  async generateWithGemini(prompt, style, aspectRatio) {
    const stylePrompts = {
      realistic: 'photorealistic, highly detailed, professional photography',
      anime: 'anime style, vibrant colors, cel-shaded',
      general: 'high quality, detailed'
    };

    const enhancedPrompt = `${prompt}, ${stylePrompts[style] || stylePrompts.general}`;

    // Map aspect ratio to Gemini supported sizes
    const aspectMap = {
      '1:1': '1:1',
      '16:9': '16:9',
      '9:16': '9:16',
      '4:3': '4:3',
      '3:4': '3:4'
    };
    const geminiAspect = aspectMap[aspectRatio] || '1:1';

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-001:predict?key=${config.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          instances: [{ prompt: enhancedPrompt }],
          parameters: {
            sampleCount: 1,
            aspectRatio: geminiAspect,
            safetyFilterLevel: 'block_some',
            personGeneration: 'allow_adult'
          }
        })
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Gemini Imagen error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    const base64Image = data.predictions?.[0]?.bytesBase64Encoded;
    if (!base64Image) {
      throw new Error('No image data returned from Gemini Imagen');
    }

    return Buffer.from(base64Image, 'base64');
  }
}

export const imageGenerationService = new ImageGenerationService();
export default ImageGenerationService;
