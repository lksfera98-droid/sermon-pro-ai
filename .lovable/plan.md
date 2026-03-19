

# Correção: Webhook não grava em `paid_users`

## Problema
O webhook `payment-webhook` grava apenas em `user_access` e `app_users`, mas **nunca** em `paid_users`. O frontend (`useAccessCheck`) consulta **somente** `paid_users`. Resultado: qualquer compra nova via webhook não libera acesso.

Hoje só existem 2 registros em `paid_users` (inseridos manualmente). Todos os outros compradores ficam bloqueados.

## Correções

### 1. Adicionar unique constraint em `paid_users.email`
Necessário para o upsert funcionar. Migração SQL:
```sql
CREATE UNIQUE INDEX IF NOT EXISTS paid_users_email_unique 
ON public.paid_users (lower(trim(email)));
```

### 2. Atualizar `payment-webhook` para gravar em `paid_users`
Quando o pagamento for aprovado (`accessGranted = true`), fazer upsert em `paid_users`:
- `email` normalizado
- `status_pagamento = 'COMPRA_APROVADA'`
- `paid_at = now()`

Quando cancelado/reembolsado, atualizar para o status correspondente (ex: `CANCELADA`, `REEMBOLSADA`).

Isso garante que **qualquer compra futura** cria automaticamente o registro correto na tabela que o frontend consulta.

### 3. Nenhuma mudança no frontend
O `useAccessCheck.tsx`, `ProtectedRoute.tsx` e `AccessBlocked.tsx` estão corretos. O problema é exclusivamente no webhook que não popula a tabela certa.

## Resultado esperado
- Compra aprovada via webhook → registro automático em `paid_users` com `COMPRA_APROVADA`
- Usuário faz login → `useAccessCheck` encontra o registro → acesso liberado
- Sem necessidade de inserir manualmente cada email

