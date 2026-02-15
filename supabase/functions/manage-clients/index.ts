import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Non autorisé' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    // Verify caller is admin
    const userClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } },
    })
    const { data: { user: caller } } = await userClient.auth.getUser()
    if (!caller) {
      return new Response(JSON.stringify({ error: 'Non autorisé' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey)
    const { data: isAdmin } = await adminClient.rpc('has_role', { _user_id: caller.id, _role: 'admin' })
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: 'Accès refusé' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const { action, ...payload } = await req.json()

    if (action === 'list') {
      // List all client profiles
      const { data: profiles, error } = await adminClient
        .from('profiles')
        .select('user_id, company_name, email, phone, address, created_at, trial_start, trial_docs_used')
        .order('created_at', { ascending: false })

      if (error) throw error

      // Get roles to filter only clients
      const { data: roles } = await adminClient.from('user_roles').select('user_id, role')
      const roleMap = new Map((roles || []).map(r => [r.user_id, r.role]))

      const clients = (profiles || []).filter(p => roleMap.get(p.user_id) !== 'admin')

      return new Response(JSON.stringify({ clients }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    if (action === 'create') {
      const { email, password, company_name, phone, address } = payload
      if (!email || !password || !company_name) {
        return new Response(JSON.stringify({ error: 'Email, mot de passe et nom de l\'entreprise requis' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }
      if (password.length < 6) {
        return new Response(JSON.stringify({ error: 'Le mot de passe doit contenir au moins 6 caractères' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }

      // Create user with admin API (auto-confirms email)
      const { data: newUser, error: createErr } = await adminClient.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { company_name },
      })
      if (createErr) {
        return new Response(JSON.stringify({ error: createErr.message }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }

      // Update profile with extra info
      if (newUser.user) {
        await adminClient.from('profiles').update({
          company_name,
          phone: phone || '',
          address: address || '',
        }).eq('user_id', newUser.user.id)
      }

      return new Response(JSON.stringify({ success: true, user_id: newUser.user?.id }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    if (action === 'delete') {
      const { user_id } = payload
      if (!user_id) {
        return new Response(JSON.stringify({ error: 'user_id requis' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }

      // Prevent deleting self
      if (user_id === caller.id) {
        return new Response(JSON.stringify({ error: 'Impossible de supprimer votre propre compte' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }

      // Delete auth user (cascades to profiles, roles via trigger/FK)
      const { error: delErr } = await adminClient.auth.admin.deleteUser(user_id)
      if (delErr) {
        return new Response(JSON.stringify({ error: delErr.message }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }

      // Clean up remaining data
      await adminClient.from('profiles').delete().eq('user_id', user_id)
      await adminClient.from('user_roles').delete().eq('user_id', user_id)
      await adminClient.from('documents').delete().eq('user_id', user_id)
      await adminClient.from('subscriptions').delete().eq('user_id', user_id)

      return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    return new Response(JSON.stringify({ error: 'Action non reconnue' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})
