import React from 'react';
import { Sparkles } from 'lucide-react';
import NeonCore from '../ui/NeonCore';
import InputBox from './InputBox';
import useChatStore from '@/lib/store';

interface HomePageProps {
  providerColor: string;
}

const HomePage: React.FC<HomePageProps> = ({ providerColor }) => {
  const { selectedProviderId, selectedModelId, startNewChat, sendMessage } = useChatStore();

  const handleSend = async (message: string) => {
    startNewChat(selectedProviderId, selectedModelId);
    await sendMessage(message);
  };

  const suggestions = [
    '写一个创意故事',
    '解释量子计算',
    '帮我分析数据',
    '生成代码示例'
  ];

  return (
    <div className="flex flex-col flex-1 items-center justify-center p-8 relative">
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
        <InputBox providerColor={providerColor} onSend={handleSend} menuPosition="bottom" />
      </div>

      {/* 快捷建议 */}
      <div className="w-full max-w-3xl relative z-0">
        <div className="flex flex-wrap gap-2 justify-center">
          {suggestions.map((text, index) => (
            <button
              key={index}
              onClick={() => {
                startNewChat(selectedProviderId, selectedModelId);
                sendMessage(text);
              }}
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
    </div>
  );
};

export default HomePage;
