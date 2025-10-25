
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Message, Conversation, ProviderId, MessageImage } from '@/types';
import { streamResponse, handleStreamResponse } from '@/lib/api';
import { ChatMessage } from '@/types';
import { getOpenRouterModelName } from '@/lib/model-mapping';
import { checkSearchNeed, generateSearchPlan, performSearchPlan, formatSearchResults } from '@/lib/search-service';

interface ChatState {
  conversations: Record<string, Conversation>;
  activeConversationId: string | null;
  tempConversation: Conversation | null;
  messageReasoningVisibility: Record<string, boolean>;
  isStreaming: boolean;
  selectedProviderId: ProviderId;
  selectedModelId: string;
  startNewChat: (providerId: ProviderId, modelId: string) => void;
  setActiveConversationId: (id: string) => void;
  addMessage: (conversationId: string, message: Message) => void;
  updateLastMessage: (conversationId: string, chunk: { content?: string; reasoning?: string; images?: MessageImage[] }) => void;
  toggleMessageReasoningVisibility: (messageId: string) => void;
  sendMessage: (content: string) => Promise<void>;
  setStreaming: (isStreaming: boolean) => void;
  setSelectedProviderModel: (providerId: ProviderId, modelId: string) => void;
  updateConversationModel: (conversationId: string, providerId: ProviderId, modelId: string) => void;
  updateTempConversationModel: (providerId: ProviderId, modelId: string) => void;
  clearActiveConversation: () => void;
  renameConversation: (id: string, title: string) => void;
  deleteConversation: (id: string) => void;
  exportConversation: (id: string) => void;
}

