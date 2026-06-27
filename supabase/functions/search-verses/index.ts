import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const verseSchema = z.object({
      word: z.string().trim().min(1, "Palavra é obrigatória").max(100, "Palavra muito longa")
    });

    const rawData = await req.json();
    const { word } = verseSchema.parse(rawData);

    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    if (!OPENAI_API_KEY) throw new Error('OPENAI_API_KEY não configurada');

    const prompt = `Você é um especialista bíblico. Encontre e liste O MÁXIMO POSSÍVEL de versículos relevantes da Bíblia sobre "${word}".

INSTRUÇÕES CRÍTICAS:
- Liste PELO MENOS 30-50 versículos variados de TODOS os livros bíblicos possíveis (Antigo e Novo Testamento)
- Quanto mais versículos, melhor!
- Cubra diferentes aspectos e contextos da palavra pesquisada

Para cada versículo, forneça EXATAMENTE neste formato (sem texto introdutório):

**[Livro Capítulo:Versículo]**
"[Texto completo do versículo]"
*Explicação:* [Breve explicação - 1-2 frases]

Separe cada versículo com uma linha em branco.
Organize começando com Antigo Testamento, depois Novo Testamento.
NÃO inclua frases como "Com certeza!" ou "Aqui estão X versículos" - vá direto aos versículos.`;

    const systemMessage = 'Você é um especialista em estudos bíblicos. Forneça o máximo de versículos possíveis sem textos introdutórios. Sempre responda em português.';

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: 'system', content: systemMessage },
          { role: 'user', content: prompt }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI error:', response.status, errorText);
      throw new Error(`OpenAI error: ${response.status}`);
    }

    const data = await response.json();
    const verses = data.choices[0].message.content;

    return new Response(JSON.stringify({ verses }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Erro ao pesquisar versículos:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
