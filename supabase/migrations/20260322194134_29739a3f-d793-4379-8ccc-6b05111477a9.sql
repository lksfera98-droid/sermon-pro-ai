-- Backfill: mark profiles.is_paid = true for emails that exist in compradores, paid_users (COMPRA_APROVADA), or user_access (access_granted=true)
UPDATE public.profiles
SET is_paid = true,
    subscription_status = 'active',
    subscription_checked_at = now(),
    updated_at = now()
WHERE lower(trim(email)) IN (
  SELECT lower(trim(email)) FROM public.compradores
  UNION
  SELECT lower(trim(email)) FROM public.paid_users WHERE lower(trim(status_pagamento)) = 'compra_aprovada'
  UNION
  SELECT lower(trim(email)) FROM public.user_access WHERE access_granted = true OR lower(trim(coalesce(plan_status, ''))) = 'active'
);