const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      conversations: {},
      activeConversationId: null,
      tempConversation: null,
      messageReasoningVisibility: {},
      isStreaming: false,
      selectedProviderId: 'auto',
      selectedModelId: 'openrouter/auto',

      startNewChat: (providerId, modelId) => {
        const id = `conv_${Date.now()}`;
        const tempConversation: Conversation = {
          id,
          title: 'New Chat',
          messages: [],
          providerId,
          modelId,
          createdAt: new Date(),
        };
        set((_state) => ({
          tempConversation,
          activeConversationId: null,
        }));
      },

      setSelectedProviderModel: (providerId, modelId) => {
        set({ selectedProviderId: providerId, selectedModelId: modelId });
      },

      updateConversationModel: (conversationId, providerId, modelId) => {
        set((state) => ({
          conversations: {
            ...state.conversations,
            [conversationId]: {
              ...state.conversations[conversationId],
              providerId,
              modelId,
            },
          },
        }));
      },

      updateTempConversationModel: (providerId, modelId) => {
        set((state) => ({
          tempConversation: state.tempConversation ? {
            ...state.tempConversation,
            providerId,
            modelId,
          } : null,
        }));
      },

      setActiveConversationId: (id) => {
        set({ activeConversationId: id });
      },

      addMessage: (conversationId, message) => {
        set((state) => {
          const conversation = state.conversations[conversationId];
          if (!conversation) return {};
          return {
            conversations: {
              ...state.conversations,
              [conversationId]: {
                ...conversation,
                messages: [...conversation.messages, message],
              },
            },
          };
        });
      },

      updateLastMessage: (conversationId, chunk) => {
        set((state) => {
          const conversation = state.conversations[conversationId];
          if (!conversation || conversation.messages.length === 0) return {};
          
          const lastMessage = conversation.messages[conversation.messages.length - 1];
         console.log('📝 Current message content:', JSON.stringify(lastMessage.content));
         console.log('📝 Current message reasoning:', JSON.stringify(lastMessage.reasoning || ''));
         console.log('📥 Incoming chunk:', chunk);
         
          const existingImages = lastMessage.images || [];
          const newImages = chunk.images?.length
            ? chunk.images.filter((image) => !existingImages.some((existing) => existing.url === image.url))
            : [];
          const updatedMessage = { 
            ...lastMessage, 
            content: lastMessage.content + (chunk.content || ''),
            reasoning: (lastMessage.reasoning || '') + (chunk.reasoning || ''),
            images: newImages.length > 0 ? [...existingImages, ...newImages] : existingImages
          };

         console.log('📤 Updated message content:', JSON.stringify(updatedMessage.content));
         console.log('📤 Updated message reasoning:', JSON.stringify(updatedMessage.reasoning || ''));
         console.log('🖼️ Updated message images:', updatedMessage.images?.length || 0);
          return {
            conversations: {
              ...state.conversations,
              [conversationId]: {
                ...conversation,
                messages: [...conversation.messages.slice(0, -1), updatedMessage],
              },
            },
          };
        });
      },

      toggleMessageReasoningVisibility: (messageId) => {
        set((state) => ({
          messageReasoningVisibility: {
            ...state.messageReasoningVisibility,
            [messageId]: !state.messageReasoningVisibility[messageId],
          },
        }));
      },

      sendMessage: async (content) => {
        const { activeConversationId, tempConversation, addMessage, updateLastMessage, setStreaming } = get();

        let conversationId: string | null = activeConversationId;

        // 如果有临时聊天，先将其保存为真正的聊天
        if (tempConversation && !activeConversationId) {
          const newConversationId = tempConversation.id;
          // 生成聊天标题（使用用户消息的前20个字符）
          const title = content.length > 20 ? content.substring(0, 20) + '...' : content;
          const newConversation = { ...tempConversation, title };

          set((state) => ({
            conversations: { ...state.conversations, [newConversationId]: newConversation },
            activeConversationId: newConversationId,
            tempConversation: null,
          }));

          conversationId = newConversationId;
        }

        if (!conversationId) return;

        const userMessage: Message = {
          id: `msg_${Date.now()}`,
          role: 'user',
          content,
          createdAt: new Date(),
        };
        addMessage(conversationId, userMessage);
        setStreaming(true);

        // 立即添加助手消息占位
        const assistantMessageId = `msg_${Date.now() + 1}`;
        const assistantMessage: Message = {
          id: assistantMessageId,
          role: 'assistant',
          content: '',
          reasoning: '',
          createdAt: new Date(),
        };
        addMessage(conversationId, assistantMessage);

        // 检查是否需要搜索
        const conversation = get().conversations[conversationId];
        if (!conversation) {
          setStreaming(false);
          return;
        }

        const conversationHistory = conversation.messages
          .slice(-5)
          .map(msg => ({
            role: msg.role,
            content: msg.content,
          }));

        const searchCheck = await checkSearchNeed(content, conversationHistory);
        console.log('🔍 搜索判断:', searchCheck);

        let searchContext = '';
        let searchResults: any[] = [];
        if (searchCheck.needsSearch) {
          // 让 Gemini Flash 根据 Firecrawl API 文档自动生成最优搜索策略
          const searchPlan = await generateSearchPlan(content, conversationHistory);
          console.log('🔍 生成的搜索计划:', searchPlan);

          // 执行搜索计划
          searchResults = await performSearchPlan(searchPlan);

          if (searchResults.length > 0) {
            searchContext = formatSearchResults(searchResults);
            console.log('🔍 搜索完成，共', searchResults.length, '条结果');
          }
        }

        try {
          // 获取当前对话的消息历史，转换为 ChatMessage 格式
          const currentConversation = get().conversations[conversationId];
          if (!currentConversation) {
            throw new Error('Conversation not found');
          }

          // 构建消息历史（排除刚添加的助手空消息，保留最后一条用户消息）
          const chatMessages: ChatMessage[] = currentConversation.messages
            .filter(msg => {
              // 排除空助手消息，但保留最新的用户消息
              if (msg.role === 'assistant' && msg.content === '') return false;
              return true;
            })
            .slice(-10) // 只保留最近10条消息
            .map(msg => ({
              role: msg.role as 'system' | 'user' | 'assistant',
              content: msg.content,
            }));

          // 如果有搜索结果，添加到系统消息
          if (searchContext) {
            const urlList = searchResults.map((r, i) => `[${i + 1}] ${r.url}`).join('\n');
            const example1 = searchResults[0]?.url || '#';
            const example2 = searchResults[1]?.url || '#';
            const example3 = searchResults[2]?.url || '#';

            chatMessages.unshift({
              role: 'system',
              content: `以下是最新的网络搜索结果，请基于这些信息回答用户的问题：

${searchContext}

重要：当你引用搜索结果中的信息时，必须使用 Markdown 链接格式来标注信息来源。格式为：` + '[[数字]](URL)' + `

搜索结果的URL列表：
${urlList}

引用示例：
- "根据最新报道` + `[[1]](${example1})` + `，该事件发生在..."
- "研究表明` + `[[2]](${example2})[[3]](${example3})` + `，这种方法可以..."

注意：
1. 必须使用 ` + '[[数字]](URL)' + ` 格式，不要使用普通的 [数字]
2. URL 必须从上面的列表中选择对应的链接
3. 可以连续使用多个引用，如 ` + '[[1]](url1)[[2]](url2)',
            });
          }
          
          // 获取当前对话的OpenRouter模型名称
          const openRouterModel = getOpenRouterModelName(currentConversation.providerId, currentConversation.modelId);
          
          console.log(`Using model: ${openRouterModel} (Provider: ${currentConversation.providerId}, Model: ${currentConversation.modelId})`);
          
          // 调用实际的 OpenRouter API
          const stream = await streamResponse(chatMessages, openRouterModel);
          
          // 处理流式响应
          await handleStreamResponse(
            stream,
            (chunk) => updateLastMessage(conversationId, chunk),
            () => console.log('Stream completed'),
            (error) => {
              console.error('Stream error:', error);
              updateLastMessage(conversationId, { content: `\n\n[错误: ${error.message}]` });
            }
          );
        } catch (error) {
          console.error("Streaming error:", error);
          updateLastMessage(conversationId, { content: `\n\n[错误: ${error instanceof Error ? error.message : '未知错误'}]` });
        } finally {
          setStreaming(false);
        }
      },

      setStreaming: (isStreaming) => set({ isStreaming }),

      clearActiveConversation: () => {
        set({ activeConversationId: null, tempConversation: null });
      },

      renameConversation: (id, title) => {
        set((state) => ({
          conversations: {
            ...state.conversations,
            [id]: {
              ...state.conversations[id],
              title,
            },
          },
        }));
      },

      deleteConversation: (id) => {
        set((state) => {
          const { [id]: deleted, ...remainingConversations } = state.conversations;
          return {
            conversations: remainingConversations,
            activeConversationId: state.activeConversationId === id ? null : state.activeConversationId,
          };
        });
      },

      exportConversation: (id) => {
        const state = get();
        const conversation = state.conversations[id];
        if (!conversation) return;

        const exportData = {
          title: conversation.title,
          providerId: conversation.providerId,
          modelId: conversation.modelId,
          messages: conversation.messages.map(msg => ({
            role: msg.role,
            content: msg.content,
            images: msg.images,
            createdAt: msg.createdAt,
          })),
          createdAt: conversation.createdAt,
        };

        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${conversation.title}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      },
    }),
    {
      name: 'orbital-chat-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        conversations: Object.fromEntries(
          Object.entries(state.conversations).map(([id, conv]) => [
            id,
            {
              ...conv,
              createdAt: conv.createdAt instanceof Date ? conv.createdAt.toISOString() : conv.createdAt,
              messages: conv.messages.map(msg => ({
                ...msg,
                createdAt: msg.createdAt instanceof Date ? msg.createdAt.toISOString() : msg.createdAt,
              })),
            },
          ])
        ),
        messageReasoningVisibility: state.messageReasoningVisibility,
        selectedProviderId: state.selectedProviderId,
        selectedModelId: state.selectedModelId,
      }),
      onRehydrateStorage: () => (state) => {
        if (state?.conversations) {
          Object.values(state.conversations).forEach(conv => {
            if (typeof conv.createdAt === 'string') {
              conv.createdAt = new Date(conv.createdAt);
            }
            conv.messages.forEach(msg => {
              if (typeof msg.createdAt === 'string') {
                msg.createdAt = new Date(msg.createdAt);
              }
            });
          });
        }
      },
    }
  )
);

export default useChatStore;
  
