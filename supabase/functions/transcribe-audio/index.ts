import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function log(level: "INFO" | "WARN" | "ERROR" | "DEBUG", message: string, data?: any) {
  const timestamp = new Date().toISOString();
  console.log(JSON.stringify({ timestamp, level, function: "transcribe-audio", message, ...(data && { data }) }));
}

// Process base64 in chunks to prevent memory issues
function processBase64Chunks(base64String: string, chunkSize = 32768): Uint8Array {
  const chunks: Uint8Array[] = [];
  let position = 0;
  
  while (position < base64String.length) {
    const chunk = base64String.slice(position, position + chunkSize);
    const binaryChunk = atob(chunk);
    const bytes = new Uint8Array(binaryChunk.length);
    
    for (let i = 0; i < binaryChunk.length; i++) {
      bytes[i] = binaryChunk.charCodeAt(i);
    }
    
    chunks.push(bytes);
    position += chunkSize;
  }

  const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;

  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.length;
  }

  return result;
}

serve(async (req) => {
  const requestId = crypto.randomUUID().slice(0, 8);
  
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    log("INFO", `[${requestId}] Transcribe audio request received`);
    
    const { audio, mimeType } = await req.json();
    
    if (!audio) {
      throw new Error('No audio data provided');
    }

    const openaiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiKey) {
      throw new Error('OpenAI API key not configured');
    }

    log("DEBUG", `[${requestId}] Processing audio`, { mimeType, audioLength: audio.length });

    // Process audio in chunks
    const binaryAudio = processBase64Chunks(audio);
    
    // Determine file extension based on mime type
    let extension = 'ogg';
    if (mimeType?.includes('mpeg') || mimeType?.includes('mp3')) {
      extension = 'mp3';
    } else if (mimeType?.includes('wav')) {
      extension = 'wav';
    } else if (mimeType?.includes('webm')) {
      extension = 'webm';
    } else if (mimeType?.includes('m4a')) {
      extension = 'm4a';
    }

    log("DEBUG", `[${requestId}] Audio format detected`, { extension, binarySize: binaryAudio.length });

    // Prepare form data
    const formData = new FormData();
    const audioBuffer = binaryAudio.buffer as ArrayBuffer;
    const blob = new Blob([audioBuffer], { type: mimeType || 'audio/ogg' });
    formData.append('file', blob, `audio.${extension}`);
    formData.append('model', 'whisper-1');
    formData.append('language', 'pt'); // Portuguese by default

    // Send to OpenAI Whisper
    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiKey}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      log("ERROR", `[${requestId}] OpenAI Whisper error`, { status: response.status, error: errorText });
      throw new Error(`Whisper API error: ${response.status}`);
    }

    const result = await response.json();
    log("INFO", `[${requestId}] Transcription successful`, { textLength: result.text?.length });

    return new Response(
      JSON.stringify({ success: true, text: result.text }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    log("ERROR", `[${requestId}] Transcription error`, { error: error.message });
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
