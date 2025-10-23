
import React, { useState, useEffect } from 'react';
import { LLMProvider } from '@/types';
import { BrainCircuit, Bot, Sparkles, Search, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import useChatStore from '@/lib/store';
import { getModelsByProvider } from '@/lib/openrouter-api';

// 静态提供商信息（不包含模型，模型将动态加载）
const STATIC_PROVIDERS: Omit<LLMProvider, 'models'>[] = [
  { 
    id: 'openai', 
    name: 'OpenAI', 
    Icon: BrainCircuit, 
    color: '#7C3AED' 
  },
  { 
    id: 'anthropic', 
    name: 'Anthropic', 
    Icon: Bot, 
    color: '#F472B6' 
  },
  { 
    id: 'google', 
    name: 'Google', 
    Icon: Sparkles, 
    color: '#22D3EE' 
  },
  { 
    id: 'deepseek', 
    name: 'DeepSeek', 
    Icon: Search, 
    color: '#4ade80' 
  },
  {
    id: 'auto',
    name: 'Auto',
    Icon: Zap,
    color: 'linear-gradient(135deg, #0B1220 0%, #1F3556 33%, #4CC9E9 66%, #B7A6F7 100%)'
  },
];

export let PROVIDERS: LLMProvider[] = [];

const ProviderSelector: React.FC = () => {
  const [providers, setProviders] = useState<LLMProvider[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const { 
    activeConversationId,
    conversations,
    tempConversation,
    selectedProviderId, 
    setSelectedProviderModel,
    updateConversationModel,
    updateTempConversationModel
  } = useChatStore((state) => ({
    activeConversationId: state.activeConversationId,
    conversations: state.conversations,
    tempConversation: state.tempConversation,
    selectedProviderId: state.selectedProviderId,
    setSelectedProviderModel: state.setSelectedProviderModel,
    updateConversationModel: state.updateConversationModel,
    updateTempConversationModel: state.updateTempConversationModel
  }));

  // 动态加载模型列表
  useEffect(() => {
    const loadModels = async () => {
      try {
        setIsLoading(true);
        const modelsByProvider = await getModelsByProvider();
        
        const loadedProviders: LLMProvider[] = STATIC_PROVIDERS.map(provider => ({
          ...provider,
          models: modelsByProvider[provider.id] || [],
          isLoading: false
        }));
        
        setProviders(loadedProviders);
        PROVIDERS = loadedProviders; // 更新全局PROVIDERS变量
        
        console.log('✅ Providers loaded with dynamic models:', loadedProviders.map(p => ({
          name: p.name,
          modelCount: p.models.length
        })));
        
      } catch (error) {
        console.error('❌ Error loading models:', error);
        
        // 使用后备的静态模型
        const fallbackProviders: LLMProvider[] = STATIC_PROVIDERS.map(provider => ({
          ...provider,
          models: getFallbackModels(provider.id),
          error: 'Failed to load models'
        }));
        
        setProviders(fallbackProviders);
        PROVIDERS = fallbackProviders;
      } finally {
        setIsLoading(false);
      }
    };

    loadModels();
  }, []);

  // 如果还在加载，显示加载状态
  if (isLoading) {
    return <div className="flex items-center gap-2 p-1 bg-white/5 backdrop-blur-lg rounded-xl border border-white/10 shadow-lg">
      <div className="px-3 py-1.5 text-sm text-gray-400">Loading models...</div>
    </div>;
  }

  // 获取当前对话
  const currentConversation = activeConversationId 
    ? conversations[activeConversationId] 
    : tempConversation;
  
  // 确定当前应该高亮的提供商ID
  const currentProviderId = currentConversation?.providerId || selectedProviderId;

  const handleProviderChange = (providerId: string) => {
    const provider = providers.find(p => p.id === providerId);
    if (provider && provider.models.length > 0) {
      const modelId = provider.models[0].id;
      setSelectedProviderModel(providerId as any, modelId);
      
      // If there's an active conversation, update its model too
      if (activeConversationId) {
        updateConversationModel(activeConversationId, providerId as any, modelId);
      }
      
      // If there's a temp conversation, update its model too
      if (tempConversation) {
        updateTempConversationModel(providerId as any, modelId);
      }
    }
  };

  return (
    <div className="flex items-center gap-2 p-1 bg-white/5 backdrop-blur-lg rounded-xl border border-white/10 shadow-lg hover:bg-white/10 transition-all duration-300">
      {providers.map(provider => (
        <button
          key={provider.id}
          onClick={() => handleProviderChange(provider.id)}
          className={cn(
            "flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-all duration-500",
            currentProviderId === provider.id ? 'bg-white/10 text-white' : 'text-gray-400 hover:bg-white/5 hover:text-gray-300',
          )}
          title={provider.error || `${provider.models.length} models available`}
          style={provider.id === 'auto' && currentProviderId === provider.id ? {
            background: provider.color,
            backgroundSize: '200% 200%',
            animation: 'rainbow-flow 20s ease-in-out infinite'
          } : provider.id === 'auto' ? {
            background: 'transparent'
          } : {}}
        >
          <provider.Icon 
            className={cn(
              "w-4 h-4 transition-all duration-500",
              provider.id === 'auto' && currentProviderId === provider.id ? 'text-white' : ''
            )} 
            style={provider.id === 'auto' && currentProviderId === provider.id ? {} : 
                   provider.id === 'auto' ? { color: '#6B7280' } : 
                   { color: provider.color }} 
          />
          <span className={provider.id === 'auto' && currentProviderId === provider.id ? 'text-white' : ''}>{provider.name}</span>
          {provider.error && (
            <span className="text-xs text-red-400">(!)</span>
          )}
          {!provider.error && provider.models.length > 0 && (
            <span className="text-xs text-gray-500">({provider.models.length})</span>
          )}
        </button>
      ))}
    </div>
  );
};

// 后备模型列表
function getFallbackModels(providerId: string) {
  const fallbackModels: { [key: string]: Array<{ id: string; label: string }> } = {
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
  return fallbackModels[providerId] || [];
}
export default ProviderSelector;
  
