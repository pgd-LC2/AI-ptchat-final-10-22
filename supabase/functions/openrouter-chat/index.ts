interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface ChatRequest {
  messages: ChatMessage[];
  model?: string;
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

Deno.serve(async (req: Request) => {
  // 处理 CORS 预检请求
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    // 验证请求方法
    if (req.method !== "POST") {
      return new Response(
        JSON.stringify({ error: "Method not allowed" }),
        {
          status: 405,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // 获取环境变量
    const openRouterApiKey = Deno.env.get("OPENROUTER_API_KEY");
    if (!openRouterApiKey) {
      console.error("OPENROUTER_API_KEY environment variable not set");
      return new Response(
        JSON.stringify({ error: "OpenRouter API key not configured" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // 解析请求体
    let requestData: ChatRequest;
    try {
      requestData = await req.json();
    } catch (error) {
      console.error("Invalid JSON in request body:", error);
      return new Response(
        JSON.stringify({ error: "Invalid JSON in request body" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // 验证必要字段
    if (!requestData.messages || !Array.isArray(requestData.messages)) {
      return new Response(
        JSON.stringify({ error: "Messages array is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // 构建 OpenRouter API 请求
    const openRouterRequest = {
      model: requestData.model || "openai/gpt-3.5-turbo",
      messages: requestData.messages,
      temperature: requestData.temperature || 0.7,
      max_tokens: requestData.max_tokens || 1000,
      stream: requestData.stream || false,
    };

    console.log("Calling OpenRouter API with model:", openRouterRequest.model);

    // 调用 OpenRouter API
    const openRouterResponse = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${openRouterApiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://orbital-chat.com", // 可选：用于 OpenRouter 统计
        "X-Title": "Orbital Chat", // 可选：用于 OpenRouter 统计
      },
      body: JSON.stringify(openRouterRequest),
    });

    // 检查 OpenRouter API 响应状态
    if (!openRouterResponse.ok) {
      let errorMessage = `OpenRouter API error: ${openRouterResponse.status}`;
      try {
        const errorData = await openRouterResponse.json();
        errorMessage = errorData.error?.message || errorData.message || errorMessage;
        console.error("OpenRouter API error:", errorData);
      } catch (parseError) {
        console.error("Failed to parse OpenRouter error response:", parseError);
      }

      return new Response(
        JSON.stringify({ error: errorMessage }),
        {
          status: openRouterResponse.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // 处理流式响应
    if (requestData.stream) {
      // 对于流式响应，直接转发 OpenRouter 的流
      return new Response(openRouterResponse.body, {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          "Connection": "keep-alive",
        },
      });
    }

    // 处理普通响应
    const responseData = await openRouterResponse.json();
    console.log("OpenRouter API response received successfully");

    return new Response(
      JSON.stringify(responseData),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );

  } catch (error) {
    console.error("Unexpected error in openrouter-chat function:", error);
    return new Response(
      JSON.stringify({ 
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error"
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});