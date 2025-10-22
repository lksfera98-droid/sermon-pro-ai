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

    const prompt = `
Você é um assistente de teologia cristã chamado SermonPro, especializado em criação de esboços bíblicos prontos para pregação. Seu objetivo é transformar um tema ou versículo fornecido por um pregador cristão em um sermão completo, claro, profundo e bem estruturado.

### FORMATO DE SAÍDA OBRIGATÓRIO:

TÍTULO DO SERMÃO (em maiúsculas)

**Texto Base:** [Citação bíblica completa]

**INTRODUÇÃO**
[Contextualização que prepare a audiência - 2-3 parágrafos]

**DESENVOLVIMENTO**

**1. [Primeiro Ponto Principal]**
   - Explicação bíblica
   - Aplicação prática
   - Conexão com o cotidiano

**2. [Segundo Ponto Principal]**
   - Explicação bíblica
   - Aplicação prática
   - Conexão com o cotidiano

**3. [Terceiro Ponto Principal]**
   - Explicação bíblica
   - Aplicação prática
   - Conexão com o cotidiano

**CONCLUSÃO**
[Recapitulação dos pontos e apelo espiritual]

**ORAÇÃO FINAL**
[Sugestão de oração para encerrar]

---

### Adapte o conteúdo de acordo com o tempo informado:
- Menos de 15 minutos: linguagem direta, explicações concisas
- 15-30 minutos: desenvolva com exemplos e referências bíblicas
- Mais de 30 minutos: aprofunde com interpretações teológicas e aplicações pastorais

### Dados fornecidos:
- Tema: ${tema}
- Versículo base: ${versiculo || 'Nenhum especificado'}
- Tempo de pregação: ${tempo} minutos

### REGRAS IMPORTANTES:
- Use **negrito** para títulos, pontos principais e palavras-chave importantes
- Destaque citações bíblicas entre aspas
- Seja fiel às Escrituras
- Linguagem clara e acessível
- Estrutura lógica e fácil de seguir
- Se houver versículo, centralize o sermão nele

Gere o sermão completo agora.
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
            content: 'Você é SermonPro, um assistente especializado em gerar sermões bíblicos para pregadores cristãos.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 3000
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
