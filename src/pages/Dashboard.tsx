import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send,
  Image,
  Video,
  Mic,
  Loader2,
  Sparkles,
  X,
  Download,
  RefreshCw,
  Trash2,
  Volume2,
  Play,
  Pause
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useChatStore } from '@/store/chatStore';
import { chatApi, generationsApi } from '@/utils/api';
import type { ChatMessage, Generation } from '@/types';

const generationModes = [
  { id: 'chat', label: 'Chat', icon: Sparkles, color: 'from-cyan-500 to-blue-500' },
  { id: 'image', label: 'Image', icon: Image, color: 'from-pink-500 to-rose-500' },
  { id: 'video', label: 'Video', icon: Video, color: 'from-violet-500 to-purple-500' },
  { id: 'audio', label: 'Audio', icon: Mic, color: 'from-emerald-500 to-teal-500' },
];

const imageStyles = [
  { id: 'realistic', label: 'Realistic' },
  { id: 'anime', label: 'Anime' },
  { id: 'digital', label: 'Digital Art' },
  { id: 'oil', label: 'Oil Painting' },
  { id: '3d', label: '3D Render' },
];

const aspectRatios = [
  { id: '1:1', label: 'Square' },
  { id: '16:9', label: 'Landscape' },
  { id: '9:16', label: 'Portrait' },
  { id: '4:3', label: 'Standard' },
];

const videoStyles = [
  { id: 'cinematic', label: 'Cinematic' },
  { id: 'dynamic', label: 'Dynamic' },
  { id: 'gentle', label: 'Gentle' },
  { id: 'dramatic', label: 'Dramatic' },
];

const voices = [
  { id: 'default', label: 'AionX Voice' },
  { id: 'male-standard', label: 'James (Male)' },
  { id: 'female-standard', label: 'Emma (Female)' },
];

