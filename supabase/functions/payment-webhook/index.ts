import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const body = await req.json();
    console.log("Payment webhook received:", JSON.stringify(body));

    // Extract email and status from payload
    // Supports common webhook formats: { email, status } or { buyer_email, payment_status }
    const email = (body.email || body.buyer_email || body.customer_email || "")
      .toString()
      .trim()
      .toLowerCase();
    const status = (
      body.status ||
      body.payment_status ||
      body.event ||
      ""
    )
      .toString()
      .trim()
      .toLowerCase();

    if (!email) {
      console.error("Webhook error: no email provided in payload");
      return new Response(
        JSON.stringify({ error: "Email is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Processing payment for email: ${email}, status: ${status}`);

    // Determine access and payment status
    let accessStatus: string;
    let paymentStatus: string;

    if (["approved", "paid", "completed", "active", "success"].includes(status)) {
      accessStatus = "allowed";
      paymentStatus = "approved";
    } else if (["cancelled", "canceled", "refunded", "chargedback"].includes(status)) {
      accessStatus = "blocked";
      paymentStatus = status === "refunded" || status === "chargedback" ? "refunded" : "cancelled";
    } else if (["expired"].includes(status)) {
      accessStatus = "blocked";
      paymentStatus = "expired";
    } else {
      accessStatus = "blocked";
      paymentStatus = "pending";
    }

    // Update app_users
    const { data: appUser, error: appError } = await supabase
      .from("app_users")
      .update({
        access_status: accessStatus,
        payment_status: paymentStatus,
        updated_at: new Date().toISOString(),
      })
      .eq("email", email)
      .select("id, email")
      .maybeSingle();

    if (appError) {
      console.error("Error updating app_users:", appError);
    }

    if (!appUser) {
      console.error(`User not found in app_users for email: ${email}. User must register first.`);
    } else {
      console.log(`app_users updated: ${appUser.email} -> access=${accessStatus}, payment=${paymentStatus}`);
    }

    // Also update user_access for compatibility
    const { error: uaError } = await supabase
      .from("user_access")
      .update({
        access_granted: accessStatus === "allowed",
        plan_status: accessStatus === "allowed" ? "active" : "inactive",
        updated_at: new Date().toISOString(),
      })
      .eq("email", email);

    if (uaError) {
      console.error("Error updating user_access:", uaError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        user_found: !!appUser,
        email,
        access_status: accessStatus,
        payment_status: paymentStatus,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Webhook processing error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
