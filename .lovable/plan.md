

## Problemas Identificados

### 1. Classes CSS aparecendo no texto dos sermoes/estudos
A screenshot mostra textos como `text-primary font-bold text-lg bg-primary/10 px-1 rounded>grâce` no meio do conteudo. A IA esta gerando HTML com classes Tailwind no texto. A limpeza no backend e frontend nao remove esses artefatos.

**Correcao:**
- **`supabase/functions/bible-study/index.ts`**: Adicionar regex para limpar qualquer tag HTML com atributos (ex: `<span class="text-primary...">`) e formatacao markdown residual do conteudo antes de retornar.
- **`supabase/functions/generate-sermon/index.ts`**: Mesma limpeza robusta.
- **`src/components/BibleStudy.tsx` (formatStudyText)**: Adicionar limpeza de classes CSS e tags HTML residuais no texto antes de renderizar.
- **`src/components/SermonDisplay.tsx` (formatSermon)**: Reforcar a regex de limpeza para capturar tags com atributos class.

Regex adicional: `/<[^>]*class="[^"]*"[^>]*>/gi` e `/<\/?[a-z][a-z0-9]*[^>]*>/gi`

### 2. Scroll balancando no celular
O `style={{ WebkitOverflowScrolling: 'touch' }}` causa o efeito elastico (bounce) no iOS/Android.

**Correcao em `src/pages/Index.tsx`:**
- Remover `WebkitOverflowScrolling: 'touch'`
- Adicionar `touch-action: pan-y` no container de scroll
- Manter `overscroll-contain` e adicionar `overscroll-behavior: contain` via style

### 3. Reordenar menu
**Correcao em `src/components/MainMenu.tsx`** - nova ordem do array `menuItems`:
1. Crie seu novo sermao (`new-sermon`)
2. Seus Sermoes Criados (`my-sermons`)
3. Esmiucar um versiculo (`bible-study`)
4. Gerar Meu Devocional Diario (`daily-devotional`)
5. Significado de Nomes Biblicos (`translator`)
6. Pesquisar Versiculos (`verse-search`)
7. Fazer um Pedido de Oracao (`prayer-requests`)
8. Pedidos de Oracao Feitos (`prayer-gallery`)
9. Ouvir Deus Falar Comigo (`hear-god-speak`)
10. Sermoes criados pelos irmaos (`public-gallery`)

### 4. Bonus: Remover idiomas en/es restantes no BibleStudy.tsx
O componente ainda tem condicionais `language === "en"` e `language === "es"`. Serao removidos, mantendo apenas portugues.

### Resumo de arquivos

| Arquivo | Mudanca |
|---------|---------|
| `supabase/functions/bible-study/index.ts` | Limpeza de HTML/CSS do conteudo gerado |
| `supabase/functions/generate-sermon/index.ts` | Reforcar limpeza de HTML/CSS |
| `src/components/BibleStudy.tsx` | Limpeza no formatStudyText + remover en/es |
| `src/components/SermonDisplay.tsx` | Reforcar limpeza no formatSermon |
| `src/components/MainMenu.tsx` | Reordenar menuItems |
| `src/pages/Index.tsx` | Corrigir scroll bounce no mobile |