export default function Dashboard() {
  const [input, setInput] = useState('');
  const [mode, setMode] = useState('chat');
  const [isTyping, setIsTyping] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [playingAudio, setPlayingAudio] = useState<string | null>(null);

  // Options based on mode
  const [imageStyle, setImageStyle] = useState('realistic');
  const [aspectRatio, setAspectRatio] = useState('1:1');
  const [videoStyle, setVideoStyle] = useState('cinematic');
  const [selectedVoice, setSelectedVoice] = useState('default');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  const { user } = useAuthStore();
  const { messages, addMessage, setTyping, generations, addGeneration, updateGeneration, clearChat } = useChatStore();

  // Clear chat when mode changes
  const handleModeChange = (newMode: string) => {
    setMode(newMode);
    clearChat();
    setInput('');
    setShowOptions(false);
  };

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Load initial history
  useEffect(() => {
    const loadHistory = async () => {
      try {
        const response = await chatApi.getHistory({ limit: 50 });
        if (response.data.success) {
          // Set messages from history
        }
      } catch (error) {
        console.error('Failed to load chat history:', error);
      }
    };
    loadHistory();
  }, []);

  const handleSend = async () => {
    if (!input.trim() || isTyping) return;

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      user_id: user?.id || '',
      role: 'user',
      content: input,
      created_at: new Date().toISOString(),
    };

    addMessage(userMessage);
    const messageText = input;
    setInput('');
    setIsTyping(true);

    try {
      if (mode === 'chat') {
        const response = await chatApi.send({ message: messageText });

        if (response.data.success) {
          addMessage(response.data.data.message);
        }
      } else if (mode === 'image') {
        setIsGenerating(true);
        const response = await generationsApi.createImage({
          prompt: messageText,
          style: imageStyle,
          aspectRatio,
        });

        if (response.data.success) {
          const gen: Generation = {
            id: response.data.data.generationId,
            user_id: user?.id || '',
            type: 'image',
            prompt: messageText,
            parameters: { style: imageStyle, aspectRatio },
            status: 'processing',
            credits_used: 2,
            created_at: new Date().toISOString(),
          };
          addGeneration(gen);

          // Add confirmation message
          addMessage({
            id: crypto.randomUUID(),
            user_id: user?.id || '',
            role: 'assistant',
            content: `I'm creating your image: "${messageText.slice(0, 50)}..."\n\nStyle: ${imageStyle}\nAspect: ${aspectRatio}`,
            created_at: new Date().toISOString(),
          });

          // Poll for completion
          pollGenerationStatus(response.data.data.generationId);
        }
      } else if (mode === 'video') {
        setIsGenerating(true);
        const response = await generationsApi.createVideo({
          prompt: messageText,
          motionStyle: videoStyle,
        });

        if (response.data.success) {
          const gen: Generation = {
            id: response.data.data.generationId,
            user_id: user?.id || '',
            type: 'video',
            prompt: messageText,
            parameters: { motionStyle: videoStyle },
            status: 'processing',
            credits_used: 5,
            created_at: new Date().toISOString(),
          };
          addGeneration(gen);

          addMessage({
            id: crypto.randomUUID(),
            user_id: user?.id || '',
            role: 'assistant',
            content: `Creating your video: "${messageText.slice(0, 50)}..."\n\nMotion: ${videoStyle}`,
            created_at: new Date().toISOString(),
          });

          pollGenerationStatus(response.data.data.generationId);
        }
      } else if (mode === 'audio') {
        setIsGenerating(true);
        const response = await generationsApi.createAudio({
          text: messageText,
          voice: selectedVoice,
        });

        if (response.data.success) {
          const gen: Generation = {
            id: response.data.data.generationId,
            user_id: user?.id || '',
            type: 'audio',
            prompt: messageText.slice(0, 50),
            parameters: { voice: selectedVoice },
            status: 'processing',
            credits_used: 1,
            created_at: new Date().toISOString(),
          };
          addGeneration(gen);

          addMessage({
            id: crypto.randomUUID(),
            user_id: user?.id || '',
            role: 'assistant',
            content: `Converting your text to speech...\n\nVoice: ${voices.find(v => v.id === selectedVoice)?.label}`,
            created_at: new Date().toISOString(),
          });

          pollGenerationStatus(response.data.data.generationId);
        }
      }
    } catch (error: any) {
      addMessage({
        id: crypto.randomUUID(),
        user_id: user?.id || '',
        role: 'assistant',
        content: `Sorry, something went wrong: ${error.response?.data?.error?.message || 'Please try again.'}`,
        created_at: new Date().toISOString(),
      });
    } finally {
      setIsTyping(false);
      setIsGenerating(false);
    }
  };

  const pollGenerationStatus = async (generationId: string) => {
    const poll = async () => {
      try {
        const response = await generationsApi.getStatus(generationId);
        if (response.data.success) {
          const { status, resultUrl, thumbnailUrl, errorMessage } = response.data.data;

          updateGeneration(generationId, {
            status,
            result_url: resultUrl,
            thumbnail_url: thumbnailUrl,
          });

          if (status === 'completed') {
            addMessage({
              id: crypto.randomUUID(),
              user_id: user?.id || '',
              role: 'assistant',
              content: `Your ${generationId.includes('image') ? 'image' : generationId.includes('video') ? 'video' : 'audio'} is ready!`,
              attachments: [resultUrl],
              created_at: new Date().toISOString(),
            });
            setIsGenerating(false);
          } else if (status === 'failed') {
            addMessage({
              id: crypto.randomUUID(),
              user_id: user?.id || '',
              role: 'assistant',
              content: `Generation failed: ${errorMessage}`,
              created_at: new Date().toISOString(),
            });
            setIsGenerating(false);
          } else {
            setTimeout(poll, 2000);
          }
        }
      } catch (error) {
        setTimeout(poll, 2000);
      }
    };
    poll();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const toggleAudio = (url: string) => {
    if (playingAudio === url) {
      audioRef.current?.pause();
      setPlayingAudio(null);
    } else {
      if (audioRef.current) {
        audioRef.current.src = url;
        audioRef.current.play();
        setPlayingAudio(url);
      }
    }
  };

  const currentModeConfig = generationModes.find((m) => m.id === mode);
  const CurrentModeIcon = currentModeConfig?.icon ?? null;

  return (
    <div className="h-[calc(100vh-64px)] flex flex-col">
      {/* Mode selector */}
      <div className="px-6 py-4 border-b border-white/5">
        <div className="max-w-4xl mx-auto flex items-center gap-2">
          {generationModes.map((m) => {
            const MIcon = m.icon;
            return (
            <button
              key={m.id}
              onClick={() => handleModeChange(m.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                mode === m.id
                  ? `bg-gradient-to-r ${m.color} text-white shadow-lg`
                  : 'text-text-secondary hover:text-white hover:bg-white/5'
              }`}
            >
              <MIcon className="w-4 h-4" />
              <span className="hidden sm:inline">{m.label}</span>
            </button>
            );
          })}

          <div className="flex-1" />

          <button
            onClick={() => setShowOptions(!showOptions)}
            className={`px-3 py-2 rounded-lg transition-all ${
              showOptions ? 'bg-white/10 text-white' : 'text-text-secondary hover:text-white'
            }`}
          >
            <Sparkles className="w-4 h-4" />
          </button>
        </div>

        {/* Options panel */}
        <AnimatePresence>
          {showOptions && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="pt-4 space-y-4 max-w-4xl mx-auto">
                {mode === 'image' && (
                  <>
                    <div>
                      <label className="block text-sm text-text-secondary mb-2">Style</label>
                      <div className="flex flex-wrap gap-2">
                        {imageStyles.map((s) => (
                          <button
                            key={s.id}
                            onClick={() => setImageStyle(s.id)}
                            className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
                              imageStyle === s.id
                                ? 'bg-accent-primary text-white'
                                : 'bg-bg-tertiary text-text-secondary hover:text-white'
                            }`}
                          >
                            {s.label}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm text-text-secondary mb-2">Aspect Ratio</label>
                      <div className="flex flex-wrap gap-2">
                        {aspectRatios.map((r) => (
                          <button
                            key={r.id}
                            onClick={() => setAspectRatio(r.id)}
                            className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
                              aspectRatio === r.id
                                ? 'bg-accent-secondary text-bg-primary'
                                : 'bg-bg-tertiary text-text-secondary hover:text-white'
                            }`}
                          >
                            {r.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {mode === 'video' && (
                  <div>
                    <label className="block text-sm text-text-secondary mb-2">Motion Style</label>
                    <div className="flex flex-wrap gap-2">
                      {videoStyles.map((s) => (
                        <button
                          key={s.id}
                          onClick={() => setVideoStyle(s.id)}
                          className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
                            videoStyle === s.id
                              ? 'bg-accent-primary text-white'
                              : 'bg-bg-tertiary text-text-secondary hover:text-white'
                          }`}
                        >
                          {s.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {mode === 'audio' && (
                  <div>
                    <label className="block text-sm text-text-secondary mb-2">Voice</label>
                    <div className="flex flex-wrap gap-2">
                      {voices.map((v) => (
                        <button
                          key={v.id}
                          onClick={() => setSelectedVoice(v.id)}
                          className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
                            selectedVoice === v.id
                              ? 'bg-accent-primary text-white'
                              : 'bg-bg-tertiary text-text-secondary hover:text-white'
                          }`}
                        >
                          {v.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-6 py-8">
          {messages.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-16"
            >
              {/* Welcome card */}
              <div className="inline-flex items-center gap-3 px-6 py-3 rounded-2xl bg-gradient-primary/10 border border-accent-primary/20 mb-6">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${currentModeConfig?.color} p-2`}>
                  {CurrentModeIcon && <CurrentModeIcon className="w-full h-full text-white" />}
                </div>
                <div className="text-left">
                  <p className="font-semibold">{currentModeConfig?.label} Mode</p>
                  <p className="text-sm text-text-secondary">
                    {mode === 'chat' && 'Ask me anything or request content creation'}
                    {mode === 'image' && 'Describe the image you want to create'}
                    {mode === 'video' && 'Describe the video scene you want'}
                    {mode === 'audio' && 'Enter text to convert to speech'}
                  </p>
                </div>
              </div>

              {/* Example prompts */}
              <div className="flex flex-wrap justify-center gap-2 mt-8">
                {mode === 'chat' && [
                  'Help me brainstorm a logo design',
                  'Write a short story opening',
                  'Explain quantum computing',
                ].map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => setInput(prompt)}
                    className="px-4 py-2 rounded-full bg-bg-tertiary text-text-secondary text-sm hover:text-white hover:bg-bg-elevated transition-all"
                  >
                    {prompt}
                  </button>
                ))}
                {mode === 'image' && [
                  'A futuristic city at sunset',
                  'Portrait of a cyberpunk warrior',
                  'Serene Japanese garden',
                ].map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => setInput(prompt)}
                    className="px-4 py-2 rounded-full bg-bg-tertiary text-text-secondary text-sm hover:text-white hover:bg-bg-elevated transition-all"
                  >
                    {prompt}
                  </button>
                ))}
                {mode === 'video' && [
                  'Ocean waves crashing on beach',
                  'Northern lights in Iceland',
                  'Time-lapse of a flower blooming',
                ].map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => setInput(prompt)}
                    className="px-4 py-2 rounded-full bg-bg-tertiary text-text-secondary text-sm hover:text-white hover:bg-bg-elevated transition-all"
                  >
                    {prompt}
                  </button>
                ))}
                {mode === 'audio' && [
                  'Welcome to our platform',
                  'Breaking news update',
                  'Your order has been confirmed',
                ].map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => setInput(prompt)}
                    className="px-4 py-2 rounded-full bg-bg-tertiary text-text-secondary text-sm hover:text-white hover:bg-bg-elevated transition-all"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* Chat messages */}
          {messages.map((message, index) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`flex gap-4 mb-6 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {message.role === 'assistant' && (
                <div className="w-8 h-8 rounded-lg bg-gradient-primary flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
              )}

              <div className={`max-w-[80%] ${message.role === 'user' ? 'order-1' : ''}`}>
                <div
                  className={`chat-bubble ${
                    message.role === 'user' ? 'chat-bubble-user' : 'chat-bubble-assistant'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{message.content}</p>
                </div>

                {/* Attachments */}
                {message.attachments && message.attachments.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {message.attachments.map((attachment, i) => (
                      <div key={i} className="relative rounded-xl overflow-hidden bg-bg-tertiary">
                        {attachment.endsWith('.mp3') || attachment.endsWith('.wav') ? (
                          <div className="p-4 flex items-center gap-4">
                            <button
                              onClick={() => toggleAudio(attachment)}
                              className="w-10 h-10 rounded-full bg-accent-primary flex items-center justify-center"
                            >
                              {playingAudio === attachment ? (
                                <Pause className="w-5 h-5 text-white" />
                              ) : (
                                <Play className="w-5 h-5 text-white ml-0.5" />
                              )}
                            </button>
                            <div className="flex-1">
                              <div className="h-1 rounded-full bg-bg-elevated overflow-hidden">
                                <div className="h-full w-1/3 bg-accent-primary rounded-full" />
                              </div>
                            </div>
                            <button className="p-2 hover:bg-white/5 rounded-lg transition-colors">
                              <Download className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <img
                            src={attachment}
                            alt="Generated content"
                            className="w-full max-w-md"
                          />
                        )}
                      </div>
                    ))}
                  </div>
                )}

                <p className="text-xs text-text-muted mt-2">
                  {new Date(message.created_at).toLocaleTimeString()}
                </p>
              </div>

              {message.role === 'user' && (
                <div className="w-8 h-8 rounded-lg bg-bg-tertiary flex items-center justify-center flex-shrink-0 text-sm font-bold">
                  {user?.displayName?.charAt(0).toUpperCase() || 'U'}
                </div>
              )}
            </motion.div>
          ))}

          {/* Typing indicator */}
          {(isTyping || isGenerating) && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex gap-4 mb-6"
            >
              <div className="w-8 h-8 rounded-lg bg-gradient-primary flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <div className="chat-bubble chat-bubble-assistant">
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-accent-primary" />
                  <span className="text-text-secondary">
                    {isGenerating ? 'Creating your content...' : 'Thinking...'}
                  </span>
                </div>
              </div>
            </motion.div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Audio element */}
      <audio ref={audioRef} onEnded={() => setPlayingAudio(null)} />

      {/* Input area */}
      <div className="px-6 py-4 border-t border-white/5">
        <div className="max-w-4xl mx-auto">
          <div className="relative flex items-end gap-3">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                mode === 'chat'
                  ? 'Ask me anything...'
                  : mode === 'audio'
                  ? 'Enter text to convert to speech...'
                  : `Describe what you want to ${mode}...`
              }
              className="flex-1 px-4 py-3 pr-12 rounded-xl bg-bg-tertiary border border-white/10 text-white placeholder-text-muted resize-none focus:outline-none focus:border-accent-primary/50 focus:ring-2 focus:ring-accent-primary/20 transition-all"
              rows={1}
              style={{ minHeight: '48px', maxHeight: '120px' }}
            />

            <button
              onClick={handleSend}
              disabled={!input.trim() || isTyping}
              className="absolute right-2 bottom-2 w-9 h-9 rounded-lg bg-gradient-primary flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 transition-transform"
            >
              <Send className="w-4 h-4 text-white" />
            </button>
          </div>

          <p className="text-xs text-text-muted mt-2 text-center">
            {user?.isPremium
              ? 'Unlimited generations'
              : `${user?.credits || 0} credits remaining`}
          </p>
        </div>
      </div>
    </div>
  );
}
