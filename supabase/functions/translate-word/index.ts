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

Forneça as seguintes informações:

1. **Tradução em Hebraico**: Se a palavra tem equivalente ou origem hebraica, forneça a palavra em caracteres hebraicos.

2. **Tradução em Grego**: Se a palavra tem equivalente ou origem grega (especialmente do grego koiné do Novo Testamento), forneça a palavra em caracteres gregos.

3. **Tradução em Aramaico**: Se a palavra tem equivalente ou origem aramaica, forneça a palavra em caracteres aramaicos.

4. **Etimologia**: Explique a origem e formação da palavra, suas raízes linguísticas e significados primários.

5. **História da Palavra**: Descreva como a palavra foi usada ao longo da história bíblica, seu contexto cultural e teológico, e sua evolução de significado.

**IMPORTANTE**: 
- Se a palavra não tem tradução direta em alguma língua, explique isso brevemente nesse campo
- Seja preciso e acadêmico, mas acessível
- Use transliterações quando necessário para clareza
- Retorne a resposta em formato JSON com as chaves: hebrew, greek, aramaic, etymology, history

Exemplo de formato:
{
  "hebrew": "אַהֲבָה (ahavah)",
  "greek": "ἀγάπη (agape)",
  "aramaic": "חוּבָּא (khubba)",
  "etymology": "A palavra 'amor' tem raízes profundas nas línguas semíticas...",
  "history": "No contexto bíblico, o conceito de amor evoluiu..."
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
