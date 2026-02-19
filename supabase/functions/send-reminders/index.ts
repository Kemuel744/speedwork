import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Verify admin authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Non autorisé" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await userClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(
        JSON.stringify({ error: "Non autorisé" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = claimsData.claims.sub;

    // Verify admin role
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const { data: isAdmin } = await supabase.rpc("has_role", {
      _user_id: userId,
      _role: "admin",
    });

    if (!isAdmin) {
      return new Response(
        JSON.stringify({ error: "Accès refusé" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get overdue invoices that need reminders
    const { data: overdueInvoices, error } = await supabase.rpc("get_overdue_invoices");

    if (error) {
      console.error("Error fetching overdue invoices:", error);
      throw error;
    }

    if (!overdueInvoices || overdueInvoices.length === 0) {
      return new Response(
        JSON.stringify({ message: "Aucune facture en retard nécessitant une relance.", count: 0 }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const results = [];

    for (const invoice of overdueInvoices) {
      // Generate reminder message using AI
      const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
      let reminderMessage = `Bonjour ${invoice.client_name},\n\nNous vous rappelons que la facture ${invoice.number} d'un montant de ${invoice.total} ${invoice.company_currency} est en retard de ${invoice.days_overdue} jours.\n\nMerci de procéder au règlement dans les meilleurs délais.\n\nCordialement.`;

      if (LOVABLE_API_KEY) {
        try {
          const aiResponse = await fetch(
            "https://ai.gateway.lovable.dev/v1/chat/completions",
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${LOVABLE_API_KEY}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                model: "google/gemini-2.5-flash-lite",
                messages: [
                  {
                    role: "system",
                    content: "Tu es un assistant professionnel qui rédige des emails de relance pour factures impayées. Sois poli mais ferme. Rédige uniquement le corps de l'email, sans objet ni signature. En français.",
                  },
                  {
                    role: "user",
                    content: `Rédige un email de relance pour la facture ${invoice.number} d'un montant de ${invoice.total} ${invoice.company_currency}, en retard de ${invoice.days_overdue} jours, adressé à ${invoice.client_name}.`,
                  },
                ],
              }),
            }
          );

          if (aiResponse.ok) {
            const aiData = await aiResponse.json();
            reminderMessage = aiData.choices?.[0]?.message?.content || reminderMessage;
          }
        } catch (aiErr) {
          console.error("AI generation failed, using default message:", aiErr);
        }
      }

      // Log the reminder in the database
      const { error: insertError } = await supabase
        .from("invoice_reminders")
        .insert({
          document_id: invoice.document_id,
          user_id: invoice.user_id,
          reminder_type: "auto",
          status: "sent",
          message: reminderMessage,
        });

      if (insertError) {
        console.error("Error logging reminder:", insertError);
        results.push({ invoice: invoice.number, status: "failed", error: insertError.message });
      } else {
        results.push({ invoice: invoice.number, status: "sent", client: invoice.client_email, days_overdue: invoice.days_overdue });
      }
    }

    console.log(`Processed ${results.length} reminders`);

    return new Response(
      JSON.stringify({ message: `${results.filter(r => r.status === 'sent').length} relance(s) envoyée(s)`, results }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("send-reminders error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Erreur inconnue" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
