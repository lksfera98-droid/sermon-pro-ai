

# Fix: Access Liberation

## Root Cause

The `paid_users` table has **0 records**. All payment data lives in `user_access` (e.g. `lksfera1@gmail.com` has `plan_status = 'active'`). The current code queries `paid_users` exclusively, so it always returns empty and blocks everyone.

## Solution

Two options — since you said to use `paid_users`, we need to either populate it or switch the query target. The simplest fix:

**Switch `useAccessCheck` to query `user_access` instead of `paid_users`**, checking for `plan_status = 'active'` OR `access_granted = true`.

This requires changing only the query in `useAccessCheck.tsx` — the rest of the flow (Auth.tsx, ProtectedRoute.tsx, AccessBlocked.tsx) already works correctly.

## Changes

### 1. `src/hooks/useAccessCheck.tsx`
Replace the `paid_users` query with:
```
supabase
  .from('user_access')
  .select('id')
  .ilike('email', normalizedEmail)
  .or('plan_status.eq.active,access_granted.eq.true')
  .limit(1)
```

Add detailed debug logs:
- authenticated email
- normalized email
- records found count
- access decision

### 2. SQL Migration: Populate `paid_users` from `user_access`
Insert records from `user_access` where `plan_status = 'active'` into `paid_users` with `status_pagamento = 'COMPRA_APROVADA'`, so both tables stay in sync going forward. This way if you later want to switch back to `paid_users`, the data is there.

### No other files change
Auth.tsx, ProtectedRoute.tsx, and AccessBlocked.tsx all delegate to `useAccessCheck` — they work fine as-is.

