
import React, { useState, useRef } from 'react';
import { MessageSquarePlus, Home, MoveHorizontal as MoreHorizontal, CreditCard as Edit3, Download, Trash2, Crown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import useChatStore from '@/lib/store';
import UserManager from './UserManager';
import { cn } from '@/lib/utils';
import { useTheme } from '@/lib/ThemeProvider';

const Sidebar: React.FC = () => {
  const navigate = useNavigate();
  const {
    conversations,
    activeConversationId,
    startNewChat,
    setActiveConversationId,
    selectedProviderId,
    selectedModelId,
    clearActiveConversation,
    renameConversation,
    deleteConversation,
    exportConversation
  } = useChatStore();
  const conversationList = Object.values(conversations).sort((a, b) => {
    // Ensure createdAt is a Date object before calling getTime()
    const dateA = a.createdAt instanceof Date ? a.createdAt : new Date(a.createdAt);
    const dateB = b.createdAt instanceof Date ? b.createdAt : new Date(b.createdAt);
    return dateB.getTime() - dateA.getTime();
  });
  const { providerColor } = useTheme();
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [hoveredConversationId, setHoveredConversationId] = useState<string | null>(null);
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const sidebarRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (sidebarRef.current) {
      const rect = sidebarRef.current.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top) / rect.height;
      setMousePosition({ x, y });
    }
  };

  const getFloatingStyle = (conversationId: string) => {
    if (activeConversationId !== conversationId) return {};
    
    // 计算3D变换
    const rotateX = (mousePosition.y - 0.5) * -20; // -10到10度，增强上下视差
    const rotateY = (mousePosition.x - 0.5) * 15; // -7.5到7.5度
    const translateZ = 8; // 适中的向前移动距离
    
    return {
      transform: `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(${translateZ}px) scale(1.05)`,
      transformOrigin: 'center center',
      boxShadow: `
        0 8px 24px -4px ${providerColor}60,
        0 16px 48px -8px ${providerColor}40,
        0 4px 12px -2px ${providerColor}80,
        0 0 0 1px ${providerColor}50,
        inset 0 1px 0 ${providerColor}20
      `,
      background: `linear-gradient(135deg, ${providerColor}20, ${providerColor}10, ${providerColor}05)`,
      backdropFilter: 'blur(16px)',
      zIndex: 20,
      border: `1px solid ${providerColor}30`,
    };
  };

  const handleRename = (id: string, currentTitle: string) => {
    setRenamingId(id);
    setRenameValue(currentTitle);
    setMenuOpenId(null);
  };

  const confirmRename = (id: string) => {
    if (renameValue.trim()) {
      renameConversation(id, renameValue.trim());
    }
    setRenamingId(null);
    setRenameValue('');
  };

  const cancelRename = () => {
    setRenamingId(null);
    setRenameValue('');
  };

  const handleDelete = (id: string) => {
    if (window.confirm('确定要删除这个聊天吗？此操作不可撤销。')) {
      deleteConversation(id);
    }
    setMenuOpenId(null);
  };

  const handleExport = (id: string) => {
    exportConversation(id);
    setMenuOpenId(null);
  };

  return (
    <div 
      ref={sidebarRef}
      className="w-72 bg-black/20 h-full flex flex-col p-3 gap-y-2 border-r border-white/10 overflow-hidden"
      onMouseMove={handleMouseMove}
      style={{
        '--scrollbar-color': providerColor
      } as React.CSSProperties}
    >
      <button 
        onClick={clearActiveConversation}
        className="flex items-center justify-between w-full px-3 py-2 rounded-lg text-sm font-medium text-gray-200 bg-white/5 hover:bg-white/10 transition-colors"
      >
        返回首页
        <Home className="w-4 h-4" />
      </button>
      <button 
        onClick={() => startNewChat(selectedProviderId, selectedModelId)}
        className="flex items-center justify-between w-full px-3 py-2 rounded-lg text-sm font-medium text-gray-200 bg-white/5 hover:bg-white/10 transition-colors"
        style={{ backgroundColor: `${providerColor}10` }}
      >
        新聊天
        <MessageSquarePlus className="w-4 h-4" />
      </button>
      <div className="flex-1 overflow-y-auto overflow-x-hidden mt-2 dynamic-scrollbar">
        <div className="flex flex-col gap-1 px-2 py-2">
          {conversationList.map((conv) => (
            <div
              key={conv.id}
              className="relative group"
              onMouseEnter={() => setHoveredConversationId(conv.id)}
              onMouseLeave={() => setHoveredConversationId(null)}
            >
              {renamingId === conv.id ? (
                <input
                  type="text"
                  value={renameValue}
                  onChange={(e) => setRenameValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') confirmRename(conv.id);
                    if (e.key === 'Escape') cancelRename();
                  }}
                  onBlur={() => confirmRename(conv.id)}
                  autoFocus
                  className="w-full px-3 py-2 bg-white/10 rounded-lg text-sm text-white border border-white/20 focus:outline-none focus:border-white/40"
                />
              ) : (
                <button
                  onClick={() => setActiveConversationId(conv.id)}
                  className={cn(
                    "w-full text-left px-3 py-2 rounded-lg text-sm truncate transition-all duration-300 ease-out relative",
                    activeConversationId === conv.id 
                      ? "text-white font-medium" 
                      : "text-gray-400 hover:bg-white/5 hover:text-gray-200"
                  )}
                  style={activeConversationId === conv.id ? getFloatingStyle(conv.id) : {}}
                >
                  {conv.title}
                </button>
              )}
              
              {/* 三点菜单按钮 */}
              {(hoveredConversationId === conv.id || menuOpenId === conv.id) && renamingId !== conv.id && (
                <div className="absolute right-2 top-1/2 -translate-y-1/2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setMenuOpenId(menuOpenId === conv.id ? null : conv.id);
                    }}
                    className="p-1 rounded-md hover:bg-white/10 text-gray-400 hover:text-gray-200 transition-colors"
                  >
                    <MoreHorizontal className="w-4 h-4" />
                  </button>
                </div>
              )}
              
              {/* 下拉菜单 */}
              {menuOpenId === conv.id && (
                <div className="absolute right-0 top-full mt-1 bg-black/80 backdrop-blur-lg rounded-lg border border-white/20 shadow-lg z-30 min-w-[120px]">
                  <button
                    onClick={() => handleRename(conv.id, conv.title)}
                    className="w-full flex items-center gap-2 px-3 py-3 text-sm font-medium text-gray-200 hover:bg-white/10 hover:text-white rounded-t-lg transition-colors"
                  >
                    <Edit3 className="w-4 h-4" />
                    重命名
                  </button>
                  <button
                    onClick={() => handleExport(conv.id)}
                    className="w-full flex items-center gap-2 px-3 py-3 text-sm font-medium text-gray-200 hover:bg-white/10 hover:text-white transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    导出
                  </button>
                  <button
                    onClick={() => handleDelete(conv.id)}
                    className="w-full flex items-center gap-2 px-3 py-3 text-sm font-medium text-red-400 hover:bg-red-500/20 hover:text-red-300 rounded-b-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    删除
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
      
      {/* 点击空白区域关闭菜单 */}
      {menuOpenId && (
        <div 
          className="fixed inset-0 z-20" 
          onClick={() => setMenuOpenId(null)} 
        />
      )}

      {/* 升级订阅按钮 */}
      <button
        onClick={() => navigate('/pricing')}
        className="flex items-center justify-between w-full px-3 py-2.5 rounded-lg text-sm font-medium text-white bg-gradient-to-r from-neon-purple to-neon-pink hover:opacity-90 transition-all duration-300 shadow-lg hover:shadow-neon-purple/25"
      >
        <span className="flex items-center gap-2">
          <Crown className="w-4 h-4" />
          升级订阅
        </span>
      </button>

      {/* 用户管理 */}
      <div className="mt-4 pt-4 border-t border-white/10">
        <UserManager />
      </div>
      
    </div>
  );
};

export default Sidebar;
  