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
    console.log(`[Image] Calling Gemini 2.0 Flash image generation...`);

    // gemini-2.0-flash-exp supports native image generation on the free tier
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${geminiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: enhancedPrompt }] }],
          generationConfig: {
            responseModalities: ['TEXT', 'IMAGE']
          }
        })
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Gemini image error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();

    // Extract image from response parts
    const parts = data.candidates?.[0]?.content?.parts || [];
    const imagePart = parts.find(p => p.inlineData?.mimeType?.startsWith('image/'));

    if (!imagePart?.inlineData?.data) {
      throw new Error('No image data returned from Gemini');
    }

    console.log(`[Image] Gemini image generation responded successfully`);
    return Buffer.from(imagePart.inlineData.data, 'base64');
  }
}

export const imageGenerationService = new ImageGenerationService();
export default ImageGenerationService;
