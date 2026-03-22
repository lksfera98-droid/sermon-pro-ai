

## Problema

Quando alguém compra, o email vai para `compradores` ou `paid_users`, mas o `profiles.is_paid` não é atualizado automaticamente. O `ProtectedRoute` só verifica `profiles.is_paid`, então o acesso fica bloqueado.

## Solução

Criar triggers no banco que sincronizam `profiles.is_paid = true` automaticamente quando um registro é inserido em `compradores` ou `paid_users`.

### Alterações

**1. Migration SQL — dois triggers de sincronização**

- Trigger `on INSERT` na tabela `compradores`: busca o perfil pelo email normalizado e seta `is_paid = true`
- Trigger `on INSERT` na tabela `paid_users`: mesma lógica, mas só quando `status_pagamento` não está em lista de bloqueio (CANCELADA, REEMBOLSADA, etc.)
- Ambos usam `SECURITY DEFINER` para bypassar RLS

**2. Migration SQL — atualizar perfis existentes agora**

- UPDATE em `profiles` setando `is_paid = true` para todos os emails que já existem em `compradores` ou `paid_users` (com status válido)

**3. Atualizar `ProtectedRoute.tsx`**

- Simplificar a lógica: como os triggers mantêm `profiles.is_paid` sincronizado, a consulta atual já funciona corretamente. Nenhuma mudança necessária no frontend.

### Resultado

Qualquer compra futura libera o acesso automaticamente. Compradores antigos que já estão nas tabelas serão liberados imediatamente pelo UPDATE inicial.

