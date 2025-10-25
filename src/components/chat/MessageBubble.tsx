
import React from 'react';
import { motion } from 'framer-motion';
import { Bot, User, ChevronRight, ChevronDown, Copy, Check } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import { Message } from '@/types';
import { cn } from '@/lib/utils';
import useChatStore from '@/lib/store';

interface MessageBubbleProps {
  message: Message;
  isLastAssistantMessage?: boolean;
}

// 复制功能组件
const CodeBlock: React.FC<{ language?: string; children: string }> = ({ language, children }) => {
  const [copied, setCopied] = React.useState(false);
  
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(children);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy code:', err);
    }
  };

  return (
    <div className="relative my-4">
      <div className="flex items-center justify-between bg-black/60 rounded-t-lg px-4 py-2 text-xs text-gray-400 border-b border-white/10">
        <span>{language || 'code'}</span>
        <button
          onClick={handleCopy}
          className={`${
            copied ? 'opacity-100' : 'opacity-80'
          } transition-all duration-200 hover:opacity-100 hover:text-neon-cyan hover:scale-105 flex items-center gap-1 px-3 py-1.5 rounded-md bg-white/5 hover:bg-white/15 border border-white/10 hover:border-neon-cyan/30`}
          title="复制代码"
        >
          {copied ? (
            <>
              <Check className="w-3 h-3" />
              <span className="text-xs">已复制</span>
            </>
          ) : (
            <>
              <Copy className="w-3 h-3" />
              <span className="text-xs">复制</span>
            </>
          )}
        </button>
      </div>
      <pre className="bg-black/80 rounded-b-lg p-4 overflow-x-auto border border-white/10 border-t-0">
        <code className={`hljs language-${language || ''} text-sm leading-relaxed`}>
          {children}
        </code>
      </pre>
    </div>
  );
};

