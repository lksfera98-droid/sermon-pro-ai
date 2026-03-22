

## Problem

The `ProtectedRoute` queries `profiles` using `user_id` (line 34), but the user's profile may have been created with a mismatched or missing `user_id`. The user wants the lookup done by **email** instead, which is more reliable in their setup.

Additionally, the RLS policy on `profiles` restricts SELECT to `auth.uid() = user_id`, which means if `user_id` doesn't match, the query returns nothing — causing a false block even when `is_paid = true`.

## Plan

### 1. Fix ProtectedRoute query to use email

Change `src/components/ProtectedRoute.tsx`:
- Replace `.eq('user_id', user.id)` with `.ilike('email', email)` (using the normalized email)
- Add `console.log` statements showing the email being queried and the `is_paid` result for debugging

### 2. Fix RLS policy on profiles table

The current SELECT policy is `auth.uid() = user_id`. If we query by email, this policy will still block rows where `user_id` doesn't match the logged-in user. We need to add an additional SELECT policy:

```sql
CREATE POLICY "Users can view profile by email"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  lower(trim(email)) = lower(trim(coalesce(auth.jwt() ->> 'email', '')))
);
```

This allows the authenticated user to read their own profile row matched by email, even if `user_id` is mismatched.

### 3. Files changed

- `src/components/ProtectedRoute.tsx` — query by email + add console.log debug lines
- Database migration — add email-based SELECT policy on `profiles`

