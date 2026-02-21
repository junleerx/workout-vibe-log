import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { weeks, daysPerWeek, goal, level, focusAreas } = await req.json();

    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) throw new Error("GEMINI_API_KEY is not configured");

    const prompt = `
    Role: Master Fitness Coach & Programmer.
    Task: Design a comprehensive ${weeks}-week Macrocycle Workout Program in Korean.

    User Profile:
    - Duration: ${weeks} Weeks
    - Frequency: ${daysPerWeek} Days / Week
    - Primary Goal: ${goal}
    - Fitness Level: ${level}
    - Focus Areas: ${focusAreas?.join(", ") || "Full Body"}

    Output Format: JSON only.
    Schema:
    {
      "planName": "string",
      "planDescription": "string (Why this plan works, overview of the ${weeks} weeks)",
      "progressionGuide": "string (How to progress each week, e.g. add weight or reps)",
      "workouts": [
        {
          "name": "string (e.g., Day 1: 상체 파워)",
          "description": "string (Focus of this specific day)",
          "daysOfWeek": ["string (e.g., monday, thursday)"],
          "exercises": [
            {
              "exerciseName": "string",
              "muscleGroup": "string",
              "targetSets": number,
              "targetReps": number,
              "targetWeight": number (0 for bodyweight, otherwise an estimated starting weight based on level)
            }
          ]
        }
      ]
    }

    Guidelines:
    - Create exactly ${daysPerWeek} workout routines (Day 1 to ${daysPerWeek}) representing a typical week in this plan.
    - Accurately distribute daysOfWeek for each workout to build a balanced weekly schedule.
    - Choose effective, proven exercises matching the goal (${goal}).
    - For targetWeight, provide a realistic recommended starting weight in kg or lbs assuming an average male/female at this level. If it's pure bodyweight, use 0.
    - All descriptions must be in Korean. Exercise names can be in English/Korean.
    `;

    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" + GEMINI_API_KEY,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error("Gemini API error: " + (errorData.error?.message || response.statusText));
    }

    const data = await response.json();
    let generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!generatedText) throw new Error("No text generated from Gemini");

    generatedText = generatedText.replace(/```json\n?|\n?```/g, "").trim();

    return new Response(generatedText, {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-macrocycle error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
