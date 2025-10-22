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
    const { word, language = 'pt' } = await req.json();
    
    if (!word) {
      throw new Error('Palavra não fornecida');
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY não configurada');
    }

    const promptTemplates = {
      pt: `Você é um especialista em Bíblia Sagrada. Pesquise e forneça os melhores versículos bíblicos relacionados à palavra: "${word}".

Forneça:
1. 5-8 versículos mais relevantes sobre este tema
2. Para cada versículo, inclua a referência completa (Livro capítulo:versículo)
3. O texto completo do versículo
4. Uma breve explicação (1-2 frases) de como esse versículo se relaciona com a palavra

Organize a resposta de forma clara e estruturada.`,
      en: `You are a Bible expert. Search and provide the best Bible verses related to the word: "${word}".

Provide:
1. 5-8 most relevant verses about this topic
2. For each verse, include the complete reference (Book chapter:verse)
3. The full text of the verse
4. A brief explanation (1-2 sentences) of how this verse relates to the word

Organize the response in a clear and structured way.`,
      es: `Eres un experto en la Biblia. Busca y proporciona los mejores versículos bíblicos relacionados con la palabra: "${word}".

Proporciona:
1. 5-8 versículos más relevantes sobre este tema
2. Para cada versículo, incluye la referencia completa (Libro capítulo:versículo)
3. El texto completo del versículo
4. Una breve explicación (1-2 oraciones) de cómo este versículo se relaciona con la palabra

Organiza la respuesta de forma clara y estructurada.`
    };

    const systemMessages = {
      pt: 'Você é um especialista em estudos bíblicos com profundo conhecimento das Escrituras Sagradas em português.',
      en: 'You are a Bible study expert with deep knowledge of the Holy Scriptures in English.',
      es: 'Eres un experto en estudios bíblicos con profundo conocimiento de las Sagradas Escrituras en español.'
    };

    const prompt = promptTemplates[language as keyof typeof promptTemplates] || promptTemplates.pt;
    const systemMessage = systemMessages[language as keyof typeof systemMessages] || systemMessages.pt;

    console.log('Pesquisando versículos para:', word, 'em', language);

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
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

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Erro na API:', response.status, errorText);
      throw new Error(`Erro na API: ${response.status}`);
    }

    const data = await response.json();
    const verses = data.choices[0].message.content;

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
