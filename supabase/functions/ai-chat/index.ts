import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { GoogleGenerativeAI } from "npm:@google/generative-ai"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS Preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 🔒 SECURITY GATE: Verify the user making this request is logged in!
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error("Missing Authorization header.");

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // Decode the token and get the user
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized: Access Denied' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // 🟢 User is authenticated! Proceed with AI Generation.
    const { prompt } = await req.json()
    
    // Pull both keys securely from the Supabase Vault
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
          model: "llama-3.1-8b-instant", // Your fallback model
          messages: [{ role: "user", content: prompt }]
        })
      });

      if (!groqResponse.ok) {
        throw new Error(`Groq API also failed: ${groqResponse.statusText}`);
      }

      const groqData = await groqResponse.json();
      reply = groqData.choices[0].message.content;
    }

    // Send the successful AI response back to React!
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