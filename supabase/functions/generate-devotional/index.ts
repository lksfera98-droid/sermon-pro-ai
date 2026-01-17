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

    // Buscar devocionais anteriores globalmente para evitar repetição
    const { data: previousDevotionals } = await supabaseClient
      .from('devotionals')
      .select('content')
      .order('created_at', { ascending: false })
      .limit(10);

    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    if (!lovableApiKey) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    // Extrair versículos dos devocionais anteriores
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

    console.log('Calling Lovable AI for devotional generation...');
    
    let response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        stream: false,
      }),
    });

    let devotionalContent = "";
    
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
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
        }),
      });

      if (!openaiResponse.ok) {
        throw new Error(`OpenAI fallback error: ${openaiResponse.status}`);
      }

      const openaiData = await openaiResponse.json();
      devotionalContent = openaiData.choices[0].message.content;
      console.log("Using OpenAI fallback response");
    } else if (!response.ok) {
      const errorText = await response.text();
      console.error('Lovable AI error:', response.status, errorText);
      throw new Error(`AI service error: ${response.status}`);
    } else {
      const rawText = await response.text();
      console.log('Raw AI response:', rawText);

      let data;
      try {
        data = JSON.parse(rawText);
      } catch (parseError) {
        console.error('JSON parse error:', parseError, 'Raw text:', rawText);
        throw new Error('Failed to parse AI response');
      }

      devotionalContent = data.choices?.[0]?.message?.content;
      if (!devotionalContent) {
        throw new Error('No content in AI response');
      }
    }

    // Save devotional to database without user_id (anonymous)
    const { error: insertError } = await supabaseClient
      .from('devotionals')
      .insert({
        user_id: null,
        content: devotionalContent
      });

    if (insertError) {
      console.error('Error saving devotional:', insertError);
      // Continue even if save fails - return content to user
    } else {
      console.log('Devotional saved successfully');
    }

    console.log('Devotional generated successfully');

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