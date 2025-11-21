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
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing Authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { 
        global: { headers: { Authorization: authHeader } },
        auth: { persistSession: false }
      }
    );

    const token = authHeader.replace(/^Bearer\s+/i, '');
    console.log('🔐 Verificando autenticação...');
    console.log('Token recebido:', token ? 'Presente (primeiros 20 chars): ' + token.substring(0, 20) + '...' : 'AUSENTE');
    
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);
    
    if (userError) {
      console.error('❌ Erro ao verificar usuário:', userError);
      console.error('Detalhes do erro:', JSON.stringify(userError, null, 2));
    }
    
    if (!user) {
      console.error('❌ Usuário não encontrado apesar de token válido');
    }
    
    if (userError || !user) {
      console.error('Auth error:', userError);
      return new Response(JSON.stringify({ 
        error: 'User not authenticated',
        details: userError?.message || 'No user found'
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    console.log('✅ Usuário autenticado:', user.id);

    const { language = 'pt' } = await req.json();

    // Buscar devocionais anteriores do usuário para evitar repetição
    const { data: previousDevotionals } = await supabaseClient
      .from('devotionals')
      .select('content')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10);

    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    if (!lovableApiKey) {
      throw new Error('LOVABLE_API_KEY not configured');
    }


    // Extrair versículos dos devocionais anteriores
    const previousVerses = previousDevotionals?.map(dev => {
      const verseMatch = dev.content.match(/\*\*Versículo do Dia:\*\*.*?(?:\*\*|$)/s) || 
                        dev.content.match(/\*\*Verse of the Day:\*\*.*?(?:\*\*|$)/s) ||
                        dev.content.match(/\*\*Versículo del Día:\*\*.*?(?:\*\*|$)/s);
      return verseMatch ? verseMatch[0].substring(0, 150) : '';
    }).filter(v => v).slice(0, 5) || [];

    const avoidanceNote = previousVerses.length > 0 
      ? `\n\nIMPORTANTE: NÃO use nenhum destes versículos que já foram usados recentemente:\n${previousVerses.join('\n')}\nEscolha um versículo DIFERENTE e um tema NOVO.`
      : '';

    const prompts: Record<string, string> = {
      pt: `Você é um assistente espiritual cristão. Gere um devocional diário inspirador e edificante seguindo esta estrutura:

**Título:** [Um título inspirador para o devocional]

**Versículo do Dia:** [Cite um versículo bíblico relevante com a referência]

**Reflexão:** [Uma reflexão profunda e prática sobre o versículo, conectando com a vida diária do leitor. 3-4 parágrafos]

**Aplicação Prática:** [Sugira formas concretas de aplicar o ensinamento no dia a dia]

**Oração:** [Uma oração curta e pessoal relacionada ao tema]

**Desafio do Dia:** [Um desafio prático para o leitor colocar em prática hoje]

Seja caloroso, encorajador e relevante para a vida moderna.${previousVerses.length > 0 ? `\n\nIMPORTANTE: NÃO use nenhum destes versículos que já foram usados recentemente:\n${previousVerses.join('\n')}\nEscolha um versículo DIFERENTE e um tema NOVO.` : ''}`,
      en: `You are a Christian spiritual assistant. Generate an inspiring daily devotional following this structure:

**Title:** [An inspiring title for the devotional]

**Verse of the Day:** [Quote a relevant Bible verse with reference]

**Reflection:** [A deep and practical reflection on the verse, connecting with the reader's daily life. 3-4 paragraphs]

**Practical Application:** [Suggest concrete ways to apply the teaching in daily life]

**Prayer:** [A short, personal prayer related to the theme]

**Daily Challenge:** [A practical challenge for the reader to implement today]

Be warm, encouraging and relevant to modern life.${previousVerses.length > 0 ? `\n\nIMPORTANT: DO NOT use any of these verses that were recently used:\n${previousVerses.join('\n')}\nChoose a DIFFERENT verse and a NEW theme.` : ''}`,
      es: `Eres un asistente espiritual cristiano. Genera un devocional diario inspirador siguiendo esta estructura:

**Título:** [Un título inspirador para el devocional]

**Versículo del Día:** [Cita un versículo bíblico relevante con la referencia]

**Reflexión:** [Una reflexión profunda y práctica sobre el versículo, conectando con la vida diaria del lector. 3-4 párrafos]

**Aplicación Práctica:** [Sugiere formas concretas de aplicar la enseñanza en la vida diaria]

**Oración:** [Una oración corta y personal relacionada con el tema]

**Desafío del Día:** [Un desafío práctico para que el lector implemente hoy]

Sé cálido, alentador y relevante para la vida moderna.${previousVerses.length > 0 ? `\n\nIMPORTANTE: NO uses ninguno de estos versículos que ya fueron usados recientemente:\n${previousVerses.join('\n')}\nElige un versículo DIFERENTE y un tema NUEVO.` : ''}`
    };

    const systemPrompt = prompts[language] || prompts.pt;

    const userPrompts: Record<string, string> = {
      pt: 'Gere um devocional diário para hoje.',
      en: 'Generate a daily devotional for today.',
      es: 'Genera un devocional diario para hoy.'
    };

    const userPrompt = userPrompts[language] || userPrompts.pt;

    console.log('Language received:', language);
    console.log('Using system prompt for language:', language);
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

    // Save devotional to database
    const { error: insertError } = await supabaseClient
      .from('devotionals')
      .insert({
        user_id: user.id,
        content: devotionalContent
      });

    if (insertError) {
      console.error('Error saving devotional:', insertError);
      throw insertError;
    }

    console.log('Devotional generated and saved successfully');

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