import { config } from '../utils/config.js';
import { ensureDirSync } from '../utils/helpers.js';
import { join } from 'path';
import { writeFileSync } from 'fs';

// Free Video Generation using Hugging Face
// Falls back to animated SVG/GIF when API is not available

class VideoGenerationService {
  constructor() {
    this.outputDir = join(config.DATA_DIR, 'generated', 'videos');
    ensureDirSync(this.outputDir);

    // Hugging Face video models
    this.models = {
      text_to_video: 'damo-vilab/text-to-video-ms-16bit',
      image_to_video: 'damo-vilab/modelscope-dttext-to-video',
      i2v: 'damo-vilab/modelscope-dttext-to-video'
    };
  }

  async generate({ id, prompt, imageUrl, duration = 6, resolution = '768P', motionStyle = 'cinematic' }) {
    try {
      const filename = `${id}.mp4`;
      const filepath = join(this.outputDir, filename);

      // Try Hugging Face API for actual video generation
      if (config.HUGGINGFACE_API_KEY) {
        try {
          const videoBuffer = await this.generateWithHuggingFace(prompt, imageUrl, duration);
          writeFileSync(filepath, videoBuffer);

          const resultUrl = `/uploads/generated/videos/${filename}`;

          console.log(`✓ Video generated via Hugging Face: "${prompt.substring(0, 50)}..." (${duration}s)`);

          return {
            url: resultUrl,
            thumbnail: resultUrl.replace('.mp4', '-thumb.gif'),
            duration,
            resolution,
            motionStyle
          };
        } catch (apiError) {
          console.error('Hugging Face video API error, using fallback:', apiError.message);
        }
      }

      // Fallback: Create animated GIF placeholder
      const gifFilename = `${id}.gif`;
      const gifPath = join(this.outputDir, gifFilename);
      const thumbnailFilename = `${id}-thumb.gif`;
      const thumbnailPath = join(this.outputDir, thumbnailFilename);

      const gifContent = this.createAnimatedPlaceholder(prompt, duration, resolution, motionStyle);
      writeFileSync(gifPath, gifContent);
      writeFileSync(thumbnailPath, gifContent);

      const resultUrl = `/uploads/generated/videos/${gifFilename}`;
      const thumbnailUrl = `/uploads/generated/videos/${thumbnailFilename}`;

      console.log(`✓ Video placeholder created: "${prompt.substring(0, 50)}..." (${duration}s animated)`);

      return {
        url: resultUrl,
        thumbnail: thumbnailUrl,
        duration,
        resolution,
        motionStyle
      };
    } catch (error) {
      console.error(`✗ Video generation failed:`, error.message);
      throw error;
    }
  }

  async generateWithHuggingFace(prompt, imageUrl, duration) {
    const model = imageUrl ? this.models.image_to_video : this.models.text_to_video;
    const apiUrl = `${config.HUGGINGFACE_API_URL}/${model}`;

    const body = {
      inputs: prompt,
      parameters: {
        num_inference_steps: 25,
        guidance_scale: 7.5
      }
    };

    // For image-to-video
    if (imageUrl) {
      // Convert image URL to base64 if needed
      body.inputs = prompt; // Use prompt as primary input
      body.parameters.negative_prompt = imageUrl;
    }

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.HUGGINGFACE_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Hugging Face Video API error: ${response.status} - ${errorText}`);
    }

    return await response.buffer();
  }

  createAnimatedPlaceholder(prompt, duration, resolution, motionStyle) {
    // Create a simple animated SVG as GIF placeholder
    // This is a simplified representation - real implementation would use actual video
    const width = 512;
    const height = 288; // 16:9 aspect ratio

    const colors = this.extractColors(prompt);
    const motionEffects = this.getMotionEffects(motionStyle);

    // Create frames for simple animation
    const frames = [];
    for (let i = 0; i < Math.min(duration, 10); i++) {
      const frame = `
        <g id="frame${i}">
          <circle cx="${width * (0.2 + 0.6 * Math.sin(i * 0.5))}" cy="${height * (0.3 + 0.4 * Math.cos(i * 0.3))}"
            r="${20 + i * 3}" fill="${colors[i % colors.length]}" opacity="${0.6 + 0.2 * Math.sin(i)}">
            <animate attributeName="r" values="${15 + i * 3};${25 + i * 3};${15 + i * 3}" dur="1s" repeatCount="indefinite"/>
          </circle>
        </g>
      `;
      frames.push(frame);
    }

    const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${colors[0]}">
        <animate attributeName="stop-color" values="${colors[0]};${colors[1]};${colors[0]}" dur="${duration}s" repeatCount="indefinite"/>
      </stop>
      <stop offset="100%" style="stop-color:${colors[1]}">
        <animate attributeName="stop-color" values="${colors[1]};${colors[2]};${colors[1]}" dur="${duration}s" repeatCount="indefinite"/>
      </stop>
    </linearGradient>

    <filter id="blur">
      <feGaussianBlur stdDeviation="2"/>
    </filter>

    <filter id="glow">
      <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
      <feMerge>
        <feMergeNode in="coloredBlur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>

  <!-- Background -->
  <rect width="100%" height="100%" fill="url(#bgGrad)"/>

  <!-- Animated elements -->
  ${frames.join('')}

  <!-- Central shape -->
  <g filter="url(#glow)">
    <circle cx="50%" cy="50%" r="40" fill="${colors[3]}" opacity="0.7">
      <animate attributeName="cx" values="${width * 0.3};${width * 0.7};${width * 0.3}" dur="${duration / 2}s" repeatCount="indefinite"/>
      <animate attributeName="cy" values="${height * 0.4};${height * 0.6};${height * 0.4}" dur="${duration / 3}s" repeatCount="indefinite"/>
    </circle>
  </g>

  <!-- Particle effects -->
  ${motionEffects.map((effect, i) => `
    <circle cx="${effect.x * width}" cy="${effect.y * height}" r="${effect.r}" fill="${colors[(i + 2) % colors.length]}" opacity="0.5">
      <animate attributeName="opacity" values="0.2;0.8;0.2" dur="${1 + i * 0.2}s" repeatCount="indefinite"/>
      <animate attributeName="r" values="${effect.r};${effect.r * 1.5};${effect.r}" dur="${1 + i * 0.3}s" repeatCount="indefinite"/>
    </circle>
  `).join('')}

  <!-- Video player UI overlay -->
  <g id="video-ui" opacity="0.9">
    <!-- Play button circle -->
    <circle cx="${width / 2}" cy="${height / 2}" r="25" fill="rgba(255,255,255,0.2)"/>
    <polygon points="${width / 2 - 8},${height / 2 - 12} ${width / 2 - 8},${height / 2 + 12} ${width / 2 + 12},${height / 2}" fill="white"/>

    <!-- Duration badge -->
    <rect x="${width - 60}" y="${height - 30}" width="50" height="20" rx="4" fill="rgba(0,0,0,0.7)"/>
    <text x="${width - 35}" y="${height - 16}" text-anchor="middle" font-family="Arial" font-size="11" fill="white">${duration}s</text>

    <!-- Resolution badge -->
    <rect x="10" y="${height - 30}" width="50" height="20" rx="4" fill="rgba(0,0,0,0.7)"/>
    <text x="35" y="${height - 16}" text-anchor="middle" font-family="Arial" font-size="10" fill="white">${resolution}</text>

    <!-- AionX branding -->
    <text x="${width / 2}" y="25" text-anchor="middle" font-family="Arial" font-size="12" fill="rgba(255,255,255,0.6)">AionX Video Preview</text>
  </g>

  <!-- Prompt text -->
  <text x="10" y="${height - 45}" font-family="Arial" font-size="9" fill="rgba(255,255,255,0.4)">
    ${prompt.substring(0, 50)}${prompt.length > 50 ? '...' : ''}
  </text>
</svg>`;

    return Buffer.from(svg);
  }

