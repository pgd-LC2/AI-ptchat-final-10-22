
import React from 'react';

export type ProviderId = 'openai' | 'anthropic' | 'google' | 'deepseek' | 'auto';

export interface LLMProvider {
  id: ProviderId;
  name: string;
  Icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  models: Array<{ id: string; label: string; description?: string; pricing?: any }>;
  color: string;
  isLoading?: boolean;
  error?: string;
}

export interface OpenRouterModel {
  id: string;
  name: string;
  description?: string;
  context_length?: number;
  created?: number;
  pricing?: {
    prompt: string;
    completion: string;
  };
  top_provider?: {
    context_length: number;
    max_completion_tokens: number;
  };
  supported_parameters?: string[];
}

export interface ProviderModels {
  [providerId: string]: Array<{ id: string; label: string; description?: string; pricing?: any; created?: number }>;
}

export interface MessageImage {
  type: 'image_url';
  url: string;
  alt?: string;
}

export interface Message {
  id: string;
  role: 'system' | 'user' | 'assistant';
  content: string;
  reasoning?: string;
  images?: MessageImage[];
  createdAt: Date;
}

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  providerId: ProviderId;
  modelId: string;
  systemPrompt?: string;
  createdAt: Date;
}

export interface Persona {
  id: string;
  name: string;
  prompt: string;
}

export type ChatRole = 'system' | 'user' | 'assistant';

export interface ChatMessage {
  role: ChatRole;
  content: string;
}

export interface ChatRequest {
  model?: string;
  messages: ChatMessage[];
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
  transforms?: string[];
}

export interface ChatChunk {
  type: 'text' | 'tool' | 'meta' | 'done' | 'error';
  delta?: string;
  usage?: { prompt: number; completion: number; total: number };
  message?: string;
}
