import React, { useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Paperclip, Search, Image, Code, Link as LinkIcon, MoveHorizontal as MoreHorizontal } from 'lucide-react';
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
    { id: 'file', icon: Paperclip, label: '添加照片和文件', shortcut: 'Ctrl + U' },
    { id: 'search', icon: Search, label: '深度研究' },
    { id: 'image', icon: Image, label: '创建图片' },
    { id: 'code', icon: Code, label: '代理模式' },
    { id: 'link', icon: LinkIcon, label: '添加源' },
  ];

  const menuContent = (
    <AnimatePresence>
      {isOpen && triggerRect && (
        <motion.div
          ref={menuRef}
          initial={{ opacity: 0, y: -10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.95 }}
          transition={{ duration: 0.15 }}
          className="fixed z-[9999] glass-card rounded-3xl border border-white/10 shadow-2xl overflow-hidden"
          style={{
            minWidth: '240px',
            left: `${triggerRect.left}px`,
            top: `${triggerRect.bottom + 8}px`,
          }}
        >
          <div className="p-1.5">
            {menuOptions.map((option) => (
              <button
                key={option.id}
                onClick={() => {
                  onSelectOption(option.id as any);
                  onClose();
                }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-full hover:bg-white/5 transition-colors text-left group"
              >
                <option.icon className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors flex-shrink-0" />
                <span className="text-sm text-gray-200 group-hover:text-white transition-colors flex-1">
                  {option.label}
                </span>
                {option.shortcut && (
                  <span className="text-xs text-gray-500 group-hover:text-gray-400 transition-colors flex-shrink-0">
                    {option.shortcut}
                  </span>
                )}
              </button>
            ))}

            <div className="h-px bg-white/5 my-1.5" />

            <button
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-full hover:bg-white/5 transition-colors text-left group"
              onClick={onClose}
            >
              <MoreHorizontal className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors flex-shrink-0" />
              <span className="text-sm text-gray-200 group-hover:text-white transition-colors flex-1">
                更多
              </span>
              <span className="text-gray-500 group-hover:text-gray-400 transition-colors">
                →
              </span>
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return createPortal(menuContent, document.body);
};

export default AttachmentMenu;
