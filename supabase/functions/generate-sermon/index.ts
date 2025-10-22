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
    const { tema, versiculo = '', tempo, language = 'pt' } = await req.json();
    
    console.log('Gerando sermão com:', { tema, versiculo, tempo, language });

    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    
    if (!openAIApiKey) {
      throw new Error('OPENAI_API_KEY não configurada');
    }

    // Language-specific system instructions
    const languageSystemMessages = {
      pt: 'Você é SermonPro, um assistente especializado em criar sermões bíblicos completos e estruturados para pregadores cristãos.',
      en: 'You are SermonPro, an assistant specialized in creating complete and structured biblical sermons for Christian preachers.',
      es: 'Eres SermonPro, un asistente especializado en crear sermones bíblicos completos y estructurados para predicadores cristianos.'
    };

    // Language-specific detail levels
    const detailLevelTexts = {
      pt: {
        short: "conciso",
        medium: "moderado",
        long: "detalhado",
        veryLong: "muito detalhado"
      },
      en: {
        short: "concise",
        medium: "moderate",
        long: "detailed",
        veryLong: "very detailed"
      },
      es: {
        short: "conciso",
        medium: "moderado",
        long: "detallado",
        veryLong: "muy detallado"
      }
    };

    // Language-specific instructions
    const additionalInstructionsTexts = {
      pt: {
        short: "Mantenha as explicações objetivas e diretas.",
        medium: "Inclua explicações teológicas e aplicações práticas.",
        long: "Inclua explicações teológicas aprofundadas, múltiplas ilustrações e aplicações práticas detalhadas.",
        veryLong: "Crie um sermão EXTENSO e PROFUNDO com análise exegética completa, múltiplas ilustrações, contexto histórico-cultural, aplicações práticas detalhadas para diferentes grupos (jovens, adultos, idosos), e sub-pontos para cada ponto principal."
      },
      en: {
        short: "Keep explanations objective and direct.",
        medium: "Include theological explanations and practical applications.",
        long: "Include deep theological explanations, multiple illustrations, and detailed practical applications.",
        veryLong: "Create an EXTENSIVE and DEEP sermon with complete exegetical analysis, multiple illustrations, historical-cultural context, detailed practical applications for different groups (youth, adults, elderly), and sub-points for each main point."
      },
      es: {
        short: "Mantén las explicaciones objetivas y directas.",
        medium: "Incluye explicaciones teológicas y aplicaciones prácticas.",
        long: "Incluye explicaciones teológicas profundas, múltiples ilustraciones y aplicaciones prácticas detalladas.",
        veryLong: "Crea un sermón EXTENSO y PROFUNDO con análisis exegético completo, múltiples ilustraciones, contexto histórico-cultural, aplicaciones prácticas detalladas para diferentes grupos (jóvenes, adultos, ancianos), y sub-puntos para cada punto principal."
      }
    };

    const lang = language as 'pt' | 'en' | 'es';
    const systemMessage = languageSystemMessages[lang] || languageSystemMessages.pt;
    const detailTexts = detailLevelTexts[lang] || detailLevelTexts.pt;
    const instructionTexts = additionalInstructionsTexts[lang] || additionalInstructionsTexts.pt;

    // Determine the level of detail based on sermon duration
    let detailLevel = detailTexts.short;
    let numberOfPoints = 3;
    let additionalInstructions = instructionTexts.short;
    let maxTokens = 2000;
    
    if (tempo <= 20) {
      detailLevel = detailTexts.short;
      numberOfPoints = 3;
      additionalInstructions = instructionTexts.short;
      maxTokens = 1500;
    } else if (tempo <= 40) {
      detailLevel = detailTexts.medium;
      numberOfPoints = 3;
      additionalInstructions = instructionTexts.medium;
      maxTokens = 2500;
    } else if (tempo <= 60) {
      detailLevel = detailTexts.long;
      numberOfPoints = 4;
      additionalInstructions = instructionTexts.long;
      maxTokens = 3500;
    } else {
      detailLevel = detailTexts.veryLong;
      numberOfPoints = 5;
      additionalInstructions = instructionTexts.veryLong;
      maxTokens = 4000;
    }

    const prompt = `
${systemMessage}

### DADOS DO SERMÃO:
- Tema: ${tema}
- Versículo base: ${versiculo || 'Escolha um versículo apropriado'}
- Tempo de pregação: ${tempo} minutos
- Nível de detalhe: ${detailLevel}

### INSTRUÇÕES:
${additionalInstructions}

### FORMATO DE SAÍDA OBRIGATÓRIO:

TÍTULO DO SERMÃO (em maiúsculas e negrito)

**Texto Base:** [Citação bíblica completa entre aspas]

**INTRODUÇÃO**
${tempo > 40 ? '[2-3 parágrafos com contextualização histórica e cultural]' : '[1-2 parágrafos de contextualização]'}
${tempo > 60 ? '- Inclua uma segunda ilustração impactante' : ''}

**DESENVOLVIMENTO**

${Array.from({ length: numberOfPoints }, (_, i) => `
**${i + 1}. [Título do Ponto Principal em Negrito]**
   - Explicação ${tempo > 40 ? 'teológica e exegética' : 'bíblica clara'}
   - ${tempo > 60 ? '3-4' : tempo > 40 ? '2-3' : '1-2'} citações bíblicas entre "aspas"
   - Aplicação prática ${tempo > 60 ? 'para diferentes públicos' : ''}
   - ${tempo > 40 ? '2 ilustrações ou exemplos' : '1 ilustração'}
   ${tempo > 60 ? '- Sub-pontos para aprofundar' : ''}
`).join('\n')}

**CONCLUSÃO**
[Recapitulação dos pontos principais]
${tempo > 40 ? '[Apelo específico e personalizado]' : '[Apelo ou desafio]'}
${tempo > 60 ? '[Ilustração final impactante]' : ''}
[Mensagem de esperança]

**ORAÇÃO FINAL**
[${tempo > 40 ? 'Oração detalhada e temática' : 'Oração relacionada ao tema'}]

### REGRAS DE FORMATAÇÃO:
- Use **negrito** para todos os títulos de seções e pontos principais
- Coloque TODAS as citações bíblicas entre "aspas"
- Destaque palavras-chave importantes com **negrito**
- Mantenha parágrafos ${tempo > 60 ? 'bem desenvolvidos mas organizados' : 'curtos e objetivos'}
- Seja profundo, inspirador e prático
- O sermão deve tocar o coração e transformar vidas

Gere o sermão completo agora seguindo EXATAMENTE este formato.
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
            content: systemMessage
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: maxTokens
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Erro da OpenAI:', errorData);
      throw new Error(`Erro da OpenAI: ${response.status}`);
    }

    const data = await response.json();
    const sermao = data.choices[0].message.content;

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
