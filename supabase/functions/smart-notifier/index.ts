import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import admin from "npm:firebase-admin@11.11.1";

// 1. Initialize Firebase
const serviceAccountStr = Deno.env.get('FIREBASE_SERVICE_ACCOUNT');
if (serviceAccountStr && !admin.apps.length) {
  const serviceAccount = JSON.parse(serviceAccountStr);
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
}

serve(async (req) => {
  try {
    // 🔒 SECURITY GATE: Prevent malicious internet users from triggering the notification bomb
    const authHeader = req.headers.get('Authorization');
    const expectedSecret = Deno.env.get('CRON_SECRET');
    
    if (!expectedSecret || authHeader !== `Bearer ${expectedSecret}`) {
      return new Response(JSON.stringify({ error: 'Unauthorized: Invalid Cron Secret' }), { status: 401 });
    }

    // Read the payload from the Cron Job to know WHAT time of day it is!
    const { type } = await req.json(); 

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // 2. Get all users who have notifications enabled
    const { data: profiles, error } = await supabaseAdmin
      .from('profiles')
      .select('id, push_subscription')
      .not('push_subscription', 'is', null);

    if (error) throw error;

    const messages: any[] = [];

    // 3. Loop through users and build PERSONALIZED messages
    for (const profile of profiles) {
      const token = profile.push_subscription;
      if (typeof token !== 'string' || token.length < 20) continue;

      let title = "";
      let body = "";

      // 🌅 MORNING LOGIC: Check their personal task count
      if (type === 'morning') {
        const { count } = await supabaseAdmin
          .from('tasks')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', profile.id)
          .eq('status', 'pending');

        if (count && count > 0) {
          title = "🌅 Morning, Pilot!";
          body = `You have ${count} assignments pending. Let's knock them out today!`;
        } else {
          title = "🌅 Good Morning!";
          body = "No pending assignments today! Take some time to focus on your habits.";
        }
      }

      // 🦉 EVENING "DUOLINGO" LOGIC
      else if (type === 'evening') {
        title = "🦉 Don't lose your streak!";
        body = "You haven't logged your habits today. Take 5 minutes to keep your streak alive!";
      }

      // Add to our missile launcher queue
      if (title && body) {
        messages.push({
          notification: { title, body },
          token: token
        });
      }
    }

    // 4. 🚀 SCALABILITY FIX: Fire personalized notifications in safe chunks of 500!
    if (messages.length > 0) {
      console.log(`Firing ${messages.length} ${type} personalized notifications...`);
      
      // Firebase sendEach accepts a maximum of 500 messages per batch
      const chunkSize = 500;
      for (let i = 0; i < messages.length; i += chunkSize) {
        const chunk = messages.slice(i, i + chunkSize);
        await admin.messaging().sendEach(chunk);
      }
    }

    return new Response(JSON.stringify({ success: true, sent: messages.length }), { status: 200 });

  } catch (error: any) {
    console.error("Smart Notifier Error:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
});