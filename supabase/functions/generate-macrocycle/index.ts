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
              "targetWeight": number,
              "sets": [
                { "setNumber": number, "targetReps": number, "targetWeight": number }
              ] (Optional: use for 5/3/1 main sets to show different weights/reps per set)
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
    ${(goal || "").includes("5/3/1") ? `
    - CRITICAL: Generate a pure '5/3/1 Strength' program for exactly 4 WEEKS.
    - NO ACCESSORIES, NO BBB. Only the 4 main lifts (Squat, Bench Press, Deadlift, OHP).
    - OUTPUT STRUCTURE: The 'workouts' array MUST contain EXACTLY 4 items, one for EACH week:
      1. "Week 1: 5-5-5+ (65%, 75%, 85% TM)"
      2. "Week 2: 3-3-3+ (70%, 80%, 90% TM)"
      3. "Week 3: 5/3/1+ (75%, 85%, 95% TM)"
      4. "Week 4: Deload (40%, 50%, 60% TM)"
    - FOR EACH WEEK: Every exercise MUST have exactly 3 sets defined in the 'sets' array with the correct calculated weights based on the TM:
      - Week 1: Set 1 (65%TMx5), Set 2 (75%TMx5), Set 3 (85%TMx5+)
      - Week 2: Set 1 (70%TMx3), Set 2 (80%TMx3), Set 3 (90%TMx3+)
      - Week 3: Set 1 (75%TMx5), Set 2 (85%TMx3), Set 3 (95%TMx1+)
      - Week 4: Set 1 (40%TMx5), Set 2 (50%TMx5), Set 3 (60%TMx5)
    - MAIN LIFTS (1RM -> TM):
      - Squat: ${oneRMs?.squat || 100}${targetUnit} -> TM: ${Math.round((Number(oneRMs?.squat) || 100) * 0.9)}${targetUnit}
      - Bench: ${oneRMs?.bench || 80}${targetUnit} -> TM: ${Math.round((Number(oneRMs?.bench) || 80) * 0.9)}${targetUnit}
      - Deadlift: ${oneRMs?.deadlift || 120}${targetUnit} -> TM: ${Math.round((Number(oneRMs?.deadlift) || 120) * 0.9)}${targetUnit}
      - OHP: ${oneRMs?.ohp || 50}${targetUnit} -> TM: ${Math.round((Number(oneRMs?.ohp) || 50) * 0.9)}${targetUnit}
    - ROUND weights to 0.5kg or 2.5lbs steps.
    - All descriptions must be in Korean.` : ""}
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
