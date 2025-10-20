
// API integration with Supabase Edge Functions for real OpenRouter calls
import { streamChatCompletion, parseStreamResponse } from './openrouter-api';
import { ChatMessage } from '@/types';

// 实际流式响应处理
export async function streamResponse(
  messages: ChatMessage[],
  model: string
): Promise<ReadableStream<Uint8Array>> {
  console.log("OpenRouter API called with:", messages.length, "messages, model:", model);
  
  try {
    return await streamChatCompletion(messages, model);
  } catch (error) {
    console.error("Error calling OpenRouter API:", error);
    
    // 返回错误流
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new ReadableStream({
      start(controller) {
        const encoder = new TextEncoder();
        controller.enqueue(encoder.encode(`[错误] ${errorMessage}`));
        controller.close();
      }
    });
  }
}

// 处理流式响应的辅助函数
export async function handleStreamResponse(
  stream: ReadableStream<Uint8Array>,
  onChunk: (chunk: { content?: string; reasoning?: string }) => void,
  onComplete?: () => void,
  onError?: (error: Error) => void
): Promise<void> {
  return parseStreamResponse(stream, onChunk, onComplete, onError);
}
  