import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const normalizeEmail = (value: unknown): string =>
  (typeof value === "string" ? value : "").trim().toLowerCase();

const normalizeStatus = (value: unknown): string =>
  (typeof value === "string" ? value : "").trim().toLowerCase();

const readPath = (source: unknown, path: string[]): unknown => {
  let current: unknown = source;

  for (const key of path) {
    if (!current || typeof current !== "object") {
      return undefined;
    }

    const objectValue = current as Record<string, unknown>;
    if (!(key in objectValue)) {
      return undefined;
    }

    current = objectValue[key];
  }

  return current;
};

const firstDefined = (source: unknown, paths: string[][]): unknown => {
  for (const path of paths) {
    const value = readPath(source, path);
    if (value !== undefined && value !== null && value !== "") {
      return value;
    }
  }

  return undefined;
};

const extractEmail = (payload: unknown): string =>
  normalizeEmail(
    firstDefined(payload, [
      ["email"],
      ["buyer_email"],
      ["customer_email"],
      ["customer", "email"],
      ["payer", "email"],
      ["data", "email"],
      ["data", "buyer_email"],
      ["data", "customer", "email"],
      ["payload", "email"],
      ["payload", "customer_email"],
      ["payment", "email"],
      ["metadata", "email"],
    ]),
  );

const extractStatus = (payload: unknown): string =>
  normalizeStatus(
    firstDefined(payload, [
      ["status"],
      ["plan_status"],
      ["payment_status"],
      ["event"],
      ["type"],
      ["data", "status"],
      ["data", "plan_status"],
      ["data", "payment_status"],
      ["data", "event"],
      ["payment", "status"],
      ["transaction", "status"],
      ["payload", "status"],
    ]),
  );

type StatusMap = {
  accessGranted: boolean;
  planStatus: string;
  accessStatus: string;
  paymentStatus: string;
  recognized: boolean;
};

