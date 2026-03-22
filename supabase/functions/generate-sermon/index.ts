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
    const sermonSchema = z.object({
      tema: z.string().trim().min(1, "Tema é obrigatório").max(200, "Tema muito longo"),
      versiculo: z.string().trim().max(100, "Versículo muito longo").optional().default(''),
      tempo: z.number().int().min(10, "Tempo mínimo: 10 minutos").max(120, "Tempo máximo: 120 minutos"),
      language: z.string().optional().default('pt')
    });

    const rawData = await req.json();
    const validated = sermonSchema.parse(rawData);
    const { tema, versiculo, tempo } = validated;
    
    console.log('Gerando sermão com:', { tema, versiculo, tempo });

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY não configurada');
    }

    // Determine the level of detail based on sermon duration
    let detailLevel = "conciso";
    let numberOfPoints = 3;
    let additionalInstructions = "Mantenha as explicações objetivas e diretas.";
    let maxTokens = 2000;
    
    if (tempo <= 20) {
      detailLevel = "conciso";
      numberOfPoints = 3;
      additionalInstructions = "Mantenha as explicações objetivas e diretas.";
      maxTokens = 1500;
    } else if (tempo <= 40) {
      detailLevel = "moderado";
      numberOfPoints = 3;
      additionalInstructions = "Inclua explicações teológicas e aplicações práticas.";
      maxTokens = 2500;
    } else if (tempo <= 60) {
      detailLevel = "detalhado";
      numberOfPoints = 4;
      additionalInstructions = "Inclua explicações teológicas aprofundadas, múltiplas ilustrações e aplicações práticas detalhadas.";
      maxTokens = 3500;
    } else {
      detailLevel = "muito detalhado";
      numberOfPoints = 5;
      additionalInstructions = "Crie um sermão EXTENSO e PROFUNDO com análise exegética completa, múltiplas ilustrações, contexto histórico-cultural, aplicações práticas detalhadas para diferentes grupos (jovens, adultos, idosos), e sub-pontos para cada ponto principal.";
      maxTokens = 4000;
    }

    const prompt = `Você é um assistente especializado em criar sermões bíblicos completos e estruturados para pregadores cristãos.

DADOS DO SERMÃO:
- Tema: ${tema}
- Versículo base: ${versiculo || 'Escolha um versículo apropriado'}
- Tempo de pregação: ${tempo} minutos
- Nível de detalhe: ${detailLevel}

INSTRUÇÕES:
${additionalInstructions}

FORMATO OBRIGATÓRIO DO SERMÃO:

Escreva o título do sermão em maiúsculas no início.

Em seguida, escreva "Texto Base:" seguido da citação bíblica completa.

INTRODUÇÃO
Escreva ${tempo > 40 ? '2-3 parágrafos com contextualização histórica e cultural' : '1-2 parágrafos de contextualização'}.
${tempo > 60 ? 'Inclua uma segunda ilustração impactante.' : ''}

DESENVOLVIMENTO

${Array.from({ length: numberOfPoints }, (_, i) => `
${i + 1}. Escreva o título do ponto ${i + 1} aqui
   - Explicação ${tempo > 40 ? 'teológica e exegética' : 'bíblica clara'}
   - ${tempo > 60 ? '3-4' : tempo > 40 ? '2-3' : '1-2'} citações bíblicas relevantes
   - Aplicação prática ${tempo > 60 ? 'para diferentes públicos' : ''}
   - ${tempo > 40 ? '2' : '1'} ilustrações ou exemplos
   ${tempo > 60 ? '- Sub-pontos para aprofundar' : ''}
`).join('\n')}

CONCLUSÃO
- Recapitulação dos pontos principais
- ${tempo > 40 ? 'Apelo específico e personalizado' : 'Apelo ou desafio'}
${tempo > 60 ? '- Ilustração final impactante' : ''}
- Mensagem de esperança

ORAÇÃO FINAL
Escreva uma ${tempo > 40 ? 'oração detalhada e temática' : 'oração relacionada ao tema'}.

REGRAS IMPORTANTES:
1. NÃO use asteriscos ou símbolos de formatação como ** ou *
2. NÃO escreva instruções de formatação no texto (como "negrito", "itálico", etc.)
3. Escreva o conteúdo de forma natural e limpa
4. Use aspas normais para citações bíblicas
5. Seja profundo, inspirador e prático
6. O sermão deve tocar o coração e transformar vidas
7. Escreva TUDO em português brasileiro

Gere o sermão completo agora.`;

    const systemMessage = 'Você é SermonPro, um assistente especializado em criar sermões bíblicos completos e estruturados para pregadores cristãos. Escreva sempre em português brasileiro de forma clara e natural, sem usar formatação markdown como asteriscos ou símbolos especiais.';

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

    let sermao = "";

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
          temperature: 0.7,
          max_tokens: maxTokens,
        }),
      });

      if (!openaiResponse.ok) {
        throw new Error(`OpenAI fallback error: ${openaiResponse.status}`);
      }

      const openaiData = await openaiResponse.json();
      sermao = openaiData.choices[0].message.content;
      console.log("Using OpenAI fallback response");
    } else if (!response.ok) {
      const errorData = await response.text();
      console.error('Erro da API:', response.status, errorData);
      throw new Error(`Erro da API: ${response.status}`);
    } else {
      const data = await response.json();
      sermao = data.choices[0].message.content;
    }

    // Limpar qualquer formatação markdown residual
    sermao = sermao
      .replace(/\*\*/g, '')
      .replace(/\*/g, '')
      .replace(/#{1,6}\s/g, '')
      .replace(/`/g, '')
      .replace(/\[|\]/g, '')
      .trim();

    console.log('Sermão gerado com sucesso');

    return new Response(
      JSON.stringify({ sermao }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );

  } catch (error) {
    console.error('Erro ao gerar sermão:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Erro desconhecido ao gerar sermão' 
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