import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import admin from "npm:firebase-admin@11.11.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// 1. Initialize Firebase Admin safely
const serviceAccountStr = Deno.env.get('FIREBASE_SERVICE_ACCOUNT');
if (serviceAccountStr && !admin.apps.length) {
  const serviceAccount = JSON.parse(serviceAccountStr);
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

serve(async (req) => {
  // Handle CORS Preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders, status: 200 });
  }

  try {
    // 🔒 SECURITY GATE: Verify the user making this request!
    const authHeader = req.headers.get('Authorization');
    // Allow an override for secure Database Webhooks using a CRON_SECRET
    const webhookSecret = Deno.env.get('CRON_SECRET'); 
    
    let isAuthorized = false;

    if (authHeader) {
      if (webhookSecret && authHeader === `Bearer ${webhookSecret}`) {
        isAuthorized = true; // Authorized via backend secure webhook
      } else {
        // Verify via User JWT Token
        const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
        const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
        const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey);
        
        const token = authHeader.replace('Bearer ', '');
        const { data: { user }, error: authError } = await supabaseAuth.auth.getUser(token);
        if (!authError && user) isAuthorized = true; // Authorized via frontend user
      }
    }

    if (!isAuthorized) {
      return new Response(JSON.stringify({ error: 'Unauthorized: Access Denied' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // 🟢 Request is secure. Proceed to send push.
    const { user_id, title, body } = await req.json();

    if (!user_id || !title || !body) {
      throw new Error("Missing required fields: user_id, title, or body");
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // 2. Fetch the target user's FCM Token from the database
    const { data: profile, error } = await supabaseAdmin
      .from('profiles')
      .select('push_subscription')
      .eq('id', user_id)
      .single();

    if (error || !profile?.push_subscription) {
      throw new Error("Target user does not have a valid push subscription.");
    }

    const fcmToken = profile.push_subscription;

    if (typeof fcmToken !== 'string') {
      throw new Error("Database contains invalid push data.");
    }

    // 3. Package the payload for Firebase
    const message = {
      notification: { title, body },
      token: fcmToken,
    };

    // 4. Fire the missile via Google's servers!
    const response = await admin.messaging().send(message);

    return new Response(JSON.stringify({ success: true, message: "Firebase Push sent!", messageId: response }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error: any) {
    console.error("Function Error:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    });
  }
});