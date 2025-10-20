// 模型映射：将我们的内部模型ID映射到OpenRouter的实际模型名称
export const MODEL_MAPPING: Record<string, string> = {
  // 通用映射：大多数情况下直接传递模型ID
  // 这个映射主要用于处理特殊情况和后备选项
};

// 后备模型映射（当特定模型不可用时使用）
export const FALLBACK_MODEL_MAPPING: Record<string, string> = {
  // OpenAI 后备模型
  'openai/gpt-5': 'openai/gpt-4o', // 如果GPT-5不可用，使用GPT-4o
  'openai/gpt-5-mini': 'openai/gpt-4o-mini', // 如果GPT-5 Mini不可用，使用GPT-4o Mini
  'openai/gpt-3.5-turbo': 'openai/gpt-3.5-turbo',
  
  // Anthropic 后备模型
  'anthropic/claude-4': 'anthropic/claude-3.5-sonnet', // 如果Claude 4不可用，使用Claude 3.5
  
  // Google 后备模型
  'google/gemini-2.0': 'google/gemini-pro-1.5', // 如果Gemini 2.0不可用，使用Gemini 1.5 Pro
  
  // DeepSeek 后备模型
  'deepseek/deepseek-v3': 'deepseek/deepseek-chat', // 如果DeepSeek V3不可用，使用基础Chat模型
};

// 获取OpenRouter模型名称
export function getOpenRouterModelName(providerId: string, modelId: string): string {  
  // 如果modelId已经包含提供商前缀，直接使用
  if (modelId.includes('/')) {
    return modelId;
  }
  
  // 否则，组合提供商ID和模型ID
  const fullModelId = `${providerId}/${modelId}`;
  
  // 检查是否有特殊映射
  const internalModelKey = fullModelId;
  const openRouterModel = MODEL_MAPPING[internalModelKey];
  
  if (!openRouterModel) {
    // 没有特殊映射，直接使用完整的模型ID
    return fullModelId;
  }
  
  return openRouterModel;
}

// 验证模型是否支持
export function isModelSupported(_providerId: string, _modelId: string): boolean {
  // 由于我们现在动态获取模型，所有返回的模型都应该是支持的
  return true;
}

// 获取模型显示信息（用于调试和日志）
export function getModelInfo(providerId: string, modelId: string) {
  const openRouterModel = getOpenRouterModelName(providerId, modelId);
  return {
    internal: `${providerId}/${modelId}`,
    openRouter: openRouterModel,
    isSupported: isModelSupported(providerId, modelId)
  };
}
