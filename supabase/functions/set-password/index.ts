import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { email, password, full_name } = await req.json();

    if (!email || !password) {
      return new Response(JSON.stringify({ error: "E-mail e senha são obrigatórios" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (password.length < 6) {
      return new Response(JSON.stringify({ error: "A senha deve ter pelo menos 6 caracteres" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const cleanEmail = email.trim().toLowerCase();

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Check if email is a buyer (compradores or user_access or paid_users)
    const { data: comprador } = await supabaseAdmin
      .from("compradores")
      .select("email")
      .eq("email", cleanEmail)
      .maybeSingle();

    const { data: userAccess } = await supabaseAdmin
      .from("user_access")
      .select("email")
      .ilike("email", cleanEmail)
      .maybeSingle();

    const { data: paidUser } = await supabaseAdmin
      .from("paid_users")
      .select("email")
      .ilike("email", cleanEmail)
      .maybeSingle();

    const isBuyer = !!(comprador || userAccess || paidUser);

    if (!isBuyer) {
      return new Response(JSON.stringify({ error: "not_a_buyer" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if user already exists in auth
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find(
      (u) => u.email?.toLowerCase() === cleanEmail
    );

    if (existingUser) {
      // User exists - update their password
      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
        existingUser.id,
        { password, email_confirm: true }
      );

      if (updateError) {
        return new Response(JSON.stringify({ error: updateError.message }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Update full_name if provided
      if (full_name) {
        await supabaseAdmin.auth.admin.updateUserById(existingUser.id, {
          user_metadata: { full_name },
        });
      }

      return new Response(JSON.stringify({ success: true, action: "password_updated" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } else {
      // User doesn't exist - create account with confirmed email
      const { error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: cleanEmail,
        password,
        email_confirm: true,
        user_metadata: { full_name: full_name || "" },
      });

      if (createError) {
        return new Response(JSON.stringify({ error: createError.message }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ success: true, action: "account_created" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  } catch (err) {
    return new Response(JSON.stringify({ error: "Erro interno do servidor" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
