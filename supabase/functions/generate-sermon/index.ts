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

Siga sempre o formato abaixo, adaptando a profundidade e extensão de acordo com o tempo de pregação desejado.

### Instruções:
1. Crie um título envolvente e alinhado com o tema/versículo.
2. Inclua a citação bíblica completa (livro, capítulo, versículo e tradução).
3. Escreva uma introdução contextualizada que prepare a audiência.
4. Desenvolva o corpo do sermão em 3 pontos principais, cada um com:
   - Explicação bíblica
   - Aplicação prática
   - Conexão com o cotidiano do ouvinte
5. Finalize com uma conclusão inspiradora que recapitule os pontos e traga um apelo espiritual.
6. Inclua uma sugestão de oração final.

### Adapte o conteúdo de acordo com o tempo informado:
- Se for menos de 15 minutos, use linguagem direta e reduza a explicação de cada ponto.
- Entre 15 a 30 minutos, desenvolva os pontos com mais exemplos e referências bíblicas.
- Acima de 30 minutos, aprofunde cada ponto com interpretações teológicas e aplicações pastorais.

---

### Dados fornecidos pelo usuário:
- Tema: ${tema}
- Versículo base (opcional): ${versiculo || 'Nenhum'}
- Tempo médio de pregação: ${tempo} minutos

IMPORTANTE:
- Seja fiel às Escrituras.
- Linguagem simples e clara, como se estivesse ensinando uma congregação.
- Estrutura fácil de seguir e pregar.
- Se o versículo estiver presente, o conteúdo deve girar em torno dele. Se não estiver, crie um sermão coerente apenas com base no tema.

Gere o conteúdo completo agora.
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
