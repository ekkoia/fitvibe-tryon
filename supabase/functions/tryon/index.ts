import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { clientImage, clothingImage } = await req.json();

    if (!clientImage || !clothingImage) {
      return new Response(
        JSON.stringify({ error: "Imagens do cliente e da roupa são obrigatórias" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY is not configured");
      return new Response(
        JSON.stringify({ error: "Configuração de API faltando" }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Clean base64 strings (remove data:image/...;base64, prefix if present)
    const cleanBase64 = (str: string): string => {
      if (str.includes(',')) return str.split(',')[1];
      return str;
    };

    const clientData = cleanBase64(clientImage);
    const clothingData = cleanBase64(clothingImage);

    // High-fidelity prompt calibrated for fitness virtual try-on
    const prompt = `
      CONTEXT: High-end virtual try-on for professional fitness e-commerce.
      
      TASK: Synthesize a photo of the person in IMAGE 1 wearing the EXACT garment from IMAGE 2.
      
      STRICT CONSTRAINTS:
      1. DESIGN FIDELITY: Transfer 100% of the colors, patterns, logos, and textures from IMAGE 2. Do not simplify or alter the pattern.
      2. ANATOMY: Keep the person's face, skin tone, hair, and body shape from IMAGE 1 identical.
      3. PHYSICS: Adapt the fabric to the person's pose, creating realistic compression wrinkles and highlights typical of sports fabrics (spandex/polyamide).
      4. CLEANLINESS: Seamlessly remove the old clothing. Edges where skin meets fabric must be photorealistic.
      
      OUTPUT: Generate a single photorealistic image showing the person wearing the exact garment.
    `;

    console.log("Calling Lovable AI for try-on synthesis...");

    // Call Lovable AI Gateway with the image generation model
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-image-preview",
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: prompt },
              {
                type: "image_url",
                image_url: { url: `data:image/jpeg;base64,${clientData}` }
              },
              {
                type: "image_url",
                image_url: { url: `data:image/jpeg;base64,${clothingData}` }
              }
            ]
          }
        ],
        modalities: ["image", "text"]
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Lovable AI error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em alguns segundos." }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Créditos insuficientes. Adicione créditos ao seu workspace." }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      return new Response(
        JSON.stringify({ error: "Erro ao processar imagem com IA" }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    console.log("Lovable AI response received");

    // Extract the generated image from the response
    const generatedImage = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;

    if (!generatedImage) {
      console.error("No image in response:", JSON.stringify(data));
      return new Response(
        JSON.stringify({ error: "Nenhuma imagem foi gerada pela IA" }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ resultImage: generatedImage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error("Try-on service error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Erro inesperado" }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
