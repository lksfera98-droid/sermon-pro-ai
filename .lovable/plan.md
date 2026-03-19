
Objetivo: corrigir a liberação para funcionar apenas com Auth + `paid_users`, sem redirecionamento prematuro.

Diagnóstico confirmado
- O código atual ainda valida em `user_access` (`src/hooks/useAccessCheck.tsx`), não em `paid_users`.
- Logs atuais mostram: email autenticado `lksfera9810@gmail.com` e `records found: 0`, então o fluxo nega acesso.
- No backend conectado ao app, hoje existe `paid_users` aprovado para outro email (`lksfera1@gmail.com`), não para o email logado (`lksfera9810@gmail.com`), então mesmo com lógica correta esse usuário continuaria bloqueado até existir linha correta em `paid_users`.

Plano de correção (implementação)
1) Simplificar `useAccessCheck` para `paid_users` (fonte única)
- Remover qualquer uso de `user_access`.
- Normalizar email autenticado com `trim().toLowerCase()`.
- Consultar somente:
  - `email` (comparação case-insensitive)
  - `status_pagamento = 'COMPRA_APROVADA'`
- Regra final:
  - `>= 1` registro: acesso liberado
  - `0` registros: acesso bloqueado
- Manter estado rígido `loading + checked` para impedir redirect antes do fim da consulta.
- Logs obrigatórios no console:
  - email autenticado bruto
  - email normalizado
  - quantidade de registros
  - `status_pagamento` retornado
  - decisão final (GRANTED/DENIED)

2) Eliminar qualquer redirect prematuro no fluxo de entrada
- Em `/auth`:
  - após login/cadastro, aguardar sessão pronta
  - só redirecionar depois de `checkAccess` concluir
- Em `ProtectedRoute`:
  - enquanto `authLoading` ou `!checked` ou `accessLoading`, renderizar spinner
  - só decidir rota após consulta concluída
- Em `/acesso-bloqueado`:
  - botão “Já comprei, verificar novamente” reutiliza exatamente o mesmo `checkAccess`
  - se aprovou, redireciona imediatamente para `/`

3) Alinhar atualização de pagamento com `paid_users`
- Ajustar webhook de pagamento para gravar/atualizar `paid_users` com email normalizado.
- Mapear pagamento aprovado para `status_pagamento = 'COMPRA_APROVADA'`.
- Isso garante que novos pagamentos liberem acesso no fluxo correto, sem depender de tabela legada.

4) Correção de dados do caso atual
- Validar no backend do app se existe linha em `paid_users` para o email logado.
- Se não existir, inserir/atualizar a linha correta com:
  - `email` normalizado do usuário
  - `status_pagamento = 'COMPRA_APROVADA'`
- Sem esse ajuste de dado, qualquer código continuará bloqueando esse usuário específico.

5) Validação final (E2E)
- Caso A: usuário com `COMPRA_APROVADA` em `paid_users` entra direto no app.
- Caso B: usuário sem registro aprovado vai para `/acesso-bloqueado`.
- Caso C: usuário bloqueado clica “Já comprei, verificar novamente” após ativação no backend e entra imediatamente.
- Confirmar no console os 5 logs de depuração e ausência total de flicker/redirecionamento antes da consulta terminar.

Detalhe técnico da consulta alvo
- Tabela: `paid_users`
- Filtro: `email` (normalizado/case-insensitive) + `status_pagamento = 'COMPRA_APROVADA'`
- Sem `user_access`, sem `user_id`, sem assinatura, sem expiração.
