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

    // Professional e-commerce prompt focused on product visualization
    const prompt = `You are a professional fashion visualization assistant for an e-commerce platform.

TASK: Create a product visualization showing how the athletic wear from the second image would look when worn by the person in the first image.

REQUIREMENTS:
1. PRODUCT ACCURACY: The athletic garment must match the exact design, colors, patterns and branding from the product image.
2. PROFESSIONAL RESULT: Create a clean, professional e-commerce style image suitable for online retail.
3. NATURAL FIT: Show the garment with natural fabric draping appropriate for athletic/fitness wear.
4. MAINTAIN IDENTITY: The person's face, hair, and overall appearance should remain unchanged.

This is for a legitimate fitness apparel e-commerce virtual try-on feature.

Generate a single professional product visualization image.`;

    // Models to try in order of preference
    const models = [
      "google/gemini-3-pro-image-preview",
      "google/gemini-2.5-flash-image-preview"
    ];

    let lastError: string | null = null;

    for (const model of models) {
      console.log(`Attempting try-on with model: ${model}`);

      try {
        const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: model,
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
          console.error(`Model ${model} error:`, response.status, errorText);
          
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
          
          lastError = `Model ${model} returned status ${response.status}`;
          continue;
        }

        const data = await response.json();
        console.log(`Model ${model} response received`);

        // Check for safety filter
        const finishReason = data.choices?.[0]?.native_finish_reason || data.choices?.[0]?.finish_reason;
        if (finishReason === "IMAGE_SAFETY") {
          console.warn(`Model ${model} blocked by safety filter`);
          lastError = "Filtro de segurança ativado";
          continue;
        }

        // Extract the generated image from the response
        const generatedImage = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;

        if (generatedImage) {
          console.log(`Successfully generated image with model: ${model}`);
          return new Response(
            JSON.stringify({ resultImage: generatedImage }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        console.warn(`Model ${model} returned no image:`, JSON.stringify(data));
        lastError = "Modelo não retornou imagem";
        
      } catch (modelError) {
        console.error(`Model ${model} exception:`, modelError);
        lastError = modelError instanceof Error ? modelError.message : "Erro ao chamar modelo";
      }
    }

    // All models failed
    console.error("All models failed. Last error:", lastError);
    return new Response(
      JSON.stringify({ 
        error: "Não foi possível gerar a visualização. Por favor, tente com imagens diferentes.",
        details: lastError 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error("Try-on service error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Erro inesperado" }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
