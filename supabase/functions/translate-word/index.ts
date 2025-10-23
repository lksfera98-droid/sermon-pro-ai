import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { word } = await req.json();
    
    console.log('Traduzindo palavra:', word);

    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    
    if (!openAIApiKey) {
      throw new Error('OPENAI_API_KEY não configurada');
    }

    const prompt = `
Você é um especialista em línguas bíblicas (Hebraico, Grego e Aramaico) e etimologia bíblica.

Palavra/Nome para traduzir: "${word}"

**INSTRUÇÕES CRÍTICAS**: 
- Você DEVE fornecer tradução nas TRÊS línguas (Hebraico, Grego e Aramaico) - TODAS são OBRIGATÓRIAS
- Mesmo que a palavra tenha origem em apenas uma língua, mostre como ela aparece ou é transliterada nas outras
- NUNCA deixe nenhum dos três campos vazios
- A etimologia DEVE ter no mínimo 150 palavras
- A história DEVE ter no mínimo 200 palavras

Forneça as seguintes informações:

1. **Tradução em Hebraico** (OBRIGATÓRIO): Forneça a palavra em caracteres hebraicos com transliteração. Se não há equivalente direto, forneça a transliteração ou termo relacionado.

2. **Tradução em Grego** (OBRIGATÓRIO): Forneça a palavra em caracteres gregos (especialmente do grego koiné do Novo Testamento) com transliteração. Se não há equivalente direto, forneça a transliteração ou termo relacionado.

3. **Tradução em Aramaico** (OBRIGATÓRIO): Forneça a palavra em caracteres aramaicos com transliteração. Se não há equivalente direto, forneça a transliteração ou termo relacionado.

4. **Etimologia** (MÍNIMO 150 PALAVRAS): Explique detalhadamente:
   - As raízes da palavra e seus significados
   - Como a palavra foi formada
   - Evolução da palavra através de diferentes períodos
   - Palavras relacionadas na mesma família linguística
   - Conexões linguísticas entre as línguas

5. **História da Palavra** (MÍNIMO 200 PALAVRAS): Descreva de forma abrangente:
   - Primeiro uso conhecido nos textos bíblicos
   - Como o significado evoluiu ao longo do tempo
   - Significado cultural nos tempos bíblicos
   - Exemplos de uso no Antigo e Novo Testamento
   - Como diferentes autores bíblicos usaram a palavra
   - Entendimento acadêmico moderno

Retorne a resposta em formato JSON com as chaves: hebrew, greek, aramaic, etymology, history.
TODOS os campos são OBRIGATÓRIOS. Forneça conteúdo rico e educacional.

Exemplo de formato:
{
  "hebrew": "אַהֲבָה (ahavah) - forma hebraica",
  "greek": "ἀγάπη (agape) - forma grega",
  "aramaic": "חוּבָּא (khubba) - forma aramaica",
  "etymology": "A palavra 'amor' tem raízes profundas nas línguas semíticas... [continuar com pelo menos 150 palavras]",
  "history": "No contexto bíblico, o conceito de amor evoluiu... [continuar com pelo menos 200 palavras]"
}
`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'Você é um especialista em línguas bíblicas e etimologia. Sempre responda em formato JSON válido.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 2000,
        response_format: { type: "json_object" }
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Erro da OpenAI:', errorData);
      throw new Error(`Erro da OpenAI: ${response.status}`);
    }

    const data = await response.json();
    const translationJson = data.choices[0].message.content;
    const translation = JSON.parse(translationJson);

    console.log('Tradução obtida com sucesso');

    return new Response(
      JSON.stringify(translation),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );

  } catch (error) {
    console.error('Erro ao traduzir palavra:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Erro desconhecido ao traduzir palavra' 
      }),
      { 
        status: 500,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );
  }
});
