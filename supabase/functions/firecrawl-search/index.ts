interface SearchRequest {
  query: string;
  limit?: number;
  location?: string;
  sources?: ('web' | 'news' | 'images')[];
  categories?: ('github' | 'research' | 'pdf')[];
  tbs?: string;
  scrapeOptions?: {
    formats?: ('markdown' | 'html' | 'links' | 'screenshot')[];
  };
}

interface SearchResult {
  success: boolean;
  data?: any;
  error?: string;
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const FIRECRAWL_API_KEY = "fc-31e1fedcc10d4a2797c416b1d823b407";
const FIRECRAWL_API_URL = "https://api.firecrawl.dev/v2/search";

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    if (req.method !== "POST") {
      return new Response(
        JSON.stringify({ error: "仅支持 POST 请求" }),
        {
          status: 405,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const requestBody: SearchRequest = await req.json();

    if (!requestBody.query) {
      return new Response(
        JSON.stringify({ error: "缺少必需参数：query" }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const searchPayload: any = {
      query: requestBody.query,
      limit: requestBody.limit || 5,
    };

    if (requestBody.location) {
      searchPayload.location = requestBody.location;
    }

    if (requestBody.sources && requestBody.sources.length > 0) {
      searchPayload.sources = requestBody.sources;
    }

    if (requestBody.categories && requestBody.categories.length > 0) {
      searchPayload.categories = requestBody.categories;
    }

    if (requestBody.tbs) {
      searchPayload.tbs = requestBody.tbs;
    }

    if (requestBody.scrapeOptions) {
      searchPayload.scrapeOptions = requestBody.scrapeOptions;
    }

    const firecrawlResponse = await fetch(FIRECRAWL_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${FIRECRAWL_API_KEY}`,
      },
      body: JSON.stringify(searchPayload),
    });

    if (!firecrawlResponse.ok) {
      const errorText = await firecrawlResponse.text();
      console.error("Firecrawl API 错误:", errorText);

      return new Response(
        JSON.stringify({
          success: false,
          error: `Firecrawl API 错误: ${firecrawlResponse.status}`,
          details: errorText
        }),
        {
          status: firecrawlResponse.status,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const searchResults = await firecrawlResponse.json();

    return new Response(
      JSON.stringify({
        success: true,
        data: searchResults.data || searchResults,
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );

  } catch (error) {
    console.error("搜索失败:", error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "未知错误",
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});
