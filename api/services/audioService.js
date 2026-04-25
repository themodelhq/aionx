import { config } from '../utils/config.js';
import { ensureDirSync } from '../utils/helpers.js';
import { join } from 'path';
import { writeFileSync } from 'fs';

class AudioGenerationService {
  constructor() {
    this.outputDir = join(config.UPLOADS_DIR, 'generated', 'audio');
    ensureDirSync(this.outputDir);
  }

  async generate({ id, text, voice = 'default', speed = 1, emotion = 'neutral' }) {
    try {
      const filename = `${id}.mp3`;
      const filepath = join(this.outputDir, filename);

      if (config.GEMINI_API_KEY) {
        try {
          const audioBuffer = await this.generateWithGemini(text, voice, speed);
          writeFileSync(filepath, audioBuffer);
          const resultUrl = `/uploads/generated/audio/${filename}`;
          console.log(`✓ Audio generated via Gemini TTS: "${text.substring(0, 50)}..."`);
          return {
            url: resultUrl,
            duration: this.estimateDuration(text, speed),
            voice,
            speed,
            emotion
          };
        } catch (apiError) {
          console.error('Gemini TTS error:', apiError.message);
        }
      }

      throw new Error('No audio generation API key configured. Please set GEMINI_API_KEY on Render.');
    } catch (error) {
      console.error(`✗ Audio generation failed:`, error.message);
      throw error;
    }
  }

  async generateWithGemini(text, voice, speed) {
    const voiceMap = {
      default: 'en-US-Standard-A',
      male: 'en-US-Standard-B',
      female: 'en-US-Standard-C',
      'male-standard': 'en-US-Standard-D',
      'female-standard': 'en-US-Standard-E'
    };

    const selectedVoice = voiceMap[voice] || voiceMap.default;

    const response = await fetch(
      `https://texttospeech.googleapis.com/v1/text:synthesize?key=${config.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          input: { text },
          voice: {
            languageCode: 'en-US',
            name: selectedVoice
          },
          audioConfig: {
            audioEncoding: 'MP3',
            speakingRate: speed,
            pitch: 0
          }
        })
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Gemini TTS error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    if (!data.audioContent) {
      throw new Error('No audio content returned from Gemini TTS');
    }

    return Buffer.from(data.audioContent, 'base64');
  }

  estimateDuration(text, speed) {
    const words = text.split(/\s+/).length;
    const minutes = words / 150;
    return Math.round((minutes * 60) / speed);
  }
}

export const audioGenerationService = new AudioGenerationService();
export default AudioGenerationService;
