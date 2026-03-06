import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

export async function verifyAuth(req: Request): Promise<{ userId: string | null, errorData?: any }> {
    const authHeader = req.headers.get("authorization");
    if (!authHeader) return { userId: null, errorData: "No auth header" };

    const SUPABASE_URL = Deno.env.get("PROJECT_URL") ?? "";
    const SUPABASE_ANON_KEY = Deno.env.get("PROJECT_ANON_KEY") ?? "";

    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
        console.error("Missing Supabase environment variables");
        return { userId: null, errorData: "Missing env vars" };
    }

    const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error } = await supabaseClient.auth.getUser();
    if (error) {
        console.error("JWT Verification error:", error.message);
        return { userId: null, errorData: error.message };
    }

    return { userId: user?.id || null };
}
