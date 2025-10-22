
import React, { useEffect, useRef } from 'react';
import useChatStore from '@/lib/store';
import MessageBubble from './MessageBubble';

const ChatWindow: React.FC = () => {
  const activeConversationId = useChatStore((state) => state.activeConversationId);
  const tempConversation = useChatStore((state) => state.tempConversation);
  const conversation = useChatStore((state) =>
    activeConversationId ? state.conversations[activeConversationId] : null
  );
  const currentConversation = conversation || tempConversation;
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const shouldAutoScrollRef = useRef(true);

  // 检测用户是否手动滚动
  const handleScroll = () => {
    if (!containerRef.current) return;

    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
    shouldAutoScrollRef.current = isNearBottom;
  };

  useEffect(() => {
    if (shouldAutoScrollRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [currentConversation?.messages]);

  if (!currentConversation) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-500">
        Select or start a new conversation.
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="flex-1 overflow-y-auto p-6"
      onScroll={handleScroll}
    >
      <div className="flex flex-col gap-6">
        {currentConversation.messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
};

export default ChatWindow;
  