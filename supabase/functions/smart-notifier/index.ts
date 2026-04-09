import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import admin from "npm:firebase-admin@11.11.1";

// 1. Initialize Firebase
const serviceAccountStr = Deno.env.get('FIREBASE_SERVICE_ACCOUNT');
if (serviceAccountStr && !admin.apps.length) {
  const serviceAccount = JSON.parse(serviceAccountStr);
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
}

const MOTIVATION_QUOTES = [
  "Discipline equals freedom. Let's fly.",
  "An engineer doesn't guess, they calculate. Execute your plan.",
  "Small daily habits beat intense, rare sprints. Stay consistent.",
  "The hardest part is taking off. Start your first task."
];

serve(async (req) => {
  try {
    const authHeader = req.headers.get('Authorization');
    const expectedSecret = Deno.env.get('CRON_SECRET');
    
    if (!expectedSecret || authHeader !== `Bearer ${expectedSecret}`) {
      return new Response(JSON.stringify({ error: 'Unauthorized: Invalid Cron Secret' }), { status: 401 });
    }

    const { type } = await req.json(); 

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get all users with push enabled
    const { data: profiles, error } = await supabaseAdmin
      .from('profiles')
      .select('id, push_subscription, full_name, credits_balance')
      .not('push_subscription', 'is', null);

    if (error) throw error;

    const messages: any[] = [];
    const todayStr = new Date().toISOString().split('T')[0];
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    for (const profile of profiles) {
      const token = profile.push_subscription;
      if (typeof token !== 'string' || token.length < 20) continue;

      let title = "";
      let body = "";
      let url = "/dashboard";

      // 🌅 1. MORNING (7:00 AM) - The Command Briefing
      if (type === 'morning') {
        const { data: tasks } = await supabaseAdmin.from('tasks')
          .select('title').eq('user_id', profile.id).eq('status', 'pending').limit(1);

        const quote = MOTIVATION_QUOTES[Math.floor(Math.random() * MOTIVATION_QUOTES.length)];

        if (tasks && tasks.length > 0) {
          title = "🌅 Morning Briefing";
          body = `Priority 1: ${tasks[0].title}. ${quote}`;
          url = "/assignments";
        } else {
          title = "🌅 Sky is Clear!";
          body = `No pending tasks today. Use this time to build your Pilot Score. ${quote}`;
        }
      }

      // ☀️ 2. AFTERNOON (2:00 PM) - The Engine Check
      else if (type === 'afternoon') {
        const { data: session } = await supabaseAdmin.from('study_sessions')
          .select('id').eq('user_id', profile.id).gte('created_at', todayStart.toISOString()).limit(1);

        if (!session || session.length === 0) {
          title = "❄️ Engines are cold, Pilot";
          body = "You haven't logged a focus session yet today. A quick 25m sprint will keep your streak alive!";
          url = "/timer";
        }
      }

      // 🌇 3. EVENING (6:00 PM) - The Debriefing
      else if (type === 'evening') {
        const { data: expenses } = await supabaseAdmin.from('expenses')
          .select('id').eq('user_id', profile.id).eq('date', todayStr).limit(1);

        if (!expenses || expenses.length === 0) {
          title = "💰 Evening Debrief";
          body = "Closing out the day? Don't forget to log any expenses to keep your AI Coach accurate.";
          url = "/expenses";
        }
      }

      // 🌙 4. NIGHT (9:00 PM) - The Blackout Warning
      else if (type === 'night') {
        // Did they do ANYTHING today? (Check habits)
        const { data: habits } = await supabaseAdmin.from('habits')
          .select('id').eq('user_id', profile.id).eq('last_completed', todayStr).limit(1);

        if (!habits || habits.length === 0) {
          title = "⚠️ CRITICAL: Streak at Risk";
          body = "You are about to drop down the Global Leaderboard. Log in and complete one habit to secure your rank!";
          url = "/dashboard";
        }
      }

      if (title && body) {
        messages.push({
          notification: { title, body },
          data: { url }, // Pass the URL to the service worker!
          token: token
        });
      }
    }

    // Fire missiles in batches of 500
    if (messages.length > 0) {
      const chunkSize = 500;
      for (let i = 0; i < messages.length; i += chunkSize) {
        const chunk = messages.slice(i, i + chunkSize);
        await admin.messaging().sendEach(chunk);
      }
    }

    return new Response(JSON.stringify({ success: true, sent: messages.length }), { status: 200 });

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
});