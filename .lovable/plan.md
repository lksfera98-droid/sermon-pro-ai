

## Problema

A função `generate-sermon` chama a API da OpenAI diretamente com uma chave inválida (erro 401). As outras funções do app (como `hear-god-speak`) já foram migradas para usar o Lovable AI Gateway, mas `generate-sermon` ficou para trás.

## Solução

Migrar `generate-sermon` para usar o Lovable AI Gateway (que tem `LOVABLE_API_KEY` já configurada) como provedor principal, com fallback para OpenAI caso retorne 402/429.

### Arquivo alterado

**`supabase/functions/generate-sermon/index.ts`**

- Trocar a chamada de `https://api.openai.com/v1/chat/completions` para `https://ai.gateway.lovable.dev/v1/chat/completions`
- Usar `LOVABLE_API_KEY` como autenticacao principal
- Manter fallback para OpenAI (`OPENAI_API_KEY`) em caso de erro 402/429
- Usar modelo `google/gemini-2.5-flash` (principal) e `gpt-4o-mini` (fallback)
- Manter toda a logica de prompt, limpeza de markdown e validacao existente

