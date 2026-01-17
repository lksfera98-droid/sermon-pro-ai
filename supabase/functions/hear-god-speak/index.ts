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
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log("Fetching random Bible verse...");
    
    // Fetch random Bible verse
    const bibleResponse = await fetch("https://labs.bible.org/api/?passage=random&type=json");
    const bibleData = await bibleResponse.json();
    
    const verse = bibleData[0].text;
    const reference = `${bibleData[0].bookname} ${bibleData[0].chapter}:${bibleData[0].verse}`;
    
    console.log("Verse fetched:", reference);

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

    console.log("Generating AI message...");

    let aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "You are a spiritual guide providing comforting and faith-inspiring messages. Always respond in Portuguese." },
          { role: "user", content: prompt }
        ],
      }),
    });

    let fullResponse = "";
    
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
            { role: "system", content: "You are a spiritual guide providing comforting and faith-inspiring messages. Always respond in Portuguese." },
            { role: "user", content: prompt }
          ],
        }),
      });

      if (!openaiResponse.ok) {
        throw new Error(`OpenAI fallback error: ${openaiResponse.status}`);
      }

      const openaiData = await openaiResponse.json();
      fullResponse = openaiData.choices[0].message.content;
      console.log("Using OpenAI fallback response");
    } else if (!aiResponse.ok) {
      throw new Error(`AI gateway error: ${aiResponse.status}`);
    } else {
      const aiData = await aiResponse.json();
      fullResponse = aiData.choices[0].message.content;
    }

    console.log("AI response generated successfully");

    // Parse the response to extract translated verse and message
    let translatedVerse = verse; // fallback to original
    let message = fullResponse;

    if (fullResponse.includes('---')) {
      const parts = fullResponse.split('---');
      if (parts.length >= 2) {
        const versePart = parts[0].trim();
        const messagePart = parts[1].trim();
        
        // Extract verse from "VERSÍCULO TRADUZIDO:"
        const verseMatch = versePart.match(/VERSÍCULO TRADUZIDO:\s*(.+)/s);
        if (verseMatch) {
          translatedVerse = verseMatch[1].trim();
        }
        
        // Extract message from "MENSAGEM:"
        const messageMatch = messagePart.match(/MENSAGEM:\s*(.+)/s);
        if (messageMatch) {
          message = messageMatch[1].trim();
        }
      }
    }

    return new Response(
      JSON.stringify({
        verse: translatedVerse,
        reference,
        message
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );

  } catch (error) {
    console.error("Error in hear-god-speak function:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});