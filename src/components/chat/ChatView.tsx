
import React from 'react';
import { useState, useRef, useEffect } from 'react';
import ChatWindow from './ChatWindow';
import Composer from './Composer';
import Topbar from '../topbar/Topbar';
import useChatStore from '@/lib/store';
import NeonCore from '../ui/NeonCore';
import { useTheme } from '@/lib/ThemeProvider';
import WeatherPanel from '../weather/WeatherPanel';
import HomePage from './HomePage';

const ChatView: React.FC = () => {
  const activeConversationId = useChatStore((state) => state.activeConversationId);
  const tempConversation = useChatStore((state) => state.tempConversation);
  const conversation = useChatStore((state) => activeConversationId ? state.conversations[activeConversationId] : null);
  const selectedProviderId = useChatStore((state) => state.selectedProviderId);
  const currentConversation = conversation || tempConversation;
  const { providerColor } = useTheme();
  const [mousePosition, setMousePosition] = useState({ x: 50, y: 50 });
  const [isMouseInside, setIsMouseInside] = useState(false);
  const [globalMousePosition, setGlobalMousePosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartX, setDragStartX] = useState(0);
  const [dragOffset, setDragOffset] = useState(0);
  const [isWeatherPanelOpen, setIsWeatherPanelOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // 判断是否在首页
  const isHomePage = !activeConversationId && !tempConversation;

  // 根据当前提供商生成动态文本
  const getProviderText = () => {
    const currentProvider = currentConversation?.providerId || selectedProviderId;
    
    switch (currentProvider) {
      case 'auto':
        return {
          prefix: '您即将与',
          modelName: '世界顶尖AI模型',
          suffix: '开始对话',
          subtitle: 'AI将智能选择最适合的模型为您服务'
        };
      case 'openai':
        return {
          prefix: '您即将与',
          modelName: 'OpenAI GPT',
          suffix: '开始对话',
          subtitle: '体验最先进的大语言模型技术'
        };
      case 'anthropic':
        return {
          prefix: '您即将与',
          modelName: 'Anthropic Claude',
          suffix: '开始对话',
          subtitle: '享受安全、有用、诚实的AI助手服务'
        };
      case 'google':
        return {
          prefix: '您即将与',
          modelName: 'Google Gemini',
          suffix: '开始对话',
          subtitle: '探索Google最新多模态AI的强大能力'
        };
      case 'deepseek':
        return {
          prefix: '您即将与',
          modelName: 'DeepSeek',
          suffix: '开始对话',
          subtitle: '体验深度思维和推理能力的AI模型'
        };
      default:
        return {
          prefix: '您即将与',
          modelName: '世界顶尖AI模型',
          suffix: '开始对话',
          subtitle: 'AI将智能选择最适合的模型为您服务'
        };
    }
  };

  const providerText = getProviderText();
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;

    // 获取容器的原始尺寸（不受transform影响）
    const rect = containerRef.current.getBoundingClientRect();

    // 计算时补偿拖拽偏移量
    const adjustedX = e.clientX - dragOffset;
    const x = ((adjustedX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setMousePosition({ x, y });

    // 设置全局鼠标位置（相对于视口）
    setGlobalMousePosition({ x: e.clientX, y: e.clientY });
  };

  const handleMouseEnter = () => {
    setIsMouseInside(true);
  };

  const handleMouseLeave = () => {
    setIsMouseInside(false);
  };

  // 拖拽事件处理
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!isHomePage || isWeatherPanelOpen) return;

    // 检查是否点击在可交互元素上
    const target = e.target as HTMLElement;
    const isInteractiveElement =
      target.tagName === 'TEXTAREA' ||
      target.tagName === 'INPUT' ||
      target.tagName === 'BUTTON' ||
      target.closest('textarea') ||
      target.closest('input') ||
      target.closest('button');

    // 如果点击的是交互元素，不触发拖拽
    if (isInteractiveElement) return;

    setIsDragging(true);
    setDragStartX(e.clientX);
    e.preventDefault();
  };

  const handleGlobalMouseMove = (e: MouseEvent) => {
    if (!isDragging || !isHomePage) return;
    
    const deltaX = e.clientX - dragStartX;
    // 只允许向左拖拽（负方向）
    if (deltaX < 0) {
      setDragOffset(Math.max(deltaX, -400)); // 最大拖拽400px
    }
  };

  const handleMouseUp = () => {
    if (!isDragging || !isHomePage) return;
    
    setIsDragging(false);
    
    // 如果拖拽超过200px，打开天气面板
    if (dragOffset <= -200) {
      setIsWeatherPanelOpen(true);
      setDragOffset(-400);
    } else {
      // 否则回弹
      setDragOffset(0);
    }
  };

  // 关闭天气面板
  const closeWeatherPanel = () => {
    setIsWeatherPanelOpen(false);
    setDragOffset(0);
  };

  // 全局事件监听
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleGlobalMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'grabbing';
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isDragging, dragOffset, dragStartX]);

  return (
    <div
      ref={containerRef}
      className="flex flex-1 relative overflow-hidden"
      style={{ height: '100vh' }}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* 主内容区域 */}
      <div 
        className="flex flex-col flex-1 h-full relative transition-transform duration-300 ease-out"
        style={{
          transform: `translateX(${dragOffset}px)`
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={(e) => {
          // 动态设置光标样式
          const target = e.target as HTMLElement;
          const isTextElement = target.tagName === 'H1' || 
                                target.tagName === 'P' || 
                                target.tagName === 'SPAN' || 
                                (target.tagName === 'DIV' && target.textContent?.trim());
          
          if (isHomePage && !isWeatherPanelOpen && !isTextElement) {
            e.currentTarget.style.cursor = 'grab';
          } else {
            e.currentTarget.style.cursor = 'default';
          }
        }}
      >
      {/* 全局鼠标跟随光流背景 */}
      {isMouseInside && (
        <>
          {/* 主光晕效果 */}
          <div 
            className="absolute pointer-events-none z-0"
            style={{
              left: `${mousePosition.x}%`,
              top: `${mousePosition.y}%`,
              transform: 'translate(-50%, -50%)',
              width: '300px',
              height: '300px',
              background: `radial-gradient(circle, ${providerColor}08 0%, ${providerColor}04 30%, transparent 70%)`,
              borderRadius: '50%',
            }}
          />
          
          {/* 内圈强化光效 */}
          <div 
            className="absolute pointer-events-none z-0"
            style={{
              left: `${mousePosition.x}%`,
              top: `${mousePosition.y}%`,
              transform: 'translate(-50%, -50%)',
              width: '150px',
              height: '150px',
              background: `radial-gradient(circle, ${providerColor}12 0%, ${providerColor}06 40%, transparent 80%)`,
              borderRadius: '50%',
            }}
          />
          
          {/* 核心光点 */}
          <div 
            className="absolute pointer-events-none z-0"
            style={{
              left: `${mousePosition.x}%`,
              top: `${mousePosition.y}%`,
              transform: 'translate(-50%, -50%)',
              width: '60px',
              height: '60px',
              background: `radial-gradient(circle, ${providerColor}20 0%, ${providerColor}10 50%, transparent 100%)`,
              borderRadius: '50%',
            }}
          />
          
          {/* 流动光带效果 */}
          <div 
            className="absolute inset-0 pointer-events-none z-0 opacity-30"
            style={{
              background: `
                radial-gradient(ellipse 400px 100px at ${mousePosition.x}% ${mousePosition.y}%, ${providerColor}06 0%, transparent 50%),
                radial-gradient(ellipse 100px 400px at ${mousePosition.x}% ${mousePosition.y}%, ${providerColor}06 0%, transparent 50%)
              `,
            }}
          />
        </>
      )}

        {activeConversationId && conversation ? (
          <div className="relative z-10 flex flex-col flex-1">
            <Topbar />
            <div className="flex-1 flex flex-col overflow-hidden">
              <ChatWindow />
              <div className="flex-shrink-0">
                <Composer globalMousePosition={globalMousePosition} isMouseInChatArea={isMouseInside} />
              </div>
            </div>
          </div>
        ) : tempConversation ? (
          <div className="relative z-10 flex flex-col flex-1">
            <Topbar />
            <div className="flex-1 flex items-center justify-center text-center p-6">
              <div className="flex flex-col items-center">
                <NeonCore providerColor={providerColor} />
                <h2 className="text-2xl font-bold mt-6 mb-3 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                  准备开启AI对话
                </h2>
                <p className="text-gray-300 max-w-lg mb-4">
                  {providerText.prefix}
                  <span style={{color: providerColor}} className="font-medium">
                    {providerText.modelName}
                  </span>
                  {providerText.suffix}
                </p>
                <p className="text-gray-500 text-sm max-w-md">
                  {providerText.subtitle}
                </p>
              </div>
            </div>
            <div className="flex-shrink-0">
              <Composer globalMousePosition={globalMousePosition} isMouseInChatArea={isMouseInside} />
            </div>
          </div>
        ) : (
          <HomePage providerColor={providerColor} />
        )}
      </div>

      {/* 天气面板 */}
      <WeatherPanel 
        isOpen={isWeatherPanelOpen}
        onClose={closeWeatherPanel}
      />
    </div>
  );
};

export default ChatView;
  