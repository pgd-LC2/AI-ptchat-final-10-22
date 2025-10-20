
import React, { useState } from 'react';
import ProviderSelector from './ProviderSelector';
import NeonCore from '../ui/NeonCore';
import useChatStore from '@/lib/store';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { isModelSupported } from '@/lib/model-mapping';
import { getModelsByProvider } from '@/lib/openrouter-api';
import { useTheme } from '@/lib/ThemeProvider';

const Topbar: React.FC = () => {
  const [providerModels, setProviderModels] = useState<{ [key: string]: any[] }>({});
  const { providerColor } = useTheme();
  
  const activeConversationId = useChatStore((state) => state.activeConversationId);
  const tempConversation = useChatStore((state) => state.tempConversation);
  const conversation = useChatStore((state) => activeConversationId ? state.conversations[activeConversationId] : null);
  const currentConversation = conversation || tempConversation;
  const { 
    selectedProviderId, 
    selectedModelId,
    setSelectedProviderModel,
    updateConversationModel,
    updateTempConversationModel
  } = useChatStore((state) => ({
    selectedProviderId: state.selectedProviderId,
    selectedModelId: state.selectedModelId,
    setSelectedProviderModel: state.setSelectedProviderModel,
    updateConversationModel: state.updateConversationModel,
    updateTempConversationModel: state.updateTempConversationModel
  }));
  
  const [isModelSelectorOpen, setIsModelSelectorOpen] = useState(false);
  
  // 动态加载模型数据
  React.useEffect(() => {
    const loadModels = async () => {
      try {
        const models = await getModelsByProvider();
        setProviderModels(models);
      } catch (error) {
        console.error('Failed to load models for topbar:', error);
      }
    };
    loadModels();
  }, []);
  
  // Get current provider info
  const currentProvider = currentConversation?.providerId || selectedProviderId;
  const providerName = {
    auto: 'Auto',
    openai: 'OpenAI',
    anthropic: 'Anthropic', 
    google: 'Google',
    deepseek: 'DeepSeek'
  }[currentProvider] || currentProvider;
    
  // Get model label for active conversation or use selected model
  const currentModels = providerModels[currentProvider] || [];
  const modelLabel = currentConversation 
    ? (currentModels.find(m => m.id === currentConversation.modelId)?.label || currentConversation.modelId)
    : (currentModels.find(m => m.id === selectedModelId)?.label || selectedModelId);

  const handleModelChange = (modelId: string) => {
    // 验证模型是否支持
    if (!isModelSupported(selectedProviderId, modelId)) {
      console.warn(`Model ${selectedProviderId}/${modelId} is not supported`);
      return;
    }
    
    setSelectedProviderModel(selectedProviderId, modelId);
    
    // If there's an active conversation, update its model too
    if (activeConversationId) {
      updateConversationModel(activeConversationId, selectedProviderId, modelId);
    }
    
    // If there's a temp conversation, update its model too
    if (tempConversation) {
      updateTempConversationModel(selectedProviderId, modelId);
    }
    
    setIsModelSelectorOpen(false);
  };

  return (
    <div className="flex items-center justify-between p-4 border-b border-white/10">
      <div className="flex items-center gap-4">
        <NeonCore providerColor={providerColor} className="w-10 h-10" />
        <div>
          <h1 className="font-bold text-lg text-white">{currentConversation?.title || 'New Chat'}</h1>
          <div className="relative">
            <button
              onClick={() => setIsModelSelectorOpen(!isModelSelectorOpen)}
              className="flex items-center gap-1 text-sm text-gray-400 hover:text-gray-300 transition-colors"
            >
              <span>{providerName} / {modelLabel}</span>
              <ChevronDown className={`w-3 h-3 transition-transform ${isModelSelectorOpen ? 'rotate-180' : ''}`} />
            </button>
            
            {isModelSelectorOpen && (
              <div className="absolute top-full left-0 mt-1 bg-black/40 backdrop-blur-lg rounded-lg border border-white/10 z-10 min-w-[150px]">
                {currentModels.map(model => (
                  <button
                    key={model.id}
                    onClick={() => handleModelChange(model.id)}
                    className={cn(
                      "w-full text-left px-3 py-2 rounded-md text-sm transition-colors",
                      selectedModelId === model.id ? 'bg-white/10 text-white' : 'text-gray-400 hover:bg-white/5 hover:text-gray-300'
                    )}
                  >
                    {model.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      <ProviderSelector />
    </div>
  );
};

export default Topbar;
  