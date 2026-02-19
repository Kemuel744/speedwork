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
    const { base } = await req.json();
    const baseCurrency = base || 'EUR';

    const response = await fetch(`https://open.er-api.com/v6/latest/${baseCurrency}`);
    if (!response.ok) {
      throw new Error(`Exchange rate API error: ${response.status}`);
    }

    const data = await response.json();

    // Filter to only our supported currencies
    const supportedCodes = ['EUR', 'XOF', 'XAF', 'USD', 'GBP', 'MAD', 'TND', 'GNF'];
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
