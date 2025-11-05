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
    const { verseReference, language } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log("Generating Bible study for:", verseReference);

    // Generate comprehensive Bible study with AI (AI will fetch the verse text itself)
    const languagePrompts: Record<string, string> = {
      pt: `Por favor, crie um estudo bíblico COMPLETO e PROFUNDO sobre o versículo: ${verseReference}

O estudo deve incluir:

1. **VERSÍCULO TRADUZIDO**: Traduza o versículo para o português de forma clara e precisa.

2. **CONTEXTO HISTÓRICO**: Explique quando e por quem foi escrito, qual era a situação histórica e cultural da época.

3. **CONTEXTO DO LIVRO**: Explique em que parte do livro este versículo se encontra e qual é o tema do capítulo.

4. **ANÁLISE TEOLÓGICA**: Explique o significado teológico profundo deste versículo. Quais verdades sobre Deus, sobre Jesus Cristo, sobre o ser humano e sobre a salvação estão reveladas aqui?

5. **INTERPRETAÇÃO**: O que este versículo realmente significa? Qual é a mensagem principal que Deus quer comunicar através dele?

6. **APLICAÇÃO PRÁTICA**: Como este versículo deve ser aplicado na vida cristã hoje? Dê exemplos práticos e concretos.

7. **CONEXÕES BÍBLICAS**: Mencione outros versículos relacionados que reforçam ou complementam este ensinamento.

8. **PALAVRA DE ENCORAJAMENTO**: Termine com uma palavra de fé, esperança e encorajamento baseada neste versículo.

Seja profundo, claro e espiritual. Use linguagem acessível mas teologicamente precisa.`,
      en: `Please create a COMPLETE and DEEP Bible study on the verse: ${verseReference}

The study should include:

1. **VERSE**: First, write the complete verse text in English.

2. **HISTORICAL CONTEXT**: Explain when and by whom it was written, what was the historical and cultural situation of that time.

3. **BOOK CONTEXT**: Explain where in the book this verse is located and what is the theme of the chapter.

4. **THEOLOGICAL ANALYSIS**: Explain the deep theological meaning of this verse. What truths about God, about Jesus Christ, about humanity and about salvation are revealed here?

5. **INTERPRETATION**: What does this verse really mean? What is the main message that God wants to communicate through it?

6. **PRACTICAL APPLICATION**: How should this verse be applied in Christian life today? Give practical and concrete examples.

7. **BIBLICAL CONNECTIONS**: Mention other related verses that reinforce or complement this teaching.

8. **WORD OF ENCOURAGEMENT**: End with a word of faith, hope and encouragement based on this verse.

Be deep, clear and spiritual. Use accessible but theologically accurate language.`,
      es: `Por favor, crea un estudio bíblico COMPLETO y PROFUNDO sobre el versículo: ${verseReference}

El estudio debe incluir:

1. **VERSÍCULO TRADUCIDO**: Primero, escribe el versículo completo traducido al español de forma clara y precisa.

2. **CONTEXTO HISTÓRICO**: Explica cuándo y por quién fue escrito, cuál era la situación histórica y cultural de la época.

3. **CONTEXTO DEL LIBRO**: Explica en qué parte del libro se encuentra este versículo y cuál es el tema del capítulo.

4. **ANÁLISIS TEOLÓGICO**: Explica el significado teológico profundo de este versículo. ¿Qué verdades sobre Dios, sobre Jesucristo, sobre el ser humano y sobre la salvación están reveladas aquí?

5. **INTERPRETACIÓN**: ¿Qué significa realmente este versículo? ¿Cuál es el mensaje principal que Dios quiere comunicar a través de él?

6. **APLICACIÓN PRÁCTICA**: ¿Cómo debe aplicarse este versículo en la vida cristiana hoy? Da ejemplos prácticos y concretos.

7. **CONEXIONES BÍBLICAS**: Menciona otros versículos relacionados que refuerzan o complementan esta enseñanza.

8. **PALABRA DE ALIENTO**: Termina con una palabra de fe, esperanza y aliento basada en este versículo.

Sé profundo, claro y espiritual. Usa lenguaje accesible pero teológicamente preciso.`
    };

    const prompt = languagePrompts[language] || languagePrompts.en;

    console.log("Generating Bible study with AI...");

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "You are a biblical scholar and theologian providing deep, comprehensive Bible studies. Your studies should be thorough, theologically sound, and spiritually enriching." },
          { role: "user", content: prompt }
        ],
        stream: false,
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limits exceeded, please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required, please add funds to your Lovable AI workspace." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI gateway error: ${aiResponse.status}`);
    }

    const raw = await aiResponse.text();
    let study = "";
    try {
      const aiData = JSON.parse(raw);
      study = aiData.choices?.[0]?.message?.content ?? "";
    } catch (e) {
      console.error("Failed to parse AI JSON. Raw response:", raw);
      throw new Error("AI gateway returned invalid JSON");
    }

    console.log("Bible study generated successfully");

    return new Response(
      JSON.stringify({
        reference: verseReference,
        study
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );

  } catch (error) {
    console.error("Error in bible-study function:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
