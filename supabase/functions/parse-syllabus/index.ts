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

    const { syllabusText } = await req.json()
    
    // 🛡️ COST CONTROL: Prevent massive syllabus uploads (Fix #2)
    if (!syllabusText || typeof syllabusText !== 'string') {
      return new Response(JSON.stringify({ error: 'Invalid syllabus text.' }), { status: 400, headers: corsHeaders });
    }
    if (syllabusText.length > 15000) {
      return new Response(JSON.stringify({ error: 'Syllabus exceeds 15,000 character limit. Please paste smaller sections.' }), { status: 400, headers: corsHeaders });
    }
    
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY')
    const groqApiKey = Deno.env.get('GROQ_API_KEY')
    
    // 🧠 PROMPT UPGRADE: Strict formatting & Date Normalization (Fix #4 & #5)
    const prompt = `
      Extract all assignments, exams, and readings from the following syllabus text.
      Return ONLY a pure JSON array of objects. NO explanations. NO markdown tags.
      Structure: [{"title": "Name", "subject": "General", "due": "YYYY-MM-DD", "priority": "High|Medium|Low"}]
      
      CRITICAL RULE: Convert all relative dates (e.g. "Next Monday", "Jan 12") into strict "YYYY-MM-DD" format using the current year.
      
      Syllabus Text:
      ${syllabusText}
    `

    let jsonString = "";

    try {
      if (!geminiApiKey) throw new Error("GEMINI_API_KEY is missing!")
      
      const genAI = new GoogleGenerativeAI(geminiApiKey)
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })
      
      const result = await model.generateContent(prompt)
      jsonString = result.response.text()

    } catch (geminiError: any) {
      console.warn("Gemini failed, initiating Groq Fallback:", geminiError.message)
      
      if (!groqApiKey) throw new Error("Both Gemini and Groq failed. No keys available.");

      // 🛡️ CRITICAL BUG FIX: Removed Markdown formatting from the Groq URL (Fix #1)
      const groqResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${groqApiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "llama-3.1-8b-instant",
          messages: [
            { role: "system", content: "You are a data extractor. You output ONLY valid JSON arrays. Do not wrap in markdown." },
            { role: "user", content: prompt }
          ],
          temperature: 0.1
        })
      });

      if (!groqResponse.ok) {
        throw new Error(`Groq API also failed: ${groqResponse.statusText}`);
      }

      const groqData = await groqResponse.json();
      jsonString = groqData.choices[0].message.content;
    }
    
    const jsonMatch = jsonString.match(/\[[\s\S]*\]/);
    if (!jsonMatch) throw new Error("AI did not return a valid JSON array.");

    // 🛡️ SCHEMA VALIDATION: Check that it parses safely before sending to React (Fix #3)
    let parsedData;
    try {
      parsedData = JSON.parse(jsonMatch[0]);
      if (!Array.isArray(parsedData)) throw new Error("Parsed data is not an array.");
      
      // Basic check: Filter out any items that lack a title or due date to prevent UI crashes
      parsedData = parsedData.filter(item => item.title && item.due);
    } catch (parseError) {
      throw new Error("Failed to parse AI output into valid JSON schema.");
    }

    return new Response(
      JSON.stringify(parsedData),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  } catch (error: any) {
    console.error("Parser Error:", error.message)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})