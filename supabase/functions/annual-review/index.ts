import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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
    const { documentsSummary, year, clientName } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = `Tu es un expert-comptable et consultant en stratégie d'entreprise en Afrique. 
Tu analyses les données financières annuelles d'un client et produis un bilan complet.

Tu dois structurer ta réponse en utilisant exactement ces sections avec les titres Markdown :

## 📊 Résumé Financier
Résume les chiffres clés : total facturé, total payé, impayés, nombre de devis/factures.

## ✅ Succès de l'Année
Identifie les points forts, les mois performants, les tendances positives.

## ⚠️ Zones d'Ombre
Identifie les périodes difficiles, les impayés récurrents, les baisses d'activité.

## 💡 Conseils de Développement
Donne des conseils concrets et actionnables basés sur les résultats.

## 🚀 Nouvelles Perspectives
Propose des méthodes innovantes, de nouvelles approches commerciales ou organisationnelles pour améliorer les résultats l'année suivante.

Sois précis, professionnel et bienveillant. Utilise des données chiffrées quand possible.
Réponds toujours en français.`;

    const userPrompt = `Voici les données financières de ${clientName || "ce client"} pour l'année ${year} :

${documentsSummary}

Produis un bilan annuel complet avec des conseils personnalisés.`;

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          stream: true,
        }),
      }
    );

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Trop de requêtes, veuillez réessayer dans un instant." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Crédits IA épuisés." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(
        JSON.stringify({ error: "Erreur du service IA" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("annual-review error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Erreur inconnue" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
