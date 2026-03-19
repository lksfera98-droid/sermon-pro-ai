
Diagnóstico do erro (com base no código + banco atual):
1) O app libera acesso usando `can_current_user_access()` -> hoje essa função consulta `public.app_users.access_status = 'allowed'`.
2) O fluxo de pagamento ainda está populando/alterando `public.user_access` (ou até outro projeto de banco), e não atualiza `app_users` de forma garantida.
3) Resultado: usuário pode ter pagamento aprovado em outro lugar, mas no backend do app continua `app_users.access_status = 'blocked'`, então o botão “Já comprei” sempre retorna bloqueado.
4) Evidência adicional: não existe função de webhook de pagamento no repositório atual; então não há atualização oficial e centralizada do status de pagamento neste backend.

Plano de correção definitiva (implementação):
1) Unificar a regra de acesso no backend (sem depender do frontend)
- Criar nova função SQL `public.get_current_user_access_state()` (security definer) que retorna:
  - `allowed` (boolean)
  - `access_status`
  - `payment_status`
  - `reason` (`approved`, `pending`, `cancelled`, `expired`, `refunded`, `not_found`)
- Atualizar `public.can_current_user_access()` para usar a mesma lógica de verdade (fonte única).

2) Sincronização automática entre tabelas para compatibilidade imediata
- Criar função SQL `public.sync_app_users_from_user_access()` + trigger `AFTER INSERT OR UPDATE` em `public.user_access`.
- Regra:
  - `plan_status='active'` ou `access_granted=true` -> `app_users.access_status='allowed'` e `payment_status='approved'`
  - demais estados -> `access_status='blocked'` + `payment_status` correspondente.
- Isso garante que, se o pagamento continuar escrevendo em `user_access`, o acesso no app será liberado automaticamente.

3) Backfill de dados já pagos
- Rodar SQL de reconciliação para atualizar `app_users` a partir de `user_access` já existente (por email normalizado com `lower(trim(email))`).
- Corrigir qualquer divergência histórica em lote.

4) Webhook oficial de pagamento no backend do app (obrigatório para não quebrar de novo)
- Criar função backend `payment-webhook`:
  - recebe evento do gateway de pagamento,
  - normaliza email do comprador,
  - procura usuário em `app_users`,
  - atualiza `payment_status` e `access_status`,
  - espelha em `user_access` (compatibilidade),
  - gera logs claros.
- Se não encontrar email cadastrado, registrar log de erro explícito (não criar usuário por pagamento).
- Resultado: pagamento só libera/bloqueia acesso; nunca cria conta.

5) Frontend: botão “Já comprei, verificar novamente” com diagnóstico real
- `useAccessCheck` passa a chamar `get_current_user_access_state()` (não só booleano).
- Na tela `/acesso-bloqueado`:
  - se `allowed=true`, redireciona para `/`;
  - se bloqueado, mostrar motivo real (`pagamento pendente/cancelado/etc`) em mensagem amigável.
- Adicionar logs no console:
  - “Status de acesso consultado”
  - “Usuário bloqueado aguardando pagamento”
  - “Acesso liberado após confirmação de pagamento”

6) Ponto crítico que precisa ser corrigido no fluxo externo
- Garantir que o gateway de pagamento esteja apontando para o webhook deste backend (Lovable Cloud deste projeto), não para outro projeto.
- Sem isso, o pagamento continuará sendo confirmado fora do backend do app e o acesso nunca será liberado aqui.

Detalhes técnicos (o que vou alterar):
- Nova migration SQL:
  - criar/ajustar funções: `get_current_user_access_state`, `can_current_user_access`, `sync_app_users_from_user_access`
  - criar trigger de sync em `user_access`
  - executar backfill de reconciliação
- Novo backend function:
  - `supabase/functions/payment-webhook/index.ts` (handler robusto com logs + update por email)
- Frontend:
  - `src/hooks/useAccessCheck.tsx` (status detalhado, não só boolean)
  - `src/pages/AccessBlocked.tsx` (mensagens de status reais no recheck)

Critérios de aceite (validação final):
1) Usuário cadastra -> aparece em Authentication e em `public.app_users` com `blocked/pending`.
2) Evento de pagamento aprovado para email existente -> `app_users` vira `allowed/approved`.
3) Clique em “Já comprei, verificar novamente” -> acesso liberado imediatamente.
4) Novo login após pagamento -> entra direto no app.
5) Cancelado/expirado/reembolsado -> volta para bloqueado.
6) Caso email não encontrado no webhook -> log explícito de erro, sem criar usuário automático.
