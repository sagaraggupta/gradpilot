# 🚀 GradPilot

> **The AI-Powered Student Command Center.** > Turn academic survival into a gamified, highly-optimized experience.

![React](https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB)
![Vite](https://img.shields.io/badge/vite-%23646CFF.svg?style=for-the-badge&logo=vite&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/tailwindcss-%2338B2AC.svg?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)
![Gemini](https://img.shields.io/badge/Google%20Gemini-8E75B2?style=for-the-badge&logo=google&logoColor=white)

GradPilot is a comprehensive, gamified academic dashboard designed to help students dominate their coursework. It combines advanced task management, a bulletproof Pomodoro focus timer, and a robust AI assistant that acts as a tutor, financial auditor, and productivity coach.

---

## ✨ Core Features

### 🧠 Edge-AI Study Assistant
* **Multi-Model Fallback:** Powered natively by **Google Gemini 1.5 Flash**, with a secure, automatic failover to **LLaMA 3.1 (via Groq)** to ensure 100% uptime.
* **Smart Actions:** Use slash commands like `/roast` (for harsh productivity checks), `/audit` (for budget pacing), and `/studyplan`.
* **Syllabus Parser:** Paste a massive syllabus and watch the AI extract assignments, due dates, and priorities directly into your Kanban board.
* **Unlockable Personas:** Spend earned XP to unlock custom AI personas like the *Socratic Tutor* or the *Strict Professor*.

### 🎮 Gamified Economy (The Streak Engine)
* **Pilot Rating:** A dynamic leaderboard system that rewards consistency over spam. 
* **Anti-Cheat Mechanics:** Features a strict 500 Daily XP cap, a 5% inactivity decay penalty for abandoned streaks, and purchasable Streak Freezes.
* **Offline Syncing:** Focus sessions completed offline are cached locally and automatically pushed to the cloud when connectivity returns.

### ⏱️ Advanced Focus Timer
* **Dynamic Modes:** Pomodoro, Short Break, Long Break, and Deep Work.
* **Zen Mode:** A distraction-free overlay featuring an **Auto-Converting Spotify Widget**—just paste a standard Spotify link and GradPilot instantly formats it into a dark-mode embed.
* **Ambient Sounds:** Built-in Lo-Fi and white noise generation.

---

## 🛠️ Tech Stack

**Frontend:**
* React 19 (via Vite)
* Tailwind CSS v4 + Framer Motion (Animations)
* Recharts (Analytics Data Visualization)
* React Router DOM (Navigation)
* Vite PWA (Progressive Web App support)

**Backend & Infrastructure:**
* Supabase PostgreSQL (Database & Row Level Security)
* Supabase Auth (Magic Links & OAuth)
* Supabase Deno Edge Functions (Secure API & AI routing)

---

## 🚀 Getting Started

### Prerequisites
Make sure you have Node.js and the Supabase CLI installed on your machine.

### 1. Clone the Repository
```bash
git clone [https://github.com/sagaraggupta/gradpilot](https://github.com/sagaraggupta/gradpilot)
cd gradpilot

2. Install Dependencies
Bash
npm install

3. Environment Variables
Create a .env file in the root directory and add your Supabase credentials:

Code snippet
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

4. Deploy Edge Functions
Ensure your AI API keys are stored securely in the Supabase Vault, then deploy the serverless functions:

Bash
npx supabase secrets set GEMINI_API_KEY=your_gemini_key
npx supabase secrets set GROQ_API_KEY=your_groq_key

npx supabase functions deploy ai-chat --no-verify-jwt
npx supabase functions deploy parse-syllabus --no-verify-jwt

5. Run the App
Bash
npm run dev

📂 Architecture Highlights
/src/lib/streakEngine.js: The heart of the game economy. Handles complex date-math, XP compounding, penalty decays, and daily caps safely.

/supabase/functions/: Holds our secure AI middleware. Uses Deno to prevent exposing API keys to the client while enforcing strict JSON schemas for data extraction.

📝 Roadmap & Known Issues
[ ] Resolve React state desync bugs in the Global Leaderboard UI.

[ ] Implement Push Notifications via Firebase Cloud Messaging.

[ ] Add WebRTC integration for "Squad" co-working sessions.


Built with ❤️ and excessive caffeine.

***

How does that look? It highlights all the complex engineering you've pulled off (the fallback AI, the offline sync, the game economy) in a way that sounds incredibly professional. 

Whenever you're ready to dive back into the code, let me know if we are hitting the Leaderboard next or something else!