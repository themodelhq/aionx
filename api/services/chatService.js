import { config } from '../utils/config.js';

class ChatGenerationService {
  constructor() {
    this.systemPrompt = `You are AionX, an advanced AI creative assistant. You can help with anything - answer questions, write content, explain concepts, help with code, creative writing, analysis, and more. You also have access to image generation, video creation, and text-to-speech tools on this platform. Be helpful, concise, and engaging.`;
  }

  async process({ userId, message, history = [], isPremium = false }) {
    try {
      // Re-read key at call time to avoid module cache issues
      const groqKey = process.env.GROQ_API_KEY || config.GROQ_API_KEY;

      console.log(`[Chat] Processing message. GROQ key present: ${!!groqKey}, length: ${groqKey?.length}`);

      if (!groqKey) {
        throw new Error('GROQ_API_KEY is not configured on the server.');
      }

      const conversationHistory = history.map(h => ({
        role: h.role,
        content: h.content
      }));

      const messages = [
        { role: 'system', content: this.systemPrompt },
        ...conversationHistory.slice(-10),
        { role: 'user', content: message }
      ];

      const response = await this.callGroq(messages, groqKey);
      return {
        message: response,
        attachments: [],
        generationRequest: this.detectGenerationRequest(message) || null
      };
    } catch (error) {
      console.error('[Chat] Error:', error.message);
      throw error;
    }
  }

  async callGroq(messages, apiKey) {
    const model = process.env.GROQ_MODEL || config.GROQ_MODEL || 'llama3-8b-8192';
    console.log(`[Chat] Calling Groq with model: ${model}`);

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model,
        messages,
        max_tokens: 2048,
        temperature: 0.7
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Groq API error ${response.status}: ${errorData.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) throw new Error('No content returned from Groq');

    console.log(`[Chat] Groq responded successfully`);
    return content;
  }

  detectGenerationRequest(message) {
    const lowerMessage = message.toLowerCase();

    const imageKeywords = ['create image', 'generate image', 'make image', 'draw', 'show me', 'visual of', 'picture of'];
    if (imageKeywords.some(kw => lowerMessage.includes(kw))) {
      return { type: 'image', prompt: message };
    }

    const videoKeywords = ['create video', 'generate video', 'make video', 'animate', 'video of'];
    if (videoKeywords.some(kw => lowerMessage.includes(kw))) {
      return { type: 'video', prompt: message };
    }

    const audioKeywords = ['speak this', 'say this', 'read this', 'text to speech', 'tts', 'convert to audio'];
    if (audioKeywords.some(kw => lowerMessage.includes(kw))) {
      return { type: 'audio', text: message };
    }

    return null;
  }
}

export const chatGenerationService = new ChatGenerationService();
export default ChatGenerationService;
