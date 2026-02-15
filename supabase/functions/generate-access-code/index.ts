import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function generateCode(): string {
  const array = new Uint32Array(1);
  crypto.getRandomValues(array);
  return String(array[0] % 1000000).padStart(6, "0");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { plan, payment_method, amount, user_id } = await req.json();

    // Validate inputs
    if (!plan || !["monthly", "annual"].includes(plan)) {
      return new Response(
        JSON.stringify({ error: "Plan invalide." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const validMethods = ["mtn_mobile_money", "airtel_money", "orange_money", "bank_card"];
    if (!payment_method || !validMethods.includes(payment_method)) {
      return new Response(
        JSON.stringify({ error: "Moyen de paiement invalide." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!amount || typeof amount !== "number" || amount <= 0) {
      return new Response(
        JSON.stringify({ error: "Montant invalide." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!user_id || typeof user_id !== "string") {
      return new Response(
        JSON.stringify({ error: "Utilisateur non identifié." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Generate unique 6-digit access code
    let accessCode = generateCode();
    let attempts = 0;
    while (attempts < 10) {
      const { data: existing } = await supabaseAdmin
        .from("subscriptions")
        .select("id")
        .eq("access_code", accessCode)
        .eq("status", "active")
        .maybeSingle();

      if (!existing) break;
      accessCode = generateCode();
      attempts++;
    }

    // Calculate dates
    const startDate = new Date();
    const endDate = new Date(startDate);
    if (plan === "annual") {
      endDate.setFullYear(endDate.getFullYear() + 1);
    } else {
      endDate.setMonth(endDate.getMonth() + 1);
    }

    // Create subscription record
    const { data: subscription, error: insertError } = await supabaseAdmin
      .from("subscriptions")
      .insert({
        user_id,
        plan,
        payment_method,
        amount,
        access_code: accessCode,
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        status: "active",
      })
      .select("id, access_code, plan, end_date")
      .single();

    if (insertError) {
      console.error("Insert error:", insertError);
      return new Response(
        JSON.stringify({ error: "Erreur lors de la création de l'abonnement." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        access_code: subscription.access_code,
        plan: subscription.plan,
        end_date: subscription.end_date,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("generate-access-code error:", err);
    return new Response(
      JSON.stringify({ error: "Erreur serveur. Réessayez plus tard." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
