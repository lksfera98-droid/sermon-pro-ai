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
      language: z.enum(['pt', 'en', 'es']).default('pt')
    });

    const rawData = await req.json();
    const validated = sermonSchema.parse(rawData);
    const { tema, versiculo, tempo, language } = validated;
    
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

    // Language-specific prompts
    const promptTemplates = {
      pt: {
        data: "### DADOS DO SERMÃO:",
        theme: "- Tema:",
        verse: "- Versículo base:",
        chooseVerse: "Escolha um versículo apropriado",
        time: "- Tempo de pregação:",
        minutes: "minutos",
        detailLevel: "- Nível de detalhe:",
        instructions: "### INSTRUÇÕES:",
        format: "### FORMATO DE SAÍDA OBRIGATÓRIO:",
        title: "TÍTULO DO SERMÃO (em maiúsculas e negrito)",
        baseText: "**Texto Base:**",
        bibleCitation: "[Citação bíblica completa entre aspas]",
        introduction: "**INTRODUÇÃO**",
        contextShort: "[1-2 parágrafos de contextualização]",
        contextLong: "[2-3 parágrafos com contextualização histórica e cultural]",
        secondIllustration: "- Inclua uma segunda ilustração impactante",
        development: "**DESENVOLVIMENTO**",
        mainPoint: "[Título do Ponto Principal em Negrito]",
        explanation: "- Explicação",
        clearBiblical: "bíblica clara",
        theological: "teológica e exegética",
        biblicalQuotes: "citações bíblicas entre \"aspas\"",
        practicalApp: "- Aplicação prática",
        forDifferent: "para diferentes públicos",
        illustrations: "ilustrações ou exemplos",
        subPoints: "- Sub-pontos para aprofundar",
        conclusion: "**CONCLUSÃO**",
        recap: "[Recapitulação dos pontos principais]",
        appeal: "[Apelo ou desafio]",
        specificAppeal: "[Apelo específico e personalizado]",
        finalIllustration: "[Ilustração final impactante]",
        hopeMessage: "[Mensagem de esperança]",
        finalPrayer: "**ORAÇÃO FINAL**",
        themedPrayer: "Oração detalhada e temática",
        relatedPrayer: "Oração relacionada ao tema",
        formatRules: "### REGRAS DE FORMATAÇÃO:",
        useBold: "- Use **negrito** para todos os títulos de seções e pontos principais",
        allQuotes: "- Coloque TODAS as citações bíblicas entre \"aspas\"",
        highlightKeys: "- Destaque palavras-chave importantes com **negrito**",
        keepParagraphs: "- Mantenha parágrafos",
        organized: "bem desenvolvidos mas organizados",
        shortObjective: "curtos e objetivos",
        beDeep: "- Seja profundo, inspirador e prático",
        touchHeart: "- O sermão deve tocar o coração e transformar vidas",
        generate: "Gere o sermão completo agora seguindo EXATAMENTE este formato."
      },
      en: {
        data: "### SERMON DATA:",
        theme: "- Theme:",
        verse: "- Base verse:",
        chooseVerse: "Choose an appropriate verse",
        time: "- Preaching time:",
        minutes: "minutes",
        detailLevel: "- Detail level:",
        instructions: "### INSTRUCTIONS:",
        format: "### REQUIRED OUTPUT FORMAT:",
        title: "SERMON TITLE (in capital letters and bold)",
        baseText: "**Base Text:**",
        bibleCitation: "[Complete biblical citation in quotes]",
        introduction: "**INTRODUCTION**",
        contextShort: "[1-2 contextualization paragraphs]",
        contextLong: "[2-3 paragraphs with historical and cultural contextualization]",
        secondIllustration: "- Include a second impactful illustration",
        development: "**DEVELOPMENT**",
        mainPoint: "[Main Point Title in Bold]",
        explanation: "- Explanation",
        clearBiblical: "clear biblical",
        theological: "theological and exegetical",
        biblicalQuotes: "biblical quotes in \"quotes\"",
        practicalApp: "- Practical application",
        forDifferent: "for different audiences",
        illustrations: "illustrations or examples",
        subPoints: "- Sub-points to deepen",
        conclusion: "**CONCLUSION**",
        recap: "[Recap of main points]",
        appeal: "[Appeal or challenge]",
        specificAppeal: "[Specific and personalized appeal]",
        finalIllustration: "[Final impactful illustration]",
        hopeMessage: "[Message of hope]",
        finalPrayer: "**FINAL PRAYER**",
        themedPrayer: "Detailed and thematic prayer",
        relatedPrayer: "Prayer related to the theme",
        formatRules: "### FORMATTING RULES:",
        useBold: "- Use **bold** for all section titles and main points",
        allQuotes: "- Put ALL biblical quotes in \"quotes\"",
        highlightKeys: "- Highlight important keywords with **bold**",
        keepParagraphs: "- Keep paragraphs",
        organized: "well developed but organized",
        shortObjective: "short and objective",
        beDeep: "- Be deep, inspiring and practical",
        touchHeart: "- The sermon should touch hearts and transform lives",
        generate: "Generate the complete sermon now following EXACTLY this format."
      },
      es: {
        data: "### DATOS DEL SERMÓN:",
        theme: "- Tema:",
        verse: "- Versículo base:",
        chooseVerse: "Elija un versículo apropiado",
        time: "- Tiempo de predicación:",
        minutes: "minutos",
        detailLevel: "- Nivel de detalle:",
        instructions: "### INSTRUCCIONES:",
        format: "### FORMATO DE SALIDA OBLIGATORIO:",
        title: "TÍTULO DEL SERMÓN (en mayúsculas y negrita)",
        baseText: "**Texto Base:**",
        bibleCitation: "[Cita bíblica completa entre comillas]",
        introduction: "**INTRODUCCIÓN**",
        contextShort: "[1-2 párrafos de contextualización]",
        contextLong: "[2-3 párrafos con contextualización histórica y cultural]",
        secondIllustration: "- Incluya una segunda ilustración impactante",
        development: "**DESARROLLO**",
        mainPoint: "[Título del Punto Principal en Negrita]",
        explanation: "- Explicación",
        clearBiblical: "bíblica clara",
        theological: "teológica y exegética",
        biblicalQuotes: "citas bíblicas entre \"comillas\"",
        practicalApp: "- Aplicación práctica",
        forDifferent: "para diferentes públicos",
        illustrations: "ilustraciones o ejemplos",
        subPoints: "- Sub-puntos para profundizar",
        conclusion: "**CONCLUSIÓN**",
        recap: "[Recapitulación de los puntos principales]",
        appeal: "[Apelación o desafío]",
        specificAppeal: "[Apelación específica y personalizada]",
        finalIllustration: "[Ilustración final impactante]",
        hopeMessage: "[Mensaje de esperanza]",
        finalPrayer: "**ORACIÓN FINAL**",
        themedPrayer: "Oración detallada y temática",
        relatedPrayer: "Oración relacionada con el tema",
        formatRules: "### REGLAS DE FORMATO:",
        useBold: "- Use **negrita** para todos los títulos de secciones y puntos principales",
        allQuotes: "- Coloque TODAS las citas bíblicas entre \"comillas\"",
        highlightKeys: "- Destaque palabras clave importantes con **negrita**",
        keepParagraphs: "- Mantenga párrafos",
        organized: "bien desarrollados pero organizados",
        shortObjective: "cortos y objetivos",
        beDeep: "- Sea profundo, inspirador y práctico",
        touchHeart: "- El sermón debe tocar el corazón y transformar vidas",
        generate: "Genere el sermón completo ahora siguiendo EXACTAMENTE este formato."
      }
    };

    const template = promptTemplates[lang] || promptTemplates.pt;

    const prompt = `
${systemMessage}

${template.data}
${template.theme} ${tema}
${template.verse} ${versiculo || template.chooseVerse}
${template.time} ${tempo} ${template.minutes}
${template.detailLevel} ${detailLevel}

${template.instructions}
${additionalInstructions}

${template.format}

${template.title}

${template.baseText} ${template.bibleCitation}

${template.introduction}
${tempo > 40 ? template.contextLong : template.contextShort}
${tempo > 60 ? template.secondIllustration : ''}

${template.development}

${Array.from({ length: numberOfPoints }, (_, i) => `
**${i + 1}. ${template.mainPoint}**
   ${template.explanation} ${tempo > 40 ? template.theological : template.clearBiblical}
   - ${tempo > 60 ? '3-4' : tempo > 40 ? '2-3' : '1-2'} ${template.biblicalQuotes}
   ${template.practicalApp} ${tempo > 60 ? template.forDifferent : ''}
   - ${tempo > 40 ? '2' : '1'} ${template.illustrations}
   ${tempo > 60 ? template.subPoints : ''}
`).join('\n')}

${template.conclusion}
${template.recap}
${tempo > 40 ? template.specificAppeal : template.appeal}
${tempo > 60 ? template.finalIllustration : ''}
${template.hopeMessage}

${template.finalPrayer}
[${tempo > 40 ? template.themedPrayer : template.relatedPrayer}]

${template.formatRules}
${template.useBold}
${template.allQuotes}
${template.highlightKeys}
${template.keepParagraphs} ${tempo > 60 ? template.organized : template.shortObjective}
${template.beDeep}
${template.touchHeart}

${template.generate}

IMPORTANT: Generate the ENTIRE sermon in ${lang === 'pt' ? 'Portuguese (Português)' : lang === 'en' ? 'English' : 'Spanish (Español)'} language. All content, explanations, and text must be in ${lang === 'pt' ? 'Portuguese' : lang === 'en' ? 'English' : 'Spanish'}.
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
