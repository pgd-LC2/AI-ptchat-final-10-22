// OpenRouter API integration for Supabase Edge Functions
import { ChatRequest, ChatMessage, MessageImage, ProviderModels, OpenRouterModel } from '@/types';

// 获取 Supabase 函数 URL
const getSupabaseFunctionUrl = (functionName: string) => {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  if (!supabaseUrl) {
    throw new Error('VITE_SUPABASE_URL environment variable is not set. Please check your .env file.');
  }
  console.log('Supabase URL:', supabaseUrl);
  return `${supabaseUrl}/functions/v1/${functionName}`;
};

// 获取请求头
const getHeaders = () => {
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  if (!anonKey) {
    throw new Error('VITE_SUPABASE_ANON_KEY environment variable is not set. Please check your .env file.');
  }
  console.log('Supabase Anon Key:', anonKey ? anonKey.substring(0, 20) + '...' : 'undefined');
  
  return {
    'Authorization': `Bearer ${anonKey}`,
    'Content-Type': 'application/json',
  };
};

// 非流式聊天完成
export async function chatCompletion(request: ChatRequest): Promise<any> {
  try {
    const response = await fetch(getSupabaseFunctionUrl('openrouter-chat'), {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error calling OpenRouter chat completion:', error);
    throw error;
  }
}

// 估算令牌数量的简单实现
function estimateTokenCount(messages: ChatMessage[]): number {
  // 简单的令牌估算：每4个字符约等于1个令牌
  let totalChars = 0;
  
  messages.forEach(message => {
    totalChars += message.content.length;
    // 为角色名称也计算一些令牌
    totalChars += message.role.length;
  });
  
  // 粗略估算：4个字符 ≈ 1个令牌
  return Math.ceil(totalChars / 4);
}

// 流式聊天完成
export async function streamChatCompletion(
  messages: ChatMessage[], 
  model?: string,
  temperature?: number
): Promise<ReadableStream<Uint8Array>> {
  try {
    const functionUrl = getSupabaseFunctionUrl('openrouter-stream');
    const headers = getHeaders();
    const actualModel = model || 'openai/gpt-3.5-turbo';
    
    // 估算当前消息的令牌数
    const estimatedTokens = estimateTokenCount(messages);
    
    // 获取模型的真实参数
    const [maxContextLength, maxCompletionTokens] = await Promise.all([
      getDynamicMaxContextLength(actualModel),
      getMaxCompletionTokens(actualModel)
    ]);
    
    // 构建请求体
    const requestBody: any = {
      messages,
      model: actualModel,
      temperature: temperature || 0.7,
      max_tokens: maxCompletionTokens, // 使用模型的真实最大完成令牌数
    };
    
    // 如果估算的令牌数超过最大上下文长度，启用middle-out转换
    if (estimatedTokens > maxContextLength) {
      requestBody.transforms = ["middle-out"];
      console.warn(`🔧 上下文长度 (${estimatedTokens} tokens) 超过模型最大值 (${maxContextLength} tokens)，已启用 middle-out 压缩`);
    }
    
    console.log('Making request to:', functionUrl);
    console.log('Request headers:', { ...headers, 'Authorization': 'Bearer [REDACTED]' });
    console.log('Request payload:', { 
      messages: messages.length + ' messages', 
      model: requestBody.model, 
      temperature: requestBody.temperature,
      max_tokens: `${requestBody.max_tokens} (from API)`,
      transforms: requestBody.transforms || 'none',
      estimatedTokens,
      maxContextLength: `${maxContextLength} (from API)`
    });
    
    const response = await fetch(getSupabaseFunctionUrl('openrouter-stream'), {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      let errorText;
      try {
        errorText = await response.text();
      } catch (parseError) {
        errorText = `Unable to parse error response: ${parseError}`;
      }
      console.error('Supabase Edge Function error:', { 
        status: response.status, 
        statusText: response.statusText,
        errorText,
        url: functionUrl 
      });
      throw new Error(`Supabase Edge Function error (${response.status}): ${errorText}`);
    }

    if (!response.body) {
      throw new Error('Response has no body');
    }

    console.log('Successfully got response stream from Supabase Edge Function');
    return response.body;
  } catch (error) {
    console.error('Error calling Supabase Edge Function:', error);
    
    if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
      throw new Error(`Failed to connect to Supabase Edge Function. Please check:
1. Your .env file contains correct VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
2. Your Supabase project is running and accessible
3. The openrouter-stream Edge Function is deployed
4. Your network connection is stable

Original error: ${error.message}`);
    }
    
    throw error;
  }
}

// 解析流式响应
export async function parseStreamResponse(
  stream: ReadableStream<Uint8Array>,
  onChunk: (chunk: { content?: string; reasoning?: string }) => void,
  onComplete?: () => void,
  onError?: (error: Error) => void
): Promise<void> {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  const handleDataLine = (line: string): 'continue' | 'done' | 'wait' => {
    if (!line.startsWith('data:')) {
      return 'continue';
    }

    const data = line.replace(/^data:\s*/, '');
    console.log('SSE data line:', data);

    if (data === '[DONE]') {
      console.log('Stream completed with [DONE]');
      onComplete?.();
      return 'done';
    }

    try {
      const parsed = JSON.parse(data);
      console.log('Parsed JSON:', parsed);
      const delta = parsed.choices?.[0]?.delta;
      if (!delta) {
        return 'continue';
      }

      const chunkPayload: { content?: string; reasoning?: string; images?: MessageImage[] } = {};
      if (delta.content) {
        chunkPayload.content = delta.content;
      }
      if (delta.reasoning) {
        chunkPayload.reasoning = delta.reasoning;
      }
      if (Array.isArray(delta.images) && delta.images.length > 0) {
        const images: MessageImage[] = delta.images
          .map((image: any) => {
            if (!image) return null;
            if (image.type === 'image_url' && image.image_url?.url) {
              return {
                type: 'image_url' as const,
                url: image.image_url.url,
                alt: image.image_url.alt,
              };
            }
            if (image.type === 'image_base64' && image.image_base64?.b64_json) {
              const mimeType = image.image_base64.mime_type || 'image/png';
              return {
                type: 'image_url' as const,
                url: `data:${mimeType};base64,${image.image_base64.b64_json}`,
              };
            }
            return null;
          })
          .filter((img: MessageImage | null): img is MessageImage => img !== null);

        if (images.length > 0) {
          chunkPayload.images = images;
        }
      }

      if (chunkPayload.content || chunkPayload.reasoning || chunkPayload.images) {
        console.log('Calling onChunk with:', chunkPayload);
        onChunk(chunkPayload);
      }

      return 'continue';
    } catch (parseError) {
      if (parseError instanceof SyntaxError) {
        buffer = `${line}\n${buffer}`;
        return 'wait';
      }
      console.warn('Failed to parse SSE data:', data, 'Error:', parseError);
      return 'continue';
    }
  };

  try {
    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        if (buffer.trim().length > 0) {
          const result = handleDataLine(buffer);
          if (result === 'done') {
            return;
          }
        }
        onComplete?.();
        break;
      }

      const chunk = decoder.decode(value, { stream: true });
      console.log('Raw chunk received:', JSON.stringify(chunk));
      buffer += chunk;

      while (true) {
        const newlineIndex = buffer.indexOf('\n');
        if (newlineIndex === -1) {
          break;
        }

        const line = buffer.slice(0, newlineIndex).replace(/\r$/, '');
        buffer = buffer.slice(newlineIndex + 1);

        const result = handleDataLine(line);
        if (result === 'done') {
          return;
        }
        if (result === 'wait') {
          break;
        }
      }
    }
  } catch (error) {
    console.error('Error reading stream:', error);
    onError?.(error instanceof Error ? error : new Error('Unknown stream error'));
  } finally {
    reader.releaseLock();
  }
}
// 获取可用模型列表
export async function getAvailableModels(): Promise<any[]> {
  try {
    const response = await fetch('https://openrouter.ai/api/v1/models', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch models: ${response.status}`);
    }

    const data = await response.json();
    return data.data || [];
  } catch (error) {
    console.error('Error fetching available models:', error);
    return [];
  }
}

// 模型信息缓存
interface ModelInfo {
  context_length: number;
  max_completion_tokens: number;
  pricing: {
    prompt: string;
    completion: string;
  };
  supported_parameters: string[];
}

const modelInfoCache = new Map<string, ModelInfo>();
let modelListCache: OpenRouterModel[] | null = null;
let cacheExpiry: number = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5分钟缓存

// 获取按提供商分组的模型列表
export async function getModelsByProvider(): Promise<ProviderModels> {
  try {
    console.log('🔄 Fetching models from OpenRouter API...');
    const response = await fetch('https://openrouter.ai/api/v1/models', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch models: ${response.status}`);
    }

    const data = await response.json();
    const models: OpenRouterModel[] = data.data || [];

    console.log(`✅ Fetched ${models.length} models from OpenRouter API`);

    // 清理模型名称，移除重复的提供商前缀
    const cleanModelName = (name: string, providerId: string): string => {
      if (!name) return '';

      // 提供商名称映射
      const providerNames: Record<'openai' | 'anthropic' | 'google' | 'deepseek', string[]> = {
        openai: ['OpenAI', 'GPT'],
        anthropic: ['Anthropic', 'Claude'],
        google: ['Google', 'Gemini'],
        deepseek: ['DeepSeek'],
      };

      const isKnownProvider = (id: string): id is keyof typeof providerNames =>
        Object.prototype.hasOwnProperty.call(providerNames, id);

      let cleanedName = name;

      // 移除重复的提供商名称前缀
      if (isKnownProvider(providerId)) {
        providerNames[providerId].forEach((prefix) => {
          // 特殊处理DeepSeek的重复模式
          if (providerId === 'deepseek' && prefix === 'DeepSeek') {
            // 匹配模式：DeepSeek: DeepSeek V3.1 -> V3.1
            const pattern1 = new RegExp(`^${prefix}:\\s*${prefix}\\s+(.+)`, 'i');
            const pattern2 = new RegExp(`^${prefix}\\s+${prefix}\\s+(.+)`, 'i');
            const pattern3 = new RegExp(`^${prefix}:\\s*(.+)`, 'i');
            const pattern4 = new RegExp(`^${prefix}\\s+(.+)`, 'i');

            // 优先处理重复模式，提取后面的部分
            if (pattern1.test(cleanedName)) {
              cleanedName = cleanedName.replace(pattern1, '$1');
              return; // 处理完毕，跳出循环
            } else if (pattern2.test(cleanedName)) {
              cleanedName = cleanedName.replace(pattern2, '$1');
              return;
            } else if (pattern3.test(cleanedName)) {
              cleanedName = cleanedName.replace(pattern3, '$1');
              return;
            } else if (pattern4.test(cleanedName)) {
              cleanedName = cleanedName.replace(pattern4, '$1');
              return;
            }
          } else {
            // 其他提供商的处理逻辑
            const pattern1 = new RegExp(`^${prefix}:\\s*${prefix}\\s+`, 'i');
            const pattern2 = new RegExp(`^${prefix}\\s+${prefix}\\s+`, 'i');
            const pattern3 = new RegExp(`^${prefix}:\\s*`, 'i');

            cleanedName = cleanedName
              .replace(pattern1, `${prefix} `)
              .replace(pattern2, `${prefix} `)
              .replace(pattern3, '');
          }
        });
      }

      return cleanedName.trim();
    };
    // 按提供商分组模型
    const groupedModels: ProviderModels = {
      auto: [
        {
          id: 'openrouter/auto',
          label: '智能路由',
          description: '自动选择最适合的模型处理您的请求',
          created: Date.now()
        }
      ],
      openai: [
        { id: 'openai/gpt-5-image', label: 'GPT-5 Image', description: 'GPT-5 图像生成模型', created: Date.now() },
        { id: 'openai/gpt-5', label: 'GPT-5', description: 'GPT-5 主模型', created: Date.now() },
        { id: 'openai/gpt-5-codex', label: 'GPT-5 Codex', description: 'GPT-5 代码专用模型', created: Date.now() },
        { id: 'openai/o3-deep-research', label: 'O3 Deep Research', description: 'O3 深度研究模型', created: Date.now() },
        { id: 'openai/o4-mini-deep-research', label: 'O4 Mini Deep Research', description: 'O4 Mini 深度研究模型', created: Date.now() },
        { id: 'openai/gpt-5-image-mini', label: 'GPT-5 Image Mini', description: 'GPT-5 轻量图像生成模型', created: Date.now() }
      ],
      anthropic: [],
      google: [],
      deepseek: []
    };

    models.forEach(model => {
      const modelId = model.id.toLowerCase();

      // 根据模型ID分类到不同提供商
      if (modelId.startsWith('anthropic/')) {
        // 只包含主要的Anthropic模型，排除Opus系列
        if (modelId.includes('claude') && !modelId.includes('opus')) {
          groupedModels.anthropic.push({
            id: model.id,
            label: cleanModelName(model.name || model.id, 'anthropic'),
            description: model.description,
            pricing: model.pricing,
            created: model.created || 0
          });
        }
      } else if (modelId.startsWith('google/')) {
        // 只包含主要的Google模型
        if (modelId.includes('gemini')) {
          groupedModels.google.push({
            id: model.id,
            label: cleanModelName(model.name || model.id, 'google'),
            description: model.description,
            pricing: model.pricing,
            created: model.created || 0
          });
        }
      } else if (modelId.startsWith('deepseek/')) {
        // 包含所有DeepSeek模型，排除特定模型
        const excludedModels = ['deepseek/deepseek-r1', 'deepseek/deepseek-reasoner', 'qwen/qwen-2.5-coder-32b-instruct'];
        const shouldExclude = excludedModels.some(excluded => modelId.includes(excluded.toLowerCase())) ||
                             modelId.includes('0528') ||
                             modelId.includes('qwen') ||
                             (modelId.includes('free') && modelId.includes('8b'));

        if (!shouldExclude) {
          groupedModels.deepseek.push({
            id: model.id,
            label: cleanModelName(model.name || model.id, 'deepseek'),
            description: model.description,
            pricing: model.pricing,
            created: model.created || 0
          });
        }
      }
    });

    // 对不同提供商应用不同的排序和限制策略
    Object.entries(groupedModels).forEach(([provider, entries]) => {
      if (provider === 'google') {
        groupedModels[provider] = [...entries].sort((a, b) => a.label.localeCompare(b.label));
        return;
      }

      if (provider === 'auto' || provider === 'openai') {
        return;
      }

      if (provider === 'deepseek') {
        // DeepSeek特殊处理：前5个从网络加载，第6个固定为v3-0324
        const sortedEntries = [...entries]
          .filter(m => m.id !== 'deepseek/deepseek-chat-v3-0324')
          .sort((a, b) => ((b.created ?? 0) - (a.created ?? 0)))
          .slice(0, 5);

        // 添加固定的v3-0324模型
        sortedEntries.push({
          id: 'deepseek/deepseek-chat-v3-0324',
          label: 'Chat V3 0324',
          description: 'DeepSeek Chat V3 模型',
          created: 0
        });

        groupedModels[provider] = sortedEntries;
        return;
      }

      groupedModels[provider] = [...entries]
        .sort((a, b) => ((b.created ?? 0) - (a.created ?? 0)))
        .slice(0, 5);
    });

    console.log('📊 Models grouped by provider:', {
      openai: groupedModels.openai.length,
      anthropic: groupedModels.anthropic.length,
      google: groupedModels.google.length,
      deepseek: groupedModels.deepseek.length
    });

    return groupedModels;
  } catch (error) {
    console.error('❌ Error fetching models from OpenRouter:', error);

    // 返回后备的固定模型列表
    return {
      auto: [
        { id: 'openrouter/auto', label: '智能路由' }
      ],
      openai: [
        { id: 'openai/gpt-5-image', label: 'GPT-5 Image' },
        { id: 'openai/gpt-5', label: 'GPT-5' },
        { id: 'openai/gpt-5-codex', label: 'GPT-5 Codex' },
        { id: 'openai/o3-deep-research', label: 'O3 Deep Research' },
        { id: 'openai/o4-mini-deep-research', label: 'O4 Mini Deep Research' },
        { id: 'openai/gpt-5-image-mini', label: 'GPT-5 Image Mini' }
      ],
      anthropic: [
        { id: 'anthropic/claude-3.5-sonnet', label: 'Claude 3.5 Sonnet' },
        { id: 'anthropic/claude-3-haiku', label: 'Claude 3 Haiku' }
      ],
      google: [
        { id: 'google/gemini-pro-1.5', label: 'Gemini 1.5 Pro' },
        { id: 'google/gemini-flash-1.5', label: 'Gemini 1.5 Flash' }
      ],
      deepseek: [
        { id: 'deepseek/deepseek-chat', label: 'DeepSeek Chat' }
      ]
    };
  }
}

