
import React from 'react';
import { useState, useRef, useEffect } from 'react';
import ChatWindow from './ChatWindow';
import Composer from './Composer';
import Topbar from '../topbar/Topbar';
import useChatStore from '@/lib/store';
import NeonCore from '../ui/NeonCore';
import { useTheme } from '@/lib/ThemeProvider';
import WeatherPanel from '../weather/WeatherPanel';

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
      className="flex flex-1 h-full relative overflow-hidden"
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
          <div className="relative z-10 flex flex-col flex-1 h-full">
            <Topbar />
            <ChatWindow />
            <Composer globalMousePosition={globalMousePosition} isMouseInChatArea={isMouseInside} />
          </div>
        ) : tempConversation ? (
          <div className="relative z-10 flex flex-col flex-1 h-full">
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
            <Composer globalMousePosition={globalMousePosition} isMouseInChatArea={isMouseInside} />
          </div>
        ) : (
          <div className="flex flex-col flex-1 items-center justify-center text-center p-4 relative z-10">
            <NeonCore providerColor={providerColor} />
            <h1 className="text-4xl font-bold mt-6 bg-gradient-to-r from-white via-gray-100 to-gray-300 bg-clip-text text-transparent">
              Orbital Chat
            </h1>
            <div className="mt-4 max-w-2xl">
              <p className="text-xl text-gray-300 mb-3">
                连接世界顶尖AI大模型的统一平台
              </p>
              <p className="text-gray-400 text-base leading-relaxed mb-6">
                GPT-5、Claude 4 Sonnet、Gemini 2.5 Pro、DeepSeek V3.1 — 
                在一个界面中体验全球最先进的人工智能，释放无限创造力
              </p>
              <div className="flex flex-wrap justify-center gap-4 text-sm text-gray-500">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-neon-purple"></div>
                  <span>多模型无缝切换</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-neon-cyan"></div>
                  <span>实时流式响应</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{backgroundColor: '#FBBF24'}}></div>
                  <span>智能模型路由</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-neon-pink"></div>
                  <span>会话历史管理</span>
                </div>
              </div>
            </div>
            
            {/* 拖拽提示 */}
            <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 glass-card px-6 py-3 rounded-full border border-white/10">
              <div className="flex items-center gap-3 text-sm text-gray-400">
                <div className="w-6 h-6 rounded-full border-2 border-gray-400 flex items-center justify-center">
                  <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                </div>
                <span>向左拖拽查看天气</span>
              </div>
            </div>
          </div>
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
  