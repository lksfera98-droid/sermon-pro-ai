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
    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    if (!OPENAI_API_KEY) throw new Error("OPENAI_API_KEY is not configured");

    const prompt = `Por favor, crie um estudo bíblico COMPLETO e PROFUNDO sobre o versículo: ${verseReference}

O estudo deve incluir:

1. **VERSÍCULO TRADUZIDO**: Traduza o versículo para o português de forma clara e precisa.
2. **CONTEXTO HISTÓRICO**: Explique quando e por quem foi escrito, qual era a situação histórica e cultural da época.
3. **CONTEXTO DO LIVRO**: Explique em que parte do livro este versículo se encontra e qual é o tema do capítulo.
4. **ANÁLISE TEOLÓGICA**: Explique o significado teológico profundo deste versículo.
5. **INTERPRETAÇÃO**: O que este versículo realmente significa?
6. **APLICAÇÃO PRÁTICA**: Como aplicar na vida cristã hoje?
7. **CONEXÕES BÍBLICAS**: Outros versículos relacionados.
8. **PALAVRA DE ENCORAJAMENTO**: Termine com uma palavra de fé e esperança.

Seja profundo, claro e espiritual. Use linguagem acessível mas teologicamente precisa.`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "You are a biblical scholar and theologian providing deep, comprehensive Bible studies. Always respond in Portuguese." },
          { role: "user", content: prompt }
        ],
      }),
    });

    if (!response.ok) throw new Error(`OpenAI error: ${response.status}`);

    const data = await response.json();
    const study = data.choices[0].message.content;

    return new Response(
      JSON.stringify({ reference: verseReference, study }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in bible-study function:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
