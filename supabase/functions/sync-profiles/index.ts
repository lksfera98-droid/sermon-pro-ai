import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Create the trigger functions and triggers using raw SQL via rpc
    // Since we can't run DDL via the client, we'll do the data sync part
    
    // Get all compradores emails
    const { data: compradores } = await supabase
      .from("compradores")
      .select("email");

    // Get all paid_users with valid status
    const blockedStatuses = ['CANCELADA', 'CANCELED', 'REEMBOLSADA', 'REFUNDED', 'CHARGEBACK', 'CHARGEDBACK', 'EXPIRADA', 'EXPIRED'];
    const { data: paidUsers } = await supabase
      .from("paid_users")
      .select("email, status_pagamento");

    const validPaidEmails = (paidUsers || [])
      .filter(pu => !blockedStatuses.includes((pu.status_pagamento || '').trim().toUpperCase()))
      .map(pu => pu.email.trim().toLowerCase());

    const compradoresEmails = (compradores || []).map(c => c.email.trim().toLowerCase());
    
    const allValidEmails = [...new Set([...compradoresEmails, ...validPaidEmails])];

    // Get all profiles that need updating
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, email, is_paid");

    let updated = 0;
    for (const profile of (profiles || [])) {
      if (profile.is_paid) continue;
      const profileEmail = (profile.email || '').trim().toLowerCase();
      if (allValidEmails.includes(profileEmail)) {
        const { error } = await supabase
          .from("profiles")
          .update({
            is_paid: true,
            subscription_status: 'active',
            updated_at: new Date().toISOString(),
          })
          .eq("id", profile.id);
        if (!error) updated++;
      }
    }

    return new Response(
      JSON.stringify({ success: true, updated, totalValidEmails: allValidEmails.length }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