// 获取特定模型的详细信息
export async function getModelInfo(modelId: string): Promise<ModelInfo | null> {
  // 检查缓存是否有效
  if (modelInfoCache.has(modelId) && Date.now() < cacheExpiry) {
    return modelInfoCache.get(modelId)!;
  }

  // 如果缓存过期或不存在，重新获取
  if (!modelListCache || Date.now() >= cacheExpiry) {
    try {
      console.log('🔄 Fetching fresh model list from OpenRouter...');
      const response = await fetch('https://openrouter.ai/api/v1/models', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch models: ${response.status}`);
      }

      const data = await response.json();
      const list: OpenRouterModel[] = data.data || [];
      modelListCache = list;
      cacheExpiry = Date.now() + CACHE_DURATION;
      console.log(`✅ Cached ${list.length} models for 5 minutes`);
    } catch (error) {
      console.error('❌ Error fetching model list:', error);
      return null;
    }
  }

  // 查找指定的模型
  if (!modelListCache) {
    return null;
  }

  const model = modelListCache.find((m) => m.id === modelId);
  if (!model) {
    console.warn(`⚠️ Model ${modelId} not found in OpenRouter API`);
    return null;
  }

  // 提取模型信息
  const modelInfo: ModelInfo = {
    context_length: model.context_length || model.top_provider?.context_length || 4096,
    max_completion_tokens: model.top_provider?.max_completion_tokens || 4096,
    pricing: model.pricing || { prompt: '0', completion: '0' },
    supported_parameters: model.supported_parameters || []
  };

  // 缓存模型信息
  modelInfoCache.set(modelId, modelInfo);
  console.log(`📋 Cached info for ${modelId}:`, {
    context_length: modelInfo.context_length,
    max_completion_tokens: modelInfo.max_completion_tokens
  });

  return modelInfo;
}

// 获取模型的最大上下文长度（动态版本）
export async function getDynamicMaxContextLength(model: string): Promise<number> {
  const modelInfo = await getModelInfo(model);
  if (modelInfo) {
    return modelInfo.context_length;
  }

  // 如果API调用失败，使用静态的后备值
  console.warn(`⚠️ Using fallback context length for ${model}`);
  return getMaxContextLength(model);
}

function getMaxContextLength(model: string): number {
  const normalizedModel = model.toLowerCase();
  if (normalizedModel.includes('gpt-4o')) return 128000;
  if (normalizedModel.includes('gpt-4')) return 8192;
  if (normalizedModel.includes('gpt-3.5')) return 4096;
  if (normalizedModel.includes('claude')) return 200000;
  if (normalizedModel.includes('gemini')) return 100000;
  if (normalizedModel.includes('deepseek')) return 64000;
  return 4096;
}

// 获取模型的最大完成令牌数
export async function getMaxCompletionTokens(model: string): Promise<number> {
  const modelInfo = await getModelInfo(model);
  if (modelInfo) {
    return modelInfo.max_completion_tokens;
  }

  // 如果API调用失败，使用合理的默认值
  console.warn(`⚠️ Using fallback max_completion_tokens for ${model}`);
  if (model.includes('gpt-4o')) return 16384;
  if (model.includes('gpt-4')) return 8192;
  if (model.includes('claude-3.5')) return 8192;
  if (model.includes('gemini-2')) return 8192;
  if (model.includes('deepseek')) return 8192;
  return 4096; // 通用默认值
}
