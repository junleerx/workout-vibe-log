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
    const { workoutType, difficulty, duration, focusAreas } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = `You are a professional fitness trainer specializing in ${workoutType === "circuit" ? "서킷 트레이닝" : "HIIT"} programs.
Generate a structured workout program in Korean.

Available exercises (use ONLY from this list):
가슴: 벤치프레스, 인클라인 벤치프레스, 덤벨 플라이, 케이블 크로스오버, 푸쉬업, 딥스
등: 풀업, 랫풀다운, 바벨로우, 시티드 로우, 덤벨 로우, 데드리프트
어깨: 오버헤드 프레스, 덤벨 숄더프레스, 사이드 레터럴 레이즈, 프론트 레이즈, 페이스풀, 리어 델트 플라이
하체: 스쿼트, 레그프레스, 런지, 레그 익스텐션, 레그 컬, 카프 레이즈, 힙 쓰러스트
팔: 바벨 컬, 덤벨 컬, 해머 컬, 트라이셉스 푸쉬다운, 오버헤드 트라이셉스, 스컬크러셔
복근: 크런치, 레그레이즈, 플랭크, 러시안 트위스트, 행잉 레그레이즈
전신: 버피, 클린 앤 저크, 케틀벨 스윙

Rules:
- Select 4-8 exercises appropriate for the workout type and focus areas
- For circuit training: moderate weight, higher reps (12-20), shorter rest
- For HIIT: bodyweight or light weight, max effort reps (8-15), timed intervals
- Adjust sets/reps/weight based on difficulty (beginner/intermediate/advanced)
- Duration guide: ${duration} minutes total`;

    const userPrompt = `Create a ${workoutType === "circuit" ? "서킷 트레이닝" : "HIIT"} program.
Difficulty: ${difficulty}
Duration: ${duration} minutes
Focus areas: ${focusAreas?.join(", ") || "전신"}

Return the program name and exercises.`;

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
                name: "create_workout_program",
                description: "Create a structured workout program",
                parameters: {
                  type: "object",
                  properties: {
                    name: { type: "string", description: "Program name in Korean" },
                    description: {
                      type: "string",
                      description: "Short description in Korean",
                    },
                    exercises: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          exerciseName: { type: "string" },
                          muscleGroup: {
                            type: "string",
                            enum: ["가슴", "등", "어깨", "하체", "팔", "복근", "전신"],
                          },
                          targetSets: { type: "number" },
                          targetReps: { type: "number" },
                          targetWeight: { type: "number" },
                        },
                        required: [
                          "exerciseName",
                          "muscleGroup",
                          "targetSets",
                          "targetReps",
                          "targetWeight",
                        ],
                        additionalProperties: false,
                      },
                    },
                  },
                  required: ["name", "description", "exercises"],
                  additionalProperties: false,
                },
              },
            },
          ],
          tool_choice: {
            type: "function",
            function: { name: "create_workout_program" },
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
    console.error("generate-workout error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
