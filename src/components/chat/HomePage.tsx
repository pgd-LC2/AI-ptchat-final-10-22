import React, { useState, useMemo } from 'react';
import { Send, Sparkles } from 'lucide-react';
import NeonCore from '../ui/NeonCore';
import useChatStore from '@/lib/store';

interface HomePageProps {
  providerColor: string;
  suggestions?: string[];
}

const defaultSuggestions = [
  '写一个创意故事',
  '解释量子计算',
  '帮我分析数据',
  '生成代码示例'
];

const HomePage: React.FC<HomePageProps> = ({ providerColor, suggestions: propSuggestions }) => {
  const [inputValue, setInputValue] = useState('');
  const { selectedProviderId, selectedModelId, startNewChat, sendMessage } = useChatStore();

  const suggestions = useMemo(() => {
    return propSuggestions && propSuggestions.length > 0 ? propSuggestions : defaultSuggestions;
  }, [propSuggestions]);

  const handleSend = async () => {
    if (!inputValue.trim()) return;

    startNewChat(selectedProviderId, selectedModelId);
    await sendMessage(inputValue.trim());
    setInputValue('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col flex-1 items-center justify-center p-8 relative z-10">
      {/* 核心光效 */}
      <div className="mb-8">
        <NeonCore providerColor={providerColor} />
      </div>

      {/* 标题区 */}
      <div className="text-center mb-12">
        <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-white via-gray-100 to-gray-400 bg-clip-text text-transparent">
          Orbital Chat
        </h1>
        <p className="text-gray-400 text-lg">
          连接世界顶尖AI模型的统一平台
        </p>
      </div>

      {/* 输入区 */}
      <div className="w-full max-w-3xl mb-8">
        <div className="glass-card rounded-full border border-white/10 p-1.5 flex items-center gap-1 hover:border-white/20 focus-within:border-white/30 transition-all duration-300">
          <textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="输入消息开始对话..."
            className="flex-1 bg-transparent text-white placeholder-gray-500 outline-none resize-none px-4 max-h-32"
            rows={1}
            style={{
              minHeight: '40px',
              lineHeight: '40px',
              paddingTop: '0',
              paddingBottom: '0'
            }}
            onInput={(e) => {
              const target = e.target as HTMLTextAreaElement;
              target.style.height = 'auto';
              target.style.height = Math.min(target.scrollHeight, 128) + 'px';
            }}
          />
          <button
            onClick={handleSend}
            disabled={!inputValue.trim()}
            className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 disabled:opacity-30 disabled:cursor-not-allowed hover:scale-105"
            style={{
              background: inputValue.trim() ? providerColor : 'rgba(255, 255, 255, 0.08)',
            }}
          >
            <Send className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>

      {/* 快捷建议 */}
      {suggestions.length > 0 && (
        <div className="w-full max-w-3xl">
          <div className="flex flex-wrap gap-2 justify-center">
            {suggestions.map((text, index) => (
              <button
                key={`${text}-${index}`}
                onClick={() => setInputValue(text)}
                className="glass-card rounded-full px-4 py-2.5 border border-white/5 hover:border-white/20 transition-all duration-300 group"
              >
                <div className="flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-gray-500 group-hover:text-gray-300 transition-colors" />
                  <span className="text-gray-400 group-hover:text-gray-200 transition-colors text-sm whitespace-nowrap">
                    {text}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default HomePage;
