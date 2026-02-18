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

    const userClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } },
    })
    const { data: { user: caller } } = await userClient.auth.getUser()
    if (!caller) {
      return new Response(JSON.stringify({ error: 'Non autorisé' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey)
    const { action, ...payload } = await req.json()

    // Check if caller owns an organization
    const { data: org } = await adminClient
      .from('organizations')
      .select('*')
      .eq('owner_id', caller.id)
      .single()

    if (action === 'get-org') {
      if (!org) {
        return new Response(JSON.stringify({ org: null, members: [] }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }

      const { data: members } = await adminClient
        .from('organization_members')
        .select('*')
        .eq('organization_id', org.id)

      // Get profiles for members
      const memberIds = (members || []).map(m => m.user_id)
      const { data: profiles } = await adminClient
        .from('profiles')
        .select('user_id, email, company_name, phone')
        .in('user_id', memberIds.length ? memberIds : ['none'])

      const enrichedMembers = (members || []).map(m => {
        const profile = (profiles || []).find(p => p.user_id === m.user_id)
        return { ...m, email: profile?.email || '', name: profile?.company_name || '', phone: profile?.phone || '' }
      })

      return new Response(JSON.stringify({ org, members: enrichedMembers }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    if (action === 'create-org') {
      if (org) {
        return new Response(JSON.stringify({ error: 'Vous avez déjà une organisation' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }

      const { name } = payload
      if (!name?.trim()) {
        return new Response(JSON.stringify({ error: 'Nom de l\'organisation requis' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }

      // Check if user has enterprise subscription
      const { data: sub } = await adminClient
        .from('subscriptions')
        .select('*')
        .eq('user_id', caller.id)
        .eq('status', 'active')
        .eq('plan', 'enterprise')
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (!sub) {
        return new Response(JSON.stringify({ error: 'Un abonnement Entreprise actif est requis' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }

      const { data: newOrg, error: orgErr } = await adminClient
        .from('organizations')
        .insert({ name: name.trim(), owner_id: caller.id, max_members: 3 })
        .select()
        .single()

      if (orgErr) throw orgErr

      // Add owner as admin member
      await adminClient.from('organization_members').insert({
        organization_id: newOrg.id,
        user_id: caller.id,
        role: 'admin',
        position: 'Administrateur',
      })

      return new Response(JSON.stringify({ success: true, org: newOrg }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    if (action === 'add-member') {
      if (!org) {
        return new Response(JSON.stringify({ error: 'Organisation non trouvée' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }

      const { email, password, name, position } = payload
      if (!email || !password || !name) {
        return new Response(JSON.stringify({ error: 'Email, mot de passe et nom requis' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }
      if (password.length < 6) {
        return new Response(JSON.stringify({ error: 'Mot de passe: 6 caractères minimum' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }

      // Check member count (excluding owner)
      const { count } = await adminClient
        .from('organization_members')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', org.id)
        .neq('user_id', caller.id)

      if ((count || 0) >= org.max_members) {
        return new Response(JSON.stringify({ error: `Limite de ${org.max_members} collaborateurs atteinte` }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }

      // Create user account
      const { data: newUser, error: createErr } = await adminClient.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { company_name: name },
      })
      if (createErr) {
        return new Response(JSON.stringify({ error: createErr.message }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }

      if (newUser.user) {
        // Update profile
        await adminClient.from('profiles').update({
          company_name: name,
        }).eq('user_id', newUser.user.id)

        // Add to organization
        await adminClient.from('organization_members').insert({
          organization_id: org.id,
          user_id: newUser.user.id,
          role: 'member',
          position: position || '',
        })
      }

      return new Response(JSON.stringify({ success: true, user_id: newUser.user?.id }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    if (action === 'remove-member') {
      if (!org) {
        return new Response(JSON.stringify({ error: 'Organisation non trouvée' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }

      const { user_id } = payload
      if (!user_id) {
        return new Response(JSON.stringify({ error: 'user_id requis' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }
      if (user_id === caller.id) {
        return new Response(JSON.stringify({ error: 'Impossible de vous retirer vous-même' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }

      await adminClient.from('organization_members').delete()
        .eq('organization_id', org.id)
        .eq('user_id', user_id)

      // Optionally delete the user account
      await adminClient.auth.admin.deleteUser(user_id)
      await adminClient.from('profiles').delete().eq('user_id', user_id)
      await adminClient.from('user_roles').delete().eq('user_id', user_id)

      return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    if (action === 'update-member') {
      if (!org) {
        return new Response(JSON.stringify({ error: 'Organisation non trouvée' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }

      const { user_id, position } = payload
      if (!user_id) {
        return new Response(JSON.stringify({ error: 'user_id requis' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }

      await adminClient.from('organization_members').update({ position: position || '' })
        .eq('organization_id', org.id)
        .eq('user_id', user_id)

      return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    return new Response(JSON.stringify({ error: 'Action non reconnue' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})
