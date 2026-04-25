import { config } from '../utils/config.js';

class ChatGenerationService {
  constructor() {
    this.systemPrompt = `You are AionX, an advanced AI creative assistant. You can help with anything - answer questions, write content, explain concepts, help with code, creative writing, analysis, and more. You also have access to image generation, video creation, and text-to-speech tools on this platform. Be helpful, concise, and engaging.`;
  }

  async process({ userId, message, history = [], isPremium = false }) {
    try {
      const conversationHistory = history.map(h => ({
        role: h.role,
        content: h.content
      }));

      const messages = [
        { role: 'system', content: this.systemPrompt },
        ...conversationHistory.slice(-10),
        { role: 'user', content: message }
      ];

      if (config.GROQ_API_KEY) {
        try {
          const response = await this.callGroq(messages);
          return {
            message: response,
            attachments: [],
            generationRequest: this.detectGenerationRequest(message) || null
          };
        } catch (apiError) {
          console.error('Groq API error:', apiError.message);
        }
      }

      // Fallback
      return {
        message: "I'm sorry, I'm unable to respond right now. Please ensure the GROQ_API_KEY is set on the server.",
        attachments: [],
        generationRequest: null
      };
    } catch (error) {
      console.error('Chat processing error:', error);
      throw error;
    }
  }

  async callGroq(messages) {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: config.GROQ_MODEL,
        messages,
        max_tokens: 2048,
        temperature: 0.7
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `Groq API error: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || 'I could not generate a response.';
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
