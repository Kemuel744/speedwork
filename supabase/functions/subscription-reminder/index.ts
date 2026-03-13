import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Find active subscriptions expiring in exactly 3 days
    const now = new Date();
    const threeDaysLater = new Date(now);
    threeDaysLater.setDate(threeDaysLater.getDate() + 3);

    const startOfDay = new Date(threeDaysLater);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(threeDaysLater);
    endOfDay.setHours(23, 59, 59, 999);

    const { data: expiringSubs, error: subsError } = await supabase
      .from('subscriptions')
      .select('id, user_id, plan, end_date, amount')
      .eq('status', 'active')
      .gte('end_date', startOfDay.toISOString())
      .lte('end_date', endOfDay.toISOString());

    if (subsError) {
      console.error('Error fetching subscriptions:', subsError);
      return new Response(JSON.stringify({ error: subsError.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!expiringSubs || expiringSubs.length === 0) {
      return new Response(JSON.stringify({ message: 'No expiring subscriptions found', count: 0 }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const planLabels: Record<string, string> = {
      monthly: 'Mensuel',
      annual: 'Annuel',
      enterprise: 'Entreprise',
    };

    let notifiedCount = 0;

    for (const sub of expiringSubs) {
      // Check if we already sent a reminder for this subscription
      const { data: existing } = await supabase
        .from('notifications')
        .select('id')
        .eq('user_id', sub.user_id)
        .eq('type', 'subscription_expiry')
        .gte('created_at', new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString())
        .limit(1);

      if (existing && existing.length > 0) {
        continue; // Already notified today
      }

      const planName = planLabels[sub.plan] || sub.plan;
      const expiryDate = new Date(sub.end_date).toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });

      const { error: notifError } = await supabase
        .from('notifications')
        .insert({
          user_id: sub.user_id,
          title: '⚠️ Abonnement bientôt expiré',
          message: `Votre abonnement ${planName} expire le ${expiryDate}. Renouvelez-le pour continuer à profiter de SpeedWork.`,
          type: 'subscription_expiry',
          metadata: {
            subscription_id: sub.id,
            plan: sub.plan,
            end_date: sub.end_date,
            amount: sub.amount,
          },
        });

      if (notifError) {
        console.error(`Error notifying user ${sub.user_id}:`, notifError);
      } else {
        notifiedCount++;
      }
    }

    return new Response(
      JSON.stringify({ message: `Notified ${notifiedCount} users`, count: notifiedCount }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
