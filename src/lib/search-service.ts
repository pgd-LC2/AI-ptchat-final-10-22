const GEMINI_FLASH_MODEL = 'google/gemini-2.5-flash-lite-preview-09-2025';

export interface SearchOptions {
  query: string;
  limit?: number;
  scrapeContent?: boolean;
}

export interface SearchResult {
  success: boolean;
  searchQuery?: string;
  results?: any[];
  error?: string;
}

export async function summarizeQuery(userQuery: string): Promise<string> {
  try {
    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/openrouter-chat`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          messages: [
            {
              role: 'system',
              content: '你是一个搜索查询优化助手。请将用户的问题总结成简洁的搜索关键词，只返回关键词本身，不要额外的解释。',
            },
            {
              role: 'user',
              content: `请将以下问题总结成适合网络搜索的关键词：\n\n${userQuery}`,
            },
          ],
          model: GEMINI_FLASH_MODEL,
          temperature: 0.3,
          max_tokens: 100,
          stream: false,
        }),
      }
    );

    if (!response.ok) {
      throw new Error('查询总结失败');
    }

    const data = await response.json();
    const summary = data.choices?.[0]?.message?.content || userQuery;

    return summary.trim();
  } catch (error) {
    console.error('查询总结错误:', error);
    return userQuery;
  }
}

export async function performWebSearch(options: SearchOptions): Promise<SearchResult> {
  try {
    const searchQuery = await summarizeQuery(options.query);

    const searchPayload: any = {
      query: searchQuery,
      limit: options.limit || 5,
    };

    if (options.scrapeContent) {
      searchPayload.scrapeOptions = {
        formats: ['markdown'],
      };
    }

    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/firecrawl-search`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(searchPayload),
      }
    );

    if (!response.ok) {
      throw new Error(`搜索请求失败: ${response.status}`);
    }

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error || '搜索失败');
    }

    return {
      success: true,
      searchQuery,
      results: result.data?.web || [],
    };
  } catch (error) {
    console.error('网络搜索错误:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '未知错误',
    };
  }
}

export function formatSearchResults(results: any[]): string {
  if (!results || results.length === 0) {
    return '未找到相关结果。';
  }

  let formatted = '# 搜索结果\n\n';

  results.forEach((result, index) => {
    formatted += `## ${index + 1}. ${result.title || '无标题'}\n`;
    formatted += `**链接**: ${result.url}\n\n`;

    if (result.description) {
      formatted += `${result.description}\n\n`;
    }

    if (result.markdown) {
      formatted += `### 内容摘要\n${result.markdown.slice(0, 500)}...\n\n`;
    }

    formatted += '---\n\n';
  });

  return formatted;
}