const mapStatus = (status: string): StatusMap => {
  if (["approved", "paid", "completed", "active", "success", "authorized"].includes(status)) {
    return {
      accessGranted: true,
      planStatus: "active",
      accessStatus: "allowed",
      paymentStatus: "approved",
      recognized: true,
    };
  }

  if (["cancelled", "canceled"].includes(status)) {
    return {
      accessGranted: false,
      planStatus: "cancelled",
      accessStatus: "blocked",
      paymentStatus: "cancelled",
      recognized: true,
    };
  }

  if (["refunded", "chargedback", "chargeback"].includes(status)) {
    return {
      accessGranted: false,
      planStatus: "refunded",
      accessStatus: "blocked",
      paymentStatus: "refunded",
      recognized: true,
    };
  }

  if (status === "expired") {
    return {
      accessGranted: false,
      planStatus: "expired",
      accessStatus: "blocked",
      paymentStatus: "expired",
      recognized: true,
    };
  }

  return {
    accessGranted: false,
    planStatus: "pending",
    accessStatus: "blocked",
    paymentStatus: "pending",
    recognized: false,
  };
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

    let body: unknown = {};
    try {
      body = await req.json();
    } catch {
      body = {};
    }

    console.log("Payment webhook received:", JSON.stringify(body));

    const email = extractEmail(body);
    const status = extractStatus(body);

    if (!email) {
      console.error("Webhook error: no email provided in payload");
      return new Response(
        JSON.stringify({ error: "Email is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    let mapped = mapStatus(status);
    const nowIso = new Date().toISOString();

    console.log(`Processing payment for email=${email}, status=${status || "unknown"}`);
    console.log("checking user_access by normalized email");

    const { data: appUser, error: appUserLookupError } = await supabase
      .from("app_users")
      .select("id, email")
      .ilike("email", email)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (appUserLookupError) {
      console.error("Error looking up app_users by email:", appUserLookupError);
    }

    const { data: existingAccess, error: existingAccessError } = await supabase
      .from("user_access")
      .select("id, user_id, email, plan_status, access_granted")
      .ilike("email", email)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existingAccessError) {
      console.error("Error looking up user_access by email:", existingAccessError);
    }

    if (!mapped.recognized && existingAccess) {
      const existingActive =
        normalizeStatus(existingAccess.plan_status) === "active" || existingAccess.access_granted === true;

      mapped = {
        accessGranted: existingActive,
        planStatus: existingActive ? "active" : normalizeStatus(existingAccess.plan_status) || "pending",
        accessStatus: existingActive ? "allowed" : "blocked",
        paymentStatus: existingActive ? "approved" : normalizeStatus(existingAccess.plan_status) || "pending",
        recognized: false,
      };
    }

    if (mapped.planStatus === "active") {
      console.log("active plan found");
      if (!mapped.accessGranted) {
        console.log("reconciling access_granted=true");
      }
      mapped.accessGranted = true;
      mapped.accessStatus = "allowed";
      mapped.paymentStatus = "approved";
    }

    let linkedUserId = appUser?.id ?? null;

    if (!linkedUserId && existingAccess?.user_id) {
      linkedUserId = existingAccess.user_id;
    }

    if (!existingAccess?.user_id && linkedUserId) {
      console.log("reconciling user_id");
    }

    const userAccessPayload: Record<string, unknown> = {
      email,
      plan_status: mapped.planStatus,
      access_granted: mapped.accessGranted,
      updated_at: nowIso,
      user_id: linkedUserId,
    };

    if (mapped.accessGranted) {
      userAccessPayload.purchased_at = nowIso;
    }

    const { data: updatedAccessRows, error: userAccessUpdateError } = await supabase
      .from("user_access")
      .update(userAccessPayload)
      .ilike("email", email)
      .select("id");

    if (userAccessUpdateError) {
      console.error("Error updating user_access:", userAccessUpdateError);
    }

    if (!updatedAccessRows || updatedAccessRows.length === 0) {
      const { error: userAccessInsertError } = await supabase
        .from("user_access")
        .insert({
          email,
          user_id: linkedUserId,
          plan_status: mapped.planStatus,
          access_granted: mapped.accessGranted,
          purchased_at: mapped.accessGranted ? nowIso : null,
          updated_at: nowIso,
        });

      if (userAccessInsertError) {
        console.error("Error inserting user_access:", userAccessInsertError);
      }
    }

    if (linkedUserId) {
      const { error: appUserUpdateError } = await supabase
        .from("app_users")
        .update({
          access_status: mapped.accessStatus,
          payment_status: mapped.paymentStatus,
          email,
          updated_at: nowIso,
        })
        .eq("id", linkedUserId);

      if (appUserUpdateError) {
        console.error("Error updating app_users by id:", appUserUpdateError);
      }
    }

    // Upsert into paid_users (source of truth for frontend access check)
    const paidUserStatus = mapped.accessGranted
      ? "COMPRA_APROVADA"
      : mapped.planStatus === "cancelled"
        ? "CANCELADA"
        : mapped.planStatus === "refunded"
          ? "REEMBOLSADA"
          : mapped.planStatus === "expired"
            ? "EXPIRADA"
            : "PENDENTE";

    // Check if record exists, then update or insert
    const { data: existingPaidUser } = await supabase
      .from("paid_users")
      .select("id")
      .ilike("email", email)
      .limit(1)
      .maybeSingle();

    let paidUsersError: unknown = null;

    if (existingPaidUser) {
      const { error } = await supabase
        .from("paid_users")
        .update({
          status_pagamento: paidUserStatus,
          paid_at: mapped.accessGranted ? nowIso : null,
        })
        .eq("id", existingPaidUser.id);
      paidUsersError = error;
    } else {
      const { error } = await supabase
        .from("paid_users")
        .insert({
          email,
          status_pagamento: paidUserStatus,
          paid_at: mapped.accessGranted ? nowIso : null,
        });
      paidUsersError = error;
    }

    if (paidUsersError) {
      console.error("Error upserting paid_users:", paidUsersError);
    } else {
      console.log(`paid_users upserted: email=${email}, status=${paidUserStatus}`);
    }

    if (mapped.accessGranted) {
      console.log("access released");
    } else {
      console.log("no active access found");
    }

    return new Response(
      JSON.stringify({
        success: true,
        user_found: !!appUser,
        email,
        status,
        access_status: mapped.accessStatus,
        payment_status: mapped.paymentStatus,
        plan_status: mapped.planStatus,
        access_granted: mapped.accessGranted,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (err) {
    console.error("Webhook processing error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
