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
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Verify caller is authenticated
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Non autorisé" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const anonClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user: caller }, error: authError } = await anonClient.auth.getUser();
    if (authError || !caller) {
      return new Response(JSON.stringify({ error: "Non autorisé" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { worker_id, email } = await req.json();
    if (!worker_id || !email) {
      return new Response(JSON.stringify({ error: "worker_id et email requis" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return new Response(JSON.stringify({ error: "Format email invalide" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    // Verify worker belongs to caller
    const { data: workerData, error: workerError } = await adminClient
      .from("workers")
      .select("id, first_name, last_name, user_id, linked_user_id")
      .eq("id", worker_id)
      .single();

    if (workerError || !workerData) {
      return new Response(JSON.stringify({ error: "Travailleur introuvable" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (workerData.user_id !== caller.id) {
      return new Response(JSON.stringify({ error: "Non autorisé pour ce travailleur" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (workerData.linked_user_id) {
      return new Response(JSON.stringify({ error: "Ce travailleur a déjà un compte lié" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Update worker email
    await adminClient.from("workers").update({ email }).eq("id", worker_id);

    // Check if user already exists with this email
    const { data: existingUsers } = await adminClient.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find((u: any) => u.email === email);

    if (existingUser) {
      // Link existing user
      await adminClient.from("workers").update({ linked_user_id: existingUser.id }).eq("id", worker_id);
      return new Response(
        JSON.stringify({
          success: true,
          message: "Compte existant lié automatiquement",
          already_linked: true,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Invite new user via Supabase magic link invite
    const { data: inviteData, error: inviteError } = await adminClient.auth.admin.inviteUserByEmail(email, {
      data: {
        company_name: `${workerData.first_name} ${workerData.last_name}`,
        invited_as_worker: true,
        worker_id: worker_id,
      },
      redirectTo: `${req.headers.get("origin") || "https://speedwork.lovable.app"}/worker-dashboard`,
    });

    if (inviteError) {
      return new Response(JSON.stringify({ error: inviteError.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Notify the manager
    await adminClient.from("notifications").insert({
      user_id: caller.id,
      title: "Invitation envoyée",
      message: `Une invitation a été envoyée à ${workerData.first_name} ${workerData.last_name} (${email})`,
      type: "worker_invite",
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: `Invitation envoyée à ${email}`,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
