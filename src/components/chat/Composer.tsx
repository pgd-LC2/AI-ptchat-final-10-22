import React, { useState, useRef, useEffect } from 'react';
import { Send, Loader } from 'lucide-react';
import useChatStore from '@/lib/store';
import { cn } from '@/lib/utils';
import { useTheme } from '@/lib/ThemeProvider';

interface ComposerProps {
  globalMousePosition: { x: number; y: number };
  isMouseInChatArea: boolean;
}

const Composer: React.FC<ComposerProps> = ({ globalMousePosition, isMouseInChatArea }) => {
  const [input, setInput] = useState('');
  const sendMessage = useChatStore((state) => state.sendMessage);
  const isStreaming = useChatStore((state) => state.isStreaming);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { providerColor } = useTheme();
  const [isFocused, setIsFocused] = useState(false);
  const [borderGlow, setBorderGlow] = useState({ side: '', position: 0, visible: false });
  const [isMouseOverInput, setIsMouseOverInput] = useState(false);

  const handleSend = () => {
    if (input.trim() && !isStreaming) {
      sendMessage(input.trim());
      setInput('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // 计算全局鼠标位置相对于输入框的边框发光
  useEffect(() => {
    if (!containerRef.current) {
      setBorderGlow({ side: '', position: 0, visible: false });
      return;
    }

    const rect = containerRef.current.getBoundingClientRect();
    
    // 计算鼠标相对于输入框的位置
    const relativeX = globalMousePosition.x - rect.left;
    const relativeY = globalMousePosition.y - rect.top;
    
    // 确定鼠标最接近哪条边
    let side = '';
    let position = 0;
    
    // 计算到各边的距离
    const distanceToTop = relativeY;
    const distanceToBottom = rect.height - relativeY;
    const distanceToLeft = relativeX;
    const distanceToRight = rect.width - relativeX;
    
    // 找出最小距离对应的边
    const minDistance = Math.min(distanceToTop, distanceToBottom, distanceToLeft, distanceToRight);
    
    if (minDistance === distanceToTop) {
      // 上边
      side = 'top';
      position = (relativeX / rect.width) * 100;
    } else if (minDistance === distanceToBottom) {
      // 下边
      side = 'bottom';
      position = (relativeX / rect.width) * 100;
    } else if (minDistance === distanceToLeft) {
      // 左边
      side = 'left';
      position = (relativeY / rect.height) * 100;
    } else {
      // 右边
      side = 'right';
      position = (relativeY / rect.height) * 100;
    }
    
    setBorderGlow({ side, position: Math.max(0, Math.min(100, position)), visible: !isFocused });
  }, [globalMousePosition, isFocused]);

  // 检测鼠标是否在输入框区域内
  useEffect(() => {
    if (!containerRef.current) {
      setIsMouseOverInput(false);
      return;
    }

    const rect = containerRef.current.getBoundingClientRect();
    const isInside = globalMousePosition.x >= rect.left && 
                     globalMousePosition.x <= rect.right && 
                     globalMousePosition.y >= rect.top && 
                     globalMousePosition.y <= rect.bottom;
    
    setIsMouseOverInput(isInside && isMouseInChatArea);
  }, [globalMousePosition, isMouseInChatArea]);

  // 修改发光条显示逻辑
  useEffect(() => {
    if (!containerRef.current) {
      setBorderGlow(prev => ({ ...prev, visible: false }));
      return;
    }

    const rect = containerRef.current.getBoundingClientRect();
    
    // 计算鼠标相对于输入框的位置
    const relativeX = globalMousePosition.x - rect.left;
    const relativeY = globalMousePosition.y - rect.top;
    
    // 确定鼠标最接近哪条边
    let side = '';
    let position = 0;
    
    // 计算到各边的距离
    const distanceToTop = relativeY;
    const distanceToBottom = rect.height - relativeY;
    const distanceToLeft = relativeX;
    const distanceToRight = rect.width - relativeX;
    
    // 找出最小距离对应的边
    const minDistance = Math.min(distanceToTop, distanceToBottom, distanceToLeft, distanceToRight);
    
    if (minDistance === distanceToTop) {
      // 上边
      side = 'top';
      position = (relativeX / rect.width) * 100;
    } else if (minDistance === distanceToBottom) {
      // 下边
      side = 'bottom';
      position = (relativeX / rect.width) * 100;
    } else if (minDistance === distanceToLeft) {
      // 左边
      side = 'left';
      position = (relativeY / rect.height) * 100;
    } else {
      // 右边
      side = 'right';
      position = (relativeY / rect.height) * 100;
    }
    
    // 只有在输入框未聚焦且鼠标不在输入框上方时才显示发光条
    setBorderGlow({ 
      side, 
      position: Math.max(0, Math.min(100, position)), 
      visible: !isFocused && !isMouseOverInput 
    });
  }, [globalMousePosition, isFocused, isMouseOverInput]);
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [input]);

  return (
    <div className="px-6 pb-6">
      <div 
        className="w-full max-w-4xl mx-auto relative"
        ref={containerRef}
      >
        <div 
          className={cn(
            "glass-card rounded-2xl transition-all duration-300 relative",
            isFocused ? "border-2" : "border",
          )}
          style={{
            ...(isFocused ? { 
              boxShadow: `0 0 20px 4px ${providerColor}40, 0 0 40px 8px ${providerColor}20`,
              borderColor: providerColor
            } : {})
          }}
        >
          {/* 智能边框发光效果 */}
          {borderGlow.visible && !isFocused && (
            <>
              {borderGlow.side === 'top' && (
                <div
                  className="absolute top-0 h-[1px]"
                  style={{
                    left: `${Math.max(0, borderGlow.position - 5)}%`,
                    width: '10%',
                    background: `linear-gradient(90deg, transparent 0%, ${providerColor} 50%, transparent 100%)`,
                    boxShadow: `0 0 10px 2px ${providerColor}60`,
                  }}
                />
              )}
              {borderGlow.side === 'bottom' && (
                <div
                  className="absolute bottom-0 h-[1px]"
                  style={{
                    left: `${Math.max(0, borderGlow.position - 5)}%`,
                    width: '10%',
                    background: `linear-gradient(90deg, transparent 0%, ${providerColor} 50%, transparent 100%)`,
                    boxShadow: `0 0 10px 2px ${providerColor}60`,
                  }}
                />
              )}
              {borderGlow.side === 'left' && (
                <div
                  className="absolute left-0 w-[1px]"
                  style={{
                    top: `${Math.max(0, borderGlow.position - 5)}%`,
                    height: '10%',
                    background: `linear-gradient(180deg, transparent 0%, ${providerColor} 50%, transparent 100%)`,
                    boxShadow: `0 0 10px 2px ${providerColor}60`,
                  }}
                />
              )}
              {borderGlow.side === 'right' && (
                <div
                  className="absolute right-0 w-[1px]"
                  style={{
                    top: `${Math.max(0, borderGlow.position - 5)}%`,
                    height: '10%',
                    background: `linear-gradient(180deg, transparent 0%, ${providerColor} 50%, transparent 100%)`,
                    boxShadow: `0 0 10px 2px ${providerColor}60`,
                  }}
                />
              )}
            </>
          )}

          <textarea
            value={input}
            ref={textareaRef}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder="Ask anything..."
            rows={1}
            className="w-full bg-transparent pl-4 pr-16 py-0 text-gray-200 placeholder-gray-500 focus:outline-none resize-none max-h-48 min-h-[48px] flex items-center leading-normal"
            style={{ paddingTop: '12px', paddingBottom: '12px' }}
            disabled={isStreaming}
          />
        </div>
        
        <button
          onClick={handleSend}
          disabled={isStreaming}
          className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-lg transition-colors"
          style={{ 
            backgroundColor: "transparent"
          }}
        >
          {isStreaming ? (
            <Loader 
              className="w-5 h-5 animate-spin" 
              style={{ color: isFocused ? providerColor : "#6B7280" }}
            />
          ) : (
            <Send 
              className="w-5 h-5" 
              style={{ color: isFocused ? providerColor : "#6B7280" }}
            />
          )}
        </button>
      </div>
    </div>
  );
};

export default Composer;