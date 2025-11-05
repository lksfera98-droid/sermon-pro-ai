// Save public sermons with user auth validation and service role insert
// - Requires JWT (verify_jwt = true)
// - Validates input and language
// - Inserts into public.public_sermons using service role (bypasses RLS) after extracting user id from JWT

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

type Payload = {
  title: string
  content: string
  language: 'pt' | 'en' | 'es'
  theme: string
  verse?: string | null
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      })
    }

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      })
    }

    const payload = (await req.json()) as Payload
    if (!payload || !payload.title || !payload.content || !payload.language || !payload.theme) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      })
    }

    if (!['pt', 'en', 'es'].includes(payload.language)) {
      return new Response(JSON.stringify({ error: 'Invalid language' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      })
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    // Client as the user (to get user id via auth)
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    })

    const { data: { user }, error: userError } = await userClient.auth.getUser()
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized user' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      })
    }

    // Admin client to bypass RLS for insert
    const adminClient = createClient(supabaseUrl, serviceRoleKey)

    const { error: insertError } = await adminClient
      .from('public_sermons')
      .insert({
        title: payload.title,
        content: payload.content,
        language: payload.language,
        theme: payload.theme,
        verse: payload.verse ?? null,
        user_id: user.id,
      })

    if (insertError) {
      console.error('Insert error:', insertError)
      return new Response(JSON.stringify({ error: insertError.message }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      })
    }

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    })
  } catch (e) {
    console.error('Unexpected error:', e)
    return new Response(JSON.stringify({ error: 'Internal error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    })
  }
})
