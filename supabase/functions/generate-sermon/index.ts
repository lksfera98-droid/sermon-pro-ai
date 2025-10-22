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
    const { tema, versiculo = '', tempo } = await req.json();
    
    console.log('Gerando sermão com:', { tema, versiculo, tempo });

    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    
    if (!openAIApiKey) {
      throw new Error('OPENAI_API_KEY não configurada');
    }

    // Determine the level of detail based on sermon duration
    let detailLevel = "básico";
    let numberOfPoints = 3;
    let additionalInstructions = "";
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

    const prompt = `
Você é SermonPro, um assistente especializado em criar sermões bíblicos completos e estruturados para pregadores cristãos.

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
            content: 'Você é SermonPro, um assistente especializado em gerar sermões bíblicos completos, estruturados e inspiradores para pregadores cristãos.'
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
