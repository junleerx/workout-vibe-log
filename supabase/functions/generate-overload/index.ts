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

    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) throw new Error("GEMINI_API_KEY is not configured");

    const exerciseList = exercises
      .map((e: any) => `- ${e.name} (${e.category}): 1RM ${e.maxWeight}kg`)
      .join("\n");

    const prompt = `
    Role: Sports Science Expert in Progressive Overload
    Task: Create a ${weeks}-week progressive overload program in Korean.
    
    Goal: ${goal === 'strength' ? 'Strength (Low reps, High weight)' : goal === 'hypertrophy' ? 'Hypertrophy (Moderate reps/weight)' : 'Endurance (High reps, Low weight)'}
    
    User's Current Stats:
    ${exerciseList}

    Scientific Principles:
    - Beginners: +2.5-5kg/week (compound), +1-2.5kg/week (isolation)
    - Intermediate: +1-2.5kg/week (compound), +0.5-1kg/week (isolation)
    - Deload every 4th week (if weeks >= 4)
    - Use RPE (Rate of Perceived Exertion)

    Output Format: JSON only.
    Schema:
    {
      "name": "string",
      "description": "string",
      "weeklyPlans": [
        {
          "week": number,
          "label": "string (e.g. 1주차, 디로드)",
          "isDeload": boolean,
          "exercises": [
            {
              "exerciseName": "string",
              "muscleGroup": "string",
              "sets": number,
              "reps": number,
              "weight": number,
              "rpe": number,
              "note": "string (optional tip)"
            }
          ]
        }
      ]
    }
    `;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            response_mime_type: "application/json",
          },
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Gemini API error:", errorData);
      throw new Error(`Gemini API error: ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json();
    const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!generatedText) {
      throw new Error("No text generated from Gemini");
    }

    const program = JSON.parse(generatedText);

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
