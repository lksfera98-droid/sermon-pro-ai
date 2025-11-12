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
    // Input validation schema
    const verseSchema = z.object({
      word: z.string().trim().min(1, "Palavra é obrigatória").max(100, "Palavra muito longa"),
      language: z.enum(['pt', 'en', 'es']).default('pt')
    });

    const rawData = await req.json();
    const validated = verseSchema.parse(rawData);
    const { word, language } = validated;

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY não configurada');
    }

    const promptTemplates = {
      pt: `Você é um especialista bíblico. Encontre e liste O MÁXIMO POSSÍVEL de versículos relevantes da Bíblia sobre "${word}".

INSTRUÇÕES CRÍTICAS:
- Liste PELO MENOS 30-50 versículos variados de TODOS os livros bíblicos possíveis (Antigo e Novo Testamento)
- Quanto mais versículos, melhor! O objetivo é fornecer uma lista COMPLETA e EXAUSTIVA
- Cubra diferentes aspectos e contextos da palavra pesquisada
- NÃO limite a apenas alguns versículos - liste TODOS os versículos importantes

Para cada versículo, forneça EXATAMENTE neste formato (sem texto introdutório):

**[Livro Capítulo:Versículo]**
"[Texto completo do versículo]"
*Explicação:* [Breve explicação - 1-2 frases]

Separe cada versículo com uma linha em branco.
Organize começando com Antigo Testamento, depois Novo Testamento.
NÃO inclua frases como "Com certeza!" ou "Aqui estão X versículos" - vá direto aos versículos.`,
      
      en: `You are a biblical expert. Find and list AS MANY relevant Bible verses as possible about "${word}".

CRITICAL INSTRUCTIONS:
- List AT LEAST 30-50 varied verses from ALL possible biblical books (Old and New Testament)
- The more verses, the better! The goal is to provide a COMPLETE and EXHAUSTIVE list
- Cover different aspects and contexts of the searched word
- DO NOT limit to just a few verses - list ALL important verses

For each verse, provide in EXACTLY this format (without introductory text):

**[Book Chapter:Verse]**
"[Full text of the verse]"
*Explanation:* [Brief explanation - 1-2 sentences]

Separate each verse with a blank line.
Organize starting with Old Testament, then New Testament.
DO NOT include phrases like "Certainly!" or "Here are X verses" - go straight to the verses.`,
      
      es: `Eres un experto bíblico. Encuentra y enumera EL MÁXIMO POSIBLE de versículos relevantes de la Biblia sobre "${word}".

INSTRUCCIONES CRÍTICAS:
- Enumera AL MENOS 30-50 versículos variados de TODOS los libros bíblicos posibles (Antiguo y Nuevo Testamento)
- ¡Cuantos más versículos, mejor! El objetivo es proporcionar una lista COMPLETA y EXHAUSTIVA
- Cubre diferentes aspectos y contextos de la palabra buscada
- NO te limites a solo algunos versículos - enumera TODOS los versículos importantes

Para cada versículo, proporciona EXACTAMENTE en este formato (sin texto introductorio):

**[Libro Capítulo:Versículo]**
"[Texto completo del versículo]"
*Explicación:* [Breve explicación - 1-2 frases]

Separa cada versículo con una línea en blanco.
Organiza comenzando con Antiguo Testamento, luego Nuevo Testamento.
NO incluyas frases como "¡Por supuesto!" o "Aquí están X versículos" - ve directo a los versículos.`
    };

    const systemMessages = {
      pt: 'Você é um especialista em estudos bíblicos. Forneça o máximo de versículos possíveis sem textos introdutórios.',
      en: 'You are a Bible study expert. Provide as many verses as possible without introductory text.',
      es: 'Eres un experto en estudios bíblicos. Proporciona el máximo de versículos posibles sin textos introductorios.'
    };

    const prompt = promptTemplates[language as keyof typeof promptTemplates] || promptTemplates.pt;
    const systemMessage = systemMessages[language as keyof typeof systemMessages] || systemMessages.pt;

    console.log('Pesquisando versículos para:', word, 'em', language);

    let response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemMessage },
          { role: 'user', content: prompt }
        ],
      }),
    });

    let verses = "";
    
    // Check if Lovable AI failed with 402 or 429 - use OpenAI fallback
    if (!response.ok && (response.status === 402 || response.status === 429)) {
      console.log(`Lovable AI returned ${response.status}, using OpenAI fallback...`);
      
      const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
      if (!OPENAI_API_KEY) {
        throw new Error(response.status === 429 ? "Rate limits exceeded, please try again later." : "Payment required, please add funds to your Lovable AI workspace.");
      }

      const openaiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
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

      if (!openaiResponse.ok) {
        throw new Error(`OpenAI fallback error: ${openaiResponse.status}`);
      }

      const openaiData = await openaiResponse.json();
      verses = openaiData.choices[0].message.content;
      console.log("Using OpenAI fallback response");
    } else if (!response.ok) {
      const errorText = await response.text();
      console.error('Erro na API:', response.status, errorText);
      throw new Error(`Erro na API: ${response.status}`);
    } else {
      const data = await response.json();
      verses = data.choices[0].message.content;
    }

    console.log('Versículos encontrados com sucesso');

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
