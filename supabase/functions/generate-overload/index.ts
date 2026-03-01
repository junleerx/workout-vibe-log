import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers":
        "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
    if (req.method === "OPTIONS")
        return new Response(null, { headers: corsHeaders });

    try {
        const { exercises } = await req.json();

        const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
        if (!GEMINI_API_KEY) throw new Error("GEMINI_API_KEY is not configured");

        const prompt = `
    [Role]
    너는 운동 로그를 분석하여 '점진적 과부하' 원칙에 따라 다음 운동 처방을 내리는 전문 AI 코치다.
    
    [Data Context]
    제공되는 데이터는 이전 운동의 세트별 기록이다.
    ${JSON.stringify(exercises, null, 2)}
    
    [Decision Hierarchy]
    1. Safety (안전): 통증/자세 붕괴(isPainful: true)가 있거나 실패한 세트(completed: false)가 있다면 즉시 감량 혹은 무게를 유지한다.
    2. Double Progression: 무게를 올리기 전, 이전 횟수들이 10~12회 상한을 모두 채웠는지(completed: true) 우선 확인한다. 못 채웠다면 무게를 유지하고 목표 횟수만 1~2회 상향 조정한다.
    3. Weight Jump (증량): 10~12회 상한에 도달 시 증량하되, 운동별 특성 반영하여 기구에 맞는 증량 한도와 회복 주기를 고려한 세밀한 추천을 내린다. (예: 바벨/머신은 5%, 덤벨은 4% 이내로 기구별 최소 단위로 내림 적용)
    4. Autoregulation: 사용자가 입력한 RIR(여유 횟수)을 바탕으로 강도를 조절한다. RIR이 3 이상으로 높으면 공격적 증량, 0이면 수성(유지) 전략을 취한다.
    5. Deload: 2회 이상 정체 혹은 퇴보 기미가 보이면 과감히 볼륨이나 무게를 10~30% 줄이는 디로드 세션을 제안한다.
    
    [Requirement]
    - 모든 무게 출력은 반드시 "파운드(lbs)" 기준으로 내림하여 계산할 것. (덤벨은 5lbs 단위, 바벨은 원판 합산 2.5/5lbs 단위 등 상식적인 수치)
    - 결과는 반드시 아래 JSON 배열 형식으로만 반환하라.
    
    [Output Format]
    [
      {
        "exerciseName": "string",
        "description": "string (추천 사유 및 코칭 팁 짧게)",
        "sets": [
          {
            "reps": number,
            "weight": number (파운드 단위)
          }
        ]
      }
    ]
    `;

        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }],
                }),
            }
        );

        if (!response.ok) {
            const errorData = await response.json();
            console.error("Gemini API error:", errorData);
            throw new Error(`Gemini API error: ${errorData.error?.message || response.statusText}`);
        }

        const data = await response.json();
        let generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!generatedText) {
            throw new Error("No text generated from Gemini");
        }

        generatedText = generatedText.replace(/```json\n?|\n?```/g, "").trim();

        const recommendation = JSON.parse(generatedText);

        return new Response(JSON.stringify(recommendation), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    } catch (e) {
        console.error("generate-overload error:", e);
        return new Response(
            JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
});
