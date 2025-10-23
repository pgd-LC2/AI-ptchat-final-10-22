import React, { createContext, useContext, useState, useEffect } from 'react';
import useChatStore from './store';
import { PROVIDERS } from '@/components/topbar/ProviderSelector';

interface ThemeContextType {
  providerColor: string;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// AUTO渐变色数组 - 深渊蓝黑 → 墨蓝 → 冰青 → 冷紫
const AUTO_COLORS = ['#0B1220', '#1F3556', '#4CC9E9', '#B7A6F7'];

// 获取当前渐变色 - 改进的颜色插值算法
const getAutoColor = () => {
  const now = Date.now();
  const cycle = 20000; // 20秒循环，更缓慢流畅的渐变
  const progress = (now % cycle) / cycle;
  const colorIndex = progress * AUTO_COLORS.length;
  const currentIndex = Math.floor(colorIndex);
  const nextIndex = (currentIndex + 1) % AUTO_COLORS.length;
  const ratio = colorIndex - currentIndex;
  
  // 真正的颜色插值
  const currentColor = hexToRgb(AUTO_COLORS[currentIndex]);
  const nextColor = hexToRgb(AUTO_COLORS[nextIndex]);
  
  if (!currentColor || !nextColor) {
    return AUTO_COLORS[currentIndex];
  }
  
  const interpolatedColor = {
    r: Math.round(currentColor.r + (nextColor.r - currentColor.r) * ratio),
    g: Math.round(currentColor.g + (nextColor.g - currentColor.g) * ratio),
    b: Math.round(currentColor.b + (nextColor.b - currentColor.b) * ratio)
  };
  
  return `#${interpolatedColor.r.toString(16).padStart(2, '0')}${interpolatedColor.g.toString(16).padStart(2, '0')}${interpolatedColor.b.toString(16).padStart(2, '0')}`;
};

// 辅助函数：将十六进制颜色转换为RGB
const hexToRgb = (hex: string) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
};

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [dynamicColor, setDynamicColor] = useState(getAutoColor());
  const activeConversationId = useChatStore((state) => state.activeConversationId);
  const conversation = useChatStore((state) => activeConversationId ? state.conversations[activeConversationId] : null);
  const { selectedProviderId } = useChatStore((state) => ({
    selectedProviderId: state.selectedProviderId
  }));

  // Get provider info for active conversation or use selected provider
  const provider = conversation 
    ? PROVIDERS.find(p => p.id === conversation.providerId) 
    : PROVIDERS.find(p => p.id === selectedProviderId) || PROVIDERS[0];

  // 为auto提供商设置动态颜色更新
  useEffect(() => {
    if (provider?.id === 'auto') {
      // 立即设置初始颜色
      setDynamicColor(getAutoColor());
      
      const interval = setInterval(() => {
        setDynamicColor(getAutoColor());
      }, 50); // 每50ms更新一次，确保缓慢渐变依然流畅
      return () => clearInterval(interval);
    } else {
      // 非AUTO模式时停止颜色更新
      setDynamicColor('#7C3AED'); // 重置为默认颜色
    }
  }, [provider?.id]);

  // 对于auto提供商，使用动态颜色
  const providerColor = provider?.id === 'auto' ? dynamicColor : (provider?.color || '#7C3AED');

  return (
    <ThemeContext.Provider value={{ providerColor }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    // 返回默认值而不是抛出错误，避免在组件树初始化期间的时序问题
    return { providerColor: '#7C3AED' };
  }
  return context;
};