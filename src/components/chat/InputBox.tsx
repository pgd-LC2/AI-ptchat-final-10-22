import React, { useState, useRef } from 'react';
import { Send, Plus } from 'lucide-react';
import AttachmentMenu from './AttachmentMenu';
import useChatStore from '@/lib/store';
import { performWebSearch, formatSearchResults } from '@/lib/search-service';

interface InputBoxProps {
  providerColor: string;
  onSend?: (message: string) => void;
  placeholder?: string;
}

const InputBox: React.FC<InputBoxProps> = ({
  providerColor,
  onSend,
  placeholder = '输入消息开始对话...'
}) => {
  const [inputValue, setInputValue] = useState('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const plusButtonRef = useRef<HTMLButtonElement>(null);
  const sendMessage = useChatStore((state) => state.sendMessage);
  const isStreaming = useChatStore((state) => state.isStreaming);

  const handleSend = async () => {
    if (!inputValue.trim() || isStreaming || isSearching) return;

    if (onSend) {
      onSend(inputValue.trim());
    } else {
      await sendMessage(inputValue.trim());
    }
    setInputValue('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleWebSearch = async () => {
    if (!inputValue.trim()) return;

    setIsSearching(true);

    try {
      const searchResult = await performWebSearch({
        query: inputValue.trim(),
        limit: 5,
        scrapeContent: false,
      });

      if (searchResult.success && searchResult.results) {
        const formattedResults = formatSearchResults(searchResult.results);
        const enhancedMessage = `请基于以下搜索结果回答问题：${inputValue.trim()}\n\n${formattedResults}`;

        await sendMessage(enhancedMessage);
        setInputValue('');
      } else {
        console.error('搜索失败:', searchResult.error);
        alert('搜索失败，请稍后重试');
      }
    } catch (error) {
      console.error('搜索错误:', error);
      alert('搜索出错，请稍后重试');
    } finally {
      setIsSearching(false);
    }
  };

  const handleMenuOption = (option: 'search' | 'file' | 'image' | 'code' | 'link') => {
    switch (option) {
      case 'search':
        handleWebSearch();
        break;
      case 'file':
        console.log('上传文件功能开发中');
        break;
      case 'image':
        console.log('创建图片功能开发中');
        break;
      case 'code':
        console.log('代理模式功能开发中');
        break;
      case 'link':
        console.log('添加链接功能开发中');
        break;
    }
  };

  return (
    <div className="w-full relative">
      <div className="glass-card rounded-full border border-white/10 p-1.5 flex items-center hover:border-white/20 focus-within:border-white/30 transition-all duration-300">
        <div className="relative z-[100]">
          <button
            ref={plusButtonRef}
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="flex-shrink-0 p-2 ml-1 rounded-full transition-colors hover:bg-white/5"
            title="添加附件"
            disabled={isSearching || isStreaming}
          >
            <Plus className="w-5 h-5 text-gray-500" />
          </button>

          <AttachmentMenu
            isOpen={isMenuOpen}
            onClose={() => setIsMenuOpen(false)}
            onSelectOption={handleMenuOption}
            triggerRect={plusButtonRef.current?.getBoundingClientRect()}
          />
        </div>
        <textarea
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={isStreaming || isSearching}
          className="flex-1 bg-transparent text-white placeholder-gray-500 outline-none resize-none pl-1 pr-4 max-h-32"
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
          disabled={!inputValue.trim() || isSearching || isStreaming}
          className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 disabled:opacity-30 disabled:cursor-not-allowed hover:scale-105"
          style={{
            background: inputValue.trim() && !isSearching && !isStreaming ? providerColor : 'rgba(255, 255, 255, 0.08)',
          }}
        >
          <Send className="w-5 h-5 text-white" />
        </button>
      </div>
    </div>
  );
};

export default InputBox;
