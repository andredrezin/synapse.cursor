import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function log(level: "INFO" | "WARN" | "ERROR" | "DEBUG", message: string, data?: any) {
  const timestamp = new Date().toISOString();
  console.log(JSON.stringify({ timestamp, level, function: "analyze-image", message, ...(data && { data }) }));
}

serve(async (req) => {
  const requestId = crypto.randomUUID().slice(0, 8);
  
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    log("INFO", `[${requestId}] Analyze image request received`);
    
    const { imageUrl, imageBase64, mimeType, context } = await req.json();
    
    if (!imageUrl && !imageBase64) {
      throw new Error('No image provided (imageUrl or imageBase64 required)');
    }

    const openaiKey = Deno.env.get('OPENAI_API_KEY');
    const geminiKey = Deno.env.get('GOOGLE_AI_API_KEY');

    if (!openaiKey && !geminiKey) {
      throw new Error('No Vision API key configured');
    }

    log("DEBUG", `[${requestId}] Processing image`, { 
      hasUrl: !!imageUrl, 
      hasBase64: !!imageBase64,
      mimeType 
    });

    let description: string;

    // Prefer OpenAI GPT-4o Vision, fallback to Gemini
    if (openaiKey) {
      description = await analyzeWithOpenAI(openaiKey, imageUrl, imageBase64, mimeType, context, requestId);
    } else if (geminiKey) {
      description = await analyzeWithGemini(geminiKey, imageUrl, imageBase64, mimeType, context, requestId);
    } else {
      throw new Error('No Vision API available');
    }

    log("INFO", `[${requestId}] Image analysis successful`, { descriptionLength: description.length });

    return new Response(
      JSON.stringify({ success: true, description }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    log("ERROR", `[${requestId}] Image analysis error`, { error: error.message });
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function analyzeWithOpenAI(
  apiKey: string, 
  imageUrl: string | null, 
  imageBase64: string | null,
  mimeType: string | null,
  context: string | null,
  requestId: string
): Promise<string> {
  log("DEBUG", `[${requestId}] Using OpenAI GPT-4o Vision`);

  const imageContent = imageUrl 
    ? { type: "image_url", image_url: { url: imageUrl } }
    : { type: "image_url", image_url: { url: `data:${mimeType || 'image/jpeg'};base64,${imageBase64}` } };

  const systemPrompt = `Você é um assistente de vendas analisando uma imagem enviada por um cliente.
Descreva o que você vê de forma clara e útil para o contexto de vendas.
Se for um produto, descreva características, condições, cores.
Se for um print de erro ou problema, descreva o problema.
Se for um comprovante, extraia informações relevantes.
Seja conciso mas completo.`;

  const userMessage = context 
    ? `Contexto da conversa: ${context}\n\nDescreva esta imagem:`
    : `Descreva esta imagem:`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { 
          role: 'user', 
          content: [
            { type: 'text', text: userMessage },
            imageContent
          ]
        }
      ],
      max_tokens: 500,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    log("ERROR", `[${requestId}] OpenAI Vision error`, { error });
    throw new Error(`OpenAI Vision API error: ${response.status}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

async function analyzeWithGemini(
  apiKey: string, 
  imageUrl: string | null, 
  imageBase64: string | null,
  mimeType: string | null,
  context: string | null,
  requestId: string
): Promise<string> {
  log("DEBUG", `[${requestId}] Using Gemini Vision`);

  // If we have a URL, we need to fetch and convert to base64
  let base64Data = imageBase64;
  let imageMimeType = mimeType || 'image/jpeg';

  if (imageUrl && !imageBase64) {
    const imgResponse = await fetch(imageUrl);
    const arrayBuffer = await imgResponse.arrayBuffer();
    base64Data = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
    imageMimeType = imgResponse.headers.get('content-type') || 'image/jpeg';
  }

  const prompt = context 
    ? `Contexto da conversa: ${context}\n\nDescreva esta imagem de forma útil para vendas:`
    : `Você é um assistente de vendas. Descreva esta imagem de forma clara e útil. Se for um produto, descreva características. Se for um print de erro, descreva o problema. Se for um comprovante, extraia informações.`;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: prompt },
            { 
              inline_data: { 
                mime_type: imageMimeType, 
                data: base64Data 
              } 
            }
          ]
        }],
        generationConfig: {
          maxOutputTokens: 500,
          temperature: 0.4,
        },
      }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    log("ERROR", `[${requestId}] Gemini Vision error`, { error });
    throw new Error(`Gemini Vision API error: ${response.status}`);
  }

  const data = await response.json();
  return data.candidates[0].content.parts[0].text;
}
