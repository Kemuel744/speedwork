import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supportedCodes = ['EUR', 'XOF', 'XAF', 'USD', 'GBP', 'MAD', 'TND', 'GNF'];
    const { base } = await req.json().catch(() => ({ base: 'EUR' }));
    const baseCurrency = typeof base === 'string' && base.length > 0 ? base : 'EUR';

    if (!supportedCodes.includes(baseCurrency)) {
      return new Response(JSON.stringify({ error: 'Devise non supportée' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const response = await fetch(`https://open.er-api.com/v6/latest/${encodeURIComponent(baseCurrency)}`);
    if (!response.ok) {
      throw new Error(`Exchange rate API error: ${response.status}`);
    }

    const data = await response.json();

    // Filter to only our supported currencies
    const rates: Record<string, number> = {};
    for (const code of supportedCodes) {
      if (data.rates[code]) {
        rates[code] = data.rates[code];
      }
    }

    return new Response(JSON.stringify({ base: baseCurrency, rates, time_last_update: data.time_last_update_utc }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Exchange rates error:', error);
    return new Response(JSON.stringify({ error: "Erreur lors de la récupération des taux de change." }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
