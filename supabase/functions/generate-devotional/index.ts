import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    console.log('📖 Gerando devocional...');

    const { data: previousDevotionals } = await supabaseClient
      .from('devotionals')
      .select('content')
      .order('created_at', { ascending: false })
      .limit(10);

    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY not configured');
    }

    const previousVerses = previousDevotionals?.map(dev => {
      const verseMatch = dev.content.match(/\*\*Versículo do Dia:\*\*.*?(?:\*\*|$)/s);
      return verseMatch ? verseMatch[0].substring(0, 150) : '';
    }).filter(v => v).slice(0, 5) || [];

    const systemPrompt = `Você é um assistente espiritual cristão. Gere um devocional diário inspirador e edificante seguindo esta estrutura:

**Título:** [Um título inspirador para o devocional]

**Versículo do Dia:** [Cite um versículo bíblico relevante com a referência]

**Reflexão:** [Uma reflexão profunda e prática sobre o versículo, conectando com a vida diária do leitor. 3-4 parágrafos]

**Aplicação Prática:** [Sugira formas concretas de aplicar o ensinamento no dia a dia]

**Oração:** [Uma oração curta e pessoal relacionada ao tema]

**Desafio do Dia:** [Um desafio prático para o leitor colocar em prática hoje]

Seja caloroso, encorajador e relevante para a vida moderna.${previousVerses.length > 0 ? `\n\nIMPORTANTE: NÃO use nenhum destes versículos que já foram usados recentemente:\n${previousVerses.join('\n')}\nEscolha um versículo DIFERENTE e um tema NOVO.` : ''}`;

    const userPrompt = 'Gere um devocional diário para hoje.';

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI error:', response.status, errorText);
      throw new Error(`OpenAI error: ${response.status}`);
    }

    const data = await response.json();
    const devotionalContent = data.choices?.[0]?.message?.content;
    if (!devotionalContent) throw new Error('No content in AI response');

    const { error: insertError } = await supabaseClient
      .from('devotionals')
      .insert({ user_id: null, content: devotionalContent });

    if (insertError) console.error('Error saving devotional:', insertError);

    return new Response(
      JSON.stringify({ content: devotionalContent }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in generate-devotional function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
