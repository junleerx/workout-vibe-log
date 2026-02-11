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
    const { exercises, weeks, goal } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const exerciseList = exercises
      .map((e: any) => `- ${e.name} (${e.category}): 현재 1RM ${e.maxWeight}kg`)
      .join("\n");

    const systemPrompt = `You are a sports science expert specializing in progressive overload programming.

Based on scientific evidence:
- Beginners: increase weight 2.5-5kg per week for compound, 1-2.5kg for isolation
- Intermediate: increase weight 1-2.5kg per week for compound, 0.5-1kg for isolation
- When weight can't increase, use double progression (increase reps first, then weight)
- Deload every 4th week (reduce volume/intensity by 40-50%)
- Compound movements (벤치프레스, 스쿼트, 데드리프트, 오버헤드 프레스, 바벨로우) allow bigger jumps
- Isolation movements (컬, 레이즈, 익스텐션) need smaller increments
- Consider RPE (Rate of Perceived Exertion) for sustainability

Generate a ${weeks}-week progressive overload program in Korean.
Goal: ${goal === 'strength' ? '근력 향상 (저횟수 고중량)' : goal === 'hypertrophy' ? '근비대 (중횟수 중중량)' : '근지구력 (고횟수 저중량)'}`;

    const userPrompt = `현재 운동별 1RM (최대 무게):
${exerciseList}

위 데이터를 기반으로 ${weeks}주간의 점진적 과부하 프로그램을 만들어주세요.
각 주차별로 세트, 횟수, 무게를 구체적으로 제시해주세요.
${weeks >= 4 ? '4주차마다 디로드 주를 포함해주세요.' : ''}`;

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          tools: [
            {
              type: "function",
              function: {
                name: "create_overload_program",
                description: "Create a progressive overload program",
                parameters: {
                  type: "object",
                  properties: {
                    name: { type: "string", description: "Program name in Korean" },
                    description: { type: "string", description: "Scientific rationale in Korean" },
                    weeklyPlans: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          week: { type: "number" },
                          label: { type: "string", description: "Week label e.g. '1주차' or '디로드 주'" },
                          isDeload: { type: "boolean" },
                          exercises: {
                            type: "array",
                            items: {
                              type: "object",
                              properties: {
                                exerciseName: { type: "string" },
                                muscleGroup: { type: "string" },
                                sets: { type: "number" },
                                reps: { type: "number" },
                                weight: { type: "number" },
                                rpe: { type: "number", description: "RPE 1-10" },
                                note: { type: "string", description: "Short tip in Korean" },
                              },
                              required: ["exerciseName", "muscleGroup", "sets", "reps", "weight"],
                              additionalProperties: false,
                            },
                          },
                        },
                        required: ["week", "label", "isDeload", "exercises"],
                        additionalProperties: false,
                      },
                    },
                  },
                  required: ["name", "description", "weeklyPlans"],
                  additionalProperties: false,
                },
              },
            },
          ],
          tool_choice: {
            type: "function",
            function: { name: "create_overload_program" },
          },
        }),
      }
    );

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "요청이 너무 많습니다. 잠시 후 다시 시도해주세요." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI 크레딧이 부족합니다." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errText = await response.text();
      console.error("AI gateway error:", response.status, errText);
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall) {
      throw new Error("AI did not return structured data");
    }

    const program = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify(program), {
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
