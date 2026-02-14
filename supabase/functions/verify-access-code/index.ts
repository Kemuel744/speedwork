import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function hashIP(ip: string): string {
  // Simple hash for rate limiting (not cryptographic, just for grouping)
  let hash = 0;
  for (let i = 0; i < ip.length; i++) {
    const char = ip.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return hash.toString(36);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { code } = await req.json();

    // Input validation
    if (!code || typeof code !== "string" || !/^\d{6}$/.test(code)) {
      return new Response(
        JSON.stringify({ error: "Code invalide. Entrez un code à 6 chiffres." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Rate limiting: max 5 attempts per IP per hour
    const clientIP = req.headers.get("x-forwarded-for") || req.headers.get("cf-connecting-ip") || "unknown";
    const ipHash = hashIP(clientIP);

    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { count } = await supabaseAdmin
      .from("access_code_attempts")
      .select("*", { count: "exact", head: true })
      .eq("ip_hash", ipHash)
      .gte("attempted_at", oneHourAgo);

    if ((count ?? 0) >= 5) {
      return new Response(
        JSON.stringify({ error: "Trop de tentatives. Réessayez dans une heure." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Log attempt
    await supabaseAdmin
      .from("access_code_attempts")
      .insert({ ip_hash: ipHash });

    // Verify code against subscriptions table
    const { data: subscription, error: subError } = await supabaseAdmin
      .from("subscriptions")
      .select("id, user_id, status, plan, end_date")
      .eq("access_code", code)
      .eq("status", "active")
      .gte("end_date", new Date().toISOString())
      .single();

    if (subError || !subscription) {
      return new Response(
        JSON.stringify({ error: "Code invalide ou expiré." }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Code is valid — return minimal info (no sensitive data)
    return new Response(
      JSON.stringify({
        valid: true,
        plan: subscription.plan,
        user_id: subscription.user_id,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("verify-access-code error:", err);
    return new Response(
      JSON.stringify({ error: "Erreur serveur. Réessayez plus tard." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
