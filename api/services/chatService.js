import { config } from '../utils/config.js';

class ChatGenerationService {
  constructor() {
    this.systemPrompt = `You are AionX, an advanced AI creative assistant built on AionX platform. You have the ability to:
- Generate stunning images from text descriptions
- Create videos from images or text prompts
- Convert text to natural speech with various voices
- Have thoughtful conversations about any topic

When users ask you to create content, acknowledge their request and guide them to use the appropriate generation tools. Be creative, helpful, and inspiring in your responses.

Keep responses concise but meaningful. If a request is ambiguous, ask clarifying questions.`;
  }

  async process({ userId, message, history = [], isPremium = false }) {
    try {
      // Build conversation context
      const conversationHistory = history.map(h => ({
        role: h.role,
        content: h.content
      }));

      // Add system message
      const messages = [
        { role: 'system', content: this.systemPrompt },
        ...conversationHistory.slice(-10),
        { role: 'user', content: message }
      ];

      // Try OpenRouter first, fallback to mock
      if (config.OPENROUTER_API_KEY) {
        try {
          const response = await this.callOpenRouter(messages);
          const generationRequest = this.detectGenerationRequest(message);
          return {
            message: response,
            attachments: [],
            generationRequest: generationRequest || null
          };
        } catch (apiError) {
          console.error('OpenRouter API error:', apiError.message);
        }
      }

      // Fallback to mock response
      const response = await this.generateResponse(messages, isPremium);
      const generationRequest = this.detectGenerationRequest(message);

      return {
        message: response,
        attachments: [],
        generationRequest: generationRequest || null
      };
    } catch (error) {
      console.error('Chat processing error:', error);
      throw error;
    }
  }

  async callOpenRouter(messages) {
    const response = await fetch(config.OPENROUTER_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.OPENROUTER_API_KEY}`,
        'HTTP-Referer': 'https://aionx.app',
        'X-Title': 'AionX AI Platform'
      },
      body: JSON.stringify({
        model: config.OPENROUTER_MODEL,
        messages: messages,
        max_tokens: 2048,
        temperature: 0.7
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `OpenRouter API error: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || 'I apologize, but I could not generate a response.';
  }

  async generateResponse(messages, isPremium) {
    const lastMessage = messages[messages.length - 1].content.toLowerCase();

    if (lastMessage.includes('hello') || lastMessage.includes('hi ')) {
      return `Hello! I'm AionX, your creative AI companion powered by OpenRouter. I'm excited to help you create amazing content!

I can help you with:
🖼️ **Image Generation** - Create stunning visuals from descriptions (powered by Hugging Face)
🎬 **Video Creation** - Bring images to life or generate videos
🔊 **Text-to-Speech** - Convert text to natural audio (browser-based, completely free!)
💬 **Creative Chat** - Brainstorm ideas and have conversations

What would you like to create today?`;
    }

    if (lastMessage.includes('image') || lastMessage.includes('picture') || lastMessage.includes('photo')) {
      return `I love that you're thinking about creating visuals!

To generate an image, just use the Image Generation tool below and describe what you'd like to see. For example:

"A serene mountain landscape at sunset with golden light"

Be as descriptive as you like - mention:
- The subject (landscape, portrait, abstract)
- Style (realistic, anime, oil painting)
- Mood and lighting
- Colors and atmosphere

What image would you like to create?`;
    }

    if (lastMessage.includes('video')) {
      return `Video generation is one of my favorite capabilities! I can create short videos (6-10 seconds) from:

1. **Text descriptions** - Describe the scene you want to animate
2. **Image-to-video** - Upload an image and I'll bring it to life with motion

For best results, describe:
- The visual scene
- The type of motion you want (cinematic, dynamic, gentle)
- The overall mood

Would you like to create a video?`;
    }

    if (lastMessage.includes('voice') || lastMessage.includes('speech') || lastMessage.includes('audio')) {
      return `Text-to-speech is ready! I use the browser's built-in Web Speech API to convert your text into audio - completely free!

You can:
- Type or paste the text you want converted
- Choose from different voices (browser-dependent)
- Adjust the speed (0.5x to 2x)
- Perfect for narrations, podcasts, accessibility content, or creative projects!

What text would you like me to speak?`;
    }

    if (lastMessage.includes('help')) {
      return `I'm here to help! Here's what I can do:

**🎨 Image Generation**
"Create an image of [your description]"

**🎬 Video Generation**
"Make a video of [your description]"
Or upload an image: "Animate this image with [motion type] motion"

**🔊 Text-to-Speech**
"Speak this: [your text]"
Or: "Read this aloud: [your text]"

**💬 Conversations**
Ask me anything - I'm powered by OpenRouter with free models!

What would you like to explore?`;
    }

    if (lastMessage.includes('thank')) {
      return `You're welcome! I'm always here to help bring your creative vision to life.

Feel free to come back anytime - whether you want to generate new content, iterate on existing projects, or just have a chat.

Have a wonderful day! ✨`;
    }

    // Default creative response
    const responses = [
      `That's an interesting thought! I'd love to help you explore this further. Could you tell me more about what you're looking to create or achieve?`,
      `Great question! I'm here to help with creative projects, content generation, or just exploring ideas. What would be most helpful for you right now?`,
      `I appreciate you sharing that. Let me know how I can assist - whether it's generating images, videos, audio, or having a thoughtful conversation.`,
      `Thanks for reaching out! I'm designed to be your creative companion. What exciting project can I help you with today?`
    ];

    return responses[Math.floor(Math.random() * responses.length)];
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

    const audioKeywords = ['speak', 'say', 'read', 'voice', 'speech', 'text to speech', 'tts', 'audio of'];
    if (audioKeywords.some(kw => lowerMessage.includes(kw))) {
      return { type: 'audio', text: message };
    }

    return null;
  }
}

export const chatGenerationService = new ChatGenerationService();
export default ChatGenerationService;
