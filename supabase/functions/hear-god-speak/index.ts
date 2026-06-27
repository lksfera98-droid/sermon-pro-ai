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
    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    if (!OPENAI_API_KEY) throw new Error("OPENAI_API_KEY is not configured");

    const bibleResponse = await fetch("https://labs.bible.org/api/?passage=random&type=json");
    const bibleData = await bibleResponse.json();
    const verse = bibleData[0].text;
    const reference = `${bibleData[0].bookname} ${bibleData[0].chapter}:${bibleData[0].verse}`;

    const prompt = `Com base neste versículo bíblico:
"${verse}" - ${reference}

Por favor, faça duas coisas:
1. Traduza o versículo acima para o português (mantendo a referência ${reference})
2. Gere uma mensagem de Deus para a pessoa baseada neste versículo

A mensagem deve transmitir fé, esperança, paz, confiança e força.
Seja breve, tocante e espiritual.

Retorne no formato:
VERSÍCULO TRADUZIDO: [versículo em português]
---
MENSAGEM: [mensagem inspiradora em português]`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "You are a spiritual guide providing comforting and faith-inspiring messages. Always respond in Portuguese." },
          { role: "user", content: prompt }
        ],
      }),
    });

    if (!response.ok) throw new Error(`OpenAI error: ${response.status}`);

    const data = await response.json();
    const fullResponse = data.choices[0].message.content;

    let translatedVerse = verse;
    let message = fullResponse;

    if (fullResponse.includes('---')) {
      const parts = fullResponse.split('---');
      if (parts.length >= 2) {
        const verseMatch = parts[0].match(/VERSÍCULO TRADUZIDO:\s*(.+)/s);
        if (verseMatch) translatedVerse = verseMatch[1].trim();
        const messageMatch = parts[1].match(/MENSAGEM:\s*(.+)/s);
        if (messageMatch) message = messageMatch[1].trim();
      }
    }

    return new Response(
      JSON.stringify({ verse: translatedVerse, reference, message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in hear-god-speak function:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
