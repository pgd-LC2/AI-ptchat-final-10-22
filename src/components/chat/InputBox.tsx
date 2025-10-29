import React, { useState, useRef } from 'react';
import { Send, Plus, X, Loader2 } from 'lucide-react';
import AttachmentMenu from './AttachmentMenu';
import useChatStore from '@/lib/store';

interface InputBoxProps {
  providerColor: string;
  onSend?: (message: string) => void;
  placeholder?: string;
  menuPosition?: 'top' | 'bottom';
}

const InputBox: React.FC<InputBoxProps> = ({
  providerColor,
  onSend,
  placeholder = '输入消息开始对话...',
  menuPosition = 'bottom'
}) => {
  const [inputValue, setInputValue] = useState('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [selectedFeature, setSelectedFeature] = useState<'file' | 'image' | 'code' | 'link' | null>(null);
  const plusButtonRef = useRef<HTMLButtonElement>(null);
  const sendMessage = useChatStore((state) => state.sendMessage);
  const isStreaming = useChatStore((state) => state.isStreaming);

  const handleSend = async () => {
    if (!inputValue.trim() || isStreaming) return;

    if (onSend) {
      onSend(inputValue.trim());
    } else {
      await sendMessage(inputValue.trim());
    }
    setInputValue('');
    setSelectedFeature(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleMenuOption = (option: 'file' | 'image' | 'code' | 'link') => {
    setSelectedFeature(option);

    switch (option) {
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

  const getFeatureLabel = (feature: 'file' | 'image' | 'code' | 'link') => {
    const labels = {
      file: '文件',
      image: '图片',
      code: '代理',
      link: '源'
    };
    return labels[feature];
  };

  const getFeatureIcon = (feature: 'file' | 'image' | 'code' | 'link') => {
    const icons = {
      file: '📎',
      image: '🖼️',
      code: '💻',
      link: '🔗'
    };
    return icons[feature];
  };

  return (
    <div className="w-full relative">
      {selectedFeature && (
        <div className="mb-2 flex items-center gap-2">
          <div className="glass-card rounded-full border border-white/10 px-3 py-1.5 flex items-center gap-2 group hover:border-white/20 transition-all">
            <span className="text-base">{getFeatureIcon(selectedFeature)}</span>
            <span className="text-sm text-blue-400 font-medium">{getFeatureLabel(selectedFeature)}</span>
            <button
              onClick={() => setSelectedFeature(null)}
              className="p-0.5 rounded-full hover:bg-white/10 transition-colors ml-1"
            >
              <X className="w-3.5 h-3.5 text-gray-400 group-hover:text-gray-300" />
            </button>
          </div>
        </div>
      )}
      <div className="glass-card rounded-full border border-white/10 p-1.5 flex items-center hover:border-white/20 focus-within:border-white/30 transition-all duration-300">
        <button
          ref={plusButtonRef}
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="flex-shrink-0 p-2 ml-1 rounded-full transition-colors hover:bg-white/5"
          title="添加附件"
          disabled={isStreaming}
        >
          <Plus className="w-5 h-5 text-gray-500" />
        </button>

        <AttachmentMenu
          isOpen={isMenuOpen}
          onClose={() => setIsMenuOpen(false)}
          onSelectOption={handleMenuOption}
          triggerRect={plusButtonRef.current?.getBoundingClientRect()}
          position={menuPosition}
        />
        <textarea
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={isStreaming}
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
          disabled={!inputValue.trim() || isStreaming}
          className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 disabled:opacity-30 disabled:cursor-not-allowed hover:scale-105"
          style={{
            background: inputValue.trim() && !isStreaming ? providerColor : 'rgba(255, 255, 255, 0.08)',
          }}
        >
          {isStreaming ? (
            <Loader2 className="w-5 h-5 text-white animate-spin" />
          ) : (
            <Send className="w-5 h-5 text-white" />
          )}
        </button>
      </div>
    </div>
  );
};

export default InputBox;
