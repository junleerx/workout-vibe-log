import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { RateLimiter } from "../_shared/rateLimit.ts";
import { verifyAuth } from "../_shared/auth.ts";

const rateLimiter = new RateLimiter(10 * 60 * 1000, 2); // 2 requests per 10 minutes per IP


const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // JWT Verification
  const { userId, errorData } = await verifyAuth(req);
  if (!userId) {
    return new Response(JSON.stringify({ error: `Unauthorized: ${errorData}` }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }

  // Rate Limiting
  const clientIp = req.headers.get("x-forwarded-for") || "unknown";
  const clientIdentifier = `${clientIp}-${userId}`;
  if (!rateLimiter.check(clientIdentifier)) {
    return new Response(JSON.stringify({ error: "Too many requests. Please wait a few minutes before trying again. 😅" }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }

  try {
    const { weeks, daysPerWeek, goal, level, unit, oneRMs } = await req.json();
    const targetUnit = unit || "kg";

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
    - ONE REP MAX (1RM) VALUES (if applicable): ${oneRMs ? JSON.stringify(oneRMs) : "Not provided"}
    - ONLY USE WEIGHT UNIT: ${targetUnit} 
    (CRITICAL: Every weight MUST be estimated in ${targetUnit}. Do NOT mention the other unit in descriptions or values. Program description and overviews must explicitly mention the weight format in ${targetUnit}.)

    Output Format: JSON only.
    Schema:
    {
      "planName": "string",
      "planDescription": "string (Why this plan works, overview of the ${weeks} weeks. Emphasize weight targets are in ${targetUnit})",
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
              "targetWeight": number (0 for bodyweight, otherwise an estimated starting weight based on level),
              "targetDistance": number (optional, for distance based exercises in meters),
              "targetTime": number (optional, for time based exercises in seconds)
            }
          ]
        }
      ]
    }

    Guidelines:
    - Create exactly ${daysPerWeek} workout routines (Day 1 to ${daysPerWeek}) representing a typical week in this plan.
    - Accurately distribute daysOfWeek for each workout to build a balanced weekly schedule.
    - Choose effective, proven exercises matching the goal (${goal}).
    - For targetWeight, provide a realistic recommended starting weight in NUMERIC VALUE of ${targetUnit} assuming an average male/female at this level. If it's pure bodyweight, use 0.
    - All descriptions must be in Korean. Exercise names can be in English/Korean.
    ${(goal || "").includes("5/3/1 BBB") ? `
    - CRITICAL: Follow the '5/3/1 Boring But Big (BBB)' protocol strictly. 
    - MAIN LIFTS: Use these 1RM values to calculate the Training Max (TM = 90% of 1RM). 
      - Squat: ${oneRMs?.squat || 100}${targetUnit} (1RM) -> TM: ${Math.round((Number(oneRMs?.squat) || 100) * 0.9)}${targetUnit}
      - Bench: ${oneRMs?.bench || 80}${targetUnit} (1RM) -> TM: ${Math.round((Number(oneRMs?.bench) || 80) * 0.9)}${targetUnit}
      - Deadlift: ${oneRMs?.deadlift || 120}${targetUnit} (1RM) -> TM: ${Math.round((Number(oneRMs?.deadlift) || 120) * 0.9)}${targetUnit}
      - OHP: ${oneRMs?.ohp || 50}${targetUnit} (1RM) -> TM: ${Math.round((Number(oneRMs?.ohp) || 50) * 0.9)}${targetUnit}
    - SETS (Week 1): 65%TM x 5, 75%TM x 5, 85%TM x 5+. (Use these calculated numbers in targetWeight).
    - BBB SUPPLEMENTAL: 5 sets of 10 reps (5x10) of the main lift (or opposite) at 50% to 60% of the calculated TM.
    - Include basic accessory work (Push, Pull, Core/Legs) for 3 sets of 10-15 reps.` : ""}
    `;

    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=" + GEMINI_API_KEY,
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

    const plan = JSON.parse(generatedText);

    return new Response(JSON.stringify(plan), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-macrocycle error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
