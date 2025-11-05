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
    const translateSchema = z.object({
      word: z.string().trim().min(1, "Palavra é obrigatória").max(100, "Palavra muito longa"),
      language: z.enum(['pt', 'en', 'es']).default('pt')
    });

    const rawData = await req.json();
    const validated = translateSchema.parse(rawData);
    const { word, language } = validated;
    
    console.log('Traduzindo palavra:', word, 'idioma:', language);

    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    
    if (!openAIApiKey) {
      throw new Error('OPENAI_API_KEY não configurada');
    }

    const languageInstructions = {
      pt: {
        instruction: 'Responda em PORTUGUÊS BRASILEIRO.',
        example: {
          hebrew: "אַהֲבָה (ahavah) - forma hebraica",
          greek: "ἀγάπη (agape) - forma grega",
          aramaic: "חוּבָּא (khubba) - forma aramaica",
          etymology: "A palavra 'amor' tem raízes profundas nas línguas semíticas... [continuar com pelo menos 150 palavras]",
          history: "No contexto bíblico, o conceito de amor evoluiu... [continuar com pelo menos 200 palavras]"
        }
      },
      en: {
        instruction: 'Respond in ENGLISH.',
        example: {
          hebrew: "אַהֲבָה (ahavah) - Hebrew form",
          greek: "ἀγάπη (agape) - Greek form",
          aramaic: "חוּבָּא (khubba) - Aramaic form",
          etymology: "The word 'love' has deep roots in Semitic languages... [continue with at least 150 words]",
          history: "In the biblical context, the concept of love evolved... [continue with at least 200 words]"
        }
      },
      es: {
        instruction: 'Responda en ESPAÑOL.',
        example: {
          hebrew: "אַהֲבָה (ahavah) - forma hebrea",
          greek: "ἀγάπη (agape) - forma griega",
          aramaic: "חוּבָּא (khubba) - forma aramea",
          etymology: "La palabra 'amor' tiene raíces profundas en las lenguas semíticas... [continuar con al menos 150 palabras]",
          history: "En el contexto bíblico, el concepto de amor evolucionó... [continuar con al menos 200 palabras]"
        }
      }
    };

    const langConfig = languageInstructions[language as keyof typeof languageInstructions] || languageInstructions.pt;

    const prompt = `
You are an expert in biblical languages (Hebrew, Greek, and Aramaic) and biblical etymology.

${langConfig.instruction}

Word/Name to translate: "${word}"

**CRITICAL INSTRUCTIONS**: 
- You MUST provide translation in ALL THREE languages (Hebrew, Greek, and Aramaic) - ALL are MANDATORY
- Even if the word originates in only one language, show how it appears or is transliterated in the others
- NEVER leave any of the three fields empty
- Etymology MUST have at least 150 words
- History MUST have at least 200 words

Provide the following information:

1. **Hebrew Translation** (MANDATORY): Provide the word in Hebrew characters with transliteration. If there's no direct equivalent, provide the transliteration or related term.

2. **Greek Translation** (MANDATORY): Provide the word in Greek characters (especially Koine Greek from the New Testament) with transliteration. If there's no direct equivalent, provide the transliteration or related term.

3. **Aramaic Translation** (MANDATORY): Provide the word in Aramaic characters with transliteration. If there's no direct equivalent, provide the transliteration or related term.

4. **Etymology** (MINIMUM 150 WORDS): Explain in detail:
   - The roots of the word and their meanings
   - How the word was formed
   - Evolution of the word through different periods
   - Related words in the same linguistic family
   - Linguistic connections between languages

5. **Word History** (MINIMUM 200 WORDS): Describe comprehensively:
   - First known use in biblical texts
   - How the meaning evolved over time
   - Cultural significance in biblical times
   - Examples of use in the Old and New Testament
   - How different biblical authors used the word
   - Modern scholarly understanding

Return the response in JSON format with keys: hebrew, greek, aramaic, etymology, history.
ALL fields are MANDATORY. Provide rich and educational content.

Example format:
${JSON.stringify(langConfig.example, null, 2)}
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
