import { config } from '../utils/config.js';
import { ensureDirSync } from '../utils/helpers.js';
import { join } from 'path';
import { writeFileSync } from 'fs';

// Free Audio Generation using Browser Web Speech API
// This is completely free - no API keys needed!
// The frontend uses the Web Speech API directly

class AudioGenerationService {
  constructor() {
    this.outputDir = join(config.DATA_DIR, 'generated', 'audio');
    ensureDirSync(this.outputDir);
  }

  async generate({ id, text, voice = 'default', speed = 1, emotion = 'neutral' }) {
    try {
      // For Web Speech API, we don't generate files on the server
      // The frontend handles TTS directly using browser's speechSynthesis
      // This endpoint primarily logs the generation for tracking

      const filename = `${id}.json`;
      const filepath = join(this.outputDir, filename);

      // Save generation metadata
      const metadata = {
        id,
        text,
        voice,
        speed,
        emotion,
        generatedAt: new Date().toISOString(),
        method: 'browser-web-speech-api', // Indicates client-side generation
        note: 'Audio generated using browser Web Speech API - no server processing needed'
      };

      writeFileSync(filepath, JSON.stringify(metadata, null, 2));

      console.log(`✓ Audio generation initiated: "${text.substring(0, 50)}..." (voice: ${voice}, speed: ${speed}x)`);

      return {
        url: null, // No server URL - frontend handles playback
        duration: this.estimateDuration(text, speed),
        voice,
        speed,
        emotion,
        method: 'browser'
      };
    } catch (error) {
      console.error(`✗ Audio generation failed:`, error.message);
      throw error;
    }
  }

  // Alternative: Generate audio using FreeTTS or other free services if needed
  // This is kept as a fallback option
  async generateWithFreeTTS({ id, text, voice = 'default', speed = 1 }) {
    // Note: FreeTTS and similar services have limitations
    // For a truly free solution, Web Speech API is recommended

    const filename = `${id}.mp3`;
    const filepath = join(this.outputDir, filename);

    // Placeholder for future free TTS implementation
    const placeholderContent = Buffer.from(JSON.stringify({
      id,
      text,
      voice,
      speed,
      note: 'Browser Web Speech API is recommended for free TTS'
    }));

    writeFileSync(filepath, placeholderContent);

    return {
      url: `/uploads/generated/audio/${filename}`,
      duration: this.estimateDuration(text, speed),
      voice,
      speed
    };
  }

  estimateDuration(text, speed) {
    // Rough estimate: ~150 words per minute at 1x speed
    const words = text.split(/\s+/).length;
    const minutes = words / 150;
    return Math.round(minutes * 60 / speed);
  }

  // Available voices for Web Speech API
  // These are browser-dependent voices
  getAvailableVoices() {
    return [
      // English voices
      { id: 'default', name: 'Default Voice', gender: 'neutral', language: 'en-US', browser: true },
      { id: 'samantha', name: 'Samantha', gender: 'female', language: 'en-US', browser: true },
      { id: 'daniel', name: 'Daniel', gender: 'male', language: 'en-GB', browser: true },
      { id: 'google-us-english', name: 'Google US English', gender: 'neutral', language: 'en-US', browser: true },
      { id: 'google-uk-english', name: 'Google UK English', gender: 'neutral', language: 'en-GB', browser: true },

      // Multilingual voices
      { id: 'microsoft-david', name: 'Microsoft David', gender: 'male', language: 'en-US', browser: true },
      { id: 'microsoft-zira', name: 'Microsoft Zira', gender: 'female', language: 'en-US', browser: true },
      { id: 'google-es', name: 'Google Spanish', gender: 'neutral', language: 'es-ES', browser: true },
      { id: 'google-fr', name: 'Google French', gender: 'neutral', language: 'fr-FR', browser: true },
      { id: 'google-de', name: 'Google German', gender: 'neutral', language: 'de-DE', browser: true },
      { id: 'google-zh', name: 'Google Chinese', gender: 'neutral', language: 'zh-CN', browser: true },
      { id: 'google-ja', name: 'Google Japanese', gender: 'neutral', language: 'ja-JP', browser: true },
      { id: 'google-ko', name: 'Google Korean', gender: 'neutral', language: 'ko-KR', browser: true },

      // Style variations
      { id: 'male-standard', name: 'Male (Standard)', gender: 'male', language: 'en-US', browser: true },
      { id: 'female-standard', name: 'Female (Standard)', gender: 'female', language: 'en-US', browser: true },
      { id: 'male-slow', name: 'Male (Slow)', gender: 'male', language: 'en-US', browser: true, rate: 0.8 },
      { id: 'female-expressive', name: 'Female (Expressive)', gender: 'female', language: 'en-US', browser: true }
    ];
  }

  // Voice settings mapping for Web Speech API
  getVoiceSettings() {
    return {
      pitch: {
        min: 0,
        max: 2,
        default: 1
      },
      rate: {
        min: 0.1,
        max: 10,
        default: 1,
        labels: {
          0.5: 'Very Slow',
          0.75: 'Slow',
          1: 'Normal',
          1.25: 'Fast',
          1.5: 'Very Fast',
          2: 'Super Fast'
        }
      },
      volume: {
        min: 0,
        max: 1,
        default: 1
      }
    };
  }

  // Available emotions/effects
  // Web Speech API doesn't support emotions directly, but we can adjust pitch/rate
  getAvailableEmotions() {
    return [
      { id: 'neutral', name: 'Neutral', description: 'Balanced and professional', pitch: 1, rate: 1 },
      { id: 'happy', name: 'Happy', description: 'Cheerful and upbeat', pitch: 1.2, rate: 1.1 },
      { id: 'sad', name: 'Sad', description: 'Melancholic and somber', pitch: 0.8, rate: 0.9 },
      { id: 'excited', name: 'Excited', description: 'Energetic and enthusiastic', pitch: 1.3, rate: 1.3 },
      { id: 'calm', name: 'Calm', description: 'Relaxed and soothing', pitch: 0.9, rate: 0.85 },
      { id: 'serious', name: 'Serious', description: 'Formal and authoritative', pitch: 0.95, rate: 0.95 }
    ];
  }
}

export const audioGenerationService = new AudioGenerationService();
export default AudioGenerationService;
