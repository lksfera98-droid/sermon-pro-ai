

# Nova Lógica de Acesso: Tabela `compradores`

## Resumo
Criar a tabela `compradores` no banco, implementar login/signup, verificação de acesso por email na tabela `compradores`, e tela de bloqueio. Regra simples: email existe em `compradores` = acesso liberado.

## Alterações

### 1. Criar tabela `compradores`
```sql
CREATE TABLE public.compradores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX compradores_email_unique ON public.compradores (lower(trim(email)));
ALTER TABLE public.compradores ENABLE ROW LEVEL SECURITY;
-- Qualquer autenticado pode consultar pelo próprio email
CREATE POLICY "Users can check own email" ON public.compradores
  FOR SELECT TO authenticated
  USING (lower(trim(email)) = lower(trim(coalesce(auth.jwt()->>'email',''))));
```

### 2. Atualizar `payment-webhook` 
Adicionar insert na tabela `compradores` quando pagamento aprovado (além do que já faz em `paid_users`/`user_access`). Simples insert com `ON CONFLICT DO NOTHING`.

### 3. Criar página `Auth.tsx`
Tela de login/signup com email e senha usando `AuthContext` existente. Redireciona para `/` após login.

### 4. Criar página `AccessBlocked.tsx`
Tela de bloqueio com botão "Já comprei, verificar novamente" que faz query em `compradores` pelo email do usuário logado. Se encontrar, redireciona para `/`.

### 5. Criar hook `useAccessCheck.tsx`
- Recebe o email do usuário logado
- Faz `select` em `compradores` filtrando por email
- Retorna `{ hasAccess: boolean, loading: boolean, recheck: () => void }`

### 6. Criar `ProtectedRoute.tsx`
- Se não autenticado → redireciona para `/auth`
- Se autenticado mas email não está em `compradores` → redireciona para `/acesso-bloqueado`
- Se autenticado e email está em `compradores` → renderiza children

### 7. Atualizar `App.tsx`
- Envolver com `AuthProvider`
- Rotas: `/auth` (público), `/acesso-bloqueado` (autenticado), `/` protegido por `ProtectedRoute`

## Detalhes técnicos
- A consulta usa `lower(trim(email))` para normalização
- RLS garante que usuário só vê seu próprio email
- Webhook insere em `compradores` com service_role (bypass RLS)
- Nenhuma coluna de status — existência do registro = acesso

