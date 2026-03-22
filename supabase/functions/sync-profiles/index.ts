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

    const url = new URL(req.url);
    const mode = url.searchParams.get("mode") || "sync";

    if (mode === "debug") {
      const { data: profiles } = await supabase.from("profiles").select("email, is_paid").order("created_at", { ascending: false }).limit(20);
      const { data: compradores } = await supabase.from("compradores").select("email").limit(20);
      const { data: paidUsers } = await supabase.from("paid_users").select("email, status_pagamento").limit(20);
      
      return new Response(JSON.stringify({ profiles, compradores, paidUsers }, null, 2), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Sync mode
    const blockedStatuses = ['CANCELADA', 'CANCELED', 'REEMBOLSADA', 'REFUNDED', 'CHARGEBACK', 'CHARGEDBACK', 'EXPIRADA', 'EXPIRED'];
    
    const { data: compradores } = await supabase.from("compradores").select("email");
    const { data: paidUsers } = await supabase.from("paid_users").select("email, status_pagamento");

    const validPaidEmails = (paidUsers || [])
      .filter(pu => !blockedStatuses.includes((pu.status_pagamento || '').trim().toUpperCase()))
      .map(pu => pu.email.trim().toLowerCase());
    const compradoresEmails = (compradores || []).map(c => c.email.trim().toLowerCase());
    const allValidEmails = [...new Set([...compradoresEmails, ...validPaidEmails])];

    const { data: profiles } = await supabase.from("profiles").select("id, email, is_paid");

    let updated = 0;
    const details: string[] = [];
    for (const profile of (profiles || [])) {
      const profileEmail = (profile.email || '').trim().toLowerCase();
      const isValid = allValidEmails.includes(profileEmail);
      
      if (!profile.is_paid && isValid) {
        const { error } = await supabase.from("profiles").update({
          is_paid: true, subscription_status: 'active', updated_at: new Date().toISOString(),
        }).eq("id", profile.id);
        if (!error) { updated++; details.push(`updated: ${profileEmail}`); }
        else details.push(`error ${profileEmail}: ${error.message}`);
      } else if (!isValid && !profile.is_paid) {
        details.push(`no match: ${profileEmail}`);
      }
    }

    return new Response(
      JSON.stringify({ success: true, updated, totalValidEmails: allValidEmails.length, totalProfiles: (profiles || []).length, details }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
