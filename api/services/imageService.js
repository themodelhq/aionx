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
        const geminiKey = process.env.GEMINI_API_KEY || config.GEMINI_API_KEY;
        console.log(`[Image] Generating. Gemini key present: ${!!geminiKey}, length: ${geminiKey?.length}`);

        if (!geminiKey) {
          throw new Error('GEMINI_API_KEY is not configured on the server.');
        }

        const filename = `${id}-${i}.png`;
        const filepath = join(this.outputDir, filename);

        const imageBuffer = await this.generateWithGemini(prompt, style, aspectRatio, geminiKey);
        writeFileSync(filepath, imageBuffer);

        const resultUrl = `/uploads/generated/images/${filename}`;
        results.push({ url: resultUrl, thumbnail: resultUrl, index: i });
        console.log(`✓ Image ${i + 1}/${numImages} generated via Gemini Imagen 4`);
      } catch (error) {
        console.error(`✗ Image generation failed:`, error.message);
        throw error;
      }
    }

    return results;
  }

  async generateWithGemini(prompt, style, aspectRatio, geminiKey) {
    const stylePrompts = {
      realistic: 'photorealistic, highly detailed, professional photography',
      anime: 'anime style, vibrant colors, cel-shaded',
      general: 'high quality, detailed'
    };

    const enhancedPrompt = `${prompt}, ${stylePrompts[style] || stylePrompts.general}`;

    const aspectMap = {
      '1:1': '1:1',
      '16:9': '16:9',
      '9:16': '9:16',
      '4:3': '4:3',
      '3:4': '3:4'
    };
    const geminiAspect = aspectMap[aspectRatio] || '1:1';

    // Use Imagen 4 - the current stable model
    const url = `https://generativelanguage.googleapis.com/v1beta/models/imagen-4.0-generate-001:predict?key=${geminiKey}`;
    console.log(`[Image] Calling Gemini Imagen 4 with aspect ratio: ${geminiAspect}`);

    const response = await fetch(url, {
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
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Gemini Imagen error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    const base64Image = data.predictions?.[0]?.bytesBase64Encoded;
    if (!base64Image) {
      throw new Error('No image data returned from Gemini Imagen');
    }

    console.log(`[Image] Gemini Imagen 4 responded successfully`);
    return Buffer.from(base64Image, 'base64');
  }
}

export const imageGenerationService = new ImageGenerationService();
export default ImageGenerationService;
