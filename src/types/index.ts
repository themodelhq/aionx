export interface User {
  id: string;
  email: string;
  displayName: string;
  avatarUrl?: string;
  isPremium: boolean;
  credits: number;
  createdAt?: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface Generation {
  id: string;
  user_id: string;
  type: 'image' | 'video' | 'audio' | 'chat';
  prompt?: string;
  parameters?: Record<string, unknown>;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  result_url?: string;
  thumbnail_url?: string;
  error_message?: string;
  credits_used: number;
  created_at: string;
  completed_at?: string;
}

export interface ChatMessage {
  id: string;
  user_id: string;
  session_id?: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  attachments?: string[];
  created_at: string;
}

export interface GenerationRequest {
  prompt: string;
  style?: string;
  aspectRatio?: string;
  quality?: string;
  numImages?: number;
}

export interface VideoRequest {
  prompt: string;
  imageUrl?: string;
  duration?: number;
  resolution?: string;
  motionStyle?: string;
}

export interface AudioRequest {
  text: string;
  voice?: string;
  speed?: number;
  emotion?: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}
