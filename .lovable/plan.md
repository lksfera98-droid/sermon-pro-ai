
Diagnóstico direto (o que está faltando para sair da tela de bloqueio):

1) Hoje o app libera acesso olhando SOMENTE `profiles.is_paid`.
2) No backend atual, não existe nenhum registro com `profiles.is_paid = true` (0 linhas true).
3) Para o usuário logado agora (`lksfera98@gmail.com`), não existe linha em `profiles` — então a regra cai em bloqueio.
4) O print mostra um `profiles` com estrutura diferente (ex.: `id` inteiro), indicando ambiente/projeto de banco diferente do que o app está consultando.
5) O webhook de pagamento atual atualiza `paid_users`/`user_access`/`app_users`, mas não sincroniza `profiles.is_paid`; por isso pagantes continuam bloqueados mesmo com pagamento aprovado em outras tabelas.

Plano de correção (implementação):

1. Corrigir o AuthGuard para diagnóstico confiável
- Manter checagem por email (como você pediu), mas usar `auth.getUser()` no início para pegar email fresco da sessão.
- Consultar `profiles` por email normalizado (`trim + lower`) com `eq('email', normalizedEmail)`.
- Manter logs obrigatórios:
  - email buscado
  - resultado encontrado
  - valor final de `is_paid`
- Em caso de erro de consulta, logar erro detalhado e bloquear com mensagem consistente.

2. Auto-recuperar perfil ausente (evitar bloqueio falso por linha faltante)
- Se não existir linha em `profiles` para o email logado, criar/upsert da linha mínima (`user_id`, `email`, `is_paid=false`) para manter consistência dos próximos acessos.
- Isso evita usuário “sumir” da tabela e ficar bloqueado sem trilha.

3. Sincronizar pagamento real -> `profiles.is_paid`
- Atualizar a função de webhook para, ao aprovar pagamento, também fazer upsert em `profiles` com:
  - `is_paid = true`
  - `subscription_status = 'active'`
  - `subscription_checked_at = now()`
- Em cancelamento/reembolso/expiração, atualizar `is_paid=false` e status correspondente.
- Assim, a tela protegida e o fluxo de pagamento passam a usar a mesma fonte de verdade.

4. Backfill dos dados já existentes (destravar quem já pagou)
- Rodar uma migração de reconciliação para marcar `profiles.is_paid=true` para emails já aprovados nas tabelas de pagamento/acesso.
- Garantir normalização de email em todas as comparações (`lower(trim(email))`).

5. Validação fim a fim
- Caso A: usuário com `is_paid=true` entra direto no app (sem `/acesso-restrito`).
- Caso B: usuário sem perfil é criado automaticamente e permanece bloqueado até pagamento.
- Caso C: webhook de pagamento aprovado libera acesso em novo login/refresh.
- Caso D: logs do console exibem email + valor de `is_paid` corretamente para debug.

Detalhes técnicos (resumo objetivo):
- Arquivos a ajustar:
  - `src/components/ProtectedRoute.tsx`
  - `supabase/functions/payment-webhook/index.ts`
  - nova migration de backfill/sincronização de `profiles.is_paid`
- Regras de comparação de email:
  - Front: `email.trim().toLowerCase()`
  - SQL: `lower(trim(email))`
- Resultado esperado:
  - qualquer pessoa com `profiles.is_paid = true` (no backend correto do app) deixa imediatamente a tela de bloqueio.