  extractColors(prompt) {
    const colorMap = {
      sunset: ['#FF6B35', '#F7931E', '#FFD23F', '#FF8551', '#FFA07A'],
      ocean: ['#0077B6', '#00B4D8', '#90E0EF', '#CAF0F8', '#03045E'],
      forest: ['#2D6A4F', '#40916C', '#52B788', '#74C69D', '#1B4332'],
      night: ['#1A1A2E', '#16213E', '#0F3460', '#E94560', '#533483'],
      space: ['#0B0B3B', '#1C1C4E', '#2E2E7A', '#6366F1', '#818CF8'],
      golden: ['#FFD700', '#FFA500', '#FF8C00', '#DAA520', '#B8860B'],
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

  getMotionEffects(motionStyle) {
    const effects = {
      cinematic: [
        { x: 0.2, y: 0.3, r: 4 },
        { x: 0.8, y: 0.7, r: 3 },
        { x: 0.5, y: 0.2, r: 5 }
      ],
      dynamic: [
        { x: 0.1, y: 0.5, r: 6 },
        { x: 0.9, y: 0.5, r: 5 },
        { x: 0.5, y: 0.1, r: 4 },
        { x: 0.5, y: 0.9, r: 4 }
      ],
      gentle: [
        { x: 0.3, y: 0.6, r: 3 },
        { x: 0.7, y: 0.4, r: 3 }
      ],
      default: [
        { x: 0.25, y: 0.25, r: 4 },
        { x: 0.75, y: 0.75, r: 4 }
      ]
    };

    return effects[motionStyle] || effects.default;
  }

  createThumbnail(prompt) {
    const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="320" height="180" viewBox="0 0 320 180">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#1a1a2e"/>
      <stop offset="100%" style="stop-color:#16213e"/>
    </linearGradient>
  </defs>
  <rect width="100%" height="100%" fill="url(#bg)"/>

  <!-- Play button circle -->
  <circle cx="160" cy="90" r="30" fill="rgba(255,255,255,0.2)"/>
  <polygon points="155,75 155,105 180,90" fill="white"/>

  <!-- Duration badge -->
  <rect x="260" y="145" width="50" height="20" rx="4" fill="rgba(0,0,0,0.7)"/>
  <text x="285" y="159" text-anchor="middle" font-family="Arial" font-size="11" fill="white">6s</text>

  <!-- Prompt preview -->
  <text x="10" y="170" font-family="Arial" font-size="10" fill="rgba(255,255,255,0.5)">
    ${prompt.substring(0, 40)}...
  </text>
</svg>`;

    return Buffer.from(svg);
  }
}

export const videoGenerationService = new VideoGenerationService();
export default VideoGenerationService;
