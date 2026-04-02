import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { GoogleGenerativeAI } from "npm:@google/generative-ai"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 🔒 SECURITY GATE: Verify Auth
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error("Missing Authorization header.");

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized: Access Denied' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { prompt } = await req.json()
    
    // 🛡️ COST CONTROL & SANITIZATION (Fix #2 & #5)
    if (!prompt || typeof prompt !== 'string') {
      return new Response(JSON.stringify({ error: 'Invalid prompt provided.' }), { status: 400, headers: corsHeaders });
    }
    if (prompt.length > 5000) {
      return new Response(JSON.stringify({ error: 'Prompt exceeds 5,000 character limit.' }), { status: 400, headers: corsHeaders });
    }
    
    // *Future Optimization: Insert rate limiting check against Supabase DB here*

    const geminiApiKey = Deno.env.get('GEMINI_API_KEY')
    const groqApiKey = Deno.env.get('GROQ_API_KEY')

    let reply = "";

    try {
      // 🚀 ATTEMPT 1: Google Gemini
      if (!geminiApiKey) throw new Error("Gemini key is missing.");
      
      const genAI = new GoogleGenerativeAI(geminiApiKey)
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })
      
      const result = await model.generateContent(prompt)
      reply = result.response.text()

    } catch (geminiError: any) {
      console.warn("Gemini failed, initiating Groq Fallback:", geminiError.message)
      
      // 🛡️ ATTEMPT 2: Groq Fallback (LLaMA 3.1)
      if (!groqApiKey) throw new Error("Both Gemini and Groq failed. No keys available.");

      const groqResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${groqApiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "llama-3.1-8b-instant",
          messages: [{ role: "user", content: prompt }]
        })
      });

      if (!groqResponse.ok) {
        throw new Error(`Groq API also failed: ${groqResponse.statusText}`);
      }

      const groqData = await groqResponse.json();
      reply = groqData.choices[0].message.content;
    }

    return new Response(
      JSON.stringify({ reply }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )

  } catch (error: any) {
    console.error("AI Core Error:", error.message)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})