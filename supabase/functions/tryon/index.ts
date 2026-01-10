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

    // High-fidelity prompt calibrated for fitness virtual try-on (original calibrated prompt)
    const prompt = `
      CONTEXT: High-end virtual try-on for professional fitness e-commerce.
      
      TASK: Synthesize a photo of the person in IMAGE 1 wearing the EXACT garment from IMAGE 2.
      
      STRICT CONSTRAINTS:
      1. DESIGN FIDELITY: Transfer 100% of the colors, patterns, logos, and textures from IMAGE 2. Do not simplify or alter the pattern.
      2. ANATOMY: Keep the person's face, skin tone, hair, and body shape from IMAGE 1 identical.
      3. PHYSICS: Adapt the fabric to the person's pose, creating realistic compression wrinkles and highlights typical of sports fabrics (spandex/polyamide).
      4. CLEANLINESS: Seamlessly remove the old clothing. Edges where skin meets fabric must be photorealistic.
      
      OUTPUT: Return ONLY the raw base64 data of the resulting image. No markdown, no text.
    `;

    console.log("Calling Lovable AI for try-on synthesis...");

    const callWithRetry = async (retries = 3): Promise<Response> => {
      for (let attempt = 1; attempt <= retries; attempt++) {
        console.log(`Attempt ${attempt}/${retries}`);
        
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
          console.error(`Attempt ${attempt} error:`, response.status, errorText);
          
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
          
          // Retry on 500 errors
          if (response.status === 500 && attempt < retries) {
            const delay = attempt * 2000;
            console.log(`Waiting ${delay}ms before retry...`);
            await new Promise(r => setTimeout(r, delay));
            continue;
          }
          
          return new Response(
            JSON.stringify({ error: "Erro ao processar imagem com IA" }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const data = await response.json();
        console.log("Lovable AI response received");

        // Check for safety filter
        const finishReason = data.choices?.[0]?.native_finish_reason;
        if (finishReason === "IMAGE_SAFETY") {
          console.warn(`Attempt ${attempt} blocked by safety filter`);
          if (attempt < retries) {
            const delay = attempt * 2000;
            console.log(`Waiting ${delay}ms before retry...`);
            await new Promise(r => setTimeout(r, delay));
            continue;
          }
          return new Response(
            JSON.stringify({ error: "As imagens não puderam ser processadas. Tente com imagens diferentes." }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Extract the generated image from the response
        const generatedImage = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;

        if (generatedImage) {
          console.log("Successfully generated try-on image");
          return new Response(
            JSON.stringify({ resultImage: generatedImage }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        console.error("No image in response:", JSON.stringify(data));
        if (attempt < retries) {
          const delay = attempt * 2000;
          await new Promise(r => setTimeout(r, delay));
          continue;
        }
      }
      
      return new Response(
        JSON.stringify({ error: "Nenhuma imagem foi gerada pela IA após várias tentativas" }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    };

    return await callWithRetry(3);

  } catch (error) {
    console.error("Try-on service error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Erro inesperado" }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
