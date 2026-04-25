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
      // Re-read key at call time to avoid module cache issues
      const geminiKey = process.env.GEMINI_API_KEY || config.GEMINI_API_KEY;
      console.log(`[Audio] Generating. Gemini key present: ${!!geminiKey}, length: ${geminiKey?.length}`);

      if (!geminiKey) {
        throw new Error('GEMINI_API_KEY is not configured on the server.');
      }

      const filename = `${id}.mp3`;
      const filepath = join(this.outputDir, filename);

      const audioBuffer = await this.generateWithGeminiTTS(text, voice, speed, emotion, geminiKey);
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
    } catch (error) {
      console.error(`✗ Audio generation failed:`, error.message);
      throw error;
    }
  }

  async generateWithGeminiTTS(text, voice, speed, emotion, geminiKey) {
    const voiceMap = {
      default: { name: 'en-US-Journey-F', gender: 'FEMALE' },
      female: { name: 'en-US-Journey-F', gender: 'FEMALE' },
      male: { name: 'en-US-Journey-D', gender: 'MALE' },
      'female-standard': { name: 'en-US-Neural2-F', gender: 'FEMALE' },
      'male-standard': { name: 'en-US-Neural2-D', gender: 'MALE' },
      samantha: { name: 'en-US-Journey-F', gender: 'FEMALE' },
      daniel: { name: 'en-GB-Journey-D', gender: 'MALE' }
    };

    const emotionPitch = {
      neutral: 0, happy: 2, sad: -2, excited: 4, calm: -1, serious: -1
    };

    const selectedVoice = voiceMap[voice] || voiceMap.default;
    const pitch = emotionPitch[emotion] ?? 0;

    console.log(`[Audio] Calling Gemini TTS with voice: ${selectedVoice.name}, speed: ${speed}, pitch: ${pitch}`);

    const response = await fetch(
      `https://texttospeech.googleapis.com/v1/text:synthesize?key=${geminiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          input: { text },
          voice: {
            languageCode: selectedVoice.name.substring(0, 5),
            name: selectedVoice.name,
            ssmlGender: selectedVoice.gender
          },
          audioConfig: {
            audioEncoding: 'MP3',
            speakingRate: Math.max(0.25, Math.min(4.0, speed)),
            pitch,
            effectsProfileId: ['headphone-class-device']
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

    console.log(`[Audio] Gemini TTS responded successfully`);
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
