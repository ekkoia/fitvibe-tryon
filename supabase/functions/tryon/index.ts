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

    const GOOGLE_API_KEY = Deno.env.get("GOOGLE_API_KEY");
    if (!GOOGLE_API_KEY) {
      console.error("GOOGLE_API_KEY is not configured");
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
    const synthesisPrompt = `
      CONTEXT: High-end virtual try-on for professional fitness e-commerce.
      
      TASK: Synthesize a photo of the person in IMAGE 1 wearing the EXACT garment from IMAGE 2.
      
      STRICT CONSTRAINTS:
      1. DESIGN FIDELITY: Transfer 100% of the colors, patterns, logos, and textures from IMAGE 2. Do not simplify or alter the pattern.
      2. ANATOMY: Keep the person's face, skin tone, hair, and body shape from IMAGE 1 identical.
      3. PHYSICS: Adapt the fabric to the person's pose, creating realistic compression wrinkles and highlights typical of sports fabrics (spandex/polyamide).
      4. CLEANLINESS: Seamlessly remove the old clothing. Edges where skin meets fabric must be photorealistic.
      
      OUTPUT: Return the synthesized image.
    `;

    // Prompt for generating dynamic description
    const descriptionPrompt = `
      Analyze this garment image and generate a SHORT, objective description (max 25 words) in Portuguese (Brazil) describing the virtual try-on result.
      
      Focus on:
      - The main colors of the garment
      - Any patterns, logos or textures transferred
      - How the fabric adapts to the body
      
      Format: Start with the main characteristic, mention the color precision, and end with a technical detail about the fit.
      Example: "O top esportivo azul royal foi transferido com precisão, preservando o logo e adaptando-se às curvas do corpo."
      
      OUTPUT: Return ONLY the description text in Portuguese. No quotes, no markdown.
    `;

    console.log("Calling Google Gemini for try-on synthesis...");

    const callWithRetry = async (retries = 3): Promise<Response> => {
      for (let attempt = 1; attempt <= retries; attempt++) {
        console.log(`Attempt ${attempt}/${retries}`);
        
        try {
          // Call Gemini API directly via REST - using gemini-2.5-flash-image for image generation
          const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-image-generation:generateContent?key=${GOOGLE_API_KEY}`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                contents: [
                  {
                    role: 'user',
                    parts: [
                      { text: synthesisPrompt },
                      {
                        inlineData: {
                          mimeType: 'image/jpeg',
                          data: clientData
                        }
                      },
                      {
                        inlineData: {
                          mimeType: 'image/jpeg',
                          data: clothingData
                        }
                      }
                    ]
                  }
                ],
                generationConfig: {
                  responseModalities: ['TEXT', 'IMAGE']
                }
              })
            }
          );

          if (!response.ok) {
            const errorText = await response.text();
            console.error(`Attempt ${attempt} error:`, response.status, errorText);
            
            if (response.status === 429) {
              return new Response(
                JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em alguns segundos." }),
                { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
              );
            }
            if (response.status === 403 || errorText.includes('QUOTA')) {
              return new Response(
                JSON.stringify({ error: "Quota da API excedida. Verifique sua conta Google AI." }),
                { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
              );
            }
            
            // Retry on 500 errors
            if (response.status >= 500 && attempt < retries) {
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
          console.log("Gemini response received");

          const responseSummary = {
            promptFeedback: data?.promptFeedback,
            candidatesCount: Array.isArray(data?.candidates) ? data.candidates.length : 0,
            candidate0FinishReason: data?.candidates?.[0]?.finishReason,
            candidate0PartKeys: Array.isArray(data?.candidates?.[0]?.content?.parts)
              ? data.candidates[0].content.parts.map((p: any) => Object.keys(p ?? {}))
              : null,
          };

          if (!data?.candidates?.length) {
            console.error("Gemini returned no candidates:", JSON.stringify(responseSummary));
          }

          // Check for blocked content
          if (data.promptFeedback?.blockReason) {
            console.warn(`Attempt ${attempt} blocked:`, data.promptFeedback.blockReason);
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

          // Extract generated image from response
          const parts = data.candidates?.[0]?.content?.parts;
          let generatedImageData: string | null = null;

          if (parts) {
            for (const part of parts) {
              const inline = (part?.inlineData ?? part?.inline_data) as
                | { mimeType?: string; mime_type?: string; data?: string }
                | undefined;
              const mimeType = inline?.mimeType ?? inline?.mime_type;

              if (mimeType?.startsWith('image/') && inline?.data) {
                generatedImageData = `data:${mimeType};base64,${inline.data}`;
                break;
              }
            }
          }

          if (generatedImageData) {
            console.log("Successfully generated try-on image, now generating description...");
            
            // Generate dynamic description based on the clothing image
            let description = "As estampas e cores foram transferidas com precisão cromática, adaptando-se às dobras e luz do corpo.";
            
            try {
              const descResponse = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GOOGLE_API_KEY}`,
                {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    contents: [
                      {
                        role: 'user',
                        parts: [
                          { text: descriptionPrompt },
                          {
                            inlineData: {
                              mimeType: 'image/jpeg',
                              data: clothingData
                            }
                          }
                        ]
                      }
                    ]
                  })
                }
              );
              
              if (descResponse.ok) {
                const descData = await descResponse.json();
                const generatedDesc = descData.candidates?.[0]?.content?.parts?.[0]?.text;
                if (generatedDesc && generatedDesc.trim().length > 10) {
                  description = generatedDesc.trim();
                  console.log("Generated description:", description);
                }
              }
            } catch (descError) {
              console.warn("Failed to generate description, using default:", descError);
            }
            
            return new Response(
              JSON.stringify({ resultImage: generatedImageData, description }),
              { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }

          console.error("No image in response.", JSON.stringify(responseSummary));
          if (attempt < retries) {
            const delay = attempt * 2000;
            await new Promise(r => setTimeout(r, delay));
            continue;
          }
        } catch (apiError) {
          console.error(`Attempt ${attempt} API error:`, apiError);
          
          if (attempt < retries) {
            const delay = attempt * 2000;
            console.log(`Waiting ${delay}ms before retry...`);
            await new Promise(r => setTimeout(r, delay));
            continue;
          }
          
          throw apiError;
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
