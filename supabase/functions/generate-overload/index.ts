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
You are a strength coach. Analyze the workout log and prescribe the next session.

Rules (apply in order):

1. SAFETY: isPainful=true OR completed=false → maintain or reduce 5-10%

2. DELOAD: same weight+reps for 2+ sessions OR regression → set isDeload=true, reduce volume 20-30%

3. DOUBLE PROGRESSION: all sets hit reps ceiling → increase weight. else → maintain weight, reps +1~2

4. WEIGHT JUMP: barbell/machine ≤5% (2.5lb unit), dumbbell ≤4% (5lb unit), round DOWN

5. AUTOREGULATION: avgRIR≥3 → aggressive jump | avgRIR=0 → maintain

Workout log:

${JSON.stringify(exercises)}

Return ONLY a JSON array. No markdown.

[{

  "exerciseName": string,

  "action": "increase_weight"|"increase_reps"|"maintain"|"deload",

  "sets": [{"reps": number, "weight": number}],

  "tip": string (1-2 sentences: reason + cue)

}]
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
