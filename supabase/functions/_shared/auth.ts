import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

export async function verifyAuth(req: Request): Promise<string | null> {
    const authHeader = req.headers.get("authorization");
    if (!authHeader) return null;

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") ?? "";

    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
        console.error("Missing Supabase environment variables");
        return null;
    }

    const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error } = await supabaseClient.auth.getUser();
    if (error) {
        console.error("JWT Verification error:", error.message);
        return null;
    }

    return user?.id || null;
}
