import { config } from '../utils/config.js';
import { ensureDirSync } from '../utils/helpers.js';
import { join } from 'path';
import { writeFileSync, existsSync } from 'fs';
import crypto from 'crypto';

// Hugging Face Inference API - Free tier
// Uses Stable Diffusion models available on Hugging Face

class ImageGenerationService {
  constructor() {
    this.outputDir = join(config.UPLOADS_DIR, 'generated', 'images');
    ensureDirSync(this.outputDir);

    // Free Stable Diffusion models on Hugging Face
    this.defaultModel = 'stabilityai/stable-diffusion-2-1';
    this.models = {
      realistic: 'stabilityai/stable-diffusion-2-1',
      anime: 'Linaqruf/anything-v3.0',
      general: 'stabilityai/stable-diffusion-2-1'
    };
  }

  async generate({ id, prompt, style = 'realistic', aspectRatio = '1:1', quality = 'standard', numImages = 1 }) {
    const results = [];

    for (let i = 0; i < numImages; i++) {
      try {
        const filename = `${id}-${i}.png`;
        const filepath = join(this.outputDir, filename);

        // Try Hugging Face API first
        if (config.HUGGINGFACE_API_KEY) {
          try {
            const imageBuffer = await this.generateWithHuggingFace(prompt, style);
            writeFileSync(filepath, imageBuffer);
            const resultUrl = `/uploads/generated/images/${filename}`;

            results.push({
              url: resultUrl,
              thumbnail: resultUrl,
              index: i
            });

            console.log(`✓ Image ${i + 1}/${numImages} generated via Hugging Face: "${prompt.substring(0, 50)}..."`);
            continue;
          } catch (apiError) {
            console.error('Hugging Face API error, using fallback:', apiError.message);
          }
        }

        // Fallback: Create SVG placeholder with AI-inspired design
        const svgContent = this.createFallbackImage(prompt, style, aspectRatio);
        const svgPath = filepath.replace('.png', '.svg');
        writeFileSync(svgPath, svgContent);

        const resultUrl = `/uploads/generated/images/${filename.replace('.png', '.svg')}`;

        results.push({
          url: resultUrl,
          thumbnail: resultUrl,
          index: i
        });

        console.log(`✓ Image ${i + 1}/${numImages} created (fallback): "${prompt.substring(0, 50)}..."`);
      } catch (error) {
        console.error(`✗ Image generation failed:`, error.message);
        throw error;
      }
    }

    return results;
  }

  async generateWithHuggingFace(prompt, style) {
    const model = this.models[style] || this.defaultModel;
    const apiUrl = `${config.HUGGINGFACE_API_URL}/${model}`;

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.HUGGINGFACE_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        inputs: prompt,
        parameters: {
          guidance_scale: 7.5,
          num_inference_steps: 30
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Hugging Face API error: ${response.status} - ${errorText}`);
    }

    return Buffer.from(await response.arrayBuffer());
  }

  createFallbackImage(prompt, style, aspectRatio) {
    const [w, h] = aspectRatio.split(':').map(Number);
    const width = 512;
    const height = Math.round(width * h / w);

    const colors = this.extractColors(prompt);

    return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${colors[0]}"/>
      <stop offset="100%" style="stop-color:${colors[1]}"/>
    </linearGradient>
    <filter id="glow">
      <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
      <feMerge>
        <feMergeNode in="coloredBlur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
    <filter id="noise">
      <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="4" result="noise"/>
      <feDisplacementMap in="SourceGraphic" in2="noise" scale="10" xChannelSelector="R" yChannelSelector="G"/>
    </filter>
  </defs>

  <rect width="100%" height="100%" fill="url(#bg)"/>

  <!-- Abstract shapes -->
  <g filter="url(#glow)">
    <circle cx="${width * 0.15}" cy="${height * 0.25}" r="50" fill="${colors[2]}" opacity="0.7"/>
    <circle cx="${width * 0.85}" cy="${height * 0.75}" r="70" fill="${colors[3]}" opacity="0.6"/>
    <circle cx="${width * 0.5}" cy="${height * 0.5}" r="90" fill="${colors[4]}" opacity="0.4"/>
  </g>

  <!-- Geometric patterns -->
  ${this.createPattern(colors, width, height)}

  <!-- AI Generated badge -->
  <rect x="${width - 120}" y="${height - 35}" width="110" height="25" rx="5" fill="rgba(0,0,0,0.5)"/>
  <text x="${width - 65}" y="${height - 17}" text-anchor="middle" font-family="Arial" font-size="11" fill="white">
    AionX AI
  </text>

  <!-- Prompt preview -->
  <text x="10" y="${height - 10}" font-family="Arial" font-size="9" fill="rgba(255,255,255,0.6)">
    ${prompt.substring(0, 60)}${prompt.length > 60 ? '...' : ''}
  </text>
</svg>`;
  }

  extractColors(prompt) {
    const colorMap = {
      sunset: ['#FF6B35', '#F7931E', '#FFD23F', '#FF8551', '#FFA07A'],
      ocean: ['#0077B6', '#00B4D8', '#90E0EF', '#CAF0F8', '#03045E'],
      forest: ['#2D6A4F', '#40916C', '#52B788', '#74C69D', '#1B4332'],
      night: ['#1A1A2E', '#16213E', '#0F3460', '#E94560', '#533483'],
      rainbow: ['#FF0000', '#FF7F00', '#FFFF00', '#00FF00', '#0000FF'],
      space: ['#0B0B3B', '#1C1C4E', '#2E2E7A', '#6366F1', '#818CF8'],
      golden: ['#FFD700', '#FFA500', '#FF8C00', '#DAA520', '#B8860B'],
      purple: ['#8B5CF6', '#A855F7', '#C084FC', '#D946EF', '#EC4899'],
      default: ['#6366F1', '#8B5CF6', '#A855F7', '#D946EF', '#EC4899']
    };

    const lowerPrompt = prompt.toLowerCase();
    for (const [key, colors] of Object.entries(colorMap)) {
      if (lowerPrompt.includes(key)) {
        return colors;
      }
    }

    return colorMap.default;
  }

  createPattern(colors, width, height) {
    let pattern = '';
    for (let i = 0; i < 8; i++) {
      const x = 50 + i * 60;
      const y = 50 + (i % 4) * 80;
      const rotation = i * 25;
      pattern += `<rect x="${x}" y="${y}" width="35" height="35" rx="6"
        fill="${colors[i % colors.length]}" opacity="0.15"
        transform="rotate(${rotation} ${x + 17} ${y + 17})"/>`;
    }
    return pattern;
  }
}

export const imageGenerationService = new ImageGenerationService();
export default ImageGenerationService;
