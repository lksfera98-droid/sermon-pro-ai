Diagnóstico confirmado (com base no código, logs e dados atuais):
1) O app está bloqueando por `get_current_user_access_state()` (retorna `blocked/pending`) e esse RPC hoje não aplica fallback completo da tabela `user_access`.
2) Há inconsistência entre fontes de verdade: `can_current_user_access()` tem fallback, mas o frontend usa primeiro o RPC detalhado; então usuário pode continuar bloqueado mesmo com pagamento marcado em `user_access`.
3) Não há evidência de eventos reais de pagamento chegando ao webhook deste backend (logs só mostram teste manual), então a liberação automática não está sendo acionada para os compradores.
4) Seu print mostra dados em outro projeto/tabela (estrutura diferente), indicando provável atualização fora do backend que o app realmente consulta.

Plano de correção definitiva (implementação):
1) Unificar regra de acesso em UMA função
- Reescrever `public.get_current_user_access_state()` para:
  - ler `app_users` por `auth.uid()`;
  - fazer fallback por email em `user_access` (`access_granted=true` OU `plan_status='active'`);
  - reconciliar automaticamente `app_users` para `allowed/approved` quando fallback indicar pago;
  - retornar `reason` consistente (`approved|pending|cancelled|expired|refunded|not_found`).
- Reescrever `public.can_current_user_access()` para delegar à função acima (fonte única).

2) Blindar sincronização entre tabelas
- Ajustar trigger `sync_user_access_to_app_users` para mapear status de forma determinística (approved=>allowed; demais=>blocked).
- Garantir atualização case-insensitive por email normalizado em ambos os lados.

3) Corrigir webhook para liberação real
- Fortalecer parser do webhook para payloads reais do gateway (campos aninhados e variações de evento/status).
- Atualizar `app_users` e `user_access` por email normalizado.
- Logar claramente:
  - payload recebido,
  - email/status normalizados,
  - usuário encontrado/não encontrado,
  - resultado final de acesso.
- Não criar usuário por pagamento.

4) Ajustar frontend de rechecagem
- `useAccessCheck` deve depender do RPC unificado (já reconciliado), sem divergência de lógica.
- Em `AccessBlocked`, `recheck` deve usar o estado retornado na mesma chamada (evitar estado stale para mensagem).
- Mensagem de bloqueio deve refletir o `reason` real do backend.

5) Validação end-to-end obrigatória
- Caso A: cadastro novo => usuário criado no Auth + linha em `app_users` (`blocked/pending`).
- Caso B: webhook aprovado (mesmo email) => `app_users.allowed` + `payment_status=approved`.
- Caso C: clicar “Já comprei” => redireciona e libera acesso.
- Caso D: novo login após pagamento => entra direto.
- Caso E: cancelado/expirado/reembolsado => volta a bloqueado.
- Caso F: webhook com email inexistente => log explícito, sem criar conta.

Arquivos/áreas que serão alterados:
- Migration SQL nova (funções + triggers + reconciliação).
- `supabase/functions/payment-webhook/index.ts`.
- `src/hooks/useAccessCheck.tsx`.
- `src/pages/AccessBlocked.tsx`.