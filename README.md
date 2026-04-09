# 🚀 GradPilot

> **Your Personal Academic Command Center.** > GradPilot is a gamified, high-performance web application designed for students to track focus sessions, manage assignments, log attendance, and monitor daily expenses—all powered by an intelligent, context-aware AI notification engine.

![GradPilot Preview](https://via.placeholder.com/1000x500.png?text=GradPilot+Dashboard+Preview) *(Note: Replace this link with an actual screenshot of your app!)*

---

## ✨ Core Features

### ⏱️ The Focus Engine
* **Uninterruptible Timer:** Custom-built React timer that uses `Date.now()` to perfectly track time even when browsers heavily throttle background tabs.
* **Zen Mode & Spotify:** Distraction-free full-screen mode with automatic Spotify embed link conversion.
* **Offline-First Sync:** If the internet drops, sessions are saved locally to `localStorage` and automatically pushed to the cloud the moment the connection returns.

### 🔔 Context-Aware Smart Notifications (Dual-Layer)
GradPilot doesn't just spam; it checks your database first.
* **Layer 1 (Frontend):** An anti-spam React Hook that checks `habits` data and nudges the user via native OS notifications if they are falling behind after 5:00 PM.
* **Layer 2 (Backend CRON):** A Supabase Edge Function (`smart-notifier`) that runs on PostgreSQL triggers to send personalized Firebase Push Notifications to the user's phone when the app is closed:
  * **07:30 AM:** Morning Briefing (Highest priority task).
  * **02:30 PM:** Engine Check (Only triggers if 0 focus sessions logged).
  * **06:30 PM:** Evening Debrief (Expense logging reminder).
  * **09:30 PM:** Blackout Warning (Streak at risk alert).

### 🏆 Gamification & Progression
* **Pilot Score & Credits:** Earn credits for focusing and completing tasks.
* **Streaks & Freezes:** Maintain a daily focus streak. Buy "Streak Freezes" with credits to protect your rank.
* **Military Ranks:** Climb the Global Leaderboard from Cadet to Commander.
* **Daily Quests:** Auto-verifying quests (e.g., "Complete 2 Pomodoros") that grant bonus XP.

### 📊 Academic & Financial Tracking
* **Task Management:** Subject-based assignment tracking.
* **Expense Tracker:** Log daily spending against a configurable Monthly Budget.
* **Attendance Tracking:** Keep your academic attendance safely above the danger zone.

---

## 🛠️ Tech Stack

* **Frontend:** React.js, Vite, Tailwind CSS
* **Backend & Database:** Supabase (PostgreSQL, Row Level Security)
* **Authentication:** Supabase Auth
* **Serverless Compute:** Supabase Edge Functions (Deno), `pg_net` Cron Triggers
* **Push Notifications:** Firebase Cloud Messaging (FCM), Service Workers
* **Deployment:** Vercel (HTTPS Required for PWA/Service Workers)

---

## 🚀 Quick Start (Local Development)

### 1. Clone the repository
```bash
git clone https://github.com/yourusername/gradpilot.git
cd gradpilot
```

### 2. Install dependencies
```bash
npm install
```

### 3. Environment Variables
Create a `.env` file in the root directory and add your keys:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_FIREBASE_VAPID_KEY=your_firebase_vapid_key
```

### 4. Run the development server
```bash
npm run dev
```

> ⚠️ Note: To test Push Notifications locally, ensure you are accessing the app via `http://localhost:5173`, as browsers block Service Workers on network IPs

---

## ☁️ Backend Setup (Supabase)
> **Deploying the Notification Engine** > GradPilot uses a Supabase Edge Function to securely process background notifications.

### Install the Supabase CLI

### Login and link your project
```bash
supabase login
supabase link --project-ref your_project_ref
```

### Set your Edge Function secrets
```bash
supabase secrets set CRON_SECRET=your_secure_password
supabase secrets set FIREBASE_SERVICE_ACCOUNT='{ "type": "service_account", ... }'
```

### Deploy the function
```bash
supabase functions deploy smart-notifier
```

---

## 🔒 Security Posture

- **Row Level Security (RLS):**  
  All Supabase tables are locked down with strict RLS policies, ensuring users can only read/write their own `user_id` authenticated rows.

- **Edge Function Security:**  
  The `smart-notifier` function is protected by a strict `CRON_SECRET` Bearer token check, preventing unauthorized external triggers.

- **No Leaked Keys:**  
  The `SERVICE_ROLE_KEY` is completely isolated to backend Edge Functions and never exposed to the client.

---

## 👨‍💻 Built By

**[Sagar Gupta / sagaraggupta]**  
🎓 3nd Year Engineering Student  
🚀 Building tools to make students highly productive

---

## 📄 License

This project is licensed under the **MIT License**.  
See the `LICENSE.md` file for more information.

---

## 🎓 You're Ready to Go!

GradPilot showcases a powerful combination of frontend performance, backend automation, and thoughtful product design.

Deploy it, share it with others, and keep iterating.

🚀 Congratulations on building something impactful!

---