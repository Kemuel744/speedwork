import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { full_name, email, phone, plan, amount, payment_method, deposit_number } = await req.json();

    if (!full_name || !email || !phone || !plan) {
      return new Response(
        JSON.stringify({ error: "Informations manquantes." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Get all admin user IDs
    const { data: adminRoles, error: rolesError } = await supabaseAdmin
      .from("user_roles")
      .select("user_id")
      .eq("role", "admin");

    if (rolesError) {
      console.error("Error fetching admins:", rolesError);
      throw rolesError;
    }

    const planLabel = plan === "annual" ? "Annuel (36 000 FCFA)" : "Mensuel (5 000 FCFA)";

    // Create notification for each admin
    const notifications = (adminRoles || []).map((admin) => ({
      user_id: admin.user_id,
      title: "Nouvelle demande d'abonnement",
      message: `${full_name} a effectué un dépôt ${payment_method} et demande l'activation d'un abonnement ${planLabel}.`,
      type: "subscription_request",
      metadata: {
        full_name,
        email,
        phone,
        plan,
        amount,
        payment_method,
        deposit_number,
        requested_at: new Date().toISOString(),
      },
    }));

    if (notifications.length > 0) {
      const { error: insertError } = await supabaseAdmin
        .from("notifications")
        .insert(notifications);

      if (insertError) {
        console.error("Error inserting notifications:", insertError);
        throw insertError;
      }
    }

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("notify-subscription-request error:", err);
    return new Response(
      JSON.stringify({ error: "Erreur serveur. Réessayez plus tard." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
