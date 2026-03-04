import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { RateLimiter } from "../_shared/rateLimit.ts";

const rateLimiter = new RateLimiter(10 * 60 * 1000, 5); // 5 requests per 10 minutes per IP


const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS")
    return new Response(null, { headers: corsHeaders });

  // Rate Limiting
  const clientIp = req.headers.get("x-forwarded-for") || "unknown";
  if (!rateLimiter.check(clientIp)) {
    return new Response(JSON.stringify({ error: "Too many requests. Please wait a few minutes before trying again. 😅" }), {
      status: 429,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }

  try {
    const { messages, workoutContext } = await req.json();

    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) throw new Error("GEMINI_API_KEY is not configured");

    const workoutCount = workoutContext?.length ?? 0;
    const systemPrompt = `너는 전문 운동 코치 아놀드AI야. 사용자의 실제 운동 기록 분석과 전반적인 피트니스 조언(웜업, 스트레칭, 영양, 운동 방법 등)을 제공해줘.

[사용자 운동 기록 (최근 ${workoutCount}회)]
${workoutCount > 0 ? JSON.stringify(workoutContext, null, 2) : "최근 기록 없음 (일반적인 피트니스 질문에 답변 가능)"}

답변 규칙:
- 기록이 있다면 실제 수치(무게, 횟수, 날짜 등)를 분석에 적극 활용해줘.
- 기록이 없거나 일반적인 질문(예: "웜업 어떻게 해?", "단백질 얼마나 먹어?")에도 전문적인 지식을 바탕으로 친절하게 답해줘.
- 불필요한 서두 없이 바로 핵심만 답해줘.
- 한국어로 답변.
- 운동, 건강, 피트니스와 전혀 무관한 질문(예: 정치, 날씨, 일반 상식 등)에만 "운동 관련 질문만 답변할 수 있어요 💪"라고 해줘.`;

    // messages: [{role: 'user'|'assistant', content: string}]
    const contents = messages.map((m: { role: string; content: string }) => ({
      role: m.role === "user" ? "user" : "model",
      parts: [{ text: m.content }],
    }));

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: systemPrompt }] },
          contents,
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Gemini API error: ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json();
    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!reply) throw new Error("No reply from Gemini");

    return new Response(JSON.stringify({ reply }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ai-chat error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
