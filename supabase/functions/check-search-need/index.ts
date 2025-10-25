import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const OPENROUTER_API_KEY = Deno.env.get("OPENROUTER_API_KEY");
const GEMINI_MODEL = "google/gemini-2.5-flash-lite-preview-09-2025";

interface CheckSearchRequest {
  userMessage: string;
  conversationHistory?: Array<{ role: string; content: string }>;
}

interface CheckSearchResponse {
  needsSearch: boolean;
  reason?: string;
  suggestedQuery?: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { userMessage, conversationHistory = [] }: CheckSearchRequest = await req.json();

    if (!userMessage) {
      return new Response(
        JSON.stringify({ error: "缺少用户消息" }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    // 构建系统提示
    const systemPrompt = `你是一个智能助手，负责判断用户的问题是否需要进行网络搜索。

需要搜索的情况包括：
1. 询问最新的新闻、事件、数据
2. 需要实时信息（天气、股票、时间表等）
3. 询问特定产品、公司、人物的最新情况
4. 需要查找资料、文献、网页内容
5. 询问最近发生的事情
6. 需要核实事实或数据

不需要搜索的情况包括：
1. 通用知识问答（历史、科学基础概念等）
2. 编程、数学问题求解
3. 创意写作、翻译、总结
4. 个人建议、观点讨论
5. 已知的历史事件或常识
6. 纯聊天、问候

请分析用户的问题，并以JSON格式返回：
{
  "needsSearch": true/false,
  "reason": "判断理由",
  "suggestedQuery": "如果需要搜索，给出建议的搜索关键词"
}`;

    // 构建对话上下文
    const messages = [
      { role: "system", content: systemPrompt },
      ...conversationHistory.slice(-3), // 只保留最近3条历史
      { role: "user", content: `请判断这个问题是否需要网络搜索：\n\n${userMessage}` },
    ];

    // 调用 OpenRouter API
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://orbital-chat.app",
        "X-Title": "Orbital Chat",
      },
      body: JSON.stringify({
        model: GEMINI_MODEL,
        messages,
        temperature: 0.3,
        max_tokens: 300,
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("OpenRouter API 错误:", errorText);
      throw new Error(`OpenRouter API 失败: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.choices?.[0]?.message?.content;

    if (!aiResponse) {
      throw new Error("AI 未返回有效响应");
    }

    // 解析 AI 的 JSON 响应
    let result: CheckSearchResponse;
    try {
      result = JSON.parse(aiResponse);
    } catch (e) {
      console.error("解析 AI 响应失败:", aiResponse);
      // 如果解析失败，默认不搜索
      result = {
        needsSearch: false,
        reason: "无法解析AI响应",
      };
    }

    return new Response(
      JSON.stringify(result),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("检查搜索需求错误:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "未知错误",
        needsSearch: false,
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
