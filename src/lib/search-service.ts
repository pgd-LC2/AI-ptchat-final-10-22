const GEMINI_FLASH_MODEL = 'google/gemini-2.5-flash';

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

export interface CheckSearchNeedResult {
  needsSearch: boolean;
  reason?: string;
  suggestedQuery?: string;
}

export async function checkSearchNeed(
  userMessage: string,
  conversationHistory: Array<{ role: string; content: string }> = []
): Promise<CheckSearchNeedResult> {
  try {
    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/check-search-need`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          userMessage,
          conversationHistory,
        }),
      }
    );

    if (!response.ok) {
      console.error('检查搜索需求失败:', response.status);
      return { needsSearch: false };
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('检查搜索需求错误:', error);
    return { needsSearch: false };
  }
}

export async function generateSearchQueries(
  userQuery: string,
  conversationHistory: Array<{ role: string; content: string }> = []
): Promise<string[]> {
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
              content: `你是一个搜索查询生成助手。基于用户的问题，生成2-3个精准的搜索查询。

要求：
1. 简短精准，直击核心关键词
2. 返回JSON格式：{"queries": ["查询1", "查询2"]}
3. 只生成2-3个查询`,
            },
            ...conversationHistory.slice(-2),
            {
              role: 'user',
              content: userQuery,
            },
          ],
          model: GEMINI_FLASH_MODEL,
          temperature: 0.3,
          max_tokens: 150,
          stream: false,
        }),
      }
    );

    if (!response.ok) {
      throw new Error('生成搜索查询失败');
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';

    try {
      // 清理 Markdown 代码块标记
      let cleanContent = content.trim();
      if (cleanContent.startsWith('```json')) {
        cleanContent = cleanContent.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (cleanContent.startsWith('```')) {
        cleanContent = cleanContent.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }

      const parsed = JSON.parse(cleanContent);
      if (parsed.queries && Array.isArray(parsed.queries) && parsed.queries.length > 0) {
        return parsed.queries.slice(0, 5);
      }
    } catch (e) {
      console.error('解析搜索查询JSON失败:', e);
      console.error('原始内容:', content);
    }

    return [userQuery];
  } catch (error) {
    console.error('生成搜索查询错误:', error);
    return [userQuery];
  }
}

export async function performSingleSearch(
  query: string,
  limit: number = 3,
  scrapeContent: boolean = true
): Promise<any[]> {
  try {
    const searchPayload: any = {
      query,
      limit,
    };

    if (scrapeContent) {
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
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
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

    return result.data?.web || [];
  } catch (error) {
    console.error('单次搜索错误:', error);
    return [];
  }
}

export async function performMultipleSearches(
  queries: string[],
  limitPerQuery: number = 3,
  scrapeContent: boolean = true
): Promise<any[]> {
  try {
    console.log('🔍 并行搜索查询:', queries);

    const searchPromises = queries.map(query =>
      performSingleSearch(query, limitPerQuery, scrapeContent)
    );

    const results = await Promise.all(searchPromises);

    const allResults = results.flat();

    const uniqueResults = allResults.reduce((acc, result) => {
      if (!acc.some((r: any) => r.url === result.url)) {
        acc.push(result);
      }
      return acc;
    }, [] as any[]);

    console.log('🔍 并行搜索完成，共', uniqueResults.length, '条结果');
    return uniqueResults;
  } catch (error) {
    console.error('多重搜索错误:', error);
    return [];
  }
}

export async function performWebSearch(options: SearchOptions): Promise<SearchResult> {
  try {
    const results = await performSingleSearch(
      options.query,
      options.limit || 5,
      options.scrapeContent || false
    );

    return {
      success: true,
      searchQuery: options.query,
      results,
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
