import React, { useRef, useEffect } from 'react';
import { Paperclip, Search, Image, Code, Link as LinkIcon, MoreHorizontal } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface AttachmentMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectOption: (option: 'search' | 'file' | 'image' | 'code' | 'link') => void;
  triggerRect?: DOMRect;
}

const AttachmentMenu: React.FC<AttachmentMenuProps> = ({ isOpen, onClose, onSelectOption, triggerRect }) => {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  const menuOptions = [
    { id: 'file', icon: Paperclip, label: '添加照片和文件', description: '上传本地文件' },
    { id: 'search', icon: Search, label: '深度研究', description: '联网搜索相关内容' },
    { id: 'image', icon: Image, label: '创建图片', description: '生成 AI 图片' },
    { id: 'code', icon: Code, label: '代理模式', description: '执行代码任务' },
    { id: 'link', icon: LinkIcon, label: '添加源', description: '添加网页链接' },
  ];

  const position = triggerRect ? {
    top: triggerRect.bottom + 8,
    left: triggerRect.left,
  } : {
    top: 80,
    left: 20,
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={menuRef}
          initial={{ opacity: 0, y: -10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.95 }}
          transition={{ duration: 0.15 }}
          className="fixed z-50 glass-card rounded-xl border border-white/10 shadow-2xl overflow-hidden"
          style={{
            top: position.top,
            left: position.left,
            minWidth: '280px',
          }}
        >
          <div className="p-2">
            {menuOptions.map((option) => (
              <button
                key={option.id}
                onClick={() => {
                  onSelectOption(option.id as any);
                  onClose();
                }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/5 transition-colors text-left group"
              >
                <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center group-hover:bg-white/10 transition-colors">
                  <option.icon className="w-4 h-4 text-gray-400 group-hover:text-white transition-colors" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-white group-hover:text-white transition-colors">
                    {option.label}
                  </div>
                  <div className="text-xs text-gray-500 group-hover:text-gray-400 transition-colors truncate">
                    {option.description}
                  </div>
                </div>
              </button>
            ))}

            <div className="h-px bg-white/5 my-2" />

            <button
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/5 transition-colors text-left group"
              onClick={onClose}
            >
              <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center group-hover:bg-white/10 transition-colors">
                <MoreHorizontal className="w-4 h-4 text-gray-400 group-hover:text-white transition-colors" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-white group-hover:text-white transition-colors">
                  更多
                </div>
              </div>
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AttachmentMenu;
