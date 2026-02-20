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

    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) throw new Error("GEMINI_API_KEY is not configured");

    const prompt = `
    Role: Professional Fitness Trainer specializing in Functional Fitness, CrossFit, and Hyrox.
    Task: Generate a structured ${workoutType === "circuit" ? "Hyrox Style" : "CrossFit Style (AMRAP/EMOM)"} program in Korean.
    
    User Profile:
    - Workout Type: ${workoutType === "circuit" ? "Hyrox Style" : "CrossFit"}
    - Difficulty: ${difficulty}
    - Duration: ${duration} minutes
    - Focus Areas: ${focusAreas?.join(", ") || "Full Body"}

    Requirements:
    - Language: Korean (Access to English terms where common in Korea like 버피, 로잉, 박스점프, 더블언더, 쓰러스터 등)
    - Select 4-8 functional exercises appropriate for the type and focus. Include exercises typical of Hyrox (Rowing, SkiErg, Sled Push/Pull, Burpee Broad Jumps, Wall Balls, Lunges) or CrossFit.
    - Specify sets, reps, and approximate weight (or bodyweight).
    - Provide an engaging program name and short description explaining the intent of the workout.

    Output Format: JSON only.
    Schema:
    {
      "name": "string",
      "description": "string",
      "exercises": [
        {
          "exerciseName": "string",
          "muscleGroup": "string (가슴, 등, 어깨, 하체, 팔, 복근, 전신)",
          "targetSets": number,
          "targetReps": number,
          "targetWeight": number (0 for bodyweight),
          "workoutStyle": "string ('classic', 'amrap', 'emom')",
          "timeLimit": number (optional, for amrap/emom)
        }
      ]
    }
    `;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
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

    // Clean up markdown code blocks if present
    generatedText = generatedText.replace(/```json\n?|\n?```/g, "").trim();

    const program = JSON.parse(generatedText);

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