// 递归提取文本内容的工具函数
const extractTextFromChildren = (children: React.ReactNode): string => {
  if (typeof children === 'string') {
    return children;
  }
  
  if (typeof children === 'number') {
    return String(children);
  }
  
  if (React.isValidElement(children) && children.props.children) {
    return extractTextFromChildren(children.props.children);
  }
  
  if (Array.isArray(children)) {
    return children.map(extractTextFromChildren).join('');
  }
  
  return '';
};
const MessageBubble: React.FC<MessageBubbleProps> = ({ message, isLastAssistantMessage = false }) => {
  const isUser = message.role === 'user';
  const { messageReasoningVisibility, toggleMessageReasoningVisibility } = useChatStore();
  const isReasoningVisible = messageReasoningVisibility[message.id] || false;
  const hasReasoning = !isUser && message.reasoning && message.reasoning.trim().length > 0;
  const hasContent = message.content && message.content.trim().length > 0;
  const imageList = Array.isArray(message.images) ? message.images : [];
  const hasImages = !isUser && imageList.length > 0;
  const isThinkingOnly = !isUser && hasReasoning && !hasContent && !hasImages;
  const [copied, setCopied] = React.useState(false);

  const handleCopyMessage = async () => {
    try {
      await navigator.clipboard.writeText(message.content || '');
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy message:', err);
    }
  };

  const getImageSrc = (rawUrl: string) => {
    if (!rawUrl) return '';
    if (
      rawUrl.startsWith('data:') ||
      rawUrl.startsWith('http://') ||
      rawUrl.startsWith('https://') ||
      rawUrl.startsWith('blob:')
    ) {
      return rawUrl;
    }
    return `data:image/png;base64,${rawUrl}`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className={cn(
        "flex flex-col w-full max-w-4xl mx-auto group",
        isUser ? "items-end" : "items-start"
      )}
    >
      <div className={cn(
        "flex items-start gap-4",
        isUser ? "justify-end" : "justify-start"
      )}>
      {!isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full glass-card flex items-center justify-center ring-1 ring-neon-cyan/50">
          <Bot className="w-5 h-5 text-neon-cyan" />
        </div>
      )}
      <div
        className={cn(
          "glass-card rounded-2xl px-4 py-3 text-base leading-relaxed min-h-[44px] select-text cursor-text",
          isUser ? "rounded-br-md" : "rounded-bl-md"
        )}
        style={{ userSelect: 'text', cursor: 'text' }}
      >
        {/* 思考过程（展开时显示在最上方） */}
        {hasReasoning && isReasoningVisible && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="mb-4 pb-4 border-b border-white/10"
          >
            <div className="flex items-center gap-2 mb-2">
              <div className="w-1 h-4 bg-neon-cyan rounded-full"></div>
              <span className="text-xs font-medium text-neon-cyan uppercase tracking-wide">
                思维过程
              </span>
            </div>
            <div className="bg-black/20 rounded-lg p-3 text-sm text-gray-300 font-mono leading-relaxed max-h-64 overflow-y-auto">
              <p className="whitespace-pre-wrap">{message.reasoning}</p>
            </div>
          </motion.div>
        )}

        <div className="flex items-start justify-between gap-3">
          {isThinkingOnly ? (
            <p className="whitespace-pre-wrap flex-1 text-gray-400 italic">
              正在思考...
            </p>
          ) : (
            <div className="flex-1 prose prose-invert prose-sm max-w-none">
              {hasContent && (
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  rehypePlugins={[rehypeHighlight]}
                  components={{
                    // 自定义组件样式
                    h1: ({ children }) => <h1 className="text-xl font-bold mb-3 text-white">{children}</h1>,
                    h2: ({ children }) => <h2 className="text-lg font-semibold mb-2 text-white">{children}</h2>,
                    h3: ({ children }) => <h3 className="text-base font-medium mb-2 text-white">{children}</h3>,
                    p: ({ children }) => <p className="mb-0 last:mb-0 [&:not(:last-child)]:mb-3 text-gray-200 leading-relaxed">{children}</p>,
                    ul: ({ children }) => <ul className="list-disc list-inside mb-3 text-gray-200 space-y-1">{children}</ul>,
                    ol: ({ children }) => <ol className="list-decimal list-inside mb-3 text-gray-200 space-y-1">{children}</ol>,
                    li: ({ children }) => <li className="text-gray-200">{children}</li>,
                    blockquote: ({ children }) => (
                      <blockquote className="border-l-4 border-neon-cyan pl-4 italic text-gray-300 my-3">
                        {children}
                      </blockquote>
                    ),
                    code: ({ inline, className, children }: any) => {
                      const match = /language-(\w+)/.exec(className || '');
                      const language = match ? match[1] : undefined;
                      // 使用递归函数正确提取文本内容
                      const code = extractTextFromChildren(children).replace(/\n$/, '');
                      
                      return !inline ? (
                        <CodeBlock language={language}>
                          {code}
                        </CodeBlock>
                      ) : (
                        <code className="bg-black/40 text-neon-cyan px-1.5 py-0.5 rounded text-sm font-mono">
                          {extractTextFromChildren(children)}
                        </code>
                      );
                    },
                    table: ({ children }) => (
                      <div className="overflow-x-auto my-4">
                        <table className="w-full border-collapse border border-white/20 rounded-lg overflow-hidden">
                          {children}
                        </table>
                      </div>
                    ),
                    th: ({ children }) => (
                      <th className="border border-white/20 bg-white/10 px-3 py-2 text-left font-semibold text-white">
                        {children}
                      </th>
                    ),
                    td: ({ children }) => (
                      <td className="border border-white/20 px-3 py-2 text-gray-200">
                        {children}
                      </td>
                    ),
                    a: ({ href, children }) => (
                      <a 
                        href={href} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-neon-cyan hover:text-neon-cyan/80 underline transition-colors"
                      >
                        {children}
                      </a>
                    ),
                    strong: ({ children }) => <strong className="font-semibold text-white">{children}</strong>,
                    em: ({ children }) => <em className="italic text-gray-300">{children}</em>,
                    hr: () => <hr className="border-t border-white/20 my-4" />,
                  }}
                >
                  {message.content}
                </ReactMarkdown>
              )}
              {hasImages && (
                <div className={cn("mt-4 grid gap-4", imageList.length > 1 ? "sm:grid-cols-2" : "grid-cols-1")}>
                  {imageList.map((image, index) => {
                    const src = getImageSrc(image.url);
                    const altText = image.alt || `AI生成的图片 ${index + 1}`;
                    return (
                      <div
                        key={`${image.url}-${index}`}
                        className="relative overflow-hidden rounded-xl border border-white/10 bg-black/40 backdrop-blur-lg"
                      >
                        {src ? (
                          <img
                            src={src}
                            alt={altText}
                            loading="lazy"
                            className="w-full h-full object-contain max-h-96 bg-gradient-to-br from-black/60 to-black/20"
                            onError={(event) => {
                              const target = event.currentTarget;
                              target.onerror = null;
                              target.alt = '图片加载失败';
                              target.classList.add('opacity-60');
                            }}
                          />
                        ) : (
                          <div className="flex items-center justify-center h-48 text-gray-400 text-sm">
                            图片数据不可用
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
          {hasReasoning && (
            <button
              onClick={() => toggleMessageReasoningVisibility(message.id)}
             className="flex-shrink-0 p-1.5 rounded-md hover:bg-white/10 text-gray-400 hover:text-gray-300 transition-colors mt-0.25"
              title="显示/隐藏思维过程"
            >
              {isReasoningVisible ? (
               <ChevronDown className="w-4 h-4" />
              ) : (
               <ChevronRight className="w-4 h-4" />
              )}
            </button>
          )}
        </div>
      </div>
      {isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full glass-card flex items-center justify-center ring-1 ring-neon-pink/50">
          <User className="w-5 h-5 text-neon-pink" />
        </div>
      )}
      </div>

      {hasContent && !isThinkingOnly && (
        <div className={cn(
          "flex items-center gap-1 mt-1.5 transition-opacity duration-200",
          isUser ? "mr-12" : "ml-12",
          isLastAssistantMessage && !isUser ? "opacity-100" : "opacity-0 group-hover:opacity-100"
        )}>
          <button
            onClick={handleCopyMessage}
            className="p-1.5 rounded-md hover:bg-white/10 text-gray-400 hover:text-gray-200 transition-colors"
            title="复制"
          >
            {copied ? (
              <Check className="w-4 h-4 text-neon-cyan" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
          </button>
        </div>
      )}
    </motion.div>
  );
};

export default MessageBubble;
  
