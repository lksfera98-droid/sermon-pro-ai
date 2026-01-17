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
    const { verseReference } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log("Generating Bible study for:", verseReference);

    const prompt = `Por favor, crie um estudo bíblico COMPLETO e PROFUNDO sobre o versículo: ${verseReference}

O estudo deve incluir:

1. **VERSÍCULO TRADUZIDO**: Traduza o versículo para o português de forma clara e precisa.

2. **CONTEXTO HISTÓRICO**: Explique quando e por quem foi escrito, qual era a situação histórica e cultural da época.

3. **CONTEXTO DO LIVRO**: Explique em que parte do livro este versículo se encontra e qual é o tema do capítulo.

4. **ANÁLISE TEOLÓGICA**: Explique o significado teológico profundo deste versículo. Quais verdades sobre Deus, sobre Jesus Cristo, sobre o ser humano e sobre a salvação estão reveladas aqui?

5. **INTERPRETAÇÃO**: O que este versículo realmente significa? Qual é a mensagem principal que Deus quer comunicar através dele?

6. **APLICAÇÃO PRÁTICA**: Como este versículo deve ser aplicado na vida cristã hoje? Dê exemplos práticos e concretos.

7. **CONEXÕES BÍBLICAS**: Mencione outros versículos relacionados que reforçam ou complementam este ensinamento.

8. **PALAVRA DE ENCORAJAMENTO**: Termine com uma palavra de fé, esperança e encorajamento baseada neste versículo.

Seja profundo, claro e espiritual. Use linguagem acessível mas teologicamente precisa.`;

    console.log("Generating Bible study with AI...");

    let aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "You are a biblical scholar and theologian providing deep, comprehensive Bible studies. Your studies should be thorough, theologically sound, and spiritually enriching. Always respond in Portuguese." },
          { role: "user", content: prompt }
        ],
        stream: false,
      }),
    });

    let study = "";
    
    // Check if Lovable AI failed with 402 or 429 - use OpenAI fallback
    if (!aiResponse.ok && (aiResponse.status === 402 || aiResponse.status === 429)) {
      console.log(`Lovable AI returned ${aiResponse.status}, using OpenAI fallback...`);
      
      const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
      if (!OPENAI_API_KEY) {
        return new Response(JSON.stringify({ error: aiResponse.status === 429 ? "Rate limits exceeded, please try again later." : "Payment required, please add funds to your Lovable AI workspace." }), {
          status: aiResponse.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
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
            { role: "system", content: "You are a biblical scholar and theologian providing deep, comprehensive Bible studies. Your studies should be thorough, theologically sound, and spiritually enriching. Always respond in Portuguese." },
            { role: "user", content: prompt }
          ],
        }),
      });

      if (!openaiResponse.ok) {
        throw new Error(`OpenAI fallback error: ${openaiResponse.status}`);
      }

      const openaiData = await openaiResponse.json();
      study = openaiData.choices[0].message.content;
      console.log("Using OpenAI fallback response");
    } else if (!aiResponse.ok) {
      throw new Error(`AI gateway error: ${aiResponse.status}`);
    } else {
      const raw = await aiResponse.text();
      try {
        const aiData = JSON.parse(raw);
        study = aiData.choices?.[0]?.message?.content ?? "";
      } catch (e) {
        console.error("Failed to parse AI JSON. Raw response:", raw);
        throw new Error("AI gateway returned invalid JSON");
      }
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