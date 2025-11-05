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
    const { language } = await req.json();
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

    // Generate inspirational message with AI
    const languagePrompts: Record<string, string> = {
      pt: `Gere uma mensagem de Deus para a pessoa baseada neste versículo:
"${verse}" - ${reference}
A mensagem deve transmitir fé, esperança, paz, confiança e força.
Seja breve, tocante e espiritual. Responda em português.`,
      en: `Generate a message from God to the person based on this verse:
"${verse}" - ${reference}
The message should convey faith, hope, peace, trust and strength.
Be brief, touching and spiritual. Respond in English.`,
      es: `Genera un mensaje de Dios para la persona basado en este versículo:
"${verse}" - ${reference}
El mensaje debe transmitir fe, esperanza, paz, confianza y fuerza.
Sé breve, conmovedor y espiritual. Responde en español.`
    };

    const prompt = languagePrompts[language] || languagePrompts.en;

    console.log("Generating AI message...");

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "You are a spiritual guide providing comforting and faith-inspiring messages." },
          { role: "user", content: prompt }
        ],
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

    const aiData = await aiResponse.json();
    const message = aiData.choices[0].message.content;

    console.log("AI message generated successfully");

    return new Response(
      JSON.stringify({
        verse,
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
