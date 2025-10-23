import React, { useState } from 'react';
import { Send } from 'lucide-react';
import NeonCore from '../ui/NeonCore';
import useChatStore from '@/lib/store';

interface HomePageProps {
  providerColor: string;
}

const HomePage: React.FC<HomePageProps> = ({ providerColor }) => {
  const [inputValue, setInputValue] = useState('');
  const { selectedProviderId, selectedModelId, startNewChat, sendMessage } = useChatStore();

  const handleSend = async () => {
    if (!inputValue.trim()) return;

    // 创建新聊天
    startNewChat(selectedProviderId, selectedModelId);

    // 发送消息
    await sendMessage(inputValue.trim());

    // 清空输入框
    setInputValue('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
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

      {/* 胶囊输入框 */}
      <div className="mt-12 w-full max-w-3xl">
        <div className="glass-card rounded-full border border-white/10 p-2 pr-2 flex items-center gap-1 hover:border-white/20 transition-all duration-300">
          <textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="输入消息开始对话..."
            className="flex-1 bg-transparent text-white placeholder-gray-500 outline-none resize-none px-4 py-3 max-h-32"
            rows={1}
            style={{
              minHeight: '48px',
              lineHeight: '24px'
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
            className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed"
            style={{
              background: inputValue.trim() ? providerColor : 'rgba(255, 255, 255, 0.1)',
            }}
          >
            <Send className="w-5 h-5 text-white" />
          </button>
        </div>
        <p className="text-gray-500 text-xs mt-3">
          按 Enter 发送，Shift + Enter 换行
        </p>
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
  );
};

export default HomePage;
