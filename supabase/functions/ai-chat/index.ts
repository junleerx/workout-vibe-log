import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // CORS 처리
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { message, history, userProfile } = await req.json();

    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY is missing");
    }

    // 시스템 프롬프트 (페르소나 설정)
    const systemPrompt = `당신은 최고 수준의 헬스 트레이너 '아놀드AI'입니다.
유저의 신체 정보, 목표, 최근 운동 기록 등을 바탕으로 개인 맞춤형 조언을 제공합니다.
말투는 항상 친절하고 동기를 부여하는 전문 트레이너의 말투를 사용하세요.
때로는 이모지를 섞어서 대화를 부드럽게 이끌어 주세요.
전문적인 운동 용어를 쉽게 풀어 설명해 주는 것을 좋아합니다.

다음은 유저의 현재 상태 및 정보입니다 (이 정보를 바탕으로 대화하세요):
${JSON.stringify(userProfile, null, 2)}
`;

    // 사용자 메시지 형태 변환 (Gemini API 포맷에 맞춤)
    // history는 [{ role: 'user' | 'assistant', content: string }] 형태라고 가정
    const contents = [];

    if (history && Array.isArray(history)) {
      history.forEach((msg) => {
        contents.push({
          role: msg.role === "assistant" ? "model" : "user",
          parts: [{ text: msg.content }],
        });
      });
    }

    // 이번에 새로 입력한 메시지 추가
    contents.push({
      role: "user",
      parts: [{ text: message }],
    });

    // Gemini API 호출
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          systemInstruction: {
            parts: [{ text: systemPrompt }]
          },
          contents: contents,
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Gemini API Error:", errorData);
      throw new Error(`Gemini API Error: ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();
    const replyText = data.candidates?.[0]?.content?.parts?.[0]?.text || "죄송합니다만, 답변을 생성하지 못했습니다.";

    return new Response(JSON.stringify({ reply: replyText }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("ai-chat edge function error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "알 수 없는 에러가 발생했습니다." }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
