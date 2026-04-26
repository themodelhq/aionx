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
      const fishKey = process.env.FISH_AUDIO_API_KEY || config.FISH_AUDIO_API_KEY;
      console.log(`[Audio] Generating. Fish Audio key present: ${!!fishKey}, length: ${fishKey?.length}`);

      if (!fishKey) {
        throw new Error('FISH_AUDIO_API_KEY is not configured on the server.');
      }

      const filename = `${id}.mp3`;
      const filepath = join(this.outputDir, filename);

      const audioBuffer = await this.generateWithFishAudio(text, voice, speed, emotion, fishKey);
      writeFileSync(filepath, audioBuffer);

      const resultUrl = `/uploads/generated/audio/${filename}`;
      console.log(`✓ Audio generated via Fish Audio: "${text.substring(0, 50)}..."`);

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

  async generateWithFishAudio(text, voice, speed, emotion, fishKey) {
    // Map emotion to Fish Audio tags
    const emotionTagMap = {
      happy: '[happy]',
      sad: '[sad]',
      excited: '[excited]',
      calm: '[calm]',
      angry: '[angry]',
      neutral: ''
    };

    const emotionTag = emotionTagMap[emotion] || '';
    const taggedText = emotionTag ? `${emotionTag} ${text}` : text;

    // Map voice names to Fish Audio reference IDs (community voices)
    // Users can override with their own FISH_AUDIO_VOICE_ID env var
    const voiceId = process.env.FISH_AUDIO_VOICE_ID || config.FISH_AUDIO_VOICE_ID || null;

    const body = {
      text: taggedText,
      format: 'mp3',
      mp3_bitrate: 128,
      sample_rate: 44100,
      normalize: true,
      latency: 'normal',
      prosody: {
        speed: Math.max(0.5, Math.min(2.0, speed)),
        volume: 0,
        normalize_loudness: true
      }
    };

    if (voiceId) {
      body.reference_id = voiceId;
    }

    console.log(`[Audio] Calling Fish Audio TTS API, voice: ${voiceId || 'default'}, emotion: ${emotion}`);

    const response = await fetch('https://api.fish.audio/v1/tts', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${fishKey}`,
        'Content-Type': 'application/json',
        'model': 's2-pro'
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Fish Audio TTS error: ${response.status} - ${errorData.message || errorData.error || JSON.stringify(errorData)}`);
    }

    console.log(`[Audio] Fish Audio TTS responded successfully`);
    return Buffer.from(await response.arrayBuffer());
  }

  estimateDuration(text, speed) {
    const words = text.split(/\s+/).length;
    const minutes = words / 150;
    return Math.round((minutes * 60) / speed);
  }
}

export const audioGenerationService = new AudioGenerationService();
export default AudioGenerationService;
