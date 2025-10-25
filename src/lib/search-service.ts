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

export interface SearchPlan {
  searches: Array<{
    query: string;
    limit?: number;
    sources?: string[];
    categories?: string[];
    tbs?: string;
    location?: string;
    scrapeContent?: boolean;
  }>;
}

export async function generateSearchPlan(
  userQuery: string,
  _conversationHistory: Array<{ role: string; content: string }> = []
): Promise<SearchPlan> {
  try {
    const FIRECRAWL_DOC = `# Firecrawl Search API 文档

## 基本参数
- query: 搜索查询词
- limit: 结果数量（默认5）
- scrapeOptions: { formats: ["markdown"] } - 抓取完整内容

## 高级参数
- sources: ["web", "news", "images"] - 结果类型
- categories: ["github", "research", "pdf"] - 搜索分类
- tbs: 时间过滤
  - "qdr:h" 过去1小时
  - "qdr:d" 过去24小时
  - "qdr:w" 过去1周
  - "qdr:m" 过去1个月
- location: "China", "Germany" 等 - 地理位置

## 示例
1. 实时新闻: { query: "主题", sources: ["news"], tbs: "qdr:d" }
2. 研究论文: { query: "主题", categories: ["research"] }
3. GitHub代码: { query: "主题", categories: ["github"] }
4. 本地搜索: { query: "主题", location: "China" }`;

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
              content: `你是 Firecrawl 搜索专家。根据用户问题和 API 文档，完全自主设计最优搜索策略。

${FIRECRAWL_DOC}

返回 JSON 格式：
{
  "searches": [
    {
      "query": "搜索词",
      "limit": 数字,
      "sources": ["web"],
      "categories": ["github"],
      "tbs": "qdr:d",
      "location": "China",
      "scrapeContent": true
    }
  ]
}

策略指南：
1. **搜索数量**：根据问题复杂度决定（1-5个都可以）
   - 简单问题：1个搜索即可
   - 复杂问题：多个角度搜索
   - 对比类问题：每个对象一个搜索

2. **结果数量limit**：根据需要灵活调整
   - 快速回答：5-10条
   - 深度分析：15-30条
   - 全面调研：30-50条

3. **参数选择**：智能使用所有可用参数
   - 实时信息：tbs时间过滤
   - 技术问题：categories选择github/research
   - 新闻：sources选择news
   - 图片：sources选择images
   - 地理相关：location指定地区

4. **内容抓取**：根据问题决定
   - 需要详细内容：scrapeContent=true
   - 只需概览：scrapeContent=false

你可以完全自由决定所有参数，目标是获取最准确、最全面的信息。只返回JSON，不要其他文字。`,
            },
            {
              role: 'user',
              content: userQuery,
            },
          ],
          model: GEMINI_FLASH_MODEL,
          temperature: 0.5,
          max_tokens: 2500,
          stream: false,
        }),
      }
    );

    if (!response.ok) {
      throw new Error('生成搜索计划失败');
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';

    try {
      let cleanContent = content.trim();
      if (cleanContent.startsWith('```json')) {
        cleanContent = cleanContent.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (cleanContent.startsWith('```')) {
        cleanContent = cleanContent.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }

      const parsed = JSON.parse(cleanContent);
      if (parsed.searches && Array.isArray(parsed.searches) && parsed.searches.length > 0) {
        return parsed;
      }
    } catch (e) {
      console.error('解析搜索计划JSON失败:', e);
      console.error('原始内容:', content);
    }

    return {
      searches: [{ query: userQuery, limit: 12, scrapeContent: true }]
    };
  } catch (error) {
    console.error('生成搜索计划错误:', error);
    return {
      searches: [{ query: userQuery, limit: 12, scrapeContent: true }]
    };
  }
}

export async function performSingleSearch(
  searchConfig: {
    query: string;
    limit?: number;
    sources?: string[];
    categories?: string[];
    tbs?: string;
    location?: string;
    scrapeContent?: boolean;
  }
): Promise<any[]> {
  try {
    const { query, limit = 3, sources, categories, tbs, location, scrapeContent = true } = searchConfig;

    const searchPayload: any = {
      query,
      limit,
    };

    if (sources) searchPayload.sources = sources;
    if (categories) searchPayload.categories = categories;
    if (tbs) searchPayload.tbs = tbs;
    if (location) searchPayload.location = location;

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

export async function performSearchPlan(searchPlan: SearchPlan): Promise<any[]> {
  try {
    console.log('🔍 执行搜索计划:', searchPlan);

    const searchPromises = searchPlan.searches.map(searchConfig =>
      performSingleSearch(searchConfig)
    );

    const results = await Promise.all(searchPromises);

    const allResults = results.flat();

    const uniqueResults = allResults.reduce((acc, result) => {
      if (!acc.some((r: any) => r.url === result.url)) {
        acc.push(result);
      }
      return acc;
    }, [] as any[]);

    console.log('🔍 搜索计划完成，共', uniqueResults.length, '条结果');
    return uniqueResults;
  } catch (error) {
    console.error('搜索计划执行错误:', error);
    return [];
  }
}

export async function performWebSearch(options: SearchOptions): Promise<SearchResult> {
  try {
    const results = await performSingleSearch({
      query: options.query,
      limit: options.limit || 5,
      scrapeContent: options.scrapeContent || false
    });

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
    const citationNumber = index + 1;
    formatted += `## [${citationNumber}] ${result.title || '无标题'}\n`;
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